// lib/otp.ts
// إرسال والتحقق من رمز OTP عبر Twilio (هاتف) و Resend (بريد)

import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  // رمز عشوائي آمن من 6 أرقام
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function sendPhoneOtp(userId: string, phone: string) {
  const code = generateOtp();

  await prisma.otpCode.create({
    data: {
      userId,
      codeHash: hashOtp(code),
      channel: "phone",
      destination: phone,
      purpose: "verify",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await twilioClient.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `رمز التحقق الخاص بك في بوكس خاص هو: ${code} (صالح لمدة ${OTP_TTL_MINUTES} دقائق)`,
  });
}

export async function sendEmailVerification(userId: string, email: string) {
  const code = generateOtp();

  await prisma.otpCode.create({
    data: {
      userId,
      codeHash: hashOtp(code),
      channel: "email",
      destination: email,
      purpose: "verify",
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await resend.emails.send({
    from: "بوكس خاص <no-reply@boxkhas.com>",
    to: email,
    subject: "تأكيد بريدك الإلكتروني - بوكس خاص",
    html: `<p>رمز التحقق الخاص بك هو: <b>${code}</b></p><p>صالح لمدة ${OTP_TTL_MINUTES} دقائق.</p>`,
  });
}

/**
 * التحقق من صحة رمز OTP المُدخل من المستخدم
 */
export async function verifyOtp(userId: string, destination: string, inputCode: string) {
  const record = await prisma.otpCode.findFirst({
    where: {
      userId,
      destination,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { success: false, reason: "EXPIRED_OR_NOT_FOUND" };

  if (record.attempts >= MAX_ATTEMPTS) {
    return { success: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  const isValid = record.codeHash === hashOtp(inputCode);

  if (!isValid) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, reason: "INVALID_CODE" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  const field = record.channel === "phone" ? { isPhoneVerified: true } : { isEmailVerified: true };
  await prisma.user.update({ where: { id: userId }, data: field });

  return { success: true };
}

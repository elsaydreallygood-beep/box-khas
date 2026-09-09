// lib/s3-upload.ts
// توليد Presigned URLs للرفع/التحميل الآمن + تشفير AES-256 عند التخزين

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_BUCKET_NAME!;

const PRESIGNED_URL_TTL_SECONDS = 60 * 10; // 10 دقائق فقط

/**
 * توليد مفتاح تخزين فريد وآمن (لا يُخمَّن) لكل ملف
 */
export function generateStorageKey(userId: string, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePart = crypto.randomBytes(16).toString("hex");
  return `users/${userId}/${uniquePart}-${safeName}`;
}

/**
 * رابط مؤقت للرفع المباشر من المتصفح إلى S3
 * التشفير عند التخزين (SSE) يتم عبر AWS KMS (AES-256) — لا حاجة لتمرير الملف عبر السيرفر
 */
export async function getPresignedUploadUrl(storageKey: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ContentType: contentType,
    ServerSideEncryption: "aws:kms", // تشفير AES-256 عند التخزين (Encryption at Rest)
  });

  const url = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
  return { url, expiresIn: PRESIGNED_URL_TTL_SECONDS };
}

/**
 * رابط مؤقت للتحميل/المعاينة — لا يُكشَف مسار السيرفر الحقيقي أبداً
 */
export async function getPresignedDownloadUrl(storageKey: string, ttlSeconds = PRESIGNED_URL_TTL_SECONDS) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
  return getSignedUrl(s3, command, { expiresIn: ttlSeconds });
}

/**
 * توليد توكن عشوائي آمن لروابط المشاركة العامة (SharedLink.token)
 */
export function generateShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

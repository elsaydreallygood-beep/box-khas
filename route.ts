// app/api/upload/route.ts
// يُنشئ سجل الملف في قاعدة البيانات ويعيد presigned URL للرفع المباشر إلى S3

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { generateStorageKey, getPresignedUploadUrl } from "@/lib/s3-upload";

const prisma = new PrismaClient();

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().positive(),
  mimeType: z.string().min(1),
  folderId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { fileName, sizeBytes, mimeType, folderId } = parsed.data;

  // التحقق من المساحة المتبقية قبل السماح بالرفع
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const remaining = Number(user.storageQuotaBytes) - Number(user.storageUsedBytes);
  if (sizeBytes > remaining) {
    return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 413 });
  }

  const storageKey = generateStorageKey(userId, fileName);
  const { url, expiresIn } = await getPresignedUploadUrl(storageKey, mimeType);

  const file = await prisma.file.create({
    data: {
      name: fileName,
      sizeBytes,
      mimeType,
      storageKey,
      folderId,
      ownerId: userId,
      isEncrypted: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: { increment: sizeBytes } },
  });

  return NextResponse.json({
    fileId: file.id,
    uploadUrl: url, // رابط مؤقت فقط — لا يُكشف مسار S3 الحقيقي بشكل دائم
    expiresIn,
  });
}

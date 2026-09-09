# بوكس خاص (Box Khas) — خطة التنفيذ

موقع تخزين سحابي ومشاركة ملفات، تطوير: السيد رضا الامبابي ابو مرحه.

## 1) خطة التنفيذ خطوة بخطوة

1. **الإعداد الأولي**
   ```bash
   npx create-next-app@latest box-khas --typescript --tailwind --app
   cd box-khas
   npm install prisma @prisma/client next-auth @auth/prisma-adapter
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   npm install bcryptjs zod resend twilio
   npm install lucide-react
   npx prisma init
   ```

2. **قاعدة البيانات**: انسخ `prisma/schema.prisma` المرفق، ثم:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **متغيرات البيئة (`.env`)**:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/boxkhas
   NEXTAUTH_SECRET=***
   NEXTAUTH_URL=https://boxkhas.com
   GOOGLE_CLIENT_ID=***
   GOOGLE_CLIENT_SECRET=***
   RESEND_API_KEY=***
   TWILIO_ACCOUNT_SID=***
   TWILIO_AUTH_TOKEN=***
   TWILIO_PHONE_NUMBER=***
   AWS_ACCESS_KEY_ID=***
   AWS_SECRET_ACCESS_KEY=***
   AWS_REGION=***
   AWS_BUCKET_NAME=***
   FILE_ENCRYPTION_KEY=*** (32 bytes hex, لتشفير AES-256)
   ```

4. **المصادقة**: أضف `lib/auth.ts` إلى إعدادات NextAuth، واربطه بـ `app/api/auth/[...nextauth]/route.ts`.

5. **رفع الملفات**: استخدم `lib/s3-upload.ts` لتوليد presigned URLs، وربطها بمسار `app/api/upload/route.ts`.

6. **الواجهة**: استخدم `app/dashboard/page.tsx` كنقطة بداية للوحة التحكم.

7. **الأمان قبل النشر**:
   - فعّل HTTPS عبر شهادة SSL (Let's Encrypt أو عبر مزود الاستضافة مثل Vercel الذي يفعّلها تلقائياً).
   - أضف Middleware لإجبار HTTPS وإضافة رؤوس HSTS و CSP.
   - فعّل Rate Limiting عبر `@upstash/ratelimit` أو ما يعادلها على مستوى الـ API Routes.
   - اجعل الكوكيز `HttpOnly`, `Secure`, `SameSite=Strict` (NextAuth يفعل هذا افتراضياً في وضع الإنتاج).

8. **النشر**: على Vercel (لواجهة Next.js) + قاعدة بيانات مُدارة (Supabase/Neon/RDS) + S3 أو Supabase Storage.

## 2) بنية المشروع

```
box-khas/
├── prisma/
│   └── schema.prisma
├── lib/
│   ├── auth.ts          # إعداد NextAuth (Google + Email/Password)
│   ├── s3-upload.ts     # توليد presigned URLs + تشفير AES-256
│   └── otp.ts           # إرسال والتحقق من OTP عبر Twilio
├── app/
│   ├── api/
│   │   ├── otp/route.ts     # إرسال/التحقق من رمز الهاتف
│   │   └── upload/route.ts  # طلب presigned URL للرفع
│   └── dashboard/
│       └── page.tsx     # لوحة التحكم الرئيسية
└── middleware.ts         # فرض HTTPS + رؤوس الأمان
```

## 3) ملاحظات أمنية مهمة (لتنفذها بنفسك عند النشر الفعلي)

- لا تخزّن أبداً مفاتيح AWS أو مفاتيح التشفير في الكود؛ استخدم متغيرات البيئة أو خدمة Secrets Manager.
- استخدم كلمات مرور مُشفّرة بـ `bcrypt` (12+ rounds) فقط، ولا تخزّن كلمات مرور نصية أبداً.
- فعّل التحقق بخطوتين (2FA) اختيارياً للمستخدمين.
- راجع سياسات CORS على S3 Bucket بحيث تسمح فقط بنطاق موقعك.
- اجعل كل presigned URL صالحاً لمدة قصيرة (5–15 دقيقة) وقابلاً للاستخدام مرة واحدة عند الإمكان.

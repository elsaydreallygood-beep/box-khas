// app/dashboard/page.tsx
"use client";

import { useCallback, useState } from "react";
import {
  Search,
  Upload,
  FolderPlus,
  File as FileIcon,
  Image as ImageIcon,
  Video,
  FileText,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";

type Item = {
  id: string;
  name: string;
  kind: "folder" | "image" | "video" | "doc" | "file";
  sizeLabel?: string;
  updatedLabel: string;
};

const items: Item[] = [
  { id: "1", name: "مستندات العمل", kind: "folder", updatedLabel: "قبل يومين" },
  { id: "2", name: "صور الرحلة", kind: "folder", updatedLabel: "الأسبوع الماضي" },
  { id: "3", name: "عرض_تقديمي.pdf", kind: "doc", sizeLabel: "4.2 MB", updatedLabel: "اليوم، 10:42 ص" },
  { id: "4", name: "افتتاحية.mp4", kind: "video", sizeLabel: "128 MB", updatedLabel: "أمس" },
  { id: "5", name: "غلاف_المشروع.png", kind: "image", sizeLabel: "2.1 MB", updatedLabel: "أمس" },
];

const iconFor: Record<Item["kind"], React.ReactNode> = {
  folder: <FolderPlus className="h-5 w-5" strokeWidth={1.75} />,
  image: <ImageIcon className="h-5 w-5" strokeWidth={1.75} />,
  video: <Video className="h-5 w-5" strokeWidth={1.75} />,
  doc: <FileText className="h-5 w-5" strokeWidth={1.75} />,
  file: <FileIcon className="h-5 w-5" strokeWidth={1.75} />,
};

export default function DashboardPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [usedGB] = useState(3.4);
  const [quotaGB] = useState(5);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // يُستدعى هنا: طلب presigned URL من /api/upload لكل ملف في e.dataTransfer.files
  }, []);

  const usedPct = Math.min(100, Math.round((usedGB / quotaGB) * 100));

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F6F3] text-[#1C1B1A]">
      <div className="flex">
        {/* الشريط الجانبي */}
        <aside className="hidden w-64 shrink-0 border-l border-[#E7E4DD] bg-white px-5 py-6 md:block">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F3A34] text-white">
              <span className="text-sm font-semibold">بخ</span>
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight">بوكس خاص</p>
              <p className="text-[11px] leading-tight text-[#8A8579]">تخزين سحابي آمن</p>
            </div>
          </div>

          <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F3A34] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#16302A]">
            <Upload className="h-4 w-4" strokeWidth={2} />
            رفع ملف
          </button>

          <nav className="space-y-1 text-sm">
            {[
              { label: "كل الملفات", active: true },
              { label: "الصور" },
              { label: "الفيديوهات" },
              { label: "المستندات" },
              { label: "المشاركة معي" },
              { label: "سلة المحذوفات" },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`block rounded-lg px-3 py-2 transition ${
                  item.active
                    ? "bg-[#EEF3F1] font-medium text-[#1F3A34]"
                    : "text-[#5B564D] hover:bg-[#F2F0EA]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-[#E7E4DD] p-4">
            <p className="mb-2 text-xs text-[#8A8579]">
              {usedGB} جيجابايت من {quotaGB} جيجابايت
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFEDE7]">
              <div
                className="h-full rounded-full bg-[#1F3A34]"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 px-5 py-6 md:px-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8579]" />
              <input
                type="text"
                placeholder="ابحث في ملفاتك"
                className="w-full rounded-xl border border-[#E7E4DD] bg-white py-2.5 pr-9 pl-3 text-sm outline-none placeholder:text-[#B2AC9E] focus:border-[#1F3A34]"
              />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-[#E7E4DD] bg-white px-4 py-2 text-sm text-[#5B564D] hover:bg-[#F2F0EA] md:hidden">
              <Upload className="h-4 w-4" /> رفع ملف
            </button>
          </div>

          {/* منطقة السحب والإفلات */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`mb-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? "border-[#1F3A34] bg-[#EEF3F1]"
                : "border-[#DEDACF] bg-white"
            }`}
          >
            <Upload className="mb-3 h-6 w-6 text-[#8A8579]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[#1C1B1A]">
              اسحب الملفات هنا وأفلتها، أو اضغط للاختيار
            </p>
            <p className="mt-1 text-xs text-[#8A8579]">
              يدعم الصور، الفيديوهات، والمستندات — تشفير تلقائي عند الرفع
            </p>
          </div>

          {/* قائمة الملفات */}
          <div className="overflow-hidden rounded-2xl border border-[#E7E4DD] bg-white">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-[#E7E4DD] px-5 py-3 text-xs text-[#8A8579]">
              <span>الاسم</span>
              <span className="hidden sm:block">الحجم</span>
              <span className="hidden sm:block">آخر تعديل</span>
              <span></span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-[#F2F0EA] px-5 py-3 text-sm last:border-b-0 hover:bg-[#FAFAF7]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2F0EA] text-[#5B564D]">
                    {iconFor[item.kind]}
                  </span>
                  <span className="font-medium text-[#1C1B1A]">{item.name}</span>
                </div>
                <span className="hidden text-[#8A8579] sm:block">{item.sizeLabel ?? "—"}</span>
                <span className="hidden text-[#8A8579] sm:block">{item.updatedLabel}</span>
                <div className="flex items-center gap-1 text-[#8A8579]">
                  <button className="rounded-lg p-1.5 hover:bg-[#F2F0EA]" title="مشاركة">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-1.5 hover:bg-[#F2F0EA]" title="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-1.5 hover:bg-[#F2F0EA]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-[#B2AC9E]">
            بوكس خاص — تطوير السيد رضا الامبابي ابو مرحه
          </p>
        </main>
      </div>
    </div>
  );
}

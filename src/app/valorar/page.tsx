import { ReviewFormComponent } from "@/components/review-form";
import Link from "next/link";

export default function ValorarPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Volver al inicio
        </Link>
        <ReviewFormComponent />
      </div>
    </main>
  );
}

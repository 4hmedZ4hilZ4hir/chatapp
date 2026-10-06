import RedirectIfAuthed from "@/components/layout/RedirectIfAuthed";
import AuthDraftProvider from "@/providers/AuthDraftProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RedirectIfAuthed>
      <AuthDraftProvider>
        <div className="grid min-h-dvh place-items-center bg-white px-4 py-8">{children}</div>
      </AuthDraftProvider>
    </RedirectIfAuthed>
  );
}

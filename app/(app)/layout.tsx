import RequireAuth from "@/components/layout/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import ChatProvider from "@/providers/ChatProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ChatProvider>
        <AppShell>{children}</AppShell>
      </ChatProvider>
    </RequireAuth>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-6 text-center">
      <div className="space-y-4">
        <p className="text-2xl leading-8 sm:text-[28px] sm:leading-9">Page not found</p>
        <p className="text-base text-mute">The page you're looking for doesn't exist.</p>
        <Link href="/chats" className="inline-block rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-black/85">Back to chats</Link>
      </div>
    </div>
  );
}

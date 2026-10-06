# Chat App UI (Next.js App Router + Tailwind + Framer Motion)

1. `cp .env.local.example .env.local` and fill in the Reverb values
2. `npm install`
3. `npm run dev` -> http://localhost:3000

## Routes

| URL | File | Notes |
| --- | --- | --- |
| `/` | `app/page.tsx` | `redirect("/chats")` |
| `/login` | `app/(auth)/login/page.tsx` | route group `(auth)` + shared `layout.tsx` |
| `/register` | `app/(auth)/register/page.tsx` | same form component, `mode="register"` |
| `/chats` | `app/(app)/chats/page.tsx` | "select a conversation" screen |
| `/chats/[conversationId]` | `app/(app)/chats/[conversationId]/page.tsx` | **dynamic route**, plus `loading.tsx`, `error.tsx`, `not-found.tsx` |
| anything else | `app/not-found.tsx` | global 404 |

## Structure

```
app/
  layout.tsx                 root layout (font, metadata template, <AuthProvider>)
  page.tsx                   "/" -> redirect
  not-found.tsx
  (auth)/                    route group: no "/auth" in the URL
    layout.tsx               redirects logged-in users to /chats
    login/page.tsx
    register/page.tsx
  (app)/                     route group: everything that needs a session
    layout.tsx               <RequireAuth><ChatProvider><AppShell>
    chats/
      page.tsx
      [conversationId]/      dynamic segment
        page.tsx  loading.tsx  error.tsx  not-found.tsx
components/
  auth/ sidebar/ profile/ notifications/ layout/ ui/
  chat/
    Chat.tsx                 one open conversation: owns the messages + realtime + actions
    ChatHeader.tsx           title, online / typing text, Deleted + Members buttons
    PinnedBar.tsx            the pinned-message bar under the header
    MessageList.tsx          scroll area, maps messages -> <MessageItem>
    MessageItem.tsx          one message bubble + its buttons (like, reply, edit...)
    Attachment.tsx           image / file inside a message
    Composer.tsx             text box, @mentions, "typing" signal, attach, send
    ReactionsModal.tsx       "who reacted" popup
    useTrash.ts              the "Deleted messages" list (state + restore / purge)
    Members.tsx Deleted.tsx Confirm.tsx Lightbox.tsx ...   popups (unchanged)
providers/
  AuthProvider.tsx           session (me, ready, logout) - root layout
  AuthDraftProvider.tsx      keeps typed values when switching login <-> register
  ChatProvider.tsx           plugs the pieces below together and gives them to useChat()
  chat/
    useConversations.ts      list of conversations, members, bump / drop
    useNotifications.ts      bell list + toasts
    useRealtime.ts           websocket (Echo): connect + listen to every chat
    usePresence.ts           who is online
    useReceipts.ts           read ticks
    useNames.ts              names of direct chats
    useProfiles.ts           newest profile info / avatars of other people
    useUserInfoSync.ts       fills in missing avatars / partners in the background
    useSidebarState.ts       pins, nicknames, mobile drawer, rename, delete
    buildView.ts             mixes all of the above into the list the sidebar shows
lib/                         api client, Echo, validation, messages.ts (message helpers)
```

## How it fits together

* The old single `app/page.tsx` was split: session logic -> `AuthProvider`, chat state -> `ChatProvider`,
  screen frame -> `AppShell`, and the "which conversation is open" state became the URL (`/chats/[conversationId]`).
* `ChatProvider` is mounted in `app/(app)/layout.tsx`, so the sidebar, websocket connection and
  notifications stay alive while you navigate between chats.
* The API token lives in `localStorage` (the Laravel backend uses bearer tokens), so route protection is done
  by client guards (`RequireAuth`, `RedirectIfAuthed`) instead of `middleware.ts`, which can't read localStorage.
* `ChatProvider` used to be one 370-line file and `Chat.tsx` one 560-line file. They were split by *job*, so each
  file does one thing. What the screen shows and what is sent to the server did not change.
* A `use...` function in `providers/chat/` is a normal function that calls `useState` / `useEffect` (like
  `usePeople` in `lib/people.ts`). `ChatProvider` calls them one after another.

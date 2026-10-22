<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Data lives only in browser localStorage via `src/services/storage.ts`; UI reads it through `src/hooks/use-study-data.ts` (no backend in this phase, by product requirement).
- Domain types in `src/models`, pure business rules in `src/lib/study-rules.ts` (tested in `src/test`), screens in `src/routes`, reusable UI in `src/components`.
- App shell (sidebar desktop / bottom tabs mobile) wraps `<Outlet />` in `__root.tsx`.

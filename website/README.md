# @automovie/website

The public site at [samchon.github.io/automovie](https://samchon.github.io/automovie/). It is an empty placeholder page while the showcase productions move to the [automovie-examples](https://github.com/samchon/automovie-examples) repository.

## Commands

```bash
pnpm --filter @automovie/website dev      # Vite at http://127.0.0.1:5174/
pnpm --filter @automovie/website build    # type-check, then Vite into dist/
pnpm --filter @automovie/website preview  # serve dist/ at http://127.0.0.1:4174/
pnpm --filter @automovie/website deploy   # build, then publish dist/ to gh-pages
```

`.github/workflows/website.yml` builds pull requests that touch the site and deploys `dist/` from `master`. Pages serves the site under a case-sensitive repository path, so `vite.config.ts` uses a relative `base`.

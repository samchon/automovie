# Human development viewer

This unpublished application reviews Human construction, skin, appearance and motion. The published Human library contains no UI, Vite, Three or browser-process dependency. `@automovie/viewer` supplies generic rendering; this application's `src/three` adapters bind Human state to that renderer.

From the repository root:

```bash
pnpm --filter @automovie/human dev
```

Open `http://127.0.0.1:5196/human.html`. The page remains empty until an alias or explicit input is selected. `human-stickman.html` reviews the generated skeleton and mannequin. The default typed-example registry is `human-images.json`; `AUTOMOVIE_HUMAN_IMAGE_REGISTRY` can select another explicit registry with the same source mappings.

Vite uses `@ttsc/unplugin` for the generated runtime parameter assertion. Its transform project contains that assertion and its type dependencies, while a companion native `ttsc --watch` checks the entire application and generated figure's imports with all project lint and type rules. Keeping the full checker separate avoids rerunning lint in the browser module loader. Its current cycle appears in the page's compile panel and `/__human/compiler`. Closing the server asks the original compiler owner to stop through IPC and joins its exit. `pnpm --filter @automovie/human dev:check` performs the same complete check once; `dev:build` checks and bundles the development pages.

Generation and current capture require a passing full-check verdict. Admission asks the original native watch owner to settle pending filesystem edits, drains the corresponding completed-build markers, and compares source hashes across that barrier. Browser generation and the HTTP capture routes check before and after their work. Checking, failed, disconnected and closed checkers reject new work; the last green label alone grants no admission.

The detailed page retains named and free cameras, surface/overlay/construction passes, curve picking and glob selection, isolation, selection framing, appearance/clay materials, raking lighting, pose controls and PNG/curve-diagram capture. It shares the generated model and scene with the capture worker.

| Review output | Endpoint |
| --- | --- |
| Current PNG | `/human-images/f1/whole-front.surface.png?fresh=<unique-nonce>` |
| Curve diagram | `/human-curves/f1.png?fresh=<unique-nonce>&curves=arm.left*` |
| Original capture receipt | The PNG response's `x-human-archive-url` with `?receipt=1` |
| Current compiler verdict | `/__human/compiler` |

A new frame requires `x-human-cache: new-requested-frame`. Keep its UTC timestamp, source/input commitments, SHA-256 and original receipt; hash the returned PNG bytes independently. Hardware renderer metadata belongs to the captured frame, not server readiness. Concurrent source edits invalidate a capture round and must be coordinated with the campaign owner.

The capture session generates lazily and serializes its own work. Coordinate separate CPU audits and browser sessions across the shared machine: at most two people may generate simultaneously. Stop only task-owned processes. Historical evidence and private reference inputs remain in their existing ignored directories.

Human package `files` and `exports` exclude this entire directory. Runtime source must never import it. Playground's ordinary parameter editor owns end-user editing and uses the public generator and generic model renderer; development diagnostics stay here.

## Browser automation

The checkout's `.codex/config.toml` registers the pinned `@playwright/mcp` development dependency. Its executable path is local machine configuration. In a trusted checkout, install dependencies with `pnpm install`, set `--executable-path` to your installed Chrome, restart the MCP connection in Codex settings, and check `/mcp` for `playwright`. It opens isolated headless Chrome without sharing your browser profile; automatic captures go to `.cache/playwright-mcp`.

Use `browser_navigate` with the current viewer URL, then inspect controls and captures through the MCP tools. Close the owned browser with `browser_close` when the inspection ends. A configured server or an advancing playback clock does not establish a visual motion review.

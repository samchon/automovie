# Human development viewer

This unpublished application reviews Human construction, skin, appearance and motion. The published Human library contains no UI, Vite, Three or browser-process dependency. `@automovie/viewer` supplies generic rendering; this application's `src/three` adapters bind Human state to that renderer.

From the repository root:

```bash
pnpm --filter @automovie/human dev
```

Open `http://127.0.0.1:5196/human.html`. The page remains empty until an alias or explicit input is selected. `human-stickman.html` reviews the generated skeleton and mannequin. The default typed-example registry is `human-images.json`; `AUTOMOVIE_HUMAN_IMAGE_REGISTRY` can select another explicit registry with the same source mappings.

Vite uses `@ttsc/unplugin` for the generated runtime parameter assertion. Its transform project contains that assertion and its type dependencies, and the adapter runs with `compilerOptions: { noCheck: true }`, so it emits that module whatever its type state. Every other module is stripped of types by Vite. A type or lint error anywhere therefore never stops the server delivering pages, generating a person or capturing a frame.

Compile errors are reported, never enforced. The server starts a companion native `ttsc --watch` that checks the entire application and generated figure's imports with all project lint and type rules; its current cycle appears in the page's compile panel and `/__human/compiler`. Closing the server asks that compiler owner to stop through IPC and joins its exit. `pnpm --filter @automovie/human dev:watch` runs the same check as its own long-running process, and `dev:check` runs it once; `dev:build` checks and bundles the development pages.

Generation and capture proceed whatever the check state. Each one hashes the current source inventory before and after its work and fails with `Human source changed ...` (HTTP 503, retry) when the two differ. A PNG response carries that hash as `x-human-source-sha256`, beside `x-human-identity`, the model key that hashes the source with the input, so every frame names the source it reflects. A frame captured while the source has compile errors is still a frame of that source; the check verdict is read separately.

The detailed page retains named and free cameras, surface/overlay/construction passes, curve picking and glob selection, isolation, selection framing, appearance/clay materials, raking lighting, pose controls and PNG/curve-diagram capture. It shares the generated model and scene with the capture worker.

`human-components.html` inspects an explicitly supplied JSON document with `parts` and optional `provenance`. Each part declares its original vertices, triangle indices, optional original normals, generating curves and either body-millimetre coordinates or a local-millimetre frame. Selection, the three structural passes and PNG export operate on that supplied geometry without generating a person. The page records input and PNG hashes separately from the producer's supplied provenance; it does not certify anatomical correctness or that the supplied document came from the current generator.

| Review output | Endpoint |
| --- | --- |
| Current PNG | `/human-images/f1/whole-front.surface.png?fresh=<unique-nonce>` |
| Curve diagram | `/human-curves/f1.png?fresh=<unique-nonce>&curves=arm.left*` |
| Original capture receipt | The PNG response's `x-human-archive-url` with `?receipt=1` |
| Current compiler verdict (advisory) | `/__human/compiler` |
| Current source hash | `/__human/compiler/source` |

A new frame requires `x-human-cache: new-requested-frame`. Keep its UTC timestamp, `x-human-source-sha256`, source/input commitments, SHA-256 and original receipt; hash the returned PNG bytes independently. Hardware renderer metadata belongs to the captured frame, not server readiness. Concurrent source edits invalidate a capture round and must be coordinated with the campaign owner.

The capture session generates lazily and serializes its own work. Coordinate separate CPU audits and browser sessions across the shared machine: at most two people may generate simultaneously. Stop only task-owned processes. Historical evidence and private reference inputs remain in their existing ignored directories.

Human package `files` and `exports` exclude this entire directory. Runtime source must never import it. Playground's ordinary parameter editor owns end-user editing and uses the public generator and generic model renderer; development diagnostics stay here.

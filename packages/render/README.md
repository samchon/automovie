# @automovie/render

Plans how AutoMovie output becomes frames and video, deterministically: frame schedules, file names, sequence timelines with trims and transitions, encoder arguments, capture and encode orchestration, captions and screenplay text, and a render-budget preflight a job checks before it draws.

The browser-safe entry accepts capture and encode adapters. The Node entry also owns a ready-to-use browser capture and FFmpeg export runner. Both use the same deterministic frame schedule; captured pixels depend on the supplied viewer.

## Use

```bash
npm install @automovie/render
```

| Entry | Purpose |
| --- | --- |
| `@automovie/render` | Frame and sequence planning (`planSequenceRender`, `frameTimes`, `ffmpegArgs`), adapter-driven rendering (`renderVideo`, `renderSequenceVideo`), and the render-budget preflight (`assessAutoMovieRenderBudget`); safe in a browser bundle |
| `@automovie/render/node` | `renderViewerVideo` exports a running Viewer through its completed seek hook and an installed FFmpeg executable; also provides model export and media orchestration |
| `@automovie/render/node/chrome` | `DEFAULT_CHROME_EXECUTABLE`, the `CHROME` environment override or platform preference, without loading model export and media orchestration |

## Export a running Viewer

`renderViewerVideo(options)` takes the viewer URL, render spec, duration in seconds, frame scratch parent, MP4 destination and Chrome/FFmpeg executable paths. The viewer exposes `__afSeek(seconds)` and finishes placement and drawing before that hook returns or resolves. Its `#view` element must match the requested raster; `viewSelector`, `hideSelector` and `seekFunction` select another host surface or hook.

The runner captures exactly `durationSeconds * fps` frames at `i / fps`, refusing fractional frame counts. Optional `audioMix` supplies a complete soundtrack whose first audio stream is padded or trimmed to the film duration. An `AbortSignal` cancels capture and encoding; PNG scratch, page, browser and encoder are released on completion or failure. Frame count, retained bytes, browser-operation and encoder-time limits are configurable. The result retains frame hashes and timings, plus the final 64 KiB of encoder diagnostics.

Optional `prepare(page)` runs once on the already loaded capture page before frame zero, exposing its public evaluation transport and accepting a prepared `audioMix` path. Preparation failure prevents capture and encoding; the result reports its wall time separately as `prepareMs`.

## Resume from cached frames

Pass `cacheDirectory` (an ignored path such as `.cache/frames/<film>`, one per output) to keep every captured PNG between runs. The page then also publishes `__afFrameDigest(seconds)` (renamed by `frameDigestFunction`): a side-effect-free function returning a nonempty string that changes whenever anything that could change that frame's pixels changes, typically a hash of the scene state the production places at that second plus the identity of the assets and code that draw it. Each frame's key is the engine artifact key of stage `render.viewer-frame`:

- toolchain: `@automovie/render`, `@automovie/viewer` and `@automovie/engine` versions, digests of the Render and Viewer `src` trees (capture and drawing code, since a workspace never bumps versions), the browser build and the WebGL unmasked vendor/renderer;
- inputs: URL, width, height, device scale factor, view and hide selectors, seek hook, the frame's `seconds` and the page's `state` digest.

Before frame zero the runner reads every digest in one page call and plans which frames are stored. Stored frames whose bytes still match their recorded SHA-256 are copied; the rest are captured and stored immediately, so an interrupted run resumes where it stopped. `cacheVerifyEvery: n` recaptures every n-th reused frame and replaces any entry whose pixels differ, reporting it as `mismatched`: a nonzero count means the digest misses an input or the page draws nondeterministically. The encoder always consumes the full merged frame sequence with unchanged arguments. After success, entries the run did not reference are deleted; the result's `frameCache` reports the counts. Deleting the directory only costs recapture.

## Cache any deterministic stage

`createAutoMovieDirectoryArtifactStore(directory)` is the same store for any other deterministic stage: compose a key with the engine's `composeAutoMovieArtifactKey` (stage, its implementation version, toolchain identities, declared inputs), then `resolveAutoMovieArtifact(store, key, compute)` reads a verified entry or computes and stores it; `encodeAutoMovieArtifactJson` and `decodeAutoMovieArtifactJson` carry plain data exactly. Declare an upstream stage's returned `digest` as a downstream input, so an upstream recomputation that yields the same bytes leaves the downstream key unchanged. `collect` deletes unreferenced, old or oversized entries.

A browser page reaches the same directory through its development server: mount `createAutoMovieArtifactMiddleware(store)` (from `@automovie/render/node`) under a prefix such as `/__automovie/artifacts`, and give the page `createAutoMovieHttpArtifactStore("/__automovie/artifacts")` (from `@automovie/render`). The headless capture browser reaches it too, so the Viewer and every render share one cache. `digestAutoMovieSourceTree([dir])` digests a package's source for the toolchain of a stage whose code changes without a version bump, for example passed to the page through a Vite `define`.

The generated scaffold's `render.config.ts` and `scripts/render.ts` are the minimal consumer. Capture and encoding report technical observations; actual playback and sound review remain the production's responsibility.

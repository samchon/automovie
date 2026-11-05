# Kickboxing

A 180-second direct 3D kickboxing film using the original Human polygon figures. The [settings](docs/body/settings), [screenplay](docs/body/screenplay/kickboxing.md) [BoutScript](src/bout/BoutScript.ts) exchange table and [FilmPlan](src/film/FilmPlan.ts) clock and camera define the performance. Source implementation, physical acceptance, browser viewing, listening and final-media acceptance remain distinct checks.

## Run

Use the workspace's Node.js 22.23.2 toolchain and installed pnpm dependencies:

```powershell
pnpm --filter kickboxing build
pnpm --filter kickboxing preview
```

The configured preview address is `http://127.0.0.1:5198/`. Keep one task server running; a review may instead use an explicitly published immutable build on its recorded URL. Open that exact entry when comparing a reviewed version.

For development, `pnpm --filter kickboxing dev` serves the same Viewer at `http://127.0.0.1:5199/`.

Use Play, Pause and Seek to inspect the shared film clock. URL parameters `start`, `end` and `speed` select a review interval, for example `?start=135&end=165&speed=.25`. Sound requires a user gesture. Inspect each fifteen-second interval before joining it to the next, then watch the complete 0–180 sequence at normal speed. A refused action or preparation error remains a failed performance check.

## Review tools

```powershell
pnpm --filter kickboxing exec ttsx -P tsconfig.json scripts/capture.ts http://127.0.0.1:5199/ .cache/review 2.5 150 "150@0.6,1.4,3:0.3,0.5,0"
pnpm --filter kickboxing exec ttsx -P tsconfig.json scripts/play.ts http://127.0.0.1:5199/ 30 .cache/playback
```

`capture.ts` saves stills at film seconds (optionally from an inspection camera `seconds@x,y,z:tx,ty,tz`); `play.ts` presses Play in the real Viewer, logs the clock and refusals and can record the page. Add `?rig=1` to the Viewer URL (for example `http://127.0.0.1:5199/?rig=1`) to draw every joint as a point and every bone as a stick over the figures. Stills do not replace watching playback.

## Check and export

```powershell
pnpm --filter kickboxing lint
pnpm --filter kickboxing test
pnpm --filter kickboxing evidence
pnpm --filter kickboxing render http://127.0.0.1:5198/ output/kickboxing.mp4
```

The film export contract is 1280×720, 30 fps, exactly 5,400 frames and 180 seconds, with the same delivered camera and retained sound mix as the Viewer. The export owner writes capture and complete-decode receipts beside the output. An available command or produced MP4 does not establish successful decoding, contact review or audiovisual acceptance; those require the current run's actual results.

Reusable motion modules own timing, variation, continuation, support and contact response. The film sequence selects actions and independent actor routes rather than duplicating their poses. Gloves follow the actual hands. Hit sounds and impact-dependent reactions require actual contact receipts; authored target names do not establish a hit. Public Engine observations expose the displayed geometry and their finite-sampling limits.

## Video-generation prompts

Git holds text only. Audio, video, archives and downloaded originals stay in ignored folders, and the committed text identifies each one: sound libraries in `media/acquired/audio/`, VoxCPM speech in `media/generated/audio/`, the converted cues the film plays in `media/runtime/audio/` (all listed with source, license and digest in [the audio manifest](src/audio/manifest.json)), research originals in `references/` (indexed in [docs/research](docs/research/index.md)), renders in `output/`, and review and revision records in `docs/review/`, `docs/naturalness/` and `docs/revision/`. A fresh checkout has no sound until those audio files are restored from the manifest's sources.

`docs/prompts/videos/` holds planned, unsubmitted video-diffusion requests that restyle the render segment by segment; [source bindings](docs/prompts/videos/source-bindings.md) lists the twelve segments covering 0–180 seconds, their sources and the receiving contract. Each segment record names its planned clip, cut from the whole render as `output/segments/<record-name>.mp4`; its JSON payload under `payloads/` is rebuilt from the record and ignored. A checkout receives prompts, not media. Record each exported clip's or generated take's retained locator, digest and restoration requirement in its request record under [generation records](.agents/skills/production/generation-records.md#keep-small-records-in-git-and-large-bytes-retrievable).

Scaffold skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/13c60af339cc6f97dda67e40be055c94aa9bb144/packages/template/scaffold/.agents/skills), retaining its [MIT notice](.agents/skills/LICENSE.novels).

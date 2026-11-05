# Give It Back, Potter

An English 60-second romantic-comedy fan short about an invitation Carina Malfoy tries to take back from Harry Potter. Read [the final screenplay](docs/body/screenplay/give-it-back-potter.md) and [actual candidate dialogue timing](docs/analysis/dialogue-timing.md). [PROJECT.md](PROJECT.md) defines the settings-to-screenplay commission and [the brief](docs/instructions/brief.md) owns its creative choices. The Viewer is the generated empty 15-second harness; the short's staged performance is later work.

## Generated requests and retained bytes

[Paper crane dialogues](docs/prompts/voices/paper-crane-dialogues.md) records the actual two local speaker batches and nine utterances, exact input lists, controls/CLI fields, source anchors and revisions, observed outputs and unknown historical fields. Its linked small payload, input lists and [measurement receipt](docs/analysis/paper-crane-dialogue-measurements.json) are kept with versionable production records. [The current handoff addendum](docs/analysis/generation-handoff.md) identifies the inspected generation/retention chain separately from the earlier authoring acceptance.

[The shared character reference index](docs/prompts/images/shared-character-references.md) selects the parent-selected Carina Hogwarts-uniform PNG and unchanged Harry student PNG under [current visual casting](PROJECT.md#visual-casting). Around fifteen is the direct user appearance target; the current canonical settings and screenplay also adopt fifteen-year-old Hogwarts peers. Adult references and intermediate Carina student output remain superseded history. No local duplicate generation, geometry or film use is claimed; required bytes remain locally retained only, with no verified external archive.

The nine original WAVs remain at `.cache/audio-probes/carina` and `.cache/audio-probes/harry`. This is an adopted local asset location, not disposable scratch. All 1,152,396 bytes are locally retained only; no verified external archive exists. Another checkout must obtain the original files from the current local custodian or a future verified archive, restore the same relative paths and verify all nine hashes/byte sizes against the request record and measurement receipt. Regeneration creates new candidates and does not restore these exact bytes. Input lists and measurements remain available in the small versionable records even if supplemental ignored logs are absent. Listening, transcript, timbre and final soundtrack adoption remain unverified.

The scoped `/media/generated/` rule applies to future generated-media storage when a different project-owned path is not adopted; `/output/` excludes renderer exports. Small `docs/prompts` and `docs/analysis` records are not ignored. A later render must preserve its nonsecret capture receipt or sufficient measurements under `docs/analysis`, linked to original output/report digests and retained locators; no render exists to register now. Git exclusion does not establish durable retention or permit deleting required local media. Follow [generation-record retention](.agents/skills/production/generation-records.md) before disposal, including archive restoration and digest verification for required bytes.

## Workspace setup

Use Node.js 22.23.2 or later. This production is linked to the enclosing pnpm workspace's local AutoMovie packages. The shared install owner runs installation from the repository root; production workers use those existing links and run their own checks without changing the root lock or installing from this directory. On this Windows host, use a real task temporary directory for the compiler's physical-path checks:

```powershell
$taskTemp = 'D:/github/samchon/automovie@malfoy/movies/shorts/paper-crane-invitation/.cache/tool-temp'
New-Item -ItemType Directory -Path $taskTemp -ErrorAction SilentlyContinue | Out-Null
$env:TEMP = (Resolve-Path $taskTemp).Path
$env:TMP = $env:TEMP
pnpm run lint
pnpm evidence
pnpm test
pnpm run build
```

The user selected local VoxCPM for English dialogue probes. The verified isolated runtime is `D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe`, package 2.0.3, with its model, pinned revision and environment in `D:/Program Files/VoxCPM/runtime.json`. [The dialogue manifest](docs/analysis/dialogue-probes.json) freezes all nine English utterances, speaker descriptions and provisional scene spans. [The request record](docs/prompts/voices/paper-crane-dialogues.md) binds them to actual sources and distinguishes the reconstructed protocol from unknown historical digests. Two official `batch` invocations generated four Carina and five Harry candidate WAVs; original logs/bytes remain in the adopted ignored location, while exact small inputs/measurement facts also have versionable owners. No speech or final soundtrack is wired into the scaffold Viewer.

Each UTF-8 input list contains one exact manifest utterance per line in speaker order. The actual synthesis command shape is:

```powershell
& 'D:/Program Files/VoxCPM/venv/Scripts/voxcpm.exe' batch --input .cache/audio-probes/carina.txt --output-dir .cache/audio-probes/carina --control 'Young adult woman, clear mezzo voice, contemporary southern British English, brisk precise diction, natural close microphone, no impersonation' --model-path 'D:/Program Files/VoxCPM/models/VoxCPM2-32279effe8c19989596f05d353d1447f51d9e915' --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10
```

The documented commands describe the historical adult-design probes, not new synthesis for the student images. Harry used the corresponding original list/directory/control. No seed exists in the installed version, and repeated designs prove no timbre continuity. The nine original WAVs remain unheard timing candidates; transcript, performance, age-fit to updated visual casting and final soundtrack selection are pending. The image correction does not relabel old controls as teenage voices or regenerate audio.

The tracked measurement command uses the installed public Ingest WAVE decoder, exact saved bytes and untrimmed duration:

```powershell
pnpm exec ttsx --no-plugins -P tsconfig.json scripts/measureSpeechProbes.ts .cache/audio-probes/measurements.json .cache/audio-probes/carina/output_001.wav .cache/audio-probes/carina/output_002.wav .cache/audio-probes/carina/output_003.wav .cache/audio-probes/carina/output_004.wav .cache/audio-probes/harry/output_001.wav .cache/audio-probes/harry/output_002.wav .cache/audio-probes/harry/output_003.wav .cache/audio-probes/harry/output_004.wav .cache/audio-probes/harry/output_005.wav
```

The source profile requires nonempty mono 48 kHz audio; its test uses independently specified PCM values and valid empty/wrong-rate refusals. Measurements establish source facts and technical sample statistics, not intended words, listening approval or the whole scene's actual running time.

The project includes instructions, contracts and a working empty Viewer with exact-time video export. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [screenwriting](.agents/skills/screenwriting/SKILL.md) for creative work. Default lint and evidence check ordinary TypeScript source and tests; [evidence configuration](.agents/skills/evidence/configuration.md) adds narrative scope and stages to that same configuration. The empty scene and checks do not complete a production.

## Viewer and export

Run `pnpm run dev -- --port 5313 --strictPort`, then open [the Viewer](http://127.0.0.1:5313/). Play, pause and seek use the same deterministic performance as export. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [0–15 seconds at half speed](http://127.0.0.1:5313/?start=0&end=15&rate=0.5&play=1). The actual recovered host is the empty 15-second scaffold, not the authored 60-second vertical film. Later work will author its scene and camera in `src/createProduction.ts` and its clock in `src/durationSeconds.ts`.

For a later authorized export, keep that server running, set `VIEWER_URL=http://127.0.0.1:5313/` and `CHROME_PATH` to an installed Chrome or Chromium executable, then run `pnpm run render`. The explicit URL selects this production's port rather than the scaffold default. `render.config.ts` supplies the raster, frame rate, destinations and optional soundtrack through `audioMix`. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. Current capture configuration is the scaffold's 1280×720 harness, not implemented 9:16 delivery. No film export is claimed by the current authoring commission.

The public Render runner writes `output/film.mp4` and the command retains `output/capture-report.json`. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one video/audio encode. Its hashes and timings describe capture; inspect continuous playback and listen to the actual sound before accepting the film.

## Make a motion hint

1. Adopt the request, output boundary and operating choices, including the intended execution/capture path, in [PROJECT.md](PROJECT.md) through [project context](.agents/skills/production/profile.md). Make routine choices within the user's delegation and keep creative requirements with their owners.
2. Write the complete [screenplay](.agents/skills/screenwriting/SKILL.md), retaining settings → treatments → scripts → final audiovisual screenplay for long work. A short enters directly at screenplay or retains compact settings followed by screenplay, without treatments, scripts or an outline. Finish scripts content and expression together in construction, then final screenplay construction and its naturalness pass, with evidence and independent review. Both short routes retain their screenplay duties.
3. Program every required main-scene performance through [staging for the camera](.agents/skills/motion/staging.md). Use suitable retained assets or start newly authored [representations and controls](.agents/skills/3d-modeling/SKILL.md) at low cost, preserving actual interactions and reactions, readable views and continued state across cuts before selective detail upgrades. [Accepted audio](.agents/skills/audio/SKILL.md) supplies performed sound and measured timing when required.
4. Prepare the [motion hint and requested companion controls](.agents/skills/production/conditioning.md) from the same actual performance, with aligned frame/camera mapping for time-matched channels. Use the supplied Viewer/export host or document the production's adopted replacement here.
5. Assemble and encode the complete work through [finishing](.agents/skills/production/finishing.md), then inspect the actual output through [delivery review](.agents/skills/review/delivery.md). Hand off the fixed inputs, source, commands, observed result and remaining limits.

A separately commissioned screenplay ends with its text duties; a standalone asset needs no invented narrative. A whole motion hint needs no finished diffusion film. A requested direct 3D film finishes through its actual renderer and sound path; [generated video](.agents/skills/production/generation.md) uses a selected service and accepted fixed takes before the final edit. Their delivery boundaries stay explicit in PROJECT.md.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run lint` | TypeScript and source correctness |
| `pnpm evidence` | Source/test checklists and the selected path's active evidence obligations |
| `pnpm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `pnpm run format` | Source formatting |
| `pnpm run dev -- --port 5313 --strictPort` | Actual production Viewer on `127.0.0.1:5313` |
| `pnpm run build` | Bundle the production Viewer |
| `pnpm run render` | Future export with the explicit `VIEWER_URL` above |

The production host uses ES modules with `isolatedModules`. Its workspace-only compiler configuration sets `verbatimModuleSyntax: false` because local AutoMovie dependency exports resolve their CommonJS-oriented source conventions, whose type imports require erasure. This preserves full dependency type checking and all strict, unused and declaration rules; no file is excluded. Keep production type-only imports and exports marked with `type` and each file independently transformable. The published scaffold retains its separate default configuration.

`test/index.ts` discovers pure logic unit tests in `test/features/<domain>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `TestValidator` from `@nestia/e2e` or `node:assert/strict`. Use `pnpm test -- --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

## Project files

- `.agents/skills` holds eight task entry points, their directly linked resources and contracts. `AGENTS.md` groups creation, implementation/evidence and assessment; `screenwriting` selects its current stage, rewriting, evidence or repair procedure.
- `PROJECT.md` holds the project overview, commissioned scope, current choices, constraints and setup authority.
- `docs/instructions` holds creative writing requirements; other `docs` locations hold bodies, working editions, evidence and reviews when needed. [Layout and intake](.agents/skills/production/layout.md) explains their owners.
- `src` holds executable source and actual host entries, with optional provider or local-tool code in `src/integrations`; `test` holds tests and their runner; `public` holds retained fixed media.
- Runtime README instructions and `.env.example` hold nonsecret setup and variable names. Keep actual secrets in ignored local `.env`.
- `evidence.config.ts` selects duties through installed `@automovie/evidence`; `pnpm evidence` evaluates the selected native graph.
- `lint.config.ts` configures source lint; `tsconfig.json` owns compiler settings and `tsconfig.test.json` scopes pure TypeScript unit tests. `package.json` owns dependencies and commands.

Package upgrades never rewrite this project. An explicit `automovie sync <directory> --check` inspects generated instruction updates; omit `--check` to apply a conflict-free plan. Sync preserves contracts, project decisions, README, configuration, authored content and proof. Keep `.automovie/scaffold-state.json` with the project; a legacy project needs a verified previous instruction root through `--baseline` for differing existing instructions. Retired generated paths are reported for explicit retirement. Updating instructions grants no renewed approval to old bodies or reviews. Installed package READMEs, public types and JSDoc own API behavior; the production supplies and documents its actual host and integrations.

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/13c60af339cc6f97dda67e40be055c94aa9bb144/packages/template/scaffold/.agents/skills). Its MIT copyright and permission notice remain in [LICENSE.novels](.agents/skills/LICENSE.novels); [provenance and responsibility ownership](.agents/skills/evidence/adoption.md#retain-provenance) records the adaptation.

Current costume selection: Carina uses the shared Hogwarts-uniform reference above. Harry's unchanged student PNG is a face/identity reference only: both actual uniform-image attempts were blocked and produced no image. The user's Hogwarts-uniform instruction supplies the movie costume authority (Slytherin for Carina, Gryffindor for Harry), independently of Harry's reference clothes. Earlier Carina smirk/student/adult images remain retained historical outputs. The completed independent findings round led to current canonical fifteen-year-old school peers and explicit Slytherin/Gryffindor uniforms. Their actual motion and encoded delivery remain in production.

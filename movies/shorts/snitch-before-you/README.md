# Snitch Before You

This production develops an English one-minute Quidditch fan short in which Carina abandons a near-certain Snitch catch and lets Harry transfer from his failing grip onto her broom. [PROJECT.md](PROJECT.md) owns the current whole motion-video commission; [the brief](docs/instructions/brief.md) owns the adopted story and form. The actual Viewer implements the full sixty-second Human polygon scene. [Motion execution](docs/analysis/motion-execution.md) records actual review, capture/decode status and limits.

Current delivery: [whole60s MP4](output/motion-dynamics/motion-hint.mp4), plus [23s pursuit](output/motion-dynamics/segments/snitch-pursuit-and-overreach.mp4), [12s choice](output/motion-dynamics/segments/a-prize-within-reach.mp4), [18s transfer](output/motion-dynamics/segments/two-broom-rescue-transfer.mp4) and [7s ending](output/motion-dynamics/segments/what-she-caught-instead.mp4). All five silent720×1280/24fps H.264 files were fully decoded. [Current identities](docs/analysis/motion-dynamics-artifacts.json), [completion/check limits](docs/analysis/motion-dynamics-final.md), [exact prompt bindings](docs/analysis/motion-dynamics-prompt-bindings.json) and [the actual encoded review](docs/review/motion-dynamics-delivery.md) identify this revision. The earlier output/motion-hint.mp4, four old segments,667-source bundles and reviews remain historical; their earlier acceptance is not reused for this output. Native still exits1 with eight historical stale construction reviews. This is a coarse silent motion hint with unsubmitted English video requests; continuous sensory watching, accepted soundtrack and paid diffusion output are unperformed.

The shared installer linked all four productions once from the repository root with `pnpm install --ignore-scripts`; it owns future dependency installation and the root lock. This production uses those local `workspace:*` links. Run its own checks through the sequence below without another production-local install. On this Windows host, every new compiler/check shell needs a real task-local TEMP/TMP directory because the redirected system temporary directory fails the compiler's physical-parent check.

The user's selected local VoxCPM environment is at `D:/Program Files/VoxCPM`. Three retained English timing candidates and two fictional voice references are documented in [speech timing](docs/analysis/speech-timing.md); they remain unheard and are not an accepted soundtrack. [Writing state](docs/analysis/writing-state.md) records actual checks and pending work. The remaining scaffold instructions describe the retained host's commands and future authoring interfaces.

Read `D:/Program Files/VoxCPM/runtime.json` and set its `environment` fields in the acquisition shell before using its official CLI. A take was produced with `voxcpm.exe clone --text <the exact line> --reference-audio <owned reference.wav> --control <recorded performance control> --model-path <runtime model> --device cpu --no-optimize --no-denoiser --cfg-value 2 --inference-timesteps 10 --output <owned take.wav>`. Generation runs only in the shared serialized synthesis slot; the installed CLI has no seed argument. The exact invocation inputs and candidate bytes are retained under `assets/audio/probes`.

Measure fixed files from this production directory with `pnpm exec ttsx --no-plugins scripts/measureSpeechProbes.ts assets/audio/probes/measurements.json <one-or-more-owned.wav>`, after setting real task-local TEMP/TMP. The host uses the installed Ingest WAVE decoder and refuses empty or non-mono48kHz probes. Its report measures bytes and duration and supplies no listening approval.

Meaningful generation records under the plural `voices` purpose are [Quidditch rescue dialogue](docs/prompts/voices/quidditch-rescue-dialogue.md) and [Carina/Harry voice references](docs/prompts/voices/carina-and-harry-voice-references.md). They preserve exact payload owners and distinguish unknown historical source hashes from current source correspondence. The five local WAVs remain at `assets/audio/probes/*.wav`, ignored without deletion; `/media/generated/` and `/output/` are also ignored for future large outputs. [Retention and restoration](docs/analysis/generation-handoff.md#retention-and-restoration) identifies exact locators, hashes and how another checkout obtains the bytes. No durable archive is verified; Git or a prompt alone cannot restore them. Keep small prompts, receipts and concise measurements under tracked paths, and retain any future capture report under `docs/analysis/` with its ignored media identity.

[Shared cast references](docs/prompts/images/shared-cast-references.md) selects Carina's Hogwarts uniform PNG and Harry's student face PNG. Current settings and screenplay use about-fifteen Hogwarts students, a local nape tie and Slytherin/Gryffindor uniforms. Harry has no successful uniform image; his costume follows the direct user requirement and settings. Retain all six original/intermediate/current PNGs as local-only edit lineage. These optional static references guide coarse local realization; no portrait billboard or external image input is wired into playback. The adult-designed WAVs have no verified teenage voice fit and are not the silent hint's soundtrack.

The fourteen-rider screenplay completed its recorded construction/expression cycle and guarded transfer before later student/camera corrections. [The expression record](docs/analysis/expression-pass.md) and [historical handoff](docs/analysis/generation-handoff.md#comparison-inputs) identify exact original editions and required ignored comparison files. Later scoped canonical and motion reviews do not rewrite those frozen approvals. Obtain and hash-check required local comparison files and media separately from Git.

Use an LLM to author a complete movie screenplay, then program the main scenes' motion, staging and camera and assemble the whole video as a reproducible film-generation hint. Stick figures, block figures and coarse meshes can carry that performance; Human is optional. Stills and pilot clips alone do not complete a movie hint.

## First run

Use Node.js 22.23.2 or later with the existing workspace dependency links. From this production directory:

```powershell
New-Item -ItemType Directory -Path .cache/quidditch-worker/tmp -ErrorAction SilentlyContinue | Out-Null
$env:TEMP = (Resolve-Path .cache/quidditch-worker/tmp).Path
$env:TMP = $env:TEMP
pnpm run lint
pnpm evidence
pnpm test
pnpm run build
```

The project includes the authored scene, instructions, contracts and exact-time Viewer/export host. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [screenwriting](.agents/skills/screenwriting/SKILL.md) for creative work. [Evidence configuration](.agents/skills/evidence/configuration.md) selects source/test and narrative duties; coverage alone does not establish visible delivery.

## Viewer and export

Run `pnpm run dev --host 127.0.0.1 --port 5201 --strictPort`, then open [the Viewer](http://127.0.0.1:5201/). URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [the transfer at half speed](http://127.0.0.1:5201/?start=43&end=53&rate=0.5&play=1). `src/createProduction.ts` invokes the real scene; `sampleWholeFlight.ts` composes opening/central/ending absolute state; `createRider.ts` displays public Human FK/IK joints. Six equivalent body inputs are prepared once per page, then shared by matching supporting identities. The current fixed Viewer measured87.01seconds to its first ready clock/canvas; actual capture navigation loaded in86.65seconds. Wait for the complete ready scene. Capture uses the supported480-second browser-operation budget without changing semantic, raster or error guards.

Keep the server running, set `CHROME_PATH` to `C:/Program Files/Google/Chrome/Application/chrome.exe`, and use the same physical task-local TEMP/TMP setup. Start the retained fixed bundle with `pnpm exec vite preview --outDir output/motion-bundle-dynamics-clearance --host 127.0.0.1 --port 5206 --strictPort`. Leave `VIEWER_URL` unset to use `http://127.0.0.1:5206/?capture=1&w=720&h=1280`, or supply a URL serving those exact admitted bundle bytes. The render command verifies actual HTTP HTML/JavaScript identities before and after capture. Run `pnpm run render`, then `pnpm exec ttsx --no-plugins -P tsconfig.json scripts/prepareVideoHandoff.ts`. `render.config.ts` owns720×1280,24fps,H.264/yuv420p and the silent whole output. `ffmpeg-static` supplies the encoder; `FFMPEG_PATH` overrides whole Render's executable. The segment helper uses its installed FFmpeg directly.

Public Render writes `output/motion-dynamics/motion-hint.mp4` and retains `docs/analysis/motion-dynamics-capture.json`. It captures1440actual Viewer frames at `i/24`; the segment helper trims/reencodes exact causal ranges and fully decodes the whole and all four segment files, retaining their actual identities in `docs/analysis/motion-dynamics-artifacts.json`. The whole source remains unchanged by derivation. Actual completion and observation limits belong to those receipts and current delivery review, not this command description. Required MP4 bytes remain locally retained under ignored `output/`; no durable archive is verified. Obtain exact files and verify recorded hashes in another checkout.

The four [English video request records](docs/prompts/videos/) contain complete exact planned payloads for official Seedance2.5 edit mode and source/camera/frame mappings. They are unsubmitted templates: public URL fields remain unresolved, no account activation or paid job is claimed. Their intervals are23,12,18and7seconds, each within the documented4–30-second clip and30-second aggregate-video input budget. The separately retained whole60-second hint is not submitted as one reference. No appearance PNG or previous continuity clip is silently added, and Seedance2.0's smaller budget is not claimed equivalent.

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
| `pnpm run dev --host 127.0.0.1 --port 5201 --strictPort` | Whole motion Viewer on `127.0.0.1:5201` |
| `pnpm run build` | Bundle the production Viewer |
| `pnpm run render` | Exact-time whole capture through `render.config.ts` |
| `pnpm exec ttsx --no-plugins scripts/prepareVideoHandoff.ts` | Four exact frame-range derivatives and full decode/identity receipt |

The production uses ES modules and `isolatedModules`. Its monorepo workspace dependencies expose source written for the workspace's CommonJS producer conventions, so this production sets `verbatimModuleSyntax: false` to erase type-only dependency imports consistently. Strictness, isolated modules, root directory, unused checks and lint rules remain enabled. Mark this production's own type-only imports and exports with `type` and keep files independently transformable; the published scaffold retains its separate package-boundary configuration.

`test/index.ts` discovers pure logic unit tests in `test/features/<domain>/test_<name>.ts` through `tsconfig.test.json`. Export a named `test_<name>(): void` or `Promise<void>` function and assert behavior with `TestValidator` from `@nestia/e2e`. Use `pnpm test --include <substring> --exclude <substring>` to select test filenames; repeated options accumulate. Tests call portable logic directly; actual Viewer and media inspection run separately.

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

Current Hogwarts costume override: the adoption index now selects Carina Hogwarts uniform PNG (raw SHA-256 `868cc1232d330bd2ad60606aa2f686ea3cf0747eb40c4f4f8bac51ada55dad08`,1781233 bytes) and Harry student face PNG (`881f896c1f0bf5dbbe318b9bec77b8c7211e9446b6be56e6d93fcfa96b5bf4c5`,1833847 bytes). Programmed motion must use Slytherin uniform for Carina and Gryffindor uniform for Harry under the user costume instruction. Harry has no successful uniform PNG: two output-moderation failures returned no image. Retain the six-image lineage; earlier student/smirk adoption statements and scoped review are historical. Current settings and the screenplay opening now incorporate the user age/uniform correction; historical generation payloads and all voice bytes remain unchanged.

The delivered movie bundle preserves the observed667-file Human candidate epoch. The shared library subsequently restored666 files; it is not retrospectively called identical or globally approved. The fixed JavaScript, actual parameters and movie-specific FK/contact observations remain independently reproducible. Retain both bundle folders as local runtime artifacts; the earlier `output/motion-bundle` is historical, and `output/motion-bundle-dynamics-clearance` is the current admitted source. Building the current workspace again is a new source epoch, not restoration of those exact bytes.

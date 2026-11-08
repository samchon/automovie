# Look at Me This Time

An actual [60-second English motion hint](output/film.mp4) now completes the private duel, rescue and renewed challenge between fifteen-year-old Hogwarts schoolmates Carina and Harry. It is a silent720×1280,H.264/yuv420p,24fps MP4 with1440 decoded frames and English captions. [Four causal clips](docs/analysis/motion-artifacts.json) cover9/16/23/12seconds; their exact English Seedance2.5 request templates are under [docs/prompts/videos](docs/prompts/videos/source-bindings.md). The [screenplay](docs/body/screenplay/look-at-me-this-time.md#duel), [Project](PROJECT.md), [motion execution](docs/analysis/motion-production.md) and [actual encoded-image review](docs/review/motion-film.md) distinguish current output, historical authoring proof and limits. No external diffusion or accepted soundtrack is claimed.

The prior written/source/retention handoff was reviewed before the current student-canon repair. [Final native validation](docs/analysis/validation.md#final-promoted-result) is qualified: 83/83 units are covered, with one preserved stale construction-review fingerprint after expression transfer. That historical graph is not reported as clean, and its old approval remains with its frozen edition. Current canonical repair does not inherit that approval.

## First run

Use Node.js 22.23.2 or later.

```bash
pnpm run lint
pnpm run evidence
pnpm test
pnpm run build
```

The repository's shared installation owner links this production's `workspace:*` AutoMovie dependencies with the root pnpm installation. On this Windows host, ttsc needs TEMP and TMP set to the real production-owned `.cache/temp` directory before each invocation; the app's redirected system TEMP fails its physical-parent check. Create that ignored directory if absent, set `$env:TEMP=(Resolve-Path .cache/temp).Path` and `$env:TMP=$env:TEMP`, then run the commands above. [Validation](docs/analysis/validation.md) records actual rounds and limitations. Start with [production](.agents/skills/production/SKILL.md) for the requested output and [screenwriting](.agents/skills/screenwriting/SKILL.md) for creative work. [Evidence configuration](.agents/skills/evidence/configuration.md) selects compact settings and screenplay without disabling engineering checks.

## Viewer and export

The live authored scene runs at [127.0.0.1:5183](http://127.0.0.1:5183/) with `pnpm run dev -- --host 127.0.0.1 --port 5183 --strictPort`. It prepares the full60second forward performance before Play; Pause and absolute seek use the same fixed24fps states. Candidate failures remain visible and block capture. The actual current whole round prepared1441 endpoint-inclusive states/2882 actors with zero required support, wand, grip, floor, ROM or causal failures. The separate old5184 opening preview is historical.

The completed capture consumed the [immutable production bundle](docs/analysis/motion-bundle.json) at5283 and its exact admitted whole cache. Serve that retained bundle, then use the public Render command:

```powershell
pnpm exec vite preview --host 127.0.0.1 --port 5283 --strictPort --outDir output/motion-bundle
# In another shell with the task-local TEMP/TMP above:
pnpm run render
```

`render.config.ts` defaults to5283; `VIEWER_URL` is an explicit override for the same sealed assets. `CHROME_PATH` and `FFMPEG_PATH` optionally select supported installed executables. The current export verifies source, model and served-file identities before/after actual1440 pixel captures and writes `output/film.mp4` plus [motion-capture.json](docs/analysis/motion-capture.json). It uses the admitted whole cache through `fixedFilm`, not an invented pilot duration. The observed exact whole SHA-256 is `8bbb36496e1c276a8f3571baa2011797b655074dcfecaeed0d90aa81a2ac72c3`.

The existing tracked `scripts/prepareVideoHandoff.ts` derived four frame-exact H.264 clips without speed changes, fully decoded all five MP4s and extracted actual73 stride images,54 events and8 clip boundaries. [motion-artifacts.json](docs/analysis/motion-artifacts.json) owns profiles, presentation timestamps, hashes and commands. [Encoded image review](docs/review/motion-film.md) owns actual individual readings; [its receipt](docs/analysis/encoded-image-review.json) maps all135 observed images. This is the requested sampled-image inspection, not continuous sensory watching or listening.

To recompute source motion, keep the exact adopted25second input `public/motion/exchange-round-eleven.json` (SHA-256 `1830bbf936660f0301848b7ff71acda72c9b588cd8949b9125b76fb1520a5404`) and current workspace dependencies. The successful actual whole cache is `public/motion/whole-round-five.json` (SHA-256 `45ce343706cdd7044b94c8e89f71eaf269fa6aab857e98413bb863573d3243e3`). `scripts/inspectViewer.ts` owns durable actual preparation/inspection; `scripts/sealMotionBundle.ts` seals a new fresh directory only after explicit cache-SHA/source/model checks. The retained bundle can replay its exact input; a different source epoch needs fresh preparation and dependent output checks. No separate Human library is vendored.

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
| `pnpm run evidence` | Source/test checklists and the selected path's active evidence obligations |
| `pnpm test` | Run exported `test_*` functions under `test/features` through `tsconfig.test.json`; an empty selection fails |
| `pnpm run format` | Source formatting |
| `pnpm run dev -- --host 127.0.0.1 --port 5183 --strictPort` | Current full60-second source Viewer |
| `pnpm run build` | Bundle the production Viewer |
| `pnpm run render` | Actual whole export from the sealed5283 preview |

This workspace consumes AutoMovie packages through their source exports, including CommonJS producers that use ordinary imports for types. Its consumer sets `verbatimModuleSyntax: false` so TypeScript can erase those type imports. ES modules, `isolatedModules`, strict checks, unused checks and all lint rules remain enabled; authored production code still marks type-only imports and exports with `type`. The published scaffold's separate configuration is unchanged.

## Local speech candidates

The user's authorized VoxCPM environment is `D:/Program Files/VoxCPM`. Its current `runtime.json` records CLI, checkpoint and environment variables; load those process variables before using `venv/Scripts/voxcpm.exe`. [Duel dialogue requests](docs/prompts/voices/duel-dialogues.md) now own all four exact retained words/controls, normalized command reconstructions, source locators/digests, actual receipts and output identities. [Carina and Harry voice references](docs/prompts/voices/carina-and-harry-voice-references.md) owns the two shared neutral design requests and reference dependency chain. Both records were reconstructed after generation; unknown original argv, timestamps and source-hash captures remain explicit.

The retained candidate is the fixed input; running generation again produces a new candidate and may replace that path. Preserve existing bytes before another run. [Voice observations](docs/analysis/voice-probes.md) and its unchanged JSON remain the original measurement owners, including unheard status. No seed option or deterministic regeneration is claimed. The actual shared measurement consumer is:

```powershell
pnpm exec ttsx --no-plugins ../snitch-before-you/scripts/measureSpeechProbes.ts docs/analysis/voice-probes.json public/audio/dialogue-candidates/01-harry-ready.wav public/audio/dialogue-candidates/02-carina-are-you.wav public/audio/dialogue-candidates/03-harry-save-me.wav public/audio/dialogue-candidates/04-carina-look-at-me.wav
```

These files support timing investigation. They are not an accepted voice performance or a soundtrack consumed by the Viewer.

## Shared visual references

[Shared Carina and Harry references](docs/prompts/images/shared-character-references.md#shared-references) owns the current student visual selection and links canonical prompts and actual PNGs in `../shared-characters`. Carina's Hogwarts-uniform reference and Harry's retained student face reference are selected. Harry's uniform-image attempts produced no image; his actual Gryffindor costume follows the user's instruction and current profile. Earlier smirk, student and adult inputs remain historical lineage. This production generated no duplicate. Current canon gives both fifteen-year-old Hogwarts identities and uniforms; heights remain staging choices, and image references do not calibrate the generated Human model or establish finished appearance. Actual motion/source observations own the implemented geometry. A standalone checkout needs the shared library's exact local-only bytes and provenance described in that index.

## Generated media retention

Follow [generation records](.agents/skills/production/generation-records.md) before any new acquisition. Preserve requests at meaningful `docs/prompts/<purpose>/<descriptive-name>.md` paths using plural purpose directories such as `voices/`, `images/`, `videos/`, `models/` and `sounds/`, with exact fields and creative-source mappings; provider IDs belong inside the record, not in an opaque filename. [The current generation handoff](docs/analysis/generation-handoff.md) identifies inspected scope and retention boundaries.

[Post-scene source/media correspondence](docs/analysis/scene-generation-correspondence.json) and [the voice adoption map](docs/prompts/voices/duel-dialogues.md#current-adoption) preserve the observation epoch before the student-reference correction. They separate the promoted scene's exact hashes/literal context from the older generation requests. [The exact transfer receipt](docs/analysis/expression-transfer.json) identifies frozen, annotated working and delivered bytes. The six WAVs and original adult PNGs remain unchanged. The later shared student-image requests have their own canonical records in the current image index; no post-transfer source hash is retroactively a model input.

Large generated bytes default to ignored `media/generated/`; render exports under `output/` and generated playback bakes under `public/motion/` are also ignored. Existing dialogue candidates stay at `public/audio/dialogue-candidates/*.wav`, and the two copied voice identities stay at `references/audio/*identity-reference.wav`, with narrow ignore rules for these known paths. All six audio files remain physically present and hash-verifiable. Shared visual references remain in their canonical library. Small prompt/provenance/measurement/capture receipts stay Git-eligible under `docs/prompts` or `docs/analysis`; ignored bytes need their exact identity and local-retention boundary recorded there.

These bytes are `locally-retained-only`, with no verified durable archive. Another checkout must obtain them through the restoration procedures in the two request records and verify their digests before use; Git exclusion is not backup or permission to delete a dependency. Before removing a required local file after archival, restore and verify the archive and its source dependencies, then record availability. No archive, restoration test, accepted voice or final-film consumption is implied by these records.

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

## Student visual-casting correction

Both actual on-screen characters follow the current fifteen-year-old Hogwarts canon. The [shared image index](docs/prompts/images/shared-character-references.md#shared-references) selects Carina’s actual Slytherin uniform reference and Harry’s student face reference; older smirk/student/adult images remain historical edit lineage. Portraits are optional creative references, not calibrated geometry or raster inputs to this render. Harry’s two uniform-image attempts failed without output, while his implemented Gryffindor clothing follows the direct instruction and canonical profile. Adult-designed voice candidates remain unaccepted for student acting/timbre and are absent from the silent movie.

## Current Hogwarts costume override

The current user instruction requires Carina's Slytherin and Harry's Gryffindor Hogwarts uniform in actual motion. The [current image index](docs/prompts/images/shared-character-references.md#shared-references) selects Carina's actual uniform edit and preserves Harry's student PNG as face/identity source only. Harry's uniform-image requests failed without an output, so that PNG is not described as a uniform reference. The direct user costume instruction is independent authority for his on-screen clothing. Earlier image epochs, original proof and voice requests remain historical. The later canonical repair aligns the current brief/settings/screenplay with fifteen-year-old schoolmates and Hogwarts uniforms without retroactively renewing those proofs.

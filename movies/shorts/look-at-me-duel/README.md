# Look at Me This Time

An original 60-second English fan short turns Carina and Harry's practice duel into a bodily rescue. The completed authoring slice supplied seven compact settings and [the promoted audiovisual screenplay](docs/body/screenplay/look-at-me-this-time.md#duel); [PROJECT.md](PROJECT.md) owns scope and [the brief](docs/instructions/creative-brief.md) owns creative requirements. The complete-scene replacement has its own construction and naturalness reviews and exact transfer, tracked in [scene completeness](docs/analysis/scene-completeness.md) and [validation](docs/analysis/validation.md); final promoted handoff/graph acceptance is reported there separately. Predecessor proofs remain historical. The resumed commission implements the complete60-second Human polygon motion hint. The actual0–9 opening has sampled-image, source and numerical review; the first6 seconds have been encoded through public Render. The9–25 extension is authored but awaits its complete consumer round. No whole60-second film is reported yet. [Motion production](docs/analysis/motion-production.md) records actual implementation and output status.

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

The recovered task-owned host runs `pnpm run dev -- --host 127.0.0.1 --port 5183 --strictPort`; open [the Viewer](http://127.0.0.1:5183/). This explicit port overrides the generic Vite default. Play, pause and seek use the same deterministic performance as export. URL parameters `start`, `end`, `rate` and `play=1` select interval playback, for example [the opening at half speed](http://127.0.0.1:5183/?start=0&end=9&rate=0.5&play=1). Author the scene, camera, exact-time placement and asset disposal in `src/createProduction.ts`; `src/durationSeconds.ts` supplies the clock. The Viewer prepares all implemented24fps poses before allowing its real-time clock to advance. Press Play or call the public __afPrepare port; numerical failures remain visible as candidate state and prevent capture. The slider covers only the implemented interval while the denominator retains the60-second target.

For a later export, keep the server running and set `$env:VIEWER_URL='http://127.0.0.1:5183/?capture=1&w=720&h=1280'` before `pnpm run render`, which matches the adopted portrait render configuration. Set `CHROME_PATH` to an installed Chrome or Chromium executable. `render.config.ts` supplies raster, frame rate, destinations and optional complete soundtrack through `audioMix`. FFmpeg is supplied by `ffmpeg-static`; `FFMPEG_PATH` selects another executable. Capture mode uses the completed `__afSeek(seconds)` hook. Whole60 capture is commissioned and explicitly refuses incomplete implemented scope; no whole-film export is reported yet. An integration probe uses its explicit captureEnd query and matching short Render duration, never an invented full-film result.

The public Render runner writes `output/film.mp4` and the command retains `output/capture-report.json`. Export requires a whole number of frames and captures actual Viewer pixels at `i / fps`, followed by one video/audio encode. Its hashes and timings describe capture; inspect continuous playback and listen to the actual sound before accepting the film.

The actual integration probe is [opening-integration.mp4](output/probes/opening-integration.mp4), with its [capture receipt](output/probes/opening-integration-capture.json):144 frames,720×1280,24fps,H.264,0–6 seconds. It includes the first camera cut and exact English caption. `pnpm exec ttsx --no-plugins -P tsconfig.json scripts/renderOpeningProbe.ts` exercises that explicitly scoped path. This is a retained integration result, not the complete film or an accepted soundtrack.

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
| `pnpm run dev -- --host 127.0.0.1 --port 5183 --strictPort` | Task-owned recovered starter Viewer |
| `pnpm run build` | Bundle the production Viewer |
| `pnpm run render` | Future export with the explicit `VIEWER_URL` above |

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

The production skills and story contracts adapt [wrtnlabs/novels](https://github.com/wrtnlabs/novels/tree/13c60af339cc6f97dda67e40be055c94aa9bb144/packages/template/scaffold/.agents/skills). Its MIT copyright and permission notice remain in [LICENSE.novels](.agents/skills/LICENSE.novels); [provenance and responsibility ownership](.agents/skills/evidence/adoption.md#retain-provenance) records the adaptation.

## Student visual-casting correction

The current [shared-reference index](docs/prompts/images/shared-character-references.md#shared-references) selects Harry's actual student reference and Carina's final student smirk reference. The direct user authority is [Current visual casting](PROJECT.md#current-visual-casting), targeting an apparent age of about fifteen. The earlier adult portraits remain superseded history and edit inputs, not current age authority. This earlier image-only observation predates the later canonical age and uniform repair; the current brief/profiles now own the student casting. Existing adult-designed, unheard voice probes remain historical technical candidates; student-cast age fit and soundtrack selection are pending. The current two-image selection is complete; film use and voice age fit remain unverified.

## Current Hogwarts costume override

The current user instruction requires Carina's Slytherin and Harry's Gryffindor Hogwarts uniform in actual motion. The [current image index](docs/prompts/images/shared-character-references.md#shared-references) selects Carina's actual uniform edit and preserves Harry's student PNG as face/identity source only. Harry's uniform-image requests failed without an output, so that PNG is not described as a uniform reference. The direct user costume instruction is independent authority for his on-screen clothing. Earlier image epochs, original proof and voice requests remain historical. The later canonical repair aligns the current brief/settings/screenplay with fifteen-year-old schoolmates and Hogwarts uniforms without retroactively renewing those proofs.

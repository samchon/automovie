# Edit, render and hand off

Use this branch to turn commissioned shots or accepted media into the actual delivered video, including a whole motion hint. A standalone asset follows [asset handoff](../review/assets.md); a screenplay-only commission requires no invented render. Read [project context](profile.md), actual source and media, and installed engine, viewer, render and ingest documentation. The production supplies its real host and adapters; a schedule or an encoder argument list is not an executed render.

## Assemble the commissioned work

Keep the required screenplay-unit, executable-shot and actual-edit relationships in the source and selected evidence under [execution traceability](../evidence/execution.md), respecting its native ownership limits. Resolve missing, duplicated or omitted required material before rendering the whole work. Use existing production records rather than maintaining another unconsumed coverage inventory. A generated-film edit consumes [accepted takes](generation.md); a hint or direct 3D film consumes its actual programmed scene output.

For a motion hint or companion controls, use [conditioning handoff](conditioning.md) to preserve their actual channel meanings, frame/camera alignment and accepted control bytes through conversion and delivery. A viewing encode or picture transition does not certify categorical or quantitative control values.

Give the edit one timeline owner. Select shots or takes, order, in/out points, transitions and intended pauses from the work's audience experience, preserving required performance and information. [Motion timing](../motion/timeline.md) owns frame schedules, shot-local time, stateful evaluation and replay. [Audio](../audio/SKILL.md) supplies accepted recordings and measured timing; place sound, captions and required mouth motion against those exact performances. A new take, trim, speed change or cut requires rechecking the affected timing and neighboring continuity. Do not use an estimate or an inaudible placeholder as the final performance.

## Prove the actual output path

Record the adopted delivery profile and budgets through [project context](profile.md): output dimensions and aspect, frame rate, required container/codec, picture/color handling, audio and caption delivery where they affect the requested consumer. Use supported tools and installed APIs rather than assuming a viewer preview, arbitrary media format or audio mixer is wired to the exporter. Document the actual source entry and run commands in README.

Before scaling a new host, execute a small representative path that reaches capture or accepted-clip ingestion, an actual join when the edit has one, required sound/captions and the encoded file. Inspect that file through the intended playback path; the probe establishes that integration only. Measure the intended load and use supported render preflights when applicable. Preserve failed reports and partial outputs as failed until their cause is corrected; a low-resolution proxy cannot establish an unobserved final profile.

Render or encode the complete commissioned scope from the admitted inputs and timeline. Inspect the final file's observed profile, frame extent, duration and included tracks against the plan, then watch and listen under [delivery review](../review/delivery.md). Check the actual first and last delivered material and both sides of edits; a preview, file existence or successful process exit does not prove a complete handoff.

For imported or generated media, map decoded presentation timestamps and source time bases into the edit. Nominal frame rate and frame count alone cannot establish when an action occurs, especially for variable-rate inputs. Record any trimming, frame dropping/duplication or interpolation, retiming and audio resampling with the accepted derivative. Timestamp rebasing and playback-speed changes are different operations; preserve intended relative sound offsets, update caption/alignment timing and inspect required action, contacts, joins and ending after either change. A shortest-stream option or silent padding must not conceal lost commissioned material. [FFmpeg's filter reference](https://ffmpeg.org/ffmpeg-filters.html) documents `trim`/`atrim`, `setpts`/`asetpts`, `fps` and `atempo`; choose their actual behavior for this edit rather than treating them as equivalent duration fixes.

## Repair and deliver

Collect the complete output-review round before fixing causes together. Route geometry and rendering defects to [3D modeling](../3d-modeling/SKILL.md), performance and clock defects to [motion](../motion/SKILL.md), sound defects to [audio](../audio/SKILL.md), generation defects to [take acquisition](generation.md), and host/source defects to [development](../development/SKILL.md). Narrative changes follow [upstream repair](../screenwriting/repair.md), preserving closed proof. Rebuild dependent outputs and inspect the complete affected scope after the repair.

Hand off the exact accepted output revision and media identities, fixed inputs, source entry, dependencies and reproducible commands with the observed checks and unresolved limits required by [delivery contracts](../contracts/delivery.md). Keep the programmed hint and generated final distinct when both were commissioned. Final acceptance belongs to delivery review; a local render or a manifest alone cannot grant it.

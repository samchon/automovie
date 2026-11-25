---
name: benchmark-campaign
description: Measures AutoMovie on real productions and traces observed failures to product or scaffold improvements.
---

# Benchmark campaign

## Examples workspace

`examples/` is the independent [AutoMovie examples repository](https://github.com/samchon/automovie-examples). Run commissions there to measure what AutoMovie delivers. Productions under `movies/shorts/` and `movies/series/` share agent instructions and each have a `PROJECT.md`.

## Scaffold wiring

If the checkout is missing, clone it at the AutoMovie root.

```powershell
git clone https://github.com/samchon/automovie-examples.git examples
```

Install root dependencies and run `pnpm run build` from the SDK checkout linked by examples.

On a fresh checkout or after a scaffold change, generate a comparison workspace from the AutoMovie root. Generate a separate comparison production when updating existing productions. Use unused paths for both.

```powershell
pnpm automovie create $unusedDirectory --workspace --name automovie-examples
pnpm automovie create $unusedProduction --name scaffold-comparison
```

Merge the generated `AGENTS.md`, `CLAUDE.md` and `.agents/skills/` into `examples/`, preserving local changes. Compare the generated dependency catalogs with examples. Update incompatible shared pins while preserving local catalog choices and the relative links to the target SDK and CLI adapter. Verify [distribution](../scaffold-prompting/verification.md#distribution).

For each affected production, compare the generated runtime files and merge the relevant changes. Check `vite.config.ts`, scripts in `package.json` and `src/executable/verify.ts`. Preserve authored source and production settings.

Run `pnpm install` and `pnpm peers check` in `examples/`. To add a production, follow its workspace README. The CLI fills missing catalog entries and leaves existing pins in place.

## Director process

Start one [director](../../../packages/template/scaffold/instructions/.agents/skills/production/director.md) process per production. Films under one brief share that director. From its directory, send the commission, user decisions and worker requirements. Use a runtime that can dispatch the required workers. Create fresh output paths in the production's ignored `.cache/` for each invocation.

Set `$model` and `$effort` from the commission or [Codex run configuration](codex-run.json). The opening `thread.started` event supplies the session ID.

```powershell
$brief | codex exec --sandbox workspace-write --enable multi_agent -m $model -c "model_reasoning_effort=$effort" --json -o $result - > $log
```

When the user selects Claude Code, use their chosen model and effort. Normal project loading lets `CLAUDE.md` import `AGENTS.md`. Use `acceptEdits` for production files and set `$allowedTools` to the approved tool rules for the commission, including agent dispatch and the verification commands it needs.

```powershell
$sessionId = [guid]::NewGuid().ToString()
$brief | claude -p --permission-mode acceptEdits --allowedTools @allowedTools --model $model --effort $effort --session-id $sessionId --verbose --output-format stream-json > $log
```

## Monitoring and resumption

Keep the session ID and observed runtime settings in the [run record](../../../packages/template/scaffold/instructions/.agents/skills/production/sustained-runs.md#actual-state). Relay the director's questions to the user. Return the answer to the same session using its runtime and monitor through handoff.

```powershell
# Codex
$answer | codex exec --sandbox workspace-write resume --enable multi_agent -m $model -c "model_reasoning_effort=$effort" --json -o $result $sessionId - > $log
# Claude Code
$answer | claude -p --permission-mode acceptEdits --allowedTools @allowedTools --model $model --effort $effort --resume $sessionId --verbose --output-format stream-json > $log
```

## Findings and improvements

Record the task, expected result, SDK revision, scaffold revision and observed artifact or log. Compare runs using the same inputs and conditions where possible.

### Blocking defects

Pause the affected production step and continue independent work. Preserve its reproducer and last valid output. Trace the cause to the scaffold or [owning package](../project/SKILL.md#packages). For a broken viewer or capture, follow [instrument restoration](../visual-debugging/capture.md#restoring-the-instrument) before proceeding with visual work.

Repair and verify the product through the failing production entry point. If the commission authorizes a patch release, follow [pull request delivery](../pull-request/SKILL.md), publish the patch and update the benchmark checkout. Repeat [scaffold wiring](#scaffold-wiring) when shipped instructions or runtime files change. Reinstall the benchmark dependencies after applying the updates.

Restart any running production viewer after reconnecting the SDK so it loads the updated packages. Verify the installed commands and dependency revisions actually used in examples. Repeat the failing case under the same conditions before resuming from the last valid output. Report the original failure, repair revision and repeated result.

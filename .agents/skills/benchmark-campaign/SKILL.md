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

Install the root dependencies and build the local SDK with `pnpm run build`. On a fresh examples checkout or after a scaffold change, generate a comparison workspace at an unused path from the AutoMovie root.

```powershell
pnpm automovie create $unusedDirectory --workspace --name automovie-examples
```

Merge the generated `AGENTS.md`, `CLAUDE.md` and `.agents/skills/` into `examples/`, preserving local changes. Verify [distribution](../scaffold-prompting/verification.md#distribution).

Run `pnpm install` in `examples/`. Add a production with `pnpm automovie add shorts/<name>` or `pnpm automovie add series/<name>`, then reinstall. The scaffold fills missing dependency catalog entries and uses the linked checkout for new SDK packages.

## Director process

Start one [director](../../../packages/template/scaffold/instructions/.agents/skills/production/director.md) process per production. Films under one brief share that director. From its directory, send the commission, user decisions and worker requirements. Use a runtime that can dispatch the required workers. Create fresh output paths in the production's ignored `.cache/` for each invocation.

Use the [Codex model and effort](codex-run.json) by default. The opening `thread.started` event supplies the session ID.

```powershell
$brief | codex exec --sandbox workspace-write -m $model -c "model_reasoning_effort=$effort" --json -o $result - > $log
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
$answer | codex exec --sandbox workspace-write resume -m $model -c "model_reasoning_effort=$effort" --json -o $result $sessionId - > $log
# Claude Code
$answer | claude -p --permission-mode acceptEdits --allowedTools @allowedTools --model $model --effort $effort --resume $sessionId --verbose --output-format stream-json > $log
```

## Findings and improvements

Report what succeeded and what failed. Record the revision, task, expected result and observed artifact or log. Trace failures to the scaffold or [owning package](../project/SKILL.md#packages) and repeat the failing case after repair. For comparisons, identify which inputs and conditions stayed the same.

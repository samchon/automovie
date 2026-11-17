# Launching workers

The coordinator prepares each production, starts every writer and reviewer as its own process, and assigns each its write scope.

## Prepare

Establish each production's state as its [sustained runs guide](../../../packages/template/scaffold/instructions/.agents/skills/production/sustained-runs.md#actual-state) requires, reading its AGENTS and PROJECT as well. Install or prepare only what is missing or stale, and reset no valid saved stage or verdict.

## Launch workers as processes

Start each writer and each reviewer as a new CLI process with a new session in the production's directory, never as a subagent of the coordinator. Only the observer is a subagent, because it authors nothing in a production.

A subagent runs inside the coordinator's session, directory, runtime and permissions, so it cannot take the production as its own project or run on another runtime, and once stopped it leaves no session to resume. Malfoy's film owners, run as subagents, stopped mid-film with their evidence and review steps undone.

### The brief

The brief names:

- the working path, role and requested scope;
- the film or module;
- the production's AGENTS, the owning skill and the completion condition it sets;
- the user's instructions;
- the current edition and its unresolved conditions;
- the [run record](run-records.md) path, where the worker confirms its own role, session and model.

Earlier verdicts reach a worker only in the order the production's independent reading sets.

### The command

Keep the user's model, runtime, effort, independence and observation interval. Check the installed CLI's options with `claude --help` or `codex exec --help` before each launch rather than recalling flags.

Launch so that the worker can work, be found and be resumed:

| Need | How |
| --- | --- |
| The production's instructions load | Its CLAUDE.md or AGENTS.md is discovered, which Claude's `--bare` mode prevents |
| The worker may write | The write access and permission mode the user allows for the role |
| The session is saved | No Codex `--ephemeral` |
| The observer can find the process | A unique run marker among the process's own arguments |
| The run leaves a log | Background execution with its event stream, written to a log named for the run |

A run marker is Claude's `--session-id` with a UUID you generate, or Codex's `-o` with a file named for the run. An event stream is Claude's `--output-format stream-json --verbose` or Codex's `--json`, and its log sits under the production's ignored `.cache/`.

Without a granted mode a worker fails quietly: a Claude print run denies every call that needs approval unless a mode or rule allows it, and a Codex exec run is read-only by default.

## Roles and write scope

Assign film and module writers as the production's sustained runs guide divides them, one writer at a time per changing body. A reviewer writes only review records and its own run-record lines, never a body, and an evidence answerer only evidence answers, its gap list and its run-record lines.

The coordinator writes when no writer is assigned. Repairs to shared packages, skills and programs go to their repository owner.

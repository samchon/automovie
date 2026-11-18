# Launching workers

## Prepare

Establish each production's state as its [sustained runs guide](../../../packages/template/scaffold/instructions/.agents/skills/production/sustained-runs.md#actual-state) requires, reading its AGENTS and PROJECT as well. Install or prepare only what is missing or stale, and reset no valid saved stage or verdict.

## Launch workers as processes

Launch each writer and reviewer as a new CLI session in the production's directory. Use a subagent only for the observer.

Separate CLI sessions give workers the production's directory, runtime and permissions and allow them to resume.

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

Keep the user's model, runtime, effort, independence and observation interval. Read `claude --help` or `codex exec --help` before launch.

Configure the following for each launch:

| Need | How |
| --- | --- |
| The production's instructions load | Its CLAUDE.md or AGENTS.md is discovered, which Claude's `--bare` mode prevents |
| The worker may write | The write access and permission mode the user allows for the role |
| The session is saved | No Codex `--ephemeral` |
| The observer can find the process | A unique run marker among the process's own arguments |
| The run leaves a log | Background execution with its event stream, written to a log named for the run |

For Claude use a UUID in `--session-id` and `--output-format stream-json --verbose`. For Codex use a run-specific `-o` and `--json`. Log under the production's ignored `.cache/`.

Without a granted mode a worker fails quietly: a Claude print run denies every call that needs approval unless a mode or rule allows it, and a Codex exec run is read-only by default.

## Roles and write scope

Assign one writer per changing body under sustained runs. Reviewers write only review records and their own run entries. Answerers write only Evidence answers, gaps and their own run entries.

The coordinator writes when no writer is assigned. Repairs to shared packages, skills and programs go to their repository owner.

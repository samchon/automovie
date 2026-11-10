# Launching workers

How the coordinator prepares a campaign, launches its workers and keeps their records.

## Prepare

Establish each production's actual state as its campaign guide requires, reading its AGENTS and PROJECT as well. Install or prepare only what is missing or stale. Starting a campaign resets no valid saved stage or verdict.

## Launch workers as processes

Start each writer and each reviewer as a new CLI process with a new session in the production's directory, never as a subagent of the coordinator. Only the [observer](observing-runs.md) is a subagent, because it authors nothing in a production.

A subagent runs inside the coordinator's session, directory, runtime and permissions. It cannot take the production as its own project or run on another runtime, and once stopped it leaves no session of its own to resume. Malfoy's film owners, run as subagents, stopped mid-film with their evidence and review steps undone.

### The brief

The brief names:

- the working path, role and requested scope;
- the film or module;
- the production's AGENTS, the owning skill and the completion condition it sets;
- the user's instructions;
- the current edition and its unresolved conditions;
- the run record path, where the worker confirms its own role, session and model.

Earlier verdicts reach a worker only in the order [review](connecting-review.md) allows.

### The command

Keep the user's model, runtime, effort, independence and observation interval. Check the installed CLI's options with `claude --help` or `codex exec --help` before each launch rather than recalling flags.

Launch so that the worker can actually work, be found and be resumed:

| Need | How |
| --- | --- |
| The production's instructions load | Its CLAUDE.md or AGENTS.md is discovered, which Claude's `--bare` mode prevents |
| The worker may write | The write access and permission mode the user allows for the role |
| The session is saved | No Codex `--ephemeral` |
| The observer can find the process | A unique run marker among the process's own arguments, such as Claude's `--session-id` with a UUID you generate or Codex's `-o` with a file named for the run |
| The run leaves a log | Background execution with its event stream, such as Claude's `--output-format stream-json --verbose` or Codex's `--json`, written to a log named for the run under the production's ignored `.cache/` |

Without a granted mode a worker fails quietly: a Claude print run denies every call that needs approval unless a mode or rule allows it, and a Codex exec run is read-only by default.

## Record each run

Every worker, the observer and the coordinator add to the shared run record by appending whole lines, such as with `>>`, never by rewriting the file. A rewrite drops the lines others wrote meanwhile, including those the coordinator's monitor waits on.

Record each run's input, output, working path, actual role, requested model, confirmed model, runtime, effort, actual session or process identifier, start, end and exit status. Link the logs and results rather than copying them.

Take the role from the brief, not from a report heading. Take the session identifier and model from the CLI's own records:

- Claude's `system/init` event carries both;
- a Codex run's `thread.started` event names the `thread_id` whose session file under `~/.codex/sessions/` records the model.

A model those records do not show stays unconfirmed and is left out of model comparisons.

### Resuming

Resume a CLI run by its actual session identifier, keep the earlier output and write the result to a new file. A resume brief supplies only unread or changed material and the tool results the current task needs, because that session already holds what it read.

### Handoff

Update the run record at each launch, submission, verdict, failure, repair and handoff with paths, editions, current acceptance, remaining work and the next action. A successor must find the first action without the private session.

Link each submission to its original verdict and the author's decision per finding, and each run failure to its resumption. When correcting a record, keep the original text and the grounds for the change.

Keep failed, unperformed and unconfirmed checks distinct, and leave secrets and raw transcripts out. Working memory owns no settings, contracts or approvals.

## Roles and write scope

Assign film and module writers as the production's campaign guide divides them, one writer at a time per changing body. Reviewers write only review records and their own run-record lines, and never edit bodies. The coordinator writes when no writer is assigned. Repairs to shared packages, skills and programs go to their repository owner.

## Missing capabilities and viewers

A missing capability that a real authoring or playback task exposes is work to complete, not a reason to lower the commission or hide a local substitute. Trace it through [project ownership](../project/SKILL.md#packages), implement and validate it through [development](../development/SKILL.md), then reconnect its actual production consumer.

Use [scaffold](../scaffold/SKILL.md) for explicit instruction sync; source, configuration and contract migrations remain deliberate project changes.

Apply the production's viewer recovery priority before continuing dependent creative or visual judgments. A working preview does not certify capture, encoded-video playback or final delivery. Follow the exact failing path through repair and report observed and unperformed checks separately.

## Compare

Before a requested comparison, state the input revisions, changed conditions, protected achievements, judge and evaluation question; an observation without that declaration is exploratory.

Report the installed instructions and per-production differences, condition changes, ownership violations and missing controls, and claim only what the actual comparison supports. A film's quality is judged by its production's delivery review over the actual captures and encoded video, not by passing tests or compilation.

## Git ownership

Each worker stages only its own paths and never mixes in or unstages another worker's staged changes, because workers share one index and a commit takes whatever is staged.

Hold an atomic lock in the common Git directory from staging through commit, with an owner file naming your role and run marker, then release only your own lock:

```bash
lock="$(git rev-parse --git-common-dir)/campaign.lock"
mkdir "$lock" && echo "<role> <run marker>" > "$lock/owner"
```

Wait while a lock is held. Only the observer removes another run's lock, after confirming that the run named in its owner file has no process.

Codex's `workspace-write` sandbox keeps `.git` and `.agents` read-only, so a Codex worker under it neither stages, takes the lock nor commits. It reports its paths, and the coordinator stages and commits them under the lock unless the user grants the worker broader access.

Another worker's unstaged changes or an unrelated production's failing build do not block a film. Commit and push authority follows AGENTS and the [pull-request](../pull-request/SKILL.md) skill.

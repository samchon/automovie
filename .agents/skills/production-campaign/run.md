# Run

## Prepare

Before assigning work, read each production's AGENTS, PROJECT, current bodies, source, installed instructions and run record, and the Git history, findings and failed logs that explain a repeated failure. Install or prepare only what is missing or stale. Starting a campaign resets no valid saved stage or verdict.

## Launch workers as processes

Start each writer and each reviewer as a new CLI process with a new session, never as a subagent of the coordinator. This is a repository rule for running productions from this repository; it does not ship with the scaffold, whose users run their productions their own way. A subagent shares the coordinator's context and ends with its turn, so it skips the production's own AGENTS and workflow and leaves no session to resume; a Malfoy film owner run as a subagent skipped its production's workflow this way. Only the [observer](observe.md) is a subagent.

The brief names the working path, role, requested scope, the film or module, the production's AGENTS, the owning skill, the completion condition from the production's delivery review, the user's instructions, the current edition and its unresolved conditions. Earlier verdicts reach a worker only in the order [review](review.md) allows.

Keep the user's model, runtime, effort, independence and observation interval. Check the installed CLI's options with `claude --help` or `codex exec --help` before each launch rather than recalling flags, run it in the background and send its output to a log under the production's ignored `.cache/`.

## Record each run

Record in the production's run record each run's input, output, working path, role, requested model, confirmed model, runtime, effort, actual session or process identifier, start, end and exit status. Confirm the model from the CLI's own output; an unconfirmed model stays unconfirmed and is left out of model comparisons.

Resume a CLI run by its actual session identifier, keep the earlier output and write the result to a new file. A resume brief supplies only unread or changed material and the tool results the current task needs, because that session already holds what it read.

## Roles and write scope

Each film has one writer at a time, its film owner, and entity, motion and staging modules can each have an owner, as the production's campaign guide assigns. Reviewers write only review records and never edit bodies. The coordinator writes when no writer is assigned. Repairs to shared packages, skills and programs go to their repository owner.

## Missing capabilities and viewers

When a real authoring or playback task exposes a missing capability, trace it through [project ownership](../project/SKILL.md#packages), implement and validate it through [development](../development/SKILL.md), then reconnect its actual production consumer. Use [scaffold](../scaffold/SKILL.md) for explicit instruction sync; source, configuration and contract migrations remain deliberate project changes. A missing capability is work to complete, not a reason to lower the commission or hide a local substitute.

Apply the production's viewer recovery priority before continuing dependent creative or visual judgments. A working preview does not certify capture, encoded-video playback or final delivery. Follow the exact failing path through repair and report observed and unperformed checks separately.

## Compare

Before a requested comparison, state the input revisions, changed conditions, protected achievements, judge and evaluation question; an observation without that declaration is exploratory. Report the installed instructions and per-production differences, condition changes, ownership violations and missing controls, and claim only what the actual comparison supports. Judge a film from its captured frames and encoded video; passing tests and compilation do not establish its quality.

## Record and hand off

Update the run record at each launch, submission, verdict, failure, repair and handoff with paths, editions, actual outputs, test and capture results, current acceptance, remaining work and the next action. Link each submission to its original verdict and the author's decision per finding, and each run failure to its resumption. A successor must find the first action without the private session. Keep failed, unperformed and unconfirmed checks distinct, and leave secrets and raw transcripts out.

## Git ownership

Each worker stages only its own paths and never mixes in or unstages another worker's staged changes. Serialize concurrent commits with an atomic lock in the common Git directory, such as `mkdir "$(git rev-parse --git-common-dir)/campaign.lock"`, release only your own lock and leave a live or unowned one in place. Another worker's unstaged changes or an unrelated production's failing build do not block a film. Commit and push authority follows AGENTS and the [pull-request](../pull-request/SKILL.md) skill.

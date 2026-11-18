# Run records

The run record is the one shared file where every worker, the observer and the coordinator write what each run did.

## Appending

Append complete lines to preserve concurrent entries.

## What each run records

Record each run's input, output, working path, role, requested model, confirmed model, runtime, effort, session or process identifier, start, end and exit status. Link the logs and results rather than copying them.

Take roles from the brief. Confirm session and model from Claude's `system/init` or the Codex session file for `thread.started`'s `thread_id` under `~/.codex/sessions/`. Exclude unconfirmed models from comparisons.

## Resuming

Resume by session ID. Keep the earlier output and use a new output file. Give the session only new or changed material and the tool results it needs.

## Handoff

At launch, submission, verdict, failure, repair and handoff, record the paths, versions, acceptance, remaining work and next action.

Link each submission to its original verdict and the author's decision per finding, and each run failure to its resumption. When correcting a record, keep the original text and the grounds for the change.

Keep failed, unperformed and unconfirmed checks distinct, and leave secrets and raw transcripts out. Working memory owns no settings, contracts or approvals.

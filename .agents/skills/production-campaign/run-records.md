# Run records

The run record is the one shared file where every worker, the observer and the coordinator write what each run did.

## Appending

Add to the run record by appending whole lines, such as with `>>`, never by rewriting the file. A rewrite drops the lines others wrote meanwhile, including those the coordinator's monitor waits on.

## What each run records

Record each run's input, output, working path, actual role, requested model, confirmed model, runtime, effort, actual session or process identifier, start, end and exit status. Link the logs and results rather than copying them.

Take the role from the brief, not from a report heading. Take the session identifier and model from the CLI's own records:

- Claude's `system/init` event carries both;
- a Codex run's `thread.started` event names the `thread_id` whose session file under `~/.codex/sessions/` records the model.

A model those records do not show stays unconfirmed and is left out of model comparisons.

## Resuming

Resume a CLI run by its actual session identifier, keep the earlier output and write the result to a new file. A resume brief supplies only unread or changed material and the tool results the current task needs, because that session already holds what it read.

## Handoff

Update the run record at each launch, submission, verdict, failure, repair and handoff with paths, editions, current acceptance, remaining work and the next action. A successor must find the first action without the private session.

Link each submission to its original verdict and the author's decision per finding, and each run failure to its resumption. When correcting a record, keep the original text and the grounds for the change.

Keep failed, unperformed and unconfirmed checks distinct, and leave secrets and raw transcripts out. Working memory owns no settings, contracts or approvals.

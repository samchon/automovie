# Observing runs

Assign one observer subagent to monitor launched runs and recover stopped ones.

## Coordinator

When launching the observer, list for each run:

- the marker in its process command line;
- its log and output locations;
- its completion and intended-stop markers;
- the resume command by session identifier, skipping finished stages.

Provide the same details for each new run. Watch for `ATTENTION` or no observer update for two intervals. Relay attention items to the user and replace an ended or stale observer.

## Tick

Check at the user's interval, or every 15 minutes by default, until all runs end.

1. For each run, check the process list, the log's last progress and the outputs.
2. Write one line per run to the run record, with its state and its last log line.
3. Revive a run whose failure is proven in the same tick, without waiting for the coordinator.
4. Mark with `ATTENTION` the line of a run the coordinator must report.

Record running, complete, resumed, waiting or unrecoverable. Mark meaningful progress, completion, a user decision or an unrecoverable failure with `ATTENTION`. Report each marked change once.

## Failure and resumption

Treat a run as failed only when its process is gone, its log has stopped beyond its usual gap and it has no completion or intended-stop marker.

Confirm the cause, ended process and outputs to preserve. Resume once and verify the new process started.

In a campaign, replace a writer that cannot resume. Give the replacement the production and run record and apply the sustained runs verdict rules. For observation only, mark `ATTENTION` and keep the stopped run. Relaunch reviewers under [connecting review](connecting-review.md#launch-the-reviewer).

Record intended stops, including user cancellations, and start no replacement.

Remove a stale Git lock as [Git ownership](git-ownership.md#the-lock) allows. Leave unrelated productions, paths and processes alone, and take no commit, publication or merge authority from observation.

## Report

Report each final state, resumption and remaining blocker in the user's language.

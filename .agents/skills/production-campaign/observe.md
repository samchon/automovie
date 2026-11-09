# Observe

While a campaign runs, one subagent of the coordinator observes every launched run and revives a stopped one itself. A script or scheduled task does not replace it, because a configured timer neither proves that a check ran nor can judge a failure and resume a session.

## Coordinator

When launching the observer, list for each run:

- the marker in its process command line;
- its log and output locations;
- its completion and intended-stop markers;
- the resume command by actual session identifier, skipping finished stages.

Add the same items when a new run starts. If the observer ends or misses a tick, launch a new one immediately.

## Tick

Run one tick every 15 minutes, or at the user's interval, waiting between ticks with a timed wait, and keep going while any run remains.

1. For each run, check the process list, the log's last progress and the outputs.
2. Write one line per run to the run record: running, complete, resumed or unrecoverable, with its last log line.
3. Revive a run whose failure is proven in the same tick, without waiting for the coordinator.

## Failure and resumption

A failure is proven only when the process is gone, the log has stopped for well past its usual gap, and neither a completion nor an intended-stop marker exists. A quiet or slow run, or one waiting on a user decision or a review, has not failed.

Before resuming, confirm that the old run ended, which outputs to keep and the cause. Issue the resume command once, confirm the new process started and move to the next tick; never run the same work twice. If the session cannot be resumed, start a new process that reads the production and its run record and takes over.

Report an intended stop with its marker instead of reviving it. A retry count or a missed record line does not stop the film. Leave unrelated productions, paths and processes alone.

## Report

When every run has ended or cannot be revived, report each run's final state, what was resumed and why any run could not be, briefly and in the user's language.

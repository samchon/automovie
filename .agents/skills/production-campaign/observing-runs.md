# Observing runs

While a campaign runs, one subagent of the coordinator observes every launched run and revives a stopped one itself. A script or timer does not stand in for it, because a timer neither proves that a check ran nor can judge a failure and resume a session.

## Coordinator

When launching the observer, list for each run:

- the marker in its process command line;
- its log and output locations;
- its completion and intended-stop markers;
- the resume command by session identifier, skipping finished stages.

Add the same items when a new run starts. Keep your own timed wait on the run record, such as a monitor that wakes on an `ATTENTION` line or when the observer's last line is older than two intervals. Relay an attention line to the user, and replace an observer that has ended or gone stale at once.

## Tick

Run one tick every 15 minutes, or at the user's interval, and keep going while any run remains. Wait between ticks with a timed wait the runtime allows, such as a monitor that ends at the next tick.

1. For each run, check the process list, the log's last progress and the outputs.
2. Write one line per run to the run record, with its state and its last log line.
3. Revive a run whose failure is proven in the same tick, without waiting for the coordinator.
4. Mark with `ATTENTION` the line of a run the coordinator must report.

A run's state is running, complete, resumed, waiting or unrecoverable. A line takes the mark when its run became complete, waiting on a user decision or unrecoverable, or made meaningful progress since its last mark, so the coordinator reports it once and now rather than every tick or at the end.

## Failure and resumption

A failure is proven only when the process is gone, the log has stopped well past its usual gap, and neither a completion nor an intended-stop marker exists. A quiet or slow run, or one waiting on a user decision or a review, has not failed.

Before resuming, confirm that the old run ended, which outputs to keep and the cause. Issue the resume command once, confirm the new process started and move to the next tick; never run the same work twice.

A session that cannot be resumed is handled by role. Under a campaign, a new writer process reads the production and its run record and takes over, with verdicts standing as the production's sustained runs guide sets for a restart. Under a request only to observe, mark the writer's run `ATTENTION` and start nothing. Relaunch a reviewer fresh as [connecting review](connecting-review.md#launch-the-reviewer) describes.

Report an intended stop with its marker instead of reviving it; a user's cancellation is one, and after it the observer starts no work. A retry count or a missed record line does not stop the film.

Remove a stale Git lock as [Git ownership](git-ownership.md#the-lock) allows. Leave unrelated productions, paths and processes alone, and take no commit, publication or merge authority from observation.

## Report

When every run has ended or cannot be revived, report each run's final state, what was resumed and why any run could not be, briefly and in the user's language.

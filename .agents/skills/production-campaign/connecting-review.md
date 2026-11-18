# Connecting review

Production [review](../../../packages/template/scaffold/instructions/.agents/skills/review/SKILL.md) owns verdicts, repair and acceptance. Follow its [independent reading](../../../packages/template/scaffold/instructions/.agents/skills/review/independent-reading.md) for model choice and reading order. Preserve the verdict verbatim.

## Submit

Record production, target, pass, base commit, submitted file hashes and test results. For motion and film include captures and any encoded output with their digests.

Verify submitted bytes before review. If they differ, correct the review input. Other checkout changes do not block it.

## Launch the reviewer

Start the review as a new CLI process with a new session, launched as [launching workers](launching-workers.md#launch-workers-as-processes) describes, on the independent reading's model unless the user names another.

Have the reviewer inspect the whole submission and, for films, dense consecutive frames. Pass parents, contracts, records and earlier verdicts in independent-reading order.

## Relay and re-review

Send the verbatim verdict to the writer for a decision on each finding. Link each finding to the decision, repair and any later review the route requires.

Resume the round's reviewer to rebut or withdraw a declined finding, then return it to the writer for final decision. Run later [short](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/short.md#steps) or [long](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/long.md#each-layers-pass) rounds in fresh processes.

Start the Evidence answerer before narrative review. It writes answers, reports gaps to the writer and updates answers after repairs where the route requires. Keep answers out of review.

Check the submission, scope, frames read and required records. A partial review or another edition's verdict is not current acceptance, and a repeated handled finding or a missing reply is not a new verdict.

Record the submissions, verdicts and author decisions as the run record's [handoff](run-records.md#handoff) sets; resumption and liveness follow the observing-runs page. Confirm completion by the review and repair the production requires.

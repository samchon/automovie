# Connecting review

The production's [review](../../../packages/template/scaffold/instructions/.agents/skills/review/SKILL.md) owns verdicts, repair and current acceptance, including its [independent reading](../../../packages/template/scaffold/instructions/.agents/skills/review/independent-reading.md), [narrative rounds](../../../packages/template/scaffold/instructions/.agents/skills/review/narrative-rounds.md) and [delivery review](../../../packages/template/scaffold/instructions/.agents/skills/review/delivery-review.md). The campaign connects a fixed submission to an independent reviewer and keeps the verdict verbatim.

## Submit

Fix the submission in its request: production, layer or film or module, pass, base commit, the submitted files with their content hash, and the test and capture results. Motion and film work add the captured frames and encoded film with their digests.

Check that the tree the reviewer reads matches the submitted bytes. Other changes in the same checkout or a moved HEAD do not block a review whose target bytes are unchanged; when the bytes differ, correct that review's input rather than forcing the checkout.

## Launch the reviewer

Start the review as a new CLI process with a new session, launched as [launching workers](launching-workers.md#launch-workers-as-processes) describes, on the model the production's independent reading sets unless the user names another. Have it read the whole submission, and for motion and film work read the actual frames, and the film as dense consecutive frames, receiving parents, contracts, author records and earlier verdicts only in the order that reading sets, so they cannot steer its own judgment.

## Relay and re-review

Relay the reviewer's verdict verbatim to the writer, ask for its decision on each finding rather than telling it to repair them all, and link each finding to that decision, its repair and any later round its route sets. Repairing every finding wholesale kept a short's screenplay open for seven rounds.

For a finding the writer declines, resume that round's reviewer session for its rebuttal or withdrawal and pass that back to the writer's session for a final decision. A narrative pass then runs the rounds its route sets, the [short](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/short.md#steps) or [long](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/long.md#each-layers-pass) route, and each later round goes to a fresh reviewer process.

Before a narrative pass goes to review, start its evidence answerer as its own process. It writes the answers and hands the writer the gaps it cannot answer truthfully, and brings them up to date after the repairs only where the route says so. Never ask a reviewer to audit answers.

Check the submission, scope, frames read and required records. A partial review or another edition's verdict is not current acceptance, and a repeated handled finding or a missing reply is not a new verdict.

Resumption and liveness follow [observing runs](observing-runs.md). Record the submissions, verdicts and author decisions, and confirm completion by the review and repair the production requires.

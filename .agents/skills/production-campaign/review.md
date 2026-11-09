# Review connection

The production's [review](../../../packages/template/scaffold/.agents/skills/review/SKILL.md) and [delivery review](../../../packages/template/scaffold/.agents/skills/review/delivery.md) own verdicts, repair and current acceptance. The campaign connects a fixed submission to an independent reviewer and keeps the verdict verbatim.

## Submit

Fix the submission in its request: production, film or module, base commit, source paths with their content hash, captured frames and encoded film with their digests, and test and capture results. Check that the tree the reviewer reads matches the submitted bytes. Other changes in the same checkout or a moved HEAD do not block a review whose target bytes are unchanged; when the bytes differ, correct that review's input rather than forcing the checkout.

## Launch the reviewer

Start the review as a new CLI process with a new session, on the model the production or the user names. Have it read the whole submission and watch the actual frames and film in the order the production's review requires. Keep the author's own judgments and earlier verdicts apart from the submission metadata and give them only after the reviewer records its own reading, so they cannot steer it.

## Relay and re-review

Relay the reviewer's verdict verbatim to the writer, and link each finding to the writer's decision, repair and re-review. For a finding the writer rejects or partly accepts, resume the reviewer's actual session for its reply and pass that back to the writer's session, until the production's review ends the exchange. Check the submission, scope, frames read, citations and required records; a partial review or another edition's verdict is not current acceptance, and a repeated handled finding or a missing reply is not a new verdict.

Resumption and liveness follow [observe](observe.md). Record the submissions, verdicts and author decisions, and confirm completion by the review and repair the production requires.

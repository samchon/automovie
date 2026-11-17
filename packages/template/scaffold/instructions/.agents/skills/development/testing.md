# Testing

Give each module the production writes millisecond-scale unit tests of its own logic, with expectations taken from the settings or brief facts, the screenplay, a study or another independent reference, as the [testing checklist](../contracts/development/testing.md) requires. Test what the production itself decides: that each scene's resolved schedule yields the outcomes its screenplay beats decide, that another seed keeps those outcomes, and that a resolved state hashes the same on every run.

A rule or table the production adds, such as which actions a practice allows, is tested on its own inputs.

Test geometry operators on made inputs as 3D modeling's [construction](../3d-modeling/crafting/construction.md#tests) describes. The installed packages own the validation of authored data, so call it rather than writing or testing another.

## Motion checks

A production law takes the bounded checks [motion verification](../motion/laws/verification.md) lists: evaluate the resolved plan at its event times and assert each bound on the result, across the bodies the [relational goals](../contracts/development/behaviors.md#relational-goals) item requires.

A test that needs a person takes a body the installed human package prepares at fixed parameters, without drawing it. Preparing a body can be slow, so prepare each one once per run and share it between tests.

The installed motion vocabulary tests its own actions, so a production adds no test or report for them.

## What a test is not

Beyond what the testing checklist excludes, a production test never monkey-patches globals or internals and never replays recorded fixtures. What only a picture shows belongs to the catalog case's stills, and rendered pictures, decoded media and anything the user watches or hears to the [acceptance record](../review/delivery-review.md#acceptance-record), not to a test.

## Files and runs

Write cases where and as the README's test section sets, with the assertion helpers it names, and keep helpers outside the test files or unexported. Each exported test function answers the testing checklist.

Run the suite, or a selection of it, with the README's test command. An empty suite, an invalid or unmatched selection, or an import or test failure leaves the run unsuccessful; report the executed cases and totals.

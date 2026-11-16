# Testing

Give each module millisecond-scale unit tests of its pure logic, with expectations taken from the settings or brief facts, the research laws or another independent reference, as the [testing checklist](../contracts/development/testing.md) requires. Test what the chain promises:

- each research outcome table is consistent, and every screenplay outcome is one it permits;
- a composition is legal;
- each scene's resolved schedule yields its screenplay outcome classes;
- goals reach the counterpart's actual region;
- every seed keeps the outcome classes;
- a resolved state hashes the same on every run.

Test geometry operators on made inputs as 3D modeling's [construction](../3d-modeling/crafting/construction.md#tests) describes. The installed packages own the validation of authored data, so a production calls it rather than writing or testing its own.

## Motion checks

A production law takes the bounded checks [motion verification](../motion/laws/verification.md) lists: evaluate the resolved plan at its event times and assert each bound on the result, across the bodies the [behavior statements](../contracts/development/statements/behaviors.md#relational-goals) require.

A test that needs a person takes a body the installed human package prepares at fixed parameters, without drawing it. Preparing a body can be slow, so prepare each one once per run and share it between tests.

The installed motion vocabulary checks its own actions, so a production does not test them again. A production's test of a composition asserts only the value [a person's case](../motion/catalog-cases.md#a-persons-case) names.

## What a test is not

Beyond what the [testing checklist](../contracts/development/testing.md) excludes, a production test never monkey-patches globals or internals and never replays recorded fixtures. What only a picture shows belongs to the stills of the [catalog case](../motion/catalog-cases.md), and rendered pictures, decoded media and anything the user watches or hears to the [acceptance record](../review/delivery-review.md#acceptance-record), not to a test.

## Files and runs

Write cases where and as the README's test section sets, with the assertion helpers it names, and keep helpers outside the test files or unexported. Each exported test function answers the testing checklist.

Run the suite, or a selection of it, with the README's test command. An empty suite, an invalid or unmatched selection, or an import or test failure leaves the run unsuccessful; report the executed cases and totals.

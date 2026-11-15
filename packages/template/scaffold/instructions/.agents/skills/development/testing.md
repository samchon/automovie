# Testing

Give each module millisecond-scale pure logic unit tests for its behavioral contract, with explicit in-memory inputs and expectations taken from the settings or brief facts, the research laws, or another independent reference. Installed packages own their validation APIs.

Test what the chain promises: that each research outcome table is consistent and every screenplay outcome is one it permits, that a composition is legal, that each scene's resolved schedule yields its screenplay outcome classes, that goals reach the counterpart's actual region, that every seed keeps the outcome classes, and that a resolved state hashes the same on every run.

Test geometry operators on made inputs as 3D modeling's [construction](../3d-modeling/crafting/construction.md#tests) describes.

## Motion checks

The bounded checks [motion verification](../motion/laws/verification.md) lists belong here for a production law: evaluate the resolved plan at its event times and assert each bound on the result, across the bodies the [behaviors statements](../contracts/development/statements/behaviors.md#relational-goals) require.

A test that needs a person takes a body the installed human package prepares at fixed parameters, without drawing it. Preparing a body can be slow, so prepare each one once per run and share it between tests.

The installed motion vocabulary checks its own actions, so a production does not test them again. A production's test of a composition asserts only the value [a person's case](../motion/catalog-cases.md#a-persons-case) names. What only a picture shows belongs to the stills of the [catalog case](../motion/catalog-cases.md), not to a test.

## What a test is not

The [testing checklist](../contracts/development/testing.md) sets what a test may not be, and a production test also never monkey-patches globals or internals or replays recorded fixtures. Rendered pictures, decoded media and anything the user watches or hears are production acceptance, recorded in the [acceptance record](../review/delivery-review.md#acceptance-record), not tests.

## Files and runs

Write cases where and as the README's test section sets, with the assertion helpers it names, and keep helpers outside the test files or unexported. Each exported function answers the [testing checklist](../contracts/development/testing.md).

Run the suite, or a selection of it, with the README's test command. An empty suite, invalid or unmatched selection, or import or test failure leaves the run unsuccessful; report the executed cases and totals.

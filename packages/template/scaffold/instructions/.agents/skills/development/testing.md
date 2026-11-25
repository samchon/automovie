# Testing

Test each production module's own logic in milliseconds under the [testing checklist](../contracts/development/testing.md). Use independent settings, brief, screenplay or study expectations. Verify scripted outcomes across seeds and stable state hashes across repeated runs.

Test a rule or table on its own input domain.

Test geometry operators on made inputs under [construction](../3d-modeling/crafting/construction.md#tests). Reuse installed validators for authored data.

## Motion checks

A production law takes the bounded checks [motion verification](../motion/laws/verification.md) lists: evaluate the resolved plan at its event times and assert each bound on the result, across the bodies the [relational goals](../contracts/development/behaviors.md#relational-goals) item requires.

A test that needs a person takes a body the installed human package prepares at fixed parameters, without drawing it. Preparing a body can be slow, so prepare each one once per run and share it between tests.

The installed motion vocabulary tests each action's internal mechanics. Test the choices and coordination the production authors. Inspect the performance in its scene interval, or in a [separate case](../motion/catalog-cases.md#capture-and-review) when its conditions need independent review.

## What a test is not

Exercise real code without monkey-patching globals or internals or replaying recorded fixtures. Inspect visible results in [captured stills](../visual-debugging/capture.md#times) from the scene, separate case or standalone asset view under review. Record media inspection and user observations in the [handoff or film acceptance record](../review/delivery-review.md#acceptance-record) or, for a separate catalog, its [catalog record](../motion/catalog-cases.md#record).

## Files and runs

Write cases where and as the README's test section sets, with the assertion helpers it names, and keep helpers outside the test files or unexported. Each exported test function answers the testing checklist.

Run the suite, or a selection of it, with the README's test command. An empty suite, an invalid or unmatched selection, or an import or test failure leaves the run unsuccessful; report the executed cases and totals.

## Finishing a change

Read compile errors from the README's single running checker. Finish source work with the README's lint, Evidence and test commands. Verify preserved and changed behavior through the [actual consumer](../review/source-review.md#the-actual-consumer), using affected stills and user observations where the change requires them.

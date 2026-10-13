# Test Contracts

Answer for every test from its actual assertions and execution path. A passing run is not an answer.

## Behavioral verification

Run the behavior and assert its observable result. State the operation exercised, the defect the assertions catch, and the valid behavior they allow. Checks of repository arrangement, such as a file existing, a template, manifest, or document containing a string or a list, a workflow having a step, source matching a pattern, or two files agreeing, are not tests; delete them. Replacing a global, a foreign method, or module internals to steer the code under test is not a test either; drive it through the product's own inputs and injection seams.

## Independent expectations

Derive expected values from the supported contract, a specification, or an independent calculation, never from the implementation under test, its constants, or a snapshot of its output. State that basis, how the assertion would catch a wrong implementation, and any oracle limitation.

## Distinguishing cases

Cover the decisions the test owns with positive, negative, and boundary cases: input that must change and meaning that must stay, an adjacent supported input where a refusal must not fire, and empty, singleton, exact-limit, degenerate, malformed, and failure cases where relevant. State this test's contribution and the cases another test owns. Never weaken assertions or drop cases to save time.

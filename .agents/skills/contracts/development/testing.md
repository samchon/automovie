# Testing

Use a pure unit test for each independently verifiable contract. Judge it at the entry the test runner discovers.

## Behavioral verification

Does the test exercise the operation that owns the behavior with direct typed inputs?

Call the operation on the smallest in-memory fixture that makes the behavior observable. Test a composition's decisions with prepared inputs and exercise its parts directly.

Use the relevant system check when the contract requires physical simulation, a complete scene, rendering or a host process.

## Independent expectations

Would the expected results distinguish correct behavior from a plausible defect?

Derive expectations from the contract, a closed form, a physical requirement or a cited reference. Bound numerical error independently of observed output.

Choose cases that expose distinct decisions, including adjacent boundaries or refusals where they matter. Keep the assertion that catches each defect when reducing execution cost.

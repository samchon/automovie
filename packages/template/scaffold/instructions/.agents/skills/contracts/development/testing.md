# Testing

Judge each test at the entry the runner discovers, including cases registered by a shared harness.

## Behavioral verification

<!-- @source The production test runner in test/index.ts and the displayed bounds in motion/laws/verification.md. -->

Does the test exercise the operation that owns the behavior with direct typed inputs?

Use the smallest in-memory fixture that exposes the result. Test a composition's own decisions with prepared inputs and exercise its parts directly. Identify the discovered entry and who supplies its cases.

For a row or motion law, assert the applicable [motion bounds](../../motion/laws/verification.md) on its displayed result. Use system checks for installation, native builds and real hosts. Use production review for rendered picture and sound.

## Independent expectations

Would the expected results distinguish correct behavior from a plausible defect?

Derive expectations from a specification, closed form, physical requirement or the study, record or screenplay fact the module realizes. Explain the basis and limits of the expectation. Bound numerical error independently of observed output.

Choose typed cases that separate positive results, adjacent boundaries and refusals. For a row or law, vary bodies, partners and props where they affect the result. Keep every defect-catching assertion when reducing the test's cost.

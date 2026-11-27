# Testing

Judge each test at the entry the runner discovers, including cases registered by a shared harness.

## Behavioral verification

<!-- @reference The production test runner in test/index.ts and the displayed bounds in motion/laws/verification.md. -->

What behavior does the discovered check verify, and what does it need to run?

Use the smallest typed in-memory fixture for a unit test. Test a composition's own decisions with prepared inputs and exercise its parts directly. Identify the discovered entry and who supplies its cases.

For a row or motion law, assert the applicable [motion bounds](../../motion/laws/verification.md) on its displayed result. For a system check, identify the installed package, native build or host boundary it needs to exercise. Review rendered picture and sound in production review.

## Independent expectations

Would the expected results distinguish correct behavior from a plausible defect?

Derive expectations from a specification, closed form, physical requirement or the study, record or screenplay fact the module realizes. Explain the basis and limits of the expectation. Bound numerical error independently of observed output.

Choose cases that separate positive results, adjacent boundaries and refusals. At a boundary that accepts external inputs, include malformed values the boundary handles. For a row or law, vary bodies, partners and props where they affect the result. Keep every defect-catching assertion when reducing the test's cost.

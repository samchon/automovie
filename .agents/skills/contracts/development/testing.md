# Testing

Each exported test function answers this checklist and [common](common.md) from its assertions and execution path, including cases registered by a shared harness.

## Behavioral verification

Exercise the behavior and assert its observable result. Delete checks of repository layout or source text and checks that repeat tuned constants, fitted results or implementation output.

State the operation exercised, the defect the assertions catch, and the valid behavior they allow.

## Independent expectations

Derive expected values from the supported contract, a specification, a physical requirement, a study of the real practice, an independent closed form or another independent reference, never from the implementation under test or its earlier output. Derive each tolerance from the method's error analysis rather than the observed error.

State that basis, the error analysis behind each tolerance, how the assertion would catch a wrong implementation, and any oracle limitation.

## Distinguishing cases

Cover positive, adjacent negative and boundary cases. Identify the input that must change, the meaning to preserve, and any empty, singleton, limit or failure case the decision requires. Inputs are typed by their declarations, so every case uses declared values. Judge verification by contract completeness rather than coverage percentage. Keep the assertions and cases when optimizing runtime.

State this test's contribution and the cases another test owns.

## Execution ownership

A unit test exercises portable behavior with explicit in-memory inputs. Installation, native builds and real hosts belong to other checks. Playback, renders and listening belong to review. Classify a test by what it runs.

Verify each shared building block deeply against its contract. Verify a composite only for its own logic, on minimal typed inputs, relying on its parts' contracts instead of re-running them. A test that runs a whole composite, such as a planner, pipeline or scene, to reach inner code is not a unit test.

State the layer, the discoverable entry, who owns dynamically registered cases, and which part contracts a composite's test relies on.

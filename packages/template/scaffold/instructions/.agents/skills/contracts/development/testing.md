# Testing

Each exported test function answers this checklist and [common](common.md) from its assertions and execution path, including cases registered by a shared harness.

## Behavioral verification

Exercise the behavior and assert its observable result. For a registered row or law, assert each bound [motion verification](../../motion/laws/verification.md) lists on the displayed result. Delete checks of repository layout or source text and checks that repeat tuned constants, fitted results or implementation output.

State the operation exercised, the defect the assertions catch, and the valid behavior they allow.

## Independent expectations

Derive expected values from the study, subject record or screenplay fact the module realizes, or from a specification, physical requirement or other independent reference, never from the implementation under test or a snapshot of its output. Derive each tolerance from the method's error analysis rather than the observed error.

State that basis, the error analysis behind each tolerance, how the assertion would catch a wrong implementation, and any oracle limitation.

## Distinguishing cases

Cover positive, adjacent negative and boundary cases. Identify the input that must change, the meaning to preserve, and any empty, singleton, limit or failure case the decision requires. Inputs are typed by their declarations, so every case uses declared values. For a row or law, cover the bodies, partners and props motion verification requires. Judge verification by contract completeness rather than coverage percentage. Keep the assertions and cases when optimizing runtime.

State this test's contribution and the cases another test owns.

## Execution ownership

A unit test exercises portable behavior with explicit in-memory inputs. Installation, native builds and real hosts belong to other checks. Playback, renders and listening belong to review. Classify a test by what it runs.

Verify each shared building block, such as a row, law or helper, deeply against its contract. Verify a composite, such as a shot, scene or film, only for its own logic, on minimal typed inputs, relying on its parts' contracts instead of re-running them. A test that runs a whole composite to reach inner code is not a unit test.

State the layer, the discoverable entry, who owns dynamically registered cases, and which part contracts a composite's test relies on.

# Testing

Each exported test function answers this checklist and [common](common.md) from its assertions and execution path, including cases registered by a shared harness.

## Behavioral verification

Exercise the behavior and assert its observable result. For a scene, assert its resolved performance at the named instants: a contact, an outcome, or a speed, spacing or interval its beat or study fixes. Delete checks of repository layout or source text and checks that repeat tuned constants, fitted results or implementation output.

State the operation exercised, the defect the assertions catch, and the valid behavior they allow.

## Independent expectations

Derive expected values and tolerances from the screenplay beat, subject record or study the code realizes, or from a specification, physical requirement or other independent reference. Never derive them from the implementation under test, the values a scene passes or a snapshot of its output.

State that basis, how the assertion would catch a wrong implementation, and any oracle limitation.

## Distinguishing cases

Cover positive, adjacent negative and boundary cases. Identify the input that must change, the meaning to preserve, and any empty, singleton, limit, malformed or failure case the decision requires. Hold a scripted outcome across the seeds and bodies it must survive. Keep the assertions and cases when optimizing runtime.

State this test's contribution and the cases another test owns.

## Execution ownership

A unit test exercises portable behavior with explicit in-memory inputs. Installation, native builds and real hosts belong to other checks. Playback, renders and listening belong to review. Classify a test by what it runs.

State the layer, the discoverable entry, and who owns dynamically registered cases.

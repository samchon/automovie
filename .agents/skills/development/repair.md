# Repair

Repair preserves established contracts by fixing the responsible cause.

## Before Editing

Read the implementation, its callers, contracts, and tests until you know why the code is structured as it is and which invariants it owns. Then group every known symptom by cause, and trace each cause, and your change, through callers and consumers, error and recovery paths, caches and determinism, and Windows and POSIX.

## The Fix

Fix each cause at its owner and delete the compensations the fix makes unnecessary. Put non-obvious invariants in nearby comments.

Verify every case the trace reached, including corrected behavior and behavior that must remain, under [Validation](validation.md).

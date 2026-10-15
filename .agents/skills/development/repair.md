# Repair

Repair preserves established contracts by fixing the responsible cause. Work in this order:

1. Read the implementation, callers, contracts, and tests to understand why the code is structured as it is and which invariants it owns.
2. Group every known symptom by cause.
3. Before editing, trace each cause and your change through consumers, error and recovery paths, caches and determinism, and Windows and POSIX.
4. Fix the cause at its owner, delete the compensations the fix makes unnecessary, and cover each resulting case with a test that verifies the corrected behavior alongside behavior that must remain. Put non-obvious invariants in nearby comments.

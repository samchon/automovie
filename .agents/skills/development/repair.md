# Repair

## Before editing

Read the implementation, callers, contracts and tests to identify the invariants it owns. Group findings by cause. Trace each cause and fix through consumers, failure and recovery paths, caches, determinism and supported platforms.

## The fix

Fix each cause at its owner and delete the compensations the fix makes unnecessary. Put non-obvious invariants in nearby comments.

Before the fix lands, run each regression test the repair adds or changes on the unrepaired code. Record the failure it showed where the change records its verification, such as its pull request or commit message. A test that passes there does not guard the defect, so change it until it fails. A test of new behavior that repairs nothing needs no run on the unrepaired code.

Use the development checks to verify the corrected and preserved behavior for every affected case.

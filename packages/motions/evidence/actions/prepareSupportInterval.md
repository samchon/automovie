# src/actions/prepareSupportInterval.ts#prepareSupportInterval

## @evidence contracts/development/common.md#meaningful-documentation

States the keys, the root pin, the held-limb fit, the floor bound, what stays unpinned and the settlement invalidation.

## @evidence contracts/development/implementation.md#principled-implementation

supportKey.prepareBlended's ROM/root interpolation, then the first common contact's root pin (the source key's achieved contact point against the current one), then per held hand or foot an end-joint goal interpolated between the keys' achieved frames (above-floor contacts use their canonical toe, palm or grip datum, floor hands use the wrist and floor feet roll on their starting bearing socket) with the keys' middle joints as the bend pole, fitted by resolveHumanPosture's analytic limb fit, then applies the planted leg reach bound when an elevated toe bears, then checks floor nonpenetration, confirmed on the held legs' own fitted chains and the root lifted by their remaining sink.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the blend and common pin, measure the held limbs' key frames once, then per share blend, pin, add the held-limb goals and bound the root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No contact is moved off its achieved place to keep the root's path; no whole-body solve or sampled pose replaces the per-limb fit. Knee and trunk contacts are not limb-pinned, which the documentation states.

## @evidence contracts/development/implementation.md#efficient-algorithms

The C-by-D common-contact search and the held limbs' key FK run once per interval. The admitted direct blend shares one FK for the pin and collider minimum. The held-leg chains are read only at the lift course's knots (`prepareSupportLiftCourse`), at the bounded root and after any lift (at most `LIFTS`), continuing from the two endpoint swivels prepared once per interval; a sample between knots reads the planned lift with no leg fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Held key frames, the legs' endpoint swivels and the lift course's knots serve every write in the current schedule. Both clear on settle along with the entry-space contact lookup because the resolved support level selects the pivot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The interval owns one blend, the common contact, at most four held-limb frame records, one collider reader and one held-leg chain reader until release, plus one schedule-dependent target/source record until settle or release. A stationary interval retains its first requested planted posture until settle or release. Moving shares release their interpolated pose and query FK/ROM workspaces after each write.

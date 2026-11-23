# src/floor/prepareCrawlPalms.ts#prepareCrawlPalms

## @evidence contracts/development/common.md#meaningful-documentation

States fixed hand/frame/shape inputs, world points, one actual wrist per side and original ordered current default-bend goals.

## @evidence contracts/development/implementation.md#principled-implementation

HumanHandTarget.prepareFrame owns the same upward-floor-normal/explicit-forward alignment and flat-hand wrist placement. Each actual wrist receives its native prepared Bend solve with the original hanging fallback, then ArmTarget.fromWrist emits the same contact datum and goal fields.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two fixed frame readers precede the original ordered two-hand writes; one placed wrist connects its actual numerical bend and contact goal without constructing and re-placing an intermediate surface target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual default elbow sweep, legality/ranking/refinement, fallback, flat finger entry and current palm input remains. No preset, sampled pose, target point, elbow answer, contact threshold or altered ROM replaces its computation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed alignment/rotated offsets and lazy local contact datums prepare once per side. Each current palm needs one wrist placement rather than two, and a synchronous prepareBoth shares the actual unchanged empty-joint body frame/TRUNK geometry between sides. Both original bounded default bend searches remain, and each goal says its bend is that search's place (`elbow: "placed"`), so the arm's fit starts there and does not sweep the circle again.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body/hand surfaces, flat shapes, floor normal and explicit forward prove fixed plan geometry. Only current rootXYZ/yaw/pitch/roll matter to the original Bend chain, so ordered hand-goal/digit writes leave its bilateral source unchanged; every actual wrist still runs its own native search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns two fixed frame readers and at most two private contact vectors until release, borrowing immutable flat shapes. Each synchronous call releases its bilateral contexts/source/FK, current postures and wrists except fresh returned goal payloads; no workspace, queried time or result history is retained.

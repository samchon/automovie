# src/kinematics/jointRomOvershoot.ts#jointRomOvershoot

## @evidence contracts/development/implementation.md#principled-implementation

Reduces the gate's own per-axis and swing-cone violations to one comparable sum, so ordering by it is ordering by the gate's distances; a violation without a measured distance is a non-finite angle, which the sum treats as infinitely far instead of free.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The direct null gate and prepare's one-bone scorer delegate to scanJointRom's shared fault scanner; prepared frame/composer ownership stays in scanJointRom.prepare, with no duplicate ROM rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no tolerance and no special case for any bone or axis; the `Infinity` score is the stated meaning of an unmeasurable violation, not a compensation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both paths retain actual finite/axis/swing checks and ordered additions. prepare's constant setup shares one lazy canonical or supplied gated basis/composer across the fixed-bone operation instead of repeating it per swivel; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Validation and both scoring entries share one scanner. prepare borrows an unchanged bone/constraint/frame and shares only that metadata and pure exact-angle factors; every joint still has its actual numerical scan and changed dependencies require another scorer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct scoring owns only a local sum. The caller owns one prepared scorer and optional bounded frame/composer until operation release; no joint answer, target history, global collection or handles are retained.

## @evidence contracts/development/common.md#meaningful-documentation

States degree-valued exact gate scores, Infinity/null/rest meaning and prepare's fixed bone/constraint/frame scope, canonical fallback, lazy admission and caller-owned lifetime in its child documentation.

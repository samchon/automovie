# src/motion/prepareJointRotationCoefficientDots.ts#prepareJointRotationCoefficientDots

## @evidence contracts/development/implementation.md#principled-implementation

Each coefficient is the original ordered product of fixed axis-angle factors and mobile cosine/sine factors. A numeric null-ROM output contributes toRigAngle(0,frame), whereas an actual null output contributes rig0. A reference's fixed null mask therefore selects one of at most two modes for two mobile axes or four modes for one mobile axis, with no target-dependent numerical coefficient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns fixed factors, bounded nullable coefficient variants and their Gram cross term; existing math owns dots and rank-one swivel intersections. Numeric zero-width ranges keep their original minimum/frame conversion. Ordinary projection still owns enumeration/clamp/composition/ties; explicit continuation separately verifies proposed roots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Canonical factors and the first coefficient set keep the original constructor frame-admission/factor/mask/order arithmetic. Additional modes use only declared null rig0 on a null-ROM axis, never a target quaternion, queried angle, projected joint or previous answer. A canonical exact +0 factor is already the null factor and needs no variant. No range, tolerance, candidate, numerical-rank or normalization policy changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four lazy four-coefficient sets retain one additional Gram scalar each. Ordinary targets keep four dot reads and every score. An explicit two-axis circle uses eight fixed dots and constant rank-one root work before independent physical checks; no target search is cached. Fixed declarations retain at most two angles per axis and gains remain unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only immutable rig factors and coefficients cross queries. Numeric and null rig-angle constants are predeclared for the existing composer, and fixed-mode dots reuse the same factor/mask arithmetic and finite-dot owner. The selector inspects only fixed-coordinate null flags; it never retains the reference or any target/result value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One operation owns at most two fixed-factor rows/their lazy null factors, one axis lookup, at most four dot-reader arrays and their sixteen coefficient quaternions. Caller-owned fixed-angle declarations hold at most two numbers per axis. The selector retains no incoming reference, target, score, candidate, output, handle or task and releases with the projector.

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual numeric-zero versus explicit null-rest meanings, unchanged basis/frame/ranges, original factor order and the returned actual-reference mode selector's pure metadata/output ownership.

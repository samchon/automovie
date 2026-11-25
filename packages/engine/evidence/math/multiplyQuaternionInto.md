# src/math/multiplyQuaternionInto.ts#multiplyQuaternionInto

## @evidence contracts/development/implementation.md#principled-implementation

Direct writes keep Quaternion.multiply's original four expressions/read order. Distinct Cartesian supports leave one potentially nonzero product per output; a cardinal left factor leaves two in their original relative order/sign. Every omitted term is a signed zero. Adding/subtracting zeros leaves a finite nonzero partial/result unchanged; exact zero results use their original full component expression, preserving zero signs. Unsupported/nonfinite products retain full expressions. All completed outputs precede writes or a visitor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This internal math owner serves OnBasis's private inner scratch and raw-scalar outer scoring. read completes the original expressions before its visitor; prepared inner/outer readers retain only fixed support labels/sign and exact fallbacks, never numerical inputs or results. Public fresh multiply keeps direct record construction with no new root destination/scalar surface or normalization variant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Direct writes/scalar reads are unconditional and keep the four original Hamilton expressions/read order. A scalar visitor runs once after all values complete; errors propagate without stored visitor/context. Prepared calls require actual off-axis zeros/finite inputs/products; mismatches use the full product and exact zero outputs retain full components. No unit inference, tolerance, repair, changed association or target/result cache permits omission; ordinary/accessor bases receive no extra classification probes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct write/read retains sixteen products/twelve additions without a record. Supported nonzero inner outputs use four products and cardinal-left outer outputs use eight, omitting twelve/eight products respectively with guards/zero fallbacks; nonfinite cases retain direct work. Scalar scoring omits the outer record. One private inner record serves each query and public fresh multiply receives no extra dispatch. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Actual OnBasis operations classify only normalizer-owned immutable axes once and share fixed-support inner/outer readers. Every actual private own-data pair passes its current zero/finite guards and computes current products; only support metadata/storage is reused. Dense/unowned inputs keep direct formulas and no factor, target or product result enters preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct writes borrow three records; scalar reads borrow two plus visitor/context synchronously and retain none. The visitor owns its result. Prepared inner/outer readers retain at most three labels/sign or one index/three labels until operation release, with no axis/quaternion/target/result. OnBasis owns one private inner target per query and creates required fresh outputs; no global workspace/history, handle or task exists.

## @evidence contracts/development/common.md#meaningful-documentation

Defines Hamilton/application order, write-target ownership/alias safety, scalar read's completed X/Y/Z/W plus context and synchronous result ownership, no normalization, and prepared own-data/zero/finite premises with exact fallbacks/lifetime.

# src/motion/orientChainEffector.ts#orientChainEffector

## @evidence contracts/development/implementation.md#principled-implementation

The requested articulation is inverse(fixedFrame) * inverse(lowerWorld) * requestedWorld. The shared quaternion projector minimizes angular error on a plain box with at most two mobile axes; unsupported coupled or three-axis domains retain bounded local refinement, with no global guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One twist split, one frame read and one shared projection replace a second local optimizer. Standalone FK and prepared FK meet at the same local target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Actual bone axes and ROM overrides govern projection. Residual error is not declared reached, and unsupported ancestry keeps the legacy own-rest fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Frame/joint-array work remains O(J), with shared source rig setup or O(B) standalone work. A distal split makes at most five actual projector queries; when its winning local demand exactly matches the final recomputed one, orientation reuses that selected joint, otherwise one final query runs. Eligible queries score at most nineteen unique articulations; generic refinement retains its existing bound. Missing rotation returns immediately and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Matching source frames, basis, clamp, projector and fixed inverse retain their original first-use sites. After actual final lower FK, rest removal and basis/projector setup still run, the split's copied selected effector joint may serve only a four-component Object.is-identical local demand under the same unchanged dependencies. Different demands and non-distal inputs run ordinary projection; no target answer crosses this operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local frames end with this call and the returned pose owns a new joint array. A supplied rig/projector is borrowed until its caller releases the workspace; standalone projection ends with this call. No query history, external handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States target/local frames, distal split, fixed intermediate transforms, analytic eligibility, fallback and the preparation/admission premises.

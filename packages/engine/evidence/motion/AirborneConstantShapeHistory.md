# src/motion/AirborneConstantShapeHistory.ts#AirborneConstantShapeHistory

## @evidence contracts/development/implementation.md#principled-implementation

Fixed rig/pose coefficients have identically zero derivatives. Native FK differentiates those explicit declarations and the shared centroidal formula derives h before its exact-zero consistency check. Whole-curve constancy follows construction, not equal samples or a trusted callback flag.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the actual fixed rig and full resolved bone snapshot without rebuilding it under different clinical tables, propagate complete bone rates, pose the same mass model, admit the tensor and reduce momentum, then transfer only numeric data to a separate reader factory outside model/FK scope.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arbitrary callback obtains constancy, no missing derivative becomes zero and no actual moving curve is certified. The consumer must independently prove the snapshot describes its displayed articulation. Unsupported rate propagation returns undefined; physical reduction errors propagate without replacement or a tolerance change.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction is O(B+S) over B rig bones and S mass parts, with one full FK/rate propagation and one mass/tensor/momentum reduction. Query work and fixed-operator lookup are constant; every output is fresh and no mass node is rebuilt per timestamp. Runtime gains remain unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same constructor-owned numeric tensor defines every future query. Private weak membership only locates that proof; complete span coverage and the live epoch additionally gate a lazy factor. Earlier mutable outputs never feed the fixed input, while clear ends the capability without changing the fixed numeric reader's values.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Construction releases copied rig/pose, full bone/rate maps and posed parts after transferring the nine tensor numbers to a module-scope reader factory. The reader retains O(N) issued numeric instants until clear, then releases their private factor/statistics state and its lazy factor. No model, rig, pose, callbacks or derivative maps enter playback or the retained history.

## @evidence contracts/development/common.md#meaningful-documentation

States copied fixed root-frame inputs, SI rate propagation/reduction, covered seconds, undefined unavailable-rate fallback, fresh query records and permanent capability invalidation on clear. Namespace constant returns only the private positive operator for a fully covered live epoch; owned proves constructor provenance.

# src/motion/splitDistalTwist.ts#splitDistalTwist

## @evidence contracts/development/implementation.md#principled-implementation

The lower world rotation factors into its preceding frame and articulation; removing the latter gives the frame solveDistalTwist needs. A distal twist preserves the effector point only for an offset parallel to its axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ordinary and withProjection entries share one private split and the same standalone/prepared FK and bounded solve. Paired mode retains only its winning actual projection for orientChainEffector; standalone authored admission still precedes frame recovery.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Actual ROM bounds the twist and the shared projector reports any remaining effector miss. Neither the five-candidate law nor arbitrary intermediate offsets are claimed to guarantee a full pose target.

## @evidence contracts/development/implementation.md#efficient-algorithms

A distal call has O(J) authored-frame and last-record scans and joint-array copying; actual B-bone lookups and projector setup are shared by a supplied workspace rig, or add O(B) standalone work; preparation uses chain FK, while standalone adds full FK and bounded ancestry checks. At most five distinct twists query the projector. Each eligible query scores its reference plus at most eighteen pairs, at most nineteen actual joint recompositions; unsupported queries keep the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions each. A non-distal lower returns immediately; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Source frames, admitted bases/clamps/projector, fixed inverse/effector readings and exact lower-axis factors share only matching unchanged inputs; source-held raw still reads before its shared inverse and last records retain full-FK meaning. withProjection additionally returns this solve's actual winning effector joint/raw composition/local target. Immediate orientation recomputes its actual local demand and reuses only four-component Object.is equality under identical fixed projector dependencies; no target or seed crosses operations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Pose-specific frames/closures release with the call and the pose owns its new joint array. Paired mode adds one result wrapper and one selected fixed-size reading only until immediate orientation; borrowed source rig/projector remain caller-owned, with no target history, handles or tasks.

## @evidence contracts/development/common.md#meaningful-documentation

States current-pose reference, bounded actual displayed ranking, fixed intermediate frame and point-preservation premise. withProjection's child documentation defines same-input scope, original pose ownership, optional selected actual local/joint/raw-quaternion reading and exact-demand fallback.

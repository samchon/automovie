# src/motion/plantStanceFeet.ts#plantStanceFeet.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The added member states what it is and what its absence keeps.

## @evidence contracts/development/design.md#principled-representation

The interface props plus one optional engine product; nothing of the interface record is repeated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional member, passed by `plantPerformShotStanceFeet`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends the interface record instead of copying it; the rig is the genuine prepared product, not a flag.

# src/motion/plantStanceFeet.ts#plantStanceFeet

## @evidence contracts/development/implementation.md#principled-implementation

Shares one unchanged skeleton topology across detection and re-keying, uses inclusive ground+tolerance contact, then scores ROM-clamped chain FK through fitChainToTarget. The sampling clock includes clip endpoints and every admitted support boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The coordinator separates dense sampling, run pinning, chain correction and result assembly through existing single-purpose helpers, all using identical topology and clinical axes/rest frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid sample rate, scalar ground or tolerance and nonfinite sampled/carried targets throw; absent/degenerate/unimprovable chains keep articulation rather than inventing contact success. Default legs and zero ground are explicit API defaults.

## @evidence contracts/development/implementation.md#efficient-algorithms

F samples require interpolation and ordered joint admission. Raw omission retains full B-bone FK with pure exact-angle factor reuse; an explicit immutable rig computes L feet's ancestry and writes fresh maps directly without F intermediate frame arrays, storing O(FL) FK outputs. Stance work stays O(FL) and actual pins keep bounded IK. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Completed poses/maps feed detection. One exact operation reader and topology serve detection/correction; a genuine immutable rig must match this skeleton/clinical tables and supplies target-chain preparation. Raw omission preserves full live admission. Each changed parent pose and target still receives its actual solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned frames/plants belong to the caller. Sample/FK/target arrays are call-local; raw factor workspaces and optional immutable-rig current dependency rows release with the synchronous reader on return or throw. A supplied immutable rig remains caller-owned, without continuing tasks or handles.

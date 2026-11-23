# src/motion/preserveRetargetContacts.ts#preserveRetargetContacts

## @evidence contracts/development/implementation.md#principled-implementation

Finds chains root-reachable on both rigs, FK-resolves source frames under source clinical tables, classifies foot stance or inclusive hand windows, and fits target chains to per-frame scaled source points under target ROM. Drift at or below absolute 1e-9 target model units skips another fit; prior corrected pose breaks equal-residual bend ties.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns source-contact mapping and worst-per-effector residual reporting; contactMask and fitSeededChainToTarget own classification and unchanged candidate choice. One exact raw FK reader per side shares pure work, while one helper retains actual effector position views from complete live FK. The view type states its one observed field instead of fabricating full bone frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unresolved chains are skipped whole, proportional already-on-pin frames keep authored articulation, and impossible residual remains warning data rather than fabricated success or a hidden target offset.

## @evidence contracts/development/common.md#meaningful-documentation

States authored-key correction, per-frame source slide preservation, rootScale mapping, warning budget, parallel-clock/admission premises and dynamic ground failure boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

F source frames retain full ordered J-joint/B-bone live FK but store only H actual effector positions, O(FH) retained views instead of O(FB) full frames. Neither retained source nor target maps keep unused local/world quaternions. A static helper avoids a resolver closure per corrected frame. Actual corrections keep bounded solving and pure exact-angle factor reuse; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The retarget gate's admission does not prove borrowed inputs stay immutable across dynamic ground callbacks. Per-side raw adapters retain every current joint/frame/transform read and share only pure admitted-basis/angle factors, without a static rig snapshot. Private native readers produce fresh own-data frames; their positions move into contact views only after complete raw FK. Source views serve contact chains, and target FK refreshes after accepted correction.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Source maps/pins scale with F and admitted contacts, retaining only owned position vectors and small views; discarded FK frames/quaternions end after each helper call. Weak admitted-basis factor workspaces release with the synchronous readers on return or throw. The returned clip owns a new keyframe array and may share unchanged authored records, but retains no source position views, operation reader, prepared rig, task or handle.

# src/sport/sprintStartSet.ts#sprintStartSet

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry and the result.

## @evidence contracts/development/implementation.md#principled-implementation

One whole-body multi-contact fit holds the feet on their blocks, each hand's thumb and index bridge at the line (`sprintStartSetHands`), front knee 90, rear knee 117 +/- 11 and front hip 43 +/- 6 degrees (Cavedon et al. 2019, table 2, https://pmc.ncbi.nlm.nih.gov/articles/PMC6436800/), and the sex-matched centre position; these physical intervals do not impose one mean posture on every body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body-scaled contacts, one closed-form sagittal seed set twice (`sprintStartSetChain`, the second on the posed trunk), the rear block from its hip, then one shared whole-body fit and a measured refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Arm extension is not fixed to the seed and no joint range is narrowed; a joint/contact problem the fit does not meet is refused with its actual residuals.

## @evidence contracts/development/implementation.md#efficient-algorithms

A closed-form chain with one bisected freedom and two trunk readings seed one shared fit with analytic Jacobians; fit iterations, not a claimed speedup, determine cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Geometric trunk, complete limb-seed and final stance reads share one synchronous exact-FK workspace. After the first original successful trunk observation, genuine ROM metadata is shared by subsequent actual complete direct-joint projections. Trunk FK requests only shoulders, hips and hip joints, and final stance FK only hips, hands and feet, without changing canonical admission or the whole-body fit's independent solver.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The operation-local exact reader, genuine ROM projector and requested bone sets release when the set solve returns or throws; the returned numeric stance retains none of them.

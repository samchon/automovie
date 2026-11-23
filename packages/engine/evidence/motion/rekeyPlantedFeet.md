# src/motion/rekeyPlantedFeet.ts#rekeyPlantedFeet.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each added member states what it is and what its absence keeps.

## @evidence contracts/development/design.md#principled-representation

The interface props plus two optional engine products; nothing of the interface record is repeated.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two optional members, read by the correction `plantStanceFeet` shares them with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends the interface record instead of copying it; neither member is a flag or a structural stand-in.

# src/motion/rekeyPlantedFeet.ts#rekeyPlantedFeet

## @evidence contracts/development/implementation.md#principled-implementation

Sequentially fits each pinned chain under the rig's shared clinical axes/rest frames and ROM, carrying the preceding corrected pose as continuity reference; resulting keyframes use linear easing on the existing dense sampling clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns correction/frame packaging; pinStanceTargets owns grouping/pins and fitSeededChainToTarget owns unchanged bounded selection. Its prepared companion accepts the same source request and one actual target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Untargeted legs and non-leg joints stay authored; missing/degenerate/unimprovable chains return their current pose rather than manufacturing a successful exact pin.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F frames and L legs, performs F times L target lookups and only actual pins invoke bounded IK/FK search; output is O(F times joint population), with topology prepared once upstream.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses topology and the preceding corrected pose for continuity. A same-operation reader and genuine immutable rig share exact static/FK dependencies with detection; raw omission retains full admission. Each changed frame/chain source still receives fresh target-specific preparation and solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns new keyframes/joints; unchanged root/expression/joints may be shared. A local or borrowed operation reader releases with the synchronous pass; a borrowed immutable rig remains caller-owned. No target history, global cache or handle persists.

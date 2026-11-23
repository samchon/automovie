# src/motion/retargetHumanoidMotion.ts#retargetHumanoidMotion

## @evidence contracts/development/implementation.md#principled-implementation

Validates source motion before relabeling, checks required bones, bindings and clinical basis/rest frames, derives height from root-reachable unscaled FK only for admitted skeletons, copies clinical angles/root translation and optionally maps source contacts through the same rootScale before target motion admission. Invalid skeletons have no computed span and retain their structural and unavailable-height findings in the refusal envelope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The retarget gate owns characterization and validation-envelope transfer; static contact policy, clinical basis admission and contact correction have separate existing owners instead of being repeated in consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No malformed source motion is laundered through wider target ROM, no missing required mapping is guessed, and nonproportional contact limits remain warnings under target rig constraints rather than modified ROM tables.

## @evidence contracts/development/common.md#meaningful-documentation

States clinical-angle identity, scale source, retained facing, null refusal envelope, target validation, optional warnings and dynamic callback exception boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Source/target validation and rest FK scale with keyframes/joints/bones; required-bone collection uses a set and deterministic code-unit sort, characterization is linear in rig bones, and optional contact correction owns its bounded frame/chain solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Resolved clinical tables are shared by characterization and both FK/IK sides; rest spans feed height scaling and default source floor once, and no retarget cache assumes mutable rig/clip equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns returned clip and characterization maps, which share admitted nested joint/rotation/scale/table records where unchanged; collector and temporary sets/FK maps are call-local with no handles or background tasks.

# src/kinematics/reachPose.ts#reachPose

## @evidence contracts/development/implementation.md#principled-implementation

Reads the arm's rest offsets under the premise that the three bones form one parent chain, which it checks before solving, so each offset is in its parent's frame as the hinge solve requires; candidates are scored through the same clinical decomposition and `jointRomOvershoot` the result is reported and gated with, so the solver cannot pick a pose by a kinder rule than `validatePose` applies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call owns original source admission/full rest FK/clinical lift and delegates hinge geometry/search to hingedArmArticulation. Each call rereads source data so live target callbacks may edit borrowed rig/mapping values between calls, without an unused preparation layer or source wrapper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rig, side or target is special-cased; an impossible reach returns its least-overshoot pose for the gate to report rather than a clamped one, and every refusal is a structural or geometric fact about the rig.

## @evidence contracts/development/common.md#meaningful-documentation

States clinical output, axis/frame defaults, every null/refusal case, model-metre target units, original complete candidate search and fresh results.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call retains three bone searches, diagnosis, merged axes and full B-bone rest FK before at most 720 coarse candidates plus the original bounded refinements, each with two clinical decompositions/scorings. Two local bone/constraint wrappers are formed once instead of per candidate; current frame/basis/ROM reads remain at every original site. Source data serves only that solve; runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual source call shares its shoulder FK and effective constraint references across its own candidates. Local domain wrappers hold only the fixed names and those same references, not copied ROM scalars; every candidate still reads current axes, frames and constraint fields through the original decomposition. Borrowed identities certify no immutable scalars, so no source or answer crosses calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Source/candidate closures end with the call or throw; only a fresh pose with fresh joint records escapes, without target history, a retained source reader, task or handle.

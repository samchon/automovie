# src/airborne/skydivePath.ts#skydivePath.IAt

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The hips, the heading, the phase and its progress.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the posture writer reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by the path.

# src/airborne/skydivePath.ts#skydivePath.Phase

## @evidence contracts/development/common.md#meaningful-documentation

Names them.

## @evidence contracts/development/design.md#principled-representation

A closed choice.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the posture writer switches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Declared here directly.

# src/airborne/skydivePath.ts#skydivePath.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Phase start times, the touchdown and the sampler.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What planSkydive reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by prepare.

# src/airborne/skydivePath.ts#skydivePath.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The freefall time inverts the drag drop (`t = vt / g acosh(exp(d g / vt^2))`); each later phase's length follows from its distance and its speeds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Time the phases, admit them, then the sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A deployment too low refuses with the altitude and the least admitted; the constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work at plan time; per sample, linear in the toggles.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the phase times and toggles.

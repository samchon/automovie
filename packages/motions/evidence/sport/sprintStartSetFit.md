# src/sport/sprintStartSetFit.ts#sprintStartSetFit.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and frame.

## @evidence contracts/development/design.md#principled-representation

The body, the seed posture and pose, the feet's world placements, the hands' bridge targets, the legs and the measured angle rows in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values `sprintStartSet.of` prepares for the fit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The centre row is absent exactly when placed plates decide where the body stands.

# src/sport/sprintStartSetFit.ts#sprintStartSetFit

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

One shared whole-body fit (`HumanBodyFit`) over sagittal trunk, planted-leg and arm freedoms, with the bridge hand shape fixed, as the multi-contact inverse problem it solves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Targets, variables, the fit, then the refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unmet row is refused with its residuals; no row is loosened here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fit; its iterations decide the cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The seed pose's joints start the fit instead of a fresh solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The fit's result is returned and nothing else is kept.

# src/sport/sprintStartSetFit.ts#sprintStartSetFit.IPalm

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame.

## @evidence contracts/development/design.md#principled-representation

A world-metre point and two unit world directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values the placed arm reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read off the fitted hand, never stated.

# src/sport/sprintStartSetFit.ts#sprintStartSetFit.ISet

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

The hips' world point, the trunk's pitch in degrees, the joints, each palm and each foot's achieved placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values `athletics.plan` reads from the set.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every value is read off the fitted posture.

# src/sport/sprintStartSetFit.ts#sprintStartSetFit.read

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

One resolution of the fitted posture; the hips, each palm's frame (`HumanHand.frame`) and each foot's achieved frame are read off it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve, then read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps each foot's achieved block frame; substituting the requested rotation would discard the fitted shape at the toe's contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution and the five demanded bones.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the set solve's resolution and projection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values and keeps no workspace.

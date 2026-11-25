# src/lexicon/HumanMountedStirrups.ts#HumanMountedStirrups.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

clear: The seat socket above the saddle, thigh lengths, or none where the knee flexion sets the height. knee: The knee flexion that sets the height, degrees. pitch: The pelvis's forward inclination, degrees. back: How far the hips stand behind the stirrups, thigh lengths.

## @evidence contracts/development/design.md#principled-representation

Shares of the thigh and degrees, so one profile fits every body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `solve`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exactly one of `clear` and `knee` sets the height.

# src/lexicon/HumanMountedStirrups.ts#HumanMountedStirrups.free

## @evidence contracts/development/common.md#meaningful-documentation

States which kinds.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A membership test.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedStirrups.ts#HumanMountedStirrups.blend

## @evidence contracts/development/common.md#meaningful-documentation

States the blend and its seated value.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A linear blend.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedStirrups.ts#HumanMountedStirrups.profile

## @evidence contracts/development/common.md#meaningful-documentation

States each profile and that it is provisional.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A table read.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One choice per kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The values are provisional and named, not fitted to a case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedStirrups.ts#HumanMountedStirrups.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the posture and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each ball is placed on its tread (`HumanFoot.pivot`); the hip height follows from the socket's clearance through `seated.root`, or, standing, from the hip-to-ankle distance of the knee's flexion by the law of cosines on the thigh and the shank, and is capped where a leg would stretch past the sitting band (`HumanMount.span`) less the carrier's slack; each leg is then checked against that band and the socket against `CLEAR`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The feet, the root, the checks, the legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stirrup out of reach is refused with the band, never clamped to.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Solved once per figure.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

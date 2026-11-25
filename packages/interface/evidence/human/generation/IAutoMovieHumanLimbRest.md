# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Leg rest and the foot's own local centres, before skin.

## @evidence contracts/development/design.md#principled-representation `foot`: Original foot centres before the same stance translation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLimbRest.legs, AutoMovieHumanLimbRest.previous.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `foot`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.Leg

## @evidence contracts/development/common.md#meaningful-documentation

Original leg placement and stance translation; no skin is read.

## @evidence contracts/development/design.md#principled-representation

Original leg placement and stance translation; no skin is read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by leg.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by leg for original leg placement and stance translation; no skin is read.

# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Explicit independent requests; construction and metadata prepare no sibling.

## @evidence contracts/development/design.md#principled-representation

Explicit independent requests; construction and metadata prepare no sibling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLimbRest.create. Also types AutoMovieHumanBodySources.rests, AutoMovieHumanSkeletonLaw.limbs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodySources.rests, AutoMovieHumanBodySources.limbRest, AutoMovieHumanLimbRest.create, AutoMovieHumanSkeletonLaw.limbs for explicit independent requests; construction and metadata prepare no sibling.

# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.IArm

## @evidence contracts/development/common.md#meaningful-documentation

Actual side-qualified arm and hand, before any source curve.

## @evidence contracts/development/design.md#principled-representation `bones`: Rest joint centres, calibration mm. `hand`: Identical hand record consumed by its source and bind bones. `projection`: Acromion-to-GH vertical projection used by the public upper-arm law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLimbRest.arms, AutoMovieHumanLimbRest.previous.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bones`, `hand`, `projection`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.IShoulder

## @evidence contracts/development/common.md#meaningful-documentation

Only the attachment point/frame needed by the arm law; no parent part.

## @evidence contracts/development/design.md#principled-representation `glenohumeral`: Canonical-left glenohumeral centre in calibration mm. `shoulder`: Canonical-left acromion point in the same frame and unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanShoulderDatum.create. Also types AutoMovieHumanLimbRest.attachment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `glenohumeral`, `shoulder`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbRest.ts#IAutoMovieHumanLimbRest.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Required public inputs and explicit numerical attachment suppliers.

## @evidence contracts/development/design.md#principled-representation `stature`: Calibration stature, mm. `arms`: Public arm/hand inputs in their original calibration units. `feet`: Public sided foot inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLimbRest.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stature`, `arms`, `feet`, `legs`, `sex`, `diagnostics`, `hipForward`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide

## @evidence contracts/development/design.md#principled-representation

The joint records carry ordered centres, oriented planes and field callbacks in figure coordinates. The runtime builder checks the directions used to form the surfaces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the input, its related records and the resulting division read by AutoMovieHumanF1Divide and the fit's complement check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An ordered row supplies its own digits and each surface supplies the two sides of one shared division.

## @evidence contracts/development/common.md#meaningful-documentation

Member comments give the figure frame, units, side convention and optional coverage.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide.ISurface

## @evidence contracts/development/design.md#principled-representation

One field in figure millimetres and its optional coverage predicate serve both sides. The field supplies the sign and the pairing comes from the producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1Divide.outside and the reference complement check read the same two part lists, region, centre and reach.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both sides borrow the same function and coverage rule.

## @evidence contracts/development/common.md#meaningful-documentation

Describes how the parts keep skin inside and outside the region and states all units.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide.IEnd

## @evidence contracts/development/design.md#principled-representation

A figure-space point in millimetres and the course direction at that point define an oriented plane. AutoMovieHumanF1Divide normalizes the nonzero direction during construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The wrist's registered plane and the fit's parent section inputs share these two vectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both vectors come from the parent's course at its selected section.

## @evidence contracts/development/common.md#meaningful-documentation

States the point's frame and the direction toward the children.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide.IDigit

## @evidence contracts/development/design.md#principled-representation

The part name binds to its family. Two figure-space centres in millimetres determine the direction the division uses, which the runtime derives from their separation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reference tool supplies exactly the part and centres read by AutoMovieHumanF1Divide.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same record serves every digit in an ordered row.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the family identity, joint order and units of the centres.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide.ILandmarked

## @evidence contracts/development/design.md#principled-representation

The signed distance, landmark ball and swept course tube describe one field's ownership region in figure millimetres. Course length and finite coordinates remain producer premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1Divide uses the field and coverage together to construct the bounded side division supplied by the reference fitter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each attachment supplies its own landmark and course coverage.

## @evidence contracts/development/common.md#meaningful-documentation

States the domain, units and direction of the field and how the course continues.

# src/human/generation/f1/IAutoMovieHumanF1Divide.ts#IAutoMovieHumanF1Divide.IInput

## @evidence contracts/development/design.md#principled-representation

Joint centres, landmark fields and the parents' actual section planes describe one figure. The runtime uses row order and normalizes the derived directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reference fitter supplies the input that AutoMovieHumanF1Divide.create reads to build one shared set of divisions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The digit rows express order as data and optional side attachments correspond to supplied families.

## @evidence contracts/development/common.md#meaningful-documentation

Describes row order, frames, units, and when side attachments are omitted.

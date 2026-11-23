# src/human/generation/hand/IAutoMovieHumanHandBones.ts#IAutoMovieHumanHandBones.IOutput

## @evidence contracts/development/design.md#principled-representation

Preserves the same joint/frame definition with an independent public crease and the packing-derived breadth centre. `frame`: The actual generating material frame, carried with these same joints. `radialCenter`: Palm breadth-centre offset from MCP3 along this hand's radial/across direction, mm; derived from the same conventional MCP packing. `fingers`: Four fingers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All hand consumers read one explicit source record. Returned by AutoMovieHumanHandBones.of, AutoMovieHumanHandBones.sided. Read by AutoMovieHumanHandBones.sided. Also types AutoMovieHumanLimbRest.hand, AutoMovieHumanSkeletonLaw.hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A shared knuckle is the actual middle-MCP tuple, not a second estimate from a skin or bent segment. Required fields are `frame`, `radialCenter`, `fingers`, `thumb`, `knuckle`, `crease`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

States side/reflection ownership, material units and the independent crease/packing definitions. Actual joints and material frame: of creates the canonical left side, and sided reflects the complete source for the right.

# src/human/generation/hand/IAutoMovieHumanHandBones.ts#IAutoMovieHumanHandBones.Finger

## @evidence contracts/development/design.md#principled-representation

Enumerates the four non-thumb digits in the existing skeletal vocabulary. Anatomical name used by the skeleton. The closed alternatives are "Index", "Middle", "Ring", "Little".

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed union keys the four source records. Also types AutoMovieHumanHandBones.fingers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contains no person-dependent alias or fallback digit. The representation is used by AutoMovieHumanHandBones.fingers, NAMES for anatomical name used by the skeleton.

## @evidence contracts/development/common.md#meaningful-documentation

States that the names belong to the skeleton and excludes the separately represented thumb. Anatomical name used by the skeleton.

# src/human/generation/hand/IAutoMovieHumanHandBones.ts#IAutoMovieHumanHandBones.IDigit

## @evidence contracts/development/design.md#principled-representation

Separates a terminal skin apex from the three generating joints and retains the original material direction. `centres`: MCP, PIP, DIP and tip for a finger; CMC, MCP, IP and tip for the thumb. `dorsal`: Shared bind dorsal direction, projected by the digit's own generating frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A four-point list and one direction serve both skeleton and source curves. Also types AutoMovieHumanArmSources.source, AutoMovieHumanHandBones.fingers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not recover a direction from flexed bones or label the terminal skin point as another bony joint. Required fields are `centres`, `dorsal`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Gives finger/thumb point ordering, calibration units and the material-direction owner. One digit's actual generating joint centres and terminal soft-tissue point, mm, with the same hand's material dorsal direction.

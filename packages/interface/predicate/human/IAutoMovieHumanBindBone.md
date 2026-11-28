# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes bind positions, optional leaf tips, positive girth radii and a stock foot heel-plane point. All coordinates use the Human registered frame in metres.

## @evidence contracts/development/design.md#principled-representation

A parent identity and bind point identify each rest bone. The ring builder interprets the optional heel on each side's foot joint and uses a same-side hallux tip to determine its longitudinal frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Canonical display transports the selected rest points to both rendering and authored polygon checks. The optional landmark leaves skeletons without that measured foot field structurally usable.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.bone

## @evidence contracts/development/common.md#meaningful-documentation

The identity selects the rest point for the same emitted mesh and placed bone.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.parent

## @evidence contracts/development/common.md#meaningful-documentation

The nullable parent identifies adjacent bones before ring construction.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.position

## @evidence contracts/development/common.md#meaningful-documentation

The drawing subtracts this Human-frame metre point to localize the module.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.tip

## @evidence contracts/development/common.md#meaningful-documentation

A leaf tip closes its segment. A null value leaves the endpoint to its children.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.radius

## @evidence contracts/development/common.md#meaningful-documentation

A positive girth radius controls the ring's dimensions in metres.

# src/human/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone.heel

## @evidence contracts/development/common.md#meaningful-documentation

A stock foot transports its rear projection plane in the same Human frame.

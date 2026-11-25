# src/human/skeleton/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IBody

## @evidence contracts/development/common.md#meaningful-documentation

A Human on the canonical rig.

## @evidence contracts/development/design.md#principled-representation `skeleton`: The canonical rig at its T-pose rest; consumers read it with `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`. `profile`: The polygon man's contact and mass profile on the rig's bones, segment frames at the rest. `joints`: Every Human joint at the rest, canonical frame, parent before child, with its carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCanonicalBody.prepare, canonical. Read by AutoMovieHumanCanonicalBody.place, AutoMovieHumanCanonicalBody.display.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `skeleton`, `profile`, `joints`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

One Human joint on the canonical rig.

## @evidence contracts/development/design.md#principled-representation `bone`: Human joint id, including joints the humanoid vocabulary lacks. `parent`: Parent Human joint, or null at the root. `carrier`: The rig bone that carries this joint rigidly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanCanonicalBody.IJoint is the canonical exchange used by AutoMovieHumanCanonicalBody.place, AutoMovieHumanCanonicalBody.bones, canonical.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `parent`, `carrier`, `position`, `tip`, `radius`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

One Human joint's placement under a canonical pose.

## @evidence contracts/development/design.md#principled-representation `bone`: Human joint id. `position`: World joint centre, canonical metres. `rotation`: Rotation from the T-pose rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCanonicalBody.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `position`, `rotation`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPrepareOptions

## @evidence contracts/development/common.md#meaningful-documentation

Prepare a Human's polygon man on the canonical rig from its parameters, at the skeleton level: no skin, loft or head surface is built.

## @evidence contracts/development/design.md#principled-representation `mass`: Required body mass in kilograms, forwarded to canonical physical-profile construction; this preparation supplies no default. `id`: Required skeleton/profile identity used by downstream rig and motion consumers; this preparation supplies no default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanCanonicalBody.IPrepareOptions is the canonical exchange used by AutoMovieHumanCanonicalBody.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mass`, `id`; callers supply the complete record.

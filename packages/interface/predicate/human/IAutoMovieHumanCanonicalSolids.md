# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

The rest point and optional heel plane are in canonical metres. A separate carrier names the rigid segment responsible for any solid.

## @evidence contracts/development/design.md#principled-representation

The ordered map supplies parent, position, tip and radius. It holds a measured foot landmark when stock preparation has one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hull builder reflects the one selected point set to the ring owner and retains only the carrier required for solid registration.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid

## @evidence contracts/development/common.md#meaningful-documentation

Each solid carries its identifier, canonical centre, centred hull points, cubic-metre volume and unit-mass principal inertia.

## @evidence contracts/development/design.md#principled-representation

One shape record contains both the centre used to place it and its principal inertia frame, as required by physical profile assembly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The profile owner reads the identifier and carrier for registration, and combines volume and mass properties inside each physical segment.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.parent

## @evidence contracts/development/common.md#meaningful-documentation

The rest parent defines the source hierarchy used by the ring builder.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.carrier

## @evidence contracts/development/common.md#meaningful-documentation

The emitted convex shape rides the named canonical rig segment.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.position

## @evidence contracts/development/common.md#meaningful-documentation

The point is canonical rest metres and is reflected for ring construction.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.tip

## @evidence contracts/development/common.md#meaningful-documentation

The optional endpoint shares the canonical frame of the corresponding joint.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.radius

## @evidence contracts/development/common.md#meaningful-documentation

The source girth radius in metres controls the rig joint's ring proportions.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.IJoint.heel

## @evidence contracts/development/common.md#meaningful-documentation

A present canonical heel point is reflected to the stock ring input.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.id

## @evidence contracts/development/common.md#meaningful-documentation

The module's joint and any run index identify each part of a divided solid.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.carrier

## @evidence contracts/development/common.md#meaningful-documentation

This canonical bone owns the hull and its local physical transform.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.centre

## @evidence contracts/development/common.md#meaningful-documentation

The centroid in canonical rest metres anchors the centred point array.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.points

## @evidence contracts/development/common.md#meaningful-documentation

The vertices are relative to the centroid in canonical-oriented metres.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.volume

## @evidence contracts/development/common.md#meaningful-documentation

Cubic metres determine proportions within the containing segment's mass.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.inertia

## @evidence contracts/development/common.md#meaningful-documentation

The principal moments are per unit mass for composition at physical mass.

# src/human/IAutoMovieHumanCanonicalSolids.ts#IAutoMovieHumanCanonicalSolids.ISolid.inertiaRotation

## @evidence contracts/development/common.md#meaningful-documentation

The quaternion maps the solid's principal frame into canonical axes.

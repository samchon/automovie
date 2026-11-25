# src/human/generation/leg/IAutoMovieHumanLegProximal.ts#IAutoMovieHumanLegProximal.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Actual parent/child coordinates and separately qualified transfer jets.

## @evidence contracts/development/design.md#principled-representation `parent`: Definition consumed by this exact source transfer. `owner`: Complete original parent field, including fullness and parameter owners. `phase`: Original parent phase, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegProximal.contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `parent`, `owner`, `phase`, `point`, `station`, `outward`, `radius`, `parentFrame`, `childFrame`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegProximal.ts#IAutoMovieHumanLegProximal.IParent

## @evidence contracts/development/common.md#meaningful-documentation

The identical parent definition and its authoritative named hip station.

## @evidence contracts/development/design.md#principled-representation `definition`: Actual trial/final parent, not an independently reconstructed hip box. `station`: Named canonical parent station, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegProximal.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `definition`, `station`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegProximal.ts#IAutoMovieHumanLegProximal.FrameJet

## @evidence contracts/development/common.md#meaningful-documentation

The actual public axis's separately available frame derivatives.

## @evidence contracts/development/design.md#principled-representation

The actual public axis's separately available frame derivatives. NonNullable< ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> > retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegProximal.childFrame, AutoMovieHumanLegProximal.parentFrame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegProximal.childFrame, AutoMovieHumanLegProximal.parentFrame for the actual public axis's separately available frame derivatives.

# src/human/generation/leg/IAutoMovieHumanLegProximal.ts#IAutoMovieHumanLegProximal.IResult

## @evidence contracts/development/common.md#meaningful-documentation

New proximal outward original, with its actual complete parent authority.

## @evidence contracts/development/design.md#principled-representation `outline`: Reauthored prefix; all named-thigh-and-later scalar spans replay unchanged. `contact`: Contact retained by both construction and independent source readers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegProximal.create. Also types AutoMovieHumanLegWalk.proximal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `outline`, `contact`; callers supply the complete record.

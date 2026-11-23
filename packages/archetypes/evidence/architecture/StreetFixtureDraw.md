# src/architecture/StreetFixtureDraw.ts#StreetFixtureDraw.IFixture

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the measurements and builder returned after drawing the profile.

## @evidence contracts/development/design.md#principled-representation

Dimensions retain the saved keys and metre or kilogram units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A producer needs the drawn values and its typed builder to construct the geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The builder holds provenance from the same session as the drawn values.

# src/architecture/StreetFixtureDraw.ts#StreetFixtureDraw.begin

## @evidence contracts/development/common.md#meaningful-documentation

Describes the common inputs and gives ownership of choices to the profile.

## @evidence contracts/development/implementation.md#principled-implementation

Pick the model first so its fixed dimensions are validated, then draw the designated bands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Perform two draws and open the builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserve the original seed and model key order and reject foreign known fields.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Draws only a fixed number of dimensions for the chosen producer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every street producer shares the same saved model validation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the draws and fresh builder.

# src/architecture/StreetFixtureDraw.ts#StreetFixtureDraw.shaft

## @evidence contracts/development/common.md#meaningful-documentation

States the placement and units of the shaft contact.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the cylinder's real extent, centre and diameter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Derive one bar frame and give it the shaft's span and aperture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lamp fixture's base and luminaire are outside its usable shaft.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Records one bar.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bollard and lamp post share the identical bar definition.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the builder receives the contact.

# src/cinematics/IAutoMovieMeterIlluminance.ts#IAutoMovieMeterIlluminance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States that lights are read at the metered second as given, the point and normal units and premises, why an image and a daylight sky are unmetered, and why an instant's beam is never added.

## @evidence contracts/development/design.md#principled-representation

World metres for the point, a direction of any length for the normal, and the scene's own light and environment records, so the meter reads what the beauty pass draws. Finite and non-zero premises are runtime checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read. The daylight field is named `daylight` rather than the issue's `instant`, because the sky term also needs the site's ground, occluders and sample count, which the instant alone does not carry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two optional sources are independent: either, both or neither may be present, and each has one meaning.

# src/cinematics/IAutoMovieMeterIlluminance.ts#IAutoMovieMeterIlluminance.IDaylight

## @evidence contracts/development/common.md#meaningful-documentation

Documents which context fields are read, that the instant belongs to the context, and the sample count's meaning.

## @evidence contracts/development/design.md#principled-representation

Reuses the analysis contracts so the sky is measured against the same site a daylight study validates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields, all read by the sky term.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The instant is passed as a record rather than an id to look up, so no missing-id state exists.

# src/cinematics/IAutoMovieMeterIlluminance.ts#IAutoMovieMeterIlluminance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States that `lux` sums the drawn terms, the contribution order and the unmetered order.

## @evidence contracts/development/design.md#principled-representation

Lux throughout; the total is redundant with the contributions by definition, kept because the exposure reads the total.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The total sets the exposure, the contributions show which light keys the subject, and the unmetered list names what the total leaves out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No flag stands in for the unmetered list; an empty list means every source is counted.

# src/cinematics/IAutoMovieMeterIlluminance.ts#IAutoMovieMeterIlluminance.IContribution

## @evidence contracts/development/common.md#meaningful-documentation

States the light id and its lux.

## @evidence contracts/development/design.md#principled-representation

One light's illuminance in lux, at or above zero by construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, both read when a production checks its key.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.

# src/cinematics/IAutoMovieMeterIlluminance.ts#IAutoMovieMeterIlluminance.IUnmetered

## @evidence contracts/development/common.md#meaningful-documentation

Documents each source value and when `lux` is null.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two sources the frame can carry or declare without a photometric light term; null states the absence of a unit rather than a zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, both produced by the meter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The image entry is always null and the sky entry always a number; a discriminated pair would encode that, but one record keeps a single list a production reads in order, and the documentation states the pairing.

# src/human/generation/f1/IAutoMovieHumanF1Centres.ts#IAutoMovieHumanF1Centres

## @evidence contracts/development/design.md#principled-representation

Owns centre kind and source, measured course turns, and offsets from joint axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Canonical declarations shared by AutoMovieHumanF1Centres and its published consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime owner retains the same admission and source coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the units and roles of the received and printed values.

# src/human/generation/f1/IAutoMovieHumanF1Centres.ts#IAutoMovieHumanF1Centres.Kind

## @evidence contracts/development/design.md#principled-representation

The Kind declaration contributes to registered anatomical courses through centre kind and source, measured course turns, and offsets from joint axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The published producer and its callers consume this exact declaration through Interface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation preserves the source fields and leaves numerical admission to its runtime owner.

## @evidence contracts/development/common.md#meaningful-documentation

Each member describes its geometric or source role.

# src/human/generation/f1/IAutoMovieHumanF1Centres.ts#IAutoMovieHumanF1Centres.ICentre

## @evidence contracts/development/design.md#principled-representation

The centre's kind, the frame that holds it, where f1's value comes from and the rule that should generate it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the centre table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A datum with no generating rule yet says so in `rule` rather than passing as a joint.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

# src/human/generation/f1/IAutoMovieHumanF1Centres.ts#IAutoMovieHumanF1Centres.ITurn

## @evidence contracts/development/design.md#principled-representation

The engine's own turn (angle, set-back, station) beside the section's size there, the quantities a half-length law would relate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member is one column of the turn table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The section's size is read from the family's own fields, not from a loft.

## @evidence contracts/development/common.md#meaningful-documentation

Members state units.

# src/human/generation/f1/IAutoMovieHumanF1Centres.ts#IAutoMovieHumanF1Centres.IOffset

## @evidence contracts/development/design.md#principled-representation

The section's centre as the mean of its four guide extremes in the section chart, and the course point's distance to the bone line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the offset table's columns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A family without a bone line reports null, not zero.

## @evidence contracts/development/common.md#meaningful-documentation

Members state units and frames.

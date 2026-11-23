# src/human/generation/IAutoMovieHumanLimbRootStrip.ts#IAutoMovieHumanLimbRootStrip.IJet

## @evidence contracts/development/common.md#meaningful-documentation

One end of a column: its point and its derivatives along the strip's run, the run counted from the trunk's ring into the limb.

## @evidence contracts/development/design.md#principled-representation `point`: The point, mm. `first`: First derivative along the run, mm per mm. `second`: Second derivative along the run, per mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLimbRootStrip.under, AutoMovieHumanLimbRootStrip.jet, AutoMovieHumanLimbRootStrip.edge. Read by AutoMovieHumanLimbRootStrip.under. Also types AutoMovieHumanLimbRootStrip.columns, AutoMovieHumanLimbRootStrip.a.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `first`, `second`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbRootStrip.ts#IAutoMovieHumanLimbRootStrip.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What the strip is built from.

## @evidence contracts/development/design.md#principled-representation `start`: The trunk's ring at the limb's phases with its jet down across the ring. `end`: The limb's own section at the strip's far end with its law's jet, one per phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLimbRootStrip.strip. Also types AutoMovieHumanLimbRootStrip.{ start, end }.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `start`, `end`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanLimbRootStrip.ts#IAutoMovieHumanLimbRootStrip.IStrip

## @evidence contracts/development/common.md#meaningful-documentation

The strip.

## @evidence contracts/development/design.md#principled-representation

The strip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLimbRootStrip.strip. Also types AutoMovieHumanArmLaw.strip, AutoMovieHumanLegChain.strip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmLaw.strip, AutoMovieHumanLimbRootStrip.strip, AutoMovieHumanLegChain.strip, AutoMovieHumanLegChain.ankle for the strip.

# src/human/generation/IAutoMovieHumanLimbRootStrip.ts#IAutoMovieHumanLimbRootStrip.JetAt

## @evidence contracts/development/common.md#meaningful-documentation

The jet of a smooth curve along its run, read by central differences of its points a step either side.

## @evidence contracts/development/design.md#principled-representation

The jet of a smooth curve along its run, read by central differences of its points a step either side. The callable takes run and returns AutoMovieVector3Tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLimbRootStrip.JetAt is the canonical exchange used by AutoMovieHumanLimbRootStrip.jet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLimbRootStrip.jet for the jet of a smooth curve along its run, read by central differences of its points a step either side.

# src/human/generation/IAutoMovieHumanLimbRootStrip.ts#IAutoMovieHumanLimbRootStrip.EdgeAt

## @evidence contracts/development/common.md#meaningful-documentation

The jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end.

## @evidence contracts/development/design.md#principled-representation

The jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end. The callable takes run and returns AutoMovieVector3Tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLimbRootStrip.EdgeAt is the canonical exchange used by AutoMovieHumanLimbRootStrip.edge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLimbRootStrip.edge for the jet of a smooth curve at its end, read by one-sided differences of third order into it, since nothing exists past the end.

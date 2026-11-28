# src/construction/IAutoMovieLoftViewFullSource.ts#IAutoMovieLoftViewFullSource.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the authored data required by the factory and states the retained-input lifetime.

## @evidence contracts/development/design.md#principled-representation

LoftViewFullSource passes the scalar fields to LoftViewSource.create and retains the actual axis with a copy of the relief list. It refuses a missing or rejected direct scalar source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input reuses ViewSource.IInput and only adds the placement and feature fields already owned by ViewPart. It requires no emitted loft chain or mesh.

# src/construction/IAutoMovieLoftViewFullSource.ts#IAutoMovieLoftViewFullSource.IReader

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the domain and separates the two capabilities at a collapsed pole.

## @evidence contracts/development/design.md#principled-representation

The full reader prepares value-only geometry from scalar outlines and axis.at. It obtains second-order geometry independently through loftViewWorldJet and rejects collapsed poles for that operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Point returns a world vector while jet reuses the solid-surface result for downstream consumers. The reader owns a bounded preparation cache for point queries.

# src/construction/IAutoMovieLoftViewFullSource.ts#IAutoMovieLoftViewFullSource.IReader.domain

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives bound order, units and source ownership.

# src/construction/IAutoMovieLoftViewFullSource.ts#IAutoMovieLoftViewFullSource.IReader.point

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives both input units, result frame, derivative independence and the collapsed-tip outcome.

# src/construction/IAutoMovieLoftViewFullSource.ts#IAutoMovieLoftViewFullSource.IReader.jet

## @evidence contracts/development/common.md#meaningful-documentation

The comment maps the two input coordinates to the published derivative names and states the refusal paths.

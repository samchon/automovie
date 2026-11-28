# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.create

## @evidence contracts/development/common.md#meaningful-documentation

States the saved kind, accepted measurements, default scene identity and contact roles.

## @evidence contracts/development/implementation.md#principled-implementation

Validates a saved kind and sends its applicable measurements to the named geometry factory. That factory retains the original model frame and measured size.

## @evidence contracts/development/implementation.md#efficient-algorithms

One selector lookup delegates to one producer, which alone reads the geometry record and builds the model.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the four accepted saved selectors and their order.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.THIN

## @evidence contracts/development/common.md#meaningful-documentation

Gives the shared authored thickness and exactly the three parts using it.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.STRAP

## @evidence contracts/development/common.md#meaningful-documentation

Gives the watch-specific strap width and its unit.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the common measurement units for bands across the four forms.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the variant-owned geometry and mass ranges.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.PRODUCERS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the route from each saved name to its corresponding narrower factory.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the four saved wearable selectors.

## @evidence contracts/development/design.md#principled-representation

The selector distinguishes the worn body, its contact frames and measures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union aliases the four values used by the existing measurement tables and producer map.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the common grip and wearing socket and the watch-only dial.

## @evidence contracts/development/design.md#principled-representation

A worn prop can be held and placed at an appropriate location. A watch additionally offers a separate readable plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The common union exposes actual built roles without creating extra contacts on other forms.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the per-shape meanings of the geometric measurements.

## @evidence contracts/development/design.md#principled-representation

The same scalar keys describe the watch case and strap, hat footprint, frame and temples, or helmet bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One unit table and four measurement keys serve every archived wearable recipe.

# src/props/AutoMovieArchetypeWearable.ts#AutoMovieArchetypeWearable.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the saved form, scene identity and applicable fixed measurements.

## @evidence contracts/development/design.md#principled-representation

A single selector determines which finite dimensions and mass ranges apply to the wearable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the same public settings as the measured construction owner.

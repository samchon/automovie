# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.create

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes work contact, stack area and edge ledges. It names the floor frame, applicable size choice, seedless defaults and front bar clearance. The example selects an installed nominal record instead of directly setting its derived length.

## @evidence contracts/development/implementation.md#principled-implementation

The selected size supplies service-counter length or pupil-desk height when applicable. The top, stack extent and edge frames derive from the same positive measurements. A counter-type base and table legs use separate support geometry. The bar's front recess preserves the documented knee space.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw and size selection prepare the dimensions for a top, a bounded number of supports and six affordances. Temporary bands and parts are owned by the invocation.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the accepted worktop and support variants.

## @evidence contracts/development/design.md#principled-representation

A validated kind indexes its own bands and any size list. Geometry switches between legs, a counter base and paired altar pedestals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The author selects the use and shape from one kind. Contact names remain common to all kinds.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists all runtime variants the factory admits.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.Size

## @evidence contracts/development/common.md#meaningful-documentation

Names the discrete nominal length and height choices in inches.

## @evidence contracts/development/design.md#principled-representation

Each saved ID belongs to one catalogue axis in one of two kinds. The size picker checks membership in the selected kind and supplies the corresponding metre figure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An author selects the catalogue identity without repeating its recorded dimension. Other table dimensions stay in their kind's bands.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.SIZES

## @evidence contracts/development/common.md#meaningful-documentation

Stores the catalogue figure in metres for each valid size and puts each unseeded default first.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.LEG_INSET

## @evidence contracts/development/common.md#meaningful-documentation

Gives the estimated metre offset of leg centres and the altar pedestal edge from the top perimeter.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.LEG_RADIUS

## @evidence contracts/development/common.md#meaningful-documentation

Gives the metre radius used for the cylindrical legs.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.COUNTER_OVERHANG

## @evidence contracts/development/common.md#meaningful-documentation

Gives the estimated front extension in metres for the regular and service counters. The raised bar has its own knee-space dimension.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.PUPIL_TOP

## @evidence contracts/development/common.md#meaningful-documentation

Converts the pupil desk's sourced 5/8-inch top thickness to metres.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.ALTAR_PEDESTAL

## @evidence contracts/development/common.md#meaningful-documentation

Records estimates for a pedestal width as a fraction of top length and depth as a fraction of top depth.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Documents the two top contact uses and the coordinate axes of the four edge names.

## @evidence contracts/development/design.md#principled-representation

All variants expose surface and stack contacts at the top height, with their dimensions derived from the physical top. The ledge origins and lengths match its four edges.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A producer uses one shared name set for every table and returns the geometry through standard affordance records.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Describes top height, length and depth in metres and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Applicable values come from the selected kind's bands and any recorded size. The draw session admits fixed measurements and catalogue choices separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same keys label supported fixed settings and the resulting provenance. Every geometry route consumes the resulting shared positive measurements.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Labels the three geometry fields in metres and mass in kilograms.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names kind, scene ID and the two applicable size axes with their first-record defaults.

## @evidence contracts/development/design.md#principled-representation

A required kind determines whether a size can be supplied. The model picker admits only records of that variant. The band picker refuses fixed settings where a model owns a dimension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The saved record reuses the public variant, size and dimension names. It allows user-typed inputs to be checked by the actual owner.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The variant selects the band and catalogue plus the support form.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.IParams.size

## @evidence contracts/development/common.md#meaningful-documentation

A service counter defaults to the 30-inch record and a pupil desk to the 19-inch record when unseeded. An explicit size picks only that kind's record.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

A supplied scene ID is carried through the builder. Omission uses the table family ID.

# src/furniture/AutoMovieArchetypeTable.ts#AutoMovieArchetypeTable.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Separates free dimensions from the service counter's length and pupil desk's height, which the nominal records supply.

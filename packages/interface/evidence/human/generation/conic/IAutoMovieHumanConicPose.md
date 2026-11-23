# src/human/generation/conic/IAutoMovieHumanConicPose.ts#IAutoMovieHumanConicPose.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

A jointed course's runs and turns in arclength, as `AutoMovieViewJointedCourse.prepare` dates them.

## @evidence contracts/development/design.md#principled-representation `lengths`: Segment lengths between neighbouring centres, mm. `angles`: Each interior centre's turn angle, radians. `halves`: Each turn's half arclength, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanConicPose.course. Read by AutoMovieHumanConicPose.breaks, AutoMovieHumanConicPose.map. Also types AutoMovieHumanConicPose.[from, to].

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lengths`, `angles`, `halves`, `setbacks`, `starts`, `total`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicPose.ts#IAutoMovieHumanConicPose.MapResult

## @evidence contracts/development/common.md#meaningful-documentation

The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span.

## @evidence contracts/development/design.md#principled-representation

The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span. Alternatives are ((station: number) => number); null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicPose.MapResult is the canonical exchange used by AutoMovieHumanConicPose.map.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicPose.map for the map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the last, and linear across each turn's span.

# src/human/generation/conic/IAutoMovieHumanConicPose.ts#IAutoMovieHumanConicPose.TwistCarried

## @evidence contracts/development/common.md#meaningful-documentation

The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.

## @evidence contracts/development/design.md#principled-representation

The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart. The callable takes run, direction and returns AutoMovieVector3Tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicPose.TwistCarried is the canonical exchange used by AutoMovieHumanConicPose.twist.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicPose.twist for the roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.

# src/human/generation/conic/IAutoMovieHumanConicPose.ts#IAutoMovieHumanConicPose.ReposeCarried

## @evidence contracts/development/common.md#meaningful-documentation

A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.

## @evidence contracts/development/design.md#principled-representation

A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for. The callable takes run, direction and returns AutoMovieVector3Tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicPose.ReposeCarried is the canonical exchange used by AutoMovieHumanConicPose.repose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicPose.repose for a family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.

# src/human/generation/conic/IAutoMovieHumanConicPose.ts#IAutoMovieHumanConicPose.IReposeResult

## @evidence contracts/development/common.md#meaningful-documentation

A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its joints' twists ask for.

## @evidence contracts/development/design.md#principled-representation `family`: Family with the requested segment placement and unchanged section shape fields. `station`: Mapping from original to posed station, or null when the family is moved rigidly and its station coordinate is unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicPose.IReposeResult is the canonical exchange used by AutoMovieHumanConicPose.repose, AutoMovieHumanF1Placement.repose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `family`, `station`; callers supply the complete record.

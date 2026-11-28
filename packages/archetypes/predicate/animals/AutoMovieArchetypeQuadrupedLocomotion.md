# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.admit

## @evidence contracts/development/common.md#meaningful-documentation

Names the independent snapshot, ordered gaits and normalized touchdown rules.

## @evidence contracts/development/implementation.md#principled-implementation

Admission copies rows and pose data after validating finite scalars, complete phases and gait ordering. Every clock row has a finite reciprocal, and a mass rule keeps its finite signed exponent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads row values once and uses one bounded gait vocabulary to verify and copy the associated definitions.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.camel

## @evidence contracts/development/common.md#meaningful-documentation

Names the existing walk, paired pace support, authored timing and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The walk stays measured. The pace uses authored clocks and its fixed lateral pair phases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds only the added pace rows before admitting the two-gait absolute table.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.deer

## @evidence contracts/development/common.md#meaningful-documentation

Names the authored alternatives, ordering constraints and gait construction.

## @evidence contracts/development/implementation.md#principled-implementation

Sika walk stays in the table. Requested faster gaits add their own speed rows and phase order, keeping pose proxies under walk.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds only the gait rows supplied and admits the result in one common owner.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.ICamel.pace

## @evidence contracts/development/common.md#meaningful-documentation

States the number of accepted rows and their ordering.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock.foreStance

## @evidence contracts/development/common.md#meaningful-documentation

Names fore support seconds and the strict period limit.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock.hindStance

## @evidence contracts/development/common.md#meaningful-documentation

Names distinct hind support seconds and the strict period limit.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock.speed

## @evidence contracts/development/common.md#meaningful-documentation

Defines positive speed units and strict row ordering.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock.stride

## @evidence contracts/development/common.md#meaningful-documentation

Defines the positive period whose reciprocal must remain finite.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerGallop.gallop

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the required ordered rotary clocks.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerGallop.trot

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the absent trot in this branch.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerTrot.gallop

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the optional faster rotary clock sequence.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerTrot.trot

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the required ordered diagonal clocks.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.ICamel

## @evidence contracts/development/common.md#meaningful-documentation

Names the authored pace addition and observed walk baseline.

## @evidence contracts/development/design.md#principled-representation

One pace row sequence joins the camel's existing walk table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the speed and clock data needed for the new gait is required.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IClock

## @evidence contracts/development/common.md#meaningful-documentation

Names the four clock scalars and their physical units.

## @evidence contracts/development/design.md#principled-representation

Separate contact times allow fore and hind duty to differ without changing the period.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One speed and three time values describe every authored clock point.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeer

## @evidence contracts/development/common.md#meaningful-documentation

Defines the supported combinations of authored trot and gallop.

## @evidence contracts/development/design.md#principled-representation

At least one authored faster gait is present while the measured walk is always kept.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two record branches describe the supported nonempty combinations.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerGallop

## @evidence contracts/development/common.md#meaningful-documentation

Defines the gallop-only branch with the existing walk.

## @evidence contracts/development/design.md#principled-representation

The absence of trot excludes it from the produced table while gallop adds its required rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The required gallop rows fully describe this branch's extension.

# src/animals/AutoMovieArchetypeQuadrupedLocomotion.ts#AutoMovieArchetypeQuadrupedLocomotion.IDeerTrot

## @evidence contracts/development/common.md#meaningful-documentation

Defines the required trot and optional gallop.

## @evidence contracts/development/design.md#principled-representation

Each supplied sequence generates its own ordered gait, with gallop following trot when present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The optional sequence permits the shared walk-plus-trot and three-gait route.

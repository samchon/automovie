# src/human/generation/IAutoMovieHumanFootCourse.ts#IAutoMovieHumanFootCourse

## @evidence contracts/development/common.md#meaningful-documentation

Original chain addresses and evaluated candidates of a bounded anatomical phase search. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IAddress, IMinimum, MinimumScore declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IAddress, IMinimum, MinimumScore separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanFootCourse exchanges the named IAddress, IMinimum, MinimumScore contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanFootCourse.ts#IAutoMovieHumanFootCourse.IAddress

## @evidence contracts/development/common.md#meaningful-documentation

Exact source chain and material address before a display ring exists.

## @evidence contracts/development/design.md#principled-representation `chain`: Source chain. `station`: Calibration-mm station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootCourse.minimum, AutoMovieHumanFootCourse.course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chain`, `station`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootCourse.ts#IAutoMovieHumanFootCourse.IMinimum

## @evidence contracts/development/common.md#meaningful-documentation

The best evaluated point of a bounded phase search, not a continuous global-minimum guarantee.

## @evidence contracts/development/design.md#principled-representation `phase`: Material phase, radians. `point`: Actual source point, calibration mm. `score`: Value of the anatomical site objective.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootCourse.minimum. Also types AutoMovieHumanFootCourse.best, AutoMovieHumanFootCourse.candidate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `phase`, `point`, `score`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanFootCourse.ts#IAutoMovieHumanFootCourse.MinimumScore

## @evidence contracts/development/common.md#meaningful-documentation

Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.

## @evidence contracts/development/design.md#principled-representation

Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps. The callable takes point and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootCourse.MinimumScore is the canonical exchange used by AutoMovieHumanFootCourse.minimum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootCourse.minimum for sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck

## @evidence contracts/development/design.md#principled-representation

A list of typed findings and a list of loose mutants; the pass rule, no form finding and nothing loose, is read from the two lists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `checkAutoMovieFormExpectation` and read by modelling work and tests deciding whether a form and its expectation hold.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No Boolean verdict is stored beside the lists it would duplicate; no cast.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the pass rule, why mutant findings are expected, and the order of findings.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.Subject

## @evidence contracts/development/design.md#principled-representation

The form or one of its two mutants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carried by every finding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the expectation's mutant union rather than restating it.

## @evidence contracts/development/common.md#meaningful-documentation

States what each subject is.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.IFinding

## @evidence contracts/development/design.md#principled-representation

A union discriminated by `field`, so each finding carries the measured and expected values of its own kind and unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The check's `findings` element; consumers switch on `field`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A discriminated union instead of optional members that could combine into a finding with no meaning.

## @evidence contracts/development/common.md#meaningful-documentation

States that it is one failed expectation and what discriminates it.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.ISizeFinding

## @evidence contracts/development/design.md#principled-representation

The failed axis, its measured extent in metres and the expected range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitted for each axis outside its range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

## @evidence contracts/development/common.md#meaningful-documentation

States each member and unit.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.IPiecesFinding

## @evidence contracts/development/design.md#principled-representation

The measured and expected piece counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitted when the counts differ.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.IGeneraFinding

## @evidence contracts/development/design.md#principled-representation

The measured genera in ascending order with nulls last, a null standing for a piece without a genus, and the expected genera.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitted when the sorted lists differ or a genus is null.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null keeps a piece without a genus visible instead of dropping it from the list.

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the meaning of null.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.IPointFinding

## @evidence contracts/development/design.md#principled-representation

The field, the point's index and position in model metres, and the winding query's whole answer there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitted for each solid point not inside and each empty point inside or on the surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The winding answer is reused as the measured value rather than reduced to a Boolean, so a caller sees how far the point was from the threshold.

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and what each field requires.

# src/geometry/IAutoMovieFormCheck.ts#IAutoMovieFormCheck.IPairFinding

## @evidence contracts/development/design.md#principled-representation

The expected pair and the contact report's record for it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitted only for the form, because a mutant has one part.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The subject is the literal `form`, so a pair finding on a mutant cannot be stated.

## @evidence contracts/development/common.md#meaningful-documentation

States each member and why only the form has pairs.

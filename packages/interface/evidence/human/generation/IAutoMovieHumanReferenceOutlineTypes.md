# src/human/generation/IAutoMovieHumanReferenceOutlineTypes.ts#IAutoMovieHumanReferenceOutlineTypes.IRow

## @evidence contracts/development/common.md#meaningful-documentation

One observed station, with only the columns its reading retained.

## @evidence contracts/development/design.md#principled-representation

A numeric share and sparse mean/SD maps represent an observation without filling a missing cell or asserting a universal unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One row shape is shared by every normalized station table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Describes retained observations only, with no generated curve or expected output embedded in the type.

# src/human/generation/IAutoMovieHumanReferenceOutlineTypes.ts#IAutoMovieHumanReferenceOutlineTypes.ITable

## @evidence contracts/development/common.md#meaningful-documentation

A normalized station table and the metadata needed to interpret it.

## @evidence contracts/development/design.md#principled-representation

Keeps declared columns, sparse rows and their measurement normalization together; numeric ordering and validity remain reader premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One shared record serves the registry and its arm, foot, leg and trunk consumers without duplicate schema definitions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retains empty rows and missing cells as data states rather than synthesizing measurements or narrowing a consumer's required columns.

# src/human/generation/IAutoMovieHumanReferenceOutlineTypes.ts#IAutoMovieHumanReferenceOutlineTypes.IFootprint

## @evidence contracts/development/common.md#meaningful-documentation

One mass's measured footprint summary on its declared trunk-wall datum.

## @evidence contracts/development/design.md#principled-representation

Separates footprint metadata and six mean/SD quantities whose units and wall construction are declared by each table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Breast and sex-specific gluteal summaries share one record shape while retaining their distinct samples and normalization.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not make a stature-normalized observation an independently measured chest-depth or gluteal-amplitude law.

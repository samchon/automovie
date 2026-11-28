# src/geometry/IAutoMovieMeshSeparationVerdict.ts#IAutoMovieMeshSeparationVerdict

## @evidence contracts/development/common.md#meaningful-documentation

Early-stop decision for complete feature separation from a compiled resident surface.

## @evidence contracts/development/design.md#principled-representation

The early query uses the same proofs and pass condition as the full measurement, then stops on a failed attachment cap or the first below-target resident triangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The verdict returns a decision and one traceable witness. The full measurement owns aggregate bounds, examined counts and contact caps.

# src/geometry/IAutoMovieMeshSeparationVerdict.ts#IAutoMovieMeshSeparationVerdict.certified

## @evidence contracts/development/common.md#meaningful-documentation

True when the complete feature passes the same geometric proof as a full measurement with the same admitted inputs.

# src/geometry/IAutoMovieMeshSeparationVerdict.ts#IAutoMovieMeshSeparationVerdict.witness

## @evidence contracts/development/common.md#meaningful-documentation

Original resident triangle ordinal that ended certification in walk order, or -1 when certified. A failed attachment cap supplies its support ordinal.

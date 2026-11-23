# src/human/generation/foot/IAutoMovieHumanFootGeometry.ts#IAutoMovieHumanFootGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Describes the monotone predicate supplied to the foot's bounded root search; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The monotone predicate supplied to the foot's bounded root search. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootGeometry; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootGeometry contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/foot/IAutoMovieHumanFootGeometry.ts#IAutoMovieHumanFootGeometry.RootHolds

## @evidence contracts/development/common.md#meaningful-documentation

Predicate of a physical foot length s in millimetres. The root caller requires a false-to-true crossing on its search interval; the predicate does not supply the bracket or fallback value.

## @evidence contracts/development/design.md#principled-representation

Predicate of a physical foot length s in millimetres. The root caller requires a false-to-true crossing on its search interval; the predicate does not supply the bracket or fallback value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootGeometry.RootHolds is the canonical exchange used by AutoMovieHumanFootGeometry.root.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanFootGeometry input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

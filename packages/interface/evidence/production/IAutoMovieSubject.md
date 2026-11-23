# src/production/IAutoMovieSubject.ts#IAutoMovieSubject

## @evidence contracts/development/design.md#principled-representation

An abstract class is the TypeScript idiom for a contract with no shared state: `id`, `design` and `render` are abstract, so the compiler refuses a concrete subject that omits one, and the premise that `design` is deterministic rests on the subclass because the base runs no code.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three abstract members and no fields or constructor; composition lives in the one subclass `AutoMovieSubjectGroup`, and merging lives in `mergeAutoMovieSubjectContributions`, so this class only names the obligations an authored source answers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names no subject kind, production or fixture and patches nothing; the unenforced determinism of `design` is stated as the subclass's obligation instead of being simulated by a cache or freeze in the base.

## @evidence contracts/development/common.md#meaningful-documentation

States the four obligations a subject owns, that `design` is the only path to the builder and must be byte-identical for equal inputs, that utilities delegate to engine functions, and that the base enforces none of this at runtime.

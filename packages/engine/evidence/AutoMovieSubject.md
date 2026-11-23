# src/AutoMovieSubject.ts#AutoMovieSubject

## @evidence contracts/development/design.md#principled-representation

An abstract class is the TypeScript idiom for a contract with no shared state: `id`, `design` and `render` are abstract, so the compiler refuses a concrete subject that omits one, and the premise that `design` is deterministic rests on the subclass because the base runs no code.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three abstract members and no fields or constructor; composition lives in the one subclass `AutoMovieSubjectGroup`, and merging lives in `mergeAutoMovieSubjectContributions`, so this class only names the obligations an authored source answers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names no subject kind, production or fixture and patches nothing; the unenforced determinism of `design` is stated as the subclass's obligation instead of being simulated by a cache or freeze in the base.

## @evidence contracts/development/common.md#meaningful-documentation

States the four obligations a subject owns, that `design` is the only path to the builder and must be byte-identical for equal inputs, that utilities delegate to engine functions, and that the base enforces none of this at runtime.

# src/AutoMovieSubject.ts#AutoMovieSubject.prototype.design

## @evidence contracts/development/implementation.md#principled-implementation

An abstract method returning the plain `TDesign` record, so a subject's tracked value is computed from its constructor inputs on demand and equal inputs give equal records, which is the determinism premise the frames rely on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A method rather than a stored field, so a subclass derives the record from the members it already holds instead of keeping a second transcribed copy that could drift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Has no base body to special-case anything; the byte-identity requirement is a stated subclass obligation, with no base-level freeze or cache masking a non-deterministic override.

## @evidence contracts/development/common.md#meaningful-documentation

States that the result is the record the builder reads, that every call must be byte-identical for the same constructor inputs, and that the base neither checks, caches nor freezes it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Abstract with no body; the time to derive a design record is the overriding subclass's cost and is answered on that override.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The base memoizes no design record, because a cached record could be mutated by a caller; a subclass may cache when its record is immutable.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record to the caller, who owns it; the base retains nothing between calls.

# src/AutoMovieSubject.ts#AutoMovieSubject.prototype.render

## @evidence contracts/development/implementation.md#principled-implementation

Returns only the contribution fields this subject owns, a partial record the shot merges, so a shot program is assembled by concatenation in subject order rather than by any subject knowing the whole shot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One context parameter carries every builder-owned runtime fact, so a subject reads model groups, world and formation runtimes from one place instead of taking each as its own argument.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Abstract here, so the base adds no fix-up to a subject's output; collisions between subjects pass through the merge to the builder's own uniqueness checks.

## @evidence contracts/development/common.md#meaningful-documentation

States which builder-owned facts the context supplies and that the merge copies the returned elements into new arrays rather than keeping the subject's arrays.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Abstract with no body; how a subject builds its contribution, and at what cost, is answered on each override such as `AutoMovieSubjectGroup.render`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The base shares no contribution between calls, since the context differs per shot; any per-shot reuse belongs to the overriding subject.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing after returning; the caller owns the returned contribution and the merge keeps only element references, not the subject's arrays.

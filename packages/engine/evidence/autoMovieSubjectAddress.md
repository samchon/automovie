# src/autoMovieSubjectAddress.ts#autoMovieSubjectAddress

## @evidence contracts/development/implementation.md#principled-implementation

A kind prefix followed by the owning ids is a total, deterministic spelling of each stored subject, which is all an address needs to be stable across revisions; the collision case for ids carrying separators is stated rather than escaped, because escaping would change every published address.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for the address grammar, read by subject description and by the structural diff, which previously rebuilt `prototype-part:`, `instance-set:`, `space:` and `building:` strings inline; the tuple parameter fixes each kind's id count at compile time.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject or id is special-cased; each kind has one fixed form.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every form, how a built element's node is spelled, the verbatim insertion and its collision consequence, and where instance addresses live.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per call, one string template, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure formatter of one subject that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned string and retains nothing.

# src/geometry/construction/AutoMovieConstructionAdmission.ts#AutoMovieConstructionAdmission.admit

## @evidence contracts/development/implementation.md#principled-implementation

Recursively builds each subtree's view/face name sets and checks references against the required side; one global seen set rejects repeated names before descending further.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single structural walk owns union-kind, name-uniqueness and subtree-reference admission before realization mutates a body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects the listed structural failures by throwing; this is not complete numeric/shape-field validation, which the typed node operators perform separately.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the subtree naming rules, the pre-realization role and the node/rule failure form.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N nodes and depth D, copying descendant name sets costs O(ND) work in the worst case, including quadratic work for a skewed tree; no linear-total claim is made.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes each subtree's two sets once and reuses them for reference checks and the parent union rather than rewalking that subtree per reference.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The seen set, returned child sets, union temporaries and recursion stack are owned by this synchronous call and become unreachable on return/throw; no tree or name cache survives.

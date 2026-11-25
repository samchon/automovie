# src/furniture/createLoad.ts#createLoad

## @evidence contracts/development/implementation.md#principled-implementation

One dimensioned box; a crate's contents add to its own mass, and are bounded so the heaviest crate stays at the 25 kg HSE gives for a man's lift close to the body between knuckle and elbow height (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the contents, draw the dimensions, one part and its three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A sack does not sag; it is a rigid shape at rest.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the load lies and where it is held.

# src/index.ts#IAutoMovieMaterialLibrary

## @evidence contracts/development/design.md#principled-representation

Material ids resolve against admitted complete model declarations before one shared runtime material is built per requested identity; null requests the borrowing renderer's default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Resolve lends materials while dispose closes the shot-owned table; texture clones stay in the separate shot texture cache.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Conflicting or missing declarations refuse in the producer instead of selecting whichever model appears first.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowing rules, null default semantics, library material ownership and separate texture-cache retirement order.

# src/index.ts#IAutoMovieMaterialLibrary.resolve

## @evidence contracts/development/implementation.md#principled-implementation

Resolves only admitted requested ids to their one library-owned material; null selects a renderer-owned default and unknown or disposed requests refuse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A synchronous resolver is the borrowing surface's entire material capability, keeping declaration search and construction out of drawables.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unrequested material never falls back to a similarly named or first-built entry.

## @evidence contracts/development/common.md#meaningful-documentation

Documents null/undefined default meaning and the returned object's borrowed ownership.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The producer implements one Map lookup, with no mesh or model traversal during resolution.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every request for the same admitted id borrows the same built material for this shot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Resolution lends an existing object and transfers no disposal responsibility to the surface.

# src/index.ts#IAutoMovieMaterialLibrary.dispose

## @evidence contracts/development/implementation.md#principled-implementation

Independently attempts every built material and preserves a single failure or ordered aggregate while marking the library closed before release begins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Material retirement closes this library alone; texture-cache disposal follows under the shot owner's separate lifetime.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed material release stays a failure on repeated calls rather than being replaced with a successful no-op or silently skipping later materials.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-once material retirement and separate texture ownership and ordering.

## @evidence contracts/development/implementation.md#efficient-algorithms

Attempts one operation per distinct material and deletes successful entries, with failure collection proportional to owned material count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated disposal shares the first completion or stored failure identity and never repeats physical disposal attempts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful material references leave the library; failed materials remain retained with the stored failure while the external shot cache continues owning texture wrappers.

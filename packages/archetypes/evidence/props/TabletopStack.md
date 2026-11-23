# src/props/TabletopStack.ts#TabletopStack.Contact

## @evidence contracts/development/common.md#meaningful-documentation

Names the pinch, the underside socket and the upper socket.

## @evidence contracts/development/design.md#principled-representation

A closed union of the three contact ids `contacts` builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The grip a hand takes and the two sockets placing and stacking read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no producer-specific contact.

# src/props/TabletopStack.ts#TabletopStack.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States each contact's place and frame.

## @evidence contracts/development/implementation.md#principled-implementation

The sockets share the upright attitude at the underside and upper face, so a prop's base laid on another's top stacks it squarely.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three affordance calls.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every stackable tabletop prop shares these contacts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

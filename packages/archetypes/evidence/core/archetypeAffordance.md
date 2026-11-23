# src/core/archetypeAffordance.ts#archetypeAffordance

## @evidence contracts/development/common.md#meaningful-documentation

Uses the producer identity, model display name and current contact list in the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Searches the supplied contact list for the exact id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup followed by the missing-contact refusal.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan through the model contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Has no repeated computation on successful lookup.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The lookup retains nothing.

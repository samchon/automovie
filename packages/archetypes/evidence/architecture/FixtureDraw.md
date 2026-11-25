# src/architecture/FixtureDraw.ts#FixtureDraw.IContactWriter

## @evidence contracts/development/common.md#meaningful-documentation

Names the builder action available to shared contact construction.

## @evidence contracts/development/design.md#principled-representation

A contact ID union restricts each helper to the subset of contacts it writes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Retains only the writer method, independent of the caller's other contacts and shapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the canonical affordance fields with their existing frames and parameter meanings.

# src/architecture/FixtureDraw.ts#FixtureDraw.IContactWriter.affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the argument and the write to the caller's builder.

## @evidence contracts/development/implementation.md#principled-implementation

The builder receives the existing affordance and retains ownership of its validation and storage.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Gives each shared constructor one operation for writing a contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The helper must supply an identifier in its declared subset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The interface declares a single call to the existing builder.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared contacts use the same writer for each shape that offers them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The given builder owns the recorded contact.

# src/architecture/FixtureDraw.ts#FixtureDraw.InstalledFamily

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of installed.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only installed and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/architecture/FixtureDraw.ts#FixtureDraw.installed

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the shared input setup and the selected construction.

## @evidence contracts/development/implementation.md#principled-implementation

Validate the selected bands with the original draw namespace before building its parts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw dimensions, build the given construction and apply the drawn mass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keep family-dependent refusal and physical material.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The selected fixture draws a bounded number of bands.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the draw and builder setup across the fixed installations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The call retains only the built fixture's records.

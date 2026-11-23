# src/internal/humanoidBoneOfName.ts#humanoidBoneOfName

## @evidence contracts/development/implementation.md#principled-implementation

Lowercasing, removing a leading `mixamorig` prefix and dropping separator characters reduces each convention's spelling to one key, and an exact `Map` lookup resolves it, so inherited object keys can never match.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The table and the normalization live in one module that the skeleton importer and the byte inspector both call, replacing two copies that had to be kept in step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The closed alias vocabulary is a naming convention supported by this mapper rather than an anatomical inference, and both callers keep their own first-claim rule instead of the helper guessing between duplicates.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the normalization steps with an example, the covered conventions, the unmapped finger, eye and jaw slots, and what `undefined` means.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is linear in the name length for two regular-expression passes and one lowercase copy, then one hash lookup.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each invocation normalizes its supplied name; a joint shared by several skins may be revisited, and this helper retains no cache over mutable source revisions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The module-level table is a fixed forty-entry constant; a call retains nothing.

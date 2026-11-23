# src/model/import/AutoMovieExternalModelIngestProfile.ts#AutoMovieExternalModelIngestProfile

## @evidence contracts/development/design.md#principled-representation

A closed union of four versioned profile literals makes the caller choose an interpretation explicitly instead of the inspector sniffing one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union is mirrored at run time by a registry typed as a `Record` over it, so the type and the accepted strings cannot drift.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default profile exists; an unknown string is refused by the inspector and by the runtime guard.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what each of the four profiles adds to the structural checks.

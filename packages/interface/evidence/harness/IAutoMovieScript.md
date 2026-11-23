# src/harness/IAutoMovieScript.ts#IAutoMovieScript

## @evidence contracts/development/design.md#principled-representation

Beats and cast members are id-keyed lists the stage gates index once and refuse duplicates in, so a lookup by beat or node names one record; the optional tree is checked against the flat beats by `validateScriptTree`, which requires each beat to be claimed by exactly one beat node.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The flat beats are what the pipeline runs on and the tree is optional authoring structure over them, so a script without a tree is complete and the tree adds no field the stages need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Duplicate ids are refused rather than resolved by position, and a tree that forgets a beat is refused rather than rendered without it.

## @evidence contracts/development/common.md#meaningful-documentation

States what the stages join on and which gates refuse duplicates, the shot id convention, and every stored-script refusal; members give each list's role and what an absent tree means.

# src/deriveAutoMovieProjectName.ts#deriveAutoMovieProjectName

## @evidence contracts/development/implementation.md#principled-implementation

Lowercasing and character replacement produce an unscoped-name candidate from the basename in the host's path syntax, then the 214-character cut precedes trimming so the result stays within that limit. This is normalization rather than complete npm admission: reserved names remain unchanged, while the downstream scaffold renderer separately refuses Windows device names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function owns the directory-to-name rule, so `run` keeps only dispatch and the rule is checked without publishing a scaffold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No directory name is special-cased; the fallback applies whenever normalization leaves an empty candidate, including an all-underscore basename whose characters are removed by leading trim.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states each transformation in order, the limit, the fallback, the caller and consumer, and the difference between an unchanged npm reserved name and a device name refused by the renderer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time and space are linear in the basename's length: one lowercase pass, one replacement and one slice; the final trim's trailing alternative can rescan a run of `-` and `.` that does not end the string, which is quadratic only within that run and bounded by the 214-character cut.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `run` derives one name per scaffold request, so no equivalent derivation is requested twice.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function returns a new string and keeps no state, handle, or task.

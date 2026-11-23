# src/narrative/createNarrativeUnitFiles.ts#createNarrativeUnitFiles

## @evidence contracts/development/implementation.md#principled-implementation

Layer-specific globs select flat numbered treatments, episode files of scripts, and screenplay scene files in a short's film folder or long work's episode folders, narrowing scripts and screenplay to an exact first part for a pilot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The selector owns only relative narrative population paths; callers add the body root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Short film folders and numbered long partitions are supported production layouts; no file or production name controls selection, and first-part pilots remain confined to their exact directory.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states each layer's partition, the scene-file screenplay layout, pilot behavior and root relativity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Complete-work returns one or two fixed-size globs; pilot validation and interpolation take time and output space proportional to the selected part string length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This selector builds one result from supplied values and coordinates no cross-request work; independent arrays avoid shared mutable selector state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned small selector array survives the call; no descriptor, task or module cache is acquired.

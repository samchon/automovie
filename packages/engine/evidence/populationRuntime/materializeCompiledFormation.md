# src/populationRuntime/materializeCompiledFormation.ts#materializeCompiledFormation

## @evidence contracts/development/implementation.md#principled-implementation

Compile placement laws, sorted heroes, chunk/global point summaries and canonical digest, retaining only terrain whose XZ extent intersects the flat footprint. Relief changes Y only; radius fallback remains an estimate when host measurements are absent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Terrain snapshotting, member regeneration and representation composition stay in their owning helpers; compact records store laws and summaries instead of every anonymous member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fixed chunk size and domain-separated phase seed are package policy; no fixture alters placement, and missing-radius fallback does not claim measured enclosure.

## @evidence contracts/development/common.md#meaningful-documentation

Docs describe terrain order, law snapshots, hero transforms, digest bytes and metre radius policy; summaries bound placement points rather than expanded model geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

The flat footprint visits N slots and the grounded chunk/global pass visits each slot once, plus H hero positions; terrain polygon filtering and sampling drive extra work, and C chunks/H heroes/snapshot bytes drive retained output. Hero counting still scans H per chunk.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The flat summary is reused when no terrain changes Y; the grounded pass shares each generated point between chunk and global folds while preserving ascending running-mean order. No cache crosses mutable designs or terrain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cloned placement laws and selected terrain plus C chunks/H heroes transfer to the caller; transient folds and digest bytes are call-local and no resource handle is opened.

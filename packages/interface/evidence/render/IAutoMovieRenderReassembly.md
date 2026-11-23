# src/render/IAutoMovieRenderReassembly.ts#IAutoMovieRenderReassembly

## @evidence contracts/development/design.md#principled-representation

The concat demuxer and stream-copy arguments request joining without re-encoding, under the host's premise that actual chunk streams have compatible parameters. The planner supplies one render spec for their argument vectors but does not inspect encoded bytes here; basename entries resolve relative to the list file's directory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plan gives the list path, its exact lines and the argument vector, so the host only writes one file and spawns one process with no path logic of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `-safe 0` is ffmpeg's documented switch for accepting arbitrary entry names, needed because chunk basenames may contain characters the safe mode rejects, and no output name is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The prose states the host's two steps and why entries are basenames; members state order, the line format and that the arguments copy streams.

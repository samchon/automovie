# src/render/capture/IAutoMovieCaptureStorage.ts#IAutoMovieCaptureStorage

## @evidence contracts/development/design.md#principled-representation

The five file operations a capture performs, with Node's own call shapes, so the host's object needs no adapter and the core's order of file steps runs unchanged against memory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the operations the capture folder calls: list a folder, create one, read a file, write one, delete one. This port owns the capture's operation subset; hosts implement it with their storage API and the core ignores mkdir's host-specific result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a host, and a missing folder or file is the host's rejection, which the capture reports with the path.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it, whose signatures it repeats, how paths are formed and the bound on them.

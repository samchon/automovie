# src/render/capture/IAutoMovieCaptureStorage.ts#IAutoMovieCaptureStorage

## @evidence contracts/development/design.md#principled-representation

The storage operations use Node's call shapes so the host's object needs no adapter. The folder uses the optional actual path of a directory to recognize aliases when the host can report it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This port covers listing, creating and resolving a folder, and reading, writing and deleting files. The core ignores mkdir's host-specific result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a host, and a missing folder or file is the host's rejection, which the capture reports with the path.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it, whose signatures it repeats, how paths are formed and the bound on them.

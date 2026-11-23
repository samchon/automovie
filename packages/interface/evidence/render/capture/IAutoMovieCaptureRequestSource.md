# src/render/capture/IAutoMovieCaptureRequestSource.ts#IAutoMovieCaptureRequestSource

## @evidence contracts/development/design.md#principled-representation

A request is a set of named texts; `get` reads one and `keys` lists the names given, which is what lets the reader refuse a name it does not know and a name given twice.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two methods, the subset of `URLSearchParams` and `Map` the reader calls; declared structurally so neither host adapts its own object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a host; an absent key reads as null or undefined, the two absences the two hosts return.

## @evidence contracts/development/common.md#meaningful-documentation

States which objects satisfy it as they are, and what each method returns for an absent key.

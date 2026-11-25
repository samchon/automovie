# src/AutoMovieFfmpegStaticPath.ts#AutoMovieFfmpegStaticPath

## @evidence contracts/development/common.md#meaningful-documentation

States what the alias names and its two cases.

## @evidence contracts/development/design.md#principled-representation

The type of `ffmpeg-static`'s declared default export: the binary's path, or null on a platform it has none for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the FFmpeg resolver and its two callers; the module's own declaration owns the shape.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of the module's declared type; it adds no shape of its own.
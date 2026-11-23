# src/production/IAutoMovieProductionPngPicture.ts#IAutoMovieProductionPngPicture

## @evidence contracts/development/design.md#principled-representation

probeProductionPngPicture walks complete PNG chunks and decodes image data, then reports IHDR, color declaration, physical pixel aspect and EXIF-presence facts; cICP and mDCV color chunks are currently unread.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record describes observed picture identity while delivery acceptance belongs to assertProductionPngPicture, preserving the distinction between a valid PNG and the supported delivery profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contradictory or repeated color declarations refuse; EXIF presence does not claim decoded orientation, and unidentified color remains explicit instead of being assumed sRGB.

## @evidence contracts/development/common.md#meaningful-documentation

Defines raster precision, channel and alpha form, scan mode, color identity, pixel-aspect metadata and the limited orientation observation.

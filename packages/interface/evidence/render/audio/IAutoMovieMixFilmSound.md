# src/render/audio/IAutoMovieMixFilmSound.ts#IAutoMovieMixFilmSound.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States what the mix reads through `read`, which package admits, decodes, levels, mixes and masters, the optional loudness targets with their EBU R 128 fallback, and every refusal.

## @evidence contracts/development/design.md#principled-representation

The clock is the exact rational frame rate and a whole frame count, the units the encoder plans with, so the sound and the picture share one film length; files arrive only through the host callback.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read: the list, the clock for the plan and `read` for every file.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No file system type appears; the host callback keeps render free of `node:` imports.

# src/render/audio/IAutoMovieMixFilmSound.ts#IAutoMovieMixFilmSound.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the WAVE format, the digest form, that the plan, analysis and loudness record describe the master, and the order of the lines.

## @evidence contracts/development/design.md#principled-representation

The WAVE bytes and their digest identify the soundtrack exactly; the plan and analysis are the engine's own records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The drawn-video route writes `wav`, reports `sha256`, the analysis and each line's receipt digest; the plan and lines serve the mouth plan and the lip-sync measure on the same route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Imports the plan, analysis and receipt from their owners.

# src/render/audio/IAutoMovieMixFilmSound.ts#IAutoMovieMixFilmSound.ILine

## @evidence contracts/development/common.md#meaningful-documentation

States who admits and places it, its consumers, that the line is the plan's line over its speech span, the receipt is admitted and the samples are at 48 kHz.

## @evidence contracts/development/design.md#principled-representation

Pairs the placed line with the bytes and receipt it was placed from, so a consumer reads timing and samples from one record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `admitAutoMovieFilmDialogue`; the route reports each receipt's digest from it, and the mouth plan and lip-sync measure read its span, receipt chunks and samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No timing is restated; the line record is the plan's own.

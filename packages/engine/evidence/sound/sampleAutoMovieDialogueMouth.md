# src/sound/sampleAutoMovieDialogueMouth.ts#sampleAutoMovieDialogueMouth

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the frame a second maps to, how the speaking line is chosen and why the later one wins, which frame the jaw comes from, where the viseme weights come from for both kinds of line, the silent result, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The envelope jaw is defined per frame interval (#4054), so every second inside a frame, a shutter sample included, reads that frame's opening; the visemes are the coarticulation sampler's closed form at the exact fractional frame. A line without chunks carries no phoneme shape, so its only mouth fact is the jaw's fraction of the maximum speech opening, given to a VRM or imported model as the open-jaw `aa` against `sil`. A new line of the same actor takes the mouth from its start, because one mouth speaks one line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The track is render's plan; the jaw law's maximum and the blend are this package's existing owners, so the sampler only selects the line and reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor or line is special-cased. The frame tolerance is far below any shutter offset and far above the double-precision rounding of `f / fps × fps`, so it only keeps whole-frame seconds on their own frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the track's lines to find the speaking one, plus the coarticulation sampler's cost in that line's ranges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the track, the actor and the second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns a fresh record and holds no resource.

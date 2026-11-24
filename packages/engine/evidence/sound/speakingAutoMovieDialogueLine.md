# src/sound/speakingAutoMovieDialogueLine.ts#speakingAutoMovieDialogueLine

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the frame a second falls in, the tolerance below a whole frame and why it is safe for shutter samples, which of two overlapping lines speaks, and the null result.

## @evidence contracts/development/implementation.md#principled-implementation

Frame `f` stands for film second `f / fps` on the mouth track, so a second belongs to the whole frame `floor(seconds × fps)`, the frame whose envelope jaw and span it reads. `f / fps × fps` can round a few ulps below `f` in double precision, which the 1e-6 tolerance absorbs while staying far below any sub-frame shutter offset. A later-starting line wins because the mix places each line from its own start, so a new line's sound starts there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of which line speaks, shared by `sampleAutoMovieDialogueMouth`, which reads the line's mouth, and the draw page, which layers a mouth only while a line speaks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor or line is special-cased; an actor outside every line gives null rather than a default line.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the track's lines, which are a film's adopted lines; no index is kept because the track is read a few times per drawn frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the track, the actor and the second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns a borrowed line from the track and retains nothing.

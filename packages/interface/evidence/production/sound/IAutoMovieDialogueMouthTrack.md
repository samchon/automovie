# src/production/sound/IAutoMovieDialogueMouthTrack.ts#IAutoMovieDialogueMouthTrack

## @evidence contracts/development/common.md#meaningful-documentation

States what the track holds, who builds it, how it reaches the drawn subject and who reads it; each member states its unit, order and the overlap rule.

## @evidence contracts/development/design.md#principled-representation

The film's frame rate and one record per bound line: the mouth facts a draw page needs to give any actor its mouth at any second, as JSON that crosses into the page once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by render's `planAutoMovieDialogueMouths`, handed through `AutoMovieDrawSession.speak`, read by engine's `sampleAutoMovieDialogueMouth` and by render's lip-sync measure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It carries no per-frame viseme weights, which the sampler computes in closed form at any second, and no figure kind, which the subject decides.

# src/production/sound/IAutoMovieDialogueMouthTrack.ts#IAutoMovieDialogueMouthTrack.ILine

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, clock or range, and when `ranges` is null.

## @evidence contracts/development/design.md#principled-representation

A half-open span of whole film frames, one envelope opening in millimetres per frame of it, and the viseme ranges on the emission clock in fractional frames; null ranges mark a line without phoneme chunks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sampler reads the actor, span, jaw and ranges; the measure reads the line id, actor, span and whether ranges exist.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ranges reuse `IAutoMovieDialogueMouthRange` from the join instead of a parallel shape.

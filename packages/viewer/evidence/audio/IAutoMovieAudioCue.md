# src/audio/IAutoMovieAudioCue.ts#IAutoMovieAudioCue

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (One placed audio source excerpt on the film clock; the film's master comes only from engine's `renderProductionSound`, and the Viewer hears the delivered sound by playing that mixed soundtrack as one cue) and documents 7 documented members as stated in this comment.

## @evidence contracts/development/design.md#principled-representation

Represents One placed audio source excerpt on the film clock; the film's master comes only from engine's `renderProductionSound`, and the Viewer hears the delivered sound by playing that mixed soundtrack as one cue: interface of 7 members (`asset`, `seconds`, `gain`, `pan`, `offsetSeconds`, `durationSeconds`, ...); units and frames named in its text: seconds, second. Optional members `pan`, `offsetSeconds`, `durationSeconds`, `rate` express documented absence, and the ranges its member docs state are left to runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `IAutoMovieAudioCue` in packages/viewer/src/audio/IAutoMovieAudioCue.ts; its surface is the 7 members listed and the text shows 6 other files naming it, mostly packages/interface (3), packages/viewer (3), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 4 optional members (`pan`, `offsetSeconds`, `durationSeconds`, `rate`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.

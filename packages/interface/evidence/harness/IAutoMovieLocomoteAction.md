# src/harness/IAutoMovieLocomoteAction.ts#IAutoMovieLocomoteAction

## @evidence contracts/development/design.md#principled-representation

Reference synthesis converts the destination to the staged actor frame and sizes whole gait cycles from distance/speed; trips below half a nominal stride compress one cycle, then velocity times the baked duration supplies the requested travel displacement. Existing gait root bob/sway is added to that travel, and numeric action duration time-scales the result; this is neither measured foot contact nor guaranteed obstacle-free travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A gait name, a destination and one facing switch are the whole travel; cadence, cycle count and root travel come from the actor's gait data, so no speed or path field is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Full XYZ distance below 1e-6 metres steps in place; otherwise XZ distance below 1e-6 is refused as vertical-only. Unknown gaits are refused when vocabulary is supplied, relative goals are not guessed, and absent actor contexts can still yield null synthesis. Finite derived travel/cycle arithmetic is required by the baker, with no terrain or collision path solve in this verb.

## @evidence contracts/development/common.md#meaningful-documentation

States the gait vocabulary with the shipped names, both refusals, how travel and duration are realized, the step-in-place cases, and where a node destination is read; members give the gait match, destination kinds and the facing default.

# src/motion/human/lexicon/IAutoMovieMotionHumanStageBladeFootwork.ts#IAutoMovieMotionHumanStageBladeFootwork

## @evidence contracts/development/common.md#meaningful-documentation

Describes the shot-local controls, frame, scale and named prop event.

## @evidence contracts/development/design.md#principled-representation

Direction is read from the entry body's heading, position in metres and time in seconds. A normalized prop cue is independent of support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One stage mark shift takes its style, direction, optional lead, travel distance, duration and editing cue. Runtime owner is motions/src/lexicon/stageBladeFootwork.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No equipment target, physical impact, score or outcome is inferred by the controls.

# src/motion/human/lexicon/IAutoMovieMotionHumanStageBladeFootwork.ts#IAutoMovieMotionHumanStageBladeFootwork.Style

## @evidence contracts/development/common.md#meaningful-documentation

Describes the profile selected by each literal and the visible motion it controls.

## @evidence contracts/development/design.md#principled-representation

The closed union selects a dimensionless profile name. The runtime profile supplies normalized footfall windows and distances and timing scaled to the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members match the profiles owned by `stageBladeFootwork`, which validates the name against its profile table before planning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every style selects a complete stage profile. None implies a sport rule, target or equipment contact.

# src/motion/human/lexicon/IAutoMovieMotionHumanStageBladeFootwork.ts#IAutoMovieMotionHumanStageBladeFootwork.Direction

## @evidence contracts/development/common.md#meaningful-documentation

States the entry heading, axes and meaning of the four directions.

## @evidence contracts/development/design.md#principled-representation

A direction names one cardinal axis and sign in the horizontal entry frame. Distance is a separate scalar in metres. The closed union excludes vertical or diagonal choices.

## @evidence contracts/development/design.md#minimal-and-owned-surface `stageBladeFootwork` admits the direction against its direction table and uses it to select both the displacement axis and the first foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shared stage action supports all four horizontal directions. Their relation to the actor and lead is independent of the scene or style.

# src/motion/human/lexicon/IAutoMovieMotionHumanStageBladeFootwork.ts#IAutoMovieMotionHumanStageBladeFootwork.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shift's style and floor direction, optional lead and scale overrides, and cue timing.

## @evidence contracts/development/design.md#principled-representation

Closed literals select style, direction and optional lead. `stageBladeFootwork` checks positive duration in seconds, positive travel up to its stature limit in metres, and a cue share in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLexiconBladeParams` exposes these inputs to registered action authors. The `stageBladeFootwork` law owns admission, body-scaled defaults and support scheduling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each optional override can be supplied independently. An absent cue creates no prop event, and an authored cue supplies timing without inferring a hit or score.

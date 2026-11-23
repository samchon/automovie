# src/motion/human/next/IAutoMovieMotionHumanInstrument.ts#IAutoMovieMotionHumanInstrument

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Instrument family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Instrument laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanInstrument.ts#IAutoMovieMotionHumanInstrument.IPlayWindInstrument

## @evidence contracts/development/common.md#meaningful-documentation

Names the method these parameters serve and the law type they alias.

## @evidence contracts/development/design.md#principled-representation

An alias of `IAutoMovieMotionHumanPlayWindInstrument.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPlayWindInstrument.IParams` owns the shape; the alias serves `playWindInstrument` of this family, naming its parameters in the family namespace without a second definition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: a plain alias, with no field added, widened, cast or made optional.

# src/motion/human/everyday/IAutoMovieMotionHumanBreath.ts#IAutoMovieMotionHumanBreath.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

rate: Breaths a minute at rest; a seeded draw from the adult band when absent.

## @evidence contracts/development/design.md#principled-representation

rate: Breaths a minute at rest; a seeded draw from the adult band when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanBreath.ts (HumanBreath.layer, options).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBreath.IExertion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/everyday/IAutoMovieMotionHumanBreath.ts#IAutoMovieMotionHumanBreath.IExertion

## @evidence contracts/development/common.md#meaningful-documentation

from: Film second the bout starts; under way since before the film when absent. at: Film second the bout ends and recovery starts. recovery: Recovery seconds; 60 when absent, the onset's span (Whipp and Ward 1990).

## @evidence contracts/development/design.md#principled-representation

from: Film second the bout starts; under way since before the film when absent. at: Film second the bout ends and recovery starts, no earlier than `from`, which HumanBreath.state admits. recovery: Recovery seconds; 60 when absent, the onset's span (Whipp and Ward 1990).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanBreath.ts (HumanBreath.state, exertion).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanBreath.state.

# src/motion/human/everyday/IAutoMovieMotionHumanBreath.ts#IAutoMovieMotionHumanBreath.IStateResult

## @evidence contracts/development/common.md#meaningful-documentation

rate: Instantaneous breathing rate in breaths per minute. phase: Integrated breathing phase in cycles, including the performer's deterministic phase offset. volume: Tidal breath volume relative to the resting breath volume.

## @evidence contracts/development/design.md#principled-representation

rate: Instantaneous breathing rate in breaths per minute. phase: Integrated breathing phase in cycles, including the performer's deterministic phase offset. volume: Tidal breath volume relative to the resting breath volume.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanBreath.ts (HumanBreath.state, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanBreath.state.

# src/motion/human/ensemble/IAutoMovieMotionHumanCrowd.ts#IAutoMovieMotionHumanCrowd.IRequest

## @evidence contracts/development/common.md#meaningful-documentation

latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.

## @evidence contracts/development/design.md#principled-representation

latency: Each member's delay after the cue; none when absent. flight: Whether they flee: morale then raises the desired speed and the herding share. Not when absent. groups: Groups that walk together, each steered as one agent of its members' combined breadth; none when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, request); ensemble/HumanCrowd.ts (HumanCrowd.steer, request).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanEnsemble.IMember, IAutoMovieVector3, IAutoMovieMotionHumanResponse.Latency, IAutoMovieMotionHumanObstacle, IAutoMovieMotionHumanEnsemble.IGroup identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanCrowd.ts#IAutoMovieMotionHumanCrowd.IResult

## @evidence contracts/development/common.md#meaningful-documentation

frames: Each member's course frame, by member index; a grouped member's is its group's. arrivals: Each member's arrival second, or null when it does not arrive by `until`.

## @evidence contracts/development/design.md#principled-representation

frames: Each member's course frame, by member index; a grouped member's is its group's. arrivals: Each member's arrival second, or null when it does not arrive by `until`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.steer, return); ensemble/HumanManoeuvre.ts (steered).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFormation.ICourse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanCrowd.ts#IAutoMovieMotionHumanCrowd.IDesired

## @evidence contracts/development/common.md#meaningful-documentation

speed: The desired speed, metres per second. delay: The delay after the cue, seconds.

## @evidence contracts/development/design.md#principled-representation

speed: The desired speed, metres per second. delay: The delay after the cue, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, return); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCrowd.desired.

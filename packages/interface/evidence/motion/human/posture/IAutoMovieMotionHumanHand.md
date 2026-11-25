# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.Surface

## @evidence contracts/development/common.md#meaningful-documentation

A surface of the hand brought to a target.

## @evidence contracts/development/design.md#principled-representation

Closed choices "palm", "grip", "fist", "handBack", "indexTip", "wrist", "thumbTip", "thumbPad", "indexPad", "middleTip", "middlePad", "ringTip", "ringPad", "littleTip", "littlePad" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.origin, surface); compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, surface); everyday/restClasped.ts (laid, surface); everyday/restClasped.ts (stacked, on); everyday/restClasped.ts (stacked, surface); everyday/restGoals.ts (restGoals.lay, surface).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.Shape

## @evidence contracts/development/common.md#meaningful-documentation

The finger joints of a hand on its way to a shape. A hand shape.

## @evidence contracts/development/design.md#principled-representation

Closed choices "relaxed", "flat", "point", "fist", "bridge" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanHand.ts (AutoMovieMotionHumanHand.fingers, shape); compose/AutoMovieMotionHumanHand.ts (AutoMovieMotionHumanHand.form, asked); compose/AutoMovieMotionHumanPlaced.ts (AutoMovieMotionHumanPlaced.wrist, shape); everyday/restClasped.ts (laid, shape); everyday/restGoals.ts (restGoals.lay, shape); posture/HumanHand.ts (HumanHand.shape, form).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IWrist

## @evidence contracts/development/common.md#meaningful-documentation

point: The wrist joint, world metres.

## @evidence contracts/development/design.md#principled-representation

point: The wrist joint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanClasp.ts (HumanClasp.choose.fits, return); handling/HumanClasp.ts (HumanClasp.choose.fits, wrist); handling/HumanGrasp.ts (HumanGrasp.hand, return); handling/HumanGrasp.ts (HumanGrasp.reachable, goal); handling/HumanGrasp.ts (HumanGrasp.reachable, stroke); handling/HumanGrasp.ts (HumanGrasp.reachable, admits).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IShape

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit and its value when absent.

## @evidence contracts/development/design.md#principled-representation

The span the hand is written over, the shape it goes to and how far it has gone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by `shape`; `form` fills them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The weight is a function of seconds and not a named easing.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.DigitSurface

## @evidence contracts/development/common.md#meaningful-documentation

A surface on a digit's distal phalanx: its tip or its pad.

## @evidence contracts/development/design.md#principled-representation

Closed choices "thumbTip", "thumbPad", "indexTip", "indexPad", "middleTip", "middlePad", "ringTip", "ringPad", "littleTip", "littlePad" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanHand.ts (HumanHand.digital, return); posture/HumanHandShape.ts (HumanHandShape.tip, surface); posture/HumanHand.ts (HumanHand.DIGIT_SURFACES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanHand.digital.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

point: Point, metres.

## @evidence contracts/development/design.md#principled-representation

point: Point, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/pushSledStance.ts (pushSledStance.solved, handles); posture/HumanHand.ts (HumanHand.offset, return); posture/HumanHand.ts (HumanHand.align, rest); posture/HumanHand.ts (HumanHand.align, world); posture/HumanHand.ts (HumanHand.align.basis, frame); posture/HumanHand.ts (HumanHand.reach, target).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IOrientation

## @evidence contracts/development/common.md#meaningful-documentation

fingers: Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector.

## @evidence contracts/development/design.md#principled-representation

fingers: Where the fingers point, from the wrist toward the middle knuckle; any non-zero vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanHand.ts (HumanHand.rotation, orientation).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.Axis

## @evidence contracts/development/common.md#meaningful-documentation

A direction of the performer's floor frame: `out` is away from the midline on the acting hand's side and `in` toward it, so one name serves both hands.

## @evidence contracts/development/design.md#principled-representation

Closed choices "out", "in", "up", "down", "forward", "back" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanHandDirection.ts (HumanHandDirection.of.axis, name); posture/HumanHand.ts (HumanHand.AXES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanHandDirection.of.axis.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.Direction

## @evidence contracts/development/common.md#meaningful-documentation

between: The two axes; they must not be opposite. share: How far from the first to the second, in [0, 1]. explicit: The components.

## @evidence contracts/development/design.md#principled-representation

between: The two axes; they must not be opposite. share: How far from the first to the second, in [0, 1]. explicit: The components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/gestureStroke.ts (gestureStroke.hand.facing, fingers); everyday/gestureStroke.ts (gestureStroke.hand.facing, palm); posture/HumanHand.ts (HumanHand.direction, direction); posture/HumanHandDirection.ts (HumanHandDirection.of, direction).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHand.Axis identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IFacing

## @evidence contracts/development/common.md#meaningful-documentation

fingers: Where the fingers point. palm: Where the palm faces; not parallel to `fingers`.

## @evidence contracts/development/design.md#principled-representation

fingers: Where the fingers point. palm: Where the palm faces; not parallel to `fingers`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanHand.ts (HumanHand.facing, facing).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHand.Direction identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanHand.ts#IAutoMovieMotionHumanHand.IStrainOfProps

## @evidence contracts/development/common.md#meaningful-documentation

body: Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit strain.

## @evidence contracts/development/design.md#principled-representation

body: Borrowed body whose shoulder, elbow and wrist geometry define the arm-fit strain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanBend.ts (AutoMovieMotionHumanBend.strainOf, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanSide, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

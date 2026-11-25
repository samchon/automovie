# src/motion/human/posture/IAutoMovieMotionHumanInteractionMesh.ts#IAutoMovieMotionHumanInteractionMesh.IBone

## @evidence contracts/development/common.md#meaningful-documentation

from: One end's index. to: The other end's index. length: Metres.

## @evidence contracts/development/design.md#principled-representation

from: One end's index. to: The other end's index. length: Metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.spans, bone); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem.held, bone); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows, bones); posture/HumanInteractionMeshLaplacian.ts (HumanInteractionMeshLaplacian.rows.omitted, bone); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanInteractionMesh.adapt.spans.

# src/motion/human/posture/IAutoMovieMotionHumanInteractionMesh.ts#IAutoMovieMotionHumanInteractionMesh.IContact

## @evidence contracts/development/common.md#meaningful-documentation

a: One point's index. b: The other point's index. offset: `a` minus `b`, world metres; they coincide when absent.

## @evidence contracts/development/design.md#principled-representation

a: One point's index. b: The other point's index. offset: `a` minus `b`, world metres; they coincide when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, return); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.spans, c); posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt.problem.held, c); posture/HumanInteractionMesh.ts (HumanInteractionMesh.offset, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanInteractionMesh.ts#IAutoMovieMotionHumanInteractionMesh.IProps

## @evidence contracts/development/common.md#meaningful-documentation

reference: The key pose's points, world metres. start: The points to start from; the reference when absent or when this guess inverts a recorded tetrahedron. mesh: The reference's mesh, when built before; built here when absent.

## @evidence contracts/development/design.md#principled-representation

reference: The key pose's points, world metres. start: The points to start from; the reference when absent or when this guess inverts a recorded tetrahedron. mesh: The reference's mesh, when built before; built here when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanInteractionMesh.IBone, IAutoMovieMotionHumanInteractionMesh.IContact, IAutoMovieTetrahedralizeDelaunay.IMesh identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanInteractionMesh.ts#IAutoMovieMotionHumanInteractionMesh.IResult

## @evidence contracts/development/common.md#meaningful-documentation

points: The adapted points, world metres.

## @evidence contracts/development/design.md#principled-representation

points: The adapted points, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanInteractionMesh.ts (HumanInteractionMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieTetrahedralizeDelaunay.IMesh identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

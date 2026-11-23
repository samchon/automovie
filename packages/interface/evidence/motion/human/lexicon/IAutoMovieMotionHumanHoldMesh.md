# src/motion/human/lexicon/IAutoMovieMotionHumanHoldMesh.ts#IAutoMovieMotionHumanHoldMesh.IKey

## @evidence contracts/development/common.md#meaningful-documentation

body: The reference body. bones: Its resolved bones at the key pose.

## @evidence contracts/development/design.md#principled-representation

body: The reference body. bones: Its resolved bones at the key pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, key); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, k).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanHoldMesh.ts#IAutoMovieMotionHumanHoldMesh.IContact

## @evidence contracts/development/common.md#meaningful-documentation

a: The first body's joint. b: The second body's joint.

## @evidence contracts/development/design.md#principled-representation

a: The first body's joint. b: The second body's joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, contacts); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanHoldMesh.ts#IAutoMovieMotionHumanHoldMesh.IAdapted

## @evidence contracts/development/common.md#meaningful-documentation

joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.

## @evidence contracts/development/design.md#principled-representation

joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.adapted, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

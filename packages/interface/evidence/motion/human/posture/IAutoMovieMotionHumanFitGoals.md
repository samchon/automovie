# src/motion/human/posture/IAutoMovieMotionHumanFitGoals.ts#IAutoMovieMotionHumanFitGoals

## @evidence contracts/development/common.md#meaningful-documentation

degrees: Desired included angle or ordered inclusive bounds, degrees in (0, 180). price: Price per milliradian missed; the fit's price when absent. point: Metres in that bone's frame; its origin when absent.

## @evidence contracts/development/design.md#principled-representation

degrees: Desired included angle or ordered inclusive bounds, degrees in (0, 180). price: Price per milliradian missed; the fit's price when absent. point: Metres in that bone's frame; its origin when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanBodyFit.ts (HumanBodyFit.fit, target); posture/HumanBodyFitMerit.ts (HumanBodyFitMerit.of.misses, target); posture/HumanFitGoals.ts (HumanFitGoals.read, angles); posture/HumanFitGoals.ts (HumanFitGoals.read, target); posture/HumanFitGoals.ts (HumanFitGoals.angle, target); posture/HumanFitGoals.ts (HumanFitGoals.bounds, target).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanFitGoals.ts#IAutoMovieMotionHumanFitGoals.IAngle

## @evidence contracts/development/common.md#meaningful-documentation

States the vertex, units, range and derivative's nondegeneracy premise.

## @evidence contracts/development/design.md#principled-representation

Three ordered landmarks define the two rays about their middle landmark.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The landmarks, desired angle and optional existing l1 price.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The actual geometric angle is constrained, rather than a clinical joint angle assumed equivalent to it.

# src/motion/human/posture/IAutoMovieMotionHumanFitGoals.ts#IAutoMovieMotionHumanFitGoals.Landmark

## @evidence contracts/development/common.md#meaningful-documentation

States the averaging and the single-point case.

## @evidence contracts/development/design.md#principled-representation

A nonempty tuple of rigid points defines one affine landmark.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by each of an angle's three landmarks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type excludes an empty mean; the runtime reading checks it too.

# src/motion/human/posture/IAutoMovieMotionHumanFitGoals.ts#IAutoMovieMotionHumanFitGoals.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the bone-local convention and default.

## @evidence contracts/development/design.md#principled-representation

A bone and a local point are a rigidly carried landmark.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two fields the landmark reading uses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bone is the canonical closed vocabulary.

# src/motion/human/posture/IAutoMovieMotionHumanFitGoals.ts#IAutoMovieMotionHumanFitGoals.ICentre

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, axes and price.

## @evidence contracts/development/design.md#principled-representation

A point and selected Cartesian axes constrain the physical mass centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the rows and merit both read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The centre is measured by HumanFitBalance's mass model, not assigned to a bone.

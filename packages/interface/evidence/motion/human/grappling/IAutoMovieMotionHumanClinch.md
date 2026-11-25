# src/motion/human/grappling/IAutoMovieMotionHumanClinch.ts#IAutoMovieMotionHumanClinch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

The partner, a closed grip, a hand and a hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hand place is typed.

# src/motion/human/grappling/IAutoMovieMotionHumanClinch.ts#IAutoMovieMotionHumanClinch.Grip

## @evidence contracts/development/common.md#meaningful-documentation

The partner's region each hand grips and the sideways offset across it, a share of the partner's half shoulder width toward the partner's left. A clinch grip.

## @evidence contracts/development/design.md#principled-representation

Closed choices "plum", "collarSleeve" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/clinch.ts (clinch.regions, grip); grappling/clinch.ts (clinch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in clinch.regions.

# src/motion/human/grappling/IAutoMovieMotionHumanClinch.ts#IAutoMovieMotionHumanClinch.IRegionsResult

## @evidence contracts/development/common.md#meaningful-documentation

region: Partner body region grasped by this hand. across: Lateral offset toward the partner's left, in shares of half the partner's shoulder width.

## @evidence contracts/development/design.md#principled-representation

region: Partner body region grasped by this hand. across: Lateral offset toward the partner's left, in shares of half the partner's shoulder width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/clinch.ts (clinch.regions, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/grappling/IAutoMovieMotionHumanClinch.ts#IAutoMovieMotionHumanClinch.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Clinch contact point on the displayed partner in world metres. normal: Partner's outward surface normal in world coordinates.

## @evidence contracts/development/design.md#principled-representation

point: Clinch contact point on the displayed partner in world metres. normal: Partner's outward surface normal in world coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/clinch.ts (clinch.place, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

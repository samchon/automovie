# src/motion/human/lexicon/IAutoMovieMotionHumanGunCrew.ts#IAutoMovieMotionHumanGunCrew.IRoles

## @evidence contracts/development/common.md#meaningful-documentation

gunner: The gunner, who lays the gun and commands the fire. n1: No. 1, who sponges and rams. n2: No. 2, who places the charge.

## @evidence contracts/development/design.md#principled-representation

gunner: The gunner, who lays the gun and commands the fire. n1: No. 1, who sponges and rams. n2: No. 2, who places the charge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGunCrew.ts (HumanGunCrew.drill, roles).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGunCrew.drill.

# src/motion/human/lexicon/IAutoMovieMotionHumanGunCrew.ts#IAutoMovieMotionHumanGunCrew.IScene

## @evidence contracts/development/common.md#meaningful-documentation

bore: How deep the bore runs from the muzzle to the breech, metres. vent: How deep the priming wire goes down the vent to the charge, metres. lay: How far the gunner turns the elevating screw to lay the gun, degrees.

## @evidence contracts/development/design.md#principled-representation

bore: How deep the bore runs from the muzzle to the breech, metres. vent: How deep the priming wire goes down the vent to the charge, metres. lay: How far the gunner turns the elevating screw to lay the gun, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGunCrew.ts (HumanGunCrew.drill, scene).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/human/generation/foot/IAutoMovieHumanFootPart.ts#IAutoMovieHumanFootPart.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a foot is built from.

## @evidence contracts/development/design.md#principled-representation `name`: Chain name, `foot.left` or `foot.right`. `heel`: Pternion's plan point on the floor, `[x, 0, z]`, calibration mm. `along`: The foot's long axis on the floor, unit and level (its y zero), from the heel toward the toes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootHost.create, AutoMovieHumanFootInterim.of. Read by AutoMovieHumanFootBreadth.measure, AutoMovieHumanFootInterim.roof, AutoMovieHumanFootPart.create. Also types AutoMovieHumanFootInterim.unit, AutoMovieHumanFootInterim.foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `plantarRange`: Optional closed-span plantar bound, in calibration mm relative to the fixed-height axis. `metatarsal`: Public host-plus-toe metatarsal breadth and its foot-along interval; the fifth endpoint remains a cascade-transfer convention. `dorsal`: Authored dorsal outline only; its independent knots never resample either across outline. `ankle`: Actual complete leg owner, its original frame and available jets at the authored sagittal connection.

# src/human/generation/foot/IAutoMovieHumanFootPart.ts#IAutoMovieHumanFootPart.ISiteLaw

## @evidence contracts/development/common.md#meaningful-documentation

One site's law, calibration mm.

## @evidence contracts/development/design.md#principled-representation `share`: Share of the foot's length from pternion, in `(0, 1)`. `edges`: The box's edges from the axis: up (dorsal), lateral, down (plantar, negative), medial (negative), on either foot. `fullness`: A tape solved on the box, or a sourced shoulder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootHost.sites.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `plantarJet`: Optional plantar tangent/curvature in the whole source's normalized parameter; units are calibration mm.

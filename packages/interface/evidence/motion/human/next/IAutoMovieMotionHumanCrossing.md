# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.ApexMetres

## @evidence contracts/development/common.md#meaningful-documentation

Names the quantity, its unit and its sign.

## @evidence contracts/development/design.md#principled-representation

A length in metres above take-off, as `IAutoMovieMotionHumanJump.IParams.apex` states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one flight control the airborne crossings expose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: a number, so no indexed access onto the jump's parameters is needed.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing

## @evidence contracts/development/common.md#meaningful-documentation

States the four paths, the laws they reuse, where the geometry comes from and the refusal.

## @evidence contracts/development/design.md#principled-representation

A discriminated union on kind: each variant names exactly the fixtures and controls its path consumes, in world metres where a length appears.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One registered vocabulary entry over the named stage geometry; planNamedCrossing in motions is the only consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No variant restates a height, depth or edge the fixture owns, so the parameters cannot contradict the staged geometry.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Names the scene prop and its surface affordance.

## @evidence contracts/development/design.md#principled-representation

The prop's placed surface affordance supplies the height, width and depth in world metres; the names carry no geometry of their own.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two names distinguish the prop and one of its surfaces, as the vault and gap variants read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No independent height or depth can conflict with the fixture; a missing, moving or sloped surface is refused at runtime by planNamedCrossing.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Names the obstacle, the optional lead foot and the optional landing surface.

## @evidence contracts/development/design.md#principled-representation

The obstacle's collision shapes bound the step; the lead side is the anatomical side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters stepOver takes, under the crossing's discriminant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The obstacle's height and depth stay with its shapes.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.IVault

## @evidence contracts/development/common.md#meaningful-documentation

Names the top surface and the bearing hand, and what the hand side decides.

## @evidence contracts/development/design.md#principled-representation

The surface affordance places both supports; the hand side mirrors the step vault.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two inputs the vault planner reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No palm or foot point is authored beside the surface that owns them.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.IJump

## @evidence contracts/development/common.md#meaningful-documentation

Names the obstacle and the optional flight apex.

## @evidence contracts/development/design.md#principled-representation

The obstacle's far shape extent places the landing; the apex is the jump's own, in metres above take-off.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The obstacle and the one flight control the jump exposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The landing point is derived from the obstacle, never authored beside it.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.IGap

## @evidence contracts/development/common.md#meaningful-documentation

Names the departure and landing surfaces and the optional apex.

## @evidence contracts/development/design.md#principled-representation

Both surfaces are placed affordances, so the gap and the landing height come from the scene.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two surfaces and the one flight control.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The gap width is never typed; a missing gap or a short landing is refused at runtime.

# src/motion/human/next/IAutoMovieMotionHumanCrossing.ts#IAutoMovieMotionHumanCrossing.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the four variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union, so a variant cannot combine another's fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variants the crossing planner dispatches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.

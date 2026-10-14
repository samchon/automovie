---
name: human
description: Defines how automovie's Human generates a person from code part by part, how its parameters, parts and junctions are shaped, how its work is verified in the viewer, and the rules its rebuild set. Use with the 3d-modeling skill before working on packages/human, a human figure, or the Human viewer.
---

# Human

These rules add to the [3d-modeling skill](../3d-modeling/SKILL.md) for Human work.

## Source Of Form

- Generate every person from typed parameters through code and formulas. The package holds no mesh, morph target, landmark index or baked data, neither as files nor as large literals; a small named constant that cites its primary source is allowed. The build guard `packages/human/scripts/guard.ts` refuses the rest.
- Never read MakeHuman or MPFB code. MakeHuman's CC0 data and reference-character renders serve only as comparisons outside the package.
- Ground each anatomical value in a primary measurement, a dissection study, or an established physiological account, with its quantity, protocol, population, and conditions, and mark it measured, derived, population-fitted, or conventional. Cite only a source you read.
- Extending a value beyond the population, site, direction, or state it was measured at is a new inference that needs its own grounds and a geometry check.
- Model what shapes the visible surface: skeleton, palpable bony landmarks, superficial muscles, fat distribution and craniofacial form. Hidden tissue informs formulas and is not emitted as geometry.
- Genitals and nipples are not modeled.

## Parameters

- Modeling reads only detailed parameters: named measurements, named physiological motions including facial expressions, and closed-set choices, never a vertex, curve, cage or patch.
- Simple parameters for beginners, such as ancestry, cuteness or slimness, are deterministic converters into detailed parameters and never reach modeling. A saved document stores the resolved detailed parameters.
- Admit only values and combinations a living body can take, deriving each dependent bound from the structure that limits it. Reject an impossible state with its cause and leave the caller's values unchanged.
- The only contract with `interface` is the output, an `IAutoMovieModel`; Human never enters films through `IAutoMovieModelRecipe`.

## Construction

- Build the skeleton first on `AutoMovieHumanoidBone` and `HUMANOID_REST_FRAME`, and generate skin and every other part from that one skeleton and rest frame. Never reconcile independently sourced geometry by registration or optimization.
- A part is a region of one continuous mass. Cut only where the cross-section is a simple tube, such as mid upper arm, mid thigh, wrist, ankle and neck; the shoulder, armpit, hip and groin stay inside the trunk because muscles cross them.
- Facial features are generator modules that shape one continuous face surface. Eyeballs, teeth, tongue, nails and hair are separate meshes; the ear is a separate part.
- Refine each part alone from every side before joining, join parts only through the junction module on control cages, subdivide the joined cage once, and judge on the joined person.
- Within a profile every identity shares one topology and one published UV layout.
- A capability that any generated or imported model could use, such as skeleton axes and ranges, skinning methods, morph targets, materials, images or general geometry, belongs in core; human anatomy, measurements, proportions and the Human parameter vocabulary belong in Human.
- When core lacks what Human needs, add it to the core campaign in `../automovie@core`, land it there, and `git pull origin master` into the Human branch. Never work around a core gap inside Human.

## Verification And Reporting

- A visual claim stands only on actual viewer screenshots that the claimant opened and looked at, attached where the user reads them. A lead opens a subagent's screenshots before accepting its visual claim.
- Report progress as stages and renders, never as a percentage.
- When the code-and-formula route seems unable to reach the quality bar, stop and report it; never substitute data or another route.
- Keep numerical, clinical, and visual judgments distinct, and preserve the last valid state when an operation fails.
- When two consecutive matching renders show no gain, change the source, correspondence, or representation, not a solver or tolerance on the same representation.

## Documentation

- The package README is a short overview. Explanation lives in JSDoc, on public types and inside implementation code, and cites primary sources directly.
- `packages/human/docs` is the developers' research workspace, not a manual, and may be deleted when the rebuild completes, so no code or JSDoc refers to it.

## Visual Debugging Files

- `.shots` holds only the current task's inputs, references, working artifacts, and viewer runtime files; identify a file's use before deleting it.
- Save completed viewer displays to `.shots/output`, keeping only the images the current judgment needs, the active before-and-after pair included, and keep metadata and logs outside it.

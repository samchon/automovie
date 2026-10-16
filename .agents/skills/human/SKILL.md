---
name: human
description: Defines how automovie's Human generates a person from code part by part, how its parameters, parts and junctions are shaped, how its work is verified in the viewer, and the rules its rebuild set. Use with the 3d-modeling skill before working on packages/human, a human figure, or the Human viewer.
---

# Human

Human generates every person from typed parameters through code and formulas, adding to the [3d-modeling skill](../3d-modeling/SKILL.md). The package holds no mesh, morph target, landmark index, or baked data; a small named constant citing its primary source is allowed, and the build guard refuses the rest. Genitals and nipples are not modeled.

- Read [Anatomy](anatomy.md) when setting or changing an anatomical value.
- Read [Parameters](parameters.md) when changing what a person is described by.
- Read [Construction](construction.md) when building or changing the skeleton, a part, or a junction.
- Read [References](references.md) before comparing with or calibrating against any reference.
- Read [Verification](verification.md) before judging or reporting form.
- Read the research workspace, `packages/human/docs`, before researching a value or a technique, so sources already read and approaches already abandoned are not repeated, and update it when research changes.

## Documentation

Apply [Meaningful documentation](../contracts/common.md#meaningful-documentation) to Human's public declarations and implementation comments, citing anatomical primary sources directly. `packages/human/docs` is the developers' research workspace, not a manual, and may be deleted when the rebuild completes, so no code or JSDoc refers to it.

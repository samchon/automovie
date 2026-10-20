---
name: human
description: Models human figures from existing parameters and recovered reference curves using Hermite storage, hierarchical rule identification, and actual-render verification. Use with 3d-modeling before changing Human geometry or its display.
---

# Human

Derive the model from recovered reference curves, rather than attaching measurements to an independently invented body. Preserve the reference's silhouette, proportions, volume and feature placement without chasing incidental numerical noise.

## Modeling Workflow

1. Use the existing [Human parameters](../../../packages/human/src/index.ts) to plan reference experiments in `test/.shots`.
2. Extract the whole reference's sections, guides, obliques, features and relationships through `packages/recovery`, then save with `curveFormat: "hermite"` under [References](references.md).
3. Identify principal layers, axes, boundaries and their parameter influences under [Reverse Analysis](reverse-analysis.md), using [Anatomy](anatomy.md) where anatomical interpretation is needed.
4. Derive intermediate axes and layers through recursive interval subdivision, constraints and suitable solvers.
5. Implement regional methods and join them through the common curve and boundary authority under [Construction](construction.md).
6. Compare the independently generated whole body, regions and neighbors with the reference under [Verification](verification.md), including independent input changes and return to the starting state.

Read the relevant guide before its step and use [3D Modeling](../3d-modeling/SKILL.md) for shared recovery, lofting and visual inspection methods.

---
name: 3d-modeling-crafting
description: Builds a form in code from named dimensions and formulas, lofts and fits it from related sections and guides, or recovers a fixed mesh as curves that parameters drive. Use when a form is shaped in code rather than generated or found as it is.
---

# Crafting

A crafted form is code: named dimensions and formulas that the engine turns into geometry the same way every time.

Crafting pays where dimensions define the form or a parameter must control it. For an organic form no parameter controls, such as an animal, a face or draped cloth, propose [Diffusion](../diffusion/SKILL.md) or [Sources](../sources.md) to the user first, because authoring that surface costs far more than [Conditioning](../conditioning.md) a mesh.

Organize its parts and groups by [Modularization](../modularization.md), and test its construction as [construction](construction.md#tests) describes, within the project's [testing](../../development/testing.md) rules.

| Task | Read |
| --- | --- |
| Choose the representation and build the form from dimensions: generating definition, resolution, evaluation, tests, stylization and order of work | [Construction](construction.md) |
| Loft a form through related sections and guides | [Lofting](lofting.md) |
| Rebuild a fixed mesh as curves or surfaces that parameters drive | [Mesh recovery](recovery.md) |

# No external mesh, target or baked data

## Decision

The package holds no mesh, morph target, landmark index or baked data, neither as files nor as large literals. A small named constant that cites its primary source is allowed. The build guard `packages/human/scripts/guard.ts` refuses the rest.

## Reasons

- In the basis era, external data carried all shape knowledge and about 142,000 lines corrected it instead of authoring form (`../failures/basis-era.md`). Data hides the reasoning a reviewer or an authoring agent needs to change a shape on purpose.
- Fixed vertex data does not follow a shape change; the basis manifest said so itself about its landmarks.
- Generated geometry is a pure function of typed parameters, so every person is reproducible from a saved document and reviewable as code.
- A cited constant keeps measured knowledge (an anthropometric mean, a joint range) without carrying an opaque shape.

## Consequences

- Shape knowledge is formulas over named measurements and form rules, each value graded measured, derived, population-fitted or conventional.
- Detail below geometric scale uses generated cards, instances and procedural maps (`../techniques/`), not images or scans.
- Reference data (MakeHuman CC0, MetaHuman renders) is used only for comparison outside the package.

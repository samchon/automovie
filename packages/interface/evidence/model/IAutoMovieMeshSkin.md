# src/model/IAutoMovieMeshSkin.ts#IAutoMovieMeshSkin

## @evidence contracts/development/design.md#principled-representation

Four joint indices and unit-interval weights per render vertex feed linear blend skinning or dual quaternion skinning (Kavan et al. 2008), chosen by `method`. Mesh admission resolves a unique joint palette and every index, including zero-weight indices, accepts finite weight sums within 1e-6 of one and admits only the two method names; the viewer normalizes its constructed skin weights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A local joint palette separates skeleton bone names from compact per-vertex indices, while weights align with the mesh's position order instead of copying positions into the skin record; the blend is one optional closed union on the same record because it changes how these inputs combine, not what they are.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No bone name is guessed from imported vertex order; each stored index must address the declared joint palette, and missing or unnormalized influence groups are validation findings.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the four-influence grouping, correct boneIndices field name, palette lookup and unit-interval weights summing to one per vertex, and each method's behaviour, default and part-scale premise.

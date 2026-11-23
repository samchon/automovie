# src/architecture/IAutoMovieBuiltElement.ts#IAutoMovieBuiltElement

## @evidence contracts/development/design.md#principled-representation

Building admission checks parent/model/space references, acyclic hierarchy, finite parent-local TRS, quaternion norm within 1e-6 and positive scales. Current, alternative and interacting named operating configurations then undergo finite matrix and TRS round-trip checks with 1e-8 times max(1, largest basis entry) tolerance. Lowering decomposes admitted current matrices and normalizes rotation; this allows stated numeric residual rather than preserving arbitrary affine shear exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity, kind, parent, transform, model and space only; geometry stays in models and grouping is a null model, so one node type serves both drawn members and pure frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Matrix failures beyond the shared round-trip tolerance are refused, including in interacting named states; small residuals and continuous intermediate configurations are outside that guarantee. A modelReference is checked as a declared id without opening its bytes here, and `space` is a semantic citation rather than an admission proof that all model geometry lies inside it. Element kind remains an open label/filter rather than a geometry generator.

## @evidence contracts/development/common.md#meaningful-documentation

States how lowering stages elements, what a null model means, the root and cycle rules, the transform constraints and the shear rule, and where a model id may resolve.

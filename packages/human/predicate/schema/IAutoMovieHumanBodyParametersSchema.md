# src/schema/IAutoMovieHumanBodyParametersSchema.ts#IAutoMovieHumanBodyParametersSchema

## @evidence contracts/development/common.md#meaningful-documentation

The body record requires the anatomy object. Measurements inside it retain their own landmark, unit and omission semantics.

## @evidence contracts/development/design.md#principled-representation

The intersection keeps the required anatomy field and delegates its bounds to the body anatomy refinement. Typia checks supplied fields. Human resolves omissions in the body preparation path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The top-level Human parameters reuse this single body record. It carries the sparse measurement input through the existing Interface shape.

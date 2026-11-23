# src/soft/IAutoMovieApplySoftBodyFriction.ts#IAutoMovieApplySoftBodyFriction.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Gives metre-buffer roles, the aggregate projection push, mutation scope and still-collider friction premise.

## @evidence contracts/development/design.md#principled-representation

Positions and the before snapshot are world-metre coordinates, while friction is dimensionless; no velocity or force buffer is substituted for displacement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

simulateSoftBodyCore supplies only one particle index, start/current positions, preprojection snapshot and the admitted coefficient consumed by applySoftBodyFriction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fixed tuple expresses one xyz snapshot; numeric ranges, storage separation and valid indexing remain caller obligations instead of a claimed local validator.

# src/geometry/IAutoMoviePoses.ts#IAutoMoviePoses

## @evidence contracts/development/common.md#meaningful-documentation

Body identity keys select borrowed physical-profile world transforms for one candidate; translation units and rotation convention belong to ITransform. Readonly restricts map assignment only; it does not freeze nested transforms or ensure that every referenced body has a key.

## @evidence contracts/development/design.md#principled-representation

Body identity keys select borrowed physical-profile world transforms for one candidate; translation units and rotation convention belong to ITransform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Physical target linearization and contact rows share this canonical map instead of redeclaring pose records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readonly restricts map assignment only; it does not freeze nested transforms or ensure that every referenced body has a key.

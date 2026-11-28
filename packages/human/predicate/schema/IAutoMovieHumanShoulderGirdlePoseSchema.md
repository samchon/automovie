# src/schema/IAutoMovieHumanShoulderGirdlePoseSchema.ts#IAutoMovieHumanShoulderGirdlePoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description states which structure each field moves and which direction is positive. Elevation, upward rotation and protraction are separately authored.

## @evidence contracts/development/design.md#principled-representation

Typia bounds elevation to [-10, 45] degrees, upward rotation to [-10, 60] and protraction to [-15, 15]. Human routes clavicle channels to the shoulder and upward rotation to the scapula.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The single-arm pose owns this optional girdle record. Humeral motion uses the separate glenohumeral record. Rig evaluation owns any coordinated contribution.

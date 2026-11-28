# src/schema/IAutoMovieHumanHeadPoseSchema.ts#IAutoMovieHumanHeadPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the two independent groups and separates the anatomical eye pair and its angular units from jaw distances.

## @evidence contracts/development/design.md#principled-representation

Each eye uses its existing gaze schema and the single jaw uses its own travel schema. The Human channel table preserves their separate units and maps them to eye and jaw joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose's head block owns expression-independent eye aim and jaw travel. The neck block owns head and neck rotations at their joints.

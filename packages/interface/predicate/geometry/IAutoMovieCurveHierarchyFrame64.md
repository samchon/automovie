# src/geometry/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64

## @evidence contracts/development/common.md#meaningful-documentation

Named rigid frame with a parent key, translation in millimetres and three proper rotation rows.

## @evidence contracts/development/design.md#principled-representation

The context composes parent-first local transforms, checks the supplied rows form a proper orthonormal basis and retains resolved world frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each frame holds identities and transform data. The context owns composition, admission and copies returned from lookups.

# src/geometry/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64.bone

## @evidence contracts/development/common.md#meaningful-documentation

Unique nonempty hierarchy node key used to resolve transforms and edge endpoints.

# src/geometry/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64.parent

## @evidence contracts/development/common.md#meaningful-documentation

Parent node key already declared during construction, or null for a root.

# src/geometry/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Dimensionless proper orthonormal rotation rows. Constructor inputs are local-to-parent, and frame lookup returns the resolved local-to-world rows.

# src/geometry/IAutoMovieCurveHierarchyFrame64.ts#IAutoMovieCurveHierarchyFrame64.translationMm

## @evidence contracts/development/common.md#meaningful-documentation

Finite millimetre translation tuple. Constructor input is relative to the parent and frame lookup reports world coordinates.

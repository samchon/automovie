# src/cinematics/IAutoMovieResolveCameraAt.ts#IAutoMovieResolveCameraAt

## @evidence contracts/development/design.md#principled-representation

IBase contains world-metre translation and local-to-world quaternion rotation; scene/caller admission owns finite unit-transform premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The camera resolver needs only the staged components that camera-node tracks can replace, so scale and renderer state are absent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fallback is the authored component itself, with aliasing documented instead of hidden behind a copied-looking transform.

## @evidence contracts/development/common.md#meaningful-documentation

IBase defines component borrowing, null-clip behavior and sampled-track replacement.

# src/cinematics/IAutoMovieResolveCameraAt.ts#IAutoMovieResolveCameraAt.IBase

## @evidence contracts/development/design.md#principled-representation

Translation is world metres and rotation maps the camera's local -Z-forward frame to world. Only these components are resolved; scale is not a camera-pose channel here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Camera projection, clearance and sound readers share this staged fallback while animation uses the canonical clip and sampled-channel contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing tracks preserve authored base components by reference instead of substituting identity or previous-frame state; no normalization is silently added.

## @evidence contracts/development/common.md#meaningful-documentation

Documents fallback per component, units, aliasing, clip time semantics and the null-clip validation exception.

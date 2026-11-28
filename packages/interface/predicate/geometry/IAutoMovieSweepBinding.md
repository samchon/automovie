# src/geometry/IAutoMovieSweepBinding.ts#IAutoMovieSweepBinding

## @evidence contracts/development/common.md#meaningful-documentation

Authored humanoid bone assignments aligned with sweep spine points and stations.

## @evidence contracts/development/design.md#principled-representation

Pose conversion resolves each identity and applies its rigid motion to the corresponding spine control or station plane. Two station bones supply a spherical midpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The authored binding stores bone identities. Compiled bone-buffer indices and writable pose slots belong to the rig.

# src/geometry/IAutoMovieSweepBinding.ts#IAutoMovieSweepBinding.points

## @evidence contracts/development/common.md#meaningful-documentation

One humanoid bone identity per spine control, in spine order.

# src/geometry/IAutoMovieSweepBinding.ts#IAutoMovieSweepBinding.stations

## @evidence contracts/development/common.md#meaningful-documentation

One tuple per station in station order. A single bone follows one link, and two bones blend their turns at a spherical midpoint.

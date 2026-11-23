# src/physics/IAutoMoviePhysicalGravityTorques.ts#IAutoMoviePhysicalGravityTorques

## @evidence contracts/development/design.md#principled-representation

Postorder downstream mass moments produce joint-frame torque demands and a separate world-frame root demand about the root COM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalGravityTorques creates feed-forward requests consumed by the existing capped motors; native bodies do not enter this result contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These are feed-forward demands subject to later motor caps, not additional unbounded forces or proof of static balance.

## @evidence contracts/development/common.md#meaningful-documentation

Names torque units, joint/root frames and the moment origin for each demand.

# src/physics/IAutoMoviePhysicalGravityTorques.ts#IAutoMoviePhysicalGravityTorques.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Names torque units, joint/root frames and the moment origin for each demand.

## @evidence contracts/development/design.md#principled-representation

Joint-map values are N m in parent joint frames; root is a world-axis moment about the actual root COM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalGravityTorques creates feed-forward requests consumed by the existing capped motors; native bodies do not enter this result contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Downstream mass contributes to demand without changing physical mass, and this feed-forward result is not proof of achieved torque.

# src/motion/IAutoMovieResolveHydrodynamicForce.ts#IAutoMovieResolveHydrodynamicForce.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieResolveHydrodynamicForce.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResolveHydrodynamicForce.IProps contract belongs to interface; packages/engine/src/motion/resolveHydrodynamicForce.ts and packages/motions/src/perform/HumanWater.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieResolveHydrodynamicForce.ts#IAutoMovieResolveHydrodynamicForce.IForce

## @evidence contracts/development/common.md#meaningful-documentation

Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieResolveHydrodynamicForce.IForce keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Segment volume and submerged volume are cubic metres; centre and surface are world metres, relative velocity is metres per second, density is kilograms per cubic metre and output forces are world newtons. resolveHydrodynamicForce rejects nonpositive volume or density; other finite geometry remains caller-supplied. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResolveHydrodynamicForce.IForce contract belongs to interface; packages/engine/src/motion/resolveHydrodynamicForce.ts and packages/motions/src/perform/HumanWater.ts use this boundary. Runtime computation remains with those consumers.

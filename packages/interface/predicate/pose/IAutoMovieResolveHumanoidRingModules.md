# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone

## @evidence contracts/development/common.md#meaningful-documentation

All rest points are in Human-frame metres. For a stock foot the optional heel is on the rear plane at the hallux tip's transverse station.

## @evidence contracts/development/design.md#principled-representation

The feet with a heel and hallux tip recover a horizontal longitudinal axis. The resolver rejects zero or nonfinite direction and retains a skeleton-only shape when the landmark pair is absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same input contract accepts the drawing's bind bones and the reflected canonical solid inputs. Its metadata restores a measured outline without adding a driver joint.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing

## @evidence contracts/development/common.md#meaningful-documentation

The ring carries its centre, half dimensions and counterclockwise rest points in Human-frame metres.

## @evidence contracts/development/design.md#principled-representation

An ordered planar loop supplies the actual vertices. The centre and local axes support loft and cap construction with the same coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The display loft and convex profile consume the same vertices. Ring dimensions and centre support the existing diagnostic and cap geometry.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule

## @evidence contracts/development/common.md#meaningful-documentation

The record names the carrier, section axis, optional breadth direction, stacked rings and optional closing pole.

## @evidence contracts/development/design.md#principled-representation

A module has ordered sections and either a flat end or an explicit pole in the same rest frame. The ring owner establishes positive section dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The drawing and solid builders consume the same section and endpoint records, then retain their own display and physical resources.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.bone

## @evidence contracts/development/common.md#meaningful-documentation

The exact rest joint name selects its module and any driving relationships.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.parent

## @evidence contracts/development/common.md#meaningful-documentation

The parent name builds child lists. Null identifies the root.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.position

## @evidence contracts/development/common.md#meaningful-documentation

The frame uses forward X, up Y, left Z and metres.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.tip

## @evidence contracts/development/common.md#meaningful-documentation

A supplied leaf endpoint closes its segment. Null allows a child endpoint.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.radius

## @evidence contracts/development/common.md#meaningful-documentation

A positive girth radius passes its metric extent to the ring dimensions.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IBone.heel

## @evidence contracts/development/common.md#meaningful-documentation

A supplied heel point paired with the same-side hallux tip sets the stock foot axis.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing.centre

## @evidence contracts/development/common.md#meaningful-documentation

The centre supplies the cap centre in the Human frame.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing.depth

## @evidence contracts/development/common.md#meaningful-documentation

The half dimension along the first section axis controls its octagon.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing.breadth

## @evidence contracts/development/common.md#meaningful-documentation

The half dimension along the second section axis controls its octagon.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IRing.points

## @evidence contracts/development/common.md#meaningful-documentation

Drawn and physical geometry read the same counterclockwise vertices.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule.bone

## @evidence contracts/development/common.md#meaningful-documentation

The module's owning rest joint also selects its posed display placement.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule.axis

## @evidence contracts/development/common.md#meaningful-documentation

The resolver sets the normal to its rings. Callers can normalize it.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule.breadth

## @evidence contracts/development/common.md#meaningful-documentation

A custom breadth direction supplies the section phase. Null selects the forward default.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule.rings

## @evidence contracts/development/common.md#meaningful-documentation

The ordered ring sequence defines the loft and each potential convex run.

# src/pose/IAutoMovieResolveHumanoidRingModules.ts#IAutoMovieResolveHumanoidRingModules.IModule.pole

## @evidence contracts/development/common.md#meaningful-documentation

A supplied final point closes the ring stack instead of a flat cap.

# src/geometry/IAutoMoviePlaneFrame.ts#IAutoMoviePlaneFrame

## @evidence contracts/development/common.md#meaningful-documentation

Right-handed physical cutting frame with a plane origin and three unit axes.

## @evidence contracts/development/design.md#principled-representation

The Recovery constructor normalizes the requested normal, projects the reference into the plane for v and derives u as v cross n.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The frame supplies geometry shared by cut and orientation operations. The constructor borrows its origin tuple and constructs the axes.

# src/geometry/IAutoMoviePlaneFrame.ts#IAutoMoviePlaneFrame.origin

## @evidence contracts/development/common.md#meaningful-documentation

Physical point on the cutting plane in the source Cartesian frame. The constructor reuses the caller's tuple.

# src/geometry/IAutoMoviePlaneFrame.ts#IAutoMoviePlaneFrame.n

## @evidence contracts/development/common.md#meaningful-documentation

Unit oriented plane normal in the source Cartesian frame.

# src/geometry/IAutoMoviePlaneFrame.ts#IAutoMoviePlaneFrame.u

## @evidence contracts/development/common.md#meaningful-documentation

First unit in-plane axis, chosen so u cross v agrees with n.

# src/geometry/IAutoMoviePlaneFrame.ts#IAutoMoviePlaneFrame.v

## @evidence contracts/development/common.md#meaningful-documentation

Second unit in-plane axis aligned with the normalized projected reference.

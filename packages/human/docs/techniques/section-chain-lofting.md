# Section-chain lofting

A section-chain loft follows a course through a series of plane curves. Human's world frame is forward +X, up +Y and anatomical left +Z, with millimetres for construction. The geometric owners are `AutoMovieViewAxis`, `AutoMovieViewChain` and `AutoMovieViewLoft`.

## Construction

1. Read each observed loop in the section plane that owns it. Horizontal cuts suit level torso tapes. A cut through a toe should follow the toe's own chart so the floor and a neighbouring toe stay distinct.
2. Use a closed curve for each admitted section. A uniform periodic cubic B-spline is one representation for observed rings. A second-difference penalty smooths the controls at a wavelength derived from the feature scale and the observation spacing. A conic section instead uses outline guides, tangent directions and shoulders.
3. Use a consistent correspondence along the course. A star-shaped section can use polar phase about its origin. When a section must turn, carry the frame with continuous angular velocity. A point at radius `r` has a transverse velocity from that turn proportional to `r`, so an angular-velocity jump leaves a crease.
4. Adapt tessellation to physical chord error. The same consistently parameterized fields serve guide curves, surfaces and stable attachment addresses. An attachment stores the chain, station and phase rather than a vertex number.

## Connections

A parent and child share one boundary through the connection operator that owns their topology. A child curve starts on the parent's published loop or end and inherits the required tangent-plane data there. Across a common ring, the transverse derivative controls the tangent plane while the derivative along the ring follows the shared curve. Close free ends at an admitted pole on the course.

A sampled strip represents the connected surface. Change the source curve or its derivative when the strip exhibits a crease or fold. [Surface composition](surface-composition.md) · [Joint logic](joint-logic.md) · [Human construction](../../../../.agents/skills/human/construction.md#connections)

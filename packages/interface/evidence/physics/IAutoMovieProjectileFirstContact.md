# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.INearest

## @evidence contracts/development/common.md#meaningful-documentation

Signed collider-surface reading against the projectile's centre segment.

## @evidence contracts/development/design.md#principled-representation

distance is metres before subtracting projectile radius; point is world metres and normal an outward world unit vector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Collider nearest callbacks produce this reading; projectileFirstContact uses its distance for the sweep and may return point/normal references in the final hit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback's physical model owns correctness and finite readings; a segment entering the solid has negative distance, while a capsule radius is accounted for separately.

# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.ICollider

## @evidence contracts/development/common.md#meaningful-documentation

A named time-dependent nearest-surface query with an optional surface speed bound and optional departure certification.

## @evidence contracts/development/design.md#principled-representation

nearest receives world segment endpoints and seconds since the supplied flight's launch; ids must be unique in the searched collider list. speed bounds any surface point's speed between two launch-relative seconds in metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileFirstContact invokes these synchronous callbacks repeatedly and propagates errors; returned hit vectors may borrow the callback's result, so preserve their contents.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent or undefined departure certificate retains ordinary initial-overlap reporting. A certificate is checked by the shared contact resolver and cannot excuse other colliders or later reentry. An absent speed bound reads the collider at every scan step; only a certified bound may be stated, since one a point exceeds lets a contact be missed.

# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Projectile extent and spatial resolution policy for a finite contact sweep.

## @evidence contracts/development/design.md#principled-representation

radius is finite nonnegative metres, thickness finite positive metres and optional tail a body-local offset in metres requiring projectile attitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectileFirstContact derives the time step from projectile translation and rotation bounds; departing identifies an already-resolved initial collider for its departure model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission rejects invalid radius/thickness or a tail without attitude. Colliders thinner than thickness and opaque unbounded collider motion are not guaranteed detectable by this finite sweep.

# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

Forward search interval on the supplied flight's launch-relative clock.

## @evidence contracts/development/design.md#principled-representation

from and to are finite seconds with to strictly greater than from; projectileFirstContact does not impose a nonnegative lower bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The search samples the complete interval through the shared contact resolver and returns the first detected hit or null.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid or zero-length intervals throw. Step sizing follows the declared projectile extent and thickness, so a null result is limited by that sweep resolution.

# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.IContinuousPose

## @evidence contracts/development/common.md#meaningful-documentation

Defines launch seconds, world metres, parent orientation, and the authority of each reader.

## @evidence contracts/development/design.md#principled-representation

Absolute continuity and velocity bounds describe a prefix of the exact pose path; quaternion sign choices do not change the physical orientation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Callers supply an actual pose and continuous bounds, while the Engine derives the signed-gap proof from the placed convex geometry and ballistic flight.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Discrete pose differences establish no interval bound. An unavailable prefix preserves ordinary initial contact.

# src/physics/IAutoMovieProjectileFirstContact.ts#IAutoMovieProjectileFirstContact.IMotionBound

## @evidence contracts/development/common.md#meaningful-documentation

States the seconds and SI units, pivot, velocity norm and angular-speed meaning.

## @evidence contracts/development/design.md#principled-representation

A world-space linear-velocity ball and an SO(3) speed cap enclose the same continuous motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shape departure builder admits these finite inputs and derives the point movement and proof.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Data describe a bounded motion prefix and neither authorize ignoring the pair nor supply a contact time.

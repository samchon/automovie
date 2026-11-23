# src/soft/IAutoMovieSoftCollider.ts#IAutoMovieSoftCollider

## @evidence contracts/development/design.md#principled-representation

simulateSoftBody projects predicted particles out of static half-spaces, spheres and boxes; boundary-aware wearable evaluation resolves actor capsules before capsule projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union distinguishes authored static geometry from actor-local moving capsule references without importing building geometry into the solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each unanchored particle visits static colliders in authored order, then resolved moving capsules in boundary order; this is not one interleaved union order. There is no friction or continuous sweep, and a later projection can leave an earlier collider unsatisfied.

## @evidence contracts/development/common.md#meaningful-documentation

Each arm states its frame and geometry parameters; body capsules require evaluated actor boundaries rather than static solver inference.

# src/soft/IAutoMovieSoftCollider.ts#IAutoMovieSoftCollider.IPlane

## @evidence contracts/development/design.md#principled-representation

The solver normalizes the nonzero normal, tests signed distance against offset and translates penetrating particles along that normal to the boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Normal and offset describe one infinite plane without a mesh or redundant point representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plane is infinite and frictionless; its projection does not pretend to model a finite tabletop edge.

## @evidence contracts/development/common.md#meaningful-documentation

The inequality identifies the allowed side, normalization convention and world-space metre offset.

# src/soft/IAutoMovieSoftCollider.ts#IAutoMovieSoftCollider.ISphere

## @evidence contracts/development/design.md#principled-representation

Sphere projection compares a direct-square Euclidean centre distance with the radius and moves an interior particle radially to the boundary; an exact-centre point moves along positive world Y because its radial direction is undefined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Centre and radius are sufficient for the sphere contact calculation; id preserves the authored collider identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The exact-centre tie-break is a geometric degeneracy rule, not a fixture path; discrete projection does not detect passage through the ball between steps.

## @evidence contracts/development/common.md#meaningful-documentation

Fields state world centre, positive metre radius and domain-local identity.

# src/soft/IAutoMovieSoftCollider.ts#IAutoMovieSoftCollider.IBox

## @evidence contracts/development/design.md#principled-representation

An interior particle is projected through its nearest face, comparing distances to all six authored bounds; equal opposing distances choose the maximum side deterministically.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two corners express the supported unrotated box, leaving oriented geometry outside this arm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mid-plane ties can break mirror symmetry and ordered collider projections need not satisfy every overlapping box; no relaxation certificate is claimed.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify world coordinates and strictly ordered corners, while the evidence states the tie and discrete-contact limits.

# src/soft/IAutoMovieSoftCollider.ts#IAutoMovieSoftCollider.IBodyCapsule

## @evidence contracts/development/design.md#principled-representation

The wearable boundary sampler transforms the shared actor-local capsule using the evaluated pose at each fixed-step boundary; the solver projects against the resulting segment and radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This arm references an actor and the existing capsule proxy instead of maintaining a second body-collision shape schema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

simulateSoftBody refuses body capsules without resolved moving boundaries; an actor name is not replaced by a static origin capsule.

## @evidence contracts/development/common.md#meaningful-documentation

Fields separate domain collider identity, actor participant identity and the actor-local capsule from the resolved world contact shape.

# src/physics/projectileContinue.ts#projectileContinue

## @evidence contracts/development/implementation.md#principled-implementation

Newton's restitution on the normal part and Coulomb's impulse limit on the sliding of the contact point, both on the velocity relative to the struck surface. A ball's spin turns its contact point and takes up part of the impulse, so friction stops at Brach's critical impulse |s| k/(1+k), where the point stops sliding (the grip Cross 2002 measured), and the spin it leaves is the angular impulse over k r. A roll's constant resistance uses compressive normal gravity only; the e²v_n²/(2g_n) rebound-height test is applicable only with inward gravity. Outward gravity cannot bind a body to a ceiling or wall.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the state at contact, split the velocity on the normal, one branch per outcome; a bounce first subtracts the surface's velocity and adds it back to the rebound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Restitution and lost-speed shares outside [0,1] refuse rather than adding energy or clamping an invalid loss to a stop. Other coefficients keep their finite nonnegative domain. A rebound below the radius becomes a roll only when the caller gives one and gravity actually returns it to the surface; an explicit roll needing tensile surface force throws. A ball's radius and gyration must be finite and positive and its spin and the surface velocity finite; none is assumed for a particle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A new flight is a projectile record read by `projectileAt` like the first.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States every outcome's law, its source and the slope it does not model, with the ball's grip ratio and the spin a bounce leaves.

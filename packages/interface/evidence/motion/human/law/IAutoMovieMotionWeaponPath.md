# src/motion/human/law/IAutoMovieMotionWeaponPath.ts#IAutoMovieMotionWeaponPath

## @evidence contracts/development/common.md#meaningful-documentation

A weapon's world-space swept point or capsule path over a film-time interval in seconds. Performance contact evaluation reads its radii and trajectories to determine a strike.

## @evidence contracts/development/design.md#principled-representation

radius: Radius of the striking sphere, metres; a capsule's radius at `path`. tailRadius: A tapered capsule's radius at `tail`, metres: the capsule narrows (or widens) linearly from `radius` at `path` to this, as a limb's girth changes from one joint to the next. Absent for a sphere and for a capsule of one radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

StrikingWeapon produces paths combined by composed actions and read by HumanPerformanceContacts; radius and optional tail describe the same swept weapon at those boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Film-time callbacks return world metres and retain the free path before stopping. Contact resolution owns numerical sampling and stop decisions; this record does not certify absence of missed collisions.

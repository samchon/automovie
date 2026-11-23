# src/physics/projectileFirstContact.ts#projectileFirstContact

## @evidence contracts/development/implementation.md#principled-implementation

Continuous collision detection by the resolver's conservative scan and bisection, with the step bounded by the largest point speed so no collider of the stated thickness is stepped over.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, bound the speed, sweep with the one resolver, read the contact's point and normal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step derives from the flight and stated thickness. Initial overlap is preserved unless the caller identifies a resolved episode and its collider supplies physical departure knowledge; no tolerance, time push, permanent collider removal or bounce cap masks that episode. A fixed convex shape's proof is its supporting plane at the contact, behind which the whole shape lies; an opaque pose reader gives none.

## @evidence contracts/development/implementation.md#efficient-algorithms

One signed separation per eligible pair and scan question; a collider that states a speed bound (the floor and a fixed shape: zero) is read again only as its gap could close at the two bounds together, the flight's own from `projectileFirstContact.speed`. A scalar collider needs no point/normal until the chosen hit. Initial departure retains its existing clearance verification.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One sampled state supplies both weapon endpoints; plane and shape scalar and full queries use the same distance equations, with the unchanged fixed shape frame prepared within a collider's lifetime. The step is one function the scan and a collider's departure certificate both read, and a fixed shape's departure reuses the plane's proof.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the flight's own memo.

## @evidence contracts/development/common.md#meaningful-documentation

States the projectile's shape, the sweep's owner, the step rule, the blind spot and where the normal comes from.

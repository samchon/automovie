# src/physics/IAutoMovieHit.ts#IAutoMovieHit

## @evidence contracts/development/design.md#principled-representation

The hit reader converts a chord's segmentSphere parameter to its actual projectile-window seconds before constructing this record; the contact search reads the normal and the point off the collider's own nearest-point reading at the contact second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One time-and-point result with the two optional facts a continuation and a hit record need; chord stepping and the sweep remain with the producers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `projectileSphereHit`'s sampled chords do not certify the exact curved trajectory's first hit and give no normal; the normal and the collider are absent from its records.

## @evidence contracts/development/common.md#meaningful-documentation

Members state launch-relative seconds, world metres, the normal's direction and who fills the optional members.

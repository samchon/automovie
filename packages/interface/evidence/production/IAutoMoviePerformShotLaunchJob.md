# src/production/IAutoMoviePerformShotLaunchJob.ts#IAutoMoviePerformShotLaunchJob

## @evidence contracts/development/design.md#principled-representation

Stores the projectile's staged origin and the resolved aim as world points, the two endpoints the ballistic solve needs, plus the struck node for leading a moving target and naming the recoil.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries exactly what the launch compile reads, so the compile never re-resolves a target the gate already resolved.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Recorded only after the projectile and aim checks pass, so the compile never meets an unstaged projectile or an unresolved aim.

## @evidence contracts/development/common.md#meaningful-documentation

States when one is recorded, who consumes it, and for each field its meaning, frame and units, including when the struck node is null.

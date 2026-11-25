# src/animals/EquineIcelandicProfile.ts#EquineIcelandicProfile.shape

## @evidence contracts/development/common.md#meaningful-documentation

States the measured band, mean girth and mass and transferred body proportions.

## @evidence contracts/development/implementation.md#principled-implementation

Jensen Table 2 reports height 1.30–1.43 m, mean height 1.38 m, mean heart girth 1.66 m and mean mass 366 kg. The proportional girth is an authored size proxy. Mass holds the measured cohort mean.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Replace only the profile fields that carry the cohort and keep the standard horse builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scaled horse geometry, mass distribution and tack are existing construction proxies. Cohort variation is claimed only for the measured height band.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size profile copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the horse rig, contact names and tack entry points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the returned static profile and no samples.

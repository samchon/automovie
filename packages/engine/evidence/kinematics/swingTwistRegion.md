# src/kinematics/swingTwistRegion.ts#swingTwistRegion.table

## @evidence contracts/development/common.md#meaningful-documentation

States the table, its units and that it is kept.

## @evidence contracts/development/implementation.md#principled-implementation

Each radius is the farthest reached swing found by a scan from the far end and a bisection, or that same lattice point placed from the intervals' closed-form reach and confirmed by the scan's own test, widened when twist is the outer factor and raised to the slope bound. The explicit flexion-first chart swaps the inner and outer swing axes, clinical boxes and affine maps while preserving the ray frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A lookup by identity, and the build in three steps on a miss.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scan runs from the far end, so a ray the ranges leave and re-enter keeps its farthest reach. `SLOPE` (3) is provisional; `SCAN` and `HALVINGS` are resolutions.

## @evidence contracts/development/implementation.md#efficient-algorithms

A hit is three map reads by identity, no serialization; a miss builds the table once per constraint, axes and frame: on each of `swingTwistBasis.RAYS` (360) rays the scan's answer placed from the closed form in a handful of reach tests where the intervals' own reach covers the cell and no swing cone cuts it (`latticed`), and otherwise a scan from the farthest grid step a closed-form interval holds down in half-degree steps and 20 bisections, each one reach test of two flexions. One basis cross/dot serves the build, one prepared flexion-axis turn its tests (the axis's scaling and length read once, each angle's quaternion `fromAxisAngle`'s), one extra ray reader holds its azimuth trig, and a module helper omits per-test admission closures. Each test projects its unchanged direction into the abduction plane at most once. Widening still reads one ray per twist degree and raising reads, for each ray, only the rays near enough to lend a positive radius (60 degrees either way at a radius of 180 and the slope of 3); speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every call after the first reads the kept table. During one cold build, the admitted basis fixes its cross/dot, each ray fixes its azimuth, and each test fixes its projected direction; every actual swing test and clinical-range reading retains its original order and arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The tables are kept in weak maps keyed by the constraint and the axes and released with either; the frame map under them holds the rest-frame records, which are table constants.

# src/kinematics/swingTwistRegion.ts#swingTwistRegion.greatest

## @evidence contracts/development/common.md#meaningful-documentation

States what the radius bounds, its unit and when it is read.

## @evidence contracts/development/implementation.md#principled-implementation

The maximum of the table's radii, by the same `Math.max` over all of them, taken once when the table is built.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table read and one lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The radius is the table's own maximum; nothing is sampled or bounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant after the table's build, which reads its 360 radii once for it, where a reader spreading the table per call read them all every time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A function of the kept table alone, kept beside it under the table's identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One number per kept table, held weakly by the table and released with it.

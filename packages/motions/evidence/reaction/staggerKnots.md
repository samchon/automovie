# src/reaction/staggerKnots.ts#staggerKnots.bending

## @evidence contracts/development/common.md#meaningful-documentation

Defines the unchanged entry feet, REFERENCE tilt, sine normalization and horizontal world-metre result.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the whole-body centre on the entry's standing legs, tilts about the hips on each trunk axis, applies leg lowering and divides each centre displacement by sin(REFERENCE).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One standing reference and one shared axis-trial reader produce the two bending vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual body, entry, pivot, lowering and reference angle; no fitted body proxy replaces the mass reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three centre readings and two lowered trial postures per plan; one fixed body/profile demand preparation serves them.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One synchronous observation creates or borrows exact FK and same-body ROM metadata for its three centre solves and both lowerings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local FK demand and owned metadata end on return or throw; only two fresh shift vectors escape.

# src/reaction/staggerKnots.ts#staggerKnots.kneePole

## @evidence contracts/development/common.md#meaningful-documentation

States world root/knee hint, degree headings and the optional fixed-yaw reader or exact same-root world rest-knee point.

## @evidence contracts/development/implementation.md#principled-implementation

Places the body's rest lower-leg joint under the supplied root/yaw, then adds unit forward under the foot heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the supplied world point, evaluate the fixed-yaw reader, or perform the ordinary first transform; the foot-heading transform is one shared owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the body's same-side knee offset and a unit-forward hint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant point work; a fixed-yaw reader avoids repeated trigonometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reader fixes this body's same-side rest knee/yaw while accepting the actual root; an explicit world point additionally requires that exact root.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh hint vector and retains nothing.

# src/reaction/staggerKnots.ts#staggerKnots.risingOf

## @evidence contracts/development/common.md#meaningful-documentation

Defines the initial rise as a share of swing from the contact-height and lift policy.

## @evidence contracts/development/implementation.md#principled-implementation

Inverts sin^2(pi*u) at the audit contact height over LIFT*hipHeight, as the walking-foot rise law requires.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit inverse-height expression owns the rise share for the displayed feet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the height, LIFT and body measure without clipping or tuning; the valid body/rise domain remains the caller's premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work, prepared once by the owning feet object.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The displayed feet call this one formula.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no body or sample.

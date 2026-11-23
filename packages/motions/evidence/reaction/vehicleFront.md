# src/reaction/vehicleFront.ts#vehicleFront.read

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each collider's bounds in the car's frame; the foremost face and its band give the front.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the foremost face, one for the band.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A car without colliders or a course is refused rather than given a default front.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the colliders, once per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the front.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/vehicleFront.ts#vehicleFront.local

## @evidence contracts/development/common.md#meaningful-documentation

States both frames.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse rigid transform.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One subtraction and one rotation.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing skipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/vehicleFront.ts#vehicleFront.world

## @evidence contracts/development/common.md#meaningful-documentation

States both frames.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid transform.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One rotation and one addition.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing skipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/vehicleFront.ts#vehicleFront.velocity

## @evidence contracts/development/common.md#meaningful-documentation

States the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A central difference over `DT` of the course's position.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Two frames, one difference.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the course itself.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two frame reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the course.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/vehicleFront.ts#vehicleFront.contact

## @evidence contracts/development/common.md#meaningful-documentation

States the contact and the search window.

## @evidence contracts/development/implementation.md#principled-implementation

The legs in the car's frame at each scanned second: met when the leading face has reached their near side while they lie across the front and not behind the bonnet; the crossing is bisected to a microsecond.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every scanned second reads the course.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the window over `STEP`, then forty halvings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the course.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/vehicleFront.ts#vehicleFront.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States the refusal's fields.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A record.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One constructor.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing skipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

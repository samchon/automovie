# src/animals/EquinePitch.ts#EquinePitch.IPivot

## @evidence contracts/development/common.md#meaningful-documentation

States the frame.

## @evidence contracts/development/design.md#principled-representation

Height and fore-aft position in model metres; a turn about it is about the model's X.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The centre of mass, a lameness's pivot or the root.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquinePitch.ts#EquinePitch.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

States the seconds, the centre, the angle, the rate and the velocity.

## @evidence contracts/development/design.md#principled-representation

The four contact seconds, the centre of mass, the takeoff angle, the flight's rate and the takeoff velocity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `at`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquinePitch.ts#EquinePitch.ITilt

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and units.

## @evidence contracts/development/design.md#principled-representation

A model-frame height and fore-aft offset in metres and a pitch in radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Applied by the ride's body placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquinePitch.ts#EquinePitch.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs.

## @evidence contracts/development/implementation.md#principled-implementation

With flight T, push-off P and landing stance A, the centre rises v P / 2 over the push-off, flies v T − g T² / 2, and sinks −(v − g T) A / 2 to rest over the landing stance; the three sum to zero, so v = g T (T + A) / (2 T + P + A). The trunk turns at −`TURN` and leaves nose-up by `TURN` T / 2.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two closed forms.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's gravity.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one record.

# src/animals/EquinePitch.ts#EquinePitch.at

## @evidence contracts/development/common.md#meaningful-documentation

States the result outside the jump.

## @evidence contracts/development/implementation.md#principled-implementation

The centre of mass rises at constant acceleration over the push-off, flies the parabola and sinks at constant deceleration over the landing stance; the pitch follows cubic Hermite curves over the contacts and the constant rate in flight. The root is the centre less its pitched offset, so the trunk turns about the centre of mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the turn about a pivot with `about`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquinePitch.ts#EquinePitch.place

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, units and the unchanged case.

## @evidence contracts/development/implementation.md#principled-implementation

Compose the course rotation with the yaw about +Y and the nose-up pitch about +X (a negative right-handed turn), and add the tilt's offset rotated by the course rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's quaternion and vector arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh transform.

# src/animals/EquinePitch.ts#EquinePitch.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot, units, sign and unchanged case.

## @evidence contracts/development/implementation.md#principled-implementation

A turn about the root's own lateral axis, through `place` and `about`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One composition.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `place` and `about`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh transform.

# src/animals/EquinePitch.ts#EquinePitch.about

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units and sign.

## @evidence contracts/development/implementation.md#principled-implementation

The root is the pivot plus the pivot-to-root vector turned by the angle, so the pivot stays where it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation of one vector.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by `at`, `lean` and a lameness's tilt.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquinePitch.ts#EquinePitch.shift

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units and sign.

## @evidence contracts/development/implementation.md#principled-implementation

The root's offset plus the point's turned fore-aft position less its own, by the rotation `place` composes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

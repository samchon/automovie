# src/striking/StrikingStance.ts#StrikingStance.rear

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The side opposite the lead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.heading

## @evidence contracts/development/common.md#meaningful-documentation

States the turn's direction for each lead and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The line turned by the stance turn toward the rear side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.length

## @evidence contracts/development/common.md#meaningful-documentation

States the unit; the constant states the share and its range.

## @evidence contracts/development/implementation.md#principled-implementation

The coached share of the body's shoulder width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.feet

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and that the feet are flat.

## @evidence contracts/development/implementation.md#principled-implementation

Each ankle on its hip's track, half a stance length ahead or behind along the line, at ankle height, the toes turned by the coached lead and rear angles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One stance frame and one placement per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the toe angles are named provisional readings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.sink

## @evidence contracts/development/common.md#meaningful-documentation

States the derivation, the ignored root height and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

Each leg's hip-to-ankle span at the flexion by the law of cosines, its vertical part over the horizontal offset from the rest hip, and the lower of the two legs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span and one pass over the legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot farther than the span gives a zero vertical part rather than a complex root; the offset never raises the root above zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.guard

## @evidence contracts/development/common.md#meaningful-documentation

States each glove's place, the fists' orientation, the elbows and that the guard follows the posture's head.

## @evidence contracts/development/implementation.md#principled-implementation

The gloves placed from the posture's own chin, jaw and face regions in forearm lengths and radii, the elbows bent toward a point below and ahead of each shoulder, each turned into a knuckle goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One trunk resolution, then one goal per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The offsets are measured on the body; the comment states why the gloves sit where the elbow stays in range.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk resolution when not supplied by the caller, then constant rigid-frame work for two goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A supplied trunk map is borrowed only for the exact same body/posture in one synchronous evaluation; no result or map is retained.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.prepareGuard

## @evidence contracts/development/common.md#meaningful-documentation

Defines body-owned fixed FK demand, captured guard inputs, actual changing posture and optional synchronous source.

## @evidence contracts/development/implementation.md#principled-implementation

The canonical guard metadata supplies every actual chin/face/jaw/shoulder output to prepareTrunk once; each query retains the original seeded admission/digit path and StrikingGuard's coached geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed-demand trunk producer feeds the same guard owner used by the one-shot guard entry; no second glove formula or physical fit exists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both glove goals, shoulder withdrawal, canonical wrist offsets, authored joint admission and digit solves remain. Each query uses its actual posture; no pose, goal, time or contact outcome is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

Head/shoulder name sorting and reachable-demand preparation run once per action. Each actual guard still pays original admission/digit work, required FK ancestry and two side computations; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the unchanged body's canonical guard-name metadata is prepared. Captured stance/drop feed each actual glove calculation, while optional same-body FK/ROM suppliers share only exact dependencies and current unchanged-table metadata inside that synchronous evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The action owns fixed body/demand and guard inputs until release. Each query owns fresh frames/goals and optional exact FK/genuine unchanged-table ROM loans only until return or throw; the fixed-demand producer retains no reader, projector, posture or time history.

# src/striking/StrikingStance.ts#StrikingStance.glove

## @evidence contracts/development/common.md#meaningful-documentation

States why no wrist rotation is set and where the wrist lies.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist one fist-socket distance back from the knuckles along the hint-to-fist line, the hint passed through as the bend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direction and one offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.legs

## @evidence contracts/development/common.md#meaningful-documentation

States the hint's construction and why, and that the foot's rotation passes through.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle goal at each foot with a knee hint one shank up and half a shank along the foot's forward, which picks the hinged knee's side in the engine's fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.prepareLegs

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed inputs, world placements and separate prepared-output ownership; legs preserves its original borrowed cold references.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the same original toe-axis/knee-hint and conditional MTP goal owner as legs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

StrikingLegGoals owns fixed-foot preparation and fresh field assembly once for both actual entry points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal, field order, planted condition and MTP point remains; no pose, native fit, ROM projection or physical acceptance is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed geometric hints and contacts prepare once instead of per repeated callback; every read still allocates fresh authored data and actual downstream fits remain unchanged.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Actual damped-balance and defence consumers keep body, entry feet and support selection unchanged throughout their plan/geometry; varying-foot callers retain the original legs entry point.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner retains two private immutable geometric snapshots until plan release; each output is independent and captures no reader, pose, time or fit history.

# src/striking/StrikingStance.ts#StrikingStance.joints

## @evidence contracts/development/common.md#meaningful-documentation

States the chin tuck, its range basis, what of the entry's neck is kept and the closed fists.

## @evidence contracts/development/implementation.md#principled-implementation

The neck's flexion set inside its range with the entry's own side bend and turn, and the fist curl of both hands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One object.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant table built per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStance.ts#StrikingStance.facing

## @evidence contracts/development/common.md#meaningful-documentation

States the relation, its coaching basis, the unit and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

Twists about the same axis add along the neck and the head, so two equal shares cancel the trunk's turn inside each joint's range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share applied to two joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each share is held inside the named bound; flexion and abduction are kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

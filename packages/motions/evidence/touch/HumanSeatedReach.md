# src/touch/HumanSeatedReach.ts#HumanSeatedReach.rooms

## @evidence contracts/development/common.md#meaningful-documentation

States each joint's room and the standing case.

## @evidence contracts/development/implementation.md#principled-implementation

The hip flexion held is the angle between the thigh's line and the trunk's downward line; a spine joint's is the signed turn about the body's left from the segment below it to the one above; each room is the range table's flexion end less it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One angle per joint, one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint past its range has no room, never a negative one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ranges are the engine's `getConstraint` on the body's rig.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/touch/HumanSeatedReach.ts#HumanSeatedReach.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the turns, their order and sense.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of the trunk's flexion chain: each joint's turn about the body's left on the floor, from its heading, through the joint as the joints below have moved it, which turns the trunk's up toward its front.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One turn per joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the share is the caller's, in [0, 1].

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/touch/HumanSeatedReach.ts#HumanSeatedReach.posed

## @evidence contracts/development/common.md#meaningful-documentation

States what each joint does to the posture.

## @evidence contracts/development/implementation.md#principled-implementation

The same turns `lean` reads, written as the posture's pitch about the hips and its spine joints' clinical flexion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pivot, one flexion per spine joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rooms bound each joint, so no flexion passes its range.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `AutoMovieMotionHumanLean.pivot`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/touch/HumanSeatedReach.ts#HumanSeatedReach.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the shared share and the error.

## @evidence contracts/development/implementation.md#principled-implementation

The arms alone first; failing that, the least share in [0, 1] of every seated joint's room by bisection on whether the arms leaned by it meet, the equal-share weighted least-norm resolution (Chan and Dubey 1995).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Try, test the full lean, bisect, resolve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pair the full lean cannot bring together rethrows the resolution's error; standing pairs never lean.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution per bisection step, to a share whose lean moves a shoulder by less than the square root of machine epsilon of its distance to the hips.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The resolution and bisection remain their owners'; each role's fixed left axis and original joint pivots are prepared once for this synchronous search, while every share performs all actual ordered rotations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Prepared axes/pivots and rooms live only until goal returns or throws; only the caller's actual resolution result escapes, without a reader or pose history.

# src/touch/HumanSeatedReach.ts#HumanSeatedReach.need

## @evidence contracts/development/common.md#meaningful-documentation

States the result's three cases.

## @evidence contracts/development/implementation.md#principled-implementation

The least share in [0, 1] at which the leaned shoulder's distance to the point is within the limit, by bisection on the approach, with a golden-section closest-approach search when the fully flexed shoulder has passed the target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The standing reach, the flexed reach and the first entry into the reachable interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closest approach is measured on the posed shoulder arc with the actual segment lengths, and the arm's own fit reports any remaining miss.

## @evidence contracts/development/implementation.md#efficient-algorithms

One distance per bisection step.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed role/chain axes and pivots are shared only within this synchronous bisection; every changed share retains the original actual turn sequence and distance measurement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fixed geometry reader ends with return or failure; returned room records and scalar share retain no frame reader or candidate history.

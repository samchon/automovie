# src/everyday/seated.ts#seated.perched

## @evidence contracts/development/common.md#meaningful-documentation

States the two conditions and what follows from them.

## @evidence contracts/development/implementation.md#principled-implementation

The socket's height ratio against the band's upper end and each foot's bearing and height against its standing height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio and one test per foot, the one owner the rise and the shift read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height margin is the named provisional `OFF_FLOOR` share of the body's own thigh radius.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.high

## @evidence contracts/development/common.md#meaningful-documentation

States what a high seat is and what follows from it for the feet.

## @evidence contracts/development/implementation.md#principled-implementation

The same ratio to the popliteal height `check` reads, against the band's upper end, so a seat is refused, sat on from the floor or got onto by one measure.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the band's own constant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.ratio

## @evidence contracts/development/common.md#meaningful-documentation

States the ratio and the floor it is measured from.

## @evidence contracts/development/implementation.md#principled-implementation

The seat's height over the feet's floor divided by the popliteal height, the measure seat heights are set against (ANSI/HFES 100-2007).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quotient.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height is the body's own popliteal height, never a typed one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.floor

## @evidence contracts/development/common.md#meaningful-documentation

States which floor is read and why the lowest sole sets it.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `HumanSupportFrame.floor`, which reads the planted feet's displayed sole sockets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the support frame's owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the support frame owns the reading.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

What the support frame's reading costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A delegating facade.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.check

## @evidence contracts/development/common.md#meaningful-documentation

States the refusal and the least height it names.

## @evidence contracts/development/implementation.md#principled-implementation

An ordinary seat needs the height band's lower end times popliteal height above the floor. A working seat above the floor then proceeds to the seated joint reach test.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A low seat is refused with the feasible range, never sat on lower than the body can.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.point

## @evidence contracts/development/common.md#meaningful-documentation

States the placement back from the edge, the lift and why each holds.

## @evidence contracts/development/implementation.md#principled-implementation

The thigh's length less `KNEE_CLEAR` behind the front edge, corrected by the socket's offset from the hip joints, capped `DEPTH_CLEAR` inside a shallow seat, and raised by however far the thigh's underside hangs below the socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance back, one lift and one frame placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both clearances are named provisional constants; every length is the body's own.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.offset

## @evidence contracts/development/common.md#meaningful-documentation

States the offset and its frame.

## @evidence contracts/development/implementation.md#principled-implementation

The hips' rest position plus the body's `seat` socket in the hips' frame, which is the rest frame's at rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The socket is the body's declared one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.root

## @evidence contracts/development/common.md#meaningful-documentation

States the desired world-metre socket point, degree heading units and returned world rig origin under the existing rigid socket representation.

## @evidence contracts/development/implementation.md#principled-implementation

Solves at=root+headingRotation(offset(body)) for root by the original rigid-point subtraction, exactly inverting socket's representation without introducing a second FK or target model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One canonical heading, owned body socket offset, quaternion-vector rotation and subtraction expose the effector-to-root relation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the original rest socket offset and heading policy; it neither alters a leg/arm goal nor claims to solve additional joint articulation or admit an unreachable seat.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant geometry and one fresh vector, without a rig traversal, numerical search or temporary posed map.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses offset and the canonical heading owner shared with socket; every actual point/heading is evaluated independently, without retaining another root answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh vector and retains no body, input point, pose, callback, workspace, history or external handle.

# src/everyday/seated.ts#seated.socket

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The rest offset turned by the posture's heading and added to its root, the inverse of `root`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The trunk's joints are not read: the socket rides the pelvis, which the root and heading place.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.hands

## @evidence contracts/development/common.md#meaningful-documentation

States the goal, the side choice and the borrowed sources.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `seatedHands.hands`, which lays each palm on the solved thigh's front surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the owner of seated hand placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the hand placements' owner states its rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

What the owner's solve costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A delegating facade.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.arms

## @evidence contracts/development/common.md#meaningful-documentation

States the two endpoints, the path and the share's easing.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `seatedHands.arms`, which interpolates each wrist linearly and its turn spherically, with the law's palms prepared once where it hands them (`prepareSeatedPalms`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the owner of seated hand placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the hand placements' owner states its rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

What the owner's solve costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A delegating facade.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.rested

## @evidence contracts/development/common.md#meaningful-documentation

States where the hands rest and when.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the unchanged thigh and armrest placements to seatedHands, which measures only the active thigh targets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the owner of seated hand placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

What the chosen call costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

seatedHands shares one pose solve between thigh targets and hanging origins, forwarding optional current-query FK/ROM sources to actual admission/fit and FK without retaining them across postures.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.armrest

## @evidence contracts/development/common.md#meaningful-documentation

States the wrist's place, the hand's turn and the bearing.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `seatedHands.armrest`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the owner of seated hand placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the hand placements' owner states its rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/seated.ts#seated.popliteal

## @evidence contracts/development/common.md#meaningful-documentation

States the height, what it is measured to and its standard.

## @evidence contracts/development/implementation.md#principled-implementation

The knee joint's height (ankle height plus shank) less the thigh's radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum of the body's measures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every term is the body's own measure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

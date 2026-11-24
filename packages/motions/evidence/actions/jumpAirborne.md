# src/actions/jumpAirborne.ts#jumpAirborne.IShape

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The jump's own heading, unchanged body dimensions and achieved canonical endpoint states define its free-flight shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the prepared posture reader consumes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every length is the body's.

# src/actions/jumpAirborne.ts#jumpAirborne.knee

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the point.

## @evidence contracts/development/implementation.md#principled-implementation

A pole one metre ahead of the knee's rest place, the hint a two-bone fit bends toward.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the unchanged jump heading and explicitly supplied pole headings once; each call applies the same two point conversions with its actual root and exact pole heading, using the ordinary owner for an unprepared heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two knee-local readers and H supplied pole readers prepare heading trigonometry/products once; the actual jump supplies H=4. Each query performs at most H exact scalar comparisons and the original fresh point expressions, without per-query trigonometry for those headings. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body/heading and explicit copied pole angles fix only transform coefficients. Object.is preserves signed-zero distinctions; changed roots/sides are transformed normally and an unprepared angle uses the original point owner, with no time/result cache or changed addition order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns two knee and H pole readers holding copied scalar terms until released; H is the supplied finite array length, with no query-driven growth. Every call returns fresh vectors and retains no body, input root or previous pole.

# src/actions/jumpAirborne.ts#jumpAirborne.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what each part of the shape does over the flight.

## @evidence contracts/development/implementation.md#principled-implementation

Both toe joints interpolate between their achieved clinical endpoints. The ankles follow the minimum-jerk path and sinusoidal arch; each interpolated world foot orientation gives at the unloaded ankle's range as its shank bends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare fixed joint start/difference tracks and the heading turn once; each read copies the achieved seed, interpolates arms/toes and builds two free goals from the same endpoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed -40-degree seed, reconstructed ankle, ground plant, epsilon or boundary-only pose replaces the achieved shape. Coupled ROM remains the ordinary resolver's responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed joint tracks, four scalar point/bend interpolation readers, the 0.1-hip-height arch coefficient and two quaternion endpoint arcs prepare once. Each query shares one minimum-jerk share/current sine arch and evaluates original local-then-world expressions directly into four world vectors, avoiding four discarded local vectors. Original quaternion work remains and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed body-dimension/endpoint/delta/frame/arc prerequisites prepare; changed dimensions require another prepared shape. Every root/share/sine still evaluates its original scalar sequence: local interpolation, explicit point Y lift, then unchanged world multiply/add order; bends add no artificial zero lift. No affine regrouping, target substitute or time-keyed result cache is used.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns endpoints, fixed joint/scalar interpolation data and two arc readers. Each posture query owns fresh changed tuples/world vectors and retains no history, body workspace or handle; unchanged clinical tuples keep their original readonly endpoint ownership.

# src/actions/jumpAirborne.ts#jumpAirborne.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States the world root, the normalized flight share and the target posture the reader gives.

## @evidence contracts/development/design.md#principled-representation

The fixed endpoints, minimum-jerk coefficients, sine arch and quaternion interpolation law construct each posture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

prepareJumpFlight consumes the target call; nothing else is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A plain reader of the construction, with no optional member.

# src/actions/jumpAirborne.ts#jumpAirborne.ITurning

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it carries.

## @evidence contracts/development/design.md#principled-representation

The plan's flight members and the turn applied to a posture in flight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two plan members the jump spreads and the turn its posture reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The members are the plan's own (`IHumanActionPlan.flight`, `airborne`).

# src/actions/jumpAirborne.ts#jumpAirborne.ITurning.prepareLanding

## @evidence contracts/development/common.md#meaningful-documentation

States the handback ordering and the absorption precondition.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This signature leaves the touchdown offset calculation to the turning producer.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

The turning producer owns the implementation and its call to the touchdown reader.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The producer owns the physical handback and absorption checks.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This signature performs no calculation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The turning producer owns the offset and its invalidation on new handback.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This signature acquires no resources. The turning producer owns the offset's lifetime.

# src/actions/jumpAirborne.ts#jumpAirborne.ITurning.turned

## @evidence contracts/development/common.md#meaningful-documentation

States the local jump clock and that the received whole-body turn is absent before handback and outside the flight.

## @evidence contracts/development/implementation.md#principled-implementation

The actual turning producer returns the posture with the flight pass's rigid rotation about COM after take-off through touchdown.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One handed-back-reader/span check, otherwise one fresh posture record with rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not script a turn, alter momentum or mark a free limb as a world plant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed-size optional record update.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses exactly the rotation supplied by the real performance flight pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its existing handed-back reader; each call preserves unchanged posture identity or returns one new record with no added global state.

# src/actions/jumpAirborne.ts#jumpAirborne.ITurning.landed

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its source, the offset, its window and what the turn reaches.

## @evidence contracts/development/implementation.md#principled-implementation

Decays the actual touchdown attitude about its own centre through the engine's inertialization quintic. The plant is the contact impulse boundary for the airborne angular rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset read once, one quintic a call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn reaches the root and free goals only; planted goals stay in the world, never moved by the offset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work a call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The touchdown offset is read once from the handed-back reader and kept with it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the one offset beside the handed-back reader, for as long as the plan.

# src/actions/jumpAirborne.ts#jumpAirborne.hasTurnedLanding

## @evidence contracts/development/common.md#meaningful-documentation

States the field it reads and what the originating jump verifies.

## @evidence contracts/development/implementation.md#principled-implementation

The native flight request carries the verified ground-phase intent through placement in its own `touchdown` field, which `turning` writes. The jump's own callback still verifies the handed-back rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read on the request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the jump's `turning` writes `touchdown` in this package; a request without the field never claims a turned landing. A copy of the request keeps the field, since it is part of the record.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One field read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the original flight record already held by the plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the requirement is a field of the request it describes.

# src/actions/jumpAirborne.ts#jumpAirborne.touchdown

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the native flight, geometry target, read-back check and ordinary fallback.

## @evidence contracts/development/implementation.md#principled-implementation

The same native requirement supplies the physical shooting target and verifies the returned rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read on the request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the jump's `turning` writes the field in this package; a request without it adds no solver requirement.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One field read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the requirement already set by the jump plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the requirement is a field of the request it describes.

# src/actions/jumpAirborne.ts#jumpAirborne.turning

## @evidence contracts/development/common.md#meaningful-documentation

States the signs, the side salto's frame and when the rotation applies.

## @evidence contracts/development/implementation.md#principled-implementation

Turns become the plan's request. The performance's staged default constructs the authored unwrapped turn clock, while explicit physical mode solves the composed body's momentum; either policy hands back one numeric rigid-rotation reader. This declaration itself makes no conservation or landing-feasibility claim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One request and one held rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No turn is scripted here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs but for the held rotation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the one rotation the pass hands back, for as long as the plan.

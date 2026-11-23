# src/motion/AirborneShapeHistory.ts#AirborneShapeHistory

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing physical tensor and two-pose momentum with unchanged quadratic boundary correction. Explicit simultaneous common-frame bone-origin linear/angular rates instead feed the shared instantaneous centroidal formula under that producer's derivative premise; no derivative truth is inferred by identity. Unsupported or incomplete rates retain the stencil, and invalid supplied numbers retain physical admission failure. Tensor scale admission precedes both reductions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exact-node reader and momentum reducer serve this history. The reader assesses supplied rates once with its actual bones and retains only numeric tensor/momentum or explicit unavailability, so requested and stencil-neighbor construction select the same path. AirborneShapeInertia owns lazy tensor/principal authority, factor lookup and release; the namespace delegates that capability, preserves the principal inverse owner, and recognizes native readers through one private weak set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every new exact node evaluates the actual pure shape without rounded time, interpolation, a reduced stencil or changed physical bound. Factor reuse additionally requires an intact unobserved accessor, inverse reuse compares all four copied quaternion coordinates, and foreign callbacks/wrappers acquire no trusted native-reader flag.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N queried instants and S parts, at most 3N+6 exact numeric nodes feed O(S) reductions. An admitted analytic instant uses its one actual shape without neighboring stencil shapes. Each rated node calls its producer once at actual construction, including stencil neighbors; later queries reuse the numeric packet without repeating shape or rate callbacks. Required-name completeness uses an allocation-free scan and the producer owns its differentiation cost. Runtime gains remain unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact times under the same unchanged model, pure shape, derivative premise and span share numeric nodes and I/h independently of first being requested or used as a stencil neighbor. Each rated node stores its tensor and validated relative momentum or explicit unavailability, never raw bones or a deferred callback. Private moment/principal vectors share only after actual Object.is matches. Each unobserved tensor shares its own factor independently of current attitude/momentum; inverse sharing requires current copied quaternion equality. Native-reader provenance permits checked stage reuse, not a smoothness certificate or cached IK answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

History owns O(N*S) numeric mass nodes, optional O(N) fixed-size rated tensor/momentum packets, O(N) instants with optional factor/principal/inverse data, two boundary moments and O(S) last-vector references. Clear empties every map/list, including rated packets, unregisters instants and explicitly releases their factor/accessor/statistics references. The reusable history retains its optional cumulative numeric counters across clears; old externally held instants retain numeric public materialization data only. Weak history membership retains no reader; callers separately release the O(S) mass model.

## @evidence contracts/development/common.md#meaningful-documentation

States root-frame shape, difference seconds, quadratic boundary stencil and separate history/model ownership. Namespace factor lends an unobserved issued tensor operator with undefined fallback; inverse lends a root-to-principal quaternion only after actual copied-coordinate checks; owned recognizes the native pure reader without claiming smoothness. Optional native observation counts owner events without callbacks.

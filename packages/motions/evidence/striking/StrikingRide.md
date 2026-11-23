# src/striking/StrikingRide.ts#StrikingRide.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its exact film-time reading and world-frame purpose.

## @evidence contracts/development/design.md#principled-representation

Actual stop/partner/course readers supply the fixed contact's physical inputs rather than baked body frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only partner, stop, own goal and axis are needed to form the ride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses canonical performer, posture and interface vector types.

# src/striking/StrikingRide.ts#StrikingRide.IProps.other

## @evidence contracts/development/common.md#meaningful-documentation

Defines the call-time met performer whose body and exact-time bone reader determine the contacted surface.

## @evidence contracts/development/implementation.md#principled-implementation

The supplied strike-law closure resolves the actual stopped-against participant through its action context; create calls it for stop contact and each newly demanded frame node.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Participant resolution stays with the law/context, while create owns the contact and ascending frame-grid evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the named partner and their real pose reader rather than substituting entry bones or a frozen actor; the original lagged-time cycle rule remains.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each invocation pays its context's participant lookup; requested bone ancestry is evaluated only when create subsequently asks for a frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The enclosing ride captures its stop/participant identity but calls this reader at actual use time; it does not keep a stale displayed pose or share another actor's result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride retains the closure for its lifetime, while each returned performer reference is borrowed during contact/grid evaluation; new resources and participant histories are not acquired.

# src/striking/StrikingRide.ts#StrikingRide.IProps.goal

## @evidence contracts/development/common.md#meaningful-documentation

Defines the law's uncarried world-metre goal at the exact film-time stop, the reference for later withdrawal.

## @evidence contracts/development/implementation.md#principled-implementation

The supplied punch/kick/knee reader evaluates its actual free-course goal at stop; create subtracts this reference from the current goal along the measured contact normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The law owns free-course geometry, and create lazily reads one held reference before the first effective carry computation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original law's goal and exact stop, without replacing hand/foot contact, extending dwell or scripting a partner displacement.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded free-course goal read per fixed ride; subsequent carry calls pay only relative vector arithmetic against the held reference.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

create retains this exact fixed-stop goal only under the ride's unchanged law/stop contract; settle or changed stop replaces the ride and its reference.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most one held vector and the callback live with the ride, ending on ride/plan release; no sampled-time goal history grows.

# src/striking/StrikingRide.ts#StrikingRide.IProps.axis

## @evidence contracts/development/common.md#meaningful-documentation

Defines the actual stopped weapon axis in world metres at the stop or an earlier film second.

## @evidence contracts/development/implementation.md#principled-implementation

Strike-law producers derive both endpoints from their own shown bone frames; create uses the exact stop axis for the body's signed-distance gradient and nearest axis point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The law supplies limb geometry once, and create shares that pair across the fixed contact's probes and met-bone selection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual limb at the stop with the original six normal probes, nine axis points and gradient threshold; no proxy axis or altered contact tolerance is supplied.

## @evidence contracts/development/implementation.md#efficient-algorithms

One axis producer call per lazy stop-contact construction; pose/FK cost remains with its law, while all contact probes share the completed endpoint pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only probes at this exact body/axis/stop contact reuse endpoints; later grid frames still read the partner's actual lagged seconds and no axis-time cache is built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary endpoints end with contact construction; the ride retains only the selected contact point/normal and met-bone metadata until release.

# src/striking/StrikingRide.ts#StrikingRide.IRide

## @evidence contracts/development/common.md#meaningful-documentation

Defines the carried limb goal and the initial two-grid-step identity period.

## @evidence contracts/development/design.md#principled-representation

A posture transform keeps contact correction separate from the law's own free course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One carry operation serves the stopped punch, kick and knee.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing posture and limb unions without a second actor or solver.

# src/striking/StrikingRide.ts#StrikingRide.IRide.carry

## @evidence contracts/development/common.md#meaningful-documentation

Defines the posture/limb/film-second inputs, initial identity period and one-sided carried point/bend output.

## @evidence contracts/development/implementation.md#principled-implementation

create interpolates the met segment's rigid motion on its original two-step-lagged grid, then shifts point and bend by max(0, surface advance minus own withdrawal) along the contact normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Early unchanged cases precede lazy contact construction, ascending frame reads and one fresh limb-goal replacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves on-bound goals, zero-gradient identity, grid step, lag, outward-only correction and cycle refusal; no contact outcome or goal constraint is relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

A call appends only missing ascending grid nodes, each requesting the selected met bone's actual pose ancestry; interpolation and shift cost are constant once nodes exist. Unsupported pose coupling keeps its complete fallback.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses only this ride's fixed contact/held goal and original ascending frame grid; each new node is evaluated at its actual lagged film second and a changed stop gets a new ride. The current low/high rigid transforms share only their identical first-frame inverse and contact-relative vector within this carry call, with no derived-point history.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride owns at most floor((last requested second-stop)/STEP)+2 frames plus one contact and held goal; finite action clocks bound callers and settle/stop replacement or plan release drops the owner.

# src/striking/StrikingRide.ts#StrikingRide.create

## @evidence contracts/development/common.md#meaningful-documentation

States contact construction, lagged frame ownership and cycle refusal; namespace documents actual normal/push geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the signed-distance normal, nearest axis sample and frictionless outward-only relative surface displacement, interpolating the same ascending lagged rigid frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy stop-contact query selects the met bone and one original frame grid serves all carry calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all original probes, samples, grid seconds, lag, normal threshold and one-sided withdrawal law; contact construction and first met-bone selection share the same fixed stop geometry instead of evaluating that axis twice.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stop contact pays the original actual shape queries but prepares its fixed collider frames once. Later grid nodes demand only the actual met bone and required ancestry; their underlying supported pose dependencies still execute, with full fallback for unsupported coupling. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same-call distance probes share fixed stop-bones placement/shape frames, never query results. One carry's low/high transforms share the exact first-frame inverse and contact-relative vector; every current transform/interpolation/push still executes. The original ascending met-bone grid and fixed-stop/two-step-lag contract remain, and settle/stop replacement creates a new ride.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most floor((last requested film second minus stop)/STEP)+2 frames, one contact, one own goal and one bone set live with the ride; finite action clocks bound callers. Fixed collider readers end when contact returns, and the enclosing law releases the ride on settle/changed stop or plan release.

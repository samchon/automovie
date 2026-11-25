# src/striking/StrikingWeapon.ts#StrikingWeapon.Course

## @evidence contracts/development/common.md#meaningful-documentation

States the absolute film-time input and free-course posture output.

## @evidence contracts/development/design.md#principled-representation

Reuses the authored posture representation with a numeric film-second argument.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One time reader supplies the actual limb course; optional channels select observation demand, while optional synchronous FK and lazy genuine ROM suppliers coordinate existing clamps/fits without storing a pose, time or result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A callback leaves the actual action law responsible for its free course.

# src/striking/StrikingWeapon.ts#StrikingWeapon.arm

## @evidence contracts/development/common.md#meaningful-documentation

States side, film time, fitted course and axis order including the fist-radius offset.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the actual authored posture before placing its canonical shoulder, elbow, wrist and fist socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

StrikingWeaponBones owns actual pose/FK and fixed genuine demand preparation; posed owns arm endpoint geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every limb fit, ROM clamp and canonical socket; FK computes only the three requested arm outputs and their ancestors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the actual whole-posture fit plus admitted-joint scan and requested-arm FK ancestry, with four returned vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the pose/FK and socket owners; operation-local grouped sampling shares this actual read only within one chain/time/context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each call owns its pose/map until return or throw; only endpoint vectors escape, with no query history.

# src/striking/StrikingWeapon.ts#StrikingWeapon.frames

## @evidence contracts/development/common.md#meaningful-documentation

States what is prepared, by whom and where it is passed.

## @evidence contracts/development/implementation.md#principled-implementation

The canonical fixed-demand FK reader of the limb's three joints (`poseBones.prepare`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every authored joint is still admitted when the reader runs; only the output set is fixed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The canonical sorting and demand preparation of the limb's outputs, paid once per plan instead of once per scanned second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan owns the reader for its one body and limb; no module store keeps it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader lives with the plan's chain closures and is released with them.

# src/striking/StrikingWeapon.ts#StrikingWeapon.posed

## @evidence contracts/development/common.md#meaningful-documentation

States the already-fitted world map, side and fist-axis offset.

## @evidence contracts/development/implementation.md#principled-implementation

Places the canonical knuckles then retreats one forearm radius along the wrist-to-knuckle axis, bounded at the wrist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One socket placement and four ordered endpoints expose the capsule joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses body-measured radius and actual world frames; the original 1e-9 divisor guard is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant map lookups and rigid/vector work, without a fit or full scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the caller's already-fitted bone frames; creates only the fist-axis end.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned array borrows existing bone positions and owns its new fist end.

# src/striking/StrikingWeapon.ts#StrikingWeapon.leg

## @evidence contracts/development/common.md#meaningful-documentation

States side, film time and ordered hip/knee/ankle/ball outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Fits the actual course then reads canonical leg joints and places the ball socket with the fitted foot frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fit/FK followed by four endpoint reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains every fit affecting the requested leg and all authored ROM admission; the posture owner's conservative dependency rule may omit only proven unrelated free goals, with full fallback for unsupported context.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the requested leg's dependent physical fits, admitted-joint scan and FK ancestry plus constant socket work; unsupported coupling retains the original complete resolution cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course, lowering, requested hip and final actual fit/FK borrow one synchronous exact reader; grouped sampling shares a chain only inside that exact read and retains no supplier.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary pose and map end at return or throw; only four endpoint vectors escape.

# src/striking/StrikingWeapon.ts#StrikingWeapon.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its order, seconds, world metres and tapered-radius convention.

## @evidence contracts/development/design.md#principled-representation

A chain owns one fitted course and adjacent endpoints for its existing plan weapons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only ids, limb, radii, live span and actual axis ends are required to construct and sample capsules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses plan limb and vector types without storing a pose, approximation or contact outcome.

# src/striking/StrikingWeapon.ts#StrikingWeapon.IChain.ends

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact film seconds, ordered adjacent capsule endpoints and world-metre output.

## @evidence contracts/development/implementation.md#principled-implementation

The supplied arm/leg producer fits the action's actual free-course posture and places canonical joints and fist/ball sockets; the chain retains its authored girths and live interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single fitted limb reader supplies all ordered ends; capsule construction records adjacent indices so read/sample can serve real contact consumers together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every needed physical fit and authored ROM admission still executes; arms retain rival-clearance resolution, and unsupported selective leg dependencies fall back to full resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each demanded chain evaluation pays its actual pose resolution and requested FK ancestry, then constant endpoint work; grouped W-weapon samples evaluate C distinct chains once each using O(W+C) temporary space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only constructor-proven same-chain endpoints share one exact synchronous second/context evaluation; no pose, other actor, changed stops or time answer survives between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan's weapons retain their chain callback; sampled poses/maps end on return or throw and only actual endpoint vectors escape.

# src/striking/StrikingWeapon.ts#StrikingWeapon.capsules

## @evidence contracts/development/common.md#meaningful-documentation

States the one-id/one-radius constraint and original plan-weapon result.

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent actual chain ends define each sphere-swept or tapered capsule with its authored radius and live interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered map constructs weapons and records their chain/index correspondence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Radius-count mismatch throws; existing individual path/tail callbacks and physical dimensions remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) setup for W capsules; the course is posed once for each distinct second any of the plan's weapons is read at, so a contact scan of S seconds costs S posed chains whatever the number of capsules and passes that read them. Measured: test_human_motion_hit_punch 5.9 s to 4.0 s.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chain's ends are its action's free course posed at a second, a pure function of the exact second for the plan's life (a stop freezes what is shown, not the free course), so the ends posed at a second serve every later read of that second by these weapons; equivalence is the exact second on this one chain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The posed ends are kept by the returned weapons' closures, one array of axis ends per distinct second read (the seconds the contact scans visit, a few hundred a strike), and are released with the plan's weapons; there is no bound short of that.

# src/striking/StrikingWeapon.ts#StrikingWeapon.IAxis

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint order, world units and the sphere's absent end.

## @evidence contracts/development/design.md#principled-representation

A readonly pair keeps the centre and other end from one synchronous course evaluation together.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both complete-axis and grouped-weapon consumers need these two values only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses interface vectors and the existing sphere/capsule distinction without duplicating a pose or body representation.

# src/striking/StrikingWeapon.ts#StrikingWeapon.read

## @evidence contracts/development/common.md#meaningful-documentation

States original weapon identity, absolute time, world units and the optional sphere end.

## @evidence contracts/development/implementation.md#principled-implementation

A chain capsule's two ends come from the chain posed once at that second (`capsules`); a weapon of another producer answers its own path and tail callbacks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The weapon's own path and tail callbacks, which a chain's capsule answers from the chain's posing of the second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every read asks the weapon at the exact second; the only reuse is the chain's posing of that second on one built geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

A chain capsule's second end costs a lookup of the chain's posing of the second; other weapons pay their callbacks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chain's per-second posing, keyed by the exact second on one built geometry and cleared when the law builds another (`capsules`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each read retains only its returned endpoint vectors, with no query history.

# src/striking/StrikingWeapon.ts#StrikingWeapon.sample

## @evidence contracts/development/common.md#meaningful-documentation

States original identities, ordered demand, exact time and operation scope.

## @evidence contracts/development/implementation.md#principled-implementation

One `read` per weapon; capsules of one chain share that chain's posing of the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered weapon traversal into one result map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every weapon is read at the exact second; no other second, actor or stop state is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

W weapons perform at most C chain posings for their C distinct chains plus each other producer's path/tail; the returned axes use O(W) space. No measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The chain's per-second posing is the only sharing; one explicit invocation fixes time and caller state. The consumer releases the result before any state-changing stop application.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned axes contain only endpoint vectors and weapon keys, and no store enters any body or plan.

# src/striking/StrikingWeapon.ts#StrikingWeapon.first

## @evidence contracts/development/common.md#meaningful-documentation

States earliest-event selection and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

A strict minimum retains the original first event on equal seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered pass and one retained minimum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves supplied event identities and tie order.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(E) time and constant extra space for E events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One ordered selection with no repeated work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond return.

# src/striking/StrikingWeapon.ts#StrikingWeapon.axis

## @evidence contracts/development/common.md#meaningful-documentation

States the capsule id, exact film time, world endpoints and missing-id refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The id's chain index selects its two adjacent actual axis ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One id lookup, refusal and combined chain read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing ids throw and no nearest capsule is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) id lookup plus one actual chain evaluation for W capsules.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads both adjacent ends from the same actual chain evaluation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no query state.

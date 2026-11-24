# src/striking/KickChain.ts#KickChain.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member identifies canonical body/side, technique and world-space line/travel/target; prepareFit requires them unchanged for its synchronous search.

## @evidence contracts/development/design.md#principled-representation

Existing canonical body, side/technique unions and world vector types encode the physical chain without alternate solver state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These six actual inputs determine analytic reach and refit geometry; changing candidate bases and reach solutions remain separate arguments.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Inputs contain actual physical intent, never cached poses, warm solutions, source indices or pre-certified outcomes.

# src/striking/KickChain.ts#KickChain.IFit

## @evidence contracts/development/common.md#meaningful-documentation

Members state world-metre positions/residuals, foot rotation, clinical knee angle, full pose and the original reached/jammed/short meanings.

## @evidence contracts/development/design.md#principled-representation

Combines the existing canonical whole pose and reach status with the actual geometric measurements needed to choose a carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read by kick composition or the contact planner; no factory, FK workspace, metadata token or numerical history escapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pose remains complete with original arm/rival clearance and all physical fits, while misses and support slip remain observable rather than being clamped away.

# src/striking/KickChain.ts#KickChain.sole

## @evidence contracts/development/common.md#meaningful-documentation

States the horizontal unit travel line and the push foot's world rotation from rest.

## @evidence contracts/development/implementation.md#principled-implementation

The existing foot alignment maps the rest toe axis upward and its instep opposite the supplied line, preserving the original push-contact orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One line reversal and one shared StrikingBody.foot alignment own the rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original up axis, negative line and alignment owner without a baked angle or repaired direction; callers retain the valid unit-line premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed vector/alignment work is constant; prepareFit can evaluate this once for a synchronous unchanged push chain instead of per refit, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The exact fixed line and push technique determine this rotation; round-kick shank-dependent rotations are still evaluated from each actual knee/ankle pair.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This function retains nothing and returns a new rotation. A prepared fit may borrow it internally until that synchronous search ends; fitted output poses and foot observations retain their original ownership.

# src/striking/KickChain.ts#KickChain.unloaded

## @evidence contracts/development/common.md#meaningful-documentation

States the limit, the reading, the turn and the case that showed it.

## @evidence contracts/development/implementation.md#principled-implementation

Dorsiflexion is the toes' angle from square to the shank; the foot turns about the axis normal to the toes and the shank by the excess only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the bend, turn by the excess.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limit is the engine's measured one; the margin is named.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call is independent arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/KickChain.ts#KickChain.solve

## @evidence contracts/development/common.md#meaningful-documentation

States technique, world target, same-base optional hip and the unchanged two-segment reach result.

## @evidence contracts/development/implementation.md#principled-implementation

Places the shin axis behind its measured tapered radius or the ankle behind the rotated foot ball, then solves the original two-segment chain within the technique's flexion band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The technique selects the physical contact offset before one shared reach solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains actual measured segment lengths, target, shin share, bend and flexion band; a supplied hip must be the exact same body's base hip.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant contact arithmetic plus the shared closed-form reach; only an omitted hip needs its trunk FK ancestry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller may share an already-read hip across this candidate's solve and fit; no posed result or time history is retained.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the reach result and retains no state.

# src/striking/KickChain.ts#KickChain.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed base, contact target, iterative weapon correction and optional same-base hip.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps every original bounded weapon refit and its best-residual decision; only the unchanged base hip and exact FK prerequisites are shared within this synchronous fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fixed hip and lazy resolution reader belong to the refit loop that consumes them, while read owns each actual whole-posture solve and weapon measurement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains all REFITS, residual thresholds, support plants, target corrections and cold limb searches; no posture or fit answer is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most eight complete posture refits retain every physical fit and admission. One genuine ROM projector and one prepared fixed endpoint demand remove repeated rig/name preparation; each changed pose still computes its actual endpoint FK. No measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller-supplied hip must belong to the exact body/base. A local resolution reader shares only equal scalar FK inputs across the synchronous refits and their displayed-bone reads; each changed goal is solved normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader, ROM loan, fixed endpoint producer and hip belong only to this synchronous fit or its enclosing candidate search. IFit retains its original whole fitted pose and measurements, never a reader, projector, closure or new body memory.

# src/striking/KickChain.ts#KickChain.prepareFit

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes fixed canonical chain/target geometry from changing candidate base/reach, exact optional hip and borrowed FK supplier.

## @evidence contracts/development/implementation.md#principled-implementation

Every actual candidate runs the original whole-posture refit loop, target correction, knee hint, support-plant measurement, ROM admission and strict best-residual selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed bend, extension bound, push-foot rotation, genuine ROM metadata and endpoint demand are prepared before the returned candidate reader; read remains the actual full-fit/measurement owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all eight allowed refits and original early stop, flexion bands, goals, rotations, support plants, complete fitted pose and arm/rival clearance. No posture, warm fit or numerical answer is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

One unchanged-chain search prepares fixed rig/name/geometry once instead of once per lean/step candidate. Each candidate still pays all admitted physical refits and current endpoint FK; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller fixes body/rig/side/technique/line/travel/target for the entire synchronous search. Only those metadata and exact constant push rotation are shared; every base, reach and current round-kick shank orientation is evaluated anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search owns one fixed-demand producer, ROM projector and bounded geometry until return or throw. Each candidate owns its fresh pose/FK workspace and only original IFit values escape; the producer retains no candidate, operation reader, history or external handle.

# src/striking/KickChain.ts#KickChain.IAsked

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its quantity, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The ankle goal and knee hint are world metres; the foot rotation is a world rotation from its rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `kickChainRead`, filled by `KickChain.prepareFit`; the vector and quaternion types are the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Three required members; no optional combination arises.

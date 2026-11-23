# src/actions/supportContact.ts#supportContact.IForm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it gives the fit.

## @evidence contracts/development/design.md#principled-representation

The fit's target plus, for a floor contact, the bones that bear.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by supportKey.solved.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target is the fit's own type.

# src/actions/supportContact.ts#supportContact.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the top's place, the one-ended and placeless cases and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The step's midpoint raised the rise above its higher end, formed as a bearing contact so its surface faces as it will bear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ends, one top, one form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A step with no place swings free rather than toward an invented point.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work over the caller's prepared forms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the caller's form preparation, so a foot's quiet-stance normal is measured once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh target and retains nothing.

# src/actions/supportContact.ts#supportContact.window

## @evidence contracts/development/common.md#meaningful-documentation

States each part's window.

## @evidence contracts/development/implementation.md#principled-implementation

A knee bears through the lower leg and the trunk's front through the lying window the back names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every other part keeps its own name.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportContact.ts#supportContact.limb

## @evidence contracts/development/common.md#meaningful-documentation

States each part's limb and why the trunk's parts stand alone.

## @evidence contracts/development/implementation.md#principled-implementation

A foot and a knee are one leg and a hand is its arm, read from the part's side and kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every trunk part keeps its own name.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportContact.ts#supportContact.same

## @evidence contracts/development/common.md#meaningful-documentation

States what makes two contacts one.

## @evidence contracts/development/implementation.md#principled-implementation

Compares the two identities `id` gives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field is ignored.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two identity strings.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `id`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportContact.ts#supportContact.id

## @evidence contracts/development/common.md#meaningful-documentation

States the fields the identity carries.

## @evidence contracts/development/implementation.md#principled-implementation

Joins the fields that tell two contacts apart, the target by its JSON form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One template string.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the placement only where the contact carries one, without widening its type.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the target's JSON size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportContact.ts#supportContact.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States the added member.

## @evidence contracts/development/design.md#principled-representation

A schedule's contact plus the stance index that tells a re-placed contact apart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member, read by `id` and `placements`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends the interface's contact type rather than copying it.

# src/actions/supportContact.ts#supportContact.placements

## @evidence contracts/development/common.md#meaningful-documentation

States when a contact carries its placement over and when it is set down anew.

## @evidence contracts/development/implementation.md#principled-implementation

Each contact matched against the stance before by part, kind, inset and target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the stances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A `step` contact is always set down anew.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C^2) per adjacent pair of stances with C contacts each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One read per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh stances and retains nothing.

# src/actions/supportContact.ts#supportContact.onSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the lateral and inward rule, the frame and the units.

## @evidence contracts/development/implementation.md#principled-implementation

A point in the surface's heading frame: out by the body's shoulder or hip half width on its side, in by the inset's share of forearm and hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side sign, one half width, one frame point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's measure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point and retains nothing.

# src/actions/supportContact.ts#supportContact.onFloors

## @evidence contracts/development/common.md#meaningful-documentation

States the posture/body, ordered part datums and world-metre floor projection.

## @evidence contracts/development/implementation.md#principled-implementation

Maps each part to the bone its contact rides (toes, hand, lower leg, hips), reads that bone's resolved origin, then keeps its x/z with y zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private batch owns the bone observation, followed by one ordered floor projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sole offset, declared target, guessed height or fitted-pose reuse replaces the bone-origin datum.

## @evidence contracts/development/implementation.md#efficient-algorithms

N parts share one canonical observational solve and one FK of their named bones/ancestry instead of N solves; empty input performs no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All parts observe the same unchanged input in one synchronous invocation; canonical ordered admission and unsupported-context full fallback remain in the resolver.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary bone names, current map and workspace end with the call; N fresh world-metre floor points return with no retained current pose or history.

# src/actions/supportContact.ts#supportContact.points

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged candidate/body, ordered world-metre outputs, shared synchronous observation and canonical contact offsets; optional FK/ROM inputs are current-query loans only.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each original contact form and transforms its exact local offset through the actual resolved target bone, with the resolver's existing observational-demand guards.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Forms determine one demanded-bone set, one canonical solve/FK supplies those frames, then one ordered transform pass emits the points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All target offsets, authored admission, relevant limb/digit fits and unsupported-context full fallbacks remain canonical; no declared target substitutes for an achieved bone point.

## @evidence contracts/development/implementation.md#efficient-algorithms

N contacts share one candidate pose/FK instead of N repeated solves; point-only forms demand no unused quiet-foot-normal solve, only target frames and ancestry are requested, and an empty request performs no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All contacts observe exactly this same unchanged candidate/body in one synchronous operation. Optional parent FK/ROM sources share only exact prerequisites; every current joint/fit remains canonical, and the current map, metadata reader and prepared form do not escape.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

N target records, one bounded name set and current bone map end with this call or throw; only N fresh world points return and no workspace, posed result or history is retained.

# src/actions/supportContact.ts#supportContact.preparePoints

## @evidence contracts/development/common.md#meaningful-documentation

Defines immutable body/contact/target geometry, ordered world-metre outputs, fresh current observations and nonescaping optional FK/ROM sources.

## @evidence contracts/development/implementation.md#principled-implementation

The existing point-only form owner supplies each exact local datum. A canonical actual posture solve and demanded FK transform those datums by their current bones under the original guarded observational policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed forms, ordered targets and a genuine named-frame reader prepare once; each current query performs the same canonical solve/FK and ordered rigid transforms as points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No declared target replaces its achieved point; relevant limb/digit fits, every authored joint and unsupported-context full fallback remain native. Point-only preparation retains the existing omission of unused quiet-foot normals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) contact/name preparation serves Q observations without rebuilding their forms/name set or FK demand. Each observation still resolves its complete current authored inputs and transforms N actual contact datums; an empty list needs no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only unchanged body/surface/contact/target geometry proves fixed forms and demands. Every current posture/achieved point remains evaluated; schedule-dependent consumers discard this producer at settle before using final target geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fixed-contact operation owns N target datums and a bounded genuine name reader until release or settlement. Each call's borrowed/owned workspace, current pose and map end on return or throw; no posed result, current point or query history is stored.

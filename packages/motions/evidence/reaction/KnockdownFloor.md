# src/reaction/KnockdownFloor.ts#KnockdownFloor.IFold

## @evidence contracts/development/common.md#meaningful-documentation

Each field names its unit and posture role.

## @evidence contracts/development/design.md#principled-representation

The two parts of the same sampled fold share one record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law writes both fields and the measure reader resolves them together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the existing clinical-angle map rather than a second pose type.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.IFit

## @evidence contracts/development/common.md#meaningful-documentation

Each field identifies the angle and unit.

## @evidence contracts/development/design.md#principled-representation

Three scalar initial conditions for the original fold law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fit produces all three and fold consumes them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values come from actual collider bounds and the original clinical range brackets.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.IMeasure

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its frame and metre unit.

## @evidence contracts/development/design.md#principled-representation

The three geometric measures used by the law's root placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepareMeasure reader produces all three and the law's root writer consumes them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Measures use actual posed bones and collision bounds.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.fold

## @evidence contracts/development/common.md#meaningful-documentation

States the phase inputs and angle units.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the original seat=sit*(1-back) formula, provisional angle constants and arithmetic order for every joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the five angle scalars and return the original nine joint triples and pitch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No new phase, limit, clamp or physical assumption is introduced.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar operations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The law supplies one fold to both its floor measurement and final posture writer.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function retaining no phase state.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.prepareMeasure

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed-body premise, the frame, the units and the borrowed inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Each reading resolves the folded trunk at root zero facing +Z, negates its lowest collider bound and reads the ankles' mean and the hips' Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The collider, hip and foot demand and the collider minimum are bound once; one trunk reading per fold supplies all three measures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every fold's joints are admitted and every collider bound is evaluated; nothing read is kept between folds.

## @evidence contracts/development/implementation.md#efficient-algorithms

The name demand and the minimum's neutral entries are prepared once per plan instead of once per reading; each reading is one demanded forward kinematics and one pass over the shapes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan that owns the reader keeps its body unchanged, so the prepared demand stays valid; the optional FK source and projector share only their equal prerequisites.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the reader and its bounded demand until it is released; each reading's maps end with it and only three numbers escape.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.fit

## @evidence contracts/development/common.md#meaningful-documentation

Names each fitted floor contact, its phase and angle units.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the original range brackets, endpoint tests, collider predicates, knee/arm/elbow order and sixteen bisections; a range end reached first stays at that end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared gap producer binds each angle's actual FK/profile demand and pure part/support membership; the unchanged bracket solver consumes its changing folds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every trial still resolves its actual posture and collider bounds; no goal, trial or fit result is memoized.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most eighteen gap evaluations per angle remain. Three genuine FK/group-minimum producers prepare actual profile unions/name sorting once. Trials admit every authored joint, stage only current selected Y/rotation/name/shape inputs and evaluate every original bound without unused placed/pose/XYZ records. Each shape supplies both ordered minima once, and exact FK shares unchanged dependencies; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One synchronous exact FK reader/projector reaches every actual trunk trial. Each name union binds its genuine trunk reader; prepareMinima copies part/support memberships and selects their neutral union. Actual posed bone names determine the original group updates after all placement inputs stage. No floor verdict, trial, bound or changed dependency is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local reader/projector, three bounded FK/group-minimum producers, current bone maps and four-array scalar staging release on synchronous return/throw. Each temporary two-number minimum ends with its gap reading; only three fitted angles escape without a workspace, callback or history.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.rest

## @evidence contracts/development/common.md#meaningful-documentation

States the exact floor rule, ignored root Y and metre unit.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk resolved at root Y zero, then the negated minimum of every collider's exact world bounds (`physicalShapeBounds`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading of the reader `prepareRest` binds, so a single floor rule has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No collider, posture solve or floor condition is removed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demand preparation, one demanded forward kinematics and one linear collider reduction; a caller that reads many postures of one body binds `prepareRest` once instead.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `prepareRest`; optional parent FK/projector sources share their equal prerequisites while every current joint is projected.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The one-shot reader, its maps and the borrowed loans end with the call; only the height escapes.

# src/reaction/KnockdownFloor.ts#KnockdownFloor.prepareRest

## @evidence contracts/development/common.md#meaningful-documentation

States fixed-body scope, changing posture/metadata inputs, root-Y-zero convention, metre output and caller-owned reader lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the trunk with every joint admitted at root Y zero and negates the exact minimum Y over every available collider in profile, shape and vertex order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bind the existing genuine collider-demand trunk reader and HumanColliders.prepareMinima once; each call constructs its current root-zero request, fresh bones and the same whole-profile scalar reduction as raw rest.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every current joint projection, digit solve, required FK ancestor, collider duplicate/skip, shape bound and empty minimum; no pose, floor verdict, threshold or sampled posture is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed demand/neutral metadata bind once for K collider names and S profile entries. Queries retain complete native admission/fits, demanded FK and every shape/vertex bound. Four scalar/rotation/name/shape arrays replace unused placed/pose/XYZ records while preserving the original two phases; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

HumanColliders.bones supplies exactly the canonical frames rest requests; the genuine minimum producer retains unchanged neutral entries/order and still skips every absent current frame. All current posture/FK/ROM inputs and actual bounds remain evaluated; no cached floor or pose supplies the result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan/interval owns one fixed trunk reader and O(S) neutral minimum binding until release. Query posture, borrowed FK/ROM, bone map, four staging arrays and one-number minimum end on return/throw; no dynamic workspace, result or time history enters the retained closure.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.model

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the body's canonical engine mass model, derived from the same unchanged skeleton and physical profile as its rest and collider data.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One body-owned model read leaves preparation and lifetime with createHumanBody.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant-time model reference read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every action of the same unchanged body shares its actual canonical model; recreate the body after skeleton/profile edits as IHumanBody requires.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the body-owned model; this adapter retains no cache or external resource.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.frozen

## @evidence contracts/development/common.md#meaningful-documentation

States the input and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The resolved pose's clinical angles are already clamped and solved, so setting them as joints reproduces the pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve once and use frozenView's joint-copy owner, shared with freeze's paired COM/canonical observation without allocating its unused pair wrapper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution, linear in bones.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordinary and paired views share the actual resolver/frozenView owners. Optional synchronous FK/projector loans reuse only equal dependencies/static ROM metadata while every complete demand retains ordinary admission; no target substitute or solved flag is accepted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the fresh joint table/triples and original borrowed raw fields escape. FK/projector loans stay with the synchronous lender, never entering a result, retained callback, pose history or pair wrapper.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.freeze

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes original raw source, actual canonical pose, clinical-degree frozen tuples and their ownership; both outputs describe this same logical query.

## @evidence contracts/development/implementation.md#principled-implementation

One ordinary complete canonical solve supplies actual projected/fitted joints. Frozen authoring copies clinical values with the original neutral-zero convention and clears only limb goals in that raw view; other raw fields stay unchanged and COM reads the same actual canonical pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the genuine body/raw source, copy joint triples once and return both existing representations; frozen delegates this numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller-provided pose, fitted target or resolved flag is admitted. Every original limb/digit/rotation demand receives ordinary solving before the existing freeze policy clears only limb goals; it never certifies a later edited or composed posture.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original full resolve plus O(J) tuple copying serves both actual COM and frozen-shape consumers, removing their duplicate canonical solve without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both observations read this source query's actual solution. Optional synchronous FK/projector loans share only equal prerequisites/static ROM metadata while every actual joint/demand still evaluates; no previous time, result cache or mutated context is consulted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one actual resolver pose, fresh raw joint table/triples and bounded pair wrapper. Optional FK/projector loans stay with their synchronous lender and never enter either output, callback, history or external handle.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.centre

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's segment mass model over the posture's bones: forward kinematics alone for a posture of joints, the full resolution for one with goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolution and one weighted mean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Complete canonical joint admission and limb/digit fits, then forward kinematics of only the mass-bearing bones' ancestry and one segment reduction; the laws read a handful of centres per plan, so the demand is built per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The canonical mass model reads the bones its body collides with, so its demand is the collider set; another model demands its own segments. An optional exact reader shares only equal FK dependencies, and a same-body projector shares static ROM metadata while every current joint is still projected.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The demand, the local reader and the bone map end on return or throw; optional borrowed FK/projector sources stay with their synchronous parent, and only the centre escapes.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what moves.

## @evidence contracts/development/implementation.md#principled-implementation

A translation of the root moves every bone and the centre alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One centre and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.turned

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the two turns, what stays, what goes round and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

With no roll the root rotation is Ry(yaw)Rx(pitch), so the world rotation taking the old heading to the new one is H(new) H(old)⁻¹; the root and the world goals go round the pivot by it and every bone follows, one rigid motion of the shown body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate the same raw source and current turn to prepareTurned's shared rigid-placement owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posture the turn cannot carry is refused, never turned in part.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the four limb goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Standalone and fixed-source callers use the same heading/quaternion/world-point owner, with no alternate path or numerical result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary preparation releases at synchronous return/throw; the returned raw posture preserves the existing borrowed unchanged articulation and attached goals, retaining no preparation or reader.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.prepareTurned

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed source/pivot premise, borrowed nested-data lifetime, query degree units, original no-roll refusal and raw output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Each current H(new) H(old)^-1 carries root and world goal points/poles around the same pivot, and rotates original goal orientations; bone-attached goals retain their original records.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the no-roll source once; each query reads its current target heading before lazily preparing the fixed old inverse on first demand, then runs the original world-goal loop and root placement. The original root-minus-pivot displacement prepares only when that last root expression first needs it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No root, goal, contact, clinical angle, single-axis policy or rotation order changes. Current-heading admission still precedes old-heading admission. This is raw rigid geometry, never a resolver certificate, fitted target substitute or asserted resolved state.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed old heading/inverse and three root-offset subtractions prepare only on first actual demand; each changing turn still evaluates the current heading, root rotation/addition and every original world goal transformation in O(L) limb work, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit unchanged-source/pivot premise alone permits reuse of old orientation and the owned root displacement. Current yaw/pitch increments and transformed demands remain evaluated with the same subtract-rotate-add grouping. The standalone turned path shares this owner without time/result memoization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its original source/pivot, one fixed inverse quaternion and one owned three-scalar root displacement until release. Each query returns fresh root/world-goal records with the original borrowed articulation/attached-goal ownership, retaining no query, FK reader, history or external handle.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.fall

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the meaning of null.

## @evidence contracts/development/implementation.md#principled-implementation

The later root of from + vy t - g t² / 2 = to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A height above the apex returns null instead of a clamped time.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.at

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/implementation.md#principled-implementation

from + v t - g t² ŷ / 2.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.lowest

## @evidence contracts/development/common.md#meaningful-documentation

States the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The knockdown's floor rest gives the root height that puts the lowest shape on the floor; the posture's own root height less that is where its lowest shape is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics and one pass over the shapes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses knockdown.rest; optional explicit touchdown-search FK/projector sources share only unchanged FK prerequisites and static ROM metadata between actual bisection queries, while every current joint and collider bound still evaluates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains neither geometry nor borrowed FK/projector sources, which belong to the synchronous search and never a returned plan, token or callback.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.prepareLowest

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/profile scope, current posture/loan inputs, metre output and touchdown-search lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Retains lowest's original rootY-minus-rest expression. The native rest producer resolves each actual root-Y-zero trunk and reads its exact original ordered collider bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bind knockdown.prepareRest once and apply the same one-difference facade to every changing posture; raw lowest remains its ordinary standalone entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bracket station, posture, joint/digit admission, collider, hull vertex, floor verdict or tolerance is replaced or removed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed demand/profile selection serves Q search stations; each keeps actual canonical fitting, demanded FK, every current placement/bound and the original scalar difference. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An explicit unchanged body/profile establishes only static demand/neutral-entry equivalence. Every current root and posture still evaluates; incoming FK/ROM loans share only current prerequisites and never supply a cached floor answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search owns one bounded native rest reader until return/throw. Each call returns one number, retaining no raw pose, FK/projector loan, bone map, bound or query/time history.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.launch

## @evidence contracts/development/common.md#meaningful-documentation

States the premise and the units.

## @evidence contracts/development/implementation.md#principled-implementation

Two samples a millisecond and two after the instant: for c(t) = c0 + v t - g t² / 2, v = (c(2δ) - c(δ)) / δ + 3 g δ / 2 and c0 = c(δ) - v δ + g δ² / 2, exact on a parabola.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegate the two actual raw/COM observations and original formulas to prepareGymnasticsLaunch, shared with repeated take-off correction readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read from the displayed postures, so a plan that is not ballistic there gives what it shows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both original millisecond samples retain complete resolution and mass reduction; one genuine fixed-name demand and exact FK workspace avoid repeated static preparation/equal dependency work, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Standalone and repeated launch readers share the same numerical owner. Both current raw postures and COM reads borrow one explicit FK source and genuine same-body projector; every joint remains projected without cached/substituted samples, goals or velocities.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary preparation, bounded demand, local FK getter/workspace and genuine projector release on synchronous return/throw; none enters a retained plan, source token or output. Only fresh centre/velocity vectors escape without query history.

# src/sport/GymnasticsFlight.ts#GymnasticsFlight.touchdown

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the two seconds and the precision, and the coarser precision of seconds late enough to be spaced wider.

## @evidence contracts/development/implementation.md#principled-implementation

Bisection on the sign of lowest(t) - height, which the premise brackets; a body that falls keeps the sign change single in the bracket the callers give (apex to the centre's own arrival). It also stops where the midpoint rounds onto an end, so a bracket past 2^39 s, whose adjacent seconds lie more than 1e-4 s apart, ends at their spacing instead of halving without end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

About fifteen evaluations for a bracket of a second.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.arm

## @evidence contracts/development/common.md#meaningful-documentation

States each input's frame, the default preset, what `out` adds and the result's frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The shoulder's rest place plus the shares times the upper arm, mirrored by side, turned by the posture's root rotation and moved to its root: a rigid point of the trunk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup and one rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The preset values are named provisional in `ARM`; an absent pitch or roll is 0 by the stated rule, and nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `humanPostureHeading`, the one owner of a posture's root rotation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.hang

## @evidence contracts/development/common.md#meaningful-documentation

States which preset it is, what `out` adds and the result's frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The `hang` preset of `arm`, the hint every reach takes by default.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `arm`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no value of its own; the shares are `ARM.hang`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `arm`, so the transform exists once.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.knee

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, the default heading, the sign of `splay` and the result's frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The knee's rest place carried by the root and the heading, then a unit step along the foot's heading opened outward by the splay: the knee tracks over the foot (Perry and Burnfield).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two nested floor-frame transforms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The one-metre step only sets a direction and is stated; a positive heading turns left, so the left knee opens by `+splay` and the right by `-splay`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanFrame.point`, the owner of the floor-frame transform.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.prepareKnee

## @evidence contracts/development/common.md#meaningful-documentation

Fixes unchanged body/side and degree heading/splay, returning fresh world hints for actual current root/yaw.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the cold knee owner's same two nested frame groups, with lazy fixed unit-step products and one guarded last-yaw rest-knee transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade connects Leg.prepareGoal to AutoMovieMotionHumanKneeBend.prepare without another formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Current root/yaw, side sign, one-metre direction and original arithmetic remain unchanged; no leg/target result is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed foot-heading products prepare once and inner products change only with exact current yaw; every point remains actual and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit fixed body/rest/foot geometry proves only scalar-product reuse; changed fixed inputs require a new producer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns constant private products/rest data and one last yaw until release, without current roots, FK readers, results or pose/time history.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Fixed body/root/heading/side own one real chain and collider context; every query keeps its own world wrist, hand rotation, hint and explicit fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates fixed geometry to the original search owner and retains distinct original legality/strain and elbow-side rankings for solve and strain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The preparation adapter exposes the two existing queries over one fixed search context.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every original numerical sweep/refinement, fallback, refusal and exact-zero legality rule remains.

## @evidence contracts/development/implementation.md#efficient-algorithms

One real chain/FK preparation serves all Q differently ranked queries while their actual numerical sweeps remain unchanged.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit unchanged body/profile/rig/ROM and rootXYZ/yaw/pitch/roll/side share geometry only. A bounded authored support-state plan may own a context only when its state proves those exact fixed inputs and supplies privately immutable coordinates; differing current wrists/rotations still run their original sweeps.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A synchronous selector or bounded authored support-state plan owns its fixed chain/collider/neutral context until release. It retains original body/fallback geometry but no query wrist, result, FK reader, pose/time history or external handle; changing fixed source requires a new context.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.prepareBoth

## @evidence contracts/development/common.md#meaningful-documentation

Fixed body/root/yaw/pitch/roll and optional current-person FK yield lazy side solve/strain contexts; release the returned reader before this evaluation ends.

## @evidence contracts/development/implementation.md#principled-implementation

Preparation.both supplies genuine checked trunk geometry while each requested side retains original chain preparation and every actual goal/rank/sweep/refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One facade routes actual crawl/load paired-arm consumers to the same existing search/chain numerical owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No side, candidate, actual solve, contact bound or source-validation branch is skipped; no fit answer or caller result flag is accepted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed trunk FK/placement prepares once across sides; actual chains/sweeps remain and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit same-body fixed-trunk scope proves geometry only; every varying goal remains independently solved.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous caller releases the trunk source, at-most-two side contexts and optional FK loan before returning; no plan, output goal or posture may retain this reader.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the freedom solved, the rule of an allowed place, the strain's terms and units, the result's frame and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel parameterisation of Tolani, Goswami and Badler 2000 through the engine's `hingedArmArticulation`, with legality ranked before a joint-range-normalised discomfort, the form of Cruse 1986 and of Kee and Karwowski 2001.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search and one refusal check; the search and the strain live in `AutoMovieMotionHumanBendSearch`, shared with `level` and `strain`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable wrist and a circle with no allowed place are refused with the reason; the fallback is taken only when the caller names it, and no candidate is clamped into range.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics of the rig and at most 720 candidates plus their refinements, each two decompositions and four shape distances; the hand's share of a candidate's strain is read only for a comparison the shoulder's share cannot decide (`AutoMovieMotionHumanBendStrain.least`), and a request already solved for the same genuine body is read from its table (`AutoMovieMotionHumanBendMemo`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's chain preparation, swivel sweep, clinical decomposition and range overshoot, and `HumanArmClearance`, the owner of a forearm's clearance; a repeated request with the exact same inputs on the same genuine body shares the elbow its first solve returned (`AutoMovieMotionHumanBendMemo`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains, per genuine body, at most `AutoMovieMotionHumanBendMemo.CAPACITY` completed solves, released with the body; the hanging arm's angles are the body's (`IAutoMovieMotionHumanBody.hanging`).

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.level

## @evidence contracts/development/common.md#meaningful-documentation

States which place is chosen, the tie rule, the result's frame and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The same swivel circle and legality as `solve`, ranked by the elbow's height from the shoulder's instead of by strain: a level upper arm is an elbow at the shoulder's height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search with another ranking, and `solve`'s refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arm that cannot be level at this wrist takes the allowed place nearest to it, never a place out of range.

## @evidence contracts/development/implementation.md#efficient-algorithms

The same bounded sweep as `solve`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `search` with `solve` and `strain`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what `solve` retains.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.strain

## @evidence contracts/development/common.md#meaningful-documentation

States which elbow place is measured, the unit and the meaning of `Infinity`.

## @evidence contracts/development/implementation.md#principled-implementation

Takes the elbow places within one degree of the bend point's side of the shoulder-to-wrist line, the sweep's own step, and reads the same strain and the same legality `solve` ranks by. An elbow place has two arm poses, one per bend branch of the hinge, so an allowed pose ranks before the other.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search ranked by side, then one read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A side with no allowed place within that degree reads as `Infinity`, never as the strain of a farther place that is allowed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The same bounded sweep as `solve`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `search` with `solve`, so a preset and the solver are compared on one measure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what `solve` retains.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the axis, the turn's sense, the result's frame and the two cases with nothing to turn.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel angle of Tolani, Goswami and Badler 2000: the elbow's one freedom once the wrist is placed is its turn about the shoulder-to-wrist line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates original chain admission, line projection and radial rotation to AutoMovieMotionHumanBendTurn's single numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Legality is not judged here: a caller reads `strain` on the result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the shoulder from the chain `solve` and `strain` prepare.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One chain preparation and constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.strainOf

## @evidence contracts/development/common.md#meaningful-documentation

States what the strain is for, what it reads and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The search's own strain (`AutoMovieMotionHumanBendSearch.strainOf`) with the hanging arm `solve` reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The search's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the search's strain and hanging arm.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The search's.

# src/compose/AutoMovieMotionHumanBend.ts#AutoMovieMotionHumanBend.hanging

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, from which preset, who keeps it and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The search's hanging arm with this owner's `hang` hint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hint and one search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the search refuses nothing it could guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation and one sweep, run once per body and side by the body.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The body owns the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

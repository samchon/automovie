# src/audit/AutoMovieMotionHumanAuditTangle.ts#AutoMovieMotionHumanAuditTangle.measure

## @evidence contracts/development/common.md#meaningful-documentation

States subject, body, sampling rate, the deepest-per-pair sampled motion result and the certified reading that gives it; contact windows explain skipped or depth-allowed pairs.

## @evidence contracts/development/implementation.md#principled-implementation

A deterministic motion grid reads actual poses; active declared self-contacts supply the original exclusions/skin depths, and each unordered pair retains its deepest sampled instant. Conservative advancement leaves a pair unread only at instants where its depth, less any allowance, cannot exceed what it already recorded (or the nanometre a first record needs), so the record is the full scan's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build contact windows, place every grid instant's segments and their travel, visit the grid in order reading the pairs that are due, accumulate deepest pair records, then sort by depth.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps inclusive window endpoints, grid order, strict first-time ties, structural baselines and original contact mapping; a pair is left unread only by a certificate measured on the motion's own poses, never by sampling; existing contact-part/skeleton casts reflect the canonical Human-window producer and are not broadened.

## @evidence contracts/development/implementation.md#efficient-algorithms

For G grid samples and S parts, O(G*S) placements and travel, O(G*S*S) broad comparisons, and bidirectional probe/shape queries only for the pairs a margin leaves due: none while a pair's segments hold still or stay clear by more than they move. Local pair storage is bounded by encountered pairs; the placements are G*S.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The model owns shared body probes and baselines; each instant still resolves its actual displayed bones, which the audit's other readings share through the caller's motion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Grid placements, travel table, due indices, exemption and deepest maps end with the call; returned results are owned by the caller. Existing weak body models retain only their own geometry/reference state.

# src/audit/AutoMovieMotionHumanAuditTangle.ts#AutoMovieMotionHumanAuditTangle.pose

## @evidence contracts/development/common.md#meaningful-documentation

Defines a single displayed pose, unordered skips/depth allowances and one result per penetrating self pair.

## @evidence contracts/development/implementation.md#principled-implementation

The model's structural/reference rules and both probe directions give the same excess depth, with conservative spheres rejecting distant pairs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place actual colliders, form sphere centres, scan unordered part pairs, then keep the deeper direction past the existing allowance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps related-pair skips, sphere comparison, direction order, reference depths and the original 1e-9 roundoff threshold; no query or tolerance is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

S parts require O(S*S) broad comparisons and the original selected probe/shape work; collider placement and centre arrays remain per pose. Each segment a probe is read in is prepared once for the pose (`M.beyond`'s `targets`), and a pair's key is built only where some pair is skipped or pressed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the body's canonical model, its pair baselines and the existing centre/excess owners without reusing pose-dependent answers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh pair records and releases local placements/centres; the existing model lifetime belongs to its weak body owner.

# src/audit/AutoMovieMotionHumanAuditTangle.ts#AutoMovieMotionHumanAuditTangle.across

## @evidence contracts/development/common.md#meaningful-documentation

States two bodies' displayed bone maps and the requested body-to-other directed pairs at second zero.

## @evidence contracts/development/implementation.md#principled-implementation

Different bodies share no structural joints or default-pose allowance, so original directed probe depths are read in full.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place both bodies, scan their ordered part pairs, conservatively screen spheres and read every selected directed depth.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps full external depth, part order, strict depth updates and the original 1e-9 threshold; no own-body reference is applied.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S and T parts, O(S*T) broad comparisons precede original selected probe/shape work, with each of the other body's segments prepared once for the pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses each body's canonical model and the same centre/depth owners; no other-body pose result is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local placements and results are released or returned with this call; only the existing weak per-body models survive.

# src/audit/AutoMovieMotionHumanAuditTangle.ts#AutoMovieMotionHumanAuditTangle.arm

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual posed bones, arm segments, degree-valued excess and an optional exact same-epoch collider placement.

## @evidence contracts/development/implementation.md#principled-implementation

The model's original probes, references and both depth directions yield shoulder-arc degrees; an optional placement is the same body's unchanged posed geometry in original profile order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the model, borrow an exact supplied placement or create one, then run the original arm-to-body and reverse probe loops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves all part/joint exclusions, sphere comparisons, reference queries, forward/reverse order, probe radii and degree arithmetic; supplied geometry must belong to these exact body/bones and unchanged evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For A arm parts and S total parts, keeps O(A*S) broad norms and every selected depth query. Each required part centre and positive-depth probe's world placement is composed once; every lever norm and radius clamp still runs. Which segments are the arm's is the model's table, read by index, and each segment a probe is read in is prepared once for the placement. A room read also shares its collider construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Clearance.room lends one exact placement used by obstacles. Its unchanged poses and model geometry also prove local centre/probe placement reuse by index within this arm read. Every sphere/lever distance, radius clamp, depth and score remains an actual reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps at most S centres and the queried model probes' world points only through this synchronous arm read; no borrowed pose, geometry workspace or scalar score survives return. The existing weak body model still owns reference lifetime.

# src/audit/AutoMovieMotionHumanAuditTangle.ts#AutoMovieMotionHumanAuditTangle.unordered

## @evidence contracts/development/common.md#meaningful-documentation

States two bone identities and the identical key returned for either ordering.

## @evidence contracts/development/implementation.md#principled-implementation

Lexicographic ordering of the two canonical bone names defines one deterministic unordered pair key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One original string comparison and delimiter composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the exact comparison and delimiter used by all skip/rest/reference maps, without remapping names.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant comparisons and key construction in bone-name length, independent of pose or probe count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All pair readers and exemption production share this key owner instead of choosing another ordering.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a string scalar and retains no names, pose or key history.

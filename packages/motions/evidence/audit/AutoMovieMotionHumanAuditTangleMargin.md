# src/audit/AutoMovieMotionHumanAuditTangleMargin.ts#AutoMovieMotionHumanAuditTangleMargin.within

## @evidence contracts/development/common.md#meaningful-documentation

States the pose, the skips and allowances, the pair index, the gate and listener and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The model's structural and reference rules and both probe directions give the excess depth, with conservative spheres rejecting distant pairs and the link pair's certificate (`HumanLinkCertificate.clearance`) the pairs whose shapes stand apart: two convex solids' distance bounds every probe depth between them, so such a pair holds no probe inside the other and that clearance is its margin; the base is `own`'s reading of the same depths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Form sphere centres, scan the unordered part pairs, gate, read both directions, then keep the deeper past the allowance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps related-pair skips, the sphere comparison, direction order, reference depths and the nanometre threshold; a pair is left unread only where its caller's gate says it is certified.

## @evidence contracts/development/implementation.md#efficient-algorithms

S parts require O(S*S) broad comparisons, a few GJKs per pair within reach that is due, and two depth readings only for a pair whose shapes the certificate cannot show apart; each segment read in is prepared once for the pose, and a pair's key is built only where some pair is skipped or pressed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the body's model and its references without reusing pose-dependent answers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh pair records; the centres and prepared readers end with the call.

# src/audit/AutoMovieMotionHumanAuditTangleMargin.ts#AutoMovieMotionHumanAuditTangleMargin.entering

## @evidence contracts/development/common.md#meaningful-documentation

States both placements, the pair index, the gate and listener and the directed result.

## @evidence contracts/development/implementation.md#principled-implementation

Two bodies share no joint and no rest pose, so the directed probe depths are read in full where the link pair's certificate (`HumanLinkCertificate.clearance`) cannot show the two segments' shapes apart; a pair it shows apart holds no probe inside the other, and that clearance is its margin; the base is `across`'s reading of the same depths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan of the ordered part pairs with the sphere screen, then the gate, one reading and the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps full external depth, part order, the sphere screen and the nanometre threshold; a pair is left unread only where its caller's gate says it is certified.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S and T parts, O(S*T) broad comparisons, a few GJKs per pair within reach that is due, and one depth reading only where the certificate leaves the pair; each of the other body's segments prepared once for the pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's placements and each body's canonical model.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared readers live for this call; only the returned pairs survive.

# src/audit/AutoMovieMotionHumanAuditTangleMargin.ts#AutoMovieMotionHumanAuditTangleMargin.own

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, both results with their units and how the base is read.

## @evidence contracts/development/implementation.md#principled-implementation

A probe's excess an instant later is at most the lesser of its depth and its room plus the travel, less its reference; the base is the least over the probes of the reference less that lesser value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One depth reading with the room, then one pass over the probes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The excess is the model's `excess`, the greatest positive `beyond`, in the same order of operations; a set-aside corner, whose reference is infinite, never lowers the base.

## @evidence contracts/development/implementation.md#efficient-algorithms

One depth reading of the pair, as `excess` makes, and one pass over its probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the model's references and the caller's prepared segments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two numbers; the room array is local.

# src/audit/AutoMovieMotionHumanAuditTangleMargin.ts#AutoMovieMotionHumanAuditTangleMargin.across

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, both results with their units and how the base is read.

## @evidence contracts/development/implementation.md#principled-implementation

A probe's depth an instant later is at most the lesser of its depth and its room plus the travel; the base is the least over the probes of minus that lesser value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One depth reading with the room, then one pass over the probes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The depth is the greatest probe depth in the order `AutoMovieMotionHumanAuditTangle.across` takes it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One depth reading and one pass over the probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's prepared reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two numbers; the room array is local.

# src/audit/AutoMovieMotionHumanAuditTangleMargin.ts#AutoMovieMotionHumanAuditTangleMargin.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit, what each entry sums and how a span's bound is read.

## @evidence contracts/development/implementation.md#principled-implementation

A step's travel is the origin's move plus the extent times the rotation's chord, `2 |vec(q2 q1^-1)|`, which is `2 sin(angle / 2)` read off the quaternion's vector part without the cancellation of `1 - w^2`; sums of steps bound a span by the triangle inequality.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One running sum per segment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every step of every segment is read from its placements; nothing is sampled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in instants times segments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the placements the caller made.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one array per instant of one number per segment, the caller's.

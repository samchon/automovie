# src/posture/HumanFitBalance.ts#HumanFitBalance.IReading

## @evidence contracts/development/design.md#principled-representation

Stores the actual segmental centre and the support region as half-planes in world metres, each an anchor, a unit inward normal and the centre's signed distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The merit reads inside and com; actual half-plane rows reuse anchors and normals, all produced from this same immutable reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the physical mass model and supplied/default bearing points without substituting a bone or changing a contact tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world units, half-plane ordering, signed distances and borrowed centre ownership.

# src/posture/HumanFitBalance.ts#HumanFitBalance.IRider

## @evidence contracts/development/design.md#principled-representation

The bone, the point in the bone's frame and its world place at the reading, the data a point's Jacobian column and its place at another posture are read from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `of` from the bearing points' bones; read by `slopes` and `at`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point is the bearing candidate's own, never a bone origin standing in for it.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

# src/posture/HumanFitBalance.ts#HumanFitBalance.IThrough

## @evidence contracts/development/design.md#principled-representation

The base owner's record of a half-plane's corners, named here beside the riders it indexes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias of the base owner's type, read with `riders` in `IReading.through`; no member of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `HumanFitBalanceBase.IThrough` instead of copying its members.

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds and its owner.

# src/posture/HumanFitBalance.ts#HumanFitBalance

## @evidence contracts/development/implementation.md#principled-implementation

Reads the segmental mass centre and the half-planes of the actual bearing points' convex hull (`HumanFitBalanceBase.of`: a polygon's edges, a segment's sides and end caps, or a point's four axis half-planes), then measures each; with the points' bones, each corner is kept as the point riding its bone in that bone's frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional current centre and one hull feed the ordered edge distances; their mass and geometry owners remain separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No half-plane is dropped or zeroed for a degenerate base, so a point or segment support still holds the centre; a supplied centre must be the actual value for the same unchanged body and bones.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P bearing points and H hull edges, hull construction takes O(P log P) and mean/normal/distance preparation O(H), plus delegated mass-model construction and placement when no centre is supplied.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepts the same-reading positional mass centre and computes the unchanged corner mean once; each resulting inward normal serves its distance, slope and fixed-model callbacks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh outline, inward-direction, distance and corner arrays, borrowing the supplied/computed centre and the bearing points as the corners' world places without mutation; no reading, points or derivative columns are cached globally.

## @evidence contracts/development/common.md#meaningful-documentation

States bearing defaults, same-reading centre premise, hull method, units, costs and ownership.

# src/posture/HumanFitBalance.ts#HumanFitBalance.at

## @evidence contracts/development/implementation.md#principled-implementation

The function `slopes` differentiates, evaluated: the half-plane through its corners where they are now, each side's inward orientation kept from the reading, so a second-order correction measures what the linear row models.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement of the corners the half-plane names and one dot product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No corner is left where the reading had it while its bone moves.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1): two corner placements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the reading's riders and orientations; places only the half-plane's own corners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the three kinds, the fixed fallback, units and sign.

# src/posture/HumanFitBalance.ts#HumanFitBalance.distance

## @evidence contracts/development/implementation.md#principled-implementation

Projects point-minus-anchor onto the half-plane's unit inward direction, the signed distance from its boundary line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One planar dot product; the reading owns every half-plane's construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Takes the reading's own normal, so a degenerate base's caps and sides are measured as constructed, never re-derived.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1) time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reading and its fixed-model row callbacks share each half-plane's prepared normal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no anchor or point.

## @evidence contracts/development/common.md#meaningful-documentation

States the half-plane convention, world units, signed result and height exclusion.

# src/posture/HumanFitBalance.ts#HumanFitBalance.slopes

## @evidence contracts/development/implementation.md#principled-implementation

The exact first derivative of each half-plane's signed distance (`at`): the centre's velocity columns on the inward normal, less the motion of the line itself. A side through corners P and Q moves at P's and Q's velocities blended at the share s along PQ where the centre projects, d' = n.(c' - (1 - s) P' - s Q'); a cap at P across PQ turns with the segment, d' = t.(c' - P') + (n.(c - P)) n.(Q' - P') / |PQ|; a point's axis moves with its corner, d' = n.(c' - P'). Without riders the base is fixed and only the centre moves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional equivalent centre Jacobian and one velocity column per corner feed all ordered half-plane rows; the same velocity owner serves positional centre goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every variable and half-plane; supplied columns must match this unchanged body, bones and ordered motion list. No corner's motion is dropped, so the model moves the base as the merit's own reading of the next posture does.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n variables, H half-planes and C corners, O((H + C)*n) time and result storage, plus velocities' cost only when columns are absent.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the reading's unchanged prepared normals, the completed current centre columns supplied by the same model's goal rows, and each corner's columns once for every half-plane through it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows columns without mutation and returns fresh scalar rows; corner columns live for this call; no current pose or Jacobian survives in module state.

## @evidence contracts/development/common.md#meaningful-documentation

States frame, units, variable/edge ordering, the moving base, current-input premise, optional computation and output ownership.

# src/posture/HumanFitBalance.ts#HumanFitBalance.centre

## @evidence contracts/development/common.md#meaningful-documentation

States the physical inputs, frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's segmental mass-weighted centre, shared with the support reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call on the existing mass model.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone stands in for the mass centre.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in mass segments, with no forward kinematics.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the body's own mass model (`IAutoMovieMotionHumanBody.massModel`), which assumes the body's skeleton and physical profile stay unchanged; actual placement always reads the supplied current bones.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mass model is the body's; placement returns a current centre and retains no posed bones.

# src/posture/HumanFitBalance.ts#HumanFitBalance.velocities

## @evidence contracts/development/common.md#meaningful-documentation

States the units and variable ordering.

## @evidence contracts/development/implementation.md#principled-implementation

Differentiating the segmental centre gives the mass-weighted sum of each segment centre's rigid-point velocity, divided by total mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One segment sum per variable.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same segment masses and local centres as the actual centre reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs n*S velocity queries for n variables and S segments, but each segment world point and bone lookup is produced once; scalar sums avoid per-segment scale/add result vectors, with O(S+n) call-local storage and no perturbed poses or new FK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares current segment world points and missing-bone decisions across variables, initialized lazily in the first variable's unchanged segment order; goal and balance rows may share these completed columns only for identical body/bones/motions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

World-point scratch lives only for this call and returns independent derivative vectors; the body's mass model retains no current points, motions or pose.

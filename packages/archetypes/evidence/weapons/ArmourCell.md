# src/weapons/ArmourCell.ts#ArmourCell.box

## @evidence contracts/development/common.md#meaningful-documentation

States stable part identity, model-metre lower/upper bounds, independent corners and nonpositive-volume refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The Cartesian product of three positive intervals is the exact panel; the core's shared convex-cell owner derives its hull, mass and collision.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the intervals and emit their Cartesian corners, without local triangulation or geometric search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty panels refuse instead of disappearing; openings are omitted by the form owner rather than filled by an invisible box.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and eight fresh points per panel.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every torso, cuff and closure panel reuses this exact interval definition; hull and physical computations stay in core.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only independent scalar corner records escape, with no retained profile, source model or cache.

# src/weapons/ArmourCell.ts#ArmourCell.minimumDistance

## @evidence contracts/development/common.md#meaningful-documentation

Takes planar outer faces and their shared model-metre centre; returns their least positive support or refuses an empty/degenerate course.

## @evidence contracts/development/implementation.md#principled-implementation

Plane normals from each face give its centre distance d. A shared inner factor 1-wall/min(d) then keeps all adjoining corners identical and every face's normal gauge at least wall.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce the already prepared course's positive plane distances once; callers retain their outer faces for cell construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the authored course rather than an ellipse radius proxy, sampled hull, guessed gauge or relaxed contact tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bounded course's face count with constant arithmetic per face and constant auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Helmet and limb courses share this support law and the same plane-distance primitive used by radial walls; each caller evaluates its distinct canonical faces once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar without retaining input faces, profiles, hulls or external resources.

# src/weapons/ArmourCell.ts#ArmourCell.radial

## @evidence contracts/development/common.md#meaningful-documentation

States outer face/cell identity, model-metre centre, positive wall, optional exact cavity support and refusal of degenerate or incompatible walls.

## @evidence contracts/development/implementation.md#principled-implementation

The outer face's normal gives its distance d from the centre. Axial fitted walls place their planes at cavity+wall and cavity. A globally aligned fitted lattice scales its inner course by cavity/(cavity+wall), preserving shared edges and exact normal gauge. An unfitted course uses 1-wall/minimum for every face, retaining shared inner edges and at least the authored gauge; a standalone face defaults to its own support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Derive one plane using engine vector operations, admit its positive radial interval and return the face with its scaled inner corners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Incompatible thin walls refuse rather than crossing the body, stretching the outer envelope, changing padding or dropping a cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the three or four supplied corners, with constant plane arithmetic and fresh output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Helmet and limb forms share this wall construction; engine Vector3 owns vector arithmetic and core owns the single hull realization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Copies outer and inner corners into the returned cell, retaining no caller face, profile, completed hull or external resource.

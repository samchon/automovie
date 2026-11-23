# src/kinematics/AutoMovieHumanoidSurfaceExtents.ts#AutoMovieHumanoidSurfaceExtents

## @evidence contracts/development/common.md#meaningful-documentation

States what an extent is, the two bounds with their anatomical basis and the floor.

## @evidence contracts/development/implementation.md#principled-implementation

A region is an area of the skin between its neighbours: a disc about its point, bounded by the half distance to the nearest neighbour facing the same way and by its segment's half breadth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place every region in the world, reduce each actual unordered neighbour pair into both nearest distances, then read each region's collider breadth and contact floor in the original order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's own: its regions' places and its colliders' bounds; no region is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Remains O(R squared) for R regions, with at most R(R-1)/2 normal/distance pairs instead of R(R-1). World points reuse their owned rotated offset; Vector3.distance keeps the existing magnitude branches without a displacement record. O(R) nearest scalars are local; all original at/bounds observations remain. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Private fresh placed points/normals fix each pair. XYZ dot products commute and distance is unchanged by reversing its displacement, so one calculation serves both endpoints. Ascending i/j traversal updates each region's neighbours in the original index order. At is still called once per region before all breadth reads, and bounds once per region in the original order; no caller callback result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh placed geometry and O(R) nearest scalars end on return or throw. The fresh output holds only region radii, retaining no callbacks, bone/frame objects, body, history or external handle.

# src/physics/physicalHullFaces.ts#physicalHullFaces

## @evidence contracts/development/implementation.md#principled-implementation

Quickhull (Barber, Dobkin and Huhdanpaa 1996) names the hull's planes through `physicalHullTriangles`. Each plane is then read from the first triple, in ascending index order, of the points on it: its normal by that triple's cross product, its offset and its members within the tolerance, a supporting plane having every point behind it (de Berg et al., Computational Geometry, chapter 11). Faces stand in the order of those triples and Andrew's monotone chain orders each loop, so the result is the one a scan of every triple in index order gives, whatever triangulation named the planes. A translation keeps every incidence of a hull, so a translated array's planes are named by its source's face triples and read from the translated coordinates by the same arithmetic; a reflection in X keeps them too, with each normal reflected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of hull topology: the nearest-point query, bounds, mass, erosion, validation and the native mapping all read these faces instead of deriving their own. The triangle search lives in `physicalHullTriangles`, the reading and ordering of planes in `physicalHullPlanes` and the boundary order in `physicalHullLoop`; this owner keeps the hull record, its summary, its memo and the reflected and translated provenance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-9 extent-relative tolerance decides every plane and member test. Extent keeps diagonal nonfinite propagation and omits only symmetric reverse distances. Reflected and translated geometry must pass exact coordinate checks before a source's planes are used, without a caller-supplied cached-hull flag. A translated array's carried faces are kept only when `physicalHullPlanes` verifies them on the translated points, every carried plane supporting them within the tolerance and every boundary edge lying on a second face; otherwise the array is searched afresh.

## @evidence contracts/development/implementation.md#efficient-algorithms

Extent is O(V^2) in V points. Quickhull is expected O(V log V). Reading the planes, their members and the buried depth is O(F V) for F faces, and ordering loops O(F V log V); a face of many coplanar points seeks its first triple among its members, at worst cubic in the collinear points leading its index order. A translated array skips quickhull.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each points array shares one completed hull through the weak map. Only mirrorX- or shift-issued provenance plus exact actual-coordinate checks can derive a hull from a source's; edited fresh points revert to ordinary search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weak completed cache owns one hull and one list of face triples per live points array. A search owns O(F V) boolean membership data, released on return or throw. Reflection and translation provenance borrow source points only until the fresh array's first attempted read. No query/body history is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States supporting faces, coplanar membership, outward loop order, degenerate behavior and immutable-source memo. Namespace mirrorX and shift produce fresh reflected or translated points with lazy provenance; their first topology read validates the actual coordinates and derives the hull from the source's, while an edited output receives an ordinary search.

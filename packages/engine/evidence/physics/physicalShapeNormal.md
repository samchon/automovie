# src/physics/physicalShapeNormal.ts#physicalShapeNormal

## @evidence contracts/development/implementation.md#principled-implementation

A sphere's and a capsule's exact gradient; a polytope's normal as the gradient of the log-sum-exp smooth maximum of its face planes' signed heights, continuous across edges and dominated by the nearest face farther from edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private normal calculation serves direct and prepared calls. Centre composition shares its fresh rotated offset's storage; direct reads preserve centre-then-rotation-then-kind observation. The explicit prepared reader lends only demanded centre/rotation/axis/inverse/planes and may omit a sphere's unused orientation, while radial retains the same current-point threshold/fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weights are taken relative to the highest plane, so none overflows; a degenerate normal falls back instead of normalising a zero vector. Direct calls still observe raw parent/local rotation getters and their failures after centre construction, including for spheres.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

PhysicalHullFaces, quaternion/vector owners and six fixed box normals remain shared. Direct calls read current transforms/extents anew. An explicit prepare caller holds its frame/shape unchanged, allowing exact centre/rotation/axis/inverse/planes to serve actual changing points without caching a normal, fallback, height or weight.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each polytope query uses two indexed height/weight passes and one weighted-sum vector before existing world rotation/normalization; raw boxes still construct their six planes. Centre and capsule-axis point composition reuse owned offsets; only explicit prepared sphere readers omit unused orientation. Prepared geometry pays demanded frame/axis/inverse/planes once without a wrapper and overwrites one height workspace. Direct calls retain no state; SurfaceRays consumes the prepared normals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct temporaries release on return. A prepared callback owns one numeric frame, optional axis/inverse, O(F) planes and one O(F) height workspace until its operation ends. Every present plane height is overwritten at each point; no point, fallback, normal result or query population is retained. Only six unit normals live for the module; outputs remain fresh except the original borrowed fallback.

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's normal, edge blend and borrowed fallback. Namespace prepare binds one unchanged admitted frame/shape, prepares only at first actual point and releases its callback with surface resolution; direct calls continue to read mutable current geometry freshly.

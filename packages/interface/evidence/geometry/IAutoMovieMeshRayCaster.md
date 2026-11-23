# src/geometry/IAutoMovieMeshRayCaster.ts#IAutoMovieMeshRayCaster

## @evidence contracts/development/design.md#principled-representation

Each query is the same Moller-Trumbore intersection over a median-split bounding volume hierarchy with an inclusive slab test, so `nearest`, `nearestHit` and `blocked` agree on which triangles are hit and differ only in what they keep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three entry points over one private `cast`: travel only, travel with identity, and a yes-or-no that stops early, because callers either measure clearance, attribute a hit to a face, or test occlusion, and each would otherwise pay for what it discards.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Self-hits are avoided by query-local triangle exclusions or an explicit minimum travel, never by nudging the origin, and unrepresentable arithmetic throws with the triangle ordinal instead of becoming a NaN hit.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the frame and units, the inclusive interval and its defaults, every refusal, what null does and does not mean, the winding, edge and grazing rules, and why the shared stack is safe.

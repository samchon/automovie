# src/architecture/IAutoMovieBuiltPlacementBounds.ts#IAutoMovieBuiltPlacementBounds

## @evidence contracts/development/design.md#principled-representation

An element box folds static CPU mesh/tessellated vertices under current element-world and part-local transforms, or the world-origin fallback. It excludes skinning, attached-bone motion, other animation, external geometry and GPU arithmetic. A population uses its authored prototype/placement envelope; these bounds require usable binary64 intermediates and are not an outward-rounded rendered-frame enclosure proof.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two corners plus the basis label are the whole answer; the label travels with the box so every overlap and support query built on it can report what kind of extent it measured.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The basis excludes `surface-height-rule` because only body locators resolve to a box, and a vertex-less element is labelled `element-origin-point` instead of being given an invented extent.

## @evidence contracts/development/common.md#meaningful-documentation

States world metres, inclusive corners, current-state placement, static CPU/prototype measurement limits and finite-result premises. The point basis means equal corners, whether from unavailable geometry or coincident vertices.

# src/drawing/IAutoMovieDrawing.ts#IAutoMovieDrawing

## @evidence contracts/development/design.md#principled-representation

The synchronous derivation shares a current-state design index, projects static CPU part/face triangles, clips cell sections, resolves opening/feature metadata and rounds stored coordinates to six decimals. Stroke keys and prescribed array sorts canonicalize output; the payload digest covers produced JSON metadata rather than proving rendered geometry, source-byte identity or complete design coverage. Projection, clipping and round(value*1e6)/1e6 have finite/conditioning limits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record per sheet with each kind of content in its own typed array, and the view's identity fields copied in, so the serializer and any checker read the drawing without the view except for its pen.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Known unsupported/missing derivations become gaps, including hidden-line removal and opening subtraction. This is not a universal detector of every numerical or modelling defect; filtering can intentionally omit content and world-to-page projection loses depth. Digest equality is deterministic serialization identity without a collision-free or execution-provenance guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States the provenance and one-way direction, the page units and rounding, where scale is applied, the ordering of every array, what the extent contains, why openings ignore the kind filter, and exactly what the digest covers.

# src/space/AutoMovieEngineSpace.ts#AutoMovieEngineSpace.surfaceHeightAt

## @evidence contracts/development/common.md#meaningful-documentation

The entry states its world coordinates and metre-valued return. It identifies the supplied rule as the primary input, documents legacy anchors and names the footprint check which callers can apply independently. Its fallback for an absent lattice sample is observable in the direct world height test.

## @evidence contracts/development/implementation.md#principled-implementation

The entry delegates to the same evaluator used for authored world surfaces. A constant returns the authored value and a plane evaluates its signed slopes on world XZ. The lattice estimates a cell from its coordinates and corrects the estimate against represented world knots. It clamps at the lattice boundary. The interpolation helper preserves selected endpoint samples and uses a weighted sum when their difference overflows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant, plane and legacy anchor inputs take constant work. The lattice evaluates one cell after estimating both axes. A missed estimate triggers binary search on that axis. The cell then reads four samples from caller-owned storage. The synchronous call leaves only its numeric result.

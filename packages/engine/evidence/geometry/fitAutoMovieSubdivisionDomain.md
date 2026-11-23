# src/geometry/fitAutoMovieSubdivisionDomain.ts#fitAutoMovieSubdivisionDomain

## @evidence contracts/development/implementation.md#principled-implementation

Uses exact affine subdivision hierarchy with independent coarse control and limit constraints, a declared frozen physical discrete bending energy and the maintained PSD quadratic solver through residual-variable lifting. It does not claim the analytic plate energy, global injectivity, or measurement preservation from isolated interpolation equations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function coordinates admitted topology, two sparse symbolic refinements, physical energy rows, equality construction and three coordinate solves. Callers own semantic region selection, collar adequacy, clinical measures and final consumer validation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No input-specific tuning, anatomy offsets, dropped target constraints, authored-objective regularization, solver setting changes or source mesh baking. Active targets incident to interior sharp edges and incomplete numerical solves are refused; support creases outside those target fans retain their exact maintained refinement masks. The engine's reversible equilibration and factor-only stabilization leave this authored problem unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States units, hierarchy, the distinct meanings of anchors and limit targets, exterior preservation, the discrete energy, caller-owned collar and clinical checks, refusals and the absence of a no-fold claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two uniform refinements make O(16F) faces. Symbolic masks and energy composition use sparse local supports, not dense inverse or basis probing. Three engine-owned TypeScript sparse QPs dominate time and fill-dependent workspace; each has twice the refined vertex count in variables due to residual lifting.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One refined topology, affine map, physical metric and constraint pattern serves all three coordinate solves. There is no cross-request cache because geometry changes the metric and target data; the result retains the completed domain for render and construction consumers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All assembly maps and solver result arrays are local. The returned domain owns its refined arrays and copied coarse controls; temporary assembly becomes unreachable on return or failure. Each QP owns its sparse factors and borrowed TypeScript iterate, releases the workspace owner's references in finally, and retains no reactor or solver state across coordinate solves.

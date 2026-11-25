# src/geometry/construction/realizeAutoMovieConstruction.ts#realizeAutoMovieConstruction

## @evidence contracts/development/implementation.md#principled-implementation

One recursive walk applies the operators the tree names in the tree's own containment order, and each operator is the kernel's (view loft, intersection trace, rails, blend, trim, body, zip), so the realization adds no geometry of its own; a broken node is rolled back to the state before its part was built, which is what leaving it out means.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk serves both skin requests; overloads preserve a required default mesh, explicit false narrows to null, and a runtime boolean returns their union. The traced join's native chord is converted from metres and forwarded to body assembly, which owns the paired rail geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Source leaves use the invocation's actual millimetre definitions, not a sampled declaration, cached loft or global name registry. Missing/mismatched sources and exceptions while initially preparing their loft and station grid are source diagnostics before face publication; later retained-callback exceptions retain the existing operator exception policy. Broken joins use their existing subtree rollback without relaxed tolerances or replacement primitives.

## @evidence contracts/development/common.md#meaningful-documentation

States walk/rollback/admission, units, source context lifetime and default-on skin. Skin false omits final draw/fans/metre copying, not operator or boundary work, and certifies no final skin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each source leaf adds one context lookup before loft work. Existing adaptive Point0 bisection covers the actually owned domain, including retained caps, and removes only exact collapsed tip rows before ordinary grids/fans. Skin false avoids final O(V+T+F) copying and tessellation/fans; source/grid costs remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A face's actual source is resolved and lofted once, and its resulting surface is shared by joins, trims and skin; different invocations never select geometry through past registration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call borrows its lookup map. Returned chains/surfaces retain actual generating dependencies, kept immutable for their readers' lifetime; callbacks may retain their own transitive context. No global map/cache/handle is added, and body grids/boundaries/snapshots keep their existing lifetimes.

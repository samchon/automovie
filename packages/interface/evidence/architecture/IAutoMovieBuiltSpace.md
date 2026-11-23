# src/architecture/IAutoMovieBuiltSpace.ts#IAutoMovieBuiltSpace

## @evidence contracts/development/design.md#principled-representation

The per-space reader unions half-space cells with authored-scale 1e-9 inequality slack, or reads shell boundary/solid-angle winding. Both represent flat geometry; fidelity declares whether it stands for something curved, while bounded cells, consistently oriented shell components and numerically usable arithmetic remain premises not fully proved by admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One nullable parent id states hierarchy and `builtSpaceContainsPoint` shares the own-volume predicate. Bounds, volume and drawing sections have representation-specific readers; descendant membership is a separate subtree fold, so a volume-less parent contains no point itself while an environment query can still include its children's volumes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cells and shell together are refused instead of merged, `fidelity` on a volume-less space is refused, and `faceted` is an authored declaration that no code infers from the geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States the one-spelling rule and the meaning of neither, the parent and root rules, the convexity and world frame of cells, when to use a shell, and what `exact`, `faceted`, and absence of `fidelity` mean for derived answers.

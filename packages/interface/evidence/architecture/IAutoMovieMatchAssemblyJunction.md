# src/architecture/IAutoMovieMatchAssemblyJunction.ts#IAutoMovieMatchAssemblyJunction.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Report which construction roles survive a junction between two build-ups. Member documentation states the supplied records, units and absence meanings used by matchAutoMovieAssemblyJunction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller must establish the same axis and origin for both resolved assemblies; matchAssemblyJunction cannot establish that relationship from host-local axes alone.

## @evidence contracts/development/design.md#principled-representation

left and right are resolved build-ups on one shared measuring line; tolerance is the finite nonnegative metre gap accepted between matching role spans.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieMatchAssemblyJunction.IProps, used by matchAutoMovieAssemblyJunction. Its left, right, tolerance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.

# src/architecture/IAutoMovieOpeningSweep.ts#IAutoMovieOpeningSweep

## @evidence contracts/development/design.md#principled-representation

The box bounds the four leaf corners over the panel's travel, solved from the closed form `A + B cos(t) + D sin(t)` a revolute corner traces, whose per-axis extremes lie at the limits or at the critical angles crossed, and from the limits for a prismatic leaf.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two world corners keyed by panel and element are what a clearance or collision analysis reads, and the record states no verdict about passage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box is per panel with ancestors held at the current state rather than a union over every reachable configuration, a stated limitation, and the leaf is treated as having no thickness.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and order, that the box spans the panel's element-local rectangle over its own travel, that the leaf has no thickness, how ancestors are posed, and that it is not the union over a chain's states.

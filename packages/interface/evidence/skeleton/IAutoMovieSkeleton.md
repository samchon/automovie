# src/skeleton/IAutoMovieSkeleton.ts#IAutoMovieSkeleton

## @evidence contracts/development/design.md#principled-representation

A stable rig id and unique normalized bone records define one connected single-root parent graph for FK and ROM admission, shared by generated and explicitly mapped imported rigs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Rig existence and rest/constraint data are independent from pose and motion channels, allowing one normalized representation across acquisition paths.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Generic model validation requires one connected root but does not require every VRM mandatory bone or guarantee arbitrary-avatar retargeting; mapping, rest basis and target ROM remain separately admitted.

## @evidence contracts/development/common.md#meaningful-documentation

Defines stable rig identity, unique bone population, connected single-root graph and the separation from stricter VRM import requirements.

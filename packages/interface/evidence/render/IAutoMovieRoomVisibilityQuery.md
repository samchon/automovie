# src/render/IAutoMovieRoomVisibilityQuery.ts#IAutoMovieRoomVisibilityQuery

## @evidence contracts/development/design.md#principled-representation

A canonical built environment and camera position in world metres supply cell/portal reachability for one building.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieRoomVisibility reads the environment's own spaces, boundaries, openings and connector graph rather than a parallel visibility scene.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown or ambiguous camera containment keeps all spaces; openable portals remain conservative regardless of movable door state.

## @evidence contracts/development/common.md#meaningful-documentation

Documents leaf-space containment, exterior connectivity and cases that cannot prove hiding.

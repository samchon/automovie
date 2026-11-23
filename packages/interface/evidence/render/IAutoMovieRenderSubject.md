# src/render/IAutoMovieRenderSubject.ts#IAutoMovieRenderSubject

## @evidence contracts/development/design.md#principled-representation

Use one drawable-world record for both semantic ownership and inventory cost, including compact populations, simulated drawables not represented by ordinary scene nodes, surface graphics whose face rectangles the mask paints under their own ids, and the film stage's settings, whose GPU targets the inventory counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scene/models and optional population/simulation/texture facts remain explicit fields, letting the compiled-shot adapter supply canonical ownership without renderer imports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing texture facts produce not-run, unsupported water facts remain unknown, and planting geometry stays host-reported; omitted facts are not certified zero allocation.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain heroes already in nodes, anonymous compact formations, domain-derived geometry, missing measurements, fresh-context meaning of omitted residency, and what an omitted film allocates.

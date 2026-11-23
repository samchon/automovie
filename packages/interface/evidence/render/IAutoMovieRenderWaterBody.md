# src/render/IAutoMovieRenderWaterBody.ts#IAutoMovieRenderWaterBody

## @evidence contracts/development/design.md#principled-representation

A bound fluid domain authoritatively determines grid cells, particle cap and drawn surface; external solver counts apply only without a domain, and wholly unproved facts remain unsupported.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One water-body row joins semantic/material ownership and simulation geometry without charging both domain surface and ordinary scene nodes for the same water.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null counts mean no solver proof, not zero; domain-derived quantities override hand counts rather than accepting contradictory estimates.

## @evidence contracts/development/common.md#meaningful-documentation

Members document domain precedence, node double-count avoidance, semantic ownership and material use only for a domain-drawn surface.

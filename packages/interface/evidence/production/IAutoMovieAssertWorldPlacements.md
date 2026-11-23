# src/production/IAutoMovieAssertWorldPlacements.ts#IAutoMovieAssertWorldPlacements.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Reject material world-layout contradictions before shot construction. Member documentation states the supplied records, units and absence meanings used by assertWorldPlacements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input reuses authored boxes, polygons and route widths; support/contact tolerances are those of the placement gate rather than per-scene exemptions.

## @evidence contracts/development/design.md#principled-representation

blocks, surfaces, routes and landmarks share world metres and Y-up staging; assertWorldPlacements checks support and plan clearance before shot construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieAssertWorldPlacements.IInput, used by assertWorldPlacements. Its blocks, surfaces, routes, landmarks members carry this operation's declared inputs or results; imported domain records keep their existing definitions.

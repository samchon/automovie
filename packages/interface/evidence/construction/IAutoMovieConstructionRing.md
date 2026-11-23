# src/construction/IAutoMovieConstructionRing.ts#IAutoMovieConstructionRing

## @evidence contracts/development/design.md#principled-representation

IRing pairs body face/end indices and millimetre stations with a signed phase correspondence and shared sampling count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ConstructionRing consumes this interface record to publish the continuation's one shared boundary to both faces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sign union fixes orientation alternatives; valid faces, equal endpoint geometry and sampling count remain continuation premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives kept-side cycle roles, station units and phase reversal.

# src/construction/IAutoMovieConstructionRing.ts#IAutoMovieConstructionRing.IRing

## @evidence contracts/development/design.md#principled-representation

One host ring maps to both endpoint charts with sign 1/-1, expressing the boundary correspondence established by the continuation layer transform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A small record carries the two faces, stations, kept cycle kinds, sample count and phase sign without embedding another ring geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Face validity, matching endpoint geometry and a positive integer count are caller premises; this record does not prove or repair them.

## @evidence contracts/development/common.md#meaningful-documentation

Gives millimetre stations, start/end kept-side meaning and reversed phase order.

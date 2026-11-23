# src/construction/IAutoMovieConstructionView.ts#IAutoMovieConstructionView

## @evidence contracts/development/design.md#principled-representation

Classic three-view lofting (aircraft conic lofting, the ship lines plan): four named outlines and one fullness owner per station determine the section, each outline a function of the inputs, so breadth, depth and girth hold together instead of a girth scaling a section about its centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record carries the frame, the stations, the two views, the fullness and the closure; the third view enters as the fullness's `top` kind rather than another record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every value is a declared input at a named site; nothing is sampled from a mesh or an image, and an outline equals the section's extreme only in the part's own frame, which the axis states.

## @evidence contracts/development/common.md#meaningful-documentation

States what each view sees, the four touch angles, the ownership of extremes and fullness, the admission rules and their failure effect.

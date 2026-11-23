# src/recovery/computation/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour

## @evidence contracts/development/design.md#principled-representation

Ordered CutPoint observations and graph-walk closure retain the actual contour; optional exact-face sets and ordered segment contributions preserve emission incidence without inferring a cap, fitted phase or surface jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One contour record owns point order, closure and optional provenance; cutting owns observation, while fitting and slab consumers retain separate qualification responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Open/failed/contact contours are not replaced by fixtures, largest components or invented closure; ordered records retain every traversed contribution without merging by coordinate proximity.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain nonduplicated closed endpoints, actual versus endpoint-star face support, directed segment order, original input ordinals and omitted default metadata.

# src/render/draw/IAutoMovieDrawResult.ts#IAutoMovieDrawResult

## @evidence contracts/development/design.md#principled-representation

The picture is the call's raster in bytes, four per pixel, rows from the top, written as base64 because the transport carries strings; labels are picture pixels from the top-left; the legend and the camera are the inspection core's records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieDrawSession`, which checks the size, stamps the legend and the labels through the capture run and records the camera, the resolved patterns and any sample diagnostics; for the mask shade it passes on the palette the page painted with, which only the page can see and the delivery host records as the mask's convention; it passes on the dialogue mouths the actors' figures showed, which the delivery render measures lip sync on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The size is stated beside the bytes so a short or long picture is refused, never cropped or padded.

## @evidence contracts/development/common.md#meaningful-documentation

States the transport, the byte layout, the label frame and who reads each member.

# src/capture/IAutoMovieCliCaptureSessionInput.ts#IAutoMovieCliCaptureSessionInput

## @evidence contracts/development/common.md#meaningful-documentation

The input names the selected subject, its data and the optional host activity observer.

## @evidence contracts/development/design.md#principled-representation

A nullable subject selects the only available subject when unnamed. The structured progress observation reflects the draw session's host-visible operation boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Session opening shares the same subject and props between capture and CLI rendering. Rendering supplies its receipt observer while capture may omit it.

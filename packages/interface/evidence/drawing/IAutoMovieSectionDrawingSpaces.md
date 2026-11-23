# src/drawing/IAutoMovieSectionDrawingSpaces.ts#IAutoMovieSectionDrawingSpaces.IProps

## @evidence contracts/development/design.md#principled-representation

World half-spaces are sectioned on the frame's plane into page metres. Null selection means all spaces while an empty set means none; finite plane/frame arithmetic remains a runtime premise supplied by validated derivation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sectioner shares the same environment index and frame as line drafting; it needs space filtering but not element-kind filtering or sheet rendering state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shell-only volumes are counted as unsupported rather than replaced by guessed cells, and the filter's null/empty distinction prevents accidentally drawing all excluded spaces.

## @evidence contracts/development/common.md#meaningful-documentation

Gives selection semantics, coordinate frame, validation owner and stable borrowed-input requirements.

# src/drawing/IAutoMovieSectionDrawingSpaces.ts#IAutoMovieSectionDrawingSpaces.IResult

## @evidence contracts/development/design.md#principled-representation

Regions carry page metres and square metres; shelled counts spaces while unbounded counts cell sections reaching the finite clipping window. The latter is not proof that the original volume is mathematically unbounded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveAutoMovieDrawing consumes the regions and all three limitation fields; canonical region/point records carry geometry while counts and ids explain omissions without retaining the design index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported shells and window-limited cells are reported rather than approximated, faceted declarations remain visible even without a drawn section, and ambiguous observed finishes remain null.

## @evidence contracts/development/common.md#meaningful-documentation

Defines rounding order, ordering, finish evidence, exact counter populations, faceted selection and caller-owned output.

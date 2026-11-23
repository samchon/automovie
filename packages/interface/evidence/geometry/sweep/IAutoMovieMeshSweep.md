# src/geometry/sweep/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Normalized spine rows and integer loop sample counts determine metre geometry; meshAutoMovieSweep validates endpoint rows and counts, and compileAutoMovieSweep admits section data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mesher's existing flat/smooth and capped/open paths consume these options; canonical IAutoMovieSweep owns the actual shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Polygon parameter correspondence retains authored corners; self-intersection remains an authoring limitation rather than an asserted property of every result.

## @evidence contracts/development/common.md#meaningful-documentation

Gives every option's default, input copying, polygon sampling exception, shading behavior and metric atlas meaning.

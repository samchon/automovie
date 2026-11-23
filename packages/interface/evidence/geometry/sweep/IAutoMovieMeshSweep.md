# src/geometry/sweep/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep

## @evidence contracts/development/common.md#meaningful-documentation

Normalized spine rows, section sample counts, end-cap choice and wall-normal policy describe a metre sweep mesh. Optional fields have explicit defaults; caps=false permits open walls and no option certifies self-intersection freedom.

## @evidence contracts/development/design.md#principled-representation

Normalized spine rows, section sample counts, end-cap choice and wall-normal policy describe a metre sweep mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

meshAutoMovieSweep consumes the canonical authored sweep and owns its direct triangulation options.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional fields have explicit defaults; caps=false permits open walls and no option certifies self-intersection freedom.

# src/geometry/sweep/IAutoMovieMeshSweep.ts#IAutoMovieMeshSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Normalized spine rows and integer loop sample counts determine metre geometry; meshAutoMovieSweep validates endpoint rows and counts, and compileAutoMovieSweep admits section data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mesher's existing flat/smooth and capped/open paths consume these options; canonical IAutoMovieSweep owns the actual shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Polygon parameter correspondence retains authored corners; self-intersection remains an authoring limitation rather than an asserted property of every result.

## @evidence contracts/development/common.md#meaningful-documentation

Gives every option's default, input copying, polygon sampling exception, shading behavior and metric atlas meaning.

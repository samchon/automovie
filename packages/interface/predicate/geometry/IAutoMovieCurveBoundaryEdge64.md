# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64

## @evidence contracts/development/common.md#meaningful-documentation

Directed declaration authorizing one named boundary owner and its receiving region and node.

## @evidence contracts/development/design.md#principled-representation

The curve context clones one edge per unique ID, admits both node keys and checks publishing and binding calls against the declared region pair.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The edge owns routing identity. Geometry arrives through the authenticated publication.

# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64.id

## @evidence contracts/development/common.md#meaningful-documentation

Unique boundary identity inside the context, used to resolve publication and consumption.

# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64.ownerRegion

## @evidence contracts/development/common.md#meaningful-documentation

Region key required when the owner publishes the boundary.

# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64.ownerBone

## @evidence contracts/development/common.md#meaningful-documentation

Declared hierarchy node key needed on the publication call.

# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64.consumerRegion

## @evidence contracts/development/common.md#meaningful-documentation

Region key required when the recipient binds the genuine publication.

# src/geometry/IAutoMovieCurveBoundaryEdge64.ts#IAutoMovieCurveBoundaryEdge64.consumerBone

## @evidence contracts/development/common.md#meaningful-documentation

Declared receiving hierarchy node key needed on the binding call.

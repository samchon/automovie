# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The request specifies model-metre cubic profiles, exact source station and shared endpoint handling, and independent forwarded budgets and tolerance.

## @evidence contracts/development/design.md#principled-representation

The producer checks each finite increasing adjacent station interval and all four centre and positive radius controls per field. It shares exact endpoint rows. Positive safe vertex budgets one and two remain admitted by the producer and are refused only by model realization admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The request keeps borrowed source geometry and forwarded rendering limits separate. It performs no tessellation and spends no work budget.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput.loft

## @evidence contracts/development/common.md#meaningful-documentation

The borrowed profiles define increasing finite adjacent Y intervals and agree exactly at neighboring endpoint controls. The output uses the original endpoint Y coordinates.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput.topologyDomain

## @evidence contracts/development/common.md#meaningful-documentation

The nonblank identity names the generated atlas coefficient domain.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput.tolerance

## @evidence contracts/development/common.md#meaningful-documentation

The positive finite model-metre tolerance is forwarded without altering the circular-cubic bound. The later model boundary requires a finite millimetre conversion.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput.maxCells

## @evidence contracts/development/common.md#meaningful-documentation

The producer requires a positive safe integer and forwards it unchanged.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IInput.maxVertices

## @evidence contracts/development/common.md#meaningful-documentation

The producer requires a positive safe integer including one and two. The standalone model boundary requires three or more.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes caller-owned open lateral geometry and a separate circular-cubic approximation bound in metres.

## @evidence contracts/development/design.md#principled-representation

The generator emits four quarters per axial span with shared endpoint coefficient ordinals and separate patch normal fans. It preserves exact outer Y values and uses convex interpolation when subtracting finite station endpoints would overflow. Generated nonfinite coefficients throw before a recipe is returned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer returns a new recipe and independent scalar bound. Triangle buffers, tessellation completeness, source fitting and end caps have separate owners.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IResult.geometry

## @evidence contracts/development/common.md#meaningful-documentation

The new mutable atlas represents open lateral geometry in the loft frame. Controls and boundaries are shared by original identity within the recipe.

# src/geometry/IAutoMovieCreateEllipticLoftAtlas.ts#IAutoMovieCreateEllipticLoftAtlas.IResult.arcDeviationBound

## @evidence contracts/development/common.md#meaningful-documentation

The metre value bounds the circular-cubic section approximation with 0.000273 times the largest radius control, floored to the smallest positive binary64 value.

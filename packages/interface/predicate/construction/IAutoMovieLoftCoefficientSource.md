# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the physical endpoint location from the parameter used for its coefficient derivatives.

## @evidence contracts/development/design.md#principled-representation

CoefficientSource.prepare adds zero coefficient vectors at the admitted closing stations and fits parameter derivatives over the principal and virtual rows together.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The endpoint extends StationHermite.IEnd with the physical pole station and a required curvature. Span assembly can then reuse the Hermite implementation.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnd.station

## @evidence contracts/development/common.md#meaningful-documentation

This comment identifies the physical location used when admitting a cap span.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnd.slope

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the derivative coordinate and alignment to endpoint values.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnd.curvature

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the second derivative coordinate needed by quintic interpolation.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnds

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains how endpoint presence follows chain and parameter closure.

## @evidence contracts/development/design.md#principled-representation

CoefficientSource.prepare compares root or angle endpoint presence against chain closure and creates end records only for the matched set.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two optional fields identify actual closed ends directly. Interior coefficient values remain on their principal layers.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnds.bottom

## @evidence contracts/development/common.md#meaningful-documentation

The comment locates the optional endpoint and identifies when it exists.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnds.top

## @evidence contracts/development/common.md#meaningful-documentation

The comment locates the optional endpoint and identifies when it exists.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies which derivatives live in the source and which live on the layer.

## @evidence contracts/development/design.md#principled-representation

CoefficientSource.prepare fits one parameter-coordinate spline including the virtual endpoints. At each principal layer it applies the chain rule to publish the separate station derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reusing the admitted outline parameter preserves its endpoint contract. The source carries the two extra derivative arrays needed for regular reads toward a singular pole.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource.parameter

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the direction of the shared map and its physical input unit.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource.slopes

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the derivative order and coefficient alignment.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource.curvatures

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the arrays that must remain aligned by coefficient index.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource.ends

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains why multiple layers refer to the same end records.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains endpoint order, weight order and how position and derivative reads differ at a singular station.

## @evidence contracts/development/design.md#principled-representation

CoefficientSource.controls chooses two principal endpoints with an equal map or a principal and virtual endpoint of an admitted cap. It prepares quintic weights in their common parameter coordinate, with a nullable physical-station change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

StationHermite owns the endpoint and basis representation. CoefficientSource owns span selection and the change to physical station.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls.a

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies which endpoint supplies the left coefficients.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls.b

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies which endpoint supplies the right coefficients.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls.weights

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines the order and evaluation coordinate of the prepared rows.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls.change

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the direction of the conversion and what null permits.

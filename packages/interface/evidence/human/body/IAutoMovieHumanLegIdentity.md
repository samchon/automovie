# src/human/body/IAutoMovieHumanLegIdentity.ts#IAutoMovieHumanLegIdentity

## @evidence contracts/development/common.md#meaningful-documentation

One leg, measured standing.

## @evidence contracts/development/design.md#principled-representation `thighLength`: Thigh length: trochanterion height minus tibiale height, the top of the greater trochanter to the upper edge of the medial tibial condyle, millimetres. `shankLength`: Shank length: tibiale height minus lateral malleolus height, millimetres. `ankleHeight`: Lateral malleolus height: the lateral malleolus landmark, the most laterally prominent point of the fibula's lower end, above the standing surface, millimetres (ANSUR II; women 62.7, SD 5.1, men 72.9, SD 5.7).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegIdentity is the canonical exchange used by FootGiven.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `thighLength`, `shankLength`, `ankleHeight`, `footLength`, `footBreadth`, `navicularHeight`, `thighCircumference`, `lowerThighCircumference`, `calfCircumference`, `ankleCircumference`, `hipFlexion`, `hipExtension`, `kneeFlexion`, `kneeHyperextension`, `ankleDorsiflexion`, `anklePlantarFlexion`; callers supply the complete record.

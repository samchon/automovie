# src/render/IAutoMoviePlanVideoSceneCutsProps.ts#IAutoMoviePlanVideoSceneCutsProps

## @evidence contracts/development/common.md#meaningful-documentation

Describes the cut detector's input stream, threshold and output path.

## @evidence contracts/development/design.md#principled-representation

The optional absolute stream index uses the same numbering as the picture extractor. The report holds detected cut facts on that stream's clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation takes the scalar detection threshold and the report path it must escape. The selected absolute stream goes through the same mapping as the picture extractor.

# src/render/IAutoMoviePlanVideoSceneCutsProps.ts#IAutoMoviePlanVideoSceneCutsProps.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the same absolute stream address the still extractor uses.

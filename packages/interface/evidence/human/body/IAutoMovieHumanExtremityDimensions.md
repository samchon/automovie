# src/human/body/IAutoMovieHumanExtremityDimensions.ts#IAutoMovieHumanExtremityDimensions

## @evidence contracts/development/common.md#meaningful-documentation

Independent hand and foot dimensions, optional joint-centre leg spans and a positive phalangeal length ratio.

## @evidence contracts/development/design.md#principled-representation `hands`: Independently supplied left and right hand lengths and breadth. `feet`: Independently supplied left and right foot dimensions. `footAssembly`: Requested ankle assembly; omitted means joined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanExtremityDimensions is the canonical exchange consumed by the limb input resolver. It distinguishes the documented foot and hand calipers from requested centre-to-centre leg bone lengths and a dimensionless phalangeal ratio.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `hands`: Independently supplied left and right hand lengths and breadth. `feet`: Independently supplied left and right foot dimensions. `footAssembly`: Requested ankle assembly; omitted means joined.

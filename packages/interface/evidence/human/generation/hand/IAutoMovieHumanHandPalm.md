# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IFixedCurveInput

## @evidence contracts/development/common.md#meaningful-documentation

JSON coefficient layout before restoring the engine's fixed tuple widths.

## @evidence contracts/development/design.md#principled-representation `type`: Declared cubic representation and physical units. `name`: Original curve identity. `closed`: Original closed-loop flag.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandPalm.fixedCurve, AutoMovieHumanHandPalm.fixedSection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `type`, `name`, `closed`, `unit`, `phaseUnit`, `phaseIntervals`, `spans`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IFixedSection

## @evidence contracts/development/common.md#meaningful-documentation

One Bézier section and its cutting chart in native world millimetres.

## @evidence contracts/development/design.md#principled-representation `station`: Source row label, with a fractional label for an inserted measured collar cut. `stationMm`: Distance along the source course in millimetres, used to index the axis. `coordinateMm`: Signed cutting-plane coordinate in millimetres in the section's observation chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandPalm.fixedSection. Read by AutoMovieHumanHandPalm.physicalPlane, AutoMovieHumanHandPalm.contourCoordinates, AutoMovieHumanHandPalm.attachFixed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `stationMm`, `coordinateMm`, `originMm`, `u`, `v`, `loops`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IContourCoordinates

## @evidence contracts/development/common.md#meaningful-documentation

Numerical chart of the ordinary strip.

## @evidence contracts/development/design.md#principled-representation `stations`: Accumulated distances between the actual plane origins, millimetres. `worldCollar`: Whether the measured turning collar is retiled in its world chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandPalm.contourCoordinates. Read by AutoMovieHumanHandPalm.attachFixed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `worldCollar`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IFixedTerminal

## @evidence contracts/development/common.md#meaningful-documentation

Isolated raw-mesh tip and its observed neighbouring coordinates.

## @evidence contracts/development/design.md#principled-representation `singleTipQualified`: Whether the raw-mesh maximum qualifies as a single point for a loft cap. `maximum`: Terminal plane coordinate and its raw-mesh extremal points in native world millimetres. `coordinatesMm`: Observed plane coordinates in millimetres, including a cut beyond the maximum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandPalm.attachFixed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `singleTipQualified`, `maximum`, `coordinatesMm`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IFixedSectionValue

## @evidence contracts/development/common.md#meaningful-documentation

Restore the unchanged absolute frame and cubic loops of an authored section.

## @evidence contracts/development/design.md#principled-representation `station`: Archived source row address, including fractional labels for inserted cuts; the physical station is stationMm. `stationMm`: Physical station along the original source axis, millimetres. `coordinateMm`: Physical coordinate of this section or event along the original source axis, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandPalm.IFixedSectionValue is the canonical exchange used by AutoMovieHumanHandPalm.fixedSection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `station`, `stationMm`, `coordinateMm`, `originMm`, `u`, `v`, `loops`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IOpenTerminalResult

## @evidence contracts/development/common.md#meaningful-documentation

Read the actual open capture edge and verify every directed mesh edge.

## @evidence contracts/development/design.md#principled-representation `base`: Index of the first vertex in the actual open terminal ring within the archived mesh position array. `boundary`: Directed open-edge boundary vertices in their verified cyclic order, registered millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandPalm.IOpenTerminalResult is the canonical exchange used by AutoMovieHumanHandPalm.openTerminal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `base`, `boundary`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanHandPalm.ts#IAutoMovieHumanHandPalm.IFixedMesh

## @evidence contracts/development/common.md#meaningful-documentation

Describes a caller-owned position buffer and its oriented triangle indices in millimetres.

## @evidence contracts/development/design.md#principled-representation

Three consecutive positions identify one point. Three indices identify one oriented triangle in the same mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed hand contour attachment and terminal readers consume the record. Human owns tessellation and edge admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every point and triangle is supplied by the caller. The type generates no inferred topology.

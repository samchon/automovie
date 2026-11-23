# src/human/generation/arm/IAutoMovieHumanArmF1Lines.ts#IAutoMovieHumanArmF1Lines.IFixedMesh

## @evidence contracts/development/common.md#meaningful-documentation

Locally owned mutable world-millimetre triangles, until the region is returned.

## @evidence contracts/development/design.md#principled-representation `positions`: Absolute millimetre positions, three numbers per vertex. `indices`: Three vertex indices per emitted triangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmF1Lines.sleeve. Read by AutoMovieHumanHandPalm.attachFixed, AutoMovieHumanHandPalm.openTerminal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `positions`, `indices`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmF1Lines.ts#IAutoMovieHumanArmF1Lines.IFixedRing

## @evidence contracts/development/common.md#meaningful-documentation

One ordered, implicitly closed set of measured contour controls and its distal plane normal.

## @evidence contracts/development/design.md#principled-representation `points`: Absolute contour vertices in millimetres, without a repeated closing point. `normal`: Unit normal pointing along the measured distal course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmF1Lines.sleeve. Also types AutoMovieHumanArmF1Lines.orientation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `normal`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmF1Lines.ts#IAutoMovieHumanArmF1Lines.IShoulders

## @evidence contracts/development/common.md#meaningful-documentation

One quarter's conic shoulder per pair of guides.

## @evidence contracts/development/design.md#principled-representation `lateralPosterior`: Between the lateral and posterior guides. `posteriorMedial`: Between the posterior and medial guides. `medialAnterior`: Between the medial and anterior guides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmF1Lines.IShoulders is the canonical exchange used by AutoMovieHumanArmF1Lines.q.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `lateralPosterior`, `posteriorMedial`, `medialAnterior`, `anteriorLateral`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmF1Lines.ts#IAutoMovieHumanArmF1Lines.IStation

## @evidence contracts/development/common.md#meaningful-documentation

One authored station.

## @evidence contracts/development/design.md#principled-representation `site`: Its anatomical site. `along`: Millimetres from the segment's zero along its axis, or the landmark it stands at. `extents`: Outline values from the segment axis: lateral, medial, anterior, posterior, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanArmF1Lines.HUMERUS, AutoMovieHumanArmF1Lines.FOREARM.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `along`, `extents`, `shoulders`; callers supply the complete record.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget

## @evidence contracts/development/common.md#meaningful-documentation

The limits describe the Engine's plane, retained-event, tessellation-cell and vertex populations alongside physical tolerance and pair direction separation.

## @evidence contracts/development/design.md#principled-representation

The controls distinguish numerical direction separation, metre-based chord tolerance, and discrete counts for planes, retained events, cells, and vertices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery passes these limits to Engine during fitting qualification and again with independently supplied controls during recipe compilation.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.tolerance

## @evidence contracts/development/common.md#meaningful-documentation

The boundary planner receives this positive finite model-space tolerance for the generated approximations.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.maxPlanes

## @evidence contracts/development/common.md#meaningful-documentation

The fitter counts both retained directions for each view against this cap before producing support samples.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.maxEvents

## @evidence contracts/development/common.md#meaningful-documentation

The planning limit applies to retained boundary events. A static section arrangement can fit within the zero-event cap.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.maxCells

## @evidence contracts/development/common.md#meaningful-documentation

The Engine boundary plan receives the cell cap before mesh emission.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.maxVertices

## @evidence contracts/development/common.md#meaningful-documentation

The Engine mesh emitter independently enforces this positive safe vertex cap.

# src/recovery/IAutoMovieRecoverySupportLoftBudget.ts#IAutoMovieRecoverySupportLoftBudget.minimumDirectionSine

## @evidence contracts/development/common.md#meaningful-documentation

The direction threshold governs which plane pairs can define intersection vertices in the section query and realization.

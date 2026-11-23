# src/index.ts#applyAutoMovieInspection

## @evidence contracts/development/common.md#meaningful-documentation

States the shared result for both renderers, each step with its rule and reason, the measured kinds, the colour law, what the legend counts, the failure behaviour, and shows the apply, seek, update, draw and restore order.

## @evidence contracts/development/implementation.md#principled-implementation

Each step changes one kind of scene state and records how to put it back, and the steps are ordered so a later one sees the earlier one's result: patterns are checked before anything changes, overrides exist before clipping is set on them, and marks exist before the cut. A mark is identified by its path and its kind, never by a list of meanings, so any producer's finding is drawn by the same rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The steps share one undo list. Pattern admission, shade, mark building, measurements, colours, legends and bounds each have their own module. One local function chooses and builds supplied marks for apply and update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Objects and marks are chosen by path pattern and marks by kind pattern only, no curve or defect kind is named outside the defect producer, an unmatched pattern is refused, prior layers and clipping state are recorded and put back instead of reset to defaults, and a setup failure never leaves the scene half inspected.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selection is decided once per distinct path and kind, defects are measured once per geometry however many meshes share it, and each frame costs one world-matrix pass plus the marks and, under the outline or pose pass, its shells or bone links.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Guide passes, material overrides, section planes, restoration and the once guard are the renderer's existing owners; defect measurement is the engine's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle owns the overlay group, the built marks, the override materials and the recorded prior state until `restore`, which releases all of them once; replaced marks are released when replaced; the scene's own objects and materials are borrowed.

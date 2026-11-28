# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryAuthority

## @evidence contracts/development/common.md#meaningful-documentation

The declaration explains the nonblank input ID and the four registry controls in cubic order over the unit boundary phase.

## @evidence contracts/development/design.md#principled-representation

Bicubic admission resolves the named authority and its four IDs in the source control registry. Incident sides reference the same explicit name to share that generating cubic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The authority identifies the shared curve by existing control indices. It carries neither generated coordinates nor per-patch restriction and normal choices.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryAuthority.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the named authority in the input registry. Bindings resolve this string.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryAuthority.controlIds

## @evidence contracts/development/common.md#meaningful-documentation

Selects the four safe registry ordinals that define ordered cubic Bernstein controls.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding

## @evidence contracts/development/common.md#meaningful-documentation

The declaration defines the patch side, named authority, directed phase endpoints and render normal fan. It explains side parameter order and reversal.

## @evidence contracts/development/design.md#principled-representation

Bicubic admission resolves the patch and boundary authority before constructing its directed side restrictions. The mesh producer uses fan identity to distinguish render normals at otherwise shared physical positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The binding connects one patch edge to an existing curve and fan. The authority independently owns the underlying cubic controls.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.patch

## @evidence contracts/development/common.md#meaningful-documentation

Selects the existing patch whose edge is bound. The owner admits at most one binding for that side.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.side

## @evidence contracts/development/common.md#meaningful-documentation

Specifies bottom, right, top or left using the increasing local side coordinate.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.authority

## @evidence contracts/development/common.md#meaningful-documentation

Selects the existing shared cubic authority for this side restriction.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.start

## @evidence contracts/development/common.md#meaningful-documentation

Gives the finite normalized canonical phase at local side coordinate zero.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.end

## @evidence contracts/development/common.md#meaningful-documentation

Gives the corresponding phase at local one. A lower phase reverses the restriction.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IBoundaryBinding.normalFan

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the chosen render normal fan used when allocating or reusing a render vertex.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IPatchCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the copied prepared patch and its millimetre tensor grid, including preparations for omitted plans.

## @evidence contracts/development/design.md#principled-representation

The tessellation summary reads the prepared plan grid after boundary binding and copies the four tensor rows when coefficient retention was requested. The plan can contribute a retained snapshot regardless of its emitted cell count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A snapshot contains a patch identity and its actual prepared coefficient grid. Retained triangle data and patch qualification stay on their own result paths.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IPatchCoefficients.patch

## @evidence contracts/development/common.md#meaningful-documentation

Carries the original requested patch ID associated with this prepared grid.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.IPatchCoefficients.gridMm

## @evidence contracts/development/common.md#meaningful-documentation

Carries the copied four-by-four millimetre coefficients by V row and U column.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.Input.boundaryAuthorities

## @evidence contracts/development/common.md#meaningful-documentation

Provides shared cubic boundary sources by stable IDs and their four control registry ordinals.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.Input.boundaryBindings

## @evidence contracts/development/common.md#meaningful-documentation

Connects specific patch sides to directed restrictions on the canonical cubic boundaries.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.Summary.patchCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

Supplies copied prepared grids when retention was requested, with each grid related to its input patch.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.Input.retainTriangleParameters

## @evidence contracts/development/common.md#meaningful-documentation

The optional boolean controls six chart coordinates per retained triangle in corner order. Tessellation refuses a supplied nonboolean before work.

# src/geometry/IAutoMovieBicubicAtlasTessellation64.ts#IAutoMovieBicubicAtlasTessellation64.Input.retainPatchCoefficients

## @evidence contracts/development/common.md#meaningful-documentation

The optional boolean controls copied bound coefficient grids, including prepared grids for stopped plans. Omission or false allocates none and a supplied nonboolean is refused.

/**
 * Thirty-six indices for twelve box triangles.
 *
 * @evidence contracts/testing.md#behavioral-verification Contributes the independent index storage term to BOX_GEOMETRY_BYTES, which the budget tests compare with inventory output.
 * @evidence contracts/testing.md#independent-expectations Three indices for each of twelve triangles give thirty-six; the renderer's measured allocation is not the oracle.
 * @evidence contracts/testing.md#distinguishing-cases Pins an indexed one-box representation; nonindexed or differently tessellated shapes are outside this constant's meaning.
 * @evidence contracts/testing.md#execution-ownership This fixture value feeds existing unit expectations and owns no discovered scenario or native resource.
 */
export const BOX_INDICES: number = 36;

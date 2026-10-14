/**
 * Twelve triangles for one six-face box, two per face.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the independent per-box expectation used by render inventory and budget assertions; this constant performs no assertion itself.
 * @evidence contracts/testing.md#independent-expectations Six authored quad faces require two triangles each, giving twelve without reading the measured inventory.
 * @evidence contracts/testing.md#distinguishing-cases Callers multiply this one-part expectation across ordinary boxes, instances and repeated shadow passes; other geometry topologies need their own expectation.
 * @evidence contracts/testing.md#execution-ownership A numerical fixture constant imported through renderFixtures by existing unit entries; it registers no case and starts no host.
 */
export const BOX_TRIANGLES: number = 12;

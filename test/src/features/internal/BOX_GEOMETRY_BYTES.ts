import { BOX_INDICES } from "./BOX_INDICES";
import { BOX_VERTICES } from "./BOX_VERTICES";

/**
 * The fixture's box storage: position and normal triples plus 32-bit indices.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing render budget units compare measured geometry bytes with this one-part arithmetic scaled by distinct resident models.
 * @evidence contracts/testing.md#independent-expectations Twenty-four vertices each carry six 32-bit floats, and thirty-six indices each occupy four bytes; this excludes every other possible attribute.
 * @evidence contracts/testing.md#distinguishing-cases Pins the fixture's position/normal/index layout rather than all geometry buffers, instanced slot bytes or texture storage, which callers account for separately.
 * @evidence contracts/testing.md#execution-ownership Pure module arithmetic over the canonical box constants, reached by existing test entries without a GPU or native build.
 */
export const BOX_GEOMETRY_BYTES: number = BOX_VERTICES * 24 + BOX_INDICES * 4;

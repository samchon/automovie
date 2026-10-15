/** Samples emitted wall triangles from the geometry side, including faces without any boundary address. */
import { AddressCoverageRow } from "./AddressCoverageRow";
import { type AddressException } from "./AddressException";

export interface AddressCoverage { step: number; emitted: number; covered: number; uncovered: number; skyOpen: number; exposed: number; excepted: number; unexpected: number; addressedInException: number; rows: AddressCoverageRow[]; exceptions: Array<AddressException & { samples: number }> }


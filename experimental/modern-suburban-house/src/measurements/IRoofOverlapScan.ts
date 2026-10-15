import { IRoofOverlap } from "./IRoofOverlap";


/** Result of one roof overlap grid scan. */
export interface IRoofOverlapScan {
  /** Grid spacing in metres. */
  step: number;
  /** Solid pairs whose bounds overlap and were scanned. */
  pairsChecked: number;
  /** Grid samples tested. */
  samplesChecked: number;
  /** Every overlapping pair. */
  overlaps: IRoofOverlap[];
}

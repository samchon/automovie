import { AddressCoverageRow } from "./AddressCoverageRow";
import { type AddressException } from "./AddressException";

/** Wall-address coverage totals of one census, with a row per wall face. */
export interface AddressCoverage {
  /** Sampling step in metres along and up each wall face. */
  step: number;
  /** Samples that land on emitted wall geometry. */
  emitted: number;
  /** Emitted samples lying on a published boundary face. */
  covered: number;
  /** Emitted samples on no boundary face. */
  uncovered: number;
  /** Uncovered samples with no geometry above them. */
  skyOpen: number;
  /** Uncovered samples whose face is visible from the site or the exterior. */
  exposed: number;
  /** Exposed samples inside a named address exception. */
  excepted: number;
  /** Exposed samples outside every exception; any count is a failure. */
  unexpected: number;
  /** Covered samples that also fall inside an exception interval. */
  addressedInException: number;
  /** Per-face counts, one row per sampled wall face. */
  rows: AddressCoverageRow[];
  /** Every named exception with the number of exposed samples it accounted for. */
  exceptions: Array<AddressException & { samples: number }>;
}


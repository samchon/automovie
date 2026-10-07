import type { IBodyCaptureResult } from "./IBodyCaptureResult";
import type { IBodyObservationUnit } from "./IBodyObservationUnit";

/**
 * The derived unit and actual viewer results recorded together. Capturing
 * proves which frames exist; this record does not judge their anatomy.
 * @author Samchon
 */
export interface IBodyObservationManifestProps extends IBodyCaptureResult {
  /** Derivation owner carrying all requested frames and excluded extremes. */
  unit: IBodyObservationUnit;

  /** Actual first drawn frame's response digest; connection digest when no frame exists. */
  revision: string;

  /** Identity of the published body view on which this unit was derived. */
  basisId: string;

  /** First drawn frame's actual device string; connection report when no frame exists. */
  renderer: string;

  /** True only when this run drew current frames; false when every requested state was refused. */
  humanBuildFresh: boolean;
}

import type { IHumanSourceMirror } from "./IHumanSourceMirror.ts";
import type { IHumanSourceNasalPort } from "./IHumanSourceNasalPort.ts";

/**
 * Native correspondence required by report-only head sample registration.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadSampleSelectionInput {
  /** Pinned hm08 base-mesh mirror twins, in native source index space. */
  mirror: IHumanSourceMirror;

  /** Native head-skin vertex to generation sample, with source IDs retained. */
  faceToG1: Int32Array;

  /** Native sample to canonical root; a retired sample has no identity fallback. */
  nativeToSource?: Int32Array;
  /** Current provider's ordered boundaries replace retired sparse witnesses. */
  nasalPorts?: IHumanSourceNasalPort[];
}

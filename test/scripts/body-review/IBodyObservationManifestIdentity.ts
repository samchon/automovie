import type { IBodyObservationSource } from "./IBodyObservationSource";

/**
 * The manifest fields required to judge source freshness without reading PNGs.
 * A freshness result does not judge the body's visual or anatomical correctness.
 * @author Samchon
 */
export interface IBodyObservationManifestIdentity extends IBodyObservationSource {
  /** Manifest format version admitted by the reader. */
  schema: number;

  /** Whether actual current frames were drawn when this record was created. */
  humanBuildFresh: boolean;
}

import type { IHumanSourceHeadTraitField } from "./IHumanSourceHeadTraitField.ts";

/** `head-trait-endpoints.json` of `compile-head-trait-endpoints.py`: the
 * content receipt of actual dimensional source production. It names the
 * authoring receipt, sample and provider it was computed from by digest, so
 * the generation compiler can refuse endpoints of another formula. Host
 * paths and interpreter details stay in that run's `run-environment.json`.
 * @author Samchon
 */
export interface IHumanSourceHeadTraitPacket {
  schema: "automovie-authored-head-dimensional-endpoints/2";
  /** SHA-256 of the authoring directory's `source-inputs.json`, as the replay records it. */
  authoringInputsSha256: string;
  /** Sample file digests by name, as the sample manifest lists them. */
  sampleInputs: Record<string, string>;
  providerNeutralSha256: string;
  providerJointsSha256: string;
  providerPacketSha256: string;
  providerVertices: number;
  polygons: number;
  fields: IHumanSourceHeadTraitField[];
  refusals: unknown[];
}

import type { IHumanSourceCoherence } from "./IHumanSourceCoherence.ts";
import type { IHumanSourceColliderGeometry } from "./IHumanSourceColliderGeometry.ts";
import type { IHumanSourceCrownDimension } from "./IHumanSourceCrownDimension.ts";
import type { IHumanSourceEndpointCensusRow } from "./IHumanSourceEndpointCensusRow.ts";
import type { IHumanSourceOcclusionReceipt } from "./IHumanSourceOcclusionReceipt.ts";
import type { IHumanSourceOralCensus } from "./IHumanSourceOralCensus.ts";
import type { IHumanSourcePeriocularSeatSide } from "./IHumanSourcePeriocularSeatSide.ts";

/**
 * `census.json`: what a compiled head view's source geometry measures, before
 * any runtime resolver, articulation, corrective or contact pass acts on it.
 *
 * @author Samchon
 */
export interface IHumanSourceCensus {
  /** Source generation ID of the head view that was read. */
  generation: string;

  /** Face basis ID of that head view. */
  face: string;

  /** SHA-256 of the `head.json.gz` bytes that were read. */
  headSha256: string;

  /** Units, frame, sign and the layers this reading leaves out. */
  convention: string;

  /** Cage-to-globe signed distance per eye. */
  periocular: IHumanSourcePeriocularSeatSide[];

  /** Moved surfaces per shape channel end. */
  endpoints: IHumanSourceEndpointCensusRow[];

  /** Tongue and crown interpenetration at the source neutral. */
  oral: IHumanSourceOralCensus;

  /** Actual source cervical-port rooted heights; these are not clinical gingival measurements. */
  crownDimensions: IHumanSourceCrownDimension[];

  /** Actual source collider resident-point queries; null means contact registration is absent. */
  colliderGeometry: IHumanSourceColliderGeometry[] | null;

  /** The rigid mandibular opening that clears the neutral occlusion; zero once it is authored. */
  occlusion: IHumanSourceOcclusionReceipt;

  /** Present when a reference generation and its edit receipt were given. */
  coherence?: IHumanSourceCoherence;
}

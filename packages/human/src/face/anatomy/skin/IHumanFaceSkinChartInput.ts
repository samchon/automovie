import type { IAutoMovieHumanFaceAttachmentChart } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * Registered source material disks and one current native skin host. The host must own the surface's exact incidence. The source supplies the reference metric, and all requested native anchors must belong to one disk.
 *
 * @evidence contracts/common.md#principled-implementation Reference registration and current native incidence define one material chart's host.
 * @evidence contracts/common.md#clear-and-simple-design The producer supplies correspondence/generation premises and the chart qualifies the requested connected support.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly arrays are not runtime freezing; immutable host callback state and coherent source registration remain caller premises.
 * @evidence contracts/common.md#meaningful-documentation Reference/current positions use head metres while chart registration yields dimensionless material coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference projection, chart construction and native lifting execute in createHumanFaceSkinChart and its consumers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One fixed incidence/registered reference is shared across material coordinates and current courses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Construction copies reference/registration data while current host geometry remains borrowed for chart lifetime.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinChartInput {
  /** Source reference geometry, native incidence and registered material disks. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Shape-only reference positions in head-frame metres, with the same native incidence. */
  referencePositions: readonly number[];

  /** Surface-owned material domain name, or the part's diagnostic course identity when registration is supplied. Overlapping disks are never interchangeable. */
  domain: string;

  /** Existing source registration carried by a part owner, such as a lid cage. Omission reads the surface's named material domain; supplied registration must retain the same host generation and incidence. */
  registration?: IAutoMovieHumanFaceAttachmentChart;

  /** The current immutable host owning point and normal transport. */
  host: IHumanFaceSkinHost;

  /** Registered source-band vertices whose inverse must retain native identity. */
  supportVertices: readonly number[];
}

import type { IAutoMovieHumanFaceAttachmentChart } from "../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * Registered source material disks and one current native skin host.
 * The host must own the surface's exact incidence. The source supplies the
 * reference metric, and all requested native anchors must belong to one disk.
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

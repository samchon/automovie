import { type OverlapPair } from "./OverlapPair";
import { type BoundaryUpperRow } from "./BoundaryUpperRow";
import { type LedgerRow } from "./LedgerRow";
import { type OpeningFrustumRow } from "./OpeningFrustumRow";
import { type ISourceRevision } from "./ISourceRevision";
import { type AddressCoverage } from "./AddressCoverage";
import { type OwnFacadeRow } from "./OwnFacadeRow";

/** Measurements of the current source returned to the self-check and the viewer's review page. */
export interface ReviewPayload {
  /** Source basis hash of the measured source. */
  basis: string;
  /** Git revision of the production, or null outside a repository. */
  revision: ISourceRevision | null;
  /**
   * Envelope overlap scan: grid spacing, tolerance, solid and sample counts, run time and every
   * overlapping pair.
   */
  overlaps: { grid: number; tolerance: number; solids: number; samples: number; milliseconds: number; pairs: OverlapPair[] };
  /**
   * Observation count, how many lack a pose, and each eye found inside an envelope solid as
   * `<station> in <group>`.
   */
  observations: { count: number; withoutPose: number; buried: string[] };
  /** Upper exterior-band census of every boundary. */
  boundaryUpper: BoundaryUpperRow[];
  /** Frustum census of every opening. */
  openingFrustum: OpeningFrustumRow[];
  /** Wall-address coverage census. */
  addressCoverage: AddressCoverage;
  /** Exceptions whose named observation station does not exist. */
  missingExceptionObservations: string[];
  /** Own-station visibility of every single-space facade. */
  ownFacades: OwnFacadeRow[];
  /** Topology ledger of every model and composite solid. */
  ledger: LedgerRow[];
  /** Emitted complete surface IDs grouped by owner for ownership inspection. */
  surfaces: Array<{ owner: string; ids: string[] }>;
  /** Sum of geometry, pose, boundary, opening, address and observation failures; nonzero fails self-check. */
  failures: number;
}


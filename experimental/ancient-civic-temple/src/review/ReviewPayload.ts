/**
 * Measurement producer shared by the pre-review self-check and viewer /review
 * . Builds the current environment once and returns (1) the
 * complete envelope overlap scan, (2) observation poses inside solids and (3)
 * topology accounts for every model and composite solid, together with their
 * source basis, Git revision and grid input. Values are geometric facts, not verdicts.
 */
import { type OverlapPair } from "./OverlapPair";
import { type BoundaryUpperRow } from "./BoundaryUpperRow";
import { type LedgerRow } from "./LedgerRow";
import { type OpeningFrustumRow } from "./OpeningFrustumRow";
import { type ISourceRevision } from "./ISourceRevision";
import { type AddressCoverage } from "./AddressCoverage";
import { type OwnFacadeRow } from "./OwnFacadeRow";

export interface ReviewPayload {
  basis: string;
  revision: ISourceRevision | null;
  overlaps: { grid: number; tolerance: number; solids: number; samples: number; milliseconds: number; pairs: OverlapPair[] };
  observations: { count: number; withoutPose: number; buried: string[] };
  boundaryUpper: BoundaryUpperRow[];
  openingFrustum: OpeningFrustumRow[];
  addressCoverage: AddressCoverage;
  missingExceptionObservations: string[];
  ownFacades: OwnFacadeRow[];
  ledger: LedgerRow[];
  /** Emitted complete surface IDs grouped by owner for ownership inspection. */
  surfaces: Array<{ owner: string; ids: string[] }>;
  /** Sum of geometry, pose, boundary, opening, address and observation failures; nonzero fails self-check. */
  failures: number;
}


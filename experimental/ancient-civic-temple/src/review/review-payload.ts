/**
 * Measurement producer shared by the pre-review self-check and viewer /review
 * . Builds the current environment once and returns (1) the
 * complete envelope overlap scan, (2) observation poses inside solids and (3)
 * topology accounts for every model and composite solid, together with their
 * source basis, Git revision and grid input. Values are geometric facts, not verdicts.
 */
import { roofStepClosures } from "../geometry/roof-solids";
import { createTempleEnvironment } from "../spaces/environment";
import { templeObservations } from "../spaces/observations";
import { envelopeSolids, lastScan, scanOverlaps, solidsContaining, type OverlapPair } from "./envelope-overlaps";
import { boundaryUpperCensus, type BoundaryUpperRow } from "./boundary-upper";
import { templeTopologyLedger, type LedgerRow } from "./mesh-ledger";
import { openingFrustumCensus, type OpeningFrustumRow } from "./opening-frustum";
import { sourceBasis, sourceRevision, type SourceRevision } from "./source-basis";
import { addressCoverageCensus, type AddressCoverage } from "./address-coverage";
import { ownFacadeFailures, ownFacadeViews, type OwnFacadeRow } from "./own-facade-view";
import { exposedAddressExceptions } from "./address-exceptions";

export interface ReviewPayload {
  basis: string;
  revision: SourceRevision | null;
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

export const createReviewPayload = (grid: number): ReviewPayload => {
  if (!(grid > 0)) throw new Error("Grid spacing must be a positive value in m.");
  const basis = sourceBasis();
  const revision = sourceRevision();
  const built = createTempleEnvironment();
  const solids = envelopeSolids({ walls: built.walls, roof: built.roof, trim: built.trim, floors: built.floors.inputs });
  const tolerance = 1e-3;
  const started = Date.now();
  const pairs = scanOverlaps(solids, grid, tolerance);
  const overlaps = { grid, tolerance, solids: solids.length, samples: lastScan.samples, milliseconds: Date.now() - started, pairs };
  const list = templeObservations(built.environment);
  const boundaryUpper = boundaryUpperCensus(built.environment, built.roof);
  const openingFrustum = openingFrustumCensus(built.environment, list);
  const addressCoverage = addressCoverageCensus(built.environment, built.walls, solids);
  const ownFacades = ownFacadeViews(built.environment, list);
  const missingExceptionObservations = exposedAddressExceptions.filter((entry) =>
    !list.some((observation) => observation.id === entry.observation)).map((entry) => entry.observation);
  const buried = list.flatMap((o) => o.position === null ? [] : solidsContaining(solids, o.position).map((group) => `${o.id} in ${group}`));
  const ledger = templeTopologyLedger(built.environment, roofStepClosures(built.roof.filter((r) => r.tier === "wing")).map((face, i) => ({ id: `step-closure.${i}`, corners: face.corners })));
  const owners = new Map<string, Set<string>>();
  for (const model of built.environment.models) {
    for (const part of model.parts) {
      const owner = part.id.split(".")[1] ?? part.id;
      owners.set(owner, (owners.get(owner) ?? new Set()).add(part.id));
    }
  }
  const surfaces = [...owners].sort(([a], [b]) => a.localeCompare(b))
    .map(([owner, ids]) => ({ owner, ids: [...ids].sort((a, b) => a.localeCompare(b)) }));
  return {
    basis, revision, overlaps,
    observations: { count: list.length, withoutPose: list.filter((o) => o.position === null).length, buried }, boundaryUpper, openingFrustum, addressCoverage, missingExceptionObservations, ownFacades,
    ledger, surfaces,
    failures: pairs.length + buried.length + ledger.filter((row) => row.findings.length > 0).length +
      boundaryUpper.filter((row) => row.exposed > 0).length + openingFrustum.filter((row) => !row.roomCenterVisible || !row.completeProfileFramed).length +
      addressCoverage.unexpected + addressCoverage.addressedInException + addressCoverage.exceptions.filter((entry) => entry.samples === 0).length +
      ownFacadeFailures(ownFacades).length + missingExceptionObservations.length,
  };
};

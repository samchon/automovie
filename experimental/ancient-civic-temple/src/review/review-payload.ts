/**
 * 판정 요청 전 자가검사와 뷰어의 `/review`가 함께 쓰는 측정 producer
 * (`.agents/skills/source-authoring/ownership.md`: preview·측정이 같은 geometry를 본다).
 * 현재 source로 environment를 한 번 만들어 (1) 외피 실체 겹침 전수 스캔, (2) 관찰 pose가
 * 실체 안에 놓였는지, (3) 모든 model과 합성 실체의 topology 결산을 내고, 그 값을 얻은
 * source basis·Git revision·격자 입력을 함께 돌려준다. 값은 기하 사실이며 판정이 아니다.
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

export interface ReviewPayload {
  basis: string;
  revision: SourceRevision | null;
  overlaps: { grid: number; tolerance: number; solids: number; samples: number; milliseconds: number; pairs: OverlapPair[] };
  observations: { count: number; withoutPose: number; buried: string[] };
  boundaryUpper: BoundaryUpperRow[];
  openingFrustum: OpeningFrustumRow[];
  addressCoverage: AddressCoverage;
  ledger: LedgerRow[];
  /** 방출된 완결 표면 ID를 owner별로 모은 목록(표면 소유 역검사). */
  surfaces: Array<{ owner: string; ids: string[] }>;
  /** 계약을 어긴 결산 행 수와 겹친 쌍·실체 안 pose 수의 합. 0이 아니면 자가검사 실패다. */
  failures: number;
}

export const createReviewPayload = (grid: number): ReviewPayload => {
  if (!(grid > 0)) throw new Error("격자 간격은 양의 m 값이어야 합니다.");
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
  const addressCoverage = addressCoverageCensus(built.environment, built.walls);
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
    observations: { count: list.length, withoutPose: list.filter((o) => o.position === null).length, buried }, boundaryUpper, openingFrustum, addressCoverage,
    ledger, surfaces,
    failures: pairs.length + buried.length + ledger.filter((row) => row.findings.length > 0).length +
      boundaryUpper.filter((row) => row.exposed > 0).length + openingFrustum.filter((row) => !row.roomCenterVisible || !row.completeProfileFramed).length +
      addressCoverage.rows.filter((row) => row.wall === "wall.facade-south.entry-back" && row.skyOpen > 0).length,
  };
};

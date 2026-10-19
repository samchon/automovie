import { RecoveryEventRegionCells } from "./RecoveryEventRegionCells";
import { RecoveryEventRegionPorts } from "./RecoveryEventRegionPorts";
import { RecoveryEventRegionSource } from "./RecoveryEventRegionSource";
import { RecoveryEventRegionTopology } from "./RecoveryEventRegionTopology";

type V = readonly [number, number, number];
type Triangle = readonly [number, number, number];
type PortReference =
  | { kind: "closed" | "open"; section: number; curve: number }
  | { kind: "contact"; section: number; observation: number }
  | { kind: "boundary"; name: string };
interface Source {
  verticesMm: readonly V[];
  triangles: readonly Triangle[];
  canon: Int32Array;
  heights: readonly number[];
  incidence: "raw" | "canonical";
}
interface Port {
  id: string;
  reference: PortReference;
  side: "before" | "after" | "physical";
  /** Exact cut-segment faces, rather than an unqualified endpoint-star superset. */
  faces: readonly number[];
  /** Original source endpoint addresses of physical boundary edges, when supplied. */
  edges?: readonly (readonly [number, number])[];
}
interface Query {
  beforeMm: number;
  afterMm: number;
  candidates: readonly number[];
  ports: readonly Port[];
}
interface Node {
  id: string;
  incidenceId: string;
  vertices: readonly number[];
  scalar: number;
}
type IssueCode =
  | "collapsed-declared-incidence"
  | "duplicate-face-occurrence"
  | "source-geometry-rank-below-two"
  | "flat-source-face"
  | "repeated-cell-incidence-vertex"
  | "nonmanifold-edge-incidence"
  | "nonmanifold-source-edge"
  | "nonmanifold-vertex-link"
  | "boundary-is-not-a-simple-cycle"
  | "orientation-parity-obstruction"
  | "input-face-directions-inconsistent"
  | "point-contact-between-edge-components"
  | "port-ambiguous-ownership"
  | "port-missing-ownership"
  | "overlapping-port-boundary-claims";
interface Issue {
  code: IssueCode;
  faces: number[];
  cells: number[];
  occurrences: string[];
  ports: string[];
}
interface Cell {
  id: number;
  face: number;
  /** Dimension in the source triangle's reference domain, independently of geometric rank. */
  dimension: 0 | 1 | 2;
  /** Exact affine rank of the original face, not the physical dimension of a contact cell. */
  sourceGeometryRank: 0 | 1 | 2;
  scalarKind:
    | "varying"
    | "flat-interior"
    | "flat-before"
    | "flat-after"
    | "boundary-contact";
  /** One plane registry must own on-plane faces/contacts when adjacent query results are combined. */
  stratum:
    | { kind: "open-slab"; beforeMm: number; afterMm: number }
    | { kind: "plane"; coordinateMm: number };
  nodes: string[];
  component: number | null;
  /** Relative face reorientation for a qualified orientable sheet, never an outward-normal claim. */
  orientationFlip: boolean | null;
}
interface Occurrence {
  id: string;
  cell: number;
  face: number;
  from: string;
  to: string;
  edge: string;
  side: "before" | "after" | "physical";
  physicalBoundary: boolean;
  component: number;
}
interface Component {
  id: number;
  cells: number[];
  faces: number[];
  classification: "unclassified";
  /** Topology of the relative two-cell sheet; lower-dimensional contacts remain separate evidence. */
  topology: {
    vertices: number;
    edges: number;
    faces: number;
    euler: number | null;
    manifold: boolean;
    orientable: boolean | null;
    inputOrientationConsistent: boolean;
    boundaryCycles: number;
    genus: number | null;
  };
  /** Halfedge occurrence and traversal direction; no coordinate or arbitrary seam closure is added. */
  cycles: {
    occurrences: { id: string; direction: 1 | -1 }[];
    nodes: string[];
    orientation: "coherent" | "unqualified";
  }[];
  unresolvedBoundary: string[];
  issueIds: number[];
}
interface Result {
  incidence: Source["incidence"];
  boundsMm: [number, number];
  /** Candidate inclusion is the caller's closed-overlap premise, not independently certified here. */
  coverage: {
    candidateFaces: number;
    outsideCandidates: number;
    completeness: "caller-premise";
  };
  nodes: Node[];
  aliases: { rawNode: string; incidenceId: string }[];
  cells: Cell[];
  occurrences: Occurrence[];
  components: Component[];
  contacts: { cell: number; touchingComponents: number[] }[];
  ports: {
    id: string;
    reference: PortReference;
    cells: number[];
    components: number[];
    occurrences: string[];
    status: "unique-component" | "contact-only" | "ambiguous" | "missing";
  }[];
  issues: Issue[];
}

/**
 * Prepare private scalar-clipped source-cell ownership and boundary incidence observations.
 * Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * original face order. The implicit cell is that face's barycentric domain intersected
 * with the closed scalar interval; no source triangle array or generated mesh is returned.
 * Source and returned private addresses must be discarded before engine publication.
 * Original source edges share declared incidence; cut edges remain face occurrences,
 * so coincident or parallel cut edges are not welded. Raw and canonical incidence are
 * explicit alternatives, not assumed equivalent. Plane strata require one external owner
 * when adjacent slabs are combined. Connectivity/topology never establishes a regular or
 * event chart: every component remains unclassified, with all unsupported evidence retained.
 *
 * @evidence contracts/common.md#principled-implementation Symbolic scalar clipping retains reference cells and dimensions, declared source-edge incidence, halfedge occurrences and multigraph links. Parity constraints distinguish orientability from consistency of supplied face directions; boundary walks close only through actual edge identities. Exact dyadic source determinants establish triangle rank without moving positions.
 * @evidence contracts/common.md#clear-and-simple-design One immutable preparation owns source admission and rank; query-local cells own components, boundary cycles, typed issues and port memberships. This private observer supplies no fitted geometry or chart-classification shortcut.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positional weld, tolerance, source repair, artificial cap, largest-component selection, source normal or consumer triangle transfer is used. Coincident sheet occurrences, lower-dimensional contacts and flat faces survive with explicit plane-stratum ownership.
 * @evidence contracts/common.md#meaningful-documentation States inclusive candidate completeness, immutable lifetime, private address boundary, explicit alias policy, symbolic clipping, source rank, plane ownership and unclassified topology. Ports require actual segment support; broad endpoint stars cannot silently prove their ownership.
 * @evidence contracts/performance.md#efficient-algorithms Preparation uses O(V+T) fixed-width binary64 integer operations and storage. For A candidate faces, clipping emits at most five corners per triangle; components, parity, multigraph links and boundary walks cost expected O(A alpha(A)) plus deterministic sorting and port support traversal. BigInt operands have a fixed bound from binary64 encoding. Candidate completeness is not checked by an additional full-source scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Source addresses, exact alias equality, triangle rank and duplicate occurrence detection are prepared once. Query roots, edge occurrences and vertex links are reused for topology, contacts and port ownership without recomputing geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation retains immutable source references and per-face metadata until its caller releases the closure. Temporary integer coordinates are cleared after rank admission. Query maps expire on return; the caller owns private cell and incidence records and must not publish them as engine geometry.
 */
export function RecoveryEventRegion(source: Source): (query: Query) => Result {
  const prepared: ReturnType<typeof RecoveryEventRegionSource> =
    RecoveryEventRegionSource(source);
  return (query: Query): Result => {
    const work: ReturnType<typeof RecoveryEventRegionCells> =
      RecoveryEventRegionCells(source, prepared, query);
    const topology: ReturnType<typeof RecoveryEventRegionTopology> =
      RecoveryEventRegionTopology(source, prepared, work);
    return RecoveryEventRegionPorts(source, prepared, work, topology, query);
  };
}

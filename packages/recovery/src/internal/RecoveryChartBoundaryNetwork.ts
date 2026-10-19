import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import { RecoveryChartBoundaryNetworkAugment } from "./RecoveryChartBoundaryNetworkAugment";
import { RecoveryChartBoundaryNetworkBindings } from "./RecoveryChartBoundaryNetworkBindings";
import { RecoveryChartBoundaryNetworkRegistry } from "./RecoveryChartBoundaryNetworkRegistry";

/**
 * Reconcile private quarter cuts before fitting shared maximal boundary arcs.
 * Physical keys, base-edge ancestry and exact numeric fractions declare sharing;
 * equal positions alone never identify a bank. Inputs remain immutable. Missing
 * base-edge banks are diagnosed without fabricated connections. Ambiguous keys,
 * collapsed observations, invalid incidence or nonrepresentable phases throw.
 * Canonical insertions can change existing binary64 points slightly; diagnostics
 * retain maximum point displacement and actual per-chart source-area changes.
 * This is observation subdivision, not engine geometry or a PL equality proof.
 *
 * Original quarter corners, graph branches and changes of incident chart sets
 * split the physical boundary graph into open arcs. Closed and junction-return
 * chains receive stable-key anchors at existing observations, preserving every
 * edge and introducing no point or shortcut. Each canonical arc invokes
 * owner.get once; reversed banks reuse its coefficients and registration. A side
 * composite concatenates these arcs under physical-polyline-length proportions.
 * Its synthetic identity serves mapping only; assembly must use pieces authority.
 * Source words, triangles and original normals remain private to this operation.
 *
 * @evidence contracts/common.md#principled-implementation Declared base-edge fractions define one insertion authority. Conforming incident-triangle splits preserve the same PL construction before binary64 displacement, and maximal physical graph arcs provide complete shared fitting words and accepted phase maps.
 * @evidence contracts/common.md#clear-and-simple-design One private pass reconciles bank subdivisions, segments common arcs and returns side composites plus actual oriented arc bindings; physical source observation never becomes generation input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity weld, invented connection, epsilon phase merge, source-normal publication, person-specific control or separately refitted partial bank creates authority.
 * @evidence contracts/common.md#meaningful-documentation States private units and identities, canonical insertion changes, missing-bank diagnostics, exact-path fitting, composite purpose, immutable input and explicit unsupported arithmetic.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles, B boundary uses and U requested cuts, initial indexing costs O(V+T+B+U). Current side-chain searches cost O(U*B) in the worst case; triangle incidence updates are constant work per split. Arc traversal is O(B), sorting adds O((B+U) log(B+U)), and owner fitting has its separately declared cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical point serves each declared base fraction, edge incidence reuses triangle ownership across splits, and one accepted arc fit supplies every forward or reversed side occurrence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All cloned private observations and graph registries are call-local and scale with actual vertices, triangles, cuts and boundary uses. No hidden cap is imposed; caller chart budgets must bound them. Failure releases local state but owner may retain earlier completed fits; returned private arrays belong to the caller.
 */
export function RecoveryChartBoundaryNetwork(input: {
  /** Private chart occurrences with original quarter insertion provenance. */
  charts: readonly {
    name: string;
    verticesMm: readonly C.Vector[];
    triangles: readonly (readonly [number, number, number])[];
    physicalKeys: readonly string[];
    sides: readonly [number[], number[], number[], number[]];
    insertions: readonly {
      edgeKeys: [string, string];
      fractionFromFirst: number;
      key: string;
      pointMm: C.Vector;
    }[];
  }[];
  /** Shared curve owner under one fixed fitting policy. */
  owner: ReturnType<typeof RecoveryChartBoundary>;
}): {
  /** Augmented private meshes and composite sides with real shared arc pieces. */
  charts: {
    name: string;
    verticesMm: C.Vector[];
    triangles: [number, number, number][];
    physicalKeys: string[];
    sides: [number[], number[], number[], number[]];
    boundaries: (ReturnType<ReturnType<typeof RecoveryChartBoundary>["get"]> & {
      pieces: {
        start: number;
        end: number;
        knots: number[];
        boundary: ReturnType<ReturnType<typeof RecoveryChartBoundary>["get"]>;
      }[];
    })[];
  }[];
  /** Measured binary64 changes and unrepresented base-edge bank reasons. */
  diagnostics: string[];
  /** Largest measured point displacement against supplied or prior private-bank PL correspondences, millimetres; not a continuous original-source bound. */
  maximumPointChangeMm: number;
} {
  if (
    !input ||
    !Array.isArray(input.charts) ||
    !input.owner ||
    typeof input.owner.get !== "function"
  )
    throw new Error("Private charts and one boundary owner are required");
  const context: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry> =
    RecoveryChartBoundaryNetworkRegistry(input);
  context.maximumPointChange = RecoveryChartBoundaryNetworkAugment(
    input,
    context,
  );
  return RecoveryChartBoundaryNetworkBindings(input, context);
}

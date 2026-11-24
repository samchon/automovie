import { FamilyConicCaptureCatalog as Catalog } from "./FamilyConicCaptureCatalog";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicMeshIndexTopology } from "./FamilyConicMeshIndexTopology";
import { FamilyConicMeshTopology } from "./FamilyConicMeshTopology";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { FamilyConicSourcePreparation as Preparation } from "./FamilyConicSourcePreparation";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanF1 as F1, AutoMovieHumanF1Armscye as Armscye, AutoMovieHumanF1Placement as Placement, AutoMovieHumanNail } from "@automovie/human";
import type {
  IAutoMovieConstructionDiagnostic,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieSolidBody,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/** One case lifetime shares actual geometry, display curves and cameras across both captures. */
export namespace FamilyConicCaptureContext {
  /**
   * Existing engine mesh, including its actual owners and material coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation NonNullable imports the actual engine realization mesh including owner coordinates and metre positions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The engine remains the sole mesh schema owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No parallel mesh or missing-mesh stand-in is declared.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names the imported actual realization mesh.
   */
  export type IMesh = NonNullable<
    ReturnType<typeof realizeAutoMovieConstruction>["mesh"]
  >;
  /**
   * Shared close-zone framing, recorded by Figure before Deviation consumes it.
   *
   * @evidence contracts/development/design.md#principled-representation A named immutable-reference ROI holds metre points and explicit camera directions; twin reflects world z only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Figure records this shared ROI and Deviation consumes it unchanged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ROI is display framing and does not assign clinical laterality.
   * @evidence contracts/development/common.md#meaningful-documentation Members state fixed reference points and shared views.
   */
  export interface IZone {
    /** Physical display ROI identity; twin is the opposite world-z half. */
    id: string;

    /** Immutable-reference ROI points in metres, reused by every case and pass. */
    points: N.Point[];

    /** Explicit directions shared by Figure and Deviation for this ROI. */
    views: string[];
  }
  /**
   * Case-scoped evaluated state; it never retains a collection of realized cases.
   *
   * @evidence contracts/development/design.md#principled-representation One admitted case owns one mesh, raw/original catalogs, read-only reference, camera records and scalar frame evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both callable consumers borrow engine/Human/render types in this shared case lifetime.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No collection of realized cases or PNG cache exists; timing snapshots and diagnostics are not acceptance.
   * @evidence contracts/development/common.md#meaningful-documentation Members state geometry units, exact provenance, shared camera/ROI scope and lifetime.
   */
  export interface IContext {
    /** Admitted exact producer record and checked source/preflight provenance. */
    input: Input.IInput;

    /** Same prepared originals saved before whole-tree realization. */
    source: Source.IState;

    /** Exact saved original-control evidence, surviving downstream failure. */
    originalEvidence: Input.IFile;

    /** One UTC capture timestamp used by both output directories. */
    round: string;

    /** The one actual native realization, with its owner coordinates. */
    mesh: IMesh;

    /** One same-mesh topology/component report; query time excludes generationMs. */
    meshTopology: ReturnType<typeof FamilyConicMeshTopology>;

    /** Display triangles copied from that same realization, in metres. */
    pieces: IAutoMovieHumanF1.IPiece[];

    /** All actual engine realization diagnostics; absence of a mesh still fails. */
    diagnostics: string[];

    /** One evaluated native-source/operator display catalog shared by all passes. */
    catalog: Catalog.IResult;

    /** Read-only private reference loaded after generated geometry. */
    reference: R.ISource;

    /** Unmodified reference triangles converted once from mm to display metres. */
    referenceMeshes: N.Mesh[];

    /** Exact private source identities used only as comparison provenance. */
    referenceHashes: Input.IFile[];

    /** Assembly, construction and realization wall time in milliseconds. */
    generationMs: number;

    /** Actual bounded source-display sampling time in milliseconds. */
    catalogMs: number;

    /** Process memory snapshots at three named boundaries; these are not a peak estimate. */
    memory: {
      before: NodeJS.MemoryUsage;
      afterMesh: NodeJS.MemoryUsage;
      afterCatalog: NodeJS.MemoryUsage;
    };

    /** Complete reference-fitted frames shared across passes and both consumers. */
    cameras: Map<string, N.Camera>;

    /** Figure-selected physical ROIs and views consumed unchanged by Deviation. */
    zones: IZone[];

    /** Actual original-evidence, Figure and Deviation output directories populated by their consumers. */
    outputs: Record<string, string>;

    /** Per-frame scalar raster work and identities, never retained PNG bytes. */
    frames: (N.Frame & { directory: string })[];
  }

  /** The ordinary figure check owns its case data without native input provenance. */
  export interface IOrdinary extends Pick<IContext, "mesh" | "pieces" | "diagnostics" | "catalog" | "reference" | "referenceMeshes" | "round" | "generationMs" | "cameras" | "zones" | "outputs"> {
    /** The ordinary production path is the case's identity. */
    ordinary: true;
    /** Repository root containing this case's reference files. */
    root: string;
    /** Directory holding the ordinary Figure and nail evidence. */
    out: string;
    /** Original source guides from the same placed assembly. */
    originals: IContext["source"]["originals"];
    /** The canonical nail set used to build this mesh. */
    nails: IAutoMovieHumanF1.IConstructionWithNails["nails"];
    /** Actual retained branch and attachment operators from this ordinary realization. */
    operators: ReturnType<typeof OperatorEvidence.inspect>;
    /** Scalar same-tree evidence and the candidate's source checks. */
    comparison: {
      contactPremises: readonly IAutoMovieHumanF1.IContactPremise[];
      isolatedArmscye: ReturnType<typeof OperatorEvidence.isolateArmscye>;
      bare: IReceipt;
      production: IReceipt;
      addedDiagnostics: IReceipt["diagnostics"];
      vertexDelta: number | null;
      sources: IOrdinaryNailSource[];
      findings: string[];
    };
  }

  /** One authored digit's emitted source observations, with its held reflection. */
  interface IOrdinaryNailSource {
    /** Exact identity of the authored source leaf. */
    name: string;
    /** Distal segment that carries the fitted frame. */
    segment: string;
    /** Placed segment frame in figure-world mm. */
    frame: IAutoMovieHumanSegmentFrame | undefined;
    /** Original cap record inspected before any merge can keep the leaf. */
    cap: IAutoMovieHumanConicLoft.ITip | null | undefined;
    /** Emitted cap-axis endpoint, figure-world mm. */
    pole: N.Point | null;
    /** Final station on the emitted source itself, mm. */
    emittedPoleStation: number | null;
    /** Whether the emitted source declares a distal pole. */
    closed: boolean;
    /** Whether fit and emission share the same placed axis and unsampled scalar fields. */
    sharedOriginal: boolean;
    /** Emitted pole projected on its placed distal axis, mm. */
    expectedTip: number | null;
    /** Tip projection during the fit, mm. */
    fittedTip: number;
    /** Count of that exact bed on its authored source. */
    bedInstances: number;
    /** Count of its reflected bed on the opposite source. */
    twinBeds: number;
    /** Whether the twin's stored bed is the complete declared reflection. */
    exactReflection: boolean;
    /** Largest clipping over the fitted bed and close strip, mm. */
    clipped: number;
    /** The selected net and grid address of that clipping. */
    clippedIn: IAutoMovieHumanF1Nails.IMade["nail"]["readings"]["clippedIn"];
    /** The existing clipping contract's diagnostic when the source exceeds its bound. */
    clipFinding: string | null;
  }

  /** Both explicit capture paths share scene, stage and camera inputs. */
  export type Scene = IContext | IOrdinary;

  interface IReceipt {
    vertices: number | null;
    triangles: number | null;
    diagnostics: (IAutoMovieConstructionDiagnostic & { stage: "realization" })[];
    /** The ordinary production skin's exact-index census, or that observation's refusal. */
    indexTopology?: ReturnType<typeof FamilyConicMeshIndexTopology> | { error: string };
  }

  function receipt(real: ReturnType<typeof realizeAutoMovieConstruction>): IReceipt {
    return {
      vertices: real.mesh === null ? null : real.mesh.positions.length / 3,
      triangles: real.mesh === null ? null : real.mesh.indices.length / 3,
      diagnostics: real.diagnostics.map((diagnostic: IAutoMovieConstructionDiagnostic) => ({ stage: "realization", ...diagnostic })),
    };
  }

  /** The no-nail result does not retain its mesh, surfaces or source bank. */
  function bareReceipt(assembly: IAutoMovieHumanF1.IAssembly): IReceipt {
    const declared: IAutoMovieHumanF1.IConstruction = F1.constructionBareFrom(assembly);
    return receipt(realizeAutoMovieConstruction(
      { name: "f1.body", root: declared.root, fills: declared.fills },
      { chord: 0.001, sources: declared.sources, loopSources: declared.loopSources() },
    ));
  }


  /** Registered trunk and arm names needed to select the isolated armscye. */
  interface IOrdinaryBodyNames {
    /** The two face identities from this declaration's placed body. */
    body: {
      /** Name of the original trunk source. */
      trunk: Pick<IAutoMovieHumanF1.IBody["trunk"], "name">;
      /** Name of the authored arm source. */
      arm: Pick<IAutoMovieHumanF1.IBody["arm"], "name">;
    };
  }

  /** Retained ordinary Figure operators, observed on the same engine result as its owner captures. */
  export namespace OperatorEvidence {
    type Face = IAutoMovieSolidBody.IPublished["faces"][number];
    type End = "start" | "end";

    function walk(node: IAutoMovieConstructionNode, read: (node: IAutoMovieConstructionNode) => void): void {
      read(node);
      if ("host" in node) walk(node.host, read);
      if ("part" in node) walk(node.part, read);
      if (node.type === "split") node.children.forEach((child): void => walk(child.part, read));
    }

    /** Read only indexed owner IDs used by final triangles, including minority corners. */
    function indexedOwners(
      mesh: Pick<IMesh, "indices" | "coordinates" | "owners">,
      armVertices: ReadonlyMap<string, number[]> = new Map(),
    ): Map<string, number> {
      const counts: Map<string, number> = new Map();
      const seen: Uint8Array = new Uint8Array(mesh.coordinates.length / 3);
      for (const vertex of mesh.indices) {
        if (!Number.isInteger(vertex) || vertex < 0 || vertex >= seen.length)
          throw new Error("The realized figure has an invalid owner vertex index");
        if (seen[vertex] !== 0) continue;
        seen[vertex] = 1;
        const owner: string | undefined = mesh.owners[mesh.coordinates[3 * vertex]!];
        if (owner === undefined) throw new Error("The realized figure has an invalid face owner");
        counts.set(owner, (counts.get(owner) ?? 0) + 1);
        armVertices.get(owner)?.push(vertex);
      }
      return counts;
    }

    /** Exact undirected edges in a published retained boundary, in its one shared point ID space. */
    function edges(face: Face | undefined, end: End): Set<string> {
      const result: Set<string> = new Set();
      for (const cycle of face?.cycles ?? []) {
        if (cycle.kind !== end) continue;
        cycle.points.forEach((a: number, i: number): void => {
          const b: number = cycle.points[(i + 1) % cycle.points.length]!;
          if (a !== b) result.add(a < b ? a + ":" + b : b + ":" + a);
        });
      }
      return result;
    }

    /** Match a band to the host ring, its siblings at a fork, and its own child's retained rail. */
    function band(
      faces: ReadonlyMap<string, Face>,
      counts: ReadonlyMap<string, number>,
      name: string,
      host: string,
      hostEnd: End,
      part: string,
      siblings: readonly string[],
    ) {
      const start: Set<string> = edges(faces.get(name), "start");
      const end: Set<string> = edges(faces.get(name), "end");
      const hostEdges: Set<string> = edges(faces.get(host), hostEnd);
      const seamEdges: Set<string> = new Set(siblings.flatMap((sibling: string): string[] => [...edges(faces.get(sibling), "start")]));
      const partEdges: Set<string> = edges(faces.get(part), "start");
      const atHost: number = [...start].filter((edge: string): boolean => hostEdges.has(edge)).length;
      const atSeams: number = [...start].filter((edge: string): boolean => seamEdges.has(edge)).length;
      const missingStart: number = [...start].filter((edge: string): boolean => !hostEdges.has(edge) && !seamEdges.has(edge)).length;
      const missingRail: number = [...end].filter((edge: string): boolean => !partEdges.has(edge)).length;
      const vertices: number = counts.get(name) ?? 0;
      return {
        name, part, vertices, startEdges: start.size, railEdges: end.size,
        atHost, atSeams, missingStart, missingRail,
        retained: vertices > 0 && start.size >= 3 && end.size >= 3 &&
          atHost > 0 && (siblings.length === 0 || atSeams > 0) && missingStart === 0 && missingRail === 0,
      };
    }

    /**
     * Audit the final arm's owned vertices against its actual soft landing edge.
     * Published shared IDs establish the seam. Unique exact owner/chart tuples identify its raw mesh indices.
     * A single strictly winding start cycle has one chart crossing and keeps increasing station at each phase.
     */
    function armLanding(
      real: Pick<IAutoMovieConstructionRealization.IRealization, "body"> & { mesh: Pick<IMesh, "coordinates"> },
      name: string,
      arm: string,
      partRail: Pick<IAutoMovieConstructionRealization.IJoin["blend"]["part"], "kind" | "chart"> | undefined,
      vertices: readonly number[],
    ) {
      const unavailable = (detail: string) => ({ kind: "unavailable" as const, detail });
      if (partRail?.kind !== "start")
        return unavailable("the actual blend does not expose a distal part rail");
      const armFaces = real.body.faces.filter((face): boolean => face.chain === arm);
      const bandFaces = real.body.faces.filter((face): boolean => face.chain === name);
      if (armFaces.length !== 1 || bandFaces.length !== 1)
        return unavailable("the owning arm or blend face is absent or ambiguous");
      const rail = partRail.chart;
      const starts = armFaces[0]!.cycles.filter((cycle): boolean =>
        cycle.kind === "start" && cycle.chart.length === rail.length &&
        cycle.chart.every(([s, phase], i): boolean => s === rail[i]![0] && phase === rail[i]![1]),
      );
      const ends = bandFaces[0]!.cycles.filter((cycle): boolean => cycle.kind === "end");
      if (starts.length !== 1 || ends.length !== 1 || rail.length < 3)
        return unavailable("the exact paired start/end rail cycles are absent or ambiguous");
      const ids = starts[0]!.points;
      if (ids.length !== rail.length || ids.length !== ends[0]!.points.length ||
          new Set(ids).size !== rail.length ||
          !ids.every((id, i): boolean => id === ends[0]!.points[i]))
        return unavailable("the two faces do not publish the same ordered seam identifiers");

      const indices: Map<string, number | null> = new Map();
      for (const [i, [s, phase]] of rail.entries()) {
        const point = real.body.points[ids[i]!];
        const key = JSON.stringify([s, phase]);
        if (point?.chain !== arm || point.chart[0] !== s || point.chart[1] !== phase ||
            !Number.isFinite(s) || !Number.isFinite(phase) || indices.has(key))
          return unavailable("a seam point lacks one exact arm-owner chart address");
        indices.set(key, null);
      }

      // Match the engine's shortest directed edge on the query's phase cover.
      const period = 2 * Math.PI;
      const edges = rail.map(([s, phase], i) => {
        const next = rail[(i + 1) % rail.length]!;
        const turns = Math.round((phase - next[1]) / period);
        const finish = next[1] + turns * period;
        return { s, phase, next, turns, delta: finish - phase, centre: (phase + finish) / 2 };
      });
      const winding = edges.reduce((sum, edge): number => sum + edge.turns, 0);
      if (Math.abs(winding) !== 1 ||
          edges.some((edge): boolean => !(winding * edge.delta > 0) || Math.abs(edge.delta) >= Math.PI))
        return unavailable("the retained start edge is not a single monotone periodic chart graph");

      let negative = 0;
      let worst: { vertex: number; stationMm: number; phase: number; marginMm: number } | null = null;
      for (const vertex of vertices) {
        const stationMm = real.mesh.coordinates[3 * vertex + 1]!;
        const phase = real.mesh.coordinates[3 * vertex + 2]!;
        if (!Number.isFinite(stationMm) || !Number.isFinite(phase))
          return unavailable("an indexed arm vertex has no finite chart address");
        const key = JSON.stringify([stationMm, phase]);
        let marginMm = 0;
        if (indices.has(key)) {
          if (indices.get(key) !== null)
            return unavailable("distinct indexed arm vertices share a seam address");
          indices.set(key, vertex);
        } else {
          let crossing: number | undefined;
          for (const edge of edges) {
            const image = -Math.round((edge.centre - phase) / period);
            const from = edge.phase + image * period;
            const to = edge.next[1] + (edge.turns + image) * period;
            if ((from > phase) === (to > phase)) continue;
            if (crossing !== undefined)
              return unavailable("an indexed arm phase has more than one retained seam crossing");
            crossing = edge.s + ((phase - from) * (edge.next[0] - edge.s)) / (to - from);
          }
          if (crossing === undefined || !Number.isFinite(crossing))
            return unavailable("an indexed arm phase has no finite retained seam crossing");
          marginMm = stationMm - crossing;
        }
        if (marginMm < 0) negative += 1;
        if (worst === null || marginMm < worst.marginMm) worst = { vertex, stationMm, phase, marginMm };
      }
      if (worst === null || [...indices.values()].some((vertex): boolean => vertex === null))
        return unavailable("some published rail vertices are not retained by indexed arm triangles");
      return { kind: "measured" as const, columns: rail.length, checked: vertices.length, negative, worst };
    }

    /** A single authored trunk/arm merge, using the exact production source leaves and cached contact. */
    export function isolateArmscye(
      assembly: IOrdinaryBodyNames,
      declaration: Pick<IAutoMovieHumanF1.IConstructionWithNails, "root" | "sources" | "loopSources">,
      premises: readonly IAutoMovieHumanF1.IContactPremise[],
    ) {
      const host = assembly.body.trunk.name;
      const arm = assembly.body.arm.name;
      const name = "armscye." + arm;
      const definition = { name, host, arm, scope: "authored isolated merge on ordinary production sources" };
      const unavailable = (detail: string) => ({
        ...definition, kind: "unavailable" as const, detail,
        findings: [name + " isolated merge unavailable: " + detail],
      });
      const contact = premises.filter((row): boolean => row.name === name && row.hostFace === host && row.partFace === arm);
      if (contact.length !== 1)
        return unavailable("the original authored armscye contact is absent or ambiguous");
      const premise = contact[0]!;
      if (premise.kind === "refused") return unavailable(premise.detail);
      try {
        const joins: Extract<IAutoMovieConstructionNode, { type: "join" }>[] = [];
        walk(declaration.root, (node): void => {
          if (node.type === "join" && node.kind === "merge" && node.name === name) joins.push(node);
        });
        if (joins.length !== 1)
          return unavailable("the original authored armscye node is absent or ambiguous");
        const node = joins[0]!;
        const leaf = (root: IAutoMovieConstructionNode, face: string) => {
          const found: Extract<IAutoMovieConstructionNode, { type: "source" }>[] = [];
          walk(root, (candidate): void => {
            if (candidate.type === "source" && candidate.source === face && candidate.name === face)
              found.push(candidate);
          });
          return found.length === 1 ? found[0] : undefined;
        };
        const hostLeaf = leaf(node.host, host);
        const partLeaf = leaf(node.part, arm);
        if (hostLeaf === undefined || partLeaf === undefined)
          return unavailable("the actual source leaves are absent or ambiguous");
        const isolated = { ...node, host: hostLeaf, part: partLeaf };
        if (isolated.seed.type !== "point" || isolated.seed.hostFace !== host ||
            isolated.seed.partFace !== arm || isolated.loop === undefined)
          return unavailable("the exact prepared contact does not belong to these source leaves");
        const started = performance.now();
        const real = realizeAutoMovieConstruction(
          { name, root: isolated, fills: [] },
          { chord: 0.001, sources: declaration.sources, loopSources: declaration.loopSources() },
        );
        const vertices: number[] = [];
        const counts = indexedOwners(real.mesh, new Map([[arm, vertices]]));
        const retained = real.joins.filter((join): boolean =>
          join.name === name && join.hostFace === host && join.partFace === arm);
        const blendVertices: number = counts.get(name) ?? 0;
        const landing = armLanding(real, name, arm, retained.length === 1 ? retained[0]!.blend.part : undefined, vertices);
        const findings: string[] = [];
        if (real.diagnostics.length !== 0)
          findings.push(name + " isolated merge reports realization diagnostics");
        if (blendVertices === 0)
          findings.push(name + " isolated blend has no indexed vertices");
        if (landing.kind === "unavailable")
          findings.push(name + " isolated arm landing unavailable: " + landing.detail);
        else {
          if (landing.checked === 0)
            findings.push(name + " isolated arm landing checked no indexed arm vertices");
          if (landing.negative !== 0)
            findings.push(name + " has " + landing.negative + " isolated indexed arm vertices before its retained landing");
        }
        return {
          ...definition,
          kind: "observed" as const,
          milliseconds: performance.now() - started,
          mesh: receipt(real),
          blendVertices,
          landing,
          findings,
        };
      } catch (error: unknown) {
        return unavailable(error instanceof Error ? error.message : String(error));
      }
    }

    /**
     * Observe named merged faces, wrist bands and composed child bands on the production mesh.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Uses the actual admitted join records, the published body shared-point cycles and indexed coordinates from one realization.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires declared scope, actual retained boundaries and positive indices. Coordinate proximity, a face-table entry or identical diagnostics cannot substitute for operator retention.
     * @evidence contracts/development/implementation.md#efficient-algorithms One indexed owner census, one declaration walk and bounded observed boundary comparisons on the same mesh.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and nail captures still borrow the same result and keep only operator observations.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only flat data and counts survive. Temporary ID sets, declarations, owner readers and body records do not enter the receipt.
     * @evidence contracts/development/common.md#meaningful-documentation Names the named geometry admitted, the necessary ID and material predicates, and the one-result lifetime.
     */
    export function inspect(
      assembly: Pick<IAutoMovieHumanF1.IAssembly, "body" | "digits">,
      root: IAutoMovieConstructionNode,
      real: IAutoMovieConstructionRealization.IRealization,
    ) {
      const declarations: Map<string, IAutoMovieConstructionNode> = new Map();
      walk(root, (node): void => { declarations.set(node.name, node); });
      const faces: Map<string, Face> = new Map<string, Face>(real.body.faces.map((face: Face) => [face.chain, face]));
      const arm = assembly.body.arm.name;
      const armVertices: Map<string, number[]> = new Map([[arm, []], [arm + ".mirror", []]]);
      const counts: Map<string, number> = indexedOwners(real.mesh, armVertices);
      const armLandings: { name: string; owner: string; observation: ReturnType<typeof armLanding> }[] = [];
      const failures: string[] = [];
      const joins: {
        name: string; host: string; part: string; declared: boolean; vertices: number;
        hostColumns: number; partColumns: number; retained: boolean;
      }[] = [];
      const bands: {
        name: string; host: string; kind: "compose" | "continuation"; declared: boolean;
        retained: boolean; children: ReturnType<typeof band>[];
      }[] = [];
      const fingers: IAutoMovieHumanF1.IDigit[] = assembly.digits.filter((digit) => digit.limb === "arm" && digit.knuckle);
      const toes: IAutoMovieHumanF1.IDigit[] = assembly.digits.filter((digit) => digit.limb === "leg" && digit.knuckle);
      const thumbs: IAutoMovieHumanF1.IDigit[] = assembly.digits.filter((digit) => digit.limb === "arm" && !digit.knuckle);
      if (fingers.length !== 4 || toes.length !== 5 || thumbs.length !== 1)
        throw new Error("The ordinary operator census requires four fingers, five toes and one thumb on the authored side");

      const merge = (name: string, host: string, part: string): void => {
        const node: IAutoMovieConstructionNode | undefined = declarations.get(name);
        const declared: boolean = node?.type === "join" && node.kind === "merge" &&
          node.loop !== undefined && node.seed.hostFace === host && node.seed.partFace === part;
        const actual = real.joins.find((join) => join.name === name && join.hostFace === host && join.partFace === part);
        const vertices: number = counts.get(name) ?? 0;
        const hostColumns: number = actual?.blend.host.chart.length ?? 0;
        const partColumns: number = actual?.blend.part.chart.length ?? 0;
        const retained: boolean = declared && faces.has(name) && vertices > 0 &&
          node?.type === "join" && hostColumns === node.count && partColumns === node.count;
        joins.push({ name, host, part, declared, vertices, hostColumns, partColumns, retained });
        if (!retained) failures.push(name + " did not retain its declared shared merge and indexed skin");
      };

      const end = (name: string, host: string, hostEnd: End, parts: readonly string[], composed: boolean): void => {
        const node: IAutoMovieConstructionNode | undefined = declarations.get(name);
        const children: string[] = parts.map((part: string): string => composed ? "band." + part : name);
        const hostSide: "bottom" | "top" = hostEnd === "start" ? "bottom" : "top";
        const declared: boolean = composed
          ? node?.type === "split" && node.compose !== undefined && node.hostFace === host &&
            node.hostEnd === hostSide && node.children.length === parts.length &&
            parts.every((part: string, i: number): boolean =>
              node.children.some((child): boolean => child.partFace === part &&
                child.partEnd === "bottom" && child.band === children[i]))
          : node?.type === "continue" && node.band !== undefined && node.hostFace === host &&
            node.hostEnd === hostSide && node.partFace === parts[0] && node.partEnd === "bottom";
        const rows = parts.map((part: string, i: number) =>
          band(faces, counts, children[i]!, host, hostEnd, part,
            children.filter((_: string, j: number): boolean => j !== i)));
        const retained: boolean = declared && rows.every((row): boolean => row.retained);
        bands.push({ name, host, kind: composed ? "compose" : "continuation", declared, retained, children: rows });
        if (!retained) failures.push(name + " did not retain its declared bands, shared cycles and indexed skin");
      };

      const body: IAutoMovieHumanF1.IBody = assembly.body;
      const trunk: string = body.trunk.name;
      for (const side of ["", ".mirror"]) {
        const arm: string = body.arm.name + side;
        const hand: string = body.hand.name + side;
        const leg: string = body.leg.name + side;
        const breast: string = body.breast.name + side;
        const plate: string = body.ear.name + side;
        const thumb: string = thumbs[0]!.family.name + side;
        const armscye = "armscye." + arm;
        merge(armscye, trunk, arm);
        const actualArm = real.joins.filter((join): boolean =>
          join.name === armscye && join.hostFace === trunk && join.partFace === arm);
        const observation = armLanding(
          real, armscye, arm, actualArm.length === 1 ? actualArm[0]!.blend.part : undefined, armVertices.get(arm)!,
        );
        armLandings.push({ name: armscye, owner: arm, observation });
        if (observation.kind === "unavailable")
          failures.push(armscye + " retained arm landing unavailable: " + observation.detail);
        else if (observation.negative !== 0)
          failures.push(armscye + " has " + observation.negative + " indexed arm vertices before its retained landing");
        merge("mammary." + breast, trunk, breast);
        merge("root." + plate, trunk, plate);
        merge("web." + thumb, hand, thumb);
        end("wrist." + arm, arm, "end", [hand], false);
        end("fan." + hand, hand, "end", fingers.map((digit) => digit.family.name + side), true);
        end("fan." + leg, leg, "end", toes.map((digit) => digit.family.name + side), true);
      }
      end("crotch", trunk, "start", [body.leg.name, body.leg.name + ".mirror"], true);
      return { joins, bands, armLandings, failures };
    }

    /** Check the wrist and arm readers with exact shared rails, a proximal arm vertex, and missing ownership. */
    export function check() {
      const cycle = (kind: End, points: number[]): Face["cycles"][number] => ({
        kind, points, chart: [[0, 0], [0, 1], [0, 2]],
      });
      const host: Face = { chain: "arm", cycles: [cycle("end", [0, 1, 2])] };
      const wrist: Face = { chain: "wrist.arm", cycles: [
        cycle("start", [2, 1, 0]), cycle("end", [3, 4, 5]),
      ] };
      const part: Face = { chain: "hand", cycles: [cycle("start", [5, 4, 3])] };
      const owners: Map<string, number> = indexedOwners({
        indices: [0, 1, 2], owners: [wrist.chain, part.chain],
        coordinates: [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
      });
      const exact: Map<string, Face> = new Map<string, Face>([host, wrist, part].map((face: Face) => [face.chain, face]));
      const observe = (): ReturnType<typeof band> => band(exact, owners, wrist.chain, host.chain, "end", part.chain, []);
      const shared = observe();

      // Separate indices can address the same three points of the same hand chart.
      exact.set(part.chain, { ...part, cycles: [cycle("start", [8, 7, 6])] });
      const coincident = observe();
      exact.delete(wrist.chain);
      const missing = observe();
      if (!shared.retained || shared.vertices !== 1 || shared.atHost !== 3 ||
        coincident.retained || coincident.missingRail !== 3 || missing.retained || missing.startEdges !== 0)
        throw new Error("The retained operator fixture did not distinguish shared, coincident and absent wrist bands");
      // The arm and blend share one ring. Publication deliberately numbers
      // that ring differently from the mesh. At phase pi/3 its first edge is
      // halfway from 10 to 12 mm, so the interior sample has margin +2 or -1.
      const name: string = "armscye.arm";
      const arm: string = host.chain;
      const phase: number = Math.PI / 3;
      const chart: [number, number][] = [[10, 0], [12, 2 * phase], [11, 4 * phase]];
      const ids: number[] = [2, 0, 1];
      const body: IAutoMovieSolidBody.IPublished = {
        name,
        points: [chart[1]!, chart[2]!, chart[0]!].map((address) => ({ chain: arm, chart: address })),
        faces: [
          { chain: arm, cycles: [{ kind: "start", points: ids, chart }] },
          { chain: name, cycles: [{ kind: "end", points: ids, chart: [[1, 0], [1, 2 * phase], [1, 4 * phase]] }] },
        ],
      };
      const mesh: Pick<IMesh, "indices" | "owners" | "coordinates"> = {
        indices: [0, 1, 3, 1, 2, 3, 2, 0, 3, 1, 0, 4, 2, 1, 4, 0, 2, 4],
        owners: [arm, name],
        coordinates: [0, 10, 0, 0, 12, 2 * phase, 0, 11, 4 * phase, 0, 13, phase, 1, 0, phase],
      };
      const readLanding = (): ReturnType<typeof armLanding> => {
        const vertices: number[] = [];
        indexedOwners(mesh, new Map([[arm, vertices]]));
        return armLanding({ body, mesh }, name, arm, { kind: "start", chart }, vertices);
      };
      const retained = readLanding();
      mesh.coordinates[10] = 10;
      const proximal = readLanding();
      mesh.coordinates[10] = 13;
      mesh.coordinates[0] = 1;
      const missingOwner = readLanding();
      mesh.indices = [];
      const empty = readLanding();
      if (retained.kind !== "measured" || retained.columns !== 3 || retained.checked !== 4 ||
          retained.negative !== 0 || retained.worst.marginMm !== 0 ||
          proximal.kind !== "measured" || proximal.checked !== 4 || proximal.negative !== 1 ||
          proximal.worst.vertex !== 3 || proximal.worst.marginMm !== -1 ||
          missingOwner.kind !== "unavailable" || empty.kind !== "unavailable")
        throw new Error("The retained arm landing fixture did not distinguish distal, proximal and unowned indexed skin");
      return { shared, coincident, missing, armscye: { retained, proximal, missingOwner, empty } };
    }
  }

  /** Compact observations retained when a later ordinary figure stage refuses. */
  export type IOrdinaryObservation = Partial<
    Pick<IOrdinary["comparison"], "sources" | "contactPremises" | "isolatedArmscye" | "bare" | "production"> & Pick<IOrdinary, "operators"> & { sourceFindings: readonly string[] }
  >;


  /** Named source and contact observations from one prepared ordinary declaration. */
  interface IOrdinaryPreparation {
    sources: IOrdinary["comparison"]["sources"];
    sourceFindings: readonly string[];
    contactPremises: IOrdinary["comparison"]["contactPremises"];
    isolatedArmscye: IOrdinary["comparison"]["isolatedArmscye"];
    isolatedMs: number;
  }

  /**
   * Preserve the checked source rows before asking whether the same declaration can reach a body mesh.
   * The source, attachment, and isolated armscye results are observed in their production order.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads fitted nails and their emitted source leaves before the named contact gate, then applies the existing isolated merge and joint refusal rules.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The returned rows serve the normal comparison, and the callback keeps the same source observations when preparation refuses.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The declared source map is read directly; source findings supply no mesh or acceptance substitute.
   * @evidence contracts/development/common.md#meaningful-documentation Separates observations of the original bed and emitted pole from retained-figure claims.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each actual nail source and its twin are read once, before the existing bounded contact preparation and isolated merge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same observed rows enter the ordinary comparison and its early refusal receipt.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rows carry observations only. The existing declaration owns the source and realizations.
   */
  export function observeOrdinaryPreparation(
    assembly: Pick<IAutoMovieHumanF1.IAssembly, "digits" | "frames"> & IOrdinaryBodyNames,
    declared: Pick<IAutoMovieHumanF1.IConstructionWithNails, "root" | "sources" | "nails" | "contactPremises" | "loopSources">,
    observe: (observation: IOrdinaryObservation) => void,
  ): IOrdinaryPreparation {
    const sourceFindings: string[] = [];
    const sources: IOrdinaryNailSource[] = assembly.digits.map((digit, i: number): IOrdinaryNailSource => {
      const made = declared.nails[i];
      if (made?.row.digit !== digit.family.name) throw new Error("The construction changed the order of its fitted nails");
      const name: string = made.row.digit;
      const part = declared.sources.get(name);
      const twin = declared.sources.get(name + ".mirror");
      const cap = digit.family.tips?.[1];
      const frame = assembly.frames.get(made.row.segment);
      const emittedPoleStation: number | null = part?.stations.at(-1) ?? null;
      const pole = emittedPoleStation === null || part === undefined ? null : part.axis.at(emittedPoleStation).origin;
      const distal: N.Point | null = frame === undefined ? null : made.row.hand
        ? frame.axes[1].map((x: number): number => -x) as N.Point : frame.axes[0];
      const expectedTip: number | null = pole === null || distal === null || frame === undefined
        ? null : pole.reduce((sum: number, x: number, k: number): number => sum + (x - frame.origin[k]!) * distal[k]!, 0);
      const original = made.original;
      const sharedOriginal: boolean = part !== undefined &&
        part.name === original.name && part.axis === original.axis &&
        part.front === original.front && part.side === original.side &&
        part.fullness === original.fullness && part.order === original.order &&
        part.pole === original.pole && part.stations[0] === original.stations[0] &&
        part.stations.at(-1) === original.stations.at(-1);
      const bed = made.nail.bed;
      const beds = part?.reliefs?.filter((feature): boolean => feature.name === bed.name) ?? [];
      const mirror = twin?.reliefs?.filter((feature): boolean => feature.name === bed.name + ".mirror") ?? [];
      const opposite = mirror[0];
      const turn: number = bed.phases[1] > 0 ? 2 * Math.PI : 0;
      const exactReflection: boolean = opposite !== undefined &&
        opposite.stations[0] === bed.stations[0] && opposite.stations[1] === bed.stations[1] &&
        opposite.rows === bed.rows && opposite.columns === bed.columns &&
        opposite.phases[0] === turn - bed.phases[1] && opposite.phases[1] === turn - bed.phases[0] &&
        opposite.axis.every((x: number, k: number): boolean => x === bed.axis[k]! * (k === 2 ? -1 : 1)) &&
        opposite.heights.every((x: number, k: number): boolean =>
          x === bed.heights[k - (k % bed.columns) + bed.columns - 1 - (k % bed.columns)]);
      const closed: boolean = part?.pole === "top" || part?.pole === "both";
      const { clipped, clippedIn }: Pick<IAutoMovieHumanF1Nails.IMade["nail"]["readings"], "clipped" | "clippedIn"> = made.nail.readings;
      const clipFinding: string | null = !Number.isFinite(clipped)
        ? name + " has no finite relief clipping measurement"
        : clipped > 0.01 ? name + (clippedIn[0] === 0
          ? " bed clips more than 0.01 mm"
          : " combined receipt does not bound the bed at 0.01 mm")
        : null;
      if (!sharedOriginal) sourceFindings.push(name + " does not emit its fitted original digit source");
      if (
        !closed || emittedPoleStation !== cap?.tip || expectedTip === null ||
        Math.abs(made.nail.readings.tip - expectedTip) > 64 * Number.EPSILON * Math.max(1, Math.abs(expectedTip)) ||
        beds.length !== 1 || beds[0] !== bed || mirror.length !== 1 || !exactReflection
      ) sourceFindings.push(name + " does not preserve its fitted cap and bed through emission");
      return {
        name,
        segment: made.row.segment,
        frame,
        cap,
        pole,
        emittedPoleStation,
        closed,
        sharedOriginal,
        expectedTip,
        fittedTip: made.nail.readings.tip,
        bedInstances: beds.length,
        twinBeds: mirror.length,
        exactReflection,
        clipped,
        clippedIn,
        clipFinding,
      };
    });
    observe({ sources, sourceFindings });

    const contactPremises: IOrdinary["comparison"]["contactPremises"] = declared.contactPremises();
    observe({ contactPremises });
    const isolatedStarted: number = performance.now();
    const isolatedArmscye = OperatorEvidence.isolateArmscye(assembly, declared, contactPremises);
    const isolatedMs: number = performance.now() - isolatedStarted;
    observe({ isolatedArmscye });
    const refused: string[] = contactPremises.flatMap((premise): string[] =>
      premise.kind === "refused" ? [premise.name + ": " + premise.detail] : [],
    );
    if (refused.length !== 0)
      throw new Error("ordinary side-contact premises refused\n" + refused.join("\n"));
    return { sources, sourceFindings, contactPremises, isolatedArmscye, isolatedMs };
  }

  /**
   * Failures publish just the observations reached by the same ordinary attempt.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies each reached observation and represents an unavailable stage as null in the CLI receipt.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The CLI adds its existing viewport control and fatal reason to these fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Partial stage evidence never creates a mesh or claims accepted ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Preserves emitted source rows even when a later stage refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed set of keys borrows already observed rows in constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each field is borrowed from the same attempt without building a second source or reading files.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result retains the observation rows for receipt serialization only.
   */
  export function failedOrdinary(observed: IOrdinaryObservation): {
    [Key in keyof Required<IOrdinaryObservation>]: NonNullable<IOrdinaryObservation[Key]> | null;
  } {
    return {
      sources: observed.sources ?? null,
      sourceFindings: observed.sourceFindings ?? null,
      contactPremises: observed.contactPremises ?? null,
      isolatedArmscye: observed.isolatedArmscye ?? null,
      bare: observed.bare ?? null,
      production: observed.production ?? null,
      operators: observed.operators ?? null,
    };
  }

  /** Realize one ordinary candidate from the named production construction. */
  export async function createOrdinary(
    root: string,
    out: string,
    observe: (observation: IOrdinaryObservation) => void,
  ): Promise<IOrdinary> {
    if (F1.LOOSE.length !== 0) throw new Error("The C figure cannot omit loose families");
    const started: number = performance.now();
    const assembly: IAutoMovieHumanF1.IAssembly = F1.assemble();
    const declared: IAutoMovieHumanF1.IConstructionWithNails = F1.constructionFrom(assembly);
    const { sources, sourceFindings, contactPremises, isolatedArmscye, isolatedMs }: IOrdinaryPreparation =
      observeOrdinaryPreparation(assembly, declared, observe);
    const bare: IReceipt = bareReceipt(assembly);
    observe({ bare });
    const real = realizeAutoMovieConstruction(
      { name: "f1.body", root: declared.root, fills: declared.fills },
      { chord: 0.001, sources: declared.sources, loopSources: declared.loopSources() },
    );
    const mesh: IMesh = real.mesh;
    const indexTopology: NonNullable<IReceipt["indexTopology"]> = (() => {
      try {
        return FamilyConicMeshIndexTopology(mesh);
      } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : String(error) };
      }
    })();
    const production: IReceipt = { ...receipt(real), indexTopology };
    observe({ production });
    const operators: IOrdinary["operators"] = OperatorEvidence.inspect(assembly, declared.root, real);
    observe({ operators });
    const originals: IOrdinary["originals"] = Preparation.originalsOf(assembly, false).originals;
    const diagnostics: string[] = real.diagnostics.map((item: IAutoMovieConstructionDiagnostic): string => item.node + " (" + item.contract + "): " + item.detail);
    const available: Map<string, number> = new Map();
    for (const item of bare.diagnostics) {
      const key: string = JSON.stringify([item.stage, item.node, item.contract, item.detail]);
      available.set(key, (available.get(key) ?? 0) + 1);
    }
    const addedDiagnostics: IReceipt["diagnostics"] = production.diagnostics.filter((item): boolean => {
      const key: string = JSON.stringify([item.stage, item.node, item.contract, item.detail]);
      const count: number = available.get(key) ?? 0;
      if (count === 0) return true;
      available.set(key, count - 1);
      return false;
    });
    const bareVertices: number | null = bare.triangles !== null && bare.triangles > 0 ? bare.vertices : null;
    const productionVertices: number | null = production.triangles !== null && production.triangles > 0 ? production.vertices : null;
    const vertexDelta: number | null = bareVertices === null || productionVertices === null
      ? null
      : productionVertices - bareVertices;
    const findings: string[] = [...isolatedArmscye.findings];
    if (bareVertices === null) findings.push("the same-tree bare control returned no indexed triangles");
    if (productionVertices === null) findings.push("production returned no indexed triangles");
    if (addedDiagnostics.length !== 0) findings.push("production adds realization diagnostics");
    if (vertexDelta !== null && vertexDelta <= 0) findings.push("production has no added bed vertices");
    if ("error" in indexTopology) findings.push("ordinary production index topology refused: " + indexTopology.error);
    else {
      if (indexTopology.usedIndexComponents !== 1)
        findings.push("production has " + indexTopology.usedIndexComponents + " used-index components");
      if (indexTopology.boundaryEdges !== 0 || indexTopology.nonManifoldEdges !== 0)
        findings.push("production has " + indexTopology.boundaryEdges + " raw boundary edges and " +
          indexTopology.nonManifoldEdges + " edges used three or more times");
    }
    findings.push(...sourceFindings);
    const generationMs: number = performance.now() - started - isolatedMs;
    const cutters: string[] = F1.CUTTERS.flatMap((item): string[] => [
      item.family.name, ...(item.mirrored ? [item.family.name + ".mirror"] : []),
    ]);
    const catalog: Catalog.IResult = Catalog.create(declared, real.surfaces, cutters);
    const reference: R.ISource = await R.load(root);
    const referenceMeshes: N.Mesh[] = [reference.body, reference.head].map(
      (part: R.ISource["body"], k: number): N.Mesh => ({
        id: "reference." + k,
        positions: Array.from(part.positions, (x: number): number => x / 1000),
        indices: Array.from(part.indices),
        colour: [0.64, 0.65, 0.67],
      }),
    );
    return {
      ordinary: true, root, out, round: path.basename(out),
      mesh, pieces: [{ name: "body", positions: mesh.positions, indices: mesh.indices, diagnostics }],
      diagnostics, catalog, reference, referenceMeshes, generationMs, originals,
      nails: declared.nails, operators, comparison: { contactPremises, isolatedArmscye, bare, production, addedDiagnostics, vertexDelta, sources, findings },
      cameras: new Map(), zones: [], outputs: {},
    };
  }

  /** The actual reference axillary apex in the shared capture frame, metres. */
  export function fold(): N.Point {
    return Armscye.apex(Placement.frame("thorax")).map((x: number): number => x / 1000) as N.Point;
  }

  /**
   * Realize the same prepared source invocation and share its one resulting mesh.
   * Reference bytes are read only after generated geometry and source curves.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The prepared original assembly enters constructionFrom without another assembly, followed by one realization; owners, deviation and passes borrow its mesh and actual source catalog.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scoped feature selection precedes generation, catalog creation and independent read-only reference loading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No converter, second anatomy law, fallback figure or mesh-derived original curve enters this context; loose-family omissions are refused.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes input resolution, generated diagnostics, native Point0 display and independent reference data.
   * @evidence contracts/development/implementation.md#efficient-algorithms One case retains one mesh/catalog/reference set; display sampling is bounded per source and cases are processed sequentially.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All pass and owner/deviation consumers borrow the same evaluated state without reassembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No global mesh or PNG cache is introduced; the caller releases this case context after both consumers settle.
   */
  export async function create(
    source: Source.IState,
    originalEvidence: Input.IFile,
  ): Promise<IContext> {
    const input: Input.IInput = source.input;
    if (F1.LOOSE.length !== 0)
      throw new Error("Native capture does not omit loose families");
    const before: NodeJS.MemoryUsage = source.memory.before;
    const started: number = performance.now();
    const assembly: IAutoMovieHumanF1.IAssembly = source.assembly;
    const declared: IAutoMovieHumanF1.IConstruction = F1.constructionFrom(assembly);
    const real: ReturnType<typeof realizeAutoMovieConstruction> =
      realizeAutoMovieConstruction(
        { name: "f1.body", root: declared.root, fills: declared.fills },
        { chord: 0.001, sources: declared.sources, loopSources: declared.loopSources() },
      );
    const diagnostics: string[] = real.diagnostics.map(
      (
        item: ReturnType<
          typeof realizeAutoMovieConstruction
        >["diagnostics"][number],
      ): string => item.node + " (" + item.contract + "): " + item.detail,
    );
    if (real.mesh === null)
      throw new Error("Native figure has no mesh: " + diagnostics.join("; "));
    const mesh: IMesh = real.mesh;
    const generationMs: number =
      source.assemblyMs + performance.now() - started;
    const afterMesh: NodeJS.MemoryUsage = process.memoryUsage();
    const meshTopology: IContext["meshTopology"] = FamilyConicMeshTopology(mesh);
    const catalogStarted: number = performance.now();
    const cutters: string[] = F1.CUTTERS.flatMap(
      (item: (typeof F1.CUTTERS)[number]): string[] => [
        item.family.name,
        ...(item.mirrored ? [item.family.name + ".mirror"] : []),
      ],
    );
    const catalog: Catalog.IResult = Catalog.create(
      declared,
      real.surfaces,
      cutters,
    );
    const catalogMs: number = performance.now() - catalogStarted;
    const afterCatalog: NodeJS.MemoryUsage = process.memoryUsage();
    const reference: R.ISource = await R.load(input.root);
    const referenceMeshes: N.Mesh[] = [reference.body, reference.head].map(
      (part: R.ISource["body"], k: number): N.Mesh => ({
        id: "reference." + k,
        positions: Array.from(part.positions, (x: number): number => x / 1000),
        indices: Array.from(part.indices),
        colour: [0.64, 0.65, 0.67],
      }),
    );
    const referenceHashes: Input.IFile[] = [];
    for (const name of ["body-observations.json", "reference-model.json"]) {
      const file: string = path.join(input.root, "test/.shots/f1", name);
      referenceHashes.push({
        file,
        sha256: Input.hash(await fs.readFile(file)),
      });
    }
    return {
      input,
      source,
      originalEvidence,
      round: source.round,
      mesh,
      meshTopology,
      pieces: [
        {
          name: "body",
          positions: Array.from(mesh.positions),
          indices: Array.from(mesh.indices),
          diagnostics,
        },
      ],
      diagnostics,
      catalog,
      reference,
      referenceMeshes,
      referenceHashes,
      generationMs,
      catalogMs,
      memory: { before, afterMesh, afterCatalog },
      cameras: new Map(),
      zones: [],
      outputs: { originals: path.dirname(originalEvidence.file) },
      frames: [],
    };
  }

  /**
   * Explicit native camera handoff; the existing seven preset names/order stay unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing camera fit supplies native complete frames; underside flips top back/up and opposite low reflects the fixed world-z frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A per-case zone/view cache returns the first complete frame, preserving the common ROI and dimensions supplied by these two consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Core preset names/order are untouched; callers must keep ROI and dimensions stable for one zone/view key.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit per native zone/view scans the supplied fixed reference points; later pass reads are constant-time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and Deviation use identical 900-wide whole/close frames and the same cached ROI keys.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The map belongs to one case context and holds only small camera records.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states explicit complete native handoff without changing core presets.
   */
  export function camera(
    context: Scene | null,
    zone: string,
    view: string,
    points: readonly N.Point[],
    width: number,
    height: number,
  ): N.Camera {
    if (context === null)
      return NodeCanvasCamera.fit(view, points, width, height);
    const key: string = zone + "/" + view;
    const previous: N.Camera | undefined = context.cameras.get(key);
    if (previous !== undefined) return previous;
    let result: N.Camera;
    if (view === "fold-front" || view === "fold-back" || view === "palm") {
      const hand = Placement.frame("hand");
      const back: N.Point = view === "palm" ? hand.axes[0] : [view === "fold-front" ? 1 : -1, 0, 0];
      const up: N.Point = view === "palm" ? hand.axes[1].map((x: number): number => -x) as N.Point : [0, 1, 0];
      const reflected: boolean = zone.endsWith(".twin");
      const roi: readonly N.Point[] = reflected
        ? points.map((p: N.Point): N.Point => [p[0], p[1], -p[2]]) : points;
      const authored: N.Camera = NailEvidence.fit(view, back, up, roi, width, height, view === "palm" ? undefined : fold()[1]);
      result = reflected ? NailEvidence.mirror(authored) : authored;
    } else if (view === "underside") {
      const top: N.Camera = NodeCanvasCamera.fit("top", points, width, height);
      result = {
        ...top,
        name: view,
        back: [-top.back[0], -top.back[1], -top.back[2]],
        up: [-top.up[0], -top.up[1], -top.up[2]],
      };
    } else if (view === "low-oblique-other-side") {
      const low: N.Camera = NodeCanvasCamera.fit(
        "low-oblique",
        points,
        width,
        height,
      );
      result = {
        ...low,
        name: view,
        back: [low.back[0], low.back[1], -low.back[2]],
        right: [-low.right[0], -low.right[1], low.right[2]],
        up: [low.up[0], low.up[1], -low.up[2]],
      };
    } else result = NodeCanvasCamera.fit(view, points, width, height);
    context.cameras.set(key, result);
    return result;
  }

  /**
   * Add the opposite physical display ROI without assigning a clinical side.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing declared bilateral display ROIs gain their world-z-reflected predicate under the fixed bilateral-frame premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original zones precede reflected named counterparts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clinical side or new anatomy selection is inferred.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear zone-list work retains predicates only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both consumers use the Figure-recorded paired ROI list.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned predicates borrow existing ones and leave scope with the case.
   * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes physical display pairing from clinical side.
   */
  export function pairedZones(
    zones: readonly [string, (p: N.Point) => boolean][],
  ): [string, (p: N.Point) => boolean][] {
    const paired: readonly string[] = [
      "hand",
      "foot",
      "ear",
      "knee",
      "fold",
      "toes",
      "armpit",
      "armpit.fold",
      "elbow",
      "hand.web",
      "hand.dorsum",
      "hand.roots",
    ];
    return [
      ...zones,
      ...zones
        .filter(([id]: [string, (p: N.Point) => boolean]): boolean =>
          paired.includes(id),
        )
        .map(
          ([id, inside]: [string, (p: N.Point) => boolean]): [
            string,
            (p: N.Point) => boolean,
          ] => [
            id + ".twin",
            (p: N.Point): boolean => inside([p[0], p[1], -p[2]]),
          ],
        ),
    ];
  }

  /**
   * Share the native Figure requests and existing Deviation comparison directions before either consumer draws.
   * Both sides reuse complete camera frames; a named underside remains a global below view, not a visibility guarantee.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The eight existing Deviation regions retain their five comparison directions through an ordered union with Figure requests; native nose keeps its explicit seven directions and twins exchange left/right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An explicit nose list or one comparison-region union precedes the existing opposite-side mapping.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No core preset order, camera math, geometry or scene/phase law changes; unrelated zone plans retain their directions and no view existence is treated as visibility proof.
   * @evidence contracts/development/implementation.md#efficient-algorithms Small bounded list unions retain one plan; the complete owners-enabled native round adds eighteen view cells and thus144 Figure/Deviation PNGs compared with the previously incomplete plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both consumers borrow the same plan, reference ROI and memoized camera without another assembly or realization.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a new small array survives; no resource or cache is retained.
   * @evidence contracts/development/common.md#meaningful-documentation States retained comparison coverage, ordered union, both-side camera reuse, output cost and visibility limits.
   */
  export function views(
    zone: string,
    original: (zone: string) => string[],
  ): string[] {
    const name: string = zone.replace(/\.twin$/, "");
    if (name === "nose")
      return [
        "front",
        "left",
        "right",
        "high-oblique",
        "low-oblique",
        "low-oblique-other-side",
        "underside",
      ];
    const requested: string[] = original(name);
    const comparison: readonly string[] = ["head", "hand", "foot", "shoulder", "ear", "neck", "hip", "chest"];
    const planned: string[] = comparison.includes(name)
      ? [...new Set([...requested, "front", "back", "left", "high-oblique", "low-oblique"])]
      : requested;
    return planned.map((view: string): string =>
      zone.endsWith(".twin")
        ? view === "left"
          ? "right"
          : view === "right"
            ? "left"
            : view
        : view,
    );
  }

  /**
   * Select display passes only; legacy calls retain their exact stages.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native original guides, raw loft display and realized clay retain separate stages; legacy calls preserve their original stages.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A context branch chooses mesh references without evaluating geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raw samples, originals and skin are not merged under one identity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size pass-list creation borrows existing arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All Figure stages reuse the same original catalog and realized mesh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pass list owns no mesh buffers and leaves scope after iteration.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states legacy stage preservation and display-only selection.
   */
  export function stages(
    context: Scene | null,
    reference: N.Mesh[],
    generated: N.Mesh[],
    owners: N.Mesh[] | null,
    whole: boolean,
  ): [string, N.Mesh[]][] {
    if (context === null)
      return [
        ["reference", reference],
        ["generated", generated],
        ...(!whole && owners !== null
          ? [["owners", owners] as [string, N.Mesh[]]]
          : []),
      ];
    return [
      ["reference", reference],
      ["curves", []],
      ["curves-over-clay", generated],
      ["raw-loft-curves", []],
      ["clay", generated],
      ...(owners === null ? [] : [["owners", owners] as [string, N.Mesh[]]]),
    ];
  }

  /**
   * Every native construction pass reads this same evaluated catalog.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Original stages borrow original guides while raw-loft stage borrows the actual factory display catalog.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stage selection returns an existing array or an empty array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mesh-recovered original, missing-reader replacement or new evaluator is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant stage selection performs no geometry or array traversal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every matching pass reads the same evaluated catalog.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed arrays remain owned by the one-case context.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states shared evaluated catalog ownership.
   */
  export function curves(context: Scene | null, stage: string): N.Curve[] {
    return context === null
      ? []
      : stage === "raw-loft-curves"
        ? context.catalog.curves
        : stage === "curves" || stage === "curves-over-clay"
          ? ("ordinary" in context ? context.originals : context.source.originals).curves
          : [];
  }

  /**
   * Plain receipt identity, never a geometric acceptance certificate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact input/source/field identities, original/raw stage definitions and actual frame/diagnostic records form an observation receipt.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain metadata object borrows checked identities and hashes finite display catalogs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometric acceptance, physical2 certification or original-control recovery is inferred.
   * @evidence contracts/development/implementation.md#efficient-algorithms Catalog hashing and camera/frame serialization scale with current-case display evidence.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared Identity recipes and evaluated catalogs avoid another generation or measurement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned snapshot borrows one-case evidence and owns no resource or running task.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and status state receipt identity without acceptance.
   */
  export function metadata(context: IContext): unknown {
    return {
      schema: "f1-native-capture/v1",
      case: context.input.selected,
      artifact: context.input.artifact,
      inputRevision: context.input.artifact.sha256,
      fieldsHash: context.input.fieldsHash,
      sourceRevision: Input.dataHash(context.input.sourceHashes),
      sourceHashes: context.input.sourceHashes,
      preflight: context.input.preflight,
      originalEvidence: context.originalEvidence,
      originalObservation: {
        assemblyMs: context.source.assemblyMs,
        originalMs: context.source.originalMs,
        reads: context.source.reads,
        curveHash: Input.dataHash(context.source.originals.curves),
        curves: context.source.originals.curves.length,
        unavailable: context.source.originals.unavailable,
      },
      passDefinitions: {
        curves: "actual original axis/extreme/split guides",
        "curves-over-clay": "same originals over the one realized skin",
        "raw-loft-curves":
          "separate actual factory Point0 grid, not original2D definitions or an intermediate solid",
        clay: "same realized skin",
      },
      bare: context.input.bare,
      reference: context.referenceHashes,
      captureEntryCalls: {
        assembleNative: 1,
        constructionFrom: 1,
        realization: 1,
        catalog: 1,
      },
      generationMs: context.generationMs,
      catalogMs: context.catalogMs,
      memorySnapshots: context.memory,
      mesh: {
        vertices: context.mesh.positions.length / 3,
        triangles: context.mesh.indices.length / 3,
      },
      meshTopology: context.meshTopology,
      curveCatalog: {
        stage: "raw-loft-factory/retained-operator Point0 display",
        hash: Input.dataHash(context.catalog.curves),
        rows: context.catalog.rows,
        unavailable: context.catalog.unavailable,
        curves: context.catalog.curves.length,
        points: context.catalog.points,
        physical2: "not certified by display sampling",
      },
      cameras: Object.fromEntries(context.cameras),
      frames: context.frames,
      raster:
        "Skia Canvas2D / CPU z-buffer; existing colours, signed-distance bins and sampling",
      diagnostics: context.diagnostics,
      status: "captured evidence; no shape acceptance asserted",
    };
  }
  /** Matched nail display framing and material claims on the one realized figure. */
  export namespace NailEvidence {
    type V = N.Point;
    const Camera = NodeCanvasCamera;
    const Raster = NodeCanvasRaster;

    /** The dedicated nail pass's measured receipt. */
    export interface IResult {
      /** Claim, clip and frame receipts for each authored digit and its twin. */
      rows: unknown[];
      /** Number of owner PNGs written. */
      ownerFrames: number;
      /** Failed clip, crop, claim or output-count checks. */
      findings: string[];
    }

    /** Points of the triangles that the raster actually receives, in metres. */
    export function points(meshes: readonly N.Mesh[]): V[] {
      return meshes.flatMap((mesh: N.Mesh): V[] =>
        [...new Set(mesh.indices)].map((i: number): V => position(mesh, i)),
      );
    }

    /**
     * Fit the supplied triangle points in the annotated raster content.
     * A fold-height view may keep an independently supplied vertical landmark.
     */
    export function fit(name: string, back: V, upHint: V, points: readonly V[], width: number, height: number, upAt?: number): N.Camera {
      if (points.length === 0) throw new Error("Cannot frame an empty anatomical selection");
      const b: V = Camera.unit(back);
      const right: V = Camera.unit(Camera.cross(upHint, b));
      const up: V = Camera.cross(b, right);
      const axes: V[] = [right, up, b];
      const low: V = [Infinity, Infinity, Infinity];
      const high: V = [-Infinity, -Infinity, -Infinity];
      for (const p of points) for (let k: number = 0; k < axes.length; ++k) {
        const value: number = Camera.dot(p, axes[k]!);
        low[k] = Math.min(low[k]!, value);
        high[k] = Math.max(high[k]!, value);
      }
      const centre: V = [(low[0] + high[0]) / 2, upAt ?? (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
      // Raster samples columns 0..width-1 and rows 80..height-26 at pixel centres.
      const contentHeight: number = height - 105;
      const vertical: number = 2 * Math.max(Math.abs(high[1] - centre[1]), Math.abs(low[1] - centre[1]));
      const scale: number = 0.88 * Math.min(width / Math.max(high[0] - low[0], 0.001), contentHeight / Math.max(vertical, 0.001));
      const contentCentre: number = 80 + contentHeight / 2;
      centre[1] += (contentCentre - (height + 40) / 2) / scale;
      const target: V = [0, 1, 2].map((k: number): number =>
        right[k]! * centre[0] + up[k]! * centre[1] + b[k]! * centre[2],
      ) as V;
      return { name, target, right, up, back: b, scale, width, height };
    }

    /** Reflect the complete basis and reverse screen right to retain handedness. */
    export function mirror(camera: N.Camera): N.Camera {
      return {
        ...camera,
        target: reflect(camera.target),
        back: reflect(camera.back),
        up: reflect(camera.up),
        right: [-camera.right[0], -camera.right[1], camera.right[2]],
      };
    }

    function reflect(point: V): V { return [point[0], point[1], -point[2]]; }

    function position(mesh: Pick<N.Mesh, "positions">, index: number): V {
      return [mesh.positions[3 * index]!, mesh.positions[3 * index + 1]!, mesh.positions[3 * index + 2]!];
    }

    /** The original clipping proxy and the jointly fitted passing fixture. */
    export function checkFrame(): { oldRows: [number, number]; fittedRows: [number, number]; reflectedPoint: [number, number] } {
      const a: V = [-0.004, -0.0025, 0];
      const b: V = [0, 0.025, 0];
      const points: V[] = [a, [0.004, -0.002, 0], [0, 0.023, 0], [-0.003, -0.002, 0], [0.003, -0.001, 0], b];
      const old: N.Camera = { name: "fixture", target: [0, 0.011, 0], back: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0], scale: (720 / 0.026) * 360 / 900, width: 360, height: 360 };
      const fitted: N.Camera = fit("fixture", old.back, old.up, points, 360, 360);
      const reflected: N.Camera = mirror(fitted);
      const [x, y]: V = Camera.project(points[1]!, fitted);
      const [rx, ry]: V = Camera.project(reflect(points[1]!), reflected);
      const oldRows: [number, number] = [Camera.project(a, old)[1], Camera.project(b, old)[1]];
      const fittedRows: [number, number] = [Camera.project(a, fitted)[1], Camera.project(b, fitted)[1]];
      const reflectedPoint: [number, number] = [rx, ry];
      const result = { oldRows, fittedRows, reflectedPoint };
      const roundoff: number = 360 * 8 * Number.EPSILON;
      if (
        !(oldRows[0] > 334 && oldRows[1] < 80) ||
        points.some((p: V): boolean => !visible(Camera.project(p, fitted), fitted)) ||
        Math.abs(fittedRows[0] - 319.7) > roundoff ||
        Math.abs(fittedRows[1] - 95.3) > roundoff ||
        Math.abs(x + rx - 360) > roundoff || Math.abs(y - ry) > roundoff
      ) throw new Error("The anatomical viewport projection control failed: " + JSON.stringify(result));
      return result;
    }

    /** Count actual projected points outside the raster's content pixels. */
    export function outside(points: readonly V[], camera: N.Camera): number {
      return points.filter((p: V): boolean => !visible(Camera.project(p, camera), camera)).length;
    }

    function visible(point: V, camera: N.Camera): boolean {
      return point[0] >= 0.5 && point[0] <= camera.width - 0.5 &&
        point[1] >= 80.5 && point[1] <= camera.height - 25.5;
    }

    const CLAY: V = [0.64, 0.65, 0.67];

    interface ISelection {
      mesh: N.Mesh;
      claimed: Set<number>;
    }

    /** Keep complete drawn triangles and their actual originating corner IDs. */
    function select(mesh: Pick<N.Mesh, "positions" | "indices">, id: string, near: (p: V) => boolean, claimed: ReadonlySet<number>): ISelection {
      const positions: number[] = [];
      const indices: number[] = [];
      const local: Map<number, number> = new Map();
      const stored: Set<number> = new Set();
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const tri: number[] = mesh.indices.slice(i, i + 3);
        if (!tri.every((index: number): boolean => near(position(mesh, index)))) continue;
        for (const index of tri) {
          let next: number | undefined = local.get(index);
          if (next === undefined) {
            next = positions.length / 3;
            local.set(index, next);
            positions.push(...position(mesh, index));
            if (claimed.has(index)) stored.add(next);
          }
          indices.push(next);
        }
      }
      return { mesh: { id, positions, indices, colour: CLAY }, claimed: stored };
    }

    function edge(a: V, b: V, x: number, y: number): number {
      return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    }

    /**
     * Paint near each claimed corner only on its incident visible triangle.
     * At a pixel centre the incident depth is read barycentrically, just as
     * in the clay pass; a finer screen sampling cannot reveal a hidden claim.
     */
    function paint(camera: N.Camera, { mesh, claimed }: ISelection): { background: NodeCanvasRaster.IBackground; pixels: Set<number> } {
      const background: NodeCanvasRaster.IBackground = Raster.prepare(camera, [mesh]);
      const projected: V[] = Array.from({ length: mesh.positions.length / 3 }, (_: unknown, index: number): V =>
        Camera.project(position(mesh, index), camera));
      const pixels: Set<number> = new Set();
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const tri: number[] = mesh.indices.slice(i, i + 3);
        const corners: number[] = tri.filter((j: number): boolean => claimed.has(j));
        if (corners.length === 0) continue;
        const [a, b, c]: V[] = tri.map((j: number): V => projected[j]!);
        const area: number = edge(a!, b!, c![0], c![1]);
        if (area === 0) continue;
        for (const j of corners) {
          const [x, y]: V = projected[j]!;
          for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
            const px: number = Math.floor(x) + dx;
            const py: number = Math.floor(y) + dy;
            if (px < 0 || px >= camera.width || py < 80 || py > camera.height - 26) continue;
            const w0: number = edge(b!, c!, px + 0.5, py + 0.5) / area;
            const w1: number = edge(c!, a!, px + 0.5, py + 0.5) / area;
            const w2: number = edge(a!, b!, px + 0.5, py + 0.5) / area;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const depth: number = w0 * a![2] + w1 * b![2] + w2 * c![2];
            const index: number = py * camera.width + px;
            if (Math.abs(depth - background.depth[index]!) > 64 * Number.EPSILON * Math.max(1, Math.abs(depth))) continue;
            background.pixels.set([176, 71, 91, 255], index * 4);
            pixels.add(index);
          }
        }
      }
      return { background, pixels };
    }

    /** Forty owner stills from existing faces, with separate left reference stills. */
    export async function run(context: FamilyConicCaptureContext.IOrdinary, out: string): Promise<IResult> {
      const owners: string = path.join(out, "owners");
      const references: string = path.join(out, "reference");
      await fs.mkdir(owners, { recursive: true });
      await fs.mkdir(references, { recursive: true });
      const mesh: FamilyConicCaptureContext.IMesh = context.mesh;
      const indexed: Set<number> = new Set(mesh.indices);
      const rows: unknown[] = [];
      const findings: string[] = [];
      let ownerFrames: number = 0;
      const reference: N.Mesh = context.referenceMeshes[0]!;
      for (const [i, made] of context.nails.entries()) {
        const source: IOrdinaryNailSource = context.comparison.sources[i]!;
        const name: string = source.name;
        const { origin, distal, dorsal }: IAutoMovieHumanF1Nails.IMade["nail"]["frame"] = made.nail.frame;
        const lateral: V = Camera.cross(distal, dorsal);
        const near = (p: V): boolean => {
          const d: V = [p[0] * 1000 - origin[0], p[1] * 1000 - origin[1], p[2] * 1000 - origin[2]];
          return Camera.dot(d, distal) > -6 && Math.hypot(Camera.dot(d, dorsal), Camera.dot(d, lateral)) < 1.2 * made.nail.readings.breadth;
        };
        const claims = (side: 1 | -1): Set<number> => {
          const face: number = mesh.owners.indexOf(name + (side > 0 ? "" : ".mirror"));
          return new Set([...indexed].filter((i: number): boolean =>
            face >= 0 && mesh.coordinates[3 * i] === face && AutoMovieHumanNail.owns(made.nail, position(mesh, i).map((v: number, k: number): number => v * (k === 2 ? side : 1) * 1000))));
        };
        const authored: Set<number> = claims(1);
        const reflected: Set<number> = claims(-1);
        if (authored.size === 0 || reflected.size !== authored.size)
          findings.push(name + " has unequal or empty face claims");
        if (source.clipFinding !== null) findings.push(source.clipFinding);
        const left: ISelection = select(mesh, name, near, authored);
        const right: ISelection = select(mesh, name + ".mirror", (p: V): boolean => near(reflect(p)), reflected);
        const ref: ISelection = select(reference, "reference." + name, near, new Set());
        const expected: ISelection = {
          mesh: {
            ...left.mesh,
            positions: left.mesh.positions.map((v: number, k: number): number => k % 3 === 2 ? -v : v),
          },
          claimed: left.claimed,
        };
        const bounds: V[] = points([left.mesh, ref.mesh]);
        const oblique: V = dorsal.map((v: number, k: number): number => v + lateral[k]! + distal[k]!) as V;
        const frames: unknown[] = [];
        for (const [view, back] of [["dorsal", dorsal], ["oblique", oblique]] as [string, V][]) {
          const camera: N.Camera = fit(view, back, distal, bounds, 900, 900);
          const twin: N.Camera = mirror(camera);
          const reflection: ReturnType<typeof paint> = paint(twin, expected);
          const referenceFile: string = name + "." + view + ".png";
          const referencePng: Buffer = Raster.render(camera, [ref.mesh], [], "depth", name + " | reference | " + view, undefined, "f1", { stage: "reference", realization: "mesh-returned", diagnosticCount: context.diagnostics.length }).png;
          await fs.writeFile(path.join(references, referenceFile), referencePng);
          const referenceImage = { file: referenceFile, sha256: Identity.byteHash(referencePng), camera };
          const results: { file: string; sha256: string; camera: N.Camera; pixels: number; outside: number }[] = [];
          for (const [selected, at] of [[left, camera], [right, twin]] as [ISelection, N.Camera][]) {
            const result: ReturnType<typeof paint> = paint(at, selected);
            const file: string = selected.mesh.id + "." + view + ".png";
            const png: Buffer = Raster.render(at, [], [], "depth", selected.mesh.id + " | owners | " + view, result.background, "f1", { stage: "owners", realization: "mesh-returned", diagnosticCount: context.diagnostics.length }).png;
            await fs.writeFile(path.join(owners, file), png);
            ownerFrames++;
            const clipped: number = outside(points([selected.mesh]), at);
            if (clipped !== 0 || result.pixels.size === 0)
              findings.push(file + " has missing or clipped owner display");
            results.push({ file, sha256: Identity.byteHash(png), camera: at, pixels: result.pixels.size, outside: clipped });
            if (selected === right) frames.push({
              view,
              reference: referenceImage,
              reflection: { expected: reflection.pixels.size, actual: result.pixels.size, both: [...result.pixels].filter((p: number): boolean => reflection.pixels.has(p)).length },
              owners: results,
            });
          }
        }
        rows.push({ name, authored: authored.size, mirrored: reflected.size, clipped: source.clipped, clippedIn: source.clippedIn, frames });
      }
      if (ownerFrames !== 40) findings.push("expected forty owner PNGs");
      return { rows, ownerFrames, findings };
    }
  }
}

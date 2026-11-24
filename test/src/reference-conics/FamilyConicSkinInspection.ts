import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";

/**
 * One admitted native skin inspection without PNG or deviation consumers.
 * Run from test with --cases=<artifact> --case=<id> --preflight=<report>.
 *
 * @evidence contracts/development/design.md#principled-representation The CLI coordinates an existing admitted input and one case context; metre mesh counts and source/preflight identities remain separate from acceptance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the CLI main is exposed; Input, Source and Capture own admission, original evidence and realization respectively.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternative body, solver, topology reader or reference export is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation States invocation, no-PNG scope and existing owner responsibilities.
 */
namespace FamilyConicSkinInspection {
  /**
   * Save bounded scalar evidence from the existing one-case realization context.
   * Missing retained rows are observations against preflight names, not an inferred periodic-surface obligation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact Input.read admission precedes one Source.prepare/save and Capture.create; scalar topology, diagnostics and display-catalog counts are borrowed from that same context. Existing degenerate ordinals address actual corner owner/chart arrays directly without evaluating geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and provenance precede original preservation, realization and one exclusive summary write; thrown downstream failures keep the original evidence and failure message.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No additional construction, realization, mesh query, field conversion, camera, PNG or deviation runs. Preflight declared names and actual retained periodic rows are explicitly different populations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Existing context generation, topology and private-reference loading dominate; this producer adds linear metadata comparison, O(D) corner reads for D reported degenerate triangles and bounded per-owner summaries without another mesh-buffer copy. Existing context copies remain part of its reuse cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing assembly, realized mesh, topology report and evaluated catalog once; complete source scope is identified by its canonical digest and exact admitted artifact/preflight files.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One awaited invocation owns its context and file handles; no process, mesh cache or cross-case collection survives. Output excludes mesh buffers, reference assets, original controls and full degenerate-triangle arrays; only one minimum-ordinal representative per evaluating owner is retained. Nonfinite numeric summary values are explicit string flags.
   * @evidence contracts/development/common.md#meaningful-documentation Reports actual generation and inspection calls, original-evidence pointer, failure text, scalar census and explicit non-acceptance scope under packages/human/.shots.
   */
  export async function main(): Promise<void> {
    const input: Input.IInput | null = await Input.read(
      path.resolve(process.cwd(), ".."),
      process.argv.slice(2),
    );
    if (input === null)
      throw new Error("Skin inspection requires --cases, --case and --preflight");
    const producer: Input.IProducer = await Input.producer(input.root);
    const report: {
      operators: { rows: { owner: string; kind: string }[] };
    } = JSON.parse(await fs.readFile(input.preflight.file, "utf8"));
    if (!Array.isArray(report.operators?.rows))
      throw new Error("Skin inspection needs declared preflight operator rows");
    for (const row of report.operators.rows)
      if (typeof row.owner !== "string" || typeof row.kind !== "string")
        throw new Error("Skin inspection needs named preflight operator rows");
    const declared: string[] = [...new Set(report.operators.rows.map(
      (row: (typeof report.operators.rows)[number]): string => row.owner,
    ))];
    const started: number = performance.now();
    const stamp: string = new Date().toISOString().replaceAll(":", "-");
    let source: Source.IState | null = null;
    let originals: Input.IFile | null = null;
    let context: Capture.IContext | null = null;
    let failure: Error | null = null;
    try {
      source = Source.prepare(input);
      originals = await Source.save(source, producer);
      context = await Capture.create(source, originals);
    } catch (error: unknown) {
      failure = error instanceof Error ? error : new Error(String(error));
    }
    const actual: string[] = context?.catalog.rows.filter(
      (row: Capture.IContext["catalog"]["rows"][number]): boolean =>
        row.stage === "retained-operator-field",
    ).map((row: Capture.IContext["catalog"]["rows"][number]): string => row.id) ?? [];
    const missing: string[] = declared.filter(
      (id: string): boolean => !actual.includes(id),
    );
    const topology: Capture.IContext["meshTopology"]["topology"] | undefined =
      context?.meshTopology.topology;
    /** One actual indexed corner and its unchanged evaluating-owner chart. */
    type Corner = {
      vertex: number;
      owner: number;
      ownerName: string | null;
      a: number | "nonfinite-or-missing";
      b: number | "nonfinite-or-missing";
    };
    /** Native coordinate bounds use only this evaluating owner's own corners. */
    type OwnerCorners = {
      owner: number;
      ownerName: string;
      cornerOccurrences: number;
      nativeA: { min: number | null; max: number | null };
      nativeB: { min: number | null; max: number | null };
      nonfiniteOrMissingA: number;
      nonfiniteOrMissingB: number;
      first: { triangleOrdinal: number; corners: Corner[] };
    };
    const sameOwner: Map<number, number> = new Map();
    const mixedOwners: Map<string, { owners: (number | "nonfinite-or-missing")[]; ownerNames: (string | null)[]; triangles: number }> = new Map();
    const ownerCorners: Map<number, OwnerCorners> = new Map();
    let unavailableOwnershipTriangles: number = 0;
    if (context !== null && topology !== undefined)
      for (const ordinal of topology.degenerateTriangles) {
        const corners: Corner[] = [0, 1, 2].map((k: number): Corner => {
          const vertex: number = context.mesh.indices[3 * ordinal + k]!;
          const owner: number = context.mesh.coordinates[3 * vertex]!;
          const a: number = context.mesh.coordinates[3 * vertex + 1]!;
          const b: number = context.mesh.coordinates[3 * vertex + 2]!;
          return {
            vertex,
            owner,
            ownerName: context.mesh.owners[owner] ?? null,
            a: Number.isFinite(a) ? a : "nonfinite-or-missing",
            b: Number.isFinite(b) ? b : "nonfinite-or-missing",
          };
        });
        const first: Corner = corners[0]!;
        if (corners.some((corner: Corner): boolean => corner.ownerName === null))
          unavailableOwnershipTriangles++;
        else if (corners.every((corner: Corner): boolean => corner.owner === first.owner))
          sameOwner.set(first.owner, (sameOwner.get(first.owner) ?? 0) + 1);
        else {
          const owners: (number | "nonfinite-or-missing")[] = corners.map(
            (corner: Corner): number | "nonfinite-or-missing" => Number.isFinite(corner.owner) ? corner.owner : "nonfinite-or-missing",
          );
          const key: string = JSON.stringify(owners);
          const tuple: NonNullable<ReturnType<typeof mixedOwners.get>> = mixedOwners.get(key) ?? {
            owners,
            ownerNames: corners.map((corner: Corner): string | null => corner.ownerName),
            triangles: 0,
          };
          tuple.triangles++;
          mixedOwners.set(key, tuple);
        }
        for (const corner of corners) {
          if (corner.ownerName === null) continue;
          const own: OwnerCorners = ownerCorners.get(corner.owner) ?? {
            owner: corner.owner,
            ownerName: corner.ownerName,
            cornerOccurrences: 0,
            nativeA: { min: null, max: null },
            nativeB: { min: null, max: null },
            nonfiniteOrMissingA: 0,
            nonfiniteOrMissingB: 0,
            first: { triangleOrdinal: ordinal, corners },
          };
          own.cornerOccurrences++;
          if (typeof corner.a === "number") {
            own.nativeA.min = own.nativeA.min === null ? corner.a : Math.min(own.nativeA.min, corner.a);
            own.nativeA.max = own.nativeA.max === null ? corner.a : Math.max(own.nativeA.max, corner.a);
          } else own.nonfiniteOrMissingA++;
          if (typeof corner.b === "number") {
            own.nativeB.min = own.nativeB.min === null ? corner.b : Math.min(own.nativeB.min, corner.b);
            own.nativeB.max = own.nativeB.max === null ? corner.b : Math.max(own.nativeB.max, corner.b);
          } else own.nonfiniteOrMissingB++;
          if (ordinal < own.first.triangleOrdinal)
            own.first = { triangleOrdinal: ordinal, corners };
          ownerCorners.set(corner.owner, own);
        }
      }
    const out: string = path.join(
      input.root,
      "packages/human/.shots/skin-inspection",
      source?.round ?? stamp,
      "case-" + encodeURIComponent(input.selected.id),
    );
    await fs.mkdir(out, { recursive: true });
    const receipt: string = JSON.stringify({
      schema: "f1-skin-inspection/v1",
      state: failure === null ? "complete" : "failed",
      case: input.selected.id,
      fieldsHash: input.fieldsHash,
      artifact: input.artifact,
      preflight: input.preflight,
      sourceScope: { files: Object.keys(input.sourceHashes).length, sha256: Input.dataHash(input.sourceHashes) },
      producer,
      bare: input.bare,
      originalEvidence: originals,
      entryCalls: {
        assembleNative: source === null ? null : 1,
        constructionFrom: context === null ? null : 1,
        realization: context === null ? null : 1,
        catalog: context === null ? null : 1,
        failureScope: "Null means completion was not observed; an owner may have been entered before throwing.",
      },
      declarations: {
        originalIds: source?.declaredOriginals.length ?? null,
        sourceScopes: source?.sourceScopes.length ?? null,
        actualNativeSourceRows: context?.catalog.rows.filter(
          (row: Capture.IContext["catalog"]["rows"][number]): boolean => row.stage === "native-source-factory",
        ).length ?? null,
        preflightDeclaredOperatorNames: declared,
        retainedPeriodicCatalogRows: context === null ? null : actual,
        declaredNamesAbsentFromRetainedPeriodicRows: context === null ? null : missing,
        missingCount: context === null ? null : missing.length,
        qualification: "Preflight names include nonperiodic and seed-only declarations; absence is not by itself an operator failure. Diagnostics separately identify actual refusals.",
      },
      catalog: context === null ? null : {
        rows: context.catalog.rows.length,
        curves: context.catalog.curves.length,
        points: context.catalog.points,
        unavailable: context.catalog.unavailable,
        qualification: "Unavailable counts evaluated registered readers only; absent realized operators can be missing from the catalog entirely.",
      },
      mesh: context === null ? null : {
        vertices: context.mesh.positions.length / 3,
        triangles: context.mesh.indices.length / 3,
        usedIndexComponents: context.meshTopology.usedIndexComponents,
        topology: topology === undefined ? null : {
          triangles: topology.triangles,
          degenerate: topology.degenerate,
          boundaryEdges: topology.boundaryEdges,
          nonManifoldEdges: topology.nonManifoldEdges,
          watertight: topology.watertight,
          volumeM3: topology.volume,
        },
        degenerateCornerEvaluationOwnership: {
          sameOwnerTriangleCounts: [...sameOwner].map(([owner, triangles]: [number, number]): { owner: number; ownerName: string; triangles: number } => ({ owner, ownerName: context.mesh.owners[owner]!, triangles })),
          mixedOwnerTupleCounts: [...mixedOwners.values()],
          nativeCornerBounds: [...ownerCorners.values()],
          unavailableOwnershipTriangles,
          qualification: "Direct reads of existing degenerate ordinals and actual indices/coordinates/owners only; these are corner evaluation owners, not emitted-face ownership. Shared seam indices can evaluate on another face. a/b retain native producer units (loft station mm/phase rad; other owners keep their own chart). Each owner bound uses only its own corners; first is its minimum observed triangle ordinal with all three original corner addresses. No surface evaluation, topology/component query, mesh copy or component-membership inference is added.",
        },
        queryMs: context.meshTopology.queryMs,
        qualification: context.meshTopology.qualification,
      },
      diagnostics: context?.diagnostics ?? null,
      generationMs: context?.generationMs ?? null,
      catalogMs: context?.catalogMs ?? null,
      totalMs: performance.now() - started,
      error: failure?.message ?? null,
      qualification: "No PNG/deviation or additional geometry query. Context still loads its private comparison assets internally; no private data is exported. Completion and numerical census do not accept anatomy, shape or preserved openings.",
    }, (_key: string, value: unknown): unknown =>
      typeof value === "number" && !Number.isFinite(value)
        ? "nonfinite-number"
        : value, 2);
    const file: string = path.join(out, "receipt.json");
    await fs.writeFile(file, receipt, { flag: "wx" });
    process.stdout.write(JSON.stringify({ out, state: failure === null ? "complete" : "failed", case: input.selected.id, receiptSha256: Input.hash(receipt) }) + "\n");
    if (failure !== null) throw failure;
  }
}

void FamilyConicSkinInspection.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});

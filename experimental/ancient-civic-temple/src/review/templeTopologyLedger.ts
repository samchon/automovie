/**
 * Topology ledger for model meshes sent to the actual renderer
 * . Joins one
 * model's part meshes through engine mergeAutoMovieMeshes, reads
 * inspectAutoMovieMeshTopology (triangles, degeneracy, non-finite components,
 * open/non-manifold edges and signed volume) and validateMeshTopology (winding
 * consistency) unchanged, and adds two quantities the engine does not count.
 * (1) Open edges after T-junction resolution: splitting adjacent convex faces
 * can leave a face vertex on another face's edge, producing welded open edges
 * without a gap. Splits each edge at such vertices and counts only directed
 * subedges without an opposite partner as actual gaps.
 * (2) Connected components: unions of vertices joined by triangles and T-junctions.
 * Welding uses the engine's nanometre grid; the on-edge tolerance is 1e-6 m.
 * Ledger values are geometric facts, without judging appearance or design fit.
 */
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { accountMeshes } from "./accountMeshes";
import { accountModel } from "./accountModel";
import { partitionNamedSheetTriangles } from "./partitionNamedSheetTriangles";
import { LedgerRow } from "./LedgerRow";
import { closureFindings } from "./closureFindings";
import { partMeshes } from "./partMeshes";
import { NamedSheet } from "./NamedSheet";

/**
 * Temple model closure contract. The soil, paving, neighbor floors and distant
 * ridge are open top-only surfaces
 * (src/spaces/site/ground.ts and ridge.ts). The three wing-roof owners are culled
 * together: their touching side faces hide inside adjacent slabs
 * (src/geometry/roof-solids.ts), so each owner model is open at those interfaces
 * and the union of all three is a closed solid. Every other model is individually
 * closed. After T-junction resolution, a closed solid has 0 open edges,
 * 0 non-manifold edges, 0 winding errors and positive volume.
 */
const templeOpenSurfaceModels: ReadonlySet<string> = new Set(["model.site-ground", "model.site-distant"]);

const templeContractOf = (id: string): LedgerRow["contract"] =>
  templeOpenSurfaceModels.has(id) || id.startsWith("model.cladding-") ? "open-surface"
    : /^model.(column|beam|porch-entablature|door|window|rafters|truss|joists|fountain)/.test(id) ? "solid-assembly" : "closed";
const templeCompositeSolids: ReadonlyArray<{ id: string; models: readonly string[] }> = [
  { id: "composite.wing-roofs", models: ["model.roof-west", "model.roof-east", "model.roof-colonnade"] },
];


/** Accounts for every environment model and composite solid with its contract. */
export const templeTopologyLedger = (environment: IAutoMovieBuiltEnvironment, sheets: readonly NamedSheet[] = []): LedgerRow[] => {
  const members = new Set(templeCompositeSolids.flatMap((c) => c.models));
  const rows: LedgerRow[] = environment.models.map((model) => {
    const account = accountModel(model);
    const contract = members.has(model.id) ? "composite-member" : templeContractOf(model.id);
    const findings = contract === "solid-assembly"
      ? [...account.degenerate > 0 ? [`degenerate triangles ${account.degenerate}`] : [], ...account.nonFinite > 0 ? [`non-finite components ${account.nonFinite}`] : [],
        ...account.volume > 0 ? [] : [`signed volume ${account.volume} (inverted member)`]]
      : contract === "open-surface" || contract === "composite-member" ? [...account.degenerate > 0 ? [`degenerate triangles ${account.degenerate}`] : [], ...account.nonFinite > 0 ? [`non-finite components ${account.nonFinite}`] : []]
      : closureFindings(account, contract === "closed");
    return { account, contract, findings };
  });
  for (const composite of templeCompositeSolids) {
    const models = composite.models.map((id) => {
      const model = environment.models.find((m) => m.id === id);
      if (model === undefined) throw new Error(`${composite.id}: model ${id} is missing.`);
      return model;
    });
    const stripped = models.flatMap(partMeshes).map((mesh) => partitionNamedSheetTriangles(mesh, sheets));
    const account = accountMeshes(composite.id, stripped.flatMap((s) => s.body === null ? [] : [s.body]));
    const removed = stripped.reduce((sum, s) => sum + s.removed, 0);
    rows.push({ account, contract: "closed", findings: closureFindings(account, true) });
    if (sheets.length > 0) {
      const expected = sheets.reduce((sum, sheet) => sum + 2 * (sheet.corners.length - 2), 0);
      const faces = removed;
      const sheetMeshes = stripped.flatMap((s) => s.sheet === null ? [] : [s.sheet]);
      if (sheetMeshes.length === 0) throw new Error(`${composite.id}: named closure-sheet triangles are missing.`);
      const sheetAccount = accountMeshes(`${composite.id}.named-sheets`, sheetMeshes);
      rows.push({
        account: sheetAccount,
        contract: "open-surface",
        findings: [...closureFindings(sheetAccount, false).filter((finding) =>
          finding.startsWith("degenerate") || finding.startsWith("non-finite")),
        ...(faces === expected ? [] : [`${faces} of ${expected} front/back triangles for ${sheets.length} named closure sheets`])],
      });
    }
  }
  return rows;
};


import { HumanDebugInspectionPlan } from "./HumanDebugInspectionPlan";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** Inventory-driven plan expansion. Geometry and source membership come only from the real snapshot. */
export namespace HumanDebugInspectionRows {
  /** Discover full-tree identity from reference clay, or scoped originals from a curve-only probe. */
  export function initial(plan: P): P.Row {
    return row(0, "inventory", "inventory", "front", "reference", plan.scope ?? [], plan.scope === undefined ? [] : null);
  }

  /** Keep known intended stages explicit if source inventory itself is unavailable. */
  export function blocked(manifest: P.Manifest, reason: string): void {
    const add: (stage: P.Stage, scope: string, camera: P.Camera, names: string[]) => void = (stage: P.Stage, scope: string, camera: P.Camera, names: string[]): void => {
      const next: P.Row = row(manifest.rows.length, stage, scope, camera, scope, names, null);
      next.status = "unavailable";
      next.error = reason;
      manifest.rows.push(next);
    };
    const cameras: P.Camera[] = manifest.plan.cameras ?? HumanDebugInspectionPlan.CAMERAS;
    const overview: string = manifest.plan.scope === undefined ? "whole" : "selected";
    for (const camera of manifest.plan.referenceCameras ?? HumanDebugInspectionPlan.REFERENCE_CAMERAS) add("reference", overview, camera, manifest.plan.scope ?? []);
    for (const scope of [{ id: overview, names: manifest.plan.scope ?? [] }, ...manifest.plan.parts.map((part: P.Part): { id: string; names: string[] } => ({ id: "part:" + part.name, names: [part.name] })), ...manifest.plan.groups.map((group: P.Group): { id: string; names: string[] } => ({ id: "group:" + group.id, names: group.parts }))])
      for (const camera of cameras) {
        add("original", scope.id, camera, scope.names);
        if (manifest.plan.raw !== false) for (const stage of ["raw-curves", "raw-overlay", "raw-clay"] as const) add(stage, scope.id, camera, scope.names);
      }
    for (const part of manifest.plan.parts) {
      for (const edge of HumanDebugInspectionPlan.EDGES) add("original", "curve:" + part.name + "/" + edge, part.outlineCameras?.[edge] ?? "front", [part.name]);
      add("original", "part:" + part.name + ":top-inventory-unavailable", part.topCamera ?? "top", [part.name]);
    }
    if (manifest.plan.final) for (const camera of cameras) add("final-clay", "whole", camera, []);
    manifest.notes.push("Raw top count is unknown because inventory failed; no unobserved ring is counted complete.");
    if (manifest.plan.allParts) {
      add("original", "all-parts:inventory-unavailable", "front", []);
      manifest.notes.push("All-parts enumeration is unavailable because the requested original inventory failed; unknown parts are not counted complete.");
    }
  }

  /** Expand only requested parts and neighbours, never every part times every ring times every camera. */
  export function expand(manifest: P.Manifest, receipt: P.Receipt): void {
    const provenance: Record<string, unknown> = receipt.snapshot.provenance ?? {};
    const observation: { stage?: string; treeParts?: unknown; scope?: { observed?: unknown }; unavailableParts?: unknown } = (provenance.observation ?? {}) as { stage?: string; treeParts?: unknown; scope?: { observed?: unknown }; unavailableParts?: unknown };
    if (!Array.isArray(observation.treeParts) || !observation.treeParts.every((name: unknown): boolean => typeof name === "string"))
      throw new Error("The inventory snapshot exposes no actual production-tree names");
    const scoped: boolean = manifest.plan.scope !== undefined;
    if (scoped && (observation.stage !== "scoped-source-definition" || !Array.isArray(observation.scope?.observed) || !observation.scope.observed.every((name: unknown): boolean => typeof name === "string"))) throw new Error("The packet scope has no actual scoped-original observation");
    if (!scoped && observation.stage !== "source-definition") throw new Error("A complete-tree packet cannot adopt a partial original observation");
    manifest.treeParts = scoped ? [] : [...observation.treeParts] as string[];
    const observed: string[] = scoped ? [...observation.scope!.observed as string[]] : manifest.treeParts;
    const records: { name?: string; part?: boolean }[] = Array.isArray(provenance.sourceRecords) ? provenance.sourceRecords as { name?: string; part?: boolean }[] : [];
    manifest.originalParts = scoped ? observed.filter((name: string): boolean => HumanDebugPattern.matches(name, manifest.plan.scope!, "") && records.some((record: typeof records[number]): boolean => record.name === name && record.part === true)) : [...manifest.treeParts];
    const unavailable: string[] = Array.isArray(observation.unavailableParts) ? observation.unavailableParts.filter((name: unknown): name is string => typeof name === "string") : [];
    manifest.sourceScope = scoped ? { requested: [...manifest.plan.scope!], observed, unavailable, tree: "not-assembled" } : null;
    manifest.originalIds = receipt.snapshot.inventory.curves.filter((id: string): boolean =>
      manifest.originalParts.some((name: string): boolean => id.startsWith("human.construction.view." + name + "/")));
    const plan: P = manifest.plan;
    const enumerated: string[] = scoped
      ? [...new Set([...manifest.originalParts, ...unavailable.filter((name: string): boolean => /^[A-Za-z][A-Za-z0-9_.-]*$/.test(name) && HumanDebugPattern.matches(name, plan.scope!, ""))])]
      : manifest.originalParts;
    const parts: P.Part[] = plan.allParts
      ? [...enumerated.map((name: string): P.Part => plan.parts.find((part: P.Part): boolean => part.name === name) ?? { name }), ...plan.parts.filter((part: P.Part): boolean => !enumerated.includes(part.name))]
      : plan.parts;
    const cameras: P.Camera[] = plan.cameras ?? HumanDebugInspectionPlan.CAMERAS;
    const refs: P.Camera[] = plan.referenceCameras ?? HumanDebugInspectionPlan.REFERENCE_CAMERAS;
    const overview: string = scoped ? "selected" : "whole";
    const scopes: { id: string; names: string[] }[] = [{ id: overview, names: manifest.originalParts }];
    const sectionRows: P.Row[] = [];
    const add: (stage: P.Stage, scope: string, camera: P.Camera, key: string, names: string[], ids: string[] | null, reason?: string) => void = (
      stage: P.Stage, scope: string, camera: P.Camera, key: string, names: string[], ids: string[] | null, reason?: string,
    ): void => {
      const next: P.Row = row(manifest.rows.length, stage, scope, camera, key, names, ids);
      if (reason !== undefined) { next.status = "unavailable"; next.error = reason; }
      manifest.rows.push(next);
    };
    const idsOf: (names: readonly string[]) => string[] = (names: readonly string[]): string[] => manifest.originalIds.filter((id: string): boolean =>
      names.some((name: string): boolean => id.startsWith("human.construction.view." + name + "/")));
    add("framing", overview, "front", overview, manifest.originalParts, manifest.originalIds);
    for (const camera of refs) add("reference", overview, camera, overview, manifest.originalParts, []);
    for (const camera of cameras) add("original", overview, camera, overview, manifest.originalParts, manifest.originalIds);

    for (const part of parts) {
      const scope: string = "part:" + part.name;
      const names: string[] = [part.name];
      const ids: string[] = idsOf(names);
      const absent: string | undefined = manifest.originalParts.includes(part.name) ? undefined : "Requested part is unavailable in the actual original observation";
      scopes.push({ id: scope, names });
      add("framing", scope, "front", scope, names, ids, absent);
      for (const camera of cameras) add("original", scope, camera, scope, names, ids, absent);
      for (const edge of HumanDebugInspectionPlan.EDGES) {
        const id: string = "human.construction.view." + part.name + "/" + edge;
        const camera: P.Camera = part.outlineCameras?.[edge] ?? "front";
        const key: string = "curve:" + id;
        const missing: string | undefined = ids.includes(id) ? absent : "Original curve is unavailable; inspect sourceCurveDiagnostics in the inventory receipt";
        add("framing", key, camera, key, names, [id], missing);
        add("original", key, camera, key, names, [id], missing);
        manifest.rows[manifest.rows.length - 1]!.automaticCamera = part.outlineCameras?.[edge] === undefined;
      }
      const rings: string[] = ids.filter((id: string): boolean => /\/top\.\d+$/.test(id));
      for (const id of rings) {
        const key: string = "curve:" + id;
        const camera: P.Camera = part.topCamera ?? "top";
        add("framing", key, camera, key, names, [id], absent);
        add("original", key, camera, key, names, [id], absent);
        manifest.rows[manifest.rows.length - 1]!.automaticCamera = part.topCamera === undefined;
        sectionRows.push(manifest.rows.pop()!);
      }
      if (rings.length === 0) add("original", scope + ":top", part.topCamera ?? "top", scope, names, [], "No available raw top rings; closing poles and missing sections are not invented");
      const failures: { producer?: string; detail?: string }[] = Array.isArray(provenance.sourceCurveDiagnostics) ? provenance.sourceCurveDiagnostics as { producer?: string; detail?: string }[] : [];
      for (const failure of failures) {
        if (failure.producer !== "view." + part.name || !/^top\.\d+/.test(failure.detail ?? "")) continue;
        const suffix: string = /^top\.\d+/.exec(failure.detail!)![0];
        add("original", scope + ":" + suffix, part.topCamera ?? "top", scope, names, [], failure.detail);
      }
    }

    for (const group of plan.groups) {
      const scope: string = "group:" + group.id;
      const missing: string[] = group.parts.filter((name: string): boolean => !manifest.originalParts.includes(name));
      const reason: string | undefined = missing.length === 0 ? undefined : "Connection group has unavailable original members: " + missing.join(",");
      scopes.push({ id: scope, names: group.parts });
      const ids: string[] = idsOf(group.parts);
      add("framing", scope, "front", scope, group.parts, ids, reason);
      for (const camera of cameras) add("original", scope, camera, scope, group.parts, ids, reason);
    }

    // Section-underlay observations share one loft-style subject after the complete clay block.
    for (const next of sectionRows) {
      next.id = "s" + String(manifest.rows.length).padStart(4, "0");
      next.stage = "original-sections";
      manifest.rows.push(next);
    }

    // One fixed requested raw document serves these scopes; scoped packets do not ask for the whole tree.
    if (plan.raw !== false) for (const scope of scopes)
      for (const camera of cameras)
        for (const stage of ["raw-curves", "raw-overlay", "raw-clay"] as const) {
          const missing: string[] = scope.names.filter((name: string): boolean => !manifest.originalParts.includes(name));
          add(stage, scope.id, camera, scope.id, scope.names, null, missing.length === 0 ? undefined : "Raw scope has unavailable original members: " + missing.join(","));
          manifest.rows[manifest.rows.length - 1]!.piece = plan.scope === undefined ? "source.parts:tree" : "source.parts:" + plan.scope.join(",");
        }
    if (plan.final)
      for (const camera of cameras) add("final-clay", overview, camera, overview, manifest.originalParts, []);
  }

  /** A stable numeric id keeps server round names below their existing sixty-four-character limit. */
  function row(index: number, stage: P.Stage, scope: string, camera: P.Camera, frameKey: string, names: string[], curveIds: string[] | null): P.Row {
    return { id: "s" + String(index).padStart(4, "0"), stage, scope, camera, automaticCamera: false, frameKey, names, piece: null, curveIds, status: "pending", error: null, failureKind: null, artifact: null, startedUtc: null, endedUtc: null, elapsedMilliseconds: null };
  }
}

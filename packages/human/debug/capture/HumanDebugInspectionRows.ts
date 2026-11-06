import { HumanDebugInspectionPlan } from "./HumanDebugInspectionPlan";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** Inventory-driven plan expansion. Geometry and source membership come only from the real snapshot. */
export namespace HumanDebugInspectionRows {
  /** The first retained reference-only frame discovers source identity and the complete inventory. */
  export function initial(): P.Row {
    return row(0, "inventory", "inventory", "front", "reference", [], []);
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
    for (const camera of manifest.plan.referenceCameras ?? HumanDebugInspectionPlan.REFERENCE_CAMERAS) add("reference", "whole", camera, []);
    for (const scope of [{ id: "whole", names: [] }, ...manifest.plan.parts.map((part: P.Part): { id: string; names: string[] } => ({ id: "part:" + part.name, names: [part.name] })), ...manifest.plan.groups.map((group: P.Group): { id: string; names: string[] } => ({ id: "group:" + group.id, names: group.parts }))])
      for (const camera of cameras) {
        add("original", scope.id, camera, scope.names);
        for (const stage of ["raw-curves", "raw-overlay", "raw-clay"] as const) add(stage, scope.id, camera, scope.names);
      }
    for (const part of manifest.plan.parts) {
      for (const edge of HumanDebugInspectionPlan.EDGES) add("original", "curve:" + part.name + "/" + edge, part.outlineCameras?.[edge] ?? "front", [part.name]);
      add("original", "part:" + part.name + ":top-inventory-unavailable", part.topCamera ?? "top", [part.name]);
    }
    if (manifest.plan.final) for (const camera of cameras) add("final-clay", "whole", camera, []);
    manifest.notes.push("Raw top count is unknown because inventory failed; no unobserved ring is counted complete.");
    if (manifest.plan.allParts) {
      add("original", "all-parts:inventory-unavailable", "front", []);
      manifest.notes.push("All-parts enumeration is unavailable because the actual tree inventory failed; unknown parts are not counted complete.");
    }
  }

  /** Expand only requested parts and neighbours, never every part times every ring times every camera. */
  export function expand(manifest: P.Manifest, receipt: P.Receipt): void {
    const provenance: Record<string, unknown> = receipt.snapshot.provenance ?? {};
    const observation: { treeParts?: unknown } = (provenance.observation ?? {}) as { treeParts?: unknown };
    if (!Array.isArray(observation.treeParts) || !observation.treeParts.every((name: unknown): boolean => typeof name === "string"))
      throw new Error("The inventory snapshot exposes no actual production-tree names");
    manifest.treeParts = [...observation.treeParts] as string[];
    manifest.originalIds = receipt.snapshot.inventory.curves.filter((id: string): boolean =>
      manifest.treeParts.some((name: string): boolean => id.startsWith("human.construction.view." + name + "/")));
    const plan: P = manifest.plan;
    const parts: P.Part[] = plan.allParts
      ? [...manifest.treeParts.map((name: string): P.Part => plan.parts.find((part: P.Part): boolean => part.name === name) ?? { name }), ...plan.parts.filter((part: P.Part): boolean => !manifest.treeParts.includes(part.name))]
      : plan.parts;
    const cameras: P.Camera[] = plan.cameras ?? HumanDebugInspectionPlan.CAMERAS;
    const refs: P.Camera[] = plan.referenceCameras ?? HumanDebugInspectionPlan.REFERENCE_CAMERAS;
    const scopes: { id: string; names: string[] }[] = [{ id: "whole", names: manifest.treeParts }];
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
    add("framing", "whole", "front", "whole", manifest.treeParts, manifest.originalIds);
    for (const camera of refs) add("reference", "whole", camera, "whole", manifest.treeParts, []);
    for (const camera of cameras) add("original", "whole", camera, "whole", manifest.treeParts, manifest.originalIds);

    for (const part of parts) {
      const scope: string = "part:" + part.name;
      const names: string[] = [part.name];
      const ids: string[] = idsOf(names);
      const absent: string | undefined = manifest.treeParts.includes(part.name) ? undefined : "Requested part is absent from the actual production tree";
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
      const missing: string[] = group.parts.filter((name: string): boolean => !manifest.treeParts.includes(name));
      const reason: string | undefined = missing.length === 0 ? undefined : "Connection group has unavailable tree members: " + missing.join(",");
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

    // One raw tree document serves every scope and all three display passes.
    for (const scope of scopes)
      for (const camera of cameras)
        for (const stage of ["raw-curves", "raw-overlay", "raw-clay"] as const) {
          const missing: string[] = scope.names.filter((name: string): boolean => !manifest.treeParts.includes(name));
          add(stage, scope.id, camera, scope.id, scope.names, null, missing.length === 0 ? undefined : "Raw scope has unavailable tree members: " + missing.join(","));
        }
    if (plan.final)
      for (const camera of cameras) add("final-clay", "whole", camera, "whole", manifest.treeParts, []);
  }

  /** A stable numeric id keeps server round names below their existing sixty-four-character limit. */
  function row(index: number, stage: P.Stage, scope: string, camera: P.Camera, frameKey: string, names: string[], curveIds: string[] | null): P.Row {
    return { id: "s" + String(index).padStart(4, "0"), stage, scope, camera, automaticCamera: false, frameKey, names, curveIds, status: "pending", error: null, failureKind: null, artifact: null, startedUtc: null, endedUtc: null, elapsedMilliseconds: null };
  }
}

import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { NodeCanvasInventoryTypes as T } from "./NodeCanvasInventoryTypes";
import { NodeCanvasSourceDisplay as D } from "./NodeCanvasSourceDisplay";

/** Existing inventory display adapters, with source numbers and topology unchanged. */
export namespace NodeCanvasPairs {
  /** Rendering uses already requested producers once; a failed raw is never retried for another row or camera. */
  export async function render(
    session: N.Session,
    input: T.PairSet,
    originals: IHumanInspectionDocument.ICurve[],
    raws: Map<string, T.Raw>,
  ): Promise<void> {
    for (const row of input.rows)
      try {
        const curves: N.Curve[] = originals
          .filter(
            (curve: N.Curve): boolean =>
              row.ids.includes(curve.id) && D.owns(curve, row.names),
          )
          .map(
            (curve: N.Curve): N.Curve => ({
              ...curve,
              colour: "b52653",
              xray: curve.id.endsWith("/axis"),
            }),
          );
        if (
          row.stage === "raw-clay" &&
          row.names.some((name: string): boolean => !raws.has(name))
        )
          throw new Error(
            "Requested raw producer refused; retained failure is not retried: " +
              row.names
                .filter((name: string): boolean => !raws.has(name))
                .join(","),
          );
        const raw: T.Raw | null =
          row.stage === "raw-clay"
            ? D.merge(row.names.map((name: string): T.Raw => raws.get(name)!))
            : null;
        const actual: string[] =
          raw === null
            ? curves.map((curve: N.Curve): string => curve.id)
            : raw.meshes.map((mesh: N.Mesh): string => mesh.id);
        if (
          row.ids.length !== actual.length ||
          !row.ids.every((id: string): boolean => actual.includes(id))
        )
          throw new Error(
            "Actual Node producer IDs differ from the Vite selected stage",
          );
        const reference: N.Mesh[] =
          row.referenceIds.length === 0
            ? []
            : D.crop(
                session,
                row.referencePatterns,
                originals.filter(
                  (curve: IHumanInspectionDocument.ICurve): boolean =>
                    D.owns(curve, row.names),
                ),
              );
        const actualReference: string[] = reference.map(
          (mesh: N.Mesh): string => mesh.id,
        );
        if (
          actualReference.length !== row.referenceIds.length ||
          !row.referenceIds.every((id: string): boolean =>
            actualReference.includes(id),
          )
        )
          throw new Error(
            "Actual native reference selection differs from the saved scene; no replacement underlay is supplied",
          );
        await session.capture(
          "vite-pair." + row.id,
          row.stage,
          row.camera,
          [...reference, ...(raw?.meshes ?? [])],
          raw === null ? curves : [],
          row.lineMode,
        );
        input.results.push({
          id: row.id,
          status: "rendered-not-parity-accepted",
          stage: row.stage,
          names: row.names,
          ...row.evidence,
          referenceIds: row.referenceIds,
          referencePatterns: row.referencePatterns,
          lineMode: row.lineMode,
          displayDifferences: row.differences,
          rawIssues: raw?.issues ?? [],
          limitations:
            "Actual orthographic camera, canvas and selected IDs reused; flat clay, 1px lines and no AA differ from Vite PBR/tubes. Runtime epoch and appearance parity require independent checks.",
        });
      } catch (error: unknown) {
        input.results.push({
          id: row.id,
          stage: row.stage,
          names: row.names,
          ...row.evidence,
          status: "unavailable",
          error: R.message(error),
        });
      }
  }

  /** Row domains remain explicit instead of treating a partial capture as overall success. */
  export function counts(input?: T.PairSet): Record<string, number> {
    return input === undefined
      ? {}
      : {
          pairRequested: input.requested,
          pairRendered: input.results.filter(
            (row: Record<string, unknown>): boolean =>
              row.status === "rendered-not-parity-accepted",
          ).length,
          pairUnavailable: input.results.filter(
            (row: Record<string, unknown>): boolean =>
              row.status === "unavailable",
          ).length,
          pairInputFailures: input.inputFailures,
          pairDisplayDifferences: input.results.filter(
            (row: Record<string, unknown>): boolean =>
              Array.isArray(row.displayDifferences) &&
              row.displayDifferences.length !== 0,
          ).length,
        };
  }
}

import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";

/** Seven-direction group context and one best-visible individual reference overlay per exact original ID; unclear shapes require a later explicit angle. */
export async function NodeCanvasOriginals(
  session: N.Session,
  scope: string,
  curves: readonly N.Curve[],
  reference: readonly N.Mesh[],
  detailed: boolean,
): Promise<{ scope: string; stage: string; error: string }[]> {
  const failures: { scope: string; stage: string; error: string }[] = [];
  const points: N.Point[] = curves.flatMap((curve: N.Curve): N.Point[] => [
    ...curve.points,
  ]);
  if (curves.length === 0 || points.length === 0 || reference.length === 0) {
    failures.push({
      scope,
      stage: "original-part",
      error: "Original group or its required reference is unavailable",
    });
    return failures;
  }
  for (const name of NodeCanvasCamera.names())
    await capture(scope, "original-part", name, curves);
  for (const curve of curves) {
    if (
      curve.id.length === 0 ||
      curve.points.length < 2 ||
      curve.points.some(
        (point: N.Point): boolean => !point.every(Number.isFinite),
      )
    ) {
      failures.push({
        scope: curve.id,
        stage: "original-individual",
        error: "The actual original curve is empty or nonfinite",
      });
      continue;
    }
    const best: string = NodeCanvasCamera.direction(curve.points);
    await capture(curve.id, "original-individual", best, [curve]);
  }
  return failures;

  /** Reuses already-evaluated geometry; an image failure never rebuilds its producer. */
  async function capture(
    id: string,
    stage: string,
    name: string,
    selected: readonly N.Curve[],
  ): Promise<void> {
    try {
      const camera: N.Camera = NodeCanvasCamera.fit(
        name,
        stage === "original-individual"
          ? selected.flatMap((curve: N.Curve): readonly N.Point[] => curve.points)
          : points,
      );
      await session.capture(
        id,
        stage,
        detailed ? { ...camera, annotations: false } : camera,
        reference,
        selected,
        "xray",
      );
    } catch (error: unknown) {
      failures.push({
        scope: id,
        stage,
        error:
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error),
      });
    }
  }
}

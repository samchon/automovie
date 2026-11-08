import {
  autoMovieDrawingCutEdges,
  type IAutoMovieDrawingTriangle,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanTorsoObservation } from "./HumanTorsoObservation";
import { NodeCanvasCamera } from "./NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/**
 * Compare actual horizontal source sections with independent native-reference plane cuts.
 *
 * The existing engine cutter retains its metre tolerance, skips tangent/coplanar
 * triangles and emits unjoined segments. These are cuts of the supplied triangle
 * mesh, not recovered smooth curves or generated skin. No cut enters generation.
 *
 * @evidence contracts/common.md#principled-implementation Reads the actual source plane height and cuts the unchanged reference triangles with the existing engine plane owner; no slab projection or whole-mesh silhouette stands in for that section.
 * @evidence contracts/common.md#clear-and-simple-design Adapts native display buffers to the existing cutter and returns display-only selections for the existing PNG entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit, join, close, repair or use the cut to modify any generated source. Tangencies and empty cuts remain the cutter's stated limits.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes exact triangle-plane interpolation and its tolerance from a smooth anatomical section, ordered loop, final skin or shape acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Converts T triangles once, then performs the existing O(T) cut per distinct requested source plane and retains its emitted segments.
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate source planes share one call-owned reference cut; both existing camera directions borrow the same unchanged samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Triangles and the finite plane map are local; returned display buffers belong to the observation packet and retain no file, renderer, generation or global cache.
 */
export function HumanInspectionReferencePlanes(
  meshes: readonly N.Mesh[],
  selections: readonly HumanTorsoObservation.ISelection[],
): HumanTorsoObservation.ISelection[] {
  const source: Map<string, N.Curve> = new Map();
  for (const selection of selections)
    for (const curve of selection.curves)
      if (curve.id.startsWith("S00.composed.plane.") || /\/S00\.plane\.acromion\/S00\.outer\.q[03]$/.test(curve.id)) source.set(curve.id, curve);
  const triangles: IAutoMovieDrawingTriangle[] = [];
  for (const mesh of meshes) {
    const point: (index: number) => IAutoMovieVector3 = (index: number): IAutoMovieVector3 => ({
      x: mesh.positions[3 * index]!, y: mesh.positions[3 * index + 1]!, z: mesh.positions[3 * index + 2]!,
    });
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      triangles.push({ a: point(mesh.indices[i]!), b: point(mesh.indices[i + 1]!), c: point(mesh.indices[i + 2]!) });
  }
  const cuts: Map<number, N.Curve[]> = new Map();
  return [...source.values()].map((curve: N.Curve): HumanTorsoObservation.ISelection => {
    const y: number | undefined = curve.points[0]?.[1];
    if (y === undefined || !Number.isFinite(y) || !curve.points.every((p: N.Point): boolean => p.every(Number.isFinite) && p[1] === y))
      throw new Error("Reference comparison requires an actual finite horizontal source plane: " + curve.id);
    let reference: N.Curve[] | undefined = cuts.get(y);
    if (reference === undefined) {
      reference = autoMovieDrawingCutEdges({
        origin: { x: 0, y, z: 0 }, normal: { x: 0, y: 1, z: 0 },
        right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 },
      }, triangles).map((edge: ReturnType<typeof autoMovieDrawingCutEdges>[number], i: number): N.Curve => ({
        id: "reference.native.plane." + y + ".segment." + i,
        points: [[edge.from.x, edge.from.y, edge.from.z], [edge.to.x, edge.to.y, edge.to.z]],
        closed: false, colour: "525252",
      }));
      if (reference.length === 0) throw new Error("Native reference has no straddling triangle cut at source height " + y);
      cuts.set(y, reference);
    }
    const curves: N.Curve[] = [...reference, curve];
    return {
      id: curve.id + ".same-plane-reference", curves,
      cameras: ["top", "high-oblique"].map((name: string): N.Camera => ({
        ...NodeCanvasCamera.fit(name, curves.flatMap((item: N.Curve): readonly N.Point[] => item.points)), annotations: false,
      })),
    };
  });
}

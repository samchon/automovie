import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasisSurface } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasisEye } from "../../structures/IAutoMovieHumanFaceBasisEye";
import type { IAutoMovieHumanFaceOpticalSupportGaze } from "../../structures/IAutoMovieHumanFaceOpticalSupportGaze";
import type { IHumanBasisRegionCorners } from "../../../common/structures/IHumanBasisRegionCorners";
import type { IAutoMovieHumanFaceOpticalSupportAnterior } from "../../structures/IAutoMovieHumanFaceOpticalSupportAnterior";
import type { IAutoMovieHumanFaceOpticalSupportTarget } from "../../structures/IAutoMovieHumanFaceOpticalSupportTarget";

import { Vector3 } from "@automovie/engine";

import { humanBasisRegionCorners } from "../../../common/basis/humanBasisRegionCorners";
import type { evaluateHumanFaceRest } from "../../basis/evaluateHumanFaceRest";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOpticalSupport } from "../../structures/IAutoMovieHumanFaceOpticalSupport";

/**
 * Register supplied optics on an exact source chart in the shaped head frame.
 *
 * The complete native component's neutral XYZ, UV, oriented incidence and
 * weight-one attachment must match the producer witnesses. The neutral chart
 * must face the declared source axis and lie on its independently recorded
 * line. The line check permits only a Float64 arithmetic bound, 32 epsilon
 * times the operand coordinate scale, not a clinical or mesh-fit tolerance.
 * Max-projection vertices cannot substitute for this axis hit.
 *
 * An active endpoint that moves this eye or its rigid pivot needs exact
 * producer-enrolled sparse rows. A data-defined zero endpoint passes directly;
 * it is not a clinical zero. The shaped chart transports the same barycentric
 * point; the source axis/reference convention stays fixed for the qualified
 * translational population. No new optical axis is fitted after gaze.
 *
 * @evidence contracts/common.md#principled-implementation Complete neutral XYZ/UV/oriented incidence, exclusive weight-one ownership and exact enrolled active endpoint rows register the shaped source chart on its qualified axis.
 * @evidence contracts/common.md#clear-and-simple-design Native registration owns optical placement while profile scalars and later rigid motion remain independent owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raw digest spelling is checked but source bytes are not rehashed here; translational endpoint qualification and the 32-epsilon line check cannot imply general rotation or clinical fit.
 * @evidence contracts/common.md#meaningful-documentation The prose states exact producer witnesses, source-axis arithmetic, endpoint enrollment and no gaze refitting.
 * @evidence contracts/performance.md#efficient-algorithms Native/source-region scans and A active endpoint row scans dominate; exact equality compares all enrolled values rather than accepting identity labels alone.
 * @evidence contracts/performance.md#reuse-equivalent-work One native vertex set, UV map, axis and affine chart serve admission and final placement; active endpoints are deduplicated before witness comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned frame owns vectors and its vertex set; admission/endpoint/UV temporaries expire without retaining a task or source handle.
 */
export function resolveHumanFaceOpticalFrame(
  basis: IAutoMovieHumanFaceBasis,
  support: IAutoMovieHumanFaceOpticalSupport,
  shaped: ReturnType<typeof evaluateHumanFaceRest>,
  state: Parameters<typeof evaluateHumanFaceRest>[1],
  apex: number,
): { origin: IAutoMovieVector3; center: IAutoMovieVector3; axis: IAutoMovieVector3; up: IAutoMovieVector3; lateral: IAutoMovieVector3; owner: "leftEye" | "rightEye"; surface: string; vertices: Set<number>; }  {
  const refuse: (cause: string) => never = (cause: string): never => {
    throw new Error(
      "Unqualified independent optical support for " +
        support.owner +
        ": " +
        cause,
    );
  };
  const surfaceIndex: number = basis.surfaces.findIndex(
    (s: IAutoMovieHumanFaceBasisSurface): boolean  => s.id === support.surface,
  );
  const surface: IAutoMovieHumanFaceBasisSurface = basis.surfaces[surfaceIndex];
  const eye: IAutoMovieHumanFaceBasisEye | undefined = basis.articulation?.eyes.find((e: IAutoMovieHumanFaceBasisEye): boolean  => e.id === support.owner);
  const pivotIndex: number = basis.landmarks?.ids.indexOf(eye?.center ?? "") ?? -1;
  if (
    surface === undefined ||
    eye === undefined ||
    pivotIndex < 0 ||
    support.generation.trim() === "" ||
    support.sourceSha256.length === 0 ||
    support.sourceSha256.some((v: string): boolean  => !/^[0-9a-f]{64}$/.test(v))
  )
    return refuse("missing source, generation, attachment owner or provenance");
  const equal: (a: readonly number[], b: readonly number[]) => boolean = (a: readonly number[], b: readonly number[]): boolean  =>
    a.length === b.length && a.every((v: number, i: number): boolean  => v === b[i]);
  if (
    support.rigid.center !== eye.center ||
    support.rigid.gaze.length !== eye.gaze.length ||
    support.rigid.gaze.some(
      (g: IAutoMovieHumanFaceOpticalSupportGaze, at: number): boolean  =>
        g.channel !== eye.gaze[at].channel ||
        !equal(
          [...g.axis, g.degrees, ...g.translation],
          [
            ...eye.gaze[at].axis,
            eye.gaze[at].degrees,
            ...eye.gaze[at].translation,
          ],
        ),
    )
  )
    refuse("stale rigid owner configuration");
  const vertices: Set<number> = new Set(support.vertices);
  if (
    vertices.size === 0 ||
    vertices.size !== support.vertices.length ||
    support.vertices.some(
      (v: number): boolean  =>
        !Number.isSafeInteger(v) || v < 0 || v >= surface.positions.length / 3,
    ) ||
    support.neutralPositions.length !== vertices.size * 3 ||
    support.neutralUvs.length !== support.triangles.length * 2
  )
    refuse("invalid native component witness rows");
  const actualXYZ: number[] = support.vertices.flatMap((v: number): number[]  =>
    surface.positions.slice(v * 3, v * 3 + 3),
  );
  if (!equal(actualXYZ, support.neutralPositions)) refuse("stale neutral XYZ");
  const actualTriangles: number[] = [];
  for (let at: number = 0; at < surface.indices.length; at += 3) {
    const row: number[] = surface.indices.slice(at, at + 3);
    if (row.every((v: number): boolean  => vertices.has(v))) actualTriangles.push(...row);
    else if (row.some((v: number): boolean  => vertices.has(v)))
      refuse("component crosses a native triangle");
  }
  if (!equal(actualTriangles, support.triangles))
    refuse("stale oriented native incidence");
  const weights: Map<number, number> = new Map<number, number>();
  for (const attachment of surface.attachments ?? [])
    for (let at: number = 0; at < attachment.rows.length; at += 2)
      if (vertices.has(attachment.rows[at])) {
        if (
          attachment.owner !== support.owner ||
          weights.has(attachment.rows[at])
        )
          refuse("component is not exclusively bound to its named eye");
        weights.set(attachment.rows[at], attachment.rows[at + 1]);
      }
  if (support.vertices.some((v: number): boolean  => weights.get(v) !== 1))
    refuse("attachment is not weight one");
  const cornerUvs: Map<string, number[]> = new Map<string, number[]>();
  for (const region of surface.regions) {
    const corners: IHumanBasisRegionCorners = humanBasisRegionCorners(region);
    if (corners.uvs === null) continue;
    for (let at: number = 0; at < corners.indices.length; at += 3) {
      const render: number[] = corners.indices.slice(at, at + 3);
      const shared: number[] = render.map((r: number): number  => corners.sources[r]);
      if (!shared.every((v: number): boolean  => vertices.has(v))) continue;
      const key: string = shared.join(",");
      if (cornerUvs.has(key)) refuse("ambiguous native UV chart");
      cornerUvs.set(
        key,
        render.flatMap((r: number): number[]  => corners.uvs!.slice(r * 2, r * 2 + 2)),
      );
    }
  }
  const actualUvs: number[] = [];
  for (let at: number = 0; at < actualTriangles.length; at += 3) {
    const pairs: number[] | undefined = cornerUvs.get(actualTriangles.slice(at, at + 3).join(","));
    if (pairs === undefined) refuse("missing native UV correspondence");
    actualUvs.push(...pairs!);
  }
  if (!equal(actualUvs, support.neutralUvs))
    refuse("stale native UV correspondence");
  const triangle: [number, number, number] = support.anterior.triangle;
  const { u, v }: IAutoMovieHumanFaceOpticalSupportAnterior = support.anterior;
  if (
    triangle.some((id: number): boolean  => !vertices.has(id)) ||
    !Number.isFinite(u) ||
    !Number.isFinite(v) ||
    u < 0 ||
    v < 0 ||
    u + v > 1
  )
    refuse("invalid anterior source chart");
  const hasTriangle: boolean = actualTriangles.some(
    (_value: number, at: number): boolean  =>
      at % 3 === 0 &&
      [0, 1, 2].some((shift: number): boolean  =>
        triangle.every(
          (id: number, corner: number): boolean  => id === actualTriangles[at + ((corner + shift) % 3)],
        ),
      ),
  );
  if (!hasTriangle) refuse("anterior chart is not an oriented native triangle");
  const point: (rows: readonly number[], id: number) => IAutoMovieVector3 = (rows: readonly number[], id: number): IAutoMovieVector3  =>
    Vector3.create(rows[id * 3], rows[id * 3 + 1], rows[id * 3 + 2]);
  const affine: (rows: readonly number[]) => IAutoMovieVector3 = (rows: readonly number[]): IAutoMovieVector3  => {
    const [a, b, c]: IAutoMovieVector3[] = triangle.map((id: number): IAutoMovieVector3  => point(rows, id));
    return Vector3.add(
      a,
      Vector3.add(
        Vector3.scale(Vector3.subtract(b, a), u),
        Vector3.scale(Vector3.subtract(c, a), v),
      ),
    );
  };
  const tuple: (values: readonly number[]) => IAutoMovieVector3 = (values: readonly number[]): IAutoMovieVector3  =>
    Vector3.create(values[0], values[1], values[2]);
  if (
    ![...support.axis, ...support.axisOrigin, ...support.reference, apex].every(
      Number.isFinite,
    ) ||
    apex <= 0 ||
    Vector3.length(tuple(support.axis)) === 0 ||
    Vector3.length(tuple(support.reference)) === 0
  )
    refuse("invalid source axis or reference");
  const axis: IAutoMovieVector3 = Vector3.normalize(tuple(support.axis));
  const neutral: IAutoMovieVector3 = affine(surface.positions);
  const lineError: number = Vector3.length(
    Vector3.cross(Vector3.subtract(neutral, tuple(support.axisOrigin)), axis),
  );
  const scale: number = Math.max(
    ...support.axisOrigin.map(Math.abs),
    Math.abs(neutral.x),
    Math.abs(neutral.y),
    Math.abs(neutral.z),
  );
  if (!Number.isFinite(lineError) || lineError > 32 * Number.EPSILON * scale)
    refuse("anterior chart is off the source axis");
  const [a, b, c]: IAutoMovieVector3[] = triangle.map((id: number): IAutoMovieVector3  => point(surface.positions, id));
  const facing: number = Vector3.dot(
    Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    axis,
  );
  if (!Number.isFinite(facing) || facing <= 0)
    refuse("anterior chart faces away from the source axis");
  const reference: IAutoMovieVector3 = tuple(support.reference);
  const projected: IAutoMovieVector3 = Vector3.subtract(
    reference,
    Vector3.scale(axis, Vector3.dot(reference, axis)),
  );
  if (
    ![projected.x, projected.y, projected.z].every(Number.isFinite) ||
    Vector3.length(projected) === 0
  )
    refuse("source reference is parallel to axis");
  const up: IAutoMovieVector3 = Vector3.normalize(projected);
  const lateral: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(up, axis));
  const rowsFor: (rows: readonly number[] | undefined, selected: ReadonlySet<number>) => number[] = (
    rows: readonly number[] | undefined,
    selected: ReadonlySet<number>,
  ): number[]  => {
    const out: number[] = [];
    for (let at: number = 0; at < (rows?.length ?? 0); at += 4)
      if (selected.has(rows![at])) out.push(...rows!.slice(at, at + 4));
    return out;
  };
  const active: Set<string> = new Set<string>();
  for (const channel of basis.channels) {
    const weight: number = state.weights.get(channel.id) ?? 0;
    if (weight !== 0)
      active.add(weight < 0 ? channel.negative! : channel.positive);
  }
  for (const corrective of state.activations)
    if (corrective.activation > 0) active.add(corrective.target);
  for (const target of active) {
    const surfaceRows: number[] = rowsFor(surface.targets[target], vertices);
    const pivotRows: number[] = rowsFor(
      basis.landmarks!.targets[target],
      new Set([pivotIndex]),
    );
    if (
      surfaceRows.every((_n: number, at: number): boolean  => at % 4 === 0 || surfaceRows[at] === 0) &&
      pivotRows.every((_n: number, at: number): boolean  => at % 4 === 0 || pivotRows[at] === 0)
    )
      continue;
    const witness: IAutoMovieHumanFaceOpticalSupportTarget | undefined = support.targets.find((t: IAutoMovieHumanFaceOpticalSupportTarget): boolean  => t.id === target);
    if (
      witness === undefined ||
      !equal(surfaceRows, witness.surfaceRows) ||
      !equal(pivotRows, witness.pivotRows)
    )
      refuse("unqualified nonzero endpoint " + target);
  }
  const origin: IAutoMovieVector3 = affine(shaped.surfaces[surfaceIndex]);
  const center: IAutoMovieVector3 = Vector3.subtract(origin, Vector3.scale(axis, apex));
  if (
    ![origin.x, origin.y, origin.z, center.x, center.y, center.z].every(
      Number.isFinite,
    )
  )
    refuse("shaped source chart or profile placement is not finite");
  return {
    origin,
    center,
    axis,
    up,
    lateral,
    owner: support.owner,
    surface: support.surface,
    vertices,
  };
}

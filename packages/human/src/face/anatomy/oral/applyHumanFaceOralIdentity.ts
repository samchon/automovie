import type {
  IAutoMovieHumanFaceOralArch as ImportedIAutoMovieHumanFaceOralArch,
  IAutoMovieHumanFaceOralTooth as ImportedIAutoMovieHumanFaceOralTooth,
  IHumanFaceOralCrown as ImportedIHumanFaceOralCrown,
} from "@automovie/human";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOral } from "../../structures/IAutoMovieHumanFaceOral";
import { assertHumanFaceOralSupport } from "./assertHumanFaceOralSupport";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";

/**
 * Shape the actual source crowns, arches and tongue before rigid articulation. Crown axes use the source head frame: transverse, vertical and anterior. These coarse authored extents are not measured clinical mesiodistal axes. Crown sizing is centred on its cervical port, while arch dimensions place cervical centres independently. Original ordinals and connectivity remain available to source replay, incisors, dental colliders and common gingiva. Tongue tip performance fades from the source root; tongue sizing scales about its centroid. Omit oral.performance for the shape-only reference. Inputs remain immutable and omission of oral returns the original map without allocating.
 *
 * @evidence contracts/common.md#principled-implementation Registered crown extents scale about cervical ports while independent arch dimensions place their centres before jaw articulation.
 * @evidence contracts/common.md#clear-and-simple-design Source ordinals/topology survive; tongue sizing uses a centroid scale, dorsum rise uses a sine envelope, and tip performance uses a squared root-to-tip fraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head-axis extents are coarse authored dimensions rather than clinical tooth axes; omitted oral input returns the original map and nonfinite Float32 output refuses.
 * @evidence contracts/common.md#meaningful-documentation Named millimetres convert once to source metres and shape-only reference omits independent tongue performance.
 * @evidence contracts/performance.md#efficient-algorithms Native crown extraction and per-crown/per-tongue extent scans dominate before linear coordinate updates and final finite checks.
 * @evidence contracts/performance.md#reuse-equivalent-work One read/admitted crown population is shared across arch and crown lowering, though extent reductions currently repeat per axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only changed dental/tongue arrays are copied, the result map shares untouched source arrays and no identity-history cache persists.
 *
 * @author Samchon
 */
export function applyHumanFaceOralIdentity(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  oral: IAutoMovieHumanFaceOral | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (oral === undefined) return positions;
  const result: Map<string, readonly number[]> = new Map(positions);
  const dental: number[] = [...(positions.get("Human.teeth_base") ?? [])];
  const crowns: ImportedIHumanFaceOralCrown[] = readHumanFaceOralCrowns(basis);
  assertHumanFaceOralSupport(basis, crowns);
  const centre: (
    vertices: readonly number[],
    array: readonly number[],
  ) => number[] = (
    vertices: readonly number[],
    array: readonly number[],
  ): number[] =>
    [0, 1, 2].map(
      (axis: number): number =>
        vertices.reduce(
          (sum: number, v: number): number => sum + array[3 * v + axis],
          0,
        ) / vertices.length,
    );
  const extent: (
    vertices: readonly number[],
    array: readonly number[],
    axis: number,
  ) => number = (
    vertices: readonly number[],
    array: readonly number[],
    axis: number,
  ): number =>
    Math.max(...vertices.map((v: number): number => array[3 * v + axis])) -
    Math.min(...vertices.map((v: number): number => array[3 * v + axis]));
  const dimension: (
    value: number | undefined,
    fallback: number,
    label: string,
  ) => number = (
    value: number | undefined,
    fallback: number,
    label: string,
  ): number => {
    if (value === undefined) return fallback;
    const metres: number = value / 1000;
    if (!Number.isFinite(metres) || metres <= 0)
      throw new Error(
        "Oral " + label + " needs positive finite representable millimetres.",
      );
    return metres;
  };
  const offset: (value: number | undefined) => number = (
    value: number | undefined,
  ): number => {
    if (value !== undefined && !Number.isFinite(value))
      throw new Error("Oral offsets need finite millimetres.");
    return (value ?? 0) / 1000;
  };
  for (const mandibular of [false, true]) {
    const members: ImportedIHumanFaceOralCrown[] = crowns.filter(
      (crown: ImportedIHumanFaceOralCrown): boolean =>
        crown.mandibular === mandibular,
    );
    const centres: number[][] = members.map(
      (crown: ImportedIHumanFaceOralCrown): number[] =>
        centre(crown.cervical, dental),
    );
    const pivot: number[] = [0, 1, 2].map(
      (axis: number): number =>
        centres.reduce(
          (sum: number, point: number[]): number => sum + point[axis],
          0,
        ) / centres.length,
    );
    const settings: ImportedIAutoMovieHumanFaceOralArch | undefined = mandibular
      ? oral.mandibular
      : oral.maxillary;
    const width: number =
      Math.max(...centres.map((p: number[]): number => p[0])) -
      Math.min(...centres.map((p: number[]): number => p[0]));
    const depth: number =
      Math.max(...centres.map((p: number[]): number => p[2])) -
      Math.min(...centres.map((p: number[]): number => p[2]));
    const sx: number =
      dimension(settings?.widthMm, width, "arch width") / width;
    const sz: number =
      dimension(settings?.depthMm, depth, "arch depth") / depth;
    members.forEach(
      (crown: ImportedIHumanFaceOralCrown, index: number): void => {
        const setting: ImportedIAutoMovieHumanFaceOralTooth | undefined =
          oral.teeth?.[
            crown.id as keyof NonNullable<IAutoMovieHumanFaceOral["teeth"]>
          ];
        const root: number[] = centres[index];
        const scales: number[] = [
          dimension(
            setting?.widthMm,
            extent(crown.vertices, dental, 0),
            "crown width",
          ),
          dimension(
            setting?.heightMm,
            extent(crown.vertices, dental, 1),
            "crown height",
          ),
          dimension(
            setting?.depthMm,
            extent(crown.vertices, dental, 2),
            "crown depth",
          ),
        ].map(
          (value: number, axis: number): number =>
            value / extent(crown.vertices, dental, axis),
        );
        const placed: number[] = [
          pivot[0] + (root[0] - pivot[0]) * sx,
          root[1] + offset(settings?.elevationMm),
          pivot[2] + (root[2] - pivot[2]) * sz + offset(settings?.projectionMm),
        ];
        for (const vertex of crown.vertices)
          for (let axis: number = 0; axis < 3; axis++)
            dental[3 * vertex + axis] =
              placed[axis] +
              (dental[3 * vertex + axis] - root[axis]) * scales[axis];
      },
    );
  }
  result.set("Human.teeth_base", dental);
  if (oral.tongue !== undefined || oral.performance !== undefined) {
    const tongue: number[] = [...(positions.get("Human.tongue01") ?? [])];
    if (tongue.length === 0)
      throw new Error(
        "Oral tongue identity needs its registered source tongue.",
      );
    const vertices: number[] = Array.from(
      { length: tongue.length / 3 },
      (_: unknown, v: number): number => v,
    );
    const pivot: number[] = centre(vertices, tongue);
    const dimensions: (number | undefined)[] = [
      oral.tongue?.widthMm,
      oral.tongue?.heightMm,
      oral.tongue?.lengthMm,
    ];
    const scales: number[] = dimensions.map(
      (value: number | undefined, axis: number): number =>
        dimension(value, extent(vertices, tongue, axis), "tongue dimension") /
        extent(vertices, tongue, axis),
    );
    const back: number = Math.min(
      ...vertices.map((v: number): number => tongue[3 * v + 2]),
    );
    const reach: number = extent(vertices, tongue, 2);
    for (const vertex of vertices) {
      const t: number = (tongue[3 * vertex + 2] - back) / reach;
      for (let axis: number = 0; axis < 3; axis++)
        tongue[3 * vertex + axis] =
          pivot[axis] +
          (tongue[3 * vertex + axis] - pivot[axis]) * scales[axis];
      tongue[3 * vertex] +=
        offset(oral.performance?.tongueTipLateralMm) * t * t;
      tongue[3 * vertex + 1] +=
        offset(oral.tongue?.dorsumRiseMm) * Math.sin(Math.PI * t) ** 2 +
        offset(oral.performance?.tongueTipLiftMm) * t * t;
      tongue[3 * vertex + 2] +=
        offset(oral.performance?.tongueTipAdvanceMm) * t * t;
    }
    result.set("Human.tongue01", tongue);
  }
  for (const array of result.values())
    if (
      !array.every(
        (value: number): boolean =>
          Number.isFinite(value) && Number.isFinite(Math.fround(value)),
      )
    )
      throw new Error(
        "Oral identity exceeds finite Float32 source coordinates.",
      );
  return result;
}

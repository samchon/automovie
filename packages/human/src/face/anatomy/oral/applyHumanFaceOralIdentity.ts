import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOral } from "../../structures/IAutoMovieHumanFaceOral";
import { assertHumanFaceOralSupport } from "./assertHumanFaceOralSupport";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";

/**
 * Shape the actual source crowns, arches and tongue before rigid articulation.
 * Crown axes use the source head frame: transverse, vertical and anterior.
 * These coarse authored extents are not measured clinical mesiodistal axes.
 * Crown sizing is centred on its cervical port, while arch dimensions place
 * cervical centres independently. Original ordinals and connectivity remain
 * available to source replay, incisors, dental colliders and common gingiva.
 * Tongue identity and independent tip performance fade from the source root.
 * Call with performance omitted for the shape-only reference. Inputs remain
 * immutable and omission returns the original map without allocating.
 * @evidence contracts/common.md#principled-implementation Source-port centres separate crown size from arch placement, and the same transformed arrays feed rigid articulation and contact.
 * @evidence contracts/common.md#clear-and-simple-design One numerical identity owner changes existing source arrays; assembly alone constructs the lining.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hidden clamp, clinical mean, personal mesh or ordinal-grade conversion enters.
 * @evidence contracts/modeling.md#parameter-channels Independent crown extents, arch centre placement, tongue identity and root-faded tongue performance retain their separate inputs.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres convert once into Y-up head-frame metres before the existing jaw transform.
 * @evidence contracts/modeling.md#shared-boundaries Crown cervical ordinals remain exact shared ports for the gingival producer.
 * @evidence contracts/anatomy.md#anatomical-source Licensed coarse source crowns and tongue are transformed by authored extents; clinical long axes and tissue mechanics remain unknown.
 * @evidence contracts/anatomy.md#permitted-range Nonpositive dimensions and nonfinite or unrepresentable transformed coordinates refuse without replacing the input.
 * @evidence contracts/anatomy.md#parametric-authority Only named dimensions and tip motions enter.
 * @author Samchon
 */
export function applyHumanFaceOralIdentity(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  oral: IAutoMovieHumanFaceOral | undefined,
): ReadonlyMap<string, readonly number[]> {
  if (oral === undefined) return positions;
  const result = new Map(positions);
  const dental = [...(positions.get("Human.teeth_base") ?? [])];
  const crowns = readHumanFaceOralCrowns(basis);
  assertHumanFaceOralSupport(basis, crowns);
  const centre = (
    vertices: readonly number[],
    array: readonly number[],
  ): number[] =>
    [0, 1, 2].map(
      (axis) =>
        vertices.reduce((sum, v) => sum + array[3 * v + axis], 0) /
        vertices.length,
    );
  const extent = (
    vertices: readonly number[],
    array: readonly number[],
    axis: number,
  ): number =>
    Math.max(...vertices.map((v) => array[3 * v + axis])) -
    Math.min(...vertices.map((v) => array[3 * v + axis]));
  const dimension = (
    value: number | undefined,
    fallback: number,
    label: string,
  ): number => {
    if (value === undefined) return fallback;
    const metres = value / 1000;
    if (!Number.isFinite(metres) || metres <= 0)
      throw new Error(
        "Oral " + label + " needs positive finite representable millimetres.",
      );
    return metres;
  };
  const offset = (value: number | undefined): number => {
    if (value !== undefined && !Number.isFinite(value))
      throw new Error("Oral offsets need finite millimetres.");
    return (value ?? 0) / 1000;
  };
  for (const mandibular of [false, true]) {
    const members = crowns.filter((crown) => crown.mandibular === mandibular);
    const centres = members.map((crown) => centre(crown.cervical, dental));
    const pivot = [0, 1, 2].map(
      (axis) =>
        centres.reduce((sum, point) => sum + point[axis], 0) / centres.length,
    );
    const settings = mandibular ? oral.mandibular : oral.maxillary;
    const width =
      Math.max(...centres.map((p) => p[0])) -
      Math.min(...centres.map((p) => p[0]));
    const depth =
      Math.max(...centres.map((p) => p[2])) -
      Math.min(...centres.map((p) => p[2]));
    const sx = dimension(settings?.widthMm, width, "arch width") / width;
    const sz = dimension(settings?.depthMm, depth, "arch depth") / depth;
    members.forEach((crown, index) => {
      const setting =
        oral.teeth?.[
          crown.id as keyof NonNullable<IAutoMovieHumanFaceOral["teeth"]>
        ];
      const root = centres[index];
      const scales = [
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
      ].map((value, axis) => value / extent(crown.vertices, dental, axis));
      const placed = [
        pivot[0] + (root[0] - pivot[0]) * sx,
        root[1] + offset(settings?.elevationMm),
        pivot[2] + (root[2] - pivot[2]) * sz + offset(settings?.projectionMm),
      ];
      for (const vertex of crown.vertices)
        for (let axis = 0; axis < 3; axis++)
          dental[3 * vertex + axis] =
            placed[axis] +
            (dental[3 * vertex + axis] - root[axis]) * scales[axis];
    });
  }
  result.set("Human.teeth_base", dental);
  if (oral.tongue !== undefined || oral.performance !== undefined) {
    const tongue = [...(positions.get("Human.tongue01") ?? [])];
    if (tongue.length === 0)
      throw new Error(
        "Oral tongue identity needs its registered source tongue.",
      );
    const vertices = Array.from({ length: tongue.length / 3 }, (_, v) => v);
    const pivot = centre(vertices, tongue);
    const dimensions = [
      oral.tongue?.widthMm,
      oral.tongue?.heightMm,
      oral.tongue?.lengthMm,
    ];
    const scales = dimensions.map(
      (value, axis) =>
        dimension(value, extent(vertices, tongue, axis), "tongue dimension") /
        extent(vertices, tongue, axis),
    );
    const back = Math.min(...vertices.map((v) => tongue[3 * v + 2]));
    const reach = extent(vertices, tongue, 2);
    for (const vertex of vertices) {
      const t = (tongue[3 * vertex + 2] - back) / reach;
      for (let axis = 0; axis < 3; axis++)
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
        (value) =>
          Number.isFinite(value) && Number.isFinite(Math.fround(value)),
      )
    )
      throw new Error(
        "Oral identity exceeds finite Float32 source coordinates.",
      );
  return result;
}

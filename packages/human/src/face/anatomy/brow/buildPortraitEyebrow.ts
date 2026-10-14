import type { IPortraitEyebrowPlacement } from "./IPortraitEyebrowPlacement";
import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { linearInterpolate } from "../../mesh/linearInterpolate";
import { millimetrePoint } from "../../mesh/millimetrePoint";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { sweepEightSidedTube } from "../../mesh/sweepEightSidedTube";
import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import { assertPortraitEyebrowProfile } from "./assertPortraitEyebrowProfile";
import { portraitEyebrowProfile } from "./portraitEyebrowProfile";
import { resolvePortraitEyebrowPlacement } from "./resolvePortraitEyebrowPlacement";

/**
 * Build brow fibres against the actual refined skin. Boundary vertices define
 * their planar distribution; their interpolated depths are not a substitute for
 * surface contact between those vertices.
 *
 * This builder consumes the forehead surface; it does not construct the
 * supraorbital rim, brow soft-tissue pad, glabella or superior orbital sulcus.
 * Fibre arch is a hair dimension, not a brow-ridge projection. Orbital support
 * and the host's authored skin layers own those surrounding tissue forms.
 *
 * A front-envelope query locates the skin at each fibre sample. Central height
 * differences estimate its local normal over one base fibre radius (at least
 * 0.001 mm). Radius, clearance and arch offset the centreline along that normal.
 * This keeps the cross section clear of a local tangent plane on sloping skin.
 * Curved-surface contact remains subject to the actual rendered inspection.
 *
 * The caller supplies millimetre skin coordinates and retained boundary IDs.
 * The acceleration structure uses engine metres; emitted parts use createMetricMeshPart
 * for their final metric conversion. Zero fibres produce no parts. Counts above
 * 4096 refuse rather than allocating an unbounded brow mesh population.
 *
 * The skin is treated as a single-valued height field over the head's XY
 * plane (the frontmost hit along +Z), which holds over the forehead and brow
 * band where the surface faces forward and is not valid on an overhang. Each
 * fibre `i` of `n` roots at fraction `(i + 0.5) / n` along the brow and at a
 * band height set by the golden-ratio sequence, so the roots are evenly
 * spread and replay identically. Thinning removes whole fibres by an
 * end-fade envelope and keeps the original index in the part id
 * (`<side>-brow-hair-<i>`), so an unchanged fibre keeps its identity when a
 * neighbour is removed. Each fibre is one part in the `brows` finish: a
 * ribbon of `2 * (segments + 1)` vertices, or an eight-sided tube.
 * A non-finite dimension, a boundary without a side or with fewer than two
 * identities per edge or an identity outside the skin, a root that leaves the
 * supporting skin, a fibre whose path along the skin has zero length and a
 * ribbon with no projected tangent throw.
 *
 * @evidence contracts/common.md#principled-implementation The procedural branch assumes a single-valued forward XY forehead height field and uses front depth plus finite-difference normals to place deterministic fibres.
 * @evidence contracts/common.md#clear-and-simple-design Central profile/placement owners admit dimensions and spellings while shared lattice/tube and metric-part owners construct final parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Overhangs are outside the height-field premise, tangent-plane lift is not curved-skin contact proof, and the procedural branch ignores connected native emergence control.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre/engine-metre conversion, fixed normal step basis, deterministic thinning, stable ordinal IDs and named refusal cases.
 * @evidence contracts/performance.md#efficient-algorithms One skin depth acceleration structure serves up to 4096 requested fibres; per surviving fibre work scales with at-most-32 longitudinal samples and fixed tube/ribbon width plus spatial depth queries.
 * @evidence contracts/performance.md#reuse-equivalent-work Skin depth sampling and resolved flow are reused across every fibre sample; no effectful source edits or random state are shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no global state; cloned profile, query acceleration and per-fibre closures expire, while returned metric mesh parts scale with surviving sample population.
 */
export function buildPortraitEyebrow(
  skin: IControlMesh,
  binding: IPortraitEyebrowBinding,
  fibres: number,
  input: IPortraitEyebrowProfile = portraitEyebrowProfile,
): IAutoMovieModelPart[] {
  const shape: IPortraitEyebrowProfile = structuredClone(input);
  assertPortraitEyebrowProfile(shape, fibres);
  if (fibres === 0) return [];
  const {
    flow,
    rootBand,
    endFade: ends,
  }: IPortraitEyebrowPlacement = resolvePortraitEyebrowPlacement(shape);
  if (
    (binding.side !== "left" && binding.side !== "right") ||
    binding.upper.length < 2 ||
    binding.lower.length < 2 ||
    [...binding.upper, ...binding.lower].some(
      (id: number): boolean  => !Number.isInteger(id) || id < 0 || id >= skin.positions.length,
    )
  )
    throw new Error(
      "Eyebrow boundaries need a side and resident skin identities.",
    );
  const mesh: IAutoMovieMesh = createMetricMeshPart(
    "brow-attachment-basis",
    {
      positions: skin.positions.flat(),
      indices: skin.indices,
      normals: null,
      uvs: null,
      skin: null,
    },
    "skin",
  ).geometry.mesh;
  const sample: (u: number, v: number) => { minimum: number; maximum: number; } | null = createAutoMovieMeshDepthSampler(mesh, "z");
  const depth: (x: number, y: number) => number = (x: number, y: number): number => {
    const hit: { minimum: number; maximum: number; } | null = sample(x / 1000, y / 1000);
    if (hit === null)
      throw new Error(
        "Eyebrow fibres must remain over their supporting skin surface.",
      );
    return hit.maximum * 1000;
  };
  const epsilon: number = Math.max(0.001, shape.radius);
  const contact: (x: number, y: number, offset: number) => IAutoMovieVector3 = (x: number, y: number, offset: number): IAutoMovieVector3  => {
    const z: number = depth(x, y);
    const dx: number = (depth(x + epsilon, y) - depth(x - epsilon, y)) / (2 * epsilon);
    const dy: number = (depth(x, y + epsilon) - depth(x, y - epsilon)) / (2 * epsilon);
    const normal: IAutoMovieVector3 = Vector3.normalize(millimetrePoint(-dx, -dy, 1));
    return millimetrePoint(
      x + normal.x * offset,
      y + normal.y * offset,
      z + normal.z * offset,
    );
  };
  const landmark: (id: number) => IAutoMovieVector3 = (id: number): IAutoMovieVector3  =>
    millimetrePoint(...(skin.positions[id] as [number, number, number]));
  const top: IAutoMovieVector3[] = binding.upper.map(landmark),
    bottom: IAutoMovieVector3[] = binding.lower.map(landmark);
  const outward: 1 | -1 = binding.side === "left" ? 1 : -1;
  // Existing documents retain their exact thinning population. A supplied seed
  // chooses an independent sequence and a stable phase without random state.
  const densityStep: number =
    shape.densitySeed === undefined ? 0.61803398875 : Math.SQRT2;
  const densityPhase: number =
    shape.densitySeed === undefined
      ? 0
      : (Math.imul(shape.densitySeed, 0x9e3779b1) >>> 0) / 0x100000000;
  const parts: IAutoMovieModelPart[] = [];
  for (let i: number = 0; i < fibres; i++) {
    const u: number = (i + 0.5) / fibres,
      a: IAutoMovieVector3 = catmullRomPoint(bottom, u),
      b: IAutoMovieVector3 = catmullRomPoint(top, u);
    // Distribute roots within the authored band, then use its complete flow or
    // the basic upward/outward sweep. Density is independent of fibre radius.
    const anatomical: number = binding.side === "left" ? u : 1 - u;
    const fade: (distance: number, reach: number) => number = (distance: number, reach: number): number => {
      if (reach === 0) return 1;
      const t: number = Math.min(1, distance / reach);
      return t * t * (3 - 2 * t);
    };
    const envelope: number = fade(anatomical, ends[0]) * fade(1 - anatomical, ends[1]);
    // Thin the population, not the radius: sub-resolution tube rings collapse
    // under the model's geometric weld tolerance. Each retained hair keeps its
    // independently authored physical radius and longitudinal taper.
    if (((i + 0.5) * densityStep + densityPhase) % 1 >= envelope) continue;
    const rootFraction: number = (i * 0.61803398875) % 1;
    const start: number = rootBand[0] + (rootBand[1] - rootBand[0]) * rootFraction;
    const direction: IPortraitEyebrowFlowDirection | undefined = flow?.(
      anatomical,
      rootBand[0] === rootBand[1] ? 0.5 : rootFraction,
    );
    const end: number =
      direction?.tip ??
      start + (shape.span ?? 0.26 + 0.08 * Math.sin(Math.PI * u));
    const outwardBend: number = direction?.outwardBend ?? shape.outwardBend;
    if (
      Math.hypot(
        (b.x - a.x) * (end - start) + outward * outwardBend,
        (b.y - a.y) * (end - start),
      ) === 0
    )
      throw new Error("An eyebrow fibre needs a nonzero path along the skin.");
    const radius: (t: number) => number = (t: number): number  =>
      (shape.radius + (i % 3) * shape.radiusStep) * (1 - shape.taper * t);
    const projected: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3  => {
      const v: number = linearInterpolate(start, end, t);
      return millimetrePoint(
        linearInterpolate(a.x, b.x, v) + outward * outwardBend * t * t,
        linearInterpolate(a.y, b.y, v),
        0,
      );
    };
    const curve: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3  => {
      const point: IAutoMovieVector3 = projected(t);
      return contact(
        point.x,
        point.y,
        radius(t) + shape.clearance + shape.arch * Math.sin(Math.PI * t),
      );
    };
    const fibre: IAutoMovieMesh =
      shape.representation === undefined
        ? sweepEightSidedTube(curve, radius, shape.segments)
        : triangulateSurfaceLattice(
            (u: number, t: number): IAutoMovieVector3  => {
              const center: IAutoMovieVector3 = projected(t);
              const before: IAutoMovieVector3 = projected(Math.max(0, t - 0.001)),
                after: IAutoMovieVector3 = projected(Math.min(1, t + 0.001));
              const across: IAutoMovieVector3 = Vector3.normalize(
                millimetrePoint(before.y - after.y, after.x - before.x, 0),
              );
              if (across.x === 0 && across.y === 0)
                throw new Error(
                  "Eyebrow ribbon needs a nonzero projected tangent.",
                );
              return contact(
                center.x + across.x * radius(t) * (2 * u - 1),
                center.y + across.y * radius(t) * (2 * u - 1),
                shape.clearance +
                  shape.arch * Math.sin(Math.PI * t) +
                  radius(t),
              );
            },
            1,
            shape.segments,
          );
    parts.push(
      createMetricMeshPart(`${binding.side}-brow-hair-${i}`, fibre, "brows"),
    );
  }
  return parts;
}

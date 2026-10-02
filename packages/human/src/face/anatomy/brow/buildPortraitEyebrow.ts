import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { linearInterpolate } from "../../mesh/linearInterpolate";
import { millimetrePoint } from "../../mesh/millimetrePoint";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { sweepEightSidedTube } from "../../mesh/sweepEightSidedTube";
import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import { assertPortraitEyebrowProfile } from "./assertPortraitEyebrowProfile";
import { createPortraitEyebrowFlow } from "./createPortraitEyebrowFlow";
import { portraitEyebrowProfile } from "./portraitEyebrowProfile";

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
 * @evidence contracts/common.md#principled-implementation Depth is the frontmost skin height at each fibre sample, and the local normal is the gradient of that height by central differences, so the offset of radius plus clearance plus arch along the normal keeps the cross section clear of the surface's tangent plane on a slope. The approximations are stated: a height-field skin, a normal estimated over one fibre radius on a piecewise-planar mesh (so it is the face normal within a triangle), and contact on curved skin left to rendered inspection. Roots use the golden-ratio sequence, a low-discrepancy sequence that spreads roots evenly without random state.
 * @evidence contracts/common.md#clear-and-simple-design One function turns a skin, a boundary, a count and a profile into fibre parts in the order validate, sample roots, thin, trace a projected path and lift it onto the skin, with the flow, the profile check and the metric conversion delegated to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case is named after a subject, fixture or photograph; the fibres are a function of the skin, boundary, count and profile, a root off the skin throws instead of being clamped, and no compensating retry exists.
 * @evidence contracts/common.md#meaningful-documentation The comment states the height-field assumption and where it fails, how roots and thinning are chosen, the part identities, the vertex count of a ribbon, the units and every refusal.
 * @evidence contracts/modeling.md#part-identity-and-grouping The function returns the fibre population of one eyebrow as separate parts, one per fibre, named `<side>-brow-hair-<i>` with the original sequence index, so the brow is the group and a fibre is the smallest part with its own identity; thinning changes membership and never renumbers a survivor. The group's composition and order are owned here and no fibre's shape is copied from another.
 * @evidence contracts/modeling.md#emitted-geometry The population is `browFibres` fibres of a fixed lattice each, `2 * (segments + 1)` vertices and `2 * segments` triangles for a ribbon, so it grows with the fibre count and the segment count (at most 4096 and 32) and not with any authored feature; thinning only removes whole fibres. Individual fibres are the form the profile describes, which a texture card cannot supply at close range, and the cap bounds the population.
 * @evidence contracts/modeling.md#spatial-conventions The skin and boundary are head millimetres in one right-handed frame with +Z anterior, the depth sampler works in engine metres through explicit division by 1000 at each query and multiplication on the hit, and the parts are converted to metres once by the metric part builder.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the profile and count and defines no channel.
 */
export function buildPortraitEyebrow(
  skin: IControlMesh,
  binding: { side: "left" | "right"; upper: number[]; lower: number[] },
  fibres: number,
  input: IPortraitEyebrowProfile = portraitEyebrowProfile,
): IAutoMovieModelPart[] {
  const shape = structuredClone(input);
  assertPortraitEyebrowProfile(shape, fibres);
  if (fibres === 0) return [];
  const flow =
    shape.flow === undefined
      ? undefined
      : createPortraitEyebrowFlow(shape.flow);
  if (
    (binding.side !== "left" && binding.side !== "right") ||
    binding.upper.length < 2 ||
    binding.lower.length < 2 ||
    [...binding.upper, ...binding.lower].some(
      (id) => !Number.isInteger(id) || id < 0 || id >= skin.positions.length,
    )
  )
    throw new Error(
      "Eyebrow boundaries need a side and resident skin identities.",
    );
  const mesh = createMetricMeshPart(
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
  const sample = createAutoMovieMeshDepthSampler(mesh, "z");
  const depth = (x: number, y: number): number => {
    const hit = sample(x / 1000, y / 1000);
    if (hit === null)
      throw new Error(
        "Eyebrow fibres must remain over their supporting skin surface.",
      );
    return hit.maximum * 1000;
  };
  const epsilon = Math.max(0.001, shape.radius);
  const contact = (x: number, y: number, offset: number) => {
    const z = depth(x, y);
    const dx = (depth(x + epsilon, y) - depth(x - epsilon, y)) / (2 * epsilon);
    const dy = (depth(x, y + epsilon) - depth(x, y - epsilon)) / (2 * epsilon);
    const normal = Vector3.normalize(millimetrePoint(-dx, -dy, 1));
    return millimetrePoint(
      x + normal.x * offset,
      y + normal.y * offset,
      z + normal.z * offset,
    );
  };
  const landmark = (id: number) =>
    millimetrePoint(...(skin.positions[id] as [number, number, number]));
  const top = binding.upper.map(landmark),
    bottom = binding.lower.map(landmark);
  const outward = binding.side === "left" ? 1 : -1;
  // Existing documents retain their exact thinning population. A supplied seed
  // chooses an independent sequence and a stable phase without random state.
  const densityStep =
    shape.densitySeed === undefined ? 0.61803398875 : Math.SQRT2;
  const densityPhase =
    shape.densitySeed === undefined
      ? 0
      : (Math.imul(shape.densitySeed, 0x9e3779b1) >>> 0) / 0x100000000;
  const parts: IAutoMovieModelPart[] = [];
  for (let i = 0; i < fibres; i++) {
    const u = (i + 0.5) / fibres,
      a = catmullRomPoint(bottom, u),
      b = catmullRomPoint(top, u);
    // Distribute roots within the authored band, then use its complete flow or
    // the basic upward/outward sweep. Density is independent of fibre radius.
    const rootBand = shape.rootBand ?? [0.1, 0.22];
    const anatomical = binding.side === "left" ? u : 1 - u;
    const ends = shape.endFade ?? [0, 0];
    const fade = (distance: number, reach: number): number => {
      if (reach === 0) return 1;
      const t = Math.min(1, distance / reach);
      return t * t * (3 - 2 * t);
    };
    const envelope = fade(anatomical, ends[0]) * fade(1 - anatomical, ends[1]);
    // Thin the population, not the radius: sub-resolution tube rings collapse
    // under the model's geometric weld tolerance. Each retained hair keeps its
    // independently authored physical radius and longitudinal taper.
    if (((i + 0.5) * densityStep + densityPhase) % 1 >= envelope) continue;
    const rootFraction = (i * 0.61803398875) % 1;
    const start = rootBand[0] + (rootBand[1] - rootBand[0]) * rootFraction;
    const direction = flow?.(
      anatomical,
      rootBand[0] === rootBand[1] ? 0.5 : rootFraction,
    );
    const end =
      direction?.tip ??
      start + (shape.span ?? 0.26 + 0.08 * Math.sin(Math.PI * u));
    const outwardBend = direction?.outwardBend ?? shape.outwardBend;
    if (
      Math.hypot(
        (b.x - a.x) * (end - start) + outward * outwardBend,
        (b.y - a.y) * (end - start),
      ) === 0
    )
      throw new Error("An eyebrow fibre needs a nonzero path along the skin.");
    const radius = (t: number) =>
      (shape.radius + (i % 3) * shape.radiusStep) * (1 - shape.taper * t);
    const projected = (t: number) => {
      const v = linearInterpolate(start, end, t);
      return millimetrePoint(
        linearInterpolate(a.x, b.x, v) + outward * outwardBend * t * t,
        linearInterpolate(a.y, b.y, v),
        0,
      );
    };
    const curve = (t: number) => {
      const point = projected(t);
      return contact(
        point.x,
        point.y,
        radius(t) + shape.clearance + shape.arch * Math.sin(Math.PI * t),
      );
    };
    const fibre =
      shape.representation === undefined
        ? sweepEightSidedTube(curve, radius, shape.segments)
        : triangulateSurfaceLattice(
            (u, t) => {
              const center = projected(t);
              const before = projected(Math.max(0, t - 0.001)),
                after = projected(Math.min(1, t + 0.001));
              const across = Vector3.normalize(
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

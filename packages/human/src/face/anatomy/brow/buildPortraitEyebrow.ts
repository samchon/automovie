import { Vector3, createAutoMovieMeshDepthSampler } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { portraitMix } from "../../mesh/portraitMix";
import { portraitPoint } from "../../mesh/portraitPoint";
import { portraitPart } from "../../mesh/portraitPart";
import { portraitPatch } from "../../mesh/portraitPatch";
import { portraitSpline } from "../../mesh/portraitSpline";
import { portraitTube } from "../../mesh/portraitTube";
import type { IControlMesh } from "../../mesh/structures/IControlMesh";
import { createPortraitEyebrowFlow } from "./createPortraitEyebrowFlow";
import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import { assertPortraitEyebrowProfile } from "./assertPortraitEyebrowProfile";
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
 * The acceleration structure uses engine metres; emitted parts use portraitPart
 * for their final metric conversion. Zero fibres produce no parts. Counts above
 * 4096 refuse rather than allocating an unbounded brow mesh population.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs individually rooted eyebrow fibres on the final forehead surface.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Queries the skin depth and local normal per strand sample, applies anatomical outward bend and deterministic density thinning, and emits metric parts.
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
  const mesh = portraitPart(
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
    const normal = Vector3.normalize(portraitPoint(-dx, -dy, 1));
    return portraitPoint(
      x + normal.x * offset,
      y + normal.y * offset,
      z + normal.z * offset,
    );
  };
  const landmark = (id: number) =>
    portraitPoint(...(skin.positions[id] as [number, number, number]));
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
      a = portraitSpline(bottom, u),
      b = portraitSpline(top, u);
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
      const v = portraitMix(start, end, t);
      return portraitPoint(
        portraitMix(a.x, b.x, v) + outward * outwardBend * t * t,
        portraitMix(a.y, b.y, v),
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
        ? portraitTube(curve, radius, shape.segments)
        : portraitPatch(
            (u, t) => {
              const center = projected(t);
              const before = projected(Math.max(0, t - 0.001)),
                after = projected(Math.min(1, t + 0.001));
              const across = Vector3.normalize(
                portraitPoint(before.y - after.y, after.x - before.x, 0),
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
    parts.push(portraitPart(`${binding.side}-brow-hair-${i}`, fibre, "brows"));
  }
  return parts;
}

import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/** A triangle mesh in the basis frame (+x transverse, +y up, +z forward). */
export interface IFaceFissureMesh {
  positions: readonly number[];
  indices: readonly number[];
}

/**
 * The palpebral fissure's corners seen from the front: endocanthion and
 * exocanthion are where the lids meet (Farkas 1994), so they are the medial
 * and lateral ends of the region where the eye's globe, not the lids' skin,
 * is the front-most surface. Both meshes are rasterised along -z into one
 * depth buffer of `resolution` pixels over the window `centre` plus or minus
 * `half`; lateral is away from the midline (the sign of the centre's x).
 * The fissure narrows to a wedge at each end, so its single outermost pixel
 * jumps between rows as the lids move; each corner is instead the centroid
 * of the globe pixels within `band` of that end, which moves continuously
 * with the lids and sits the same small way inside both ends. Null when no
 * globe pixel shows. Pure.
 */
export function faceFissureCorners(props: {
  skin: IFaceFissureMesh;
  globe: IFaceFissureMesh;
  centre: readonly [number, number, number];
  half: readonly [number, number];
  resolution: number;
  band: number;
}): { medial: [number, number]; lateral: [number, number] } | null {
  const { centre, half, resolution: r } = props;
  const x0 = centre[0] - half[0];
  const y0 = centre[1] - half[1];
  const W = Math.round((2 * half[0]) / r);
  const H = Math.round((2 * half[1]) / r);
  const depth = new Float64Array(W * H).fill(-Infinity);
  const globe = new Uint8Array(W * H);
  const raster = (mesh: IFaceFissureMesh, tag: number) => {
    const p = mesh.positions;
    for (let t = 0; t + 2 < mesh.indices.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => mesh.indices[t + k]!);
      const X = [a, b, c].map((v) => (p[3 * v!]! - x0) / r);
      const Y = [a, b, c].map((v) => (p[3 * v! + 1]! - y0) / r);
      const Z = [a, b, c].map((v) => p[3 * v! + 2]!);
      const den =
        (Y[1]! - Y[2]!) * (X[0]! - X[2]!) + (X[2]! - X[1]!) * (Y[0]! - Y[2]!);
      if (den === 0) continue;
      const left = Math.max(0, Math.floor(Math.min(...X)));
      const right = Math.min(W - 1, Math.ceil(Math.max(...X)));
      const bottom = Math.max(0, Math.floor(Math.min(...Y)));
      const top = Math.min(H - 1, Math.ceil(Math.max(...Y)));
      for (let y = bottom; y <= top; ++y)
        for (let x = left; x <= right; ++x) {
          const px = x + 0.5 - X[2]!;
          const py = y + 0.5 - Y[2]!;
          const u = ((Y[1]! - Y[2]!) * px + (X[2]! - X[1]!) * py) / den;
          const v = ((Y[2]! - Y[0]!) * px + (X[0]! - X[2]!) * py) / den;
          if (u < 0 || v < 0 || u + v > 1) continue;
          const z = u * Z[0]! + v * Z[1]! + (1 - u - v) * Z[2]!;
          if (z > depth[y * W + x]!) {
            depth[y * W + x] = z;
            globe[y * W + x] = tag;
          }
        }
    }
  };
  raster(props.skin, 0);
  raster(props.globe, 1);
  const side = centre[0] < 0 ? -1 : 1;
  const shown: [number, number][] = [];
  for (let y = 0; y < H; ++y)
    for (let x = 0; x < W; ++x)
      if (globe[y * W + x] === 1)
        shown.push([x0 + (x + 0.5) * r, y0 + (y + 0.5) * r]);
  if (shown.length === 0) return null;
  const across = shown.map((point) => side * point[0]);
  const end = (reach: number, sign: number): [number, number] => {
    const band = shown.filter(
      (_, k) => sign * (across[k]! - reach) >= -props.band,
    );
    return [0, 1].map(
      (a) => band.reduce((sum, point) => sum + point[a]!, 0) / band.length,
    ) as [number, number];
  };
  return {
    medial: end(Math.min(...across), -1),
    lateral: end(Math.max(...across), 1),
  };
}

/** Canthal tilt in degrees: exocanthion's rise over the fissure's width. */
export function faceCanthalTiltDegrees(corners: {
  medial: readonly [number, number];
  lateral: readonly [number, number];
}): number {
  return (
    (Math.atan2(
      corners.lateral[1] - corners.medial[1],
      Math.abs(corners.lateral[0] - corners.medial[0]),
    ) *
      180) /
    Math.PI
  );
}

/** A population corner without its sex, e.g. one ancestry at full weight. */
export interface ICanthalTiltCorner {
  label: string;
  shape: Record<string, number>;
}

/**
 * Give the source's sexual dimorphism the published difference in canthal
 * tilt between women and men, along the source's own lateral canthus field.
 *
 * Women's palpebral fissures slant more than men's in every population
 * measured (by 0.9 to 2.3 degrees). The field is the sum of the `field`
 * channels' positive endpoints (the lateral canthus elevation pair, which
 * raises exocanthion); the `targets.men` target (an endpoint or a
 * corrective, such as one ancestry's male dimorphism) gains `-a` of it and
 * `targets.women` gains `+a`, so a sex-neutral document keeps its tilt and
 * the women-minus-men difference, averaged over the given corners (each
 * built with the `dimorphism` channel at +1 and -1) and both eyes, becomes
 * `difference` degrees. `a` is solved by a secant iteration on the rebuilt
 * skin, the tilt being read as `faceFissureCorners` reads it. Every target
 * is a displacement, so documents are restamped and must build. The shape of
 * the change is the source's; only its size comes from the norms.
 *
 * Pure: returns new values.
 */
export function prepareCanthalTiltBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  dimorphism: string;
  /** The targets that carry the men's and the women's side of the change. */
  targets: { men: string; women: string };
  field: readonly string[];
  skin: string;
  globe: string;
  /** Landmark ids of the eyes' centres. */
  eyes: readonly string[];
  half: readonly [number, number];
  resolution: number;
  /** Depth of each fissure end averaged into its corner, metres. */
  band: number;
  corners: readonly ICanthalTiltCorner[];
  /** Published women-minus-men canthal tilt, degrees. */
  difference: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    factor: number;
    difference: number;
    corners: {
      label: string;
      before: { men: number; women: number };
      after: { men: number; women: number };
    }[];
  };
} {
  const { documents, controls, revision } = structuredClone(input);
  const source = structuredClone(input.basis);
  if (revision.trim() === "" || revision === source.id)
    throw new Error("A canthal tilt revision needs a distinct revision.");
  if (input.corners.length === 0 || input.field.length === 0)
    throw new Error("A canthal tilt revision needs corners and a field.");
  const sex = source.channels.find((one) => one.id === input.dimorphism);
  if (
    sex === undefined ||
    sex.kind !== "shape" ||
    sex.positive === null ||
    sex.negative === null
  )
    throw new Error(
      `The dimorphism names no two-sided shape channel ${input.dimorphism}.`,
    );
  for (const target of [input.targets.men, input.targets.women])
    if (!source.surfaces.some((surface) => target in surface.targets))
      throw new Error(`No surface carries the target ${target}.`);
  const fields = input.field.map((id) => {
    const one = source.channels.find((channel) => channel.id === id);
    if (one === undefined || one.kind !== "shape" || one.positive === null)
      throw new Error(`The field names no shape channel ${id}.`);
    return one.positive;
  });
  const indices = (id: string) => {
    const surface = source.surfaces.find((one) => one.id === id);
    if (surface === undefined) throw new Error(`No surface ${id}.`);
    return surface.indices;
  };
  const skinIndices = indices(input.skin);
  const globeIndices = indices(input.globe);
  const landmarks = source.landmarks;
  const centres = input.eyes.map((id) => {
    const k = landmarks?.ids.indexOf(id) ?? -1;
    if (k < 0) throw new Error(`No eye landmark ${id}.`);
    return landmarks!.positions.slice(3 * k, 3 * k + 3) as [
      number,
      number,
      number,
    ];
  });
  const dense = (target: string) =>
    source.surfaces.map((surface) => {
      const sum = new Float64Array(surface.positions.length);
      const rows = surface.targets[target] ?? [];
      for (let i = 0; i < rows.length; i += 4)
        for (let a = 0; a < 3; ++a) sum[3 * rows[i]! + a]! += rows[i + 1 + a]!;
      return sum;
    });
  const parts = fields.map(dense);
  const along = source.surfaces.map((surface, s) => {
    const sum = new Float64Array(surface.positions.length);
    for (const part of parts)
      part[s]!.forEach((value, i) => (sum[i]! += value));
    return sum;
  });
  const male = dense(input.targets.men);
  const female = dense(input.targets.women);
  const corrected = (factor: number): IAutoMovieHumanFaceBasis => ({
    ...source,
    surfaces: source.surfaces.map((surface, s) => {
      const rows = (base: Float64Array, sign: number) => {
        const out: number[] = [];
        for (let v = 0; v < base.length / 3; ++v) {
          const d = [0, 1, 2].map(
            (a) => base[3 * v + a]! + sign * factor * along[s]![3 * v + a]!,
          );
          if (d.some((value) => value !== 0)) out.push(v, ...d);
        }
        return out;
      };
      // A surface the change and the target both leave still carries no row.
      const targets = { ...surface.targets };
      for (const [name, base, sign] of [
        [input.targets.men, male[s]!, -1],
        [input.targets.women, female[s]!, 1],
      ] as const) {
        const out = rows(base, sign);
        if (out.length > 0) targets[name] = out;
        else delete targets[name];
      }
      return { ...surface, targets };
    }),
  });
  const tilts = (candidate: IAutoMovieHumanFaceBasis) => {
    const build = createHumanFaceBasisBuilder(candidate);
    const tilt = (shape: Record<string, number>, label: string) => {
      const model = build({
        id: "norm",
        name: "norm",
        basis: candidate.id,
        shape,
        expression: {},
      });
      const skin = faceShapeFitSurfacePositions(candidate, model, input.skin);
      const globe = faceShapeFitSurfacePositions(candidate, model, input.globe);
      const each = centres.map((centre) => {
        const corners = faceFissureCorners({
          skin: { positions: skin, indices: skinIndices },
          globe: { positions: globe, indices: globeIndices },
          centre,
          half: input.half,
          resolution: input.resolution,
          band: input.band,
        });
        if (corners === null)
          throw new Error(`${label} shows no palpebral fissure.`);
        return faceCanthalTiltDegrees(corners);
      });
      return each.reduce((sum, value) => sum + value, 0) / each.length;
    };
    return input.corners.map((corner) => ({
      men: tilt({ ...corner.shape, [input.dimorphism]: 1 }, corner.label),
      women: tilt({ ...corner.shape, [input.dimorphism]: -1 }, corner.label),
    }));
  };
  const shortfall = (rows: { men: number; women: number }[]) =>
    input.difference -
    rows.reduce((sum, row) => sum + row.women - row.men, 0) / rows.length;
  const before = tilts(source);
  let a = 0;
  let fa = shortfall(before);
  // The field raises exocanthion, so a positive factor widens the
  // difference; the first step follows the shortfall's sign.
  let b = fa > 0 ? 0.25 : -0.25;
  let fb = shortfall(tilts(corrected(b)));
  if (fb === fa)
    throw new Error("The field does not move the palpebral fissure.");
  for (let k = 0; k < 20 && Math.abs(fb) > 1e-3 && fb !== fa; ++k) {
    const next = b - (fb * (b - a)) / (fb - fa);
    [a, fa] = [b, fb];
    b = next;
    fb = shortfall(tilts(corrected(b)));
  }
  const basis = corrected(b);
  const after = tilts(basis);
  basis.id = revision;
  const build = createHumanFaceBasisBuilder(basis);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source: input.basis.id,
      revision,
      factor: b,
      difference: input.difference,
      corners: input.corners.map((corner, k) => ({
        label: corner.label,
        before: before[k]!,
        after: after[k]!,
      })),
    },
  };
}

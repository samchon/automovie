import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/** One population corner and the published upper vermilion height it should have. */
export interface IVermilionNorm {
  label: string;
  shape: Record<string, number>;
  targetMetres: number;
}

/** An ancestry endpoint and the norms of its corners. */
export interface IVermilionAncestry {
  channel: string;
  norms: readonly IVermilionNorm[];
}

/**
 * The midline upper vermilion height of a built skin: labrale superius, the
 * highest point where the lip region's outer surface crosses the midsagittal
 * plane (x = 0), above stomion superius, in metres.
 *
 * `triangles` are the lip region's vertex indices; crossings deeper than
 * `depth` behind stomion lie on the lips' inner fold and do not count. Null
 * when no outer crossing lies above stomion. Pure.
 */
export function faceUpperVermilionHeight(props: {
  positions: readonly number[];
  triangles: readonly number[];
  stomion: { y: number; z: number };
  depth: number;
}): number | null {
  const { positions: p, triangles } = props;
  let top = -Infinity;
  for (let t = 0; t + 2 < triangles.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const i = triangles[t + e]!;
      const j = triangles[t + ((e + 1) % 3)]!;
      const xi = p[3 * i]!;
      const xj = p[3 * j]!;
      if (xi > 0 === xj > 0) continue;
      const f = xi / (xi - xj);
      const y = p[3 * i + 1]! + f * (p[3 * j + 1]! - p[3 * i + 1]!);
      const z = p[3 * i + 2]! + f * (p[3 * j + 2]! - p[3 * i + 2]!);
      if (z > props.stomion.z - props.depth && y > top) top = y;
    }
  return top > props.stomion.y ? top - props.stomion.y : null;
}

/**
 * Bring each ancestry's upper vermilion height to published norms along the
 * source's own `upperLipHeight` field.
 *
 * The source's upper lip height channel moves the vermilion border against
 * the stomion while holding the upper lip's total height (subnasale to
 * stomion): the border moves, the lip does not grow. Each ancestry endpoint
 * gains a signed multiple `k` of that field, the positive endpoint for
 * `k > 0` and the negative one scaled by `-k` otherwise, the multiple at which
 * the mean shortfall over that ancestry's normed corners vanishes, solved by a
 * secant iteration (the border is read on the rebuilt skin and is piecewise
 * linear in `k`). An ancestry endpoint is a displacement, so a mixed
 * document takes its share of each correction and the neutral none;
 * documents are restamped and must build. The shape of the change is the
 * source's; only its size comes from the norms.
 *
 * Pure: returns new values.
 */
export function prepareVermilionBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  channel: string;
  skin: string;
  /** The skin region whose triangles are the lips. */
  region: string;
  /** The vermilion seam midline vertices whose upper one is stomion superius. */
  lips: { surface: string; upper: number; lower: number };
  ancestries: readonly IVermilionAncestry[];
  depth: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    ancestries: {
      channel: string;
      factor: number;
      corners: {
        label: string;
        targetMetres: number;
        beforeMetres: number;
        afterMetres: number;
      }[];
    }[];
  };
} {
  const { documents, controls, revision } = structuredClone(input);
  let basis = structuredClone(input.basis);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A vermilion revision needs a distinct revision.");
  if (
    input.ancestries.length === 0 ||
    input.ancestries.some((one) => one.norms.length === 0)
  )
    throw new Error("A vermilion revision needs norms for each ancestry.");
  const field = basis.channels.find((one) => one.id === input.channel);
  if (
    field === undefined ||
    field.kind !== "shape" ||
    field.positive === null ||
    field.negative === null
  )
    throw new Error(
      `The vermilion field names no two-sided shape channel ${input.channel}.`,
    );
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const region = skin.regions.find((one) => one.id === input.region);
  if (region === undefined) throw new Error(`No region ${input.region}.`);
  if (!basis.surfaces.some((one) => one.id === input.lips.surface))
    throw new Error(`No lip surface ${input.lips.surface}.`);
  const dense = (source: IAutoMovieHumanFaceBasis, target: string | null) =>
    source.surfaces.map((surface) => {
      const sum = new Float64Array(surface.positions.length);
      const rows = target === null ? [] : (surface.targets[target] ?? []);
      for (let i = 0; i < rows.length; i += 4)
        for (let a = 0; a < 3; ++a) sum[3 * rows[i]! + a]! += rows[i + 1 + a]!;
      return sum;
    });
  const positive = dense(basis, field.positive);
  const negative = dense(basis, field.negative);
  const heights = (
    candidate: IAutoMovieHumanFaceBasis,
    norms: readonly IVermilionNorm[],
  ) => {
    const build = createHumanFaceBasisBuilder(candidate);
    return norms.map((norm) => {
      const model = build({
        id: "norm",
        name: "norm",
        basis: candidate.id,
        shape: norm.shape,
        expression: {},
      });
      const seam = faceShapeFitSurfacePositions(
        candidate,
        model,
        input.lips.surface,
      );
      const height = faceUpperVermilionHeight({
        positions: faceShapeFitSurfacePositions(candidate, model, input.skin),
        triangles: region.indices,
        stomion: {
          y: seam[3 * input.lips.upper + 1]!,
          z: seam[3 * input.lips.upper + 2]!,
        },
        depth: input.depth,
      });
      if (height === null)
        throw new Error(`${norm.label} has no upper vermilion crossing.`);
      return height;
    });
  };
  const corrected = (
    source: IAutoMovieHumanFaceBasis,
    channel: string,
    factor: number,
  ): IAutoMovieHumanFaceBasis => {
    const ancestry = source.channels.find((one) => one.id === channel);
    if (ancestry === undefined || ancestry.positive === null)
      throw new Error(`No ancestry endpoint ${channel}.`);
    const endpoint = ancestry.positive;
    const own = dense(source, endpoint);
    const along = factor >= 0 ? positive : negative;
    const scale = Math.abs(factor);
    return {
      ...source,
      surfaces: source.surfaces.map((surface, s) => {
        const sum = own[s]!.map((value, i) => value + scale * along[s]![i]!);
        const rows: number[] = [];
        for (let v = 0; v < sum.length / 3; ++v)
          if (sum[3 * v] !== 0 || sum[3 * v + 1] !== 0 || sum[3 * v + 2] !== 0)
            rows.push(v, sum[3 * v]!, sum[3 * v + 1]!, sum[3 * v + 2]!);
        return {
          ...surface,
          targets: { ...surface.targets, [endpoint]: rows },
        };
      }),
    };
  };
  const ancestries: {
    channel: string;
    factor: number;
    corners: {
      label: string;
      targetMetres: number;
      beforeMetres: number;
      afterMetres: number;
    }[];
  }[] = [];
  for (const ancestry of input.ancestries) {
    const before = heights(basis, ancestry.norms);
    const shortfall = (values: readonly number[]) =>
      values.reduce(
        (sum, value, k) => sum + (ancestry.norms[k]!.targetMetres - value),
        0,
      ) / values.length;
    const at = (factor: number) =>
      shortfall(
        heights(corrected(basis, ancestry.channel, factor), ancestry.norms),
      );
    let a = 0;
    let fa = shortfall(before);
    // The field raises the border for k > 0, so the first step follows the
    // shortfall's sign.
    let b = fa > 0 ? 0.5 : -0.5;
    let fb = at(b);
    if (fb === fa)
      throw new Error(`The ${input.channel} field does not move the border.`);
    for (let k = 0; k < 20 && Math.abs(fb) > 1e-7 && fb !== fa; ++k) {
      const next = b - (fb * (b - a)) / (fb - fa);
      [a, fa] = [b, fb];
      b = next;
      fb = at(b);
    }
    basis = corrected(basis, ancestry.channel, b);
    ancestries.push({
      channel: ancestry.channel,
      factor: b,
      corners: ancestry.norms.map((norm, k) => ({
        label: norm.label,
        targetMetres: norm.targetMetres,
        beforeMetres: before[k]!,
        afterMetres: heights(basis, [norm])[0]!,
      })),
    });
  }
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
    receipt: { source: input.basis.id, revision, ancestries },
  };
}

import type { IHumanSourceBandGeometry } from "./structures/IHumanSourceBandGeometry.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";

/** Equal azimuth bins for the band's local height, 5 degrees each. */
const AZIMUTH_BINS = 72;

/**
 * Measure the neck band of the one skin from its neutral and its one weight
 * map (request B, C-3). The band is where the source rig spreads neck motion:
 * head-partition vertices with head weight below one, body-partition vertices
 * with any neck or head weight, cut samples excluded from both because they
 * keep their absolute rows. Each band vertex's loop parameter is its azimuth
 * about the cut loop's vertical centroid axis; its height above (depth below)
 * the loop at that azimuth, divided by the band's local extent there, is the
 * blend parameter of a smootherstep fall-off from one at the cut to zero at
 * the band end. The loop must be star-shaped about that axis, which is checked
 * by requiring every loop edge to join azimuth neighbours.
 */
export function measureHumanSourceBand(generation: IHumanSourceGeneration): IHumanSourceBandGeometry {
  const { skin, weights } = generation;
  const n = skin.originalVertices;
  const total = skin.positions.length / 3;
  const head = new Uint8Array(total);
  const body = new Uint8Array(total);
  for (let t = 0; t < skin.labels.length; t++)
    for (let k = 0; k < 3; k++) (skin.labels[t] === 0 ? head : body)[skin.triangles[3 * t + k]] = 1;
  const partition = new Uint8Array(total).fill(255);
  let both = 0;
  for (let g = 0; g < total; g++) {
    if (g >= n) partition[g] = 2;
    else if (head[g] === 1 && body[g] === 1) both++;
    else if (head[g] === 1) partition[g] = 0;
    else if (body[g] === 1) partition[g] = 1;
  }
  if (both > 0) throw new Error(`${both} source vertices lie in both partitions outside the cut.`);
  const slot = (name: string): number => weights.joints.indexOf(name);
  const weightOf = (g: number, index: number): number => {
    let sum = 0;
    for (let k = 0; k < 4; k++) if (weights.boneIndices[4 * g + k] === index) sum += weights.weights[4 * g + k];
    return sum;
  };
  const headSlot = slot("head");
  const neckSlot = slot("neck");
  if (headSlot < 0 || neckSlot < 0) throw new Error("The weight map has no head or neck joint.");

  const samples = Array.from({ length: total - n }, (_, i) => n + i);
  const cx = samples.reduce((sum, g) => sum + skin.positions[3 * g], 0) / samples.length;
  const cz = samples.reduce((sum, g) => sum + skin.positions[3 * g + 2], 0) / samples.length;
  const azimuthAt = (g: number): number => Math.atan2(skin.positions[3 * g + 2] - cz, skin.positions[3 * g] - cx);
  const loop = samples.slice().sort((x, y) => azimuthAt(x) - azimuthAt(y));
  const loopAzimuths = Float64Array.from(loop, azimuthAt);
  const order = new Map(loop.map((g, i) => [g, i]));
  let nonNeighbourEdges = 0;
  for (let t = 0; t < skin.labels.length; t++)
    for (let k = 0; k < 3; k++) {
      const a = order.get(skin.triangles[3 * t + k]);
      const b = order.get(skin.triangles[3 * t + ((k + 1) % 3)]);
      if (a === undefined || b === undefined) continue;
      const gap = Math.abs(a - b);
      if (gap !== 1 && gap !== loop.length - 1) nonNeighbourEdges++;
    }
  const circular = (values: ArrayLike<number>, centres: ArrayLike<number>, theta: number): number => {
    const m = centres.length;
    let upper = 0;
    while (upper < m && centres[upper] < theta) upper++;
    const lo = (upper - 1 + m) % m;
    const hi = upper % m;
    const span = (centres[hi] - centres[lo] + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI;
    const into = (theta - centres[lo] + 2 * Math.PI) % (2 * Math.PI);
    const f = into / span;
    return (1 - f) * values[lo] + f * values[hi];
  };
  const loopY = Float64Array.from(loop, (g) => skin.positions[3 * g + 1]);

  const azimuth = new Float64Array(total).fill(Number.NaN);
  const headBand: number[] = [];
  const bodyBand: number[] = [];
  const reach = new Float64Array(total);
  for (let g = 0; g < n; g++) {
    const inHead = partition[g] === 0 && weightOf(g, headSlot) < 1;
    const inBody = partition[g] === 1 && weightOf(g, neckSlot) + weightOf(g, headSlot) > 0;
    if (!inHead && !inBody) continue;
    azimuth[g] = azimuthAt(g);
    const y = skin.positions[3 * g + 1] - circular(loopY, loopAzimuths, azimuth[g]);
    reach[g] = inHead ? y : -y;
    (inHead ? headBand : bodyBand).push(g);
  }
  for (const g of loop) azimuth[g] = azimuthAt(g);
  const centres = Float64Array.from({ length: AZIMUTH_BINS }, (_, b) => -Math.PI + ((b + 0.5) * 2 * Math.PI) / AZIMUTH_BINS);
  const extent = (band: number[]): number[] => {
    const bins = new Array<number>(AZIMUTH_BINS).fill(Number.NaN);
    for (const g of band) {
      const b = Math.min(AZIMUTH_BINS - 1, Math.floor(((azimuth[g] + Math.PI) / (2 * Math.PI)) * AZIMUTH_BINS));
      if (!(bins[b] >= reach[g])) bins[b] = reach[g];
    }
    const known = bins.map((v, b) => (Number.isNaN(v) ? -1 : b)).filter((b) => b >= 0);
    if (known.length === 0) throw new Error("A band has no vertices.");
    return bins.map((v, b) => {
      if (!Number.isNaN(v)) return v;
      const before = [...known].reverse().find((k) => k < b) ?? known[known.length - 1];
      const after = known.find((k) => k > b) ?? known[0];
      const span = (after - before + AZIMUTH_BINS) % AZIMUTH_BINS || AZIMUTH_BINS;
      const f = ((b - before + AZIMUTH_BINS) % AZIMUTH_BINS) / span;
      return (1 - f) * bins[before] + f * bins[after];
    });
  };
  const headHeights = extent(headBand);
  const bodyDepths = extent(bodyBand);
  const fall = (t: number): number => {
    const u = Math.min(1, Math.max(0, t));
    return 1 - u * u * u * (u * (6 * u - 15) + 10);
  };
  const headWeight = new Float64Array(total);
  const bodyWeight = new Float64Array(total);
  let belowLoop = 0;
  let pastEnd = 0;
  for (const [band, heights, out] of [
    [headBand, headHeights, headWeight],
    [bodyBand, bodyDepths, bodyWeight],
  ] as const) {
    for (const g of band) {
      const t = reach[g] / circular(heights, centres, azimuth[g]);
      if (t < 0) belowLoop++;
      if (t > 1) pastEnd++;
      out[g] = fall(t);
    }
  }
  const yRange = (band: number[]): string => {
    const ys = band.map((g) => skin.positions[3 * g + 1] * 1000);
    return `${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)} mm`;
  };
  const influence = (band: number[], names: string[]): number =>
    band.filter((g) => names.some((name) => weightOf(g, slot(name)) > 0)).length;
  return {
    band: {
      method: "smootherstep fall-off of loop-relative height over the band's local extent per 5-degree azimuth bin",
      carryLandmark: "joint-head",
      loopSamples: loop,
      axis: [cx, cz],
      azimuthBins: AZIMUTH_BINS,
      headHeights,
      bodyDepths,
      headBand,
      headWeights: headBand.map((g) => headWeight[g]),
      bodyBand,
      bodyWeights: bodyBand.map((g) => bodyWeight[g]),
    },
    azimuth,
    headWeight,
    bodyWeight,
    partition,
    loopAzimuths,
    checks: {
      headBandVertices: headBand.length,
      headBandBelow099HeadWeight: headBand.filter((g) => weightOf(g, headSlot) < 0.99).length,
      headBandY: yRange(headBand),
      headBandWithNeck: influence(headBand, ["neck"]),
      headBandWithUpperChest: influence(headBand, ["upperChest"]),
      headBandWithShoulders: influence(headBand, ["leftShoulder", "rightShoulder"]),
      bodyBandVertices: bodyBand.length,
      bodyBandY: yRange(bodyBand),
      bodyBandWithHead: influence(bodyBand, ["head"]),
      loopY: yRange(loop),
      loopEdgesNotAzimuthNeighbours: nonNeighbourEdges,
      bandVerticesBelowTheLoop: belowLoop,
      bandVerticesPastTheInterpolatedEnd: pastEnd,
      headHeightMillimetres: `${(Math.min(...headHeights) * 1000).toFixed(1)}..${(Math.max(...headHeights) * 1000).toFixed(1)}`,
      bodyDepthMillimetres: `${(Math.min(...bodyDepths) * 1000).toFixed(1)}..${(Math.max(...bodyDepths) * 1000).toFixed(1)}`,
    },
  };
}

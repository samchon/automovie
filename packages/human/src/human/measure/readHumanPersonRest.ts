import { evaluateHumanPersonRestSkin } from "../build/evaluateHumanPersonRestSkin";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonRestReading } from "../structures/IAutoMovieHumanPersonRestReading";

/**
 * Read Float32 sampled height range in metres and signed divergence volume in cubic metres from the paired rest-skin shortcut. Stature scans every source row, including unused samples, with source head orientation standing in for the protocol's Frankfurt alignment. The shortcut omits later closure/parts/normal stages and retains controls outside its documented rest clearing; unconditional full-evaluator or clinical standing equivalence is not established.
 *
 * First occurrence of a shared sample supplies its volume coordinate. Each undirected source edge must occur exactly twice; this count does not check opposite winding, vertex links, global embedding, positive volume or source-alias equality. Those remain admitted source/model premises rather than measurements performed here.
 *
 * @evidence contracts/common.md#principled-implementation Actual paired source samples and triangle order determine Float32 height range and signed divergence volume, with explicit two-incidence refusal.
 * @evidence contracts/common.md#clear-and-simple-design Rest evaluation owns coordinate production; this reader owns sampled extrema, sample-keyed triangle summation and its limited edge census.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cap or body-only proxy repairs open incidence, and the count/shortcut is not promoted into global manifold, clinical posture or rendered-appearance certification.
 * @evidence contracts/common.md#meaningful-documentation Prose states units, unused sample influence, first-coordinate selection, signed volume and exact limits of the incidence check.
 * @evidence contracts/performance.md#efficient-algorithms After actual paired rest evaluation, source rows and triangles are scanned linearly with sample/edge maps; no all-pairs coordinate weld is performed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This reader evaluates the supplied document anew and owns no cross-call rest geometry or result cache; scalar-sharing callers may cache the returned reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rest buffers and maps are call-local and only two scalar readings escape, with no retained asset, worker or render resource.
 */
export function readHumanPersonRest(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonRestReading {
  const rest: ReturnType<typeof evaluateHumanPersonRestSkin> = evaluateHumanPersonRestSkin(compiled, document);
  const faceSkin: (typeof compiled.generation.face.surfaces)[number] = compiled.generation.face.surfaces[compiled.faceProducerSkin];
  const bodySkin: (typeof compiled.generation.body.surfaces)[number] = compiled.generation.body.surfaces[compiled.bodyIndex];
  const halves: { indices: readonly number[]; samples: readonly number[]; positions: readonly number[] }[] = [
    {
      indices: faceSkin.indices,
      samples: compiled.faceSource.samples,
      positions: rest.facePosed,
    },
    {
      indices: bodySkin.indices,
      samples: compiled.bodySource.samples,
      positions: rest.bodyPosed,
    },
  ];
  const at: Map<number, number[]> = new Map<number, number[]>();
  let high: number = -Infinity;
  let low: number = Infinity;
  for (const half of halves)
    half.samples.forEach((sample: number, vertex: number): void => {
      const point: number[] = [0, 1, 2].map((axis: number): number =>
        Math.fround(half.positions[vertex * 3 + axis]),
      );
      if (!at.has(sample)) at.set(sample, point);
      high = Math.max(high, point[1]);
      low = Math.min(low, point[1]);
    });
  const edges: Map<string, number> = new Map<string, number>();
  let volume: number = 0;
  for (const half of halves)
    for (let t: number = 0; t < half.indices.length; t += 3) {
      const ids: number[] = [0, 1, 2].map((k: number): number => half.samples[half.indices[t + k]]);
      for (let k: number = 0; k < 3; k++) {
        const a: number = ids[k];
        const b: number = ids[(k + 1) % 3];
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
      const [p, q, r]: number[][] = ids.map((id: number): number[] => at.get(id)!);
      volume +=
        (p[0] * (q[1] * r[2] - q[2] * r[1]) -
          p[1] * (q[0] * r[2] - q[2] * r[0]) +
          p[2] * (q[0] * r[1] - q[1] * r[0])) /
        6;
    }
  for (const [edge, count] of edges)
    if (count !== 2)
      throw new Error(
        `The person skin of ${compiled.generation.id} does not close: edge ${edge} has ${count} triangles.`,
      );
  return { statureMetres: high - low, volumeCubicMetres: volume };
}

import { evaluateHumanPersonRestSkin } from "../build/evaluateHumanPersonRestSkin";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonRestReading } from "../structures/IAutoMovieHumanPersonRestReading";

/**
 * Read a person's stature and enclosed volume on the closed skin at rest.
 *
 * The rest skin comes from `evaluateHumanPersonRestSkin`, the full evaluator's
 * rest skin without parts, normals or closure stages (its Float32 positions
 * equal the full evaluator's at every source sample). Positions are quantized
 * to Float32, the exported precision. Stature is the highest minus the lowest
 * skin height, ANSUR II's standing floor-to-vertex stature with the source's
 * rest head orientation standing in for the Frankfurt plane. Volume is the
 * divergence sum over every head and body triangle addressed by source sample,
 * so the shared boundary samples close the skin without a cap. A skin that
 * does not close (a boundary edge used once) refuses by name, since its
 * volume would depend on where it is open.
 *
 * @evidence contracts/common.md#principled-implementation Both values are read on the one closed skin the generation defines, so no allowance replaces a missing head or neck.
 * @evidence contracts/common.md#clear-and-simple-design One rest evaluation, one height pass, one closure check and one volume sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An open skin refuses instead of being capped.
 * @evidence contracts/common.md#meaningful-documentation States the source of the skin, the precision, both definitions and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Metres and cubic metres of the person frame, +Y up.
 * @evidence contracts/modeling.md#shared-boundaries Shared samples are one vertex of the closed skin.
 * @evidence contracts/anatomy.md#anatomical-source Stature follows the standing floor-to-vertex protocol and names the head-orientation approximation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanPersonRest(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonRestReading {
  const rest = evaluateHumanPersonRestSkin(compiled, document);
  const faceSkin = compiled.generation.face.surfaces[compiled.faceProducerSkin];
  const bodySkin = compiled.generation.body.surfaces[compiled.bodyIndex];
  const halves = [
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
  const at = new Map<number, number[]>();
  let high = -Infinity;
  let low = Infinity;
  for (const half of halves)
    half.samples.forEach((sample, vertex) => {
      const point = [0, 1, 2].map((axis) =>
        Math.fround(half.positions[vertex * 3 + axis]),
      );
      if (!at.has(sample)) at.set(sample, point);
      high = Math.max(high, point[1]);
      low = Math.min(low, point[1]);
    });
  const edges = new Map<string, number>();
  let volume = 0;
  for (const half of halves)
    for (let t = 0; t < half.indices.length; t += 3) {
      const ids = [0, 1, 2].map((k) => half.samples[half.indices[t + k]]);
      for (let k = 0; k < 3; k++) {
        const a = ids[k];
        const b = ids[(k + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
      const [p, q, r] = ids.map((id) => at.get(id)!);
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

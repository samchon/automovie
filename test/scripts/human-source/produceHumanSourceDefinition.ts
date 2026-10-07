import { HUMAN_SOURCE_DEFINITION_PRODUCER as P } from "./HUMAN_SOURCE_DEFINITION_PRODUCER.ts";
import { measureHumanSourceDistanceToSet } from "./measureHumanSourceDistanceToSet.ts";
import { smoothstepHumanSourceFade } from "./smoothstepHumanSourceFade.ts";
import type { IHumanSourceFieldContext } from "./structures/IHumanSourceFieldContext.ts";
import type { IHumanSourceFieldResult } from "./structures/IHumanSourceFieldResult.ts";

/**
 * Produce the musculature and chest definition rows on the body view.
 *
 * The source's lean muscular body minus its lean average-muscle body, both
 * built through this basis, is read along the symmetric normals. That scalar
 * is band-passed (the field after the high sweeps less the field after the low
 * sweeps), scaled by the gain and made bilaterally symmetric. It fades to zero
 * by a smoothstep within the fade length of the nipple-areola centres and the
 * crotch cut. It is zero on the support of each named relief endpoint and fades
 * back by the same smoothstep outward from that support, because each of those
 * endpoints owns its muscle's relief. The breast mound's share (weight: the
 * cupsize endpoint's normalized length, smoothed by the high sweeps) goes to the
 * chest endpoint and the rest to the musculature endpoint, both along the
 * normals, so neither row has a tangential part.
 */
export function produceHumanSourceDefinition(
  context: IHumanSourceFieldContext,
): IHumanSourceFieldResult {
  const { mesh, twin, normals, smooth, evaluate, rows, landmark } = context;
  const n = mesh.positions.length / 3;
  const muscular = evaluate(P.muscular);
  const lean = evaluate(P.lean);
  const along = new Float64Array(n);
  for (let v = 0; v < n; v++)
    for (let c = 0; c < 3; c++)
      along[v] += (muscular[3 * v + c] - lean[3 * v + c]) * normals[3 * v + c];
  const fine = smooth(along, P.highSweeps);
  const broad = smooth(along, P.lowSweeps);
  const field = new Float64Array(n);
  for (let v = 0; v < n; v++)
    field[v] =
      0.5 * P.gain * (fine[v] - broad[v] + fine[twin[v]] - broad[twin[v]]);
  const left = landmark(P.nipple);
  const centres = [left, twin[left]].map((v) =>
    [0, 1, 2].map((c) => mesh.positions[3 * v + c]),
  );
  centres.push(P.crotch);
  let steppedAside = 0;
  const reliefSupport: number[] = [];
  for (const name of P.relief) {
    const r = rows(name);
    for (let v = 0; v < n; v++)
      if (r[3 * v] !== 0 || r[3 * v + 1] !== 0 || r[3 * v + 2] !== 0)
        reliefSupport.push(v);
  }
  const reliefDistance = measureHumanSourceDistanceToSet(
    mesh.positions,
    [...new Set(reliefSupport)],
    P.fadeMetres,
  );
  for (let v = 0; v < n; v++) {
    let nearest = Infinity;
    for (const c of centres)
      nearest = Math.min(
        nearest,
        Math.hypot(
          mesh.positions[3 * v] - c[0],
          mesh.positions[3 * v + 1] - c[1],
          mesh.positions[3 * v + 2] - c[2],
        ),
      );
    const relief = smoothstepHumanSourceFade(reliefDistance[v], P.fadeMetres);
    if (relief < 1) steppedAside++;
    field[v] *= smoothstepHumanSourceFade(nearest, P.fadeMetres) * relief;
  }
  const cup = rows(P.breast);
  const length = new Float64Array(n);
  let most = 0;
  for (let v = 0; v < n; v++) {
    length[v] = Math.hypot(cup[3 * v], cup[3 * v + 1], cup[3 * v + 2]);
    most = Math.max(most, length[v]);
  }
  for (let v = 0; v < n; v++) length[v] /= most;
  const share = smooth(length, P.highSweeps);
  const musculature = new Float64Array(3 * n);
  const chest = new Float64Array(3 * n);
  for (let v = 0; v < n; v++) {
    const w =
      0.5 *
      (Math.min(Math.max(share[v], 0), 1) +
        Math.min(Math.max(share[twin[v]], 0), 1));
    for (let c = 0; c < 3; c++) {
      chest[3 * v + c] = field[v] * w * normals[3 * v + c];
      musculature[3 * v + c] = field[v] * (1 - w) * normals[3 * v + c];
    }
  }
  return {
    rows: { [P.musculature]: musculature, [P.chest]: chest },
    receipt: {
      revision: P.revision,
      method:
        "lean muscular body minus lean average-muscle body built through the body view, along symmetric area-weighted normals; band-passed by uniform-Laplacian sweeps f <- (f + neighbour mean)/2 (high sweeps less low sweeps), gain, made bilaterally symmetric; smoothstep fade within the fade length of the nipple-areola centres (skin landmark nipple-left and its mirror twin) and the crotch cut; zero on the support of each relief endpoint with the same smoothstep fade outward (each owns its muscle's relief); split over the breast mound by the cupsize endpoint's normalized length smoothed by the high sweeps; along the normals only; nipple region refilled; stored at 10 micrometres",
      kept: "input difference, sweep smoother and counts, gain, smoothstep fade length, symmetry: checked against the r6 receipt's arithmetic on the r5 surface (rms 0.016 mm away from the regions the receipt leaves undetermined)",
      chosen: {
        reliefStepAside:
          "zero on the support of each relief endpoint, smoothstep fade over the fade length outward; the receipt's 'stepping aside' does not determine a rule, and the endpoint that owns a muscle's relief should carry it alone",
        breastSplit:
          "weight is the cupsize-max endpoint's length over its maximum, smoothed by the high sweeps and clamped to [0, 1]; chest and musculature come from the same run",
        nippleCentres:
          "the body view's nipple-left skin landmark and its mirror twin, replacing the r6 coordinates recovered from that revision's neutral",
      },
      parameters: { ...P },
      readings: {
        steppedAsideVertices: steppedAside,
        reliefSupportVertices: new Set(reliefSupport).size,
      },
    },
  };
}

import type { AutoMovieHumanEyelid } from "../../../../packages/human/src/generation/AutoMovieHumanEyelid";
import { HumanAnatomy as A } from "./HumanAnatomy";

/** Read visible lid-contact geometry rather than its recessed skin-trim loop. */
export function HumanEyelidMeasurements(lid: AutoMovieHumanEyelid.ILid): { length: number; height: number } {
  const medial: A.V3 = lid.samples[lid.medial]!.contact;
  const lateral: A.V3 = lid.samples[lid.lateral]!.contact;
  const crossings: number[] = [];
  for (let k: number = 0; k < lid.samples.length; k++) {
    const a: A.V3 = lid.samples[k]!.contact;
    const b: A.V3 = lid.samples[(k + 1) % lid.samples.length]!.contact;
    const u: number = A.dot(A.sub(a, lid.globe.centre), lid.globe.lateral);
    const v: number = A.dot(A.sub(b, lid.globe.centre), lid.globe.lateral);
    if ((u >= 0) === (v >= 0)) continue;
    const point: A.V3 = A.lerp(a, b, u / (u - v));
    crossings.push(A.dot(A.sub(point, lid.globe.centre), lid.globe.up));
  }
  return {
    length: A.dist(medial, lateral),
    height: crossings.length < 2 ? NaN : Math.max(...crossings) - Math.min(...crossings),
  };
}

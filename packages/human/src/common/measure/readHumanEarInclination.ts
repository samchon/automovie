import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { readHumanEarLength } from "./readHumanEarLength";

/**
 * Read an auricle's inclination, in degrees: "Ear angulation is considered as
 * the angle formed between Super-Aurale (Sup-Au), Sub-Aurale (Sba) and
 * Otobasion Superious (Obs)" (Meleti Venkata Sowmya et al., J Oral Biol
 * Craniofac Res 2023, PMC10432210, study variable 7; 400 selected OPD
 * participants imaged with VECTRA H2 in northern India). No population
 * angle is substituted. Superaurale and subaurale are the named ear area's
 * highest and lowest points (`readHumanEarLength`) and `otobasionSuperius` is
 * the registered landmark. The sentence names three points; the angle is read
 * at the middle-named point, subaurale, a stated convention. A missing or
 * misplaced area refuses by name, and coincident or non-finite angle
 * directions refuse instead of yielding a measured NaN.
 */
export function readHumanEarInclination(
  head: IAutoMovieHumanHeadSkin,
  region: string,
  otobasionSuperius: IAutoMovieVector3,
): number {
  const { superaurale, subaurale } = readHumanEarLength(head, region).points;
  const a = [
    superaurale.x - subaurale.x,
    superaurale.y - subaurale.y,
    superaurale.z - subaurale.z,
  ];
  const b = [
    otobasionSuperius.x - subaurale.x,
    otobasionSuperius.y - subaurale.y,
    otobasionSuperius.z - subaurale.z,
  ];
  const denominator = Math.hypot(...a) * Math.hypot(...b);
  if (!Number.isFinite(denominator) || denominator === 0)
    throw new Error(
      `The auricle inclination of ${head.id} has no finite angle directions.`,
    );
  const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / denominator;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

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
 *
 * @evidence contracts/common.md#principled-implementation The angle at subaurale is computed from the superaurale and registered attachment directions using normalized dot/acos, with [-1,1] clamping for rounding. Coincident/nonfinite directions refuse and the middle-point convention remains an approximation.
 * @evidence contracts/common.md#clear-and-simple-design Ear-length admission supplies the actual highest/lowest source points; this reader owns only the angular projection and degree output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population inclination or specimen adjustment is used; cosine clamping addresses the actual acos domain rather than a target angle.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the three roles, subaurale vertex convention, degree units, registration requirements and degenerate-direction refusal.
 * @evidence contracts/performance.md#efficient-algorithms The delegated ear-length read scans R region members, followed by fixed-dimensional vector/hypot/acos work; total O(R) time/storage includes the shared reader's gathered list.
 * @evidence contracts/performance.md#reuse-equivalent-work One ear-length reading supplies both superaurale/subaurale, and its admitted points are reused for the angle without a cross-shape cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Direction arrays and the underlying ear reading are call-local; only one degree scalar escapes, with no retained registration, handle or task.
 */
export function readHumanEarInclination(
  head: IAutoMovieHumanHeadSkin,
  region: string,
  otobasionSuperius: IAutoMovieVector3,
): number {
  const {
    superaurale,
    subaurale,
  }: ReturnType<typeof readHumanEarLength>["points"] = readHumanEarLength(
    head,
    region,
  ).points;
  const a: number[] = [
    superaurale.x - subaurale.x,
    superaurale.y - subaurale.y,
    superaurale.z - subaurale.z,
  ];
  const b: number[] = [
    otobasionSuperius.x - subaurale.x,
    otobasionSuperius.y - subaurale.y,
    otobasionSuperius.z - subaurale.z,
  ];
  const denominator: number = Math.hypot(...a) * Math.hypot(...b);
  if (!Number.isFinite(denominator) || denominator === 0)
    throw new Error(
      `The auricle inclination of ${head.id} has no finite angle directions.`,
    );
  const cos: number = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / denominator;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

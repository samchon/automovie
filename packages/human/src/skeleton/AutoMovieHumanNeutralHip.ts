import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The hip's neutral: the thigh hanging under the hip centre at the least
 * abduction at which the two legs' skins do not cross, by the shortest turn
 * from the bind, keeping its forward knee.
 *
 * A thigh hung plumb from a hip centre that stands closer to the midline than
 * the thigh's own half breadth would pass through the other thigh, so, as the
 * resting arm clears the trunk, the leg's angle from the plumb line is the
 * least that keeps every point of its skin under the crotch on its own side of
 * the midline: the legs are mirror images, so a leg that stays on its own side
 * meets the other only at the midline. A point the bind already holds against
 * the midline (the thighs' contact) may stay there and go no further. The
 * angle is read in steps of {@link STEP} from the plumb line up to the bind's
 * own abduction, which clears by construction.
 */
export namespace AutoMovieHumanNeutralHip {
  /** One hip's neutral. */
  export interface IOutput {
    /** The thigh's world turn from the bind. */
    turn: Math3D.Quaternion;

    /** The abduction from the plumb line, degrees. */
    resting: number;
  }

  /** Step of the abduction scan, degrees. */
  export const STEP: number = 0.25;

  /**
   * Derive one hip's neutral.
   *
   * @param body The bind skeleton.
   * @param rings The skin; the side's leg chain `leg.<side>` is read.
   * @param side Which leg.
   * @returns The thigh's world turn and its abduction.
   */
  export function derive(body: IAutoMovieHumanNeutralBody, rings: readonly IAutoMovieHumanChainRings[], side: "left" | "right"): IOutput {
    const s: number = side === "left" ? 1 : -1;
    const bind: Math3D.Vector = body.direction(`${side}UpperLeg`);
    const hip: Math3D.Vector = body.byBone.get(`${side}UpperLeg`)!.position;
    const leg: IAutoMovieHumanChainRings | undefined = rings.find((r: IAutoMovieHumanChainRings): boolean => r.chain === `leg.${side}`);
    const target = (degrees: number): Math3D.Vector => {
      const a: number = (degrees * Math.PI) / 180;
      return [0, -Math.cos(a), s * Math.sin(a)];
    };
    const plumb: IOutput = { turn: Turn.arc(bind, Turn.DOWN), resting: 0 };
    if (leg === undefined || leg.stations.length < 2) return plumb;

    // The skin under the crotch: every ring below the chain's top one.
    const top: number = leg.stations.length - 1;
    const points: Math3D.Vector[] = [];
    for (let k: number = 0; k < top * leg.phases; k++) points.push([leg.points[3 * k]!, leg.points[3 * k + 1]!, leg.points[3 * k + 2]!]);

    // The bind's own abduction in the frontal plane bounds the scan.
    const limit: number = (Math.atan2(s * bind[2], -bind[1]) * 180) / Math.PI;
    for (let degrees: number = 0; degrees < limit; degrees += STEP) {
      const turn: Math3D.Quaternion = Turn.arc(bind, target(degrees));
      const clear: boolean = points.every((p: Math3D.Vector): boolean => {
        const q: Math3D.Vector = Math3D.add(hip, Math3D.rotate(turn, Math3D.sub(p, hip)));
        return s * q[2] >= Math.min(0, s * p[2]);
      });
      if (clear) return { turn, resting: degrees };
    }
    return { turn: Turn.arc(bind, target(Math.max(0, limit))), resting: Math.max(0, limit) };
  }
}

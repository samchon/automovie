import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootDraft } from "./IAutoMovieHumanFootDraft";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * Share of the sole's breadth, from its medial edge, over which the medial arch's lift fades to the ground. The midfoot rests on the lateral band of the sole while the medial band clears it, the footprint's narrow waist. Grade: conventional, set against renders.
 */
const ARCH_SPAN: number = 0.65;

/**
 * Shape the sole's interior.
 *
 * The plan position of each sole vertex is the Coons patch of the sole's boundary, so the grid spreads evenly from the heel to the toe roots. Its height is zero where the heel, the lateral border and the ball rest on the ground, and lifted under the medial arch by as much as the medial edge stands above the lateral one at the same distance along the foot, fading from the medial edge toward the lateral, so the footprint keeps its lateral band and loses its medial one at the midfoot.
 *
 * @param plan The foot's plan
 * @param draft The draft whose sole boundary is placed; its interior is filled in place
 */
export function shapeAutoMovieHumanFootSole(
  plan: IAutoMovieHumanFootPlan,
  draft: IAutoMovieHumanFootDraft,
): void {
  const { columns, rows } = AUTOMOVIE_HUMAN_FOOT_GRID;
  const S: IAutoMovieVector3[][] = draft.sole;
  for (let i: number = 1; i < columns - 1; ++i)
    for (let j: number = 1; j < rows - 1; ++j) {
      const a: number = i / (columns - 1);
      const b: number = j / (rows - 1);
      const coons = (q: (p: IAutoMovieVector3) => number): number =>
        (1 - b) * q(S[i]![0]!) +
        b * q(S[i]![rows - 1]!) +
        (1 - a) * q(S[0]![j]!) +
        a * q(S[columns - 1]![j]!) -
        ((1 - a) * (1 - b) * q(S[0]![0]!) +
          a * (1 - b) * q(S[columns - 1]![0]!) +
          (1 - a) * b * q(S[0]![rows - 1]!) +
          a * b * q(S[columns - 1]![rows - 1]!));
      const x: number = coons((p: IAutoMovieVector3): number => p.x);
      const z: number = coons((p: IAutoMovieVector3): number => p.z);
      const f: number = (z - plan.heel) / plan.length;
      const medial: number = smoothstep((ARCH_SPAN - a) / ARCH_SPAN);
      const edge: number =
        interpolateAutoMovieHumanFootProfile(plan.medial.sole, f) -
        interpolateAutoMovieHumanFootProfile(plan.lateral.sole, f);
      S[i]![j] = AutoMovieHumanVector.of(
        x,
        Math.max(0, edge) * plan.length * medial,
        z,
      );
    }
}

const smoothstep = (t: number): number =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootDraft } from "./IAutoMovieHumanFootDraft";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";
import { shapeAutoMovieHumanFootToes } from "./shapeAutoMovieHumanFootToes";

/**
 * Where a toe's root opens, as fractions of its length from its joint: dorsally the web reaches about a third of the way along the proximal phalanx, while plantarly the toe begins further forward, at the digitoplantar crease. Grade: conventional, set against renders.
 */
const ROOT: Record<"dorsal" | "plantar", number> = {
  dorsal: 0.3,
  plantar: 0.38,
};

/**
 * Place the boundaries of the upper and the sole: the rim's two edges round the heel and along both borders, and the toe roots across the front.
 *
 * The heel is a half ellipse in plan from the medial border round to the lateral, the upper's edge higher at the back, where the calcaneal tuberosity rounds off, than at the sides. Along each border the rim's upper edge and the sole's edge follow the plan's profiles at the border's stations, the sole's edge set inside the upper's so the side wall rounds under. Across the front the upper's edge and the sole's pass through the dorsal and plantar corners of each toe's root, so the toes grow out of the rim.
 *
 * @param plan The foot's plan
 * @returns A draft whose upper and sole hold their boundary vertices only, and no toes
 */
export function outlineAutoMovieHumanFoot(
  plan: IAutoMovieHumanFootPlan,
): IAutoMovieHumanFootDraft {
  const { columns, rows } = AUTOMOVIE_HUMAN_FOOT_GRID;
  const L: number = plan.length;
  const upper: Array<Array<IAutoMovieVector3 | null>> = Array.from(
    { length: columns },
    (): Array<IAutoMovieVector3 | null> =>
      new Array<IAutoMovieVector3 | null>(rows).fill(null),
  );
  const sole: IAutoMovieVector3[][] = Array.from(
    { length: columns },
    (): IAutoMovieVector3[] => new Array<IAutoMovieVector3>(rows),
  );
  const along = (f: number): number => plan.heel + f * L;
  const border = (
    b: IAutoMovieHumanFootPlan.IBorder,
    sign: number,
    f: number,
    edge: "rim" | "sole",
  ): IAutoMovieVector3 =>
    AutoMovieHumanVector.of(
      plan.axis +
        sign *
          (interpolateAutoMovieHumanFootProfile(b.offset, f) * L -
            (edge === "sole" ? b.inset : 0)),
      interpolateAutoMovieHumanFootProfile(b[edge], f) * L,
      along(f),
    );
  for (let j: number = 1; j < rows - 1; ++j) {
    upper[0]![j] = border(plan.medial, -1, plan.medial.stations[j]!, "rim");
    upper[columns - 1]![j] = border(
      plan.lateral,
      1,
      plan.lateral.stations[j]!,
      "rim",
    );
    sole[0]![j] = border(plan.medial, -1, plan.medial.stations[j]!, "sole");
    sole[columns - 1]![j] = border(
      plan.lateral,
      1,
      plan.lateral.stations[j]!,
      "sole",
    );
  }

  // heel arc, medial to lateral round the back
  const arc = plan.heelArc;
  const inset: number = plan.medial.inset;
  for (let i: number = 0; i < columns; ++i) {
    const psi: number = Math.PI + (Math.PI * i) / (columns - 1);
    const back: number = Math.sin((Math.PI * i) / (columns - 1));
    upper[i]![0] = AutoMovieHumanVector.of(
      arc.x + arc.width * Math.cos(psi),
      arc.rim[1] + (arc.rim[0] - arc.rim[1]) * back,
      along(arc.at) + arc.reach * Math.sin(psi),
    );
    sole[i]![0] = AutoMovieHumanVector.of(
      arc.x + (arc.width - inset) * Math.cos(psi),
      arc.sole,
      along(arc.at) + (arc.reach - inset) * Math.sin(psi),
    );
  }

  // toe roots across the front
  plan.toes.forEach((toe: IAutoMovieHumanFootPlan.IToe, t: number): void => {
    const height: number = toe.height * (toe.hallux ? 1.35 : 1.42);
    for (const [k, side] of [
      [2 * t, -1],
      [2 * t + 1, 1],
    ] as const) {
      upper[k]![rows - 1] = shapeAutoMovieHumanFootToes.at(
        toe,
        ROOT.dorsal,
        side * 0.45 * toe.width,
        height,
      );
      sole[k]![rows - 1] = shapeAutoMovieHumanFootToes.at(
        toe,
        ROOT.plantar,
        side * 0.5 * toe.width,
        0.022 * L,
      );
    }
  });
  return { upper, sole, toes: [] };
}

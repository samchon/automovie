import { AutoMovieHumanPhysicalSupports } from "@automovie/human";
import type { IAutoMovieFootfallPattern } from "@automovie/interface";

import type { FighterBody } from "../motion/fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";

/** Bind this actor's identity to Human's anatomical support description. */
export function boutSupportPattern(
  rig: Rig,
  id: string,
  frame?: FighterBody.Frame,
): IAutoMovieFootfallPattern {
  const raised: ("left" | "right")[] = (["left", "right"] as const).filter(
    (side: "left" | "right"): boolean => {
      const leg: FighterBody.Leg | undefined = frame?.legs[side];
      return leg?.kind === "place" && leg.placement.heel > 0;
    },
  );
  return {
    ...AutoMovieHumanPhysicalSupports(rig.profile, rig.neutral, raised),
    id: `${id}-own-soles`,
  };
}

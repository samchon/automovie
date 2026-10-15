import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { AUTOMOVIE_HUMAN_TRUNK_LOOPS } from "./AUTOMOVIE_HUMAN_TRUNK_LOOPS";
import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * Add the two gluteus maximus masses to the back of the pelvis of one side.
 *
 * Each mass (the form record's `gluteal`: its centre across from the midline and below the buttock point, its half-width and its reach above and below) is a smooth bump, Gaussian across and up and down from its centre, pushing the back slots behind the section's widest point backward and a little outward by the projection the profile left for it. A slot takes both masses, its own and the other side's mirrored one, so the midline between them carries their overlap. The thigh root's slots at the gluteal fold take the bump's tail, which tucks the buttock's lower curve into the fold.
 The muscle's upper border rises from the sacrum to the iliac crest's posterior third and its lower border crosses the gluteal fold (Gray 1918), so the mass reaches far up and falls off fast below its fullest point.
 *
 * @param frame The side's trunk frame
 * @param profile The side's continuous body
 * @param loops Left half torso loops, the hip already placed, modified in place
 */
export function placeAutoMovieHumanTrunkGluteal(
  frame: IAutoMovieHumanTrunkFrame,
  profile: profileAutoMovieHumanTrunk.IProfile,
  loops: IAutoMovieVector3[][],
): void {
  const S: number = frame.stature;
  const MASS: IAutoMovieHumanTrunkForm.IGluteal =
    AUTOMOVIE_HUMAN_TRUNK_FORM.gluteal;
  const y0: number = frame.levels.buttock - MASS.below * S;
  const half: number = profile.half(frame.levels.buttock);
  const x0: number = MASS.across * half;
  const width: number = MASS.width * half;
  for (let i: number = 0; i < AUTOMOVIE_HUMAN_TRUNK_LOOPS - 3; ++i)
    for (let j: number = 7; j <= 12; ++j) {
      const q: IAutoMovieVector3 | undefined = loops[i]![j];
      if (q === undefined || q.z > profile.widest(q.y)) continue;
      const reach: number = (q.y > y0 ? MASS.above : MASS.under) * S;
      const vertical: number = Math.exp(-(((q.y - y0) / reach) ** 2));
      const bump = (cx: number): number =>
        Math.exp(-(((q.x - cx) / width) ** 2));
      const own: number = bump(x0) * vertical;
      const other: number = bump(-x0) * vertical;
      const lateral: number = (own * (q.x - x0) + other * (q.x + x0)) / width;
      const push: number = profile.gluteal * (own + other);
      loops[i]![j] = AutoMovieHumanVector.of(
        j === 12 ? 0 : q.x + MASS.outward * profile.gluteal * lateral,
        q.y,
        q.z - push,
      );
    }
}

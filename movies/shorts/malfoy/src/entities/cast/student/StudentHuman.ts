import {
  AutoMovieHumanSex,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

import type { IStudentProfile } from "./IStudentProfile";
import { carinaMalfoy } from "./carinaMalfoy";
import { harryPotter } from "./harryPotter";

/**
 * The Human body a student's polygon figure is built from: Carina and Harry
 * calibrate their own parameters; every practice player borrows the body of
 * the hero of the same sex, scaled to the player's stature, so a mount
 * calibrates at most two bodies. Each calibration runs once per process.
 *
 * ```ts
 * const human = StudentHuman.of(profile); // { neutral, scale }
 * ```
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures Carina's own Human body.
 * @evidence docs/body/settings/cast/harry-potter.md#measures Harry's own Human body.
 * @evidence docs/body/settings/crowds/practice-teams.md#players Players are drawn from the hero body of their sex at their own stature.
 * @evidence contracts/development/common.md#meaningful-documentation States which body each student uses, the scale and the memo.
 * @evidence contracts/development/implementation.md#principled-implementation `AutoMovieHumanSkeleton.prepare` calibrates the parameters in process; the neutral output is the figure's bind.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One memo keyed by template id.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The players' shared bodies are a stated production choice, scaled to each stature.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two calibrations per process.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every mount and figure shares the memoized neutral bodies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo holds two neutral skeleton outputs for the process lifetime.
 */
export namespace StudentHuman {
  /** A student's Human body: the neutral skeleton and its scale to the student's stature. */
  export interface IHuman {
    /** Neutral bones and placements, metres, at the template's stature. */
    neutral: AutoMovieHumanSkeleton.IOutput;

    /** Student stature over the template's stature. */
    scale: number;
  }

  /**
   * The Human body of a student.
   *
   * @param profile The student's record.
   * @returns The body.
   */
  export function of(profile: IStudentProfile): IHuman {
    const template: IStudentProfile =
      profile.id === carinaMalfoy.id || profile.id === harryPotter.id
        ? profile
        : profile.parameters.body.anatomy.sex === AutoMovieHumanSex.Female
          ? carinaMalfoy
          : harryPotter;
    let neutral: AutoMovieHumanSkeleton.IOutput | undefined = memo.get(template.id);
    if (neutral === undefined) {
      const params: IAutoMovieHumanParameters = template.parameters;
      neutral = AutoMovieHumanSkeleton.prepare(params)({});
      memo.set(template.id, neutral);
    }
    return { neutral, scale: profile.stature / template.stature };
  }

  /** Neutral bodies by template id. */
  const memo: Map<string, AutoMovieHumanSkeleton.IOutput> = new Map();
}

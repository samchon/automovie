import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { AutoMovieMotionHumanBody } from "@automovie/motions";

import type { IMotionHumanPerson } from "./people/IMotionHumanPerson";
import { MOTION_HUMAN_PEOPLE } from "./people/MOTION_HUMAN_PEOPLE";

/**
 * A real body for the motion tests: one of the fourteen people of the ANSUR
 * 1988 boundary population the capture harness sweeps, prepared by Human at the
 * skeleton level and wrapped as the motions package's body.
 *
 * Each person's Human parameters and surveyed mass are typed constants
 * (`MOTION_HUMAN_PEOPLE`). Each call prepares and wraps a new body, the
 * preparation tens of milliseconds and the wrapping, which solves the quiet
 * stance, hundreds; nothing is kept between calls, so no test shares a body
 * with another. A unit test reads the stored rig and profile (`humanFixture`)
 * instead and takes a whole body only for a function whose input is one.
 *
 * @param name The person.
 * @returns A new body.
 */
export function motionHumanBody(
  name: motionHumanBody.Name,
): IAutoMovieMotionHumanBody {
  const person: IMotionHumanPerson = MOTION_HUMAN_PEOPLE[name];
  const prepared: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(person.params, {
      mass: person.mass,
      id: name,
    });
  return AutoMovieMotionHumanBody.create(prepared.skeleton, prepared.profile);
}

/** Companion types and lists of {@link motionHumanBody}. */
export namespace motionHumanBody {
  /** The people of the fixture. */
  export type Name = MOTION_HUMAN_PEOPLE.Name;

  /**
   * Every person of the sweep: both sexes' small and large corners, the
   * stature, leg, shoulder and arm extremes and the average bodies.
   */
  export const SWEEP: readonly Name[] = [
    "f-small",
    "f-minus-one",
    "f-average",
    "f-tall",
    "f-long-legged",
    "m-short",
    "m-average",
    "m-tall",
    "m-large",
    "m-short-legged",
    "m-broad",
    "m-narrow",
    "m-long-armed",
    "m-short-armed",
  ];

  /**
   * The spread of extremes a test too slow for the whole sweep runs on: the
   * shortest and lightest person (`f-small`, 1.48 m and 38 kg), the tallest and
   * heaviest (`m-large`, 1.91 m and 118 kg), the tallest woman (`f-tall`, 1.78
   * m) and the average man.
   */
  export const EXTREMES: readonly Name[] = [
    "f-small",
    "m-large",
    "f-tall",
    "m-average",
  ];
}

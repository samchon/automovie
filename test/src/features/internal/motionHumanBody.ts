import {
  AutoMovieHumanCanonicalBody,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import { type IHumanBody, createHumanBody } from "@automovie/motions";

import PEOPLE from "./MOTION_HUMAN_PEOPLE.json";

/**
 * A real body for the motion tests: one of the fourteen people of the ANSUR
 * 1988 boundary population the capture harness sweeps, prepared by Human at
 * the skeleton level and wrapped as the motions package's body.
 *
 * `MOTION_HUMAN_PEOPLE.json` holds each person's Human parameters and
 * surveyed mass, a snapshot of `HumanPopulation.params(end)` and
 * `HumanPopulation.measures(end).mass` of the motions package's capture
 * harness for the ends of its sweep (the harness is not a package entry
 * point, so a test cannot import it).
 *
 * A body takes about two seconds to prepare, so each is prepared once a
 * process (`AutoMovieHumanCanonicalBody.prepare`), wrapped and shared by every
 * test of the process; tests must not mutate it.
 *
 * @param name The person.
 * @returns The body.
 */
export function motionHumanBody(name: motionHumanBody.Name): IHumanBody {
  const known: IHumanBody | undefined = BODIES.get(name);
  if (known !== undefined) return known;
  const person: { mass: number; params: unknown } = PEOPLE[name];
  const prepared: AutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(
      person.params as IAutoMovieHumanParameters,
      {
        mass: person.mass,
        id: name,
      },
    );
  const body: IHumanBody = createHumanBody(prepared.skeleton, prepared.profile);
  BODIES.set(name, body);
  return body;
}

/** Companion types and lists of {@link motionHumanBody}. */
export namespace motionHumanBody {
  /** The people of the fixture. */
  export type Name = keyof typeof PEOPLE;

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
   * shortest and lightest person (`f-small`, 1.48 m and 38 kg), the tallest
   * and heaviest (`m-large`, 1.91 m and 118 kg), the tallest woman
   * (`f-tall`, 1.78 m) and the average man.
   */
  export const EXTREMES: readonly Name[] = [
    "f-small",
    "m-large",
    "f-tall",
    "m-average",
  ];
}

const BODIES: Map<motionHumanBody.Name, IHumanBody> = new Map();

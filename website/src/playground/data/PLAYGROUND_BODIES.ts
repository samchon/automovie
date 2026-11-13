import type { IAutoMovieHumanParameters } from "@automovie/human";

import { PLAYGROUND_BODY_F1 } from "./PLAYGROUND_BODY_F1";
import { PLAYGROUND_BODY_F2 } from "./PLAYGROUND_BODY_F2";
import { PLAYGROUND_BODY_M1 } from "./PLAYGROUND_BODY_M1";
import { PLAYGROUND_BODY_M2 } from "./PLAYGROUND_BODY_M2";

/**
 * The bodies the site draws and performs with, by id. Add a person here and
 * the playground's body picker and the gallery's presets list it.
 *
 * Each mass is a body mass index of 22 at the person's stature. It sets the
 * contact profile's mass only; the drawing does not depend on it.
 */
export const PLAYGROUND_BODIES: Readonly<
  Record<string, PLAYGROUND_BODIES.IEntry>
> = {
  f1: {
    label: "Woman, 1.70 m",
    mass: 63,
    parameters: PLAYGROUND_BODY_F1,
  },
  f2: {
    label: "Woman, 1.70 m, second build",
    mass: 64,
    parameters: PLAYGROUND_BODY_F2,
  },
  m1: {
    label: "Man, 1.84 m",
    mass: 75,
    parameters: PLAYGROUND_BODY_M1,
  },
  m2: {
    label: "Man, 1.86 m",
    mass: 76,
    parameters: PLAYGROUND_BODY_M2,
  },
};
export namespace PLAYGROUND_BODIES {
  /** One body. */
  export interface IEntry {
    /** What a picker shows. */
    label: string;

    /** Body mass, kilograms. */
    mass: number;

    /** The Human parameters the canonical body is prepared from. */
    parameters: IAutoMovieHumanParameters;
  }
}

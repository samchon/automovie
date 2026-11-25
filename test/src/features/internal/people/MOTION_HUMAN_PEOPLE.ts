import { F_AVERAGE } from "./F_AVERAGE";
import { F_LONG_LEGGED } from "./F_LONG_LEGGED";
import { F_MINUS_ONE } from "./F_MINUS_ONE";
import { F_SMALL } from "./F_SMALL";
import { F_TALL } from "./F_TALL";
import type { IMotionHumanPerson } from "./IMotionHumanPerson";
import { M_AVERAGE } from "./M_AVERAGE";
import { M_BROAD } from "./M_BROAD";
import { M_LARGE } from "./M_LARGE";
import { M_LONG_ARMED } from "./M_LONG_ARMED";
import { M_NARROW } from "./M_NARROW";
import { M_SHORT } from "./M_SHORT";
import { M_SHORT_ARMED } from "./M_SHORT_ARMED";
import { M_SHORT_LEGGED } from "./M_SHORT_LEGGED";
import { M_TALL } from "./M_TALL";

/**
 * The fourteen people of the motion tests' ANSUR 1988 boundary population by
 * name, each the Human parameters and surveyed mass a body is prepared from:
 * both sexes' small and large corners, the stature, leg, shoulder and arm
 * extremes and the average bodies, a snapshot of the motions package's capture
 * harness (`HumanPopulation.params(end)`, `HumanPopulation.measures(end).mass`)
 * for the ends of its sweep, typed so the compiler checks every value against
 * the Human's parameters.
 */
export const MOTION_HUMAN_PEOPLE: Readonly<
  Record<MOTION_HUMAN_PEOPLE.Name, IMotionHumanPerson>
> = {
  "f-small": F_SMALL,
  "f-minus-one": F_MINUS_ONE,
  "f-average": F_AVERAGE,
  "f-tall": F_TALL,
  "f-long-legged": F_LONG_LEGGED,
  "m-short": M_SHORT,
  "m-average": M_AVERAGE,
  "m-tall": M_TALL,
  "m-large": M_LARGE,
  "m-short-legged": M_SHORT_LEGGED,
  "m-broad": M_BROAD,
  "m-narrow": M_NARROW,
  "m-long-armed": M_LONG_ARMED,
  "m-short-armed": M_SHORT_ARMED,
};

/** Companion types of {@link MOTION_HUMAN_PEOPLE}. */
export namespace MOTION_HUMAN_PEOPLE {
  /** A person's name. */
  export type Name =
    | "f-small"
    | "f-minus-one"
    | "f-average"
    | "f-tall"
    | "f-long-legged"
    | "m-short"
    | "m-average"
    | "m-tall"
    | "m-large"
    | "m-short-legged"
    | "m-broad"
    | "m-narrow"
    | "m-long-armed"
    | "m-short-armed";
}

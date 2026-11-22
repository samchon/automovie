import type { IAutoMovieMotionHumanTapDance } from "@automovie/interface";

/**
 * The strike tables of the tap steps (#3991, 	apDance): each strike's
 * foot, quarter beat, setting, landing place, bearing and sound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a strike and a step hold.
 * @evidence contracts/development/design.md#principled-representation Steps as data over the tap law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The strike and step records and the table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Times are quarter beats; places are relative to where the foot stood.
 */
export namespace tapDanceSteps {
  /** Where a strike lands relative to where the foot stood. */
  export type Where = "home" | "front" | "back";

  /** One strike of a step. */
  export interface IStrike {
    /** The leading foot or the other. */
    foot: "lead" | "other";

    /** Quarter beats from the step's first beat. */
    at: number;

    /** How the foot is set down. */
    mode: IAutoMovieMotionHumanTapDance.Part;

    /** Where it lands. */
    where: Where;

    /** Whether it bears after landing. */
    bears: boolean;

    /** The part that sounds; silent when absent. */
    sound?: IAutoMovieMotionHumanTapDance.Part;

    /** Whether the foot rolls onto it without lifting (a rise or a heel's drop). */
    roll?: boolean;
  }

  /** One step's strikes and its length in beats. */
  export interface IStep {
    /** The strikes in time order. */
    strikes: readonly IStrike[];

    /** Its length in beats. */
    beats: number;
  }

  /** The steps' strike tables: shuffle, flap, ball change, heel drop, cramp roll and a single time step. */
  export const STEPS: Readonly<
    Record<IAutoMovieMotionHumanTapDance.Step, IStep>
  > = {
    shuffle: {
      beats: 1,
      strikes: [
        {
          foot: "lead",
          at: -2,
          mode: "ball",
          where: "front",
          bears: false,
          sound: "ball",
        },
        {
          foot: "lead",
          at: 0,
          mode: "ball",
          where: "back",
          bears: false,
          sound: "ball",
        },
        { foot: "lead", at: 2, mode: "flat", where: "home", bears: true },
      ],
    },
    flap: {
      beats: 1,
      strikes: [
        {
          foot: "lead",
          at: -2,
          mode: "ball",
          where: "front",
          bears: false,
          sound: "ball",
        },
        {
          foot: "lead",
          at: 0,
          mode: "ball",
          where: "front",
          bears: true,
          sound: "ball",
        },
        {
          foot: "lead",
          at: 2,
          mode: "flat",
          where: "front",
          bears: true,
          roll: true,
        },
      ],
    },
    ballChange: {
      beats: 1,
      strikes: [
        {
          foot: "lead",
          at: 0,
          mode: "ball",
          where: "back",
          bears: true,
          sound: "ball",
        },
        {
          foot: "other",
          at: 2,
          mode: "flat",
          where: "home",
          bears: true,
          sound: "flat",
        },
        { foot: "lead", at: 4, mode: "flat", where: "home", bears: true },
      ],
    },
    heelDrop: {
      beats: 1,
      strikes: [
        {
          foot: "lead",
          at: -2,
          mode: "ball",
          where: "home",
          bears: true,
          roll: true,
        },
        {
          foot: "lead",
          at: 0,
          mode: "flat",
          where: "home",
          bears: true,
          sound: "heel",
          roll: true,
        },
      ],
    },
    crampRoll: {
      beats: 1,
      strikes: [
        {
          foot: "lead",
          at: 0,
          mode: "ball",
          where: "home",
          bears: true,
          sound: "ball",
        },
        {
          foot: "other",
          at: 1,
          mode: "ball",
          where: "home",
          bears: true,
          sound: "ball",
        },
        {
          foot: "lead",
          at: 2,
          mode: "flat",
          where: "home",
          bears: true,
          sound: "heel",
          roll: true,
        },
        {
          foot: "other",
          at: 3,
          mode: "flat",
          where: "home",
          bears: true,
          sound: "heel",
          roll: true,
        },
      ],
    },
    timeStep: {
      beats: 2,
      strikes: [
        {
          foot: "lead",
          at: -2,
          mode: "ball",
          where: "front",
          bears: false,
          sound: "ball",
        },
        {
          foot: "lead",
          at: -1,
          mode: "ball",
          where: "back",
          bears: false,
          sound: "ball",
        },
        {
          foot: "other",
          at: 0,
          mode: "ball",
          where: "home",
          bears: true,
          sound: "ball",
        },
        {
          foot: "lead",
          at: 2,
          mode: "flat",
          where: "home",
          bears: true,
          sound: "flat",
        },
        {
          foot: "other",
          at: 3,
          mode: "ball",
          where: "front",
          bears: false,
          sound: "ball",
        },
        {
          foot: "other",
          at: 4,
          mode: "flat",
          where: "front",
          bears: true,
          sound: "flat",
        },
        {
          foot: "lead",
          at: 6,
          mode: "flat",
          where: "front",
          bears: true,
          sound: "flat",
        },
      ],
    },
  };
}

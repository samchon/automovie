import type { AutoMovieHumanoidRegion } from "@automovie/interface";

import type { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import type { AutoMovieMotionHumanTouchForm } from "../compose/AutoMovieMotionHumanTouchForm";

/**
 * The hand-to-face tasks as rows of the touch generator: each task's region
 * on the performer's own head, the implied tool's tip as the effector, the
 * movement at the face and the head's share of the approach. Read by
 * `handToFace`, which states the sources.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a row holds and who reads the table.
 * @evidence contracts/development/design.md#principled-representation One record per task over the touch row's data, so a task is data and never a law of its own.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The task union, the row and the table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Regions are the interface's; tool tips are shares of the hand's length.
 */
export namespace handToFaceRows {
  /** The tasks. */
  export type Task =
    | "drink"
    | "sip"
    | "eat"
    | "bite"
    | "phone"
    | "read"
    | "brushTeeth"
    | "comb"
    | "washFace"
    | "wipeMouth";

  /**
   * One task's row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The touch row's data plus the head's share of the approach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `plan` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Regions are the interface's; the right hand's region is named and the left hand's mirrored.
   */
  export interface IRow {
    /** The region the right hand works on; `null` for a held sheet before the eyes. */
    region: AutoMovieHumanoidRegion | null;

    /** The region the left hand works on at the same time; one hand when absent. */
    other?: AutoMovieHumanoidRegion;

    /** The effector. */
    effector: AutoMovieMotionHumanTouchEffector.IEffector;

    /** The movement at the face. */
    kind: AutoMovieMotionHumanTouchForm.Kind;

    /** Repetitions when the parameters give none. */
    count: number;

    /** Seconds at the face after the repetitions when the parameters give none. */
    hold: number;

    /** The travel's direction. */
    tangent: AutoMovieMotionHumanTouchForm.Tangent;

    /** `true` when the held tool stands on the world's up at the face, as a vessel does, instead of lying on the region. */
    upright?: boolean;

    /** The point of a held prop that meets the region when the task is performed with one (`handToFace.IParams.prop`): a vessel's `lip`, a phone's `screen`; the parameters name it when absent. */
    point?: string;

    /** The head's flexion at the face, degrees; negative extends it. */
    head: number;

    /** The event name at `ready`. */
    at: string;
  }

  /** The tasks' rows (tool lengths and head angles provisional, except the reading head flexion). */
  export const ROWS: Readonly<Record<Task, IRow>> = {
    drink: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.4, palm: 0.2 },
        facing: "palm",
        along: "grasp",
      },
      kind: "hold",
      count: 1,
      hold: 1.2,
      tangent: "up",
      upright: true,
      point: "lip",
      head: -10,
      at: "atMouth",
    },
    sip: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.4, palm: 0.2 },
        facing: "palm",
        along: "grasp",
      },
      kind: "hold",
      count: 1,
      hold: 0.5,
      tangent: "up",
      upright: true,
      point: "lip",
      head: -5,
      at: "atMouth",
    },
    eat: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.9 },
        facing: "thumb",
        along: "palm",
      },
      kind: "hold",
      count: 1,
      hold: 0.3,
      tangent: "up",
      head: 10,
      at: "atMouth",
    },
    bite: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "thumb",
        along: "palm",
      },
      kind: "hold",
      count: 1,
      hold: 0.4,
      tangent: "up",
      head: 5,
      at: "atMouth",
    },
    phone: {
      region: "earRight",
      effector: {
        surface: "palm",
        shape: "relaxed",
        tool: { palm: 0.05 },
        facing: "palm",
        along: "fingers",
      },
      kind: "hold",
      count: 1,
      hold: 3,
      tangent: "up",
      point: "screen",
      head: 0,
      at: "atEar",
    },
    read: {
      region: null,
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "-palm",
        along: "thumb",
      },
      kind: "hold",
      count: 1,
      hold: 3,
      tangent: "up",
      head: 35,
      at: "atSheet",
    },
    brushTeeth: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.8 },
        facing: "thumb",
        along: "-palm",
      },
      kind: "rub",
      count: 8,
      hold: 0.2,
      tangent: "across",
      head: 0,
      at: "atMouth",
    },
    comb: {
      region: "templeRight",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { palm: 0.15 },
        facing: "palm",
        along: "fingers",
      },
      kind: "rub",
      count: 3,
      hold: 0.2,
      tangent: "up",
      head: 0,
      at: "atHead",
    },
    washFace: {
      region: "jawRight",
      other: "jawLeft",
      effector: { surface: "palm", shape: "flat" },
      kind: "rub",
      count: 3,
      hold: 0.2,
      tangent: "up",
      head: 15,
      at: "atFace",
    },
    wipeMouth: {
      region: "mouth",
      effector: { surface: "palm", shape: "relaxed" },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 0,
      at: "atMouth",
    },
  };
}

import type { IAutoMovieMotionHumanHandToFaceRows } from "@automovie/interface";

import { handToFaceSheet } from "./handToFaceSheet";

/**
 * The hand-to-face tasks as rows of the touch generator: each task's region on
 * the performer's own head, the implied tool's tip as the effector, the
 * movement at the face and the head's share of the approach. Read by
 * `handToFace`, which states the sources.
 */
export namespace handToFaceRows {
  /**
   * The tasks' rows. The drink's time at the mouth is the 1.71 s drinking phase
   * of Alt Murphy et al. 2006 (J NeuroEng Rehabil 3:18, Table 2, healthy
   * controls) and the reading head flexion is Lee et al. 2015's
   * (`handToFaceSheet.HEAD`); the tool lengths, the other head angles, times at
   * the face and stroke counts have no located measurement.
   */
  export const ROWS: Readonly<
    Record<
      IAutoMovieMotionHumanHandToFaceRows.Task,
      IAutoMovieMotionHumanHandToFaceRows.IRow
    >
  > = {
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
      hold: 1.71,
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
      head: handToFaceSheet.HEAD,
      at: "atSheet",
    },
    brushTeeth: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.8 },
        facing: "thumb",
        // The palm toward the face's midline: turned outward, the fist
        // asked the elbow 20 cm above the shoulder.
        along: "palm",
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
      // The palms on the cheeks, the fingers up and the elbows low before
      // the chest; laid on the jaw, whose surface faces down, the palms
      // turned up under it and asked the wrists to their ends.
      region: "cheekRight",
      other: "cheekLeft",
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
      effector: { surface: "palm", shape: "flat" },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 0,
      at: "atMouth",
    },
    // Equalizing a diver's ears: thumb and forefinger pinch the nose
    // through the mask's nose pocket and hold while the diver blows
    // gently (PADI Open Water Diver Manual).
    pinchNose: {
      region: "nose",
      // The forefinger's tip closes on the nose pocket, the thumb opposite.
      effector: { surface: "indexTip", shape: "point" },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      // The nose's surface faces down as well as forward: read it level, so
      // the finger stands on the world's up beside it.
      level: true,
      head: 0,
      at: "atNose",
    },
  };
}

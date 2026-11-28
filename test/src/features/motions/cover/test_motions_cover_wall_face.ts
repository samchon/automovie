import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  coverWall
} from "../../../../../packages/motions/src/cover/internal/coverWall";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Sixty-four binary64 rounding units cover a normalized quarter-turn. */
const ROUNDING: number = 64 * Number.EPSILON;

/**
 * Check a fixed scenic wall face from its prop frame.
 *
 * Scenarios:
 *
 * 1. Translate and quarter-turn a five-metre wall. Read its floor-level
 *    centre, +X normal, -Z length axis and 2.5 m half width.
 * 2. Refuse a zero-width named element, missing name and moving element.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the named element, world frame and missing fixed-face conditions.
 * @evidence contracts/development/testing.md#behavioral-verification The face reader consumes typed element and prop callbacks at the staged start.
 * @evidence contracts/development/testing.md#independent-expectations The given rotation maps both local axes independently, and halving the authored width gives the extent.
 */
export function test_motions_cover_wall_face(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 3, y: 4, z: -2 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const face: IAutoMovieAffordance = {
    id: "front",
    kind: "surface",
    extent: null,
    width: 5,
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  const prop: IAutoMovieMotionHumanPropReader["prop"] = {
    subject: "flat",
    frame,
    points: {},
    affordances: [{ ...face, id: "trim", width: 0 }, face],
  };
  const context: coverWall.IContext = {
    start: 7,
    prop: (subject: string): IAutoMovieMotionHumanPropReader => {
      if (subject !== "flat") throw new Error("Expected the named scenic prop");
      return {
        prop,
        frame: (at: number): IAutoMovieRigidTransform => {
          if (at !== 7)
            throw new Error("Expected the wall at its staged start");
          return frame;
        },
      };
    },
  };
  const plane: coverWall.IFace = coverWall.read(context, "flat", "front");
  TestValidator.predicate(
    "the displayed film frame owns the face",
    vclose(plane.center, { x: 3, y: 0, z: -2 }, ROUNDING) &&
      vclose(plane.normal, { x: 1, y: 0, z: 0 }, ROUNDING) &&
      vclose(plane.axis, { x: 0, y: 0, z: -1 }, ROUNDING) &&
      nclose(plane.half, 2.5, ROUNDING),
  );
  const refuses = (use: coverWall.IContext, id: string): boolean => {
    try {
      coverWall.read(use, "flat", id);
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      return error.axis === "face" && error.value === id;
    }
    return false;
  };
  const moving: coverWall.IContext = {
    ...context,
    prop: (): IAutoMovieMotionHumanPropReader => ({
      frame: (): IAutoMovieRigidTransform => frame,
      prop: { ...prop, motion: (): IAutoMovieRigidTransform => frame },
    }),
  };
  TestValidator.predicate(
    "an empty, missing or moving face is refused",
    refuses(context, "trim") &&
      refuses(context, "missing") &&
      refuses(moving, "front"),
  );
}

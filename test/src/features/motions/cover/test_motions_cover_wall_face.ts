import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanRefusal, coverWall } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Sixty-four binary64 rounding units cover a normalized quarter-turn. */
const ROUNDING: number = 64 * Number.EPSILON;

/**
 * Read a scenic wall's horizontal plane from the displayed prop frame.
 *
 * Scenarios:
 *
 * 1. A translated, quarter-turned wall yields a centre on the floor, world +X
 *    normal, world −Z length axis and half its named width.
 * 2. A named element with an empty width, a missing name or a moving element has
 *    no fixed face.
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
      if (!(error instanceof HumanRefusal)) throw error;
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

import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { operateDrive } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Sixty-four binary64 rounding units cover one quarter-turn at a 7 m scale. */
const ROUNDING: number = 64 * Number.EPSILON * 7;

/**
 * One slider coordinate owns both the visible handle and the published drive.
 *
 * Scenarios:
 *
 * 1. Find the slider through the handle's parent. A 3/4 stroke from 0.25 m adds
 *    0.375 m to that joint alone and the handle's reads use the requesting film
 *    instant even when progress matches an earlier read.
 * 2. The drive publishes the same slider coordinate along the stroke. The same
 *    chain cannot be used to drive another kind of joint.
 */
export function test_motions_affordance_operate_drive(): void {
  const frame: IAutoMovieAffordance["frame"] = {
    translation: { x: 0, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const slider: IAutoMovieAffordance = {
    id: "drawer",
    kind: "slider",
    frame,
    extent: null,
    travel: 1,
  };
  const handle: IAutoMovieAffordance = {
    id: "pull",
    kind: "handle",
    frame,
    extent: null,
    rides: "front",
  };
  const front: IAutoMovieAffordance = {
    ...handle,
    id: "front",
    rides: "drawer",
  };
  const unrelated: IAutoMovieAffordance = { ...slider, id: "other" };
  const frameAt = (seconds: number): IAutoMovieRigidTransform => ({
    position: { x: seconds, y: 2, z: 4 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  });
  const reader: IAutoMovieMotionHumanPropReader = {
    frame: frameAt,
    state: (seconds: number): Readonly<Record<string, number>> => {
      if (seconds !== 4) throw new Error("Expected the prop's opening state");
      return { drawer: 0.25, other: 0.5 };
    },
    prop: {
      subject: "cabinet",
      frame: frameAt(4),
      points: {},
      affordances: [handle, front, unrelated, slider],
      articulate: (
        state: Readonly<Record<string, number>>,
      ): IAutoMovieMotionHumanProp.IPosed => {
        const travel: number | undefined = state.drawer;
        if (travel === undefined || state.other !== 0.5)
          throw new Error(
            "Expected the edited drawer and the original other degree",
          );
        return {
          affordances: [
            {
              ...handle,
              frame: { ...frame, translation: { x: travel, y: 0, z: 1 } },
            },
          ],
        };
      },
    },
  };
  const context: operateDrive.IContext = {
    start: 4,
    prop: (): IAutoMovieMotionHumanPropReader => reader,
  };
  const part: IAutoMovieMotionHumanOperateDrive.IPart | undefined =
    operateDrive.part(
      context,
      { kind: "prop", subject: "cabinet", point: "pull" },
      0.5,
      "slider",
    );
  if (part === undefined) throw new Error("Expected a posed slider contact");
  const late: IAutoMovieMotionHumanOperateDrive.IPlace = part.place(0.75, 6);
  const early: IAutoMovieMotionHumanOperateDrive.IPlace = part.place(0.75, 4);
  TestValidator.predicate(
    "one degree owns the contact on all its requested world frames",
    part.contact === "pull" &&
      part.articulation === "drawer" &&
      nclose(part.base, 0.25, ROUNDING) &&
      vclose(late.point, { x: 7, y: 2, z: 3.375 }, ROUNDING) &&
      vclose(early.point, { x: 5, y: 2, z: 3.375 }, ROUNDING) &&
      vclose(late.normal, { x: 0, y: 1, z: 0 }, ROUNDING),
  );
  const drive: IAutoMovieMotionPropDrive = operateDrive.drive(part, {
    duration: 4,
    at: (name: string): number => (name === "strokeStart" ? 1 : 3),
    progress: (from: string, to: string, sample: number): number => {
      if (from !== "strokeStart" || to !== "strokeEnd" || sample !== 2)
        throw new Error("Expected the authored stroke clock and midpoint");
      return 0.5;
    },
  });
  TestValidator.predicate(
    "publish the same slider's stroke between the declared clock instants",
    drive.prop === "cabinet" &&
      drive.articulation === "drawer" &&
      nclose(drive.from, 0.25, ROUNDING) &&
      nclose(drive.to, 0.75, ROUNDING) &&
      nclose(drive.travel(2), 0.5, ROUNDING) &&
      operateDrive.part(
        context,
        { kind: "prop", subject: "cabinet", point: "pull" },
        0.5,
        "hinge",
      ) === undefined,
  );
}

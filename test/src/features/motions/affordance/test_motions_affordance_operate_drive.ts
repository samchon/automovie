import {
  AutoMovieArchetypeArticulation,
  AutoMovieArchetypeFrame,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  operateDrive
} from "../../../../../packages/motions/src/affordance/internal/operateDrive";
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
 * 3. A grip rides a latch which rides a hinge. Read the hinge at the same second
 *    as the grip, even if the latch has already reached its final travel.
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
  nested();
}

/** Check the composed knob and hinge against an independent quarter-turn. */
function nested(): void {
  const origin: IAutoMovieAffordance["frame"] = AutoMovieArchetypeFrame.upright(
    { x: 0, y: 0, z: 0 },
  );
  const hinge: IAutoMovieAffordance = {
    id: "hinge",
    kind: "hinge",
    frame: origin,
    extent: null,
    travel: 90,
  };
  const latch: IAutoMovieAffordance = {
    id: "latch",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.upright({ x: 1, y: 0, z: 0 }),
    extent: null,
    travel: 90,
    rides: hinge.id,
  };
  const grip: IAutoMovieAffordance = {
    id: "grip",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.upright({ x: 2, y: 0, z: 0 }),
    extent: null,
    rides: latch.id,
  };
  const unrelated: IAutoMovieAffordance = { ...hinge, id: "unrelated" };
  const affordances: IAutoMovieAffordance[] = [hinge, latch, grip, unrelated];
  const project = AutoMovieArchetypeArticulation.prepare("nested", {
    parts: [],
    affordances,
  });
  const articulate = (
    state: Readonly<Record<string, number>>,
  ): IAutoMovieMotionHumanProp.IPosed => {
    const frames = project(new Map(Object.entries(state)));
    return {
      affordances: affordances.map(
        (a: IAutoMovieAffordance): IAutoMovieAffordance => ({
          ...a,
          frame: frames.frame(a.id)!,
        }),
      ),
    };
  };
  const reader: IAutoMovieMotionHumanPropReader = {
    prop: {
      subject: "door",
      frame: { position: origin.translation, rotation: origin.rotation },
      points: {},
      affordances,
      articulate,
    },
    frame: (): IAutoMovieRigidTransform => reader.prop.frame,
    state: (seconds: number): Readonly<Record<string, number>> => ({
      hinge: seconds < 1 ? 0 : 90,
      latch: 0,
      unrelated: seconds < 2 ? 0 : 90,
    }),
  };
  const part: IAutoMovieMotionHumanOperateDrive.IPart | undefined =
    operateDrive.part(
      { start: 0, prop: (): IAutoMovieMotionHumanPropReader => reader },
      { kind: "prop", subject: "door", point: grip.id },
      90,
      "knob",
    );
  if (part === undefined) throw new Error("Expected nested latch");
  for (const [seconds, expected] of [
    [2.5, { x: -1, y: 0, z: -1 }],
    [0.25, { x: 1, y: 0, z: -1 }],
    [1.5, { x: -1, y: 0, z: -1 }],
    [2.5, { x: -1, y: 0, z: -1 }],
  ] as const) {
    const displayed: IAutoMovieAffordance = articulate({
      ...reader.state!(seconds),
      latch: 90,
    }).affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === grip.id,
    )!;
    TestValidator.predicate(
      `the same nested grip follows the displayed hinge at ${seconds} s`,
      vclose(displayed.frame.translation, expected, ROUNDING) &&
        vclose(part.place(1, seconds).point, expected, ROUNDING),
    );
  }
}

import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";
import {
  AutoMovieMotionHumanBase,
  HumanSegmentEntry,
  poseBones,
  resolveHumanPosture,
  seated,
  sit,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";

/** Circular-seat dimensions at the sourced stool and bar-stool limits. */
interface IDisc {
  /** The name of the ordinary or high seating case. */
  name: string;

  /** The seat's top, metres above the floor. */
  top: number;

  /** The seat's diameter, metres. */
  diameter: number;

  /** The high seat's rung drop, when provided, metres. */
  drop?: number;
}

/** Joint geometry cases cover both ends of each stool's sourced dimensions. */
const DISCS: readonly IDisc[] = [
  { name: "lower ordinary stool", top: 0.43, diameter: 0.3 },
  { name: "higher ordinary stool", top: 0.457, diameter: 0.35 },
  {
    name: "lower bar stool",
    top: 1.067 - 12 * 0.0254,
    diameter: 0.3,
    drop: 0.43,
  },
  {
    name: "higher bar stool",
    top: 1.067 - 10 * 0.0254,
    diameter: 0.35,
    drop: 0.457,
  },
];

/** A circular seat's front edge and optional rung points in world metres. */
function seat(disc: IDisc): IAutoMovieMotionHumanSeated.ISeat {
  const radius: number = disc.diameter / 2;
  const at: IAutoMovieVector3 = { x: 0, y: disc.top, z: radius };
  if (disc.drop === undefined) return { at, yaw: 0, depth: disc.diameter };

  // Each high seat has a bar between its two front legs, whose centers are
  // 60 mm inside the disc's bounding square. The feet rest at its quarters.
  const rung: number = radius - 0.06;
  const foot: IAutoMovieVector3 = {
    x: rung / 2,
    y: disc.top - disc.drop,
    z: rung,
  };
  return {
    at,
    yaw: 0,
    depth: disc.diameter,
    footrests: { left: foot, right: { ...foot, x: -foot.x } },
  };
}

/**
 * Sitting reaches the surface on both an ordinary and a high seat.
 *
 * Scenarios:
 * 1. Sit from 0.2 m in front of the narrow/low and wide/high limits of each disc.
 * 2. Bound the displayed seat gap by 10 mm at settling and through the hold.
 * 3. Pass the open seat contact to the base of a subsequent upper-body act.
 * 4. Refuse a far bar stool and a cushion below the popliteal-height limit.
 */
export async function test_motions_everyday_stool_contact(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const region: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.seat;
  const display: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set<AutoMovieHumanoidBone>([region.bone]),
  );
  for (const disc of DISCS) {
    const target: IAutoMovieMotionHumanSeated.ISeat = seat(disc);
    const context: IAutoMovieMotionHumanActionContext<
      IAutoMovieMotionHumanSit.IParams
    > = motionActionContext(
      body,
      { seat: target, hold: 0.5 },
      { at: { x: 0, y: 0, z: target.at.z + 0.2 } },
    );
    const plan: IAutoMovieMotionHumanActionPlan = sit.plan(context);
    const settled: number | undefined = plan.events.find(
      (event): boolean => event.name === "seated",
    )?.share;
    assert.ok(
      settled !== undefined && settled >= 0 && settled <= 1,
      `${disc.name} has a seated event`,
    );
    const local: number = plan.duration * settled;
    const times: readonly number[] = [
      plan.duration,
      local,
      (local + plan.duration) / 2,
      plan.duration,
    ];
    for (const seconds of times) {
      const joints: ReturnType<typeof display> = display(
        resolveHumanPosture(body, plan.posture(seconds)),
      );
      const actual: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        region,
        joints.get(region.bone)!,
      ).point;
      const radial: number = Math.hypot(actual.x, actual.z);
      const gap: number = Math.hypot(
        actual.y - disc.top,
        Math.max(0, radial - disc.diameter / 2),
      );
      TestValidator.predicate(
        `${disc.name} seat gap at ${seconds} s is ${gap} m`,
        gap <= 0.01,
      );
    }

    const held: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(
        {
          entry: {
            ...context.entry,
            posture: plan.posture(plan.duration),
            supports: HumanSegmentEntry.supports(
              { start: context.start, plan },
              context.start + plan.duration,
            ),
          },
        },
        1,
      );
    TestValidator.predicate(
      `${disc.name} keeps its seat contact through the next action`,
      held.contacts.some(
        (window): boolean =>
          window.part === "seat" &&
          window.from <= 1e-9 &&
          window.to >= 1 - 1e-9,
      ),
    );
  }

  const remote: IAutoMovieMotionHumanSeated.ISeat = seat(DISCS[2]!);
  assert.throws(
    (): IAutoMovieMotionHumanActionPlan =>
      sit.plan(
        motionActionContext(
          body,
          { seat: remote, hold: 0.5 },
          { at: { x: 0, y: 0, z: remote.at.z + 1.5 } },
        ),
      ),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.kind === "reach" &&
      error.axis === "seat" &&
      error.fix.length > 0,
  );

  // Popliteal height is the ankle and shank less the thigh's radius. An
  // ordinary cushion admits a seat at 0.8 of that height above the floor.
  const { ankleHeight, shank, thighRadius }: IAutoMovieMotionHumanBody["measure"] =
    body.measure;
  const floor: number = 0.12;
  const minimum: number = floor + 0.8 * (ankleHeight + shank - thighRadius);
  seated.check(body, { at: { x: 0, y: minimum, z: 0 }, yaw: 0 }, floor);
  const below: number = minimum - 0.001;
  assert.throws(
    (): void =>
      seated.check(body, { at: { x: 0, y: below, z: 0 }, yaw: 0 }, floor),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.kind === "reach" &&
      error.axis === "seat" &&
      typeof error.value === "number" &&
      nclose(error.value, below, 1e-9) &&
      error.feasible?.kind === "range" &&
      error.feasible.minimum !== null &&
      nclose(error.feasible.minimum, minimum, 1e-9) &&
      error.feasible.maximum === null &&
      error.feasible.unit === "m" &&
      error.fix.length > 0,
  );
}

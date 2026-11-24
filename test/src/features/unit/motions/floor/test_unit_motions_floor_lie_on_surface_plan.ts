import { createBed } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieOnSurface,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanTurnOver,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanRefusal,
  lieOnSurface,
  rise,
  sit,
  turnOver,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** The bed's lying surface height, metres. */
const HEIGHT: number = 0.46;

/** How far a lying body may sink into the surface, metres. */
const SINK: number = 0.01;

/** The greatest upward component of the chest's forward on the side. */
const SIDEWAYS: number = 0.35;

/** The greatest upward component of the chest's forward face down. */
const FACE_DOWN: number = -0.8;

/** The bones a lying body rests on. */
const BEARING: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "chest",
  "head",
  "leftFoot",
  "rightFoot",
];

/**
 * `lieOnSurface` lies a body seated on a bed's edge down on the mattress and
 * sits it up again, and `turnOver` turns it between lying positions there.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. Seated on the double bed's left edge, the body lies down onto its side and
 *    back: from its `lateral` event on no bearing bone sinks under the surface.
 * 2. It turns onto its left side, face down and back onto its back: the chest
 *    faces sideways after the first turn and down after the second.
 * 3. It sits up onto the edge and rises to standing.
 * 4. A bed too short for the body is refused on its length.
 */
export async function test_unit_motions_floor_lie_on_surface_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plans = (
    bed: ReturnType<typeof createBed>,
  ): IAutoMovieMotionHumanActionPlan[] => {
    const props: IAutoMovieMotionHumanProp[] = [
      HumanObject.prop("bed", bed, { at: { x: 0, y: 0, z: 0 }, yaw: 0, fixed: true }),
    ];
    const half: number = (bed.affordance("surface").width ?? 1.35) / 2;
    const seated: IAutoMovieMotionHumanActionPlan = sit.plan(
      motionActionContext(
        body,
        {
          seat: HumanObject.seat(bed, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }, "leftSide"),
          hold: 0.5,
        },
        { at: { x: half + 0.2, y: 0, z: 0 }, yaw: 90, props },
      ),
    );
    const lie: IAutoMovieMotionHumanLieOnSurface = {
      prop: "bed",
      edge: "leftSide",
      hold: 0.5,
    };
    const out: IAutoMovieMotionHumanActionPlan[] = [
      lieOnSurface.plan(motionActionContext.after(body, seated, lie, { props })),
    ];
    const turns: IAutoMovieMotionHumanTurnOver[] = [
      { to: "lateralLeft", on: { prop: "bed" }, hold: 0.5 },
      { to: "prone", on: { prop: "bed" }, hold: 0.5 },
      { to: "supine", on: { prop: "bed" }, via: "right" },
    ];
    for (const turn of turns)
      out.push(
        turnOver.plan(motionActionContext.after(body, out.at(-1)!, turn, { props })),
      );
    out.push(
      lieOnSurface.plan(
        motionActionContext.after(body, out.at(-1)!, { ...lie, rise: true }, { props }),
      ),
    );
    out.push(rise.plan(motionActionContext.after(body, out.at(-1)!, {}, { props })));
    return out;
  };
  const chest = (
    plan: IAutoMovieMotionHumanActionPlan,
    t: number,
  ): number =>
    Quaternion.rotateVector(R.bones(body, plan, t).get("chest")!.worldRotation, {
      x: 0,
      y: 0,
      z: 1,
    }).y;

  const [lying, side, down, , , risen] = plans(
    createBed({ kind: "double", height: HEIGHT }),
  ) as [
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanActionPlan,
  ];

  // 1. On the mattress.
  const from: number = R.event(lying, "lateral")!;
  let worst: number = Infinity;
  for (let k: number = 0; k <= 12; k++) {
    const bones: ReturnType<typeof R.bones> = R.bones(body, lying, from + ((lying.duration - from) * k) / 12);
    for (const bone of BEARING)
      worst = Math.min(worst, bones.get(bone)!.worldPosition.y - HEIGHT);
  }
  TestValidator.predicate(
    `no bearing bone sinks in the mattress (${worst} m)`,
    worst >= -SINK,
  );

  // 2. The turns.
  TestValidator.predicate(
    "sideways, then face down",
    Math.abs(chest(side, side.duration)) < SIDEWAYS &&
      chest(down, down.duration) < FACE_DOWN,
  );

  // 3. Up and standing.
  TestValidator.predicate(
    "stands at the end",
    R.bones(body, risen, risen.duration).get("hips")!.worldPosition.y >
      0.7 * body.rest.get("hips")!.y,
  );

  // 4. A short bed.
  let refused: unknown;
  try {
    plans(createBed({ kind: "single", length: 1.3, height: HEIGHT }));
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "a short bed is refused on its length",
    refused instanceof HumanRefusal && refused.axis === "length",
  );
}

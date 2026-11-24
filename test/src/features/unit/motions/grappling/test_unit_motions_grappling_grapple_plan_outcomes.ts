import { resolveAutoMovieHumanoidSurfaces, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  grapple,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** How far a gripping palm may lie from the partner's region, metres. */
const CONTACT: number = 0.01;

/** The scene's two marks: the initiator's and the receiver's. */
interface IMarks {
  /** The initiator's floor point and heading. */
  initiator: { at: IAutoMovieVector3; yaw: number };

  /** The receiver's floor point and heading. */
  receiver: { at: IAutoMovieVector3; yaw: number };
}

/**
 * `grapple.plan` stages a scene's chosen outcome for both roles: a completed
 * shoulder throw grips collar and sleeve through the paired turn and rolls the
 * receiver from seat to back onto the mat; a denied single leg grips one thigh
 * and the receiver interrupts it and recovers standing.
 *
 * Two average men stand on the scene's staggered marks.
 *
 * Scenarios:
 *
 * 1. The completed seoi-nage grips the receiver's left collar and right elbow
 *    from before the paired turn's `entry` to after it, each grip released
 *    before the end; at its start, middle and release each palm lies within
 *    `CONTACT` of its region on the receiver's own plan.
 * 2. Its receiver bears on the seat, takes the back before leaving the seat,
 *    keeps the back to the end, and ends lying.
 * 3. The denied single leg grips one thigh, the left front; its receiver is
 *    interrupted, recovers, never bears seat or back and ends standing.
 */
export async function test_unit_motions_grappling_grapple_plan_outcomes(): Promise<void> {
  // Whole body: the floor solver moves each actor over the full rig, and the
  // initiator's hands are coursed on the receiver's displayed regions.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const stage = (
    scene: IAutoMovieMotionHumanGrapple.IScene,
    marks: IMarks,
  ): [IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanActionPlan] => {
    const idle: IAutoMovieMotionHumanActionPlan = stand.plan(
      motionActionContext(body, { hold: 10 }, marks.initiator),
    );
    const receiver: IAutoMovieMotionHumanActionPlan = grapple.plan(
      motionActionContext(
        body,
        { ...scene, role: "receiver", partner: "a" },
        {
          ...marks.receiver,
          subject: "b",
          partners: [{ subject: "a", body, plan: idle }],
        },
      ),
    );
    const initiator: IAutoMovieMotionHumanActionPlan = grapple.plan(
      motionActionContext(
        body,
        { ...scene, role: "initiator", partner: "b" },
        {
          ...marks.initiator,
          partners: [{ subject: "b", body, plan: receiver }],
        },
      ),
    );
    return [initiator, receiver];
  };
  const grips = (
    p: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanContactWindow[] =>
    p.contacts.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean => w.kind === "grip",
    );
  const event = (p: IAutoMovieMotionHumanActionPlan, name: string): number =>
    p.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const part = (
    p: IAutoMovieMotionHumanActionPlan,
    name: string,
  ): IAutoMovieMotionHumanContactWindow | undefined =>
    p.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part === name && w.support.kind === "ground",
    );
  const point = (
    p: IAutoMovieMotionHumanActionPlan,
    region: AutoMovieHumanoidRegion,
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.point(
      frame,
      poseBones(body, resolveHumanPosture(body, p.posture(seconds))).get(
        frame.bone,
      )!,
    );
  };

  // 1. and 2. The completed shoulder throw.
  const [thrower, thrown] = stage(
    { kind: "seoiNage", outcome: "complete" },
    {
      initiator: { at: { x: 0, y: 0, z: -0.27 }, yaw: 8 },
      receiver: { at: { x: 0.09, y: 0, z: 0.27 }, yaw: 188 },
    },
  );
  const entry: number = event(thrower, "entry");
  const held: IAutoMovieMotionHumanContactWindow[] = grips(thrower);
  const on = (
    grip: IAutoMovieMotionHumanContactWindow,
    region: AutoMovieHumanoidRegion,
  ): boolean =>
    [grip.from, (grip.from + grip.to) / 2, grip.to].every(
      (share: number): boolean =>
        Vector3.distance(
          point(
            thrower,
            grip.part === "leftHand" ? "palmLeft" : "palmRight",
            share * thrower.duration,
          ),
          point(thrown, region, share * thrower.duration),
        ) <= CONTACT,
    );
  TestValidator.predicate(
    "collar and sleeve held through the turn",
    held.length === 2 &&
      held.every(
        (g: IAutoMovieMotionHumanContactWindow): boolean =>
          g.from < entry && g.to + 1e-9 >= entry && g.to < 1,
      ) &&
      on(
        held.find((g) => g.part === "rightHand")!,
        "neckLeft",
      ) &&
      on(
        held.find((g) => g.part === "leftHand")!,
        "elbowRight",
      ),
  );
  const seat: IAutoMovieMotionHumanContactWindow | undefined = part(
    thrown,
    "seat",
  );
  const back: IAutoMovieMotionHumanContactWindow | undefined = part(
    thrown,
    "back",
  );
  TestValidator.predicate(
    "from seat to back on the mat",
    seat !== undefined &&
      back !== undefined &&
      seat.from < back.from &&
      back.from <= seat.to + 1e-9 &&
      Math.abs(back.to - 1) < 1e-9 &&
      thrown.base?.kind === "lying",
  );

  // 3. The denied single leg.
  const [shooter, defender] = stage(
    { kind: "singleLeg", outcome: "denied" },
    {
      initiator: { at: { x: 0, y: 0, z: -0.21 }, yaw: 0 },
      receiver: { at: { x: -0.36, y: 0, z: 0.66 }, yaw: 165 },
    },
  );
  TestValidator.equals(
    "one thigh gripped",
    grips(shooter).map(
      (g: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow["support"] =>
        g.support,
    ),
    [{ kind: "person", subject: "b", region: "thighFrontLeft" }],
  );
  TestValidator.predicate(
    "interrupted, recovered, standing",
    defender.events.some((e: IAutoMovieMotionEvent): boolean => e.name === "interrupted") &&
      defender.events.some((e: IAutoMovieMotionEvent): boolean => e.name === "recovered") &&
      part(defender, "seat") === undefined &&
      part(defender, "back") === undefined &&
      defender.base?.kind === "standing",
  );
}

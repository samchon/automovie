import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieVector3,
} from "@automovie/interface";
import { grapple, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

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
 * 1. The completed seoi-nage's receiver bears on the seat, takes the back before
 *    leaving the seat, keeps the back to the end, and ends lying.
 * 2. The denied single leg grips one thigh, the left front, and releases it before
 *    the end; its receiver is interrupted, recovers, never bears seat or back
 *    and ends standing.
 *
 * The completed throw's initiator is not planned here: its collar-and-sleeve
 * course is refused by the arm planner on this entry, the planner's open
 * defect.
 */
export async function test_unit_motions_grappling_grapple_plan_outcomes(): Promise<void> {
  // Whole body: the floor solver moves each actor over the full rig, and the
  // initiator's hands are coursed on the receiver's displayed regions.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const receive = (
    scene: IAutoMovieMotionHumanGrapple.IScene,
    mark: IMarks["receiver"],
    other: IMarks["initiator"],
  ): IAutoMovieMotionHumanActionPlan =>
    grapple.plan(
      motionActionContext(
        body,
        { ...scene, role: "receiver", partner: "a" },
        {
          ...mark,
          subject: "b",
          partners: [
            {
              subject: "a",
              body,
              plan: stand.plan(motionActionContext(body, { hold: 10 }, other)),
            },
          ],
        },
      ),
    );
  const stage = (
    scene: IAutoMovieMotionHumanGrapple.IScene,
    marks: IMarks,
  ): [IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanActionPlan] => {
    const receiver: IAutoMovieMotionHumanActionPlan = receive(
      scene,
      marks.receiver,
      marks.initiator,
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
  const part = (
    p: IAutoMovieMotionHumanActionPlan,
    name: string,
  ): IAutoMovieMotionHumanContactWindow | undefined =>
    p.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part === name && w.support.kind === "ground",
    );
  // 1. The completed shoulder throw's receiver.
  const thrown: IAutoMovieMotionHumanActionPlan = receive(
    { kind: "seoiNage", outcome: "complete" },
    { at: { x: 0.09, y: 0, z: 0.27 }, yaw: 188 },
    { at: { x: 0, y: 0, z: -0.27 }, yaw: 8 },
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

  // 2. The denied single leg.
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
      (
        g: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow["support"] => g.support,
    ),
    [{ kind: "person", subject: "b", region: "thighFrontLeft" }],
  );
  TestValidator.predicate(
    "the thigh released before the end",
    grips(shooter).every(
      (g: IAutoMovieMotionHumanContactWindow): boolean =>
        g.from < g.to && g.to < 1,
    ),
  );
  TestValidator.predicate(
    "interrupted, recovered, standing",
    defender.events.some(
      (e: IAutoMovieMotionEvent): boolean => e.name === "interrupted",
    ) &&
      defender.events.some(
        (e: IAutoMovieMotionEvent): boolean => e.name === "recovered",
      ) &&
      part(defender, "seat") === undefined &&
      part(defender, "back") === undefined &&
      defender.base?.kind === "standing",
  );
}

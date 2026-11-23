import {
  Vector3,
  bracketedBisection,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanReach } from "../compose/AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { touchPrimitive } from "../compose/touchPrimitive";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { kissBody } from "./kissBody";
import { kissPitch } from "./kissPitch";
import { touchReach } from "./touchReach";

/**
 * One meeting for the two roles of a hand kiss. At the required hand attitude
 * the presenting wrist is a fixed offset from its back of hand, so the lips
 * must meet a point in that translated reach sphere. The kisser's forward bow
 * traces an arc about the hips. The nearest point on the arc brackets the first
 * shared point the arm can reach.
 */
export namespace kissHandMeeting {
  /**
   * The back of the hand faces the kisser, with fingers across the mouth's
   * approach.
   */
  const hand: IAutoMovieMotionHumanTouchEffector.IEffector = {
    surface: "handBack",
    shape: "flat",
  };

  /**
   * Build the hand kiss's meeting for one hand and hold.
   *
   * @param side Which of the presenter's hands is kissed.
   * @param hold Seconds of lip contact.
   * @returns The meeting kind whose roles are the kisser and presenter.
   */
  export function kind(
    side: AutoMovieHumanSide,
    hold: number,
  ): IAutoMovieMotionMeetingKind {
    return {
      name: `kissHand-${side}`,
      roles: ["kisser", "presenter"],
      contacts: { contact: { height: 1, range: 0, facing: "performer" } },
      surfaces: (
        roles: readonly IAutoMovieMotionMeetingRole[],
      ): Record<string, IAutoMovieMotionMeetingKind.ISurface> => ({
        contact: meetingPoint(roles[0]!, roles[1]!, side),
      }),
      timing: (role, contacts): IAutoMovieMotionMeetingTiming => {
        const point: IAutoMovieVector3 = contacts.contact!;
        const ready: number =
          role.name === "presenter"
            ? Math.max(
                AutoMovieMotionHumanTiming.transport(
                  Vector3.distance(
                    point,
                    AutoMovieMotionHumanTouchEffector.point(
                      role.body,
                      role.bones,
                      side,
                      hand,
                    ),
                  ),
                ),
                role.entry === undefined
                  ? 0
                  : touchReach.place(
                      role.body,
                      role.entry,
                      side,
                      hand,
                      point,
                      "across",
                      across(point, role.posture.root),
                    ),
              )
            : AutoMovieMotionHumanTiming.transport(
                Vector3.distance(point, neutralMouth(role)),
              );
        return { ready, stroke: ready, relax: ready + hold };
      },
    };
  }

  /**
   * Write the presenting hand's transport and hold on the shared clock.
   *
   * @param context The presenter's action context.
   * @param side The hand being presented.
   * @param meeting The shared kiss's place and film instants.
   * @param clock The meeting's local phrase clock.
   * @returns The plan whose wrist lays the back of the hand on the meeting.
   */
  export function present(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKiss.IParams>,
    side: AutoMovieHumanSide,
    meeting: IAutoMovieMotionMeeting,
    clock: IAutoMovieMotionClock,
  ): IAutoMovieMotionHumanActionPlan {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const placed: IAutoMovieMotionHumanTarget.IPlace =
      AutoMovieMotionMeeting.place(meeting, "contact", entry);
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanTouchLaid.bend(
      body,
      entry,
      side,
      hand,
      placed,
      "across",
      "tangent",
    );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: touchPrimitive({
        body,
        clock,
        side,
        entry,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        effector: hand,
        region: (): IAutoMovieMotionHumanTarget.IPlace => placed,
        kind: "press",
        count: 1,
        tangent: "across",
        lay: "tangent",
        bend,
        reference: AutoMovieMotionHumanTouchLaid.laid(
          body,
          entry,
          side,
          hand,
          placed,
          "across",
          bend,
          "tangent",
        ),
      }),
      contact: "contact",
    });
  }

  /** The displayed mouth on the role's unbowed entry. */
  function neutralMouth(role: IAutoMovieMotionMeetingRole): IAutoMovieVector3 {
    const region: IAutoMovieMotionMeetingRole["body"]["surfaces"]["regions"]["mouth"] =
      role.body.surfaces.regions.mouth;
    return resolveAutoMovieHumanoidSurfaces.point(
      region,
      role.bones.get(region.bone)!,
    );
  }

  /** The smallest forward bow on the shared arm reach, in world metres. */
  function meetingPoint(
    kisser: IAutoMovieMotionMeetingRole,
    presenter: IAutoMovieMotionMeetingRole,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionMeetingKind.ISurface {
    const start: IAutoMovieVector3 = neutralMouth(kisser);
    const shoulder: IAutoMovieVector3 = presenter.bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const wrist = (
      surface: IAutoMovieMotionMeetingKind.ISurface,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchLaid.rest(
        presenter.body,
        presenter.posture,
        side,
        hand,
        surface,
        "across",
        shoulder,
      ).point;
    const arm: number =
      presenter.body.measure.upperArm + presenter.body.measure.forearm;
    const region: IAutoMovieMotionMeetingRole["body"]["surfaces"]["regions"]["mouth"] =
      kisser.body.surfaces.regions.mouth;
    const initial: IAutoMovieMotionMeetingKind.ISurface =
      resolveAutoMovieHumanoidSurfaces.place(
        region,
        kisser.bones.get(region.bone)!,
      );
    const first: IAutoMovieVector3 = wrist(initial);
    if (Vector3.distance(shoulder, first) <= arm) return initial;
    const center: IAutoMovieVector3 = Vector3.add(
      shoulder,
      Vector3.subtract(start, first),
    );
    const entry: IAutoMovieMotionHumanPosture | undefined =
      kisser.entry?.posture;
    if (entry === undefined)
      throw new Error("A paired hand kiss needs the kisser's entry posture");
    const hip: IAutoMovieVector3 = kisser.bones.get("hips")!.worldPosition;
    const limit: number = AutoMovieMotionHumanReach.LEAN_LIMIT;
    const closest: number = Math.min(
      limit,
      Math.max(0, kissPitch(hip, entry.yaw, start, center)),
    );
    const feet: IAutoMovieMotionHumanRise.Stance = {
      left: {
        ankle: kisser.bones.get("leftFoot")!.worldPosition,
        rotation: kisser.bones.get("leftFoot")!.worldRotation,
      },
      right: {
        ankle: kisser.bones.get("rightFoot")!.worldPosition,
        rotation: kisser.bones.get("rightFoot")!.worldRotation,
      },
    };
    const mouth: ReturnType<typeof HumanTrunk.prepareRegion> =
      HumanTrunk.prepareRegion(kisser.body, "mouth");
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const placed = (pitch: number): HumanTrunk.ISurface =>
      mouth(
        kissBody(
          kisser.body,
          entry,
          feet,
          { pitch, roll: 0, raise: 0 },
          1,
          kisser.seated === true,
        ),
        read,
      );
    const near: IAutoMovieVector3 = wrist(placed(closest));
    if (Vector3.distance(shoulder, near) > arm)
      throw new HumanRefusal({
        kind: "reach",
        axis: "region",
        value: `handBack${side === "left" ? "Left" : "Right"}`,
        feasible: null,
        reason: "the presented hand cannot reach the kisser's bowed mouth",
        fix: "place the participants within one another's reach",
      });
    const precision: number = (Math.sqrt(Number.EPSILON) * 180) / Math.PI;
    const pitch: number = bracketedBisection(
      (angle: number): boolean =>
        Vector3.distance(shoulder, wrist(placed(angle))) > arm,
      0,
      closest,
      precision,
    );
    return placed(pitch);
  }

  /**
   * Horizontal direction between the presentation and the presenter's stance
   * for its transport clock.
   */
  function across(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.normalize({ x: to.x - from.x, y: 0, z: to.z - from.z });
  }
}

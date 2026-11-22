import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPlaceOverHead,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { HumanWornItem } from "./HumanWornItem";
import { placeOverHeadPath } from "./placeOverHeadPath";

/** The handle names a neck loop declares. */
type Handle = "holdLeft" | "holdRight";

/**
 * Set a neck loop over a partner's head (#4015). The loop's path is
 * `placeOverHeadPath`'s, read on the partner's displayed body at the
 * action's start, so a partner who bows, kneels or sits first is met where
 * they are. The hand that holds the loop at entry keeps it on the path; the
 * other hand closes on the loop's other handle by `ready`, without carrying
 * it, and both hands carry it over the stroke; at `strokeEnd` it is worn on
 * the partner's upper chest (the sternum region's bone) and both grips end,
 * and the hands return. Both arms are laid in one course (`courseArmGoal`
 * with `with`). Before any of it, the loop's inner half-breadth is checked
 * against the partner's head radius, and the hands' highest places, above
 * the crown, against the arm's reach from each shoulder: a loop too narrow
 * for the head, or a crown the arms cannot clear (a standing tall partner),
 * is refused with the measure, so the partner bows or kneels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path's owner, who carries the loop, the custody change, the course and both refusals.
 * @evidence contracts/development/design.md#principled-representation The loop's rigid frame along its path is the plan; both hands follow from it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Adds the two-handed carry, the custody change and the refusals; the path, transport, phrase and course are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The loop is never posed here; the performance carries it in the hand and then on the partner's bone.
 */
export const placeOverHead: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPlaceOverHead> =
  {
    name: "placeOverHead",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlaceOverHead>,
    ): IAutoMovieMotionHumanActionPlan => {
      const p: IAutoMovieMotionHumanPlaceOverHead = context.params;
      const body: IAutoMovieMotionHumanBody = context.body;
      const side: AutoMovieHumanSide = p.side ?? "right";
      const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
      if (p.partner === context.subject)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "partner",
          value: p.partner,
          reason: "a loop is set over another performer's head",
          fix: "name another performer as the partner",
        });
      const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
        context,
        side,
        p.prop,
      );
      const site = (id: string): IAutoMovieAffordance => {
        const found: IAutoMovieAffordance | undefined = held.affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === id,
        );
        if (found === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "prop",
            value: p.prop,
            reason: `${p.prop} declares no ${id} contact for a neck loop`,
            fix: "give the loop wear, front, opening, holdLeft and holdRight contacts",
          });
        return found;
      };

      // The handle the holding hand has: the one nearest its grip socket.
      const socket: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(held.frame.rotation),
        Vector3.scale(held.frame.position, -1),
      );
      const handles: readonly Handle[] = ["holdLeft", "holdRight"];
      const kept: Handle = handles.reduce(
        (a: Handle, b: Handle): Handle =>
          Vector3.distance(site(b).frame.translation, socket) <
          Vector3.distance(site(a).frame.translation, socket)
            ? b
            : a,
      );
      const taken: IAutoMovieAffordance = site(
        kept === "holdLeft" ? "holdRight" : "holdLeft",
      );

      // The partner where they are at the start, and the loop's path.
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        p.partner,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        partner.bones(context.start);
      const start: IAutoMovieRigidTransform = context
        .prop(p.prop)
        .frame(context.start);
      // The loop's inside: its centre half the opening's length in from its
      // back edge, and its half-breadth.
      const opening: IAutoMovieAffordance = site("opening");
      const path: placeOverHeadPath.IPath = placeOverHeadPath.prepare({
        start,
        wear: site("wear").frame.translation,
        front: site("front").frame.translation,
        centre: Vector3.add(
          opening.frame.translation,
          Quaternion.rotateVector(opening.frame.rotation, {
            x: 0,
            y: (opening.height ?? 0) / 2,
            z: 0,
          }),
        ),
        body: partner.body,
        bones,
      });
      const inner: number = (opening.width ?? 0) / 2;
      if (inner <= partner.body.measure.headRadius)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "prop",
          value: p.prop,
          feasible: {
            kind: "range",
            minimum: partner.body.measure.headRadius,
            maximum: null,
            unit: "m",
          },
          reason: `the loop's inner half-breadth ${(inner * 1000).toFixed(0)} mm does not clear the partner's head radius ${(partner.body.measure.headRadius * 1000).toFixed(0)} mm`,
          fix: "use a longer or wider loop",
        });

      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const bend = (arm: AutoMovieHumanSide): IAutoMovieVector3 =>
        AutoMovieMotionHumanBend.hang(body, entry, arm);
      const holding = (
        frame: IAutoMovieRigidTransform,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        HumanWornItem.holding(body, side, held, frame, bend(side));
      const grasping = (
        frame: IAutoMovieRigidTransform,
      ): IAutoMovieMotionHumanArmTarget.ITarget =>
        HumanWornItem.grasping(body, other, frame, taken, bend(other));

      // The hands' highest places, above the crown, within each arm's reach.
      const pose: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
      );
      const reach: number = body.measure.upperArm + body.measure.forearm;
      for (const [arm, target] of [
        [side, holding(path.apex)],
        [other, grasping(path.apex)],
      ] as const) {
        const shoulder: IAutoMovieVector3 = pose.get(
          `${arm}UpperArm`,
        )!.worldPosition;
        const miss: number = Vector3.distance(shoulder, target.point) - reach;
        if (miss > 0)
          throw new HumanRefusal({
            kind: "reach",
            axis: "partner",
            value: p.partner,
            feasible: {
              kind: "range",
              minimum: null,
              maximum: reach,
              unit: "m",
            },
            reason: `the ${arm} hand would pass ${(miss * 1000).toFixed(0)} mm beyond the arm's reach to clear the partner's crown`,
            fix: "have the partner bow, kneel or sit first, or stand nearer",
          });
      }

      // Each hand's place before and after, and one clock.
      const frame: IAutoMovieMotionHumanFrame = {
        origin: entry.root,
        yaw: entry.yaw,
      };
      const origins: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanArmTarget.IOrigin
      > = {
        left: AutoMovieMotionHumanArmTarget.origin(
          body,
          pose,
          frame,
          "left",
          "grip",
        ),
        right: AutoMovieMotionHumanArmTarget.origin(
          body,
          pose,
          frame,
          "right",
          "grip",
        ),
      };
      const prepare: number = AutoMovieMotionHumanTiming.transport(
        Vector3.distance(
          AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
          grasping(start).point,
        ),
      );
      const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
        prepare,
        attack: AutoMovieMotionHumanTiming.transport(path.length),
        hold: AutoMovieMotionHumanTiming.seconds("beat"),
        retract: AutoMovieMotionHumanTiming.transport(
          Math.max(
            Vector3.distance(
              holding(path.worn).point,
              AutoMovieMotionHumanArmTarget.point(entry, origins[side]),
            ),
            Vector3.distance(
              grasping(path.worn).point,
              AutoMovieMotionHumanArmTarget.point(entry, origins[other]),
            ),
          ),
        ),
      });
      const plan: IAutoMovieMotionHumanActionPlan =
        composeAutoMovieMotionHumanAction({
          base: AutoMovieMotionHumanBase.under(context, clock.duration),
          clock,
          primitives: [side, other].map(
            (arm: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => ({
              ...AutoMovieMotionHumanArmPhrase.stroke({
                body,
                clock,
                side: arm,
                origin: origins[arm],
                path: (
                  _posture: IAutoMovieMotionHumanPosture,
                  _seconds: number,
                  progress: number,
                ): IAutoMovieMotionHumanArmTarget.ITarget =>
                  arm === side
                    ? holding(path.at(progress))
                    : grasping(path.at(progress)),
              }),
              reads: ["root", `${arm}Arm`, `${arm}Hand`],
            }),
          ),
          contact: "strokeEnd",
        });
      const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
        start: 0,
        ready: clock.at("ready"),
        relax: clock.at("relax"),
        end: clock.duration,
      };
      const coursed: IAutoMovieMotionHumanActionPlan = courseArmGoal({
        body,
        plan,
        side,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        span,
        grasp: ["hand"],
        with: [
          {
            side: other,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
            grasp: ["hand"],
          },
        ],
      });
      const worn: number = clock.at("strokeEnd") / clock.duration;
      return {
        ...coursed,
        contacts: [
          ...coursed.contacts,
          {
            part: side === "left" ? "leftHand" : "rightHand",
            kind: "grip",
            from: 0,
            to: worn,
            support: { kind: "prop", subject: p.prop },
          },
          {
            part: other === "left" ? "leftHand" : "rightHand",
            kind: "grip",
            from: clock.at("ready") / clock.duration,
            to: worn,
            support: { kind: "prop", subject: p.prop, carries: false },
          },
        ],
        wears: [
          ...(coursed.wears ?? []),
          {
            prop: p.prop,
            bone: partner.body.surfaces.regions.sternum.bone,
            from: worn,
            wearer: p.partner,
          },
        ],
      };
    },
  };

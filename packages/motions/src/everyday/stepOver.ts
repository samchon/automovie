import { Vector3, minimumJerk, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStepOver,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { walk } from "../actions/walk";
import { walkFoot } from "../actions/walkFoot";
import { walkLeg } from "../actions/walkLeg";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { stepOverPath } from "./stepOverPath";

/**
 * Stepping over a low obstacle placed in the scene, a kerb or a hurdle
 * (`HumanObstacle`), from standing in front of it: the lead foot lifts over it
 * and lands beyond, then the trail foot follows and lands beside it, both feet
 * clearing the obstacle's top.
 *
 * The goals are footprints and clearance: each swinging foot takes the shortest
 * path from its footprint to its landing that keeps every sole point over the
 * obstacle at least `MARGIN` above its top and every other one on or above the
 * floor, the taut string over the obstacle (`AutoMovieMotionHumanClearance`),
 * travelled on minimum-jerk progress. Patla and Rietdyk (1993, Gait Posture
 * 1:45) found that the lead toe clears an obstacle by a roughly constant margin
 * whatever its height, so the lift grows with the obstacle and the margin does
 * not; 0.1 m is the margin used for the lead foot (provisional, of the order
 * they report); the trail foot clears it by 146 mm, the trailing toe's mean
 * clearance whatever the obstacle's height (Chou and Draganich 1997, J Biomech
 * 30:331). The lead foot lifts its toes by up to `TOE_UP` as they pass over the
 * near side and is level again once its heel does, so the toe clears the edge
 * with the ankle and the knee lower than a level foot would need; where the
 * ankle cannot take the planned pitch and the toes droop, the ankle is raised
 * until every sole point clears. The lead toes extend through the pitch the
 * unloaded ankle cannot supply. The trailing ankle clears the measured sole
 * radius and its foot turns forward in mid-swing. The lead foot lands so the
 * obstacle's middle falls at mid-swing, at least one tenth of a foot length
 * beyond the far side and no farther than the legs' stride allows; the trail
 * foot lands beside it at the body's rest separation, stepping down onto its
 * ball where its unloaded ankle cannot hold it level under the shank, and its
 * plant sets the heel down about that ball over a walk's settle
 * (`walkFoot.RISE`).
 *
 * While the lead foot swings, the trail foot rises on its ball by `PUSH`, the
 * forefoot rocker of a stance foot the body passes over (Perry and Burnfield),
 * and the pelvis rises with it as far as it lifts that ankle, so the lead hip
 * stands higher over the obstacle; the trail foot later leaves from that pitch
 * and levels by the time its toe reaches the near side. The pelvis stays back
 * over the trail foot until the lead foot is crossing, moves halfway between
 * the feet by the double support and over the landed feet while the trail foot
 * swings, each leg on a minimum-jerk path. The supporting lead heel rises with
 * the trailing ankle's clearance so the folded trailing knee keeps its range.
 * The pelvis is lowered wherever a planted leg could not reach its foot, and
 * over the second half of each swing toward where the swinging leg will reach
 * its landing, so it has come down when the foot lands instead of dropping at
 * the contact; over the first half the swinging leg lets go of the lowering it
 * asked where it left, so the pelvis does not rise at the toe-off.
 *
 * Time scales with leg length by dynamic similarity (Alexander 1984): the whole
 * action takes `2.4 sqrt(l / walkRoot.REFERENCE_HIP)` seconds for a hip height
 * `l` (provisional: a deliberate two-step crossing near 1 s a step for an
 * adult) times the manner's tempo, the lead swinging over 8 to 42 % and the
 * trail over 50 to 82 %, the pelvis transferring over the supporting lead leg
 * by trail mid-swing so the trailing hip and knee can flex through clearance
 * (Chou and Draganich 1997, J Biomech 30:331).
 *
 * The obstacle lies ahead along the performer's heading; its near side must lie
 * past both toes as entered and within one leg length of the feet, and its
 * height at most 0.55 of the hip height (provisional, near the hip flexion a
 * standing step can use), otherwise the step is refused with the limits.
 * Events: `leadToeOff`, `leadContact`, `trailToeOff`, `trailContact`.
 */
export namespace stepOver {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "stepOver";

  /** Cancel table: a crossing completes before anything else. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: ["trailContact", 1], kind: "inertialize", entry: 0 }],
    walk: [
      {
        window: ["trailContact", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * How far the lead foot lifts its toes as they pass over the obstacle's near
   * side, degrees toes-up (provisional): the toe clears the edge with the ankle
   * lower than a level foot's would be.
   */
  export const TOE_UP: number = 35;

  /**
   * How far the trail foot rises on its ball while the pelvis leaves it during
   * the lead swing, degrees toes-down (provisional, the forefoot rocker of a
   * stance foot the body passes over, Perry and Burnfield).
   */
  export const PUSH: number = 30;

  /**
   * Sole clearance over the obstacle's top, metres (provisional; Patla and
   * Rietdyk 1993).
   */
  export const MARGIN: number = 0.1;

  /**
   * Sole clearance of the trail foot over the obstacle's top, metres: the
   * trailing toe clears obstacles by 146 mm on average whatever their height
   * (Chou and Draganich 1997, J Biomech 30:331).
   */
  export const TRAIL: number = 0.146;

  /**
   * Onset and duration of the first half of forward transfer, shares of the
   * crossing.
   */
  const TRANSFER: readonly [number, number] = [0.12, 0.38];

  /**
   * Seconds before the trail's contact at which its landing pitch is read: a
   * microsecond, inside the swing's last instant.
   */
  const CONTACT: number = 1e-6;

  /**
   * Plan a step over.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop declares no edge or depth, or the
   *   obstacle is too far, behind, too high or too deep to cross in one step.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStepOver.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const {
      body,
      lead,
      trail,
      yaw,
      feet,
      restX,
      end,
      flat,
      duration,
      windows,
      heeled,
      smooth,
      rising,
      rocker,
      footAt,
      needed,
      advance,
    }: stepOverPath.IPlan = stepOverPath(context);
    // The pelvis: from over the start to over the end, lowered where a planted leg needs it.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      {
        x: (restX("left") + restX("right")) / 2,
        y: 0,
        z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2,
      },
    );
    const startRoot: IAutoMovieVector3 = context.entry.posture.root;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const endMid: IAutoMovieVector3 = {
      x: (end.left.x + end.right.x) / 2 - centre.x,
      y: (end.left.y + end.right.y) / 2 - body.measure.ankleHeight - stand.DROP,
      z: (end.left.z + end.right.z) / 2 - centre.z,
    };
    // The trail foot's heel rise lifts the pelvis as far as it lifts that
    // ankle, so the trail leg stands as straight as at the start while the
    // lead foot crosses, and the lift is shed as the trail foot swings.
    const hike: number =
      heeled(trail, feet[trail], -PUSH).ankle.y -
      flat(trail, feet[trail]).ankle.y;
    const trailMiddle: number = (windows[trail][0] + windows[trail][1]) / 2;
    const hiked: (t: number) => number = (t: number): number =>
      rising(t) * (1 - smooth(t, windows[trail][0], trailMiddle));
    // The pelvis goes halfway to the landed feet from TRANSFER[0] over
    // TRANSFER[1] of the action, then over the lead support during the
    // first half of the trail swing.
    const transfers: readonly [number, number, number, number] = [
      TRANSFER[0] * duration,
      TRANSFER[1] * duration,
      windows[trail][0],
      trailMiddle - windows[trail][0],
    ];
    const rootAt: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      const s: number =
        0.5 * minimumJerk.share((t - transfers[0]) / transfers[1]) +
        0.5 * minimumJerk.share((t - transfers[2]) / transfers[3]);
      return {
        x: startRoot.x + (endMid.x - startRoot.x) * s,
        y: startRoot.y + (endMid.y - startRoot.y) * s + hike * hiked(t),
        z: startRoot.z + (endMid.z - startRoot.z) * s,
      };
    };

    const inclined: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      standUpright(body).joints,
      walk.LEAN,
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = stand.relaxed(body);
    // The lowering a swinging leg needs to reach its landing with the knee
    // flexed no less than a planted leg's least flexion.
    const lower: ReturnType<typeof lowerHumanPosture.prepare> =
      lowerHumanPosture.prepare(body);
    const short: ReturnType<typeof lowerHumanPosture.prepareShort> =
      lowerHumanPosture.prepareShort(body, lowerHumanPosture.KNEE);
    const knees: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFrame.preparePoint>
    > = {
      left: HumanFrame.preparePoint(yaw, {
        ...body.rest.get("leftLowerLeg")!,
        z: body.rest.get("leftLowerLeg")!.z + 1,
      }),
      right: HumanFrame.preparePoint(yaw, {
        ...body.rest.get("rightLowerLeg")!,
        z: body.rest.get("rightLowerLeg")!.z + 1,
      }),
    };
    const contacts: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    const sockets: (
      side: AutoMovieHumanSide,
    ) => ReadonlySet<AutoMovieHumanoidBone> = (
      side: AutoMovieHumanSide,
    ): ReadonlySet<AutoMovieHumanoidBone> =>
      new Set(
        HumanFoot.SOCKETS.map(
          (socket): AutoMovieHumanoidBone =>
            body.surfaces.sockets[
              `${socket}${side === "left" ? "Left" : "Right"}`
            ].bone,
        ),
      );
    const requested: Record<
      AutoMovieHumanSide,
      ReadonlySet<AutoMovieHumanoidBone>
    > = {
      left: sockets("left"),
      right: sockets("right"),
    };
    const observe: Record<
      AutoMovieHumanSide,
      ReturnType<typeof poseBones.prepare>
    > = {
      left: poseBones.prepare(body, requested.left),
      right: poseBones.prepare(body, requested.right),
    };
    const share: (t: number) => number = (t: number): number => t / duration;

    // The pitch the trail foot meets the floor with on its ball, read once
    // from the plan's own posture at the trail's contact; its plant then
    // sets the heel down over a walk's settle onto a flat stop
    // (`walkFoot.RISE`), turning about the same ball.
    const trailLimb: AutoMovieHumanLimb =
      trail === "left" ? "leftLeg" : "rightLeg";
    let landed: number | undefined;
    const contactPitch = (): number =>
      (landed ??= Math.min(
        0,
        HumanFoot.pitch(
          result.posture(windows[trail][1] - CONTACT).limbs[trailLimb]!
            .rotation!,
        ),
      ));
    const settle: number = Math.min(
      walkFoot.RISE,
      duration - windows[trail][1],
    );
    const result: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "leadToeOff", share: share(windows[lead][0]) },
        { name: "leadContact", share: share(windows[lead][1]) },
        { name: "trailToeOff", share: share(windows[trail][0]) },
        { name: "trailContact", share: share(windows[trail][1]) },
      ],
      // Each foot plants before its swing on the floor it stands on, and
      // after it on that floor or on the named landing surface's prop.
      contacts: [lead, trail].flatMap(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow[] => [
          {
            part: `${side}Foot`,
            kind: "plant",
            from: 0,
            to: share(windows[side][0]),
            support: HumanSupportFrame.contact(context, `${side}Foot`),
          },
          {
            part: `${side}Foot`,
            kind: "plant",
            from: share(windows[side][1]),
            to: 1,
            support:
              context.params.onto === undefined
                ? HumanSupportFrame.contact(context, `${side}Foot`)
                : { kind: "prop", subject: context.params.onto.prop },
          },
        ],
      ),
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const root: IAutoMovieVector3 = rootAt(t);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
        const toes: Record<AutoMovieHumanSide, number> = { left: 0, right: 0 };
        const footings: Record<
          AutoMovieHumanSide,
          ReturnType<typeof footAt>
        > = {
          left: footAt("left", t),
          right: footAt("right", t),
        };
        if (footings[trail].planted && t >= windows[trail][1] && settle > 0) {
          const pitch: number = contactPitch();
          if (pitch < 0)
            footings[trail].placement = heeled(
              trail,
              end[trail],
              pitch *
                (1 - smooth(t, windows[trail][1], windows[trail][1] + settle)),
            );
        }
        if (!footings[trail].planted) {
          // The lead forefoot carries the pelvis through the trailing knee's
          // deepest fold. The pelvis follows the rocker's ankle translation,
          // preserving the stance leg's reach while the trailing toes clear.
          const rested: IAutoMovieVector3 = footings[lead].placement.ankle;
          const placed: ReturnType<typeof heeled> = heeled(
            lead,
            rested,
            -PUSH * rocker(footings[trail].placement.ankle.y),
          );
          root.x += placed.ankle.x - rested.x;
          root.y += placed.ankle.y - rested.y;
          root.z += placed.ankle.z - rested.z;
          footings[lead].placement = placed;
        }
        for (const side of ["left", "right"] as const) {
          const f: ReturnType<typeof footAt> = footings[side];
          const knee: IAutoMovieVector3 = knees[side](root);
          // A foot on its ball extends its toes so they stay on the floor.
          toes[side] = Math.max(0, -HumanFoot.pitch(f.placement.rotation));
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: f.placement.ankle,
            bend: knee,
            rotation: f.placement.rotation,
            ...(f.planted
              ? { planted: true, contact: { ...contacts[side] } }
              : {}),
          };
        }
        // The trunk carries a walk's forward inclination over the step, the
        // pelvis's share tipping the body about the hips.
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const posture: IAutoMovieMotionHumanPosture = lower(
          AutoMovieMotionHumanLean.pivot(
            body,
            {
              root,
              yaw,
              pitch: 0,
              roll: 0,
              joints: {
                ...relaxed,
                ...structuredClone(inclined.joints),
                leftToes: [toes.left, 0, 0],
                rightToes: [toes.right, 0, 0],
              },
              limbs,
            },
            { pitch: inclined.pitch, roll: 0 },
          ),
          resolution,
        );
        // A swinging foot's leg reaches for its landing over the second half
        // of its swing, so the pelvis has come down to where that leg stands
        // when it lands rather than dropping at the contact; over the first
        // half it lets go of the lowering it asked from where it left, so
        // the pelvis does not rise at the toe-off a planted leg had held down.
        const side: AutoMovieHumanSide | undefined = !footings[lead].planted
          ? lead
          : !footings[trail].planted
            ? trail
            : undefined;
        if (side === undefined) return posture;
        const [from, to]: [number, number] = windows[side];
        const limb: AutoMovieHumanLimb =
          side === "left" ? "leftLeg" : "rightLeg";
        const observed: boolean =
          channels === undefined || channels.includes(limb);
        const middle: number = (from + to) / 2;
        const hip: IAutoMovieVector3 = hipJoints(
          body,
          posture.root,
          humanPostureHeading(posture),
          posture.joints.hips,
          resolution(),
        )[side];
        const landing: number =
          t <= middle
            ? Math.max(
                0,
                (1 - smooth(t, from, middle)) *
                  short(hip, footAt(side, from).placement.ankle),
              )
            : Math.max(0, smooth(t, middle, to) * short(hip, end[side]));
        if (landing > 0) {
          posture.root = { ...posture.root, y: posture.root.y - landing };
          hip.y -= landing;
        }
        if (!observed) return posture;
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[limb]!;
        const own: IAutoMovieQuaternion = footings[side].placement.rotation;
        const direction: ReturnType<typeof HumanFoot.headingPitch> =
          HumanFoot.headingPitch(own);
        let rotation: IAutoMovieQuaternion = own;
        if (side === trail) {
          // The folded trailing knee travels in the sagittal plane. Restore
          // the planted foot's toe-out with zero angular rate at each contact.
          const turn: number =
            Math.sin((Math.PI * (t - from)) / (to - from)) ** 2;
          rotation = HumanFoot.rotation(
            direction.heading + wrapDegrees(yaw - direction.heading) * turn,
            direction.pitch,
          );
        }
        const range: ReturnType<typeof walkLeg.prepareAnkleRange> =
          walkLeg.prepareAnkleRange(body, HumanFoot.heading(rotation));
        const ranged: IAutoMovieQuaternion = range(hip, goal.point, rotation);
        // The trail foot steps down onto its ball, as one steps down into a
        // tub: where its unloaded ankle cannot hold the foot level under the
        // shank, the foot turns toes-down about the ball of its level
        // placement over the landing half, its toes extended to lie on the
        // floor, so the ball and not the ankle meets the landing.
        let start: IAutoMovieVector3 = goal.point;
        if (side === trail && t > middle && HumanFoot.pitch(ranged) < 0) {
          const pitch: number = HumanFoot.pitch(ranged);
          const onto: number = smooth(t, middle, to);
          start = Vector3.lerp(
            goal.point,
            heeled(trail, goal.point, pitch).ankle,
            onto,
          );
          posture.joints[`${trail}Toes`] = [
            toes[trail] + (Math.max(toes[trail], -pitch) - toes[trail]) * onto,
            0,
            0,
          ];
        }
        posture.limbs[limb] = { ...goal, point: start, rotation: ranged };
        // Extend the toes by the pitch the unloaded ankle cannot supply.
        // The lead heel, ball and toe then follow their own approach and
        // landing ramps. All three retain the full margin above the obstacle.
        if (side === lead)
          posture.joints[`${lead}Toes`] = [
            Math.max(0, direction.pitch - HumanFoot.pitch(ranged)),
            0,
            0,
          ];
        let previousHeight: number = start.y;
        let previousDeficit: number = -Infinity;
        let point: IAutoMovieVector3 = start;
        for (let round: number = 0; round < 6; round++) {
          const posed: ReturnType<typeof resolveHumanPosture.seeded>["pose"] =
            resolveHumanPosture.seeded(
              body,
              posture,
              undefined,
              {},
              resolution,
              requested[side],
              projection,
            ).pose;
          const bones: ReturnType<typeof poseBones> = observe[side](
            posed,
            resolution(),
          );
          let deficit: number = -Infinity;
          let ahead: number = side === trail ? 0 : Infinity;
          for (const socket of HumanFoot.sockets(body, bones, side)) {
            const under: number =
              needed(side, socket.socket, socket.point) - socket.point.y;
            deficit = Math.max(deficit, under);
            if (under > 0.002 && side === trail)
              ahead = Math.max(
                ahead,
                advance(goal.point, socket.socket, socket.point),
              );
          }
          if (deficit <= 0.002) break;

          const decrease: number = previousDeficit - deficit;
          const ratio: number =
            decrease < 1e-3
              ? 1
              : Math.min(4, Math.max(1, (point.y - previousHeight) / decrease));
          previousHeight = point.y;
          previousDeficit = deficit;
          // A heel can swing back over the far face even with its ankle
          // beyond it. Take the shorter correction to the landing ramp
          // when raising the ankle would fold the knee further.
          if (ahead > 0 && ahead < deficit) {
            point = {
              ...point,
              x: point.x + ahead * forward.x,
              z: point.z + ahead * forward.z,
            };
            previousDeficit = -Infinity;
          } else point = { ...point, y: point.y + deficit * ratio };
          posture.limbs[limb] = {
            ...goal,
            point,
            rotation: range(hip, point, rotation),
          };
        }
        return posture;
      },
    };
    return result;
  }
}

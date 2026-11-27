import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { prepareHumanElbowPath } from "../../compose/internal/prepareHumanElbowPath";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * Zero displacement before a rounded grip starts to roll.
 */
const STILL: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/*
 * World hand placements shared by wearable prop actions.
 */
export namespace wardrobeHands {
  /*
   * Admit a hand that is free to work the closure.
   */
  export function closureHand(
    side: AutoMovieHumanSide,
    held: string | undefined,
  ): void {
    if (held !== undefined)
      throw refusal("side", side, "free the hand that works the zip");
  }

  /*
   * Admit a supported jacket close enough to the wearer's own collar.
   */
  export function sleeveMount(subject: string, distance: number): void {
    if (distance > 0.12)
      throw refusal(
        "prop",
        subject,
        "the jacket must be seated on the performer before threading this sleeve",
      );
  }
  /*
   * What every wardrobe mode names: the staged wearable prop.
   */
  export interface IPropParams {
    /*
     * The wearable prop's scene id.
     */
    prop: string;
  }

  /*
   * The posed grip may miss its authored contact by at most one centimetre.
   */
  export const MISS: number = 0.01;

  /*
   * Rigid grip and stationary facing of a bone at an admitted posture.
   */
  export function bone(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    name: AutoMovieHumanoidBone,
  ): IAutoMovieRigidTransform {
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([name]);
    const resolution: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        {},
        undefined,
        requested,
      );
    return HumanPropFrame.bone(
      poseBones(body, resolution.pose, undefined, requested).get(name)!,
    );
  }

  /*
   * The grip frame sampled in the display's actual hand rotation.
   */
  export function grip(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieRigidTransform {
    const selected: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      HumanHand.frameBones(body, side, "grip"),
    );
    const resolution: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        {},
        undefined,
        selected,
      );
    const posed: ReturnType<typeof poseBones> = poseBones(
      body,
      resolution.pose,
      undefined,
      selected,
    );
    return {
      position: HumanHand.frame(body, posed, side, "grip").point,
      rotation: posed.get(side === "left" ? "leftHand" : "rightHand")!
        .worldRotation,
    };
  }

  /*
   * Local affordance lookup with one actionable refusal for absent or
   * incompatible sockets.
   */
  export function site(
    prop: IAutoMovieMotionHumanPropReader["prop"],
    id: string,
    kind?: IAutoMovieAffordance["kind"],
  ): IAutoMovieAffordance {
    const found: IAutoMovieAffordance | undefined = prop.affordances?.find(
      (point: IAutoMovieAffordance): boolean =>
        point.id === id && (kind === undefined || point.kind === kind),
    );
    if (found === undefined)
      throw refusal(
        "opening",
        id,
        "the wearable does not declare a compatible contact",
      );
    return found;
  }

  /*
   * World or local rigid transform of a declared native model contact.
   */
  export function frame(
    contact: IAutoMovieAffordance,
  ): IAutoMovieRigidTransform {
    return {
      position: contact.frame.translation,
      rotation: contact.frame.rotation,
    };
  }

  /*
   * A true aperture's middle rather than its lower-edge origin.
   */
  export function middle(
    aperture: IAutoMovieAffordance,
  ): IAutoMovieRigidTransform {
    const f: IAutoMovieRigidTransform = frame(aperture);
    if (
      !(
        aperture.height !== undefined &&
        aperture.width !== undefined &&
        aperture.height > 0 &&
        aperture.width > 0
      )
    )
      throw refusal(
        "opening",
        aperture.id,
        "the slot supplies no positive opening dimensions",
      );
    return HumanPropFrame.compose(f, {
      position: { x: 0, y: aperture.height / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
  }

  /*
   * Move one grip over a clamped minimum-jerk path between admitted keys.
   */
  export function path(
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
    fraction: number,
  ): IAutoMovieRigidTransform {
    const u: number = AutoMovieEngineMotionSampling.minimumJerk(Math.min(1, Math.max(0, fraction))).s;
    return {
      position: Vector3.lerp(from.position, to.position, u),
      rotation: Quaternion.slerp(from.rotation, to.rotation, u),
    };
  }

  /*
   * Assign a grip target to one arm while preserving every other part of the
   * posture. A channel demand that leaves the arm out (`courseArmGoal`'s, while
   * the arm is on its planned course) takes the posture as it is, with no elbow
   * search for a goal no reader takes.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    target: IAutoMovieRigidTransform,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ): IAutoMovieMotionHumanPosture {
    if (channels !== undefined && !channels.includes(`${side}Arm`))
      return posture;
    const site: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
    const point: IAutoMovieVector3 = Vector3.subtract(
      target.position,
      Quaternion.rotateVector(target.rotation, site),
    );
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve({
      body,
      posture,
      side,
      point,
      rotation: target.rotation,
      fallback: "hang",
    });
    return gripGoal(posture, side, point, target.rotation, bend, site);
  }

  /*
   * Prepare elbow hints over a bound path, keeping the exact grip geometry.
   */
  export function prepareArm(
    body: IAutoMovieMotionHumanBody,
    base: (seconds: number) => IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    path: (seconds: number) => IAutoMovieRigidTransform,
    duration: number,
    knots: readonly number[],
  ): (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture {
    const site: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
    const wrist = (target: IAutoMovieRigidTransform): IAutoMovieVector3 =>
      Vector3.subtract(
        target.position,
        Quaternion.rotateVector(target.rotation, site),
      );
    const elbow: (seconds: number) => IAutoMovieVector3 = prepareHumanElbowPath(
      duration,
      knots,
      (
        seconds: number,
      ): Parameters<typeof AutoMovieMotionHumanBend.solve>[0] => {
        const target: IAutoMovieRigidTransform = path(seconds);
        return {
          body,
          posture: base(seconds),
          side,
          point: wrist(target),
          rotation: target.rotation,
          fallback: "hang",
        };
      },
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const target: IAutoMovieRigidTransform = path(seconds);
      return gripGoal(
        posture,
        side,
        wrist(target),
        target.rotation,
        elbow(seconds),
        site,
      );
    };
  }

  /*
   * A local translation without a change to the unit quaternion.
   */
  export function displaced(
    from: IAutoMovieRigidTransform,
    delta: IAutoMovieVector3,
  ): IAutoMovieRigidTransform {
    return { ...from, position: Vector3.add(from.position, delta) };
  }

  /*
   * Roll a rounded grip around the actual hand contact while the model aligns.
   */
  export function roll(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    desired: IAutoMovieRigidTransform,
    fraction: number,
    displayed?: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    if (fraction <= 0) return STILL;
    const turn: IAutoMovieRigidTransform["rotation"] = HumanPropFrame.relative(
      displayed ?? grip(body, posture, side),
      desired,
    ).rotation;
    return {
      ...STILL,
      rotation: Quaternion.slerp(
        STILL.rotation,
        turn,
        AutoMovieEngineMotionSampling.minimumJerkShare(fraction),
      ),
    };
  }

  /*
   * Construct a declared grip that takes custody at closure, or steadies the
   * receiver.
   */
  export function contact(
    prop: string,
    side: AutoMovieHumanSide,
    from: number,
    to: number,
    carries: boolean = true,
  ): IAutoMovieMotionHumanContactWindow {
    return {
      part: side === "left" ? "leftHand" : "rightHand",
      kind: "grip",
      support: { kind: "prop", subject: prop, carries },
      from,
      to,
    };
  }

  /*
   * Reject incomplete authorship or a geometric fit that the wearer cannot
   * take.
   */
  export function refusal(
    axis: string,
    value: unknown,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind:
        axis === "opening"
          ? "affordance"
          : axis === "reach"
            ? "reach"
            : axis === "base"
              ? "base"
              : "parameter",
      axis,
      value,
      feasible: null,
      reason,
      fix: "use a correctly sized stage wearable with reachable contacts for this body",
    });
  }

  /*
   * Prove the posed hand reached its geometric goal before publishing custody.
   */
  export function verify(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    expected: IAutoMovieRigidTransform,
    tolerance: number,
  ): void {
    const shown: IAutoMovieRigidTransform = grip(context.body, posture, side);
    const miss: number = Vector3.distance(shown.position, expected.position);
    if (!(miss <= tolerance))
      throw refusal(
        "reach",
        miss,
        "the posed grip misses the requested wearable contact",
      );
  }

  /*
   * A free-space transfer time, preserving a readable short phase on screen.
   */
  export function duration(
    a: IAutoMovieRigidTransform,
    b: IAutoMovieRigidTransform,
  ): number {
    return Math.max(
      0.23,
      AutoMovieMotionHumanTiming(Vector3.distance(a.position, b.position), {
        solid: false,
      }),
    );
  }

  /*
   * Drive the slider with a hand after the jacket has transferred onto the
   * chest.
   */
  export function zipper(
    context: IAutoMovieMotionHumanActionContext<IPropParams>,
    side: AutoMovieHumanSide,
    reverse: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params }: typeof context = context;
    closureHand(side, entry.holds[side]);
    const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
    const model: IAutoMovieRigidTransform = reader.frame(context.start - 1e-6);
    const slider: IAutoMovieAffordance = site(reader.prop, "zip", "slider");
    if (
      !(
        slider.travel !== undefined &&
        slider.travel > 0 &&
        (slider.parts?.length ?? 0) > 0
      )
    )
      throw refusal(
        "opening",
        "zip",
        "the closure must drive visible parts over a positive travel",
      );
    const base: number = reader.state?.(context.start).zip ?? 0;
    const limit: number = slider.travel;
    const terminal: number = reverse ? 0 : limit;
    const at: IAutoMovieRigidTransform = HumanPropFrame.compose(
      model,
      frame(slider),
    );
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(at.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const out: IAutoMovieVector3 = Quaternion.rotateVector(at.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const hand: IAutoMovieRigidTransform = grip(body, entry.posture, side);
    const a: IAutoMovieVector3 = Vector3.add(
      at.position,
      Vector3.scale(axis, base),
    );
    const b: IAutoMovieVector3 = Vector3.add(
      at.position,
      Vector3.scale(axis, terminal),
    );
    const rotations: IAutoMovieRigidTransform["rotation"][] = [
      hand.rotation,
      ...[0, 45, -45, 90, -90, 135, -135, 180].map(
        (angle: number): IAutoMovieRigidTransform["rotation"] =>
          HumanHand.rotation(side, {
            fingers: Vector3.scale(out, -1),
            palm: Quaternion.rotateVector(
              Quaternion.fromAxisAngle(out, angle),
              axis,
            ),
          }),
      ),
    ];
    const rotation: IAutoMovieRigidTransform["rotation"] = fittedGrip(
      context,
      side,
      a,
      b,
      rotations,
      "the hand cannot reach both limits of the zipper",
    );
    const start: IAutoMovieRigidTransform = { position: a, rotation };
    const end: IAutoMovieRigidTransform = { position: b, rotation };
    const take: number = duration(hand, start);
    const slide: number = duration(start, end);
    const closed: number = take + slide;
    const total: number = closed + duration(end, hand);
    const goal = (seconds: number): IAutoMovieRigidTransform =>
      seconds <= take
        ? path(hand, start, seconds / take)
        : seconds <= closed
          ? path(start, end, (seconds - take) / slide)
          : path(end, hand, (seconds - closed) / (total - closed));
    const prepared: ReturnType<typeof prepareArm> = prepareArm(
      body,
      () => entry.posture,
      side,
      goal,
      total,
      [take, closed],
    );
    const posture = (seconds: number): IAutoMovieMotionHumanPosture =>
      prepared(entry.posture, seconds);
    verify(context, posture(take), side, start, MISS);
    verify(context, posture(closed), side, end, MISS);
    const support: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, total);
    return {
      ...support,
      events: [
        { name: "zipHeld", share: take / total },
        { name: "strokeEnd", share: closed / total },
        { name: "relax", share: 1 },
      ],
      hands: [side],
      contacts: [
        ...support.contacts,
        contact(params.prop, side, take / total, closed / total, false),
      ],
      drives: [
        {
          prop: params.prop,
          articulation: "zip",
          from: take / total,
          to: closed / total,
          travel: (seconds: number): number =>
            Math.max(
              0,
              Math.min(
                limit,
                base +
                  (terminal - base) *
                    AutoMovieEngineMotionSampling.minimumJerkShare((seconds - take) / slide),
              ),
            ),
        },
      ],
      posture,
    };
  }

  /*
   * Choose a hand roll that reaches both endpoints of a fully defined path.
   */
  export function fittedGrip(
    context: IAutoMovieMotionHumanActionContext<IPropParams>,
    side: AutoMovieHumanSide,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    rotations: readonly IAutoMovieRigidTransform["rotation"][],
    reason: string,
  ): IAutoMovieRigidTransform["rotation"] {
    const { body, entry }: typeof context = context;
    const positions: readonly IAutoMovieVector3[] = a === b ? [a] : [a, b];
    let best: number = Infinity;
    let answer: IAutoMovieRigidTransform["rotation"] = rotations[0]!;
    for (const rotation of rotations) {
      const miss: number = Math.max(
        ...positions.map((position: IAutoMovieVector3): number => {
          const shown: IAutoMovieRigidTransform = grip(
            body,
            arm(body, entry.posture, side, { position, rotation }),
            side,
          );
          return Vector3.distance(shown.position, position);
        }),
      );
      if (miss < best) {
        best = miss;
        answer = rotation;
      }
      if (best < MISS / 2) break;
    }
    if (!(best <= MISS)) throw refusal("reach", best, reason);
    return answer;
  }
}

/*
 * Merge a grip's exact wrist and prepared bend into a posture.
 */
function gripGoal(
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  point: IAutoMovieVector3,
  rotation: IAutoMovieRigidTransform["rotation"],
  bend: IAutoMovieVector3,
  site: IAutoMovieVector3,
): IAutoMovieMotionHumanPosture {
  return {
    ...posture,
    limbs: {
      ...posture.limbs,
      [`${side}Arm`]: AutoMovieMotionHumanArmTarget.fromWrist(
        { point, rotation },
        bend,
        site,
      ),
    },
  };
}

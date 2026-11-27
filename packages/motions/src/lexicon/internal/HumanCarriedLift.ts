import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedLift,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { turnHumanPosture } from "../../posture/internal/turnHumanPosture";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { HumanCarriedLiftKnots } from "./HumanCarriedLiftKnots";

/*
 * The lift into a carry and the set-down out of it: the carried body leaves the
 * posture it was entered in for the carry's over the first `lift` seconds, and
 * over the last `setDown` seconds comes down to stand where the carrier has
 * brought it.
 *
 * Both are a blend on minimum-jerk progress between two whole postures: the
 * displayed root rises before it crosses and crosses before it comes down, each
 * on a minimum-jerk half of the phase, so the body goes over the carrier rather
 * than through it; its quaternion follows the shortest rotation and the joints
 * go with it, and the carry's own posture keeps following the carrier
 * meanwhile, so the body arrives on a carrier who walks. A coupled cradle keeps
 * the person's feet planted until both palms reach their surfaces. The palms
 * bear through the transition and until both feet touch the floor. Other
 * carries publish their held contacts over their steady phase.
 */
export namespace HumanCarriedLift {
  /*
   * A carried plan with its lift and its set-down.
   * Parameter context: The carried person's context.
   * Parameter plan: The plan of the carry itself, whose posture follows the
   * carrier.
   * Returns: The plan with the two phases; `plan` itself when neither is asked.
   * When a phase is negative.
   */
  export function over(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBorne>,
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    const phase: IPhase = timing(context.params, plan.duration);
    const { lift, setDown }: IPhase = phase;
    if (lift + setDown === 0) return plan;
    const cradle: boolean =
      context.params.carry === "cradle" && context.params.partner !== undefined;
    if (
      cradle &&
      lift > 0 &&
      (!context.entry.feet.left.planted || !context.entry.feet.right.planted)
    )
      throw cradleRefusal(context.params.partner!);
    const take: number = cradle ? phase.take : 0;
    const land: number = cradle ? phase.land : plan.duration;
    const release: number = cradle ? phase.release : plan.duration;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const body: IAutoMovieMotionHumanBody = context.body;
    const partner: IAutoMovieMotionHumanPerformerReader | undefined = cradle
      ? context.performer(context.params.partner!)
      : undefined;
    const hips: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips"]);
    const carrierFrame = (at: number): IAutoMovieMotionHumanFrame => {
      const anchor: IAutoMovieResolvedBone = partner!
        .bones(context.start + at, hips)
        .get("hips")!;
      return {
        origin: anchor.worldPosition,
        yaw: HumanFrame.heading(anchor.worldRotation),
      };
    };

    // Each end of a blend is written by its solved joint angles alone
    // (`GymnasticsFlight.frozen`), so a limb a goal places at one end is
    // blended from where that goal put it, never dropped at the start or
    // taken whole half way, and the blend meets each end's displayed pose.
    const stood: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      entry,
    );
    const ease: (x: number) => number = (x: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(x);
    const named: readonly AutoMovieHumanoidRegion[] = [
      "upperBack",
      "kneeRight",
    ];
    const selected: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      named.map(
        (region: AutoMovieHumanoidRegion): AutoMovieHumanoidBone =>
          body.surfaces.regions[region].bone,
      ),
    );
    const centers: ReturnType<typeof HumanTrunk.prepareResolve> | undefined =
      cradle ? HumanTrunk.prepareResolve(body, selected) : undefined;
    const center = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        centers!(posture);
      return Vector3.scale(
        Vector3.add(
          StrikingBody.region(body, bones, "upperBack").point,
          StrikingBody.region(body, bones, "kneeRight").point,
        ),
        0.5,
      );
    };
    // The blend at a raw progress `x`. The root rises before it crosses and
    // crosses before it comes down, each on a minimum-jerk half of the
    // phase, so the body goes over the carrier, never through it, and the
    // two halves meet at rest, the root's velocity continuous there. The
    // joints, the heading and the attitude go with the height: the body
    // takes the carry's shape (a straddle's legs open) as it rises, before
    // it crosses, and the stand's as it comes down, after it has crossed.
    const mix = (
      from: IAutoMovieMotionHumanPosture,
      to: IAutoMovieMotionHumanPosture,
      x: number,
    ): IAutoMovieMotionHumanPosture => {
      const lead: number = ease(Math.min(1, 2 * x));
      const lag: number = ease(Math.max(0, 2 * x - 1));
      const a: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture(from);
      const b: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture(to);
      const rising: boolean = b.position.y >= a.position.y;
      const up: number = cradle ? ease(x) : rising ? lead : lag;
      const across: number = cradle ? up : rising ? lag : lead;
      const w: number = up;
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const bone of new Set([
        ...Object.keys(from.joints),
        ...Object.keys(to.joints),
      ]) as Set<AutoMovieHumanoidBone>) {
        const a: readonly [number, number, number] = from.joints[bone] ?? [
          0, 0, 0,
        ];
        const b: readonly [number, number, number] = to.joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          a[0] + (b[0] - a[0]) * w,
          a[1] + (b[1] - a[1]) * w,
          a[2] + (b[2] - a[2]) * w,
        ];
      }
      const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        a.rotation,
        b.rotation,
        w,
      );
      const blended: IAutoMovieMotionHumanPosture = {
        root: {
          x: a.position.x + (b.position.x - a.position.x) * across,
          y: a.position.y + (b.position.y - a.position.y) * up,
          z: a.position.z + (b.position.z - a.position.z) * across,
        },
        yaw: from.yaw + turn * w,
        pitch: from.pitch + (to.pitch - from.pitch) * w,
        roll: from.roll + (to.roll - from.roll) * w,
        joints,
        limbs: {},
      };
      const out: IAutoMovieMotionHumanPosture = {
        ...blended,
        rotation: {
          about: blended.root,
          turn: Quaternion.multiply(
            rotation,
            Quaternion.inverse(humanPostureHeading(blended)),
          ),
        },
      };
      if (!cradle || w === 0 || w === 1) return out;
      // Carry the supporting regions' common centre along the transfer. A
      // blend about the hips alone would sweep the folded limbs away from the
      // waiting hands before the two whole-body postures meet.
      const aCenter: IAutoMovieVector3 = center(from);
      const target: IAutoMovieVector3 = Vector3.addScaled(
        aCenter,
        Vector3.subtract(center(to), aCenter),
        w,
      );
      const correction: IAutoMovieVector3 = Vector3.subtract(
        target,
        center(out),
      );
      return {
        ...out,
        root: Vector3.add(out.root, correction),
        rotation: {
          ...out.rotation!,
          about: Vector3.add(out.rotation!.about, correction),
        },
      };
    };
    // The carry's frozen posture over each phase is kept on knots
    // (`HumanCarriedLiftKnots`): one whole-posture fit a knot, not one a
    // displayed second, the knots as dense as the blend's own error bound
    // needs.
    const rising: HumanCarriedLiftKnots.ICourse = HumanCarriedLiftKnots.course(
      0,
      lift,
    );
    const lowering: HumanCarriedLiftKnots.ICourse =
      HumanCarriedLiftKnots.course(plan.duration - setDown, plan.duration);
    const folding: HumanCarriedLiftKnots.ICourse = HumanCarriedLiftKnots.course(
      take,
      lift,
    );
    const unfolding: HumanCarriedLiftKnots.ICourse =
      HumanCarriedLiftKnots.course(plan.duration - setDown, land);
    // The frozen posture the knots are fitted on, read on the plan as it is
    // prepared.
    const frozen = (seconds: number): IAutoMovieMotionHumanPosture =>
      GymnasticsFlight.frozen(body, plan.posture(seconds));
    let landed: IAutoMovieMotionHumanPosture | undefined;
    let pickup: IAutoMovieMotionHumanFrame | undefined;
    const grounding = (
      reading: HumanCarriedLiftKnots.IReading,
    ): IAutoMovieMotionHumanPosture => {
      if (!cradle || lift === 0)
        return {
          ...stood,
          root: { x: reading.root.x, y: stood.root.y, z: reading.root.z },
          yaw: HumanFrame.heading(reading.rotation),
        };
      const initial: IAutoMovieMotionHumanFrame = (pickup ??=
        carrierFrame(take));
      const landing: IAutoMovieMotionHumanFrame = carrierFrame(land);
      const where: IAutoMovieVector3 = HumanFrame.point(
        landing,
        HumanFrame.local(initial, stood.root),
      );
      const root: IAutoMovieVector3 = { ...where, y: stood.root.y };
      const degrees: number = landing.yaw - initial.yaw;
      return {
        ...stood,
        root,
        yaw: stood.yaw + degrees,
        ...(stood.rotation === undefined
          ? {}
          : {
              rotation: {
                about: Vector3.add(
                  root,
                  Quaternion.rotateVector(
                    HumanFrame.turn(degrees),
                    Vector3.subtract(stood.rotation.about, stood.root),
                  ),
                ),
                turn: Quaternion.multiply(
                  Quaternion.multiply(
                    HumanFrame.turn(degrees),
                    stood.rotation.turn,
                  ),
                  HumanFrame.turn(-degrees),
                ),
              },
            }),
      };
    };
    const windows: IAutoMovieMotionHumanContactWindow[] = plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...window,
        from: Math.max(window.from, (cradle ? take : lift) / plan.duration),
        to: Math.min(
          window.to,
          (cradle ? release : plan.duration - setDown) / plan.duration,
        ),
      }),
    );
    for (const part of ["leftFoot", "rightFoot"] as const) {
      const ground: IAutoMovieMotionHumanContactWindow.Support =
        context.entry.supports.find(
          (support): boolean =>
            support.part === part && support.support.kind === "ground",
        )?.support ?? { kind: "ground" };
      if (cradle && lift > 0)
        windows.push({
          part,
          kind: "plant",
          from: 0,
          to: take / plan.duration,
          support: ground,
        });
      if (cradle && setDown > 0)
        windows.push({
          part,
          kind: "plant",
          from: land / plan.duration,
          to: 1,
          support: ground,
        });
    }
    const fold = (at: number): IAutoMovieMotionHumanPosture =>
      mix(
        stood,
        HumanCarriedLiftKnots.read(rising, at, frozen).posture,
        (at - take) / (lift - take),
      );
    const unfold = (at: number): IAutoMovieMotionHumanPosture => {
      const reading: HumanCarriedLiftKnots.IReading =
        HumanCarriedLiftKnots.read(lowering, at, frozen);
      return mix(
        reading.posture,
        landed ?? grounding(reading),
        (at - unfolding.from) / (land - unfolding.from),
      );
    };
    const result: IAutoMovieMotionHumanActionPlan = {
      ...plan,
      prepare: (): void => {
        plan.prepare?.();
        if (lift > 0) HumanCarriedLiftKnots.prepare(rising, body, frozen);
        if (setDown > 0) HumanCarriedLiftKnots.prepare(lowering, body, frozen);
        if (cradle) {
          pickup = undefined;
          if (setDown > 0) {
            landed = grounding(
              HumanCarriedLiftKnots.read(lowering, land, frozen),
            );
            HumanCarriedLiftKnots.prepare(unfolding, body, unfold);
          }
          if (lift > 0) HumanCarriedLiftKnots.prepare(folding, body, fold);
        }
      },
      ...(cradle
        ? {
            verifyDisplayed: (
              bones: IAutoMovieMotionHumanPerformerReader["bones"],
            ): void => {
              const fitted: IAutoMovieMotionHumanContactWindow[] = confirm(
                context,
                plan.duration,
                bones,
                windows,
                phase,
                [folding, unfolding],
              );
              windows.splice(0, windows.length, ...fitted);
            },
          }
        : {}),
      events: [
        ...plan.events,
        { name: "lifted", share: lift / plan.duration },
        { name: "setDown", share: 1 - setDown / plan.duration },
        ...(cradle
          ? [
              { name: "bearerContact", share: take / plan.duration },
              ...(setDown === 0
                ? []
                : [
                    { name: "floorContact", share: land / plan.duration },
                    { name: "bearerRelease", share: release / plan.duration },
                  ]),
            ]
          : []),
      ],
      contacts: windows,
      posture: (
        at: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        // The carry's frozen posture at a second of a phase: its knot's own
        // where the phase keeps one, interpolated between knots elsewhere.
        const carried = (
          course: HumanCarriedLiftKnots.ICourse,
        ): HumanCarriedLiftKnots.IReading =>
          HumanCarriedLiftKnots.read(
            course,
            at,
            (seconds: number): IAutoMovieMotionHumanPosture =>
              GymnasticsFlight.frozen(
                body,
                plan.posture(seconds, undefined, resolution, projection),
                resolution,
                projection,
              ),
          );
        if (lift > 0 && at < lift) {
          if (cradle)
            return at <= take
              ? entry
              : HumanCarriedLiftKnots.read(folding, at, fold).posture;
          const x: number = Math.max(0, (at - take) / (lift - take));
          return x <= 0 ? entry : mix(stood, carried(rising).posture, x);
        }
        if (setDown > 0 && at > plan.duration - setDown) {
          const from: number = plan.duration - setDown;
          const w: number = (at - from) / (land - from);
          if (w <= 0)
            return plan.posture(at, undefined, resolution, projection);
          if (cradle && at >= land)
            return (
              landed ??
              grounding(HumanCarriedLiftKnots.read(lowering, land, frozen))
            );
          if (cradle)
            return HumanCarriedLiftKnots.read(unfolding, at, unfold).posture;
          const reading: HumanCarriedLiftKnots.IReading = carried(lowering);
          return mix(reading.posture, landed ?? grounding(reading), w);
        }
        return plan.posture(at, undefined, resolution, projection);
      },
    };
    return result;
  }

  /*
   * Original phase lengths and their internal cradle support changes.
   */
  export interface IPhase {
    /*
     * Lift duration, seconds.
     */
    lift: number;
    /*
     * Set-down duration, seconds.
     */
    setDown: number;
    /*
     * Acquisition completes while the feet are still planted, seconds.
     */
    take: number;
    /*
     * Floor reacquisition occurs before the arms withdraw, seconds.
     */
    land: number;
    /*
     * The palms withdraw after both feet have accepted the weight.
     */
    release: number;
  }

  /*
   * Both coupled cradle roles share these events on their action clock.
   */
  export function timing(
    params: IAutoMovieMotionHumanCarriedLift.IParams,
    duration: number,
  ): IPhase {
    const up: number = HumanBound.least("lift", params.lift ?? 0, 0, "s");
    const down: number = HumanBound.least(
      "setDown",
      params.setDown ?? 0,
      0,
      "s",
    );
    const fit: number = up + down > duration ? duration / (up + down) : 1;
    const lift: number = up * fit;
    const setDown: number = down * fit;
    return {
      lift,
      setDown,
      take: lift / 2,
      land: duration - setDown / 2,
      release: duration - setDown / 4,
    };
  }
}

/*
 * Confirm the two held surfaces at both transfers and the carried endpoint.
 */
function confirm(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBorne>,
  duration: number,
  bones: IAutoMovieMotionHumanPerformerReader["bones"],
  windows: readonly IAutoMovieMotionHumanContactWindow[],
  phase: HumanCarriedLift.IPhase,
  transitions: readonly HumanCarriedLiftKnots.ICourse[],
): IAutoMovieMotionHumanContactWindow[] {
  const bearer: IAutoMovieMotionHumanPerformerReader = context.performer(
    context.params.partner!,
  );
  const holds: IAutoMovieMotionHumanContactWindow[] = windows.filter(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.kind === "bear" &&
      window.support.kind === "person" &&
      "region" in window.support &&
      (window.support.region === "palmLeft" ||
        window.support.region === "palmRight"),
  );
  if (holds.length !== 2) throw cradleRefusal(context.params.partner!);
  const failures: string[] = [];
  const lowering: number = duration - phase.setDown;
  const samples: number[] = [
    ...new Set([
      phase.take,
      phase.lift,
      (phase.lift + lowering) / 2,
      lowering,
      phase.land,
      phase.release,
      ...transitions.flatMap(
        (course: HumanCarriedLiftKnots.ICourse): number[] =>
          course.knots?.map(
            (knot: HumanCarriedLiftKnots.IKnot): number => knot.seconds,
          ) ?? [],
      ),
    ]),
  ].sort((a: number, b: number): number => a - b);
  const fitted: IAutoMovieMotionHumanContactWindow[] = windows.map(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow => {
      if (
        !holds.includes(window) ||
        window.region === undefined ||
        window.support.kind !== "person" ||
        !("region" in window.support)
      )
        return window;
      const region: AutoMovieHumanoidRegion = window.region;
      const palm: AutoMovieHumanoidRegion = window.support.region;
      const a: AutoMovieHumanoidBone =
        context.body.surfaces.regions[region].bone;
      const b: AutoMovieHumanoidBone = bearer.body.surfaces.regions[palm].bone;
      const shoulder: AutoMovieHumanoidBone =
        palm === "palmLeft" ? "leftUpperArm" : "rightUpperArm";
      const narrow: ReadonlySet<AutoMovieHumanoidBone> = new Set([b, shoulder]);
      const selected: ReadonlySet<AutoMovieHumanoidBone> = new Set([a]);
      const pair: ReturnType<typeof HumanMaterialContact.preparePair> =
        HumanMaterialContact.preparePair(context.body, a, bearer.body, b);
      const check = (
        seconds: number,
      ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined => {
        const own: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
          context.start + seconds,
          selected,
        );
        const other: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          bearer.bones(context.start + seconds, narrow);
        const outward = StrikingBody.region(context.body, own, region);
        const normal = StrikingBody.region(bearer.body, other, palm);
        const fitted: ReturnType<typeof pair> = pair(
          own,
          other,
          outward.normal,
          normal.normal,
          Infinity,
        );
        const material:
          | IAutoMovieMotionHumanContactWindow.IMaterial
          | undefined = fitted?.first;
        const distance: number = Vector3.distance(outward.point, normal.point);
        if (
          material !== undefined &&
          Math.abs(material.clearance) <= 2 * HumanFoot.BEARING
        )
          return material;
        const reach: number = Vector3.distance(
          outward.point,
          other.get(shoulder)!.worldPosition,
        );
        failures.push(
          `${palm} to ${region} at ${seconds.toFixed(3)} s: skin centers ${(distance * 1000).toFixed(1)} mm, shoulder range ${(reach * 1000).toFixed(1)} mm, normal alignment ${Vector3.dot(outward.normal, normal.normal).toFixed(2)}${material === undefined ? "" : `, clearance ${(material.clearance * 1000).toFixed(1)} mm`}`,
        );
        return undefined;
      };
      const [material]: (
        | IAutoMovieMotionHumanContactWindow.IMaterial
        | undefined
      )[] = samples.map(check);
      return material === undefined ? window : { ...window, material };
    },
  );
  if (failures.length > 0)
    throw cradleRefusal(context.params.partner!, failures.join(" / "));
  return fitted;
}

/*
 * Refuse a cradle transfer whose named limbs cannot bear the displayed body.
 */
function cradleRefusal(subject: string, detail?: string): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: "partner",
    value: subject,
    reason:
      "the bearer's palms cannot reach the back and knee through both transfers" +
      (detail === undefined ? "" : ` (${detail})`),
    fix: "align the two cradle roles and staged bodies before lifting",
  });
}

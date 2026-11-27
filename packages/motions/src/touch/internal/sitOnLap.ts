import { Quaternion, Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieMotionHumanSitOnLap,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { sit } from "../../everyday/internal/sit";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { admitLapSupport } from "./admitLapSupport";
import { requireOtherPerformer } from "./requireOtherPerformer";

/**
 * How far behind the seat's front edge the sit law rests the seat socket, short
 * of the sitter's thigh, metres: `IAutoMovieMotionHumanSeated`'s 0.05 m
 * clearance.
 */
const CLEARANCE: number = 0.05;

/** Both displayed thighs and their knee endpoints define the receiver frame. */
const LEGS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
]);

/** The two receiving sides of a lap. */
const THIGHS: readonly ["thighFrontLeft", "thighFrontRight"] = [
  "thighFrontLeft",
  "thighFrontRight",
];

/** Contact tolerance for jointed, paired body surfaces, metres. */
const BEARING: number = 0.01;

/**
 * Sit on a seated partner's lap. The lap is the seated partner's thighs where
 * they are at the start: its height is the top of the two thighs' middles
 * (`thighFrontLeft` and `thighFrontRight`), its heading the partner's hips to
 * knees. The sit law (`sit`) sits the body onto it as onto a seat facing that
 * heading, the seat's front edge set so the sitter's seat socket comes to rest
 * over the thighs' middles; a lap above the sitter's band is got onto as a high
 * seat, the feet hanging. The sit's seat window bears instead on the partner:
 * half on each thigh. A partner whose thighs are not near level is refused as
 * not seated.
 */
function planSitOnLap(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSitOnLap>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanSitOnLap = context.params;
  requireOtherPerformer(
    context.subject,
    p.partner,
    "a performer sits on another performer's lap",
  );
  const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
    p.partner,
  );
  const at = (seconds: number): ILap =>
    lap(partner, p.partner, partner.bones(context.start + seconds, LEGS));
  const start: ILap = at(0);
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    start.frame.rotation,
    { x: 0, y: 0, z: 1 },
  );
  const thigh: number = context.body.measure.thigh;
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: Vector3.add(
      start.frame.position,
      Vector3.scale(forward, thigh - CLEARANCE),
    ),
    yaw: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
    depth: thigh + CLEARANCE,
  };
  const params: IAutoMovieMotionHumanSit.IParams = {
    seat,
    ...(p.hold === undefined ? {} : { hold: p.hold }),
    ...(p.manner === undefined ? {} : { manner: p.manner }),
  };
  const plan: IAutoMovieMotionHumanActionPlan = sit.plan({
    ...context,
    params,
  });
  const entered: number =
    (plan.contacts.find(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.part === "seat",
    )?.from ?? 1) * plan.duration;
  const full: number =
    (plan.events.find((event): boolean => event.name === "seated")?.share ??
      1) * plan.duration;
  const own: AutoMovieHumanoidBone = context.body.surfaces.sockets.seat.bone;
  const pelvis: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    context.body,
    new Set([own]),
  );
  const fit = THIGHS.map(
    (
      region: AutoMovieHumanoidRegion,
    ): ReturnType<typeof HumanMaterialContact.preparePair> =>
      HumanMaterialContact.preparePair(
        context.body,
        own,
        partner.body,
        partner.body.surfaces.regions[region].bone,
      ),
  );
  let lift: number = 0;
  const placed = (
    source: IAutoMovieMotionHumanPosture,
    time: number,
    current: ILap,
    correction: number,
  ): IAutoMovieMotionHumanPosture => {
    const weight: number = entered <= 0 ? 1 : AutoMovieEngineMotionSampling.minimumJerkShare(time / entered);
    const now: IAutoMovieRigidTransform = {
      position: Vector3.lerp(
        start.frame.position,
        current.frame.position,
        weight,
      ),
      rotation: Quaternion.slerp(
        start.frame.rotation,
        current.frame.rotation,
        weight,
      ),
    };
    const shifted: IAutoMovieMotionHumanPosture = carryHumanPosture(
      source,
      start.frame,
      now,
    );
    shifted.root.y +=
      correction * (full <= 0 ? 1 : AutoMovieEngineMotionSampling.minimumJerkShare(time / full));
    for (const leg of ["leftLeg", "rightLeg"] as const)
      if (source.limbs[leg]?.planted === true)
        shifted.limbs[leg] = source.limbs[leg];
    return shifted;
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = plan.contacts.flatMap(
    (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow[] =>
      window.part !== "seat"
        ? [window]
        : THIGHS.map(
            (
              region: AutoMovieHumanoidRegion,
            ): IAutoMovieMotionHumanContactWindow => ({
              ...window,
              ...(window.load === undefined ? {} : { load: window.load / 2 }),
              support: { kind: "person", subject: p.partner, region },
            }),
          ),
  );
  const result: IAutoMovieMotionHumanActionPlan = {
    ...plan,
    contacts,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture =>
      placed(plan.posture(...args), args[0], at(args[0]), lift),
    prepare: (): void => {
      plan.prepare?.();
      const check = (
        seconds: number,
        correction: number,
      ): HumanMaterialContact.IPair[] => {
        const receiver: ILap = at(seconds);
        const displayed: IAutoMovieMotionHumanPosture = placed(
          plan.posture(seconds),
          seconds,
          receiver,
          correction,
        );
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          pelvis(resolveHumanPosture(context.body, displayed));
        return fit.flatMap(
          (pair, index: number): HumanMaterialContact.IPair[] => {
            const receiving: IAutoMovieVector3 = StrikingBody.region(
              partner.body,
              receiver.bones,
              THIGHS[index]!,
            ).normal;
            const found: HumanMaterialContact.IPair | undefined = pair(
              bones,
              receiver.bones,
              { x: 0, y: -1, z: 0 },
              receiving,
              Infinity,
            );
            return found === undefined ? [] : [found];
          },
        );
      };
      const gap = (correction: number): number =>
        Math.min(
          ...check(full, correction).map(
            (pair: HumanMaterialContact.IPair): number => pair.first.clearance,
          ),
        );
      const range: number = context.body.measure.thighRadius;
      const low: number = gap(-range);
      const high: number = gap(range);
      if (low <= 0 && high > 0)
        lift = AutoMovieEngineMath.bracketedCrossing({
          f: gap,
          low: -range,
          high: range,
          known: { low, high },
          past: (value: number): boolean => value > 0,
          tolerance: 0.0001,
        }).high;
      const held: HumanMaterialContact.IPair[] = check(full, lift);
      const last: HumanMaterialContact.IPair[] = check(plan.duration, lift);
      if (
        [held, last].some(
          (pair: HumanMaterialContact.IPair[]): boolean =>
            pair.length !== 2 ||
            pair.some(
              (site: HumanMaterialContact.IPair): boolean =>
                Math.abs(site.first.clearance) > BEARING,
            ),
        )
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "partner",
          value: p.partner,
          reason:
            "both displayed thighs cannot continue to bear the seated pelvis",
          fix: "keep the receiver seated with both thighs under the sitter",
        });
      result.contacts = contacts.map(
        (
          window: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => {
          if (
            window.part !== "seat" ||
            window.support.kind !== "person" ||
            !("region" in window.support)
          )
            return window;
          const index: number = window.support.region === THIGHS[0] ? 0 : 1;
          return { ...window, material: held[index]!.first };
        },
      );
    },
  };
  return result;
}

/** Read the displayed lap axes and bounds from one partner observation. */
function lap(
  partner: IAutoMovieMotionHumanPerformerReader,
  subject: string,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): ILap {
  const point = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    bones.get(bone)!.worldPosition;
  const hips: IAutoMovieVector3 = Vector3.lerp(
    point("leftUpperLeg"),
    point("rightUpperLeg"),
    0.5,
  );
  const knees: IAutoMovieVector3 = Vector3.lerp(
    point("leftLowerLeg"),
    point("rightLowerLeg"),
    0.5,
  );
  admitLapSupport(subject, hips.y - knees.y, partner.body.measure.thigh);
  const top: IAutoMovieVector3 = Vector3.lerp(
    StrikingBody.region(partner.body, bones, THIGHS[0]).point,
    StrikingBody.region(partner.body, bones, THIGHS[1]).point,
    0.5,
  );
  const yaw: number =
    (Math.atan2(knees.x - hips.x, knees.z - hips.z) * 180) / Math.PI;
  return {
    bones,
    frame: {
      position: top,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
    },
  };
}

/**
 * Sit on a seated partner's lap. The lap is the seated partner's thighs where
 * they are at the start: its height is the top of the two thighs' middles
 * (`thighFrontLeft` and `thighFrontRight`), its heading the partner's hips to
 * knees. The sit law (`sit`) sits the body onto it as onto a seat facing that
 * heading, the seat's front edge set so the sitter's seat socket comes to rest
 * over the thighs' middles; a lap above the sitter's band is got onto as a high
 * seat, the feet hanging. The sit's seat window bears instead on the partner:
 * half on each thigh. A partner whose thighs are not near level is refused as
 * not seated.
 */
export const sitOnLap: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSitOnLap> =
  {
    name: "sitOnLap",
    interrupts: sit.interrupts,
    plan: planSitOnLap,
  };

/** The same-second thigh placement and the posture reader's yaw carrier. */
interface ILap {
  /** Receiver bones needed by the physical pairing. */
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  /** The heading and mean height of the thighs' top surfaces. */
  frame: IAutoMovieRigidTransform;
}

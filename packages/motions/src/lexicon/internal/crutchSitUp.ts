import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { rise } from "../../everyday/internal/rise";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { crutchSitKit } from "./crutchSitKit";
import { crutchSitPath } from "./crutchSitPath";

/**
 * Rise from a chair with two crutches held in the injured side's hand, in the
 * prescribed order (Cornell Health and HealthLinkBC, Using crutches), entered
 * as the crutch sit leaves the body.
 *
 * The rise law stands the body on the sound leg while the sound hand pushes on
 * the chair until the seat is left (`seatOff`) and the injured side's hand
 * brings the crutches back upright side by side before the body by `standing`
 * (`crutchSitKit.gathered`), their tips sliding back on the floor; the injured
 * leg goes from its seated angles to `STANDING`. Then the sound hand takes its
 * crutch back from beside the other (`taken`, `crutchSitPath.grasped`), and
 * both crutches are carried to stand `TRIPOD` beside and ahead of the feet
 * (`planted`).
 *
 * @param context The crutch sit's context.
 * @param kit Its shared reads.
 * @returns The order's plan before the arms are coursed.
 */
export function crutchSitUp(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchSit>,
  kit: crutchSitKit.IKit,
): crutchSitKit.IOrder {
  const { body, entry, injured, sound, crutch, subject }: crutchSitKit.IKit =
    kit;

  // The crutches as the sit left them: tilted, their tips on the floor.
  const cA: crutchSitPath.ICrutch = crutch[injured];
  const frameA: IAutoMovieRigidTransform = kit.start(injured);
  const tip: IAutoMovieVector3 = Vector3.add(
    frameA.position,
    Quaternion.rotateVector(frameA.rotation, cA.tip),
  );
  const gripAt: IAutoMovieVector3 = Vector3.add(
    frameA.position,
    Quaternion.rotateVector(frameA.rotation, cA.grip),
  );
  const hA: IAutoMovieMotionHumanHeld.IHeld = crutchSitPath.held(
    body,
    context.entry.pose,
    injured,
    subject(injured),
    frameA,
    kit.affordances(injured),
  );
  const sat: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
    resolveHumanPosture(body, entry),
    `${injured}Leg`,
  );

  const plan: IAutoMovieMotionHumanActionPlan = rise.plan({
    ...context,
    params: {},
  });
  const stood: number = kit.at(plan, "standing");
  const off: number = kit.at(plan, "seatOff");
  const risen: IAutoMovieMotionHumanPosture = plan.posture(plan.duration);
  const f: IAutoMovieVector3 = crutchSitKit.forward(risen.yaw);
  const ankle: IAutoMovieVector3 =
    risen.limbs[`${sound}Leg`]?.point ?? risen.root;
  const centre: IAutoMovieVector3 = Vector3.add(
    ankle,
    Vector3.scale(
      crutchSitKit.lateral(risen.yaw, injured),
      body.measure.hipHalfWidth,
    ),
  );
  const planted = (side: AutoMovieHumanSide): IAutoMovieRigidTransform => {
    const at: IAutoMovieVector3 = Vector3.add(
      { x: centre.x, y: 0, z: centre.z },
      Vector3.add(
        Vector3.scale(
          crutchSitKit.lateral(risen.yaw, side),
          body.measure.hipHalfWidth + TRIPOD,
        ),
        Vector3.scale(f, TRIPOD),
      ),
    );
    return crutchSitPath.slid(
      crutch[side],
      at,
      Vector3.add(at, { x: 0, y: 1, z: 0 }),
      f,
    );
  };

  // Standing, the crutches come upright side by side before the body.
  const uprightA: IAutoMovieRigidTransform = crutchSitKit.gathered(
    kit,
    risen,
    injured,
  );
  const uprightB: IAutoMovieRigidTransform = crutchSitKit.gathered(
    kit,
    risen,
    sound,
  );
  const tipUp: IAutoMovieVector3 = Vector3.add(
    uprightA.position,
    Quaternion.rotateVector(uprightA.rotation, cA.tip),
  );
  const gripUp: IAutoMovieVector3 = Vector3.add(
    uprightA.position,
    Quaternion.rotateVector(uprightA.rotation, cA.grip),
  );
  const hB: IAutoMovieMotionHumanHeld.IHeld = crutchSitPath.grasped(
    sound,
    crutch[sound],
    uprightB,
    risen.yaw,
    subject(sound),
    kit.affordances(sound),
  );
  const pushed: IAutoMovieHumanLimbGoal | undefined =
    entry.limbs[`${sound}Arm`];
  const takeAt: IAutoMovieHumanLimbGoal = kit.goal(sound, hB, uprightB);
  const pushedAt: IAutoMovieHumanLimbGoal = pushed ?? takeAt;
  const reach: number = AutoMovieMotionHumanTiming.transport(
    Vector3.distance(pushedAt.point, takeAt.point),
  );
  const carry: number = AutoMovieMotionHumanTiming.transport(
    Math.max(
      Vector3.distance(uprightA.position, planted(injured).position),
      Vector3.distance(uprightB.position, planted(sound).position),
    ),
  );
  const taken: number = Math.max(stood, off + reach);
  const duration: number = taken + carry;

  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(duration, Math.max(0, seconds));
    const under: IAutoMovieMotionHumanPosture = plan.posture(
      Math.min(plan.duration, t),
    );
    const k: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / stood));
    const injuredArm: IAutoMovieHumanLimbGoal =
      t < stood
        ? kit.goal(
            injured,
            hA,
            crutchSitPath.slid(
              cA,
              Vector3.lerp(tip, tipUp, k),
              Vector3.lerp(gripAt, gripUp, k),
              f,
            ),
          )
        : kit.goal(
            injured,
            hA,
            t < taken
              ? uprightA
              : crutchSitPath.carried(
                  uprightA,
                  planted(injured),
                  (t - taken) / carry,
                ),
          );
    const soundArm: IAutoMovieHumanLimbGoal =
      t < off
        ? pushedAt
        : t < taken
          ? crutchSitKit.blend(pushedAt, takeAt, (t - off) / (taken - off))
          : kit.goal(
              sound,
              hB,
              crutchSitPath.carried(
                uprightB,
                planted(sound),
                (t - taken) / carry,
              ),
            );
    return kit.write(
      under,
      injured === "left"
        ? { left: injuredArm, right: soundArm }
        : { left: soundArm, right: injuredArm },
      crutchSitKit.leg(t / stood, sat, STANDING),
    );
  };
  const share = (seconds: number): number => Math.min(1, seconds / duration);
  const grip = (
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanContactWindow["part"] =>
    side === "left" ? "leftHand" : "rightHand";
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...plan.contacts
      .filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part !== `${injured}Foot` &&
          w.part !== "leftHand" &&
          w.part !== "rightHand",
      )
      .map(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...w,
          from: share(w.from * plan.duration),
          to: w.to >= 1 ? 1 : share(w.to * plan.duration),
        }),
      ),
    {
      part: grip(injured),
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: subject(injured) },
    },
    ...(pushed === undefined
      ? []
      : [
          {
            part: grip(sound),
            kind: "plant" as const,
            from: 0,
            to: share(off),
            support: HumanSupportFrame(context),
          },
        ]),
    {
      part: grip(sound),
      kind: "grip",
      from: share(taken),
      to: 1,
      support: { kind: "prop", subject: subject(sound) },
    },
  ];
  const events: IAutoMovieMotionEvent[] = [
    ...plan.events.map(
      (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
        ...e,
        share: share(e.share * plan.duration),
      }),
    ),
    { name: "taken", share: share(taken) },
    { name: "planted", share: 1 },
  ];
  return {
    duration,
    ready: 0,
    posture,
    contacts,
    events,
    holds: [
      { side: injured, prop: subject(injured), from: 1 },
      { side: sound, prop: subject(sound), from: 1 },
    ],
    wears: [],
    base: plan.base,
  };
}

/**
 * The injured leg held off the floor standing, degrees: the crutch walk's
 * three-point gait's hip and knee flexion.
 */
const STANDING: IAutoMovieHumanLimbReference = {
  upper: [30, 0, 0],
  lower: [80, 0, 0],
};

/**
 * How far a crutch tip stands beside and ahead of its foot after a rise,
 * metres: the tripod position (Physiopedia, Crutches).
 */
const TRIPOD: number = 0.15;

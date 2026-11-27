import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPaddleCraft } from "./AquaticPaddleCraft";
import { AquaticPosture } from "./AquaticPosture";

/*
 * Loaded drive and airborne recovery for rowing and racing paddle strokes.
 * Double-scull landmarks follow Cuijpers et al. at 26 strokes/min
 * (doi:10.1111/sms.12800, corrected by doi:10.1111/sms.13507). Paddle support
 * roles follow the ICF Canoe Sprint Coaching Manual and PMCID PMC8539159.
 */
export namespace AquaticPaddle {
  /*
   * Sample three cycles with separate drive and unloaded recovery.
   */
  export function plan(
    context: AquaticPosture.Context,
    kind: Stroke,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const hull: AquaticCrew.IHull = AquaticCrew.bind(context);
    const scull: boolean = kind === "doubleScull";
    const canoe: boolean = kind === "canoeStroke";
    const staticSide: AquaticCrew.Side = params.side ?? "right";
    const actual: AquaticPaddleCraft.IStroke | undefined =
      scull || params.prop === undefined
        ? undefined
        : AquaticPaddleCraft.bind(
            context,
            hull.id,
            params.prop,
            canoe,
            staticSide,
          );
    const period: number = scull ? 60 / 26 : 1.24;
    const lead: number = actual?.lead ?? 0;
    const duration: number = lead + period * 3;
    const offset: number = (params.phase ?? 0) % 1;
    const extraction: number = scull ? 0.44 : 0.49;
    const size: number = body.measure.stature;
    const rail: ReturnType<typeof scullRail> | undefined = scull
      ? scullRail(context, hull)
      : undefined;
    const seatsOrKnee: IAutoMovieMotionHumanContactWindow[] = canoe
      ? [
          AquaticCrew.bear(
            hull.id,
            `${staticSide}LowerLeg`,
            "bear",
            0,
            1,
            staticSide === "left" ? "kneeLeft" : "kneeRight",
          ),
        ]
      : [AquaticCrew.bear(hull.id, "seat", "seat", 0, 1)];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...seatsOrKnee,
      // Both feet bear: the front sole, and behind a kneeling canoeist the
      // instep of the kneeling leg rests on the floor.
      ...(["left", "right"] as const).map(
        (side: AquaticCrew.Side): IAutoMovieMotionHumanContactWindow =>
          AquaticCrew.bear(hull.id, `${side}Foot`, "plant", 0, 1),
      ),
      ...(actual?.hands.map((window) => ({
        ...window,
        from: lead / duration,
      })) ?? AquaticCrew.grips(hull, params)),
    ];
    const events: IAutoMovieMotionEvent[] =
      lead > 0 ? [{ name: "paddleReady", share: lead / duration }] : [];
    for (let i: number = 0; i <= 3; i++)
      for (const [name, phase] of [
        ["catch", 0],
        ["extract", extraction],
        ["clear", extraction + 0.11],
      ] as const) {
        const amount: number = i + phase - offset;
        const share: number = (lead + amount * period) / duration;
        if (amount >= 0 && share < 1)
          events.push({ name: `${name}${i + 1}`, share });
      }
    events.push({ name: "relax", share: 1 });
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const total: number = Math.max(0, t - lead) / period + offset;
        const cycle: number = Math.floor(total);
        const u: number = total - cycle;
        const drive: number =
          u <= extraction
            ? AutoMovieEngineMotionSampling.minimumJerkShare(u / extraction)
            : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((u - extraction) / (1 - extraction));
        const airborne: number =
          u <= extraction
            ? 0
            : Math.sin((Math.PI * (u - extraction)) / (1 - extraction));
        const active: AquaticCrew.Side =
          scull || canoe || cycle % 2 === 0
            ? staticSide
            : staticSide === "left"
              ? "right"
              : "left";
        const side: number = active === "left" ? 1 : -1;
        const lean: number = scull ? 25 - 39 * drive : 12 - 9 * drive;
        const leg: number = scull ? 109 - 85 * drive : 53 + 8 * drive;
        const pulling: IAutoMovieMotionHumanExerciseKey.ILimb = {
          shoulder: 78 - 104 * drive + 21 * airborne,
          raise: scull ? 32 : 30 + 40 * drive,
          elbow: 10 + 84 * drive,
          wrist: 5 - 22 * airborne,
        };
        const opposite: IAutoMovieMotionHumanExerciseKey.ILimb = scull
          ? pulling
          : {
              shoulder: 109 - 27 * drive + 10 * airborne,
              raise: 32 - 10 * drive,
              elbow: 64 - 24 * drive,
              wrist: 12,
            };
        const makeShape = (
          hand: AquaticCrew.Side,
        ): IAutoMovieMotionHumanPosture => {
          const sign: number = hand === "left" ? 1 : -1;
          return AquaticPosture.key(
            entry.posture,
            ExerciseKey.from(
              body,
              {
                pitch: scull ? 0 : lean,
                roll: scull ? 0 : sign * (canoe ? 6 : 3) * drive,
                spine: [
                  scull ? 0.55 * lean : 8 - 6 * drive,
                  0,
                  scull ? 0 : sign * (30 - 54 * drive),
                ],
                chest: scull ? [0.45 * lean, 0, 0] : undefined,
                neck: -lean * 0.52,
              },
              {
                hip: canoe ? 42 : 71 - (scull ? 33 : 0) * drive,
                knee: leg,
                ankle: 5,
              },
              {
                ...(hand === "left" ? pulling : opposite),
                ...(canoe
                  ? {
                      knee: staticSide === "left" ? 104 : 77,
                      hip: staticSide === "left" ? 9 : 77,
                    }
                  : {}),
              },
              {
                ...(hand === "right" ? pulling : opposite),
                ...(canoe
                  ? {
                      knee: staticSide === "right" ? 104 : 77,
                      hip: staticSide === "right" ? 9 : 77,
                    }
                  : {}),
              },
            ),
          );
        };
        const current: IAutoMovieMotionHumanPosture = makeShape(active);
        const switched: number =
          kind === "kayakStroke" ? AquaticCrew.span(u, 0.76, 1) : 0;
        const next: IAutoMovieMotionHumanPosture =
          switched > 0
            ? makeShape(active === "left" ? "right" : "left")
            : current;
        const shape: IAutoMovieMotionHumanPosture =
          switched === 0
            ? current
            : {
                ...current,
                roll: current.roll + (next.roll - current.roll) * switched,
                joints: prepareHumanShapeBlend(
                  current.joints,
                  next.joints,
                )(switched),
              };
        if (actual !== undefined) return actual.posture(shape, t);
        const slide: IAutoMovieVector3 =
          rail === undefined
            ? AquaticCrew.direction(context, hull, {
                x: canoe ? side * 0.027 * drive : 0,
                y: 0,
                z: size * 0.025 * drive,
              })
            : Vector3.scale(rail.travel, drive);
        const root: IAutoMovieVector3 = Vector3.add(
          rail?.root ?? hull.root,
          slide,
        );
        return AquaticCrew.apply(
          context,
          hull,
          t,
          shape,
          root,
          canoe && staticSide === "left" ? undefined : hull.feet.left,
          canoe && staticSide === "right" ? undefined : hull.feet.right,
          true,
        );
      },
    };
    // With a native paddle the hands hold its grips through the strokes:
    // both arms are laid as one course on the one implement, each hand from
    // the entered arm to its grip by the paddle-ready instant, held with
    // branch and swivel continuity
    // (`courseArmGoal`). The hands on the paddle are its grasp, not a
    // collision. Hands that hold the paddle from the start (no lead) begin
    // on their grips.
    if (actual === undefined) return plan;
    const start: IAutoMoviePose =
      lead > 0
        ? context.entry.pose
        : resolveHumanPosture(body, plan.posture(0));
    return courseArmGoal({
      context,
      plan,
      side: "left",
      rest: AutoMovieMotionHumanArm.angles(start, "left"),
      grasp: ["hand"],
      with: [
        {
          side: "right",
          rest: AutoMovieMotionHumanArm.angles(start, "right"),
          grasp: ["hand"],
        },
      ],
      span: { start: 0, ready: lead, relax: duration, end: duration },
    });
  }

  /*
   * Types of seated or kneeling paddle performance.
   */
  type Stroke = "doubleScull" | "canoeStroke" | "kayakStroke";

  /*
   * Keep the entered hip height on the rail and bound its rear travel by both
   * braced legs.
   */
  function scullRail(
    context: AquaticPosture.Context,
    hull: AquaticCrew.IHull,
  ): IScullRailResult {
    const { body, entry } = context;
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.standing(body),
    );
    const at: ReturnType<typeof poseBones> = poseBones(
      body,
      entry.pose,
      undefined,
      new Set(["hips"]),
    );
    const nominal: ReturnType<typeof poseBones> = AquaticPosture.markers(body, [
      "hips",
      "leftUpperLeg",
      "rightUpperLeg",
    ])(upright);
    const offset: IAutoMovieVector3 = Vector3.subtract(
      at.get("hips")!.worldPosition,
      nominal.get("hips")!.worldPosition,
    );
    const root: IAutoMovieVector3 = Vector3.add(
      hull.root,
      Quaternion.rotateVector(hull.inverse, offset),
    );
    const aft: IAutoMovieVector3 = AquaticCrew.direction(context, hull, {
      x: 0,
      y: 0,
      z: -1,
    });
    const along: IAutoMovieVector3 = Vector3.normalize({ ...aft, y: 0 });
    const { thigh, shank } = body.measure;
    const reachSquared: number = thigh ** 2 + shank ** 2 + 2 * thigh * shank;
    let distance: number = body.measure.stature * 0.18;
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = Vector3.add(
        nominal.get(`${side}UpperLeg`)!.worldPosition,
        offset,
      );
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        hull.inverse,
        Vector3.subtract(hip, hull.origin.position),
      );
      const leg: IAutoMovieVector3 = Vector3.subtract(local, hull.feet[side]);
      const projected: number = Vector3.dot(leg, along);
      const discriminant: number =
        reachSquared - Vector3.dot(leg, leg) + projected ** 2;
      if (Vector3.dot(leg, leg) > reachSquared)
        throw new HumanRefusal({
          kind: "reach",
          axis: "footRest",
          value: hull.feet[side],
          reason: `the ${side} leg cannot reach its brace while the hips ride the seat rail`,
          fix: "stage the seat and both foot braces within the sculler's seated reach",
        });
      distance = Math.min(
        distance,
        Math.max(0, Math.sqrt(discriminant) - projected),
      );
    }
    return { root, travel: Vector3.scale(along, distance) };
  }
}

/*
 * The record of `IScullRailResult`'s site.
 */
type IScullRailResult = {
  root: IAutoMovieVector3;
  travel: IAutoMovieVector3;
};

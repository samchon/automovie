import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";
import { balletPositions } from "./balletPositions";

/*
 * A pirouette from fourth. The dancer takes fourth in plié by the first beat,
 * the supporting foot in front and the working foot behind, and holds the plié
 * on both feet over the next beat; over `RISE` of a beat the supporting foot
 * rises onto its ball (`balletPositions.RELEVE`), the hips come over that ball,
 * and the working foot draws up to retiré, its toes before the supporting knee.
 * The body then turns about the supporting ball, one beat a turn, on
 * minimum-jerk progress: away from the supporting leg en dehors, toward it en
 * dedans. The working foot closes back into fourth behind as the supporting
 * heel lowers into plié, and the legs straighten over the next beat, as far as
 * both reach their feet in fourth.
 *
 * The supporting foot pivots about its ball throughout, so it does not slide;
 * the retiré foot turns with the body (Laws, Physics and the Art of Dance,
 * 2002, for the support over the ball).
 */
export namespace balletPirouette {
  /*
   * The rise to demi-pointe and the landing, a share of a beat (provisional).
   */
  export const RISE: number = 0.4;

  /*
   * The retiré's turnout, degrees: the side of the heading the knee bends
   * toward (provisional).
   */
  export const TURNOUT: number = 45;

  /*
   * The retiré's pointed foot, degrees of plantar flexion (provisional).
   */
  export const POINT: number = 45;

  /*
   * How far before the standing knee the retiré's toe rests, a share of the
   * stature (provisional).
   */
  export const TOUCH: number = 0.06;

  /*
   * The course of a pirouette.
   * Parameter context: The action's context.
   * Parameter beats: The beat clock.
   * Parameter turnout: Each foot's turn out, degrees.
   * Returns: The course.
   */
  export function course(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallet.IParams>,
    beats: IAutoMovieMotionHumanDanceBeats,
    turnout: number,
  ): IAutoMovieMotionHumanDanceCourse {
    const p: IAutoMovieMotionHumanBallet.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const working: AutoMovieHumanSide = p.side ?? "right";
    const supporting: AutoMovieHumanSide =
      working === "left" ? "right" : "left";
    const turns: number = p.turns ?? 1;
    const fourth: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = balletPositions.feet(context, 4, turnout, supporting);

    // The instants: in fourth by the first beat, risen, turned, landed, up.
    // The feet open into fourth as the plie deepens, by the first beat (the
    // working foot behind reaches the floor only on bent knees); then both
    // bear through the plie held over the beat that follows and push off it
    // together, the working foot in fourth for the whole held plie, never a
    // touch (Laws 1984, The Physics of Dance, ch. 3: the pirouette's
    // preparation from fourth).
    const set: number = beats.at(1);
    const prepared: number = set + beats.period;
    const risen: number = prepared + RISE * beats.period;
    const turned: number = risen + turns * beats.period;
    const landed: number = turned + RISE * beats.period;
    const end: number = landed + beats.period;

    // En dehors turns toward the working side: to the right, a falling yaw,
    // for a right working leg.
    const away: number = working === "right" ? -1 : 1;
    const sense: number =
      (p.direction ?? "enDehors") === "enDehors" ? away : -away;
    const yaw: (t: number) => number = (t: number): number =>
      entry.yaw +
      sense *
        360 *
        turns *
        AutoMovieEngineMotionSampling.minimumJerkShare(clamp((t - risen) / (turned - risen)));
    const lift: (t: number) => number = (t: number): number =>
      t < prepared
        ? 0
        : t < risen
          ? AutoMovieEngineMotionSampling.minimumJerkShare((t - prepared) / (risen - prepared))
          : t < turned
            ? 1
            : 1 - AutoMovieEngineMotionSampling.minimumJerkShare(clamp((t - turned) / (landed - turned)));
    const support: (t: number) => IAutoMovieMotionHumanFoot.IPlacement = (
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      balletPositions.risen(
        body,
        supporting,
        fourth[supporting],
        lift(t),
        yaw(t) - entry.yaw,
      );

    const standing: IAutoMovieVector3 = balletPositions.hips(body, entry);
    const depth: number = balletPositions.drop(body);
    const middle: IAutoMovieVector3 = Vector3.lerp(
      fourth.left.ankle,
      fourth.right.ankle,
      0.5,
    );
    const entered: IAutoMovieVector3 = Vector3.lerp(
      context.entry.feet.left.ankle,
      context.entry.feet.right.ankle,
      0.5,
    );
    const ball: IAutoMovieVector3 = HumanFoot.point(
      body,
      supporting,
      "ball",
      fourth[supporting],
    );
    const rise: number = support(risen).ankle.y - fourth[supporting].ankle.y;
    const over: IAutoMovieVector3 = {
      x: ball.x,
      y: standing.y + rise,
      z: ball.z,
    };
    const plie: (share: number) => IAutoMovieVector3 = (
      share: number,
    ): IAutoMovieVector3 => ({
      x: standing.x + (middle.x - entered.x) * share,
      y: standing.y - depth * share,
      z: standing.z + (middle.z - entered.z) * share,
    });
    // The legs straighten out of the closing plié only as far as both reach
    // their feet in fourth, which stand further apart than the entry's: each
    // hip joint over the plié's place at the end's heading stands no higher
    // over its ankle than the leg reaches at a planted knee's least flexion
    // (`lowerHumanPosture.KNEE`).
    const reach: number = Math.sqrt(
      body.measure.thigh ** 2 +
        body.measure.shank ** 2 +
        2 *
          body.measure.thigh *
          body.measure.shank *
          Math.cos((lowerHumanPosture.KNEE * Math.PI) / 180),
    );
    const top: number = Math.min(
      standing.y,
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): number => {
          const offset: IAutoMovieVector3 = HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: yaw(end) },
            Vector3.subtract(
              body.rest.get(
                side === "left" ? "leftUpperLeg" : "rightUpperLeg",
              )!,
              body.rest.get("hips")!,
            ),
          );
          const ankle: IAutoMovieVector3 = fourth[side].ankle;
          const across: number = Math.hypot(
            plie(1).x + offset.x - ankle.x,
            plie(1).z + offset.z - ankle.z,
          );
          return (
            ankle.y +
            Math.sqrt(Math.max(0, reach * reach - across * across)) -
            offset.y
          );
        },
      ),
    );
    const hips: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      if (t <= set) return plie(AutoMovieEngineMotionSampling.minimumJerkShare(t / set));
      if (t <= prepared) return plie(1);
      if (t <= risen) return Vector3.lerp(plie(1), over, lift(t));
      if (t <= turned) return over;
      if (t <= landed) return Vector3.lerp(over, plie(1), 1 - lift(t));
      const up: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        clamp((t - landed) / (end - landed)),
      );
      const low: number = standing.y - depth;
      return { ...plie(1), y: low + (Math.max(low, top) - low) * up };
    };

    // The retiré is a configuration of the working leg, not a foot pose:
    // fitted once, on the risen stance, so the pointed toe lands on a point
    // `TOUCH` of the stature before the standing knee (the knee as the rig
    // fits the risen supporting leg). The foot that configuration places is
    // the gesture's, carried with the hips through the turn, so the leg can
    // always reach it.
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const leg: AutoMovieHumanoidBone =
      working === "left" ? "leftUpperLeg" : "rightUpperLeg";
    const foot: AutoMovieHumanoidBone =
      working === "left" ? "leftFoot" : "rightFoot";
    const shin: AutoMovieHumanoidBone =
      supporting === "left" ? "leftLowerLeg" : "rightLowerLeg";
    const shaped: IAutoMovieMotionHumanFoot.IPlacement =
      ((): IAutoMovieMotionHumanFoot.IPlacement => {
        const heading: number = yaw(risen);
        const frame: IAutoMovieMotionHumanFrame = {
          origin: hips(risen),
          yaw: heading,
        };
        const root: IAutoMovieVector3 = Vector3.subtract(
          frame.origin,
          HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
            rest,
          ),
        );
        const pointed: IAutoMovieMotionHumanPosture = {
          ...entry,
          root,
          yaw: heading,
          limbs: {},
          joints: { ...entry.joints, [foot]: [-POINT, 0, 0] },
        };
        // The supporting knee as the rig fits the risen supporting leg, bent
        // over its foot as the leg row bends it (`AutoMovieMotionHumanBend.knee`
        // at the foot's own heading), so the point before it is before the
        // knee shown.
        const risenFoot: IAutoMovieMotionHumanFoot.IPlacement = support(risen);
        const knee: IAutoMovieVector3 = poseBones(
          body,
          resolveHumanPosture(body, {
            ...pointed,
            limbs: {
              [`${supporting}Leg`]: {
                point: risenFoot.ankle,
                rotation: risenFoot.rotation,
                bend: AutoMovieMotionHumanBend.knee(
                  body,
                  pointed,
                  supporting,
                  HumanFoot.heading(risenFoot.rotation),
                ),
              },
            },
          }),
          undefined,
          new Set<AutoMovieHumanoidBone>([shin]),
        ).get(shin)!.worldPosition;
        const target: IAutoMovieVector3 = HumanFrame.point(
          { origin: knee, yaw: heading },
          { x: 0, y: 0, z: TOUCH * body.measure.stature },
        );
        // The working leg is the rig's own analytic two-bone fit of an ankle
        // goal, the knee bent toward the turned-out side (`TURNOUT` from the
        // heading) and the foot pointed by `POINT`, so the pointed toe lands
        // on the point before the knee, not on the nearest of a grid of
        // configurations.
        const hip: IAutoMovieVector3 = poseBones(
          body,
          resolveHumanPosture(body, pointed),
          undefined,
          new Set<AutoMovieHumanoidBone>([leg]),
        ).get(leg)!.worldPosition;
        const pole: IAutoMovieVector3 = Vector3.addScaled(
          hip,
          HumanFrame.forward(
            heading + (working === "right" ? -TURNOUT : TURNOUT),
          ),
          body.measure.thigh,
        );
        const fitted = (
          goal: IAutoMovieHumanLimbGoal,
        ): IAutoMovieMotionHumanFoot.IPlacement => {
          const posed: IAutoMovieResolvedBone = poseBones(
            body,
            resolveHumanPosture(body, {
              ...pointed,
              limbs: { [`${working}Leg`]: goal },
            }),
            undefined,
            new Set<AutoMovieHumanoidBone>([foot]),
          ).get(foot)!;
          return { ankle: posed.worldPosition, rotation: posed.worldRotation };
        };
        // The pointed foot as the fit turns it with the ankle on the point,
        // then the ankle moved by that foot's toe offset with the foot's turn
        // held, so the toe itself lands on the point.
        const first: IAutoMovieMotionHumanFoot.IPlacement = fitted({
          point: target,
          bend: pole,
        });
        const best: IAutoMovieMotionHumanFoot.IPlacement = fitted({
          point: Vector3.subtract(
            target,
            Vector3.subtract(
              HumanFoot.point(body, working, "toe", first),
              first.ankle,
            ),
          ),
          rotation: first.rotation,
          // Where the ankle's range keeps the turn from being met, the foot
          // turns about its toe, which stays on the point.
          contact: HumanFoot.offset(body, working, "toe"),
          bend: pole,
        }); // Held in the hips' frame on the risen stance.
        return {
          ankle: HumanFrame.local(frame, best.ankle),
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -heading),
            best.rotation,
          ),
        };
      })();
    const retire: (t: number) => IAutoMovieMotionHumanFoot.IPlacement = (
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: HumanFrame.point({ origin: hips(t), yaw: yaw(t) }, shaped.ankle),
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw(t)),
        shaped.rotation,
      ),
    });
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 60, raise: 15, elbow: 50 },
    ).joints;
    const clearance: number = 0.03 * body.measure.stature;
    const stood: (
      side: AutoMovieHumanSide,
      leave: number,
    ) => IAutoMovieMotionHumanDanceFootKey = (
      side: AutoMovieHumanSide,
      leave: number,
    ): IAutoMovieMotionHumanDanceFootKey => ({
      at: 0,
      leave,
      place: {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    });
    const course: IAutoMovieMotionHumanDanceCourse = {
      duration: end,
      left: [],
      right: [],
      hips,
      yaw,
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      instants: [
        { name: "prepare", seconds: prepared },
        { name: "turn", seconds: risen },
        { name: "land", seconds: turned },
        { name: "relax", seconds: landed },
      ],
    };
    course[supporting] = [
      stood(supporting, 0.05 * set),
      {
        at: 0.45 * set,
        leave: end,
        place: fourth[supporting],
        bears: true,
        clearance,
        hold: support,
      },
    ];
    course[working] = [
      stood(working, 0.55 * set),
      {
        at: 0.95 * set,
        leave: prepared,
        place: fourth[working],
        bears: true,
        clearance,
      },
      {
        at: risen,
        leave: turned,
        place: retire(risen),
        bears: false,
        clearance,
        hold: retire,
      },
      {
        at: landed,
        leave: end,
        place: fourth[working],
        bears: true,
        clearance,
      },
    ];
    return course;
  }

  /*
   * A share held within [0, 1].
   */
  function clamp(share: number): number {
    return Math.max(0, Math.min(1, share));
  }
}

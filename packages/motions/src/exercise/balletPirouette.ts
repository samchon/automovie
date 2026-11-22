import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
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

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";
import { balletPositions } from "./balletPositions";

/**
 * A pirouette from fourth (#3991). The dancer takes fourth in plié by the
 * first beat, the supporting foot in front and the working foot behind;
 * over `RISE` of a beat the supporting foot rises onto its ball
 * (`balletPositions.RELEVE`), the hips come over that ball, and the working
 * foot draws up to retiré, its toes before the supporting knee. The body
 * then turns about the supporting ball, one beat a turn, on minimum-jerk
 * progress: away from the supporting leg en dehors, toward it en dedans.
 * The working foot closes back into fourth behind as the supporting heel
 * lowers into plié, and the legs straighten over the next beat.
 *
 * The supporting foot pivots about its ball throughout, so it does not
 * slide; the retiré foot turns with the body (Laws, Physics and the Art of
 * Dance, 2002, for the support over the ball).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the turn's direction and timing, and the support with its source.
 * @evidence contracts/development/design.md#principled-representation A course of foot keys and a hips path over the beat clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rise share, the retiré's pitch and the course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Lengths are the body's; the turn is the authored count.
 */
export namespace balletPirouette {
  /** The rise to demi-pointe and the landing, a share of a beat (provisional). */
  export const RISE: number = 0.4;

  /** The hip abductions searched for the retiré, degrees, within the hip's range. */
  export const ABDUCTION: readonly number[] = [0, 40];

  /** The retiré's hip turnout (external rotation), degrees, within its range (provisional). */
  export const TURNOUT: number = 45;

  /** The hip flexions searched for the retiré, degrees. */
  export const FLEXION: readonly number[] = [20, 90];

  /** The knee flexions searched for the retiré, degrees. */
  export const KNEE: readonly number[] = [60, 150];

  /** The search's step, degrees. */
  export const STEP: number = 10;

  /** The retiré's pointed foot, degrees of plantar flexion (provisional). */
  export const POINT: number = 45;

  /** How far before the standing knee the retiré's toe rests, a share of the stature (provisional). */
  export const TOUCH: number = 0.06;

  /**
   * The course of a pirouette.
   *
   * @param context The action's context.
   * @param beats The beat clock.
   * @param turnout Each foot's turn out, degrees.
   * @returns The course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the course.
   * @evidence contracts/development/implementation.md#principled-implementation Fourth's placements, the supporting foot held about its ball through a rise and a turn, the retiré placed at the supporting knee, the hips blended between the plié over the feet and the stance over the ball.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Instants, turn, supporting hold, working keys, hips.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The supporting ball is fixed by construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The positions' placements, rise and plié.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The course retains its placements.
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
    const prepared: number = beats.at(1);
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
        minimumJerk.share(clamp((t - risen) / (turned - risen)));
    const lift: (t: number) => number = (t: number): number =>
      t < prepared
        ? 0
        : t < risen
          ? minimumJerk.share((t - prepared) / (risen - prepared))
          : t < turned
            ? 1
            : 1 - minimumJerk.share(clamp((t - turned) / (landed - turned)));
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
    const hips: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => {
      if (t <= prepared) return plie(minimumJerk.share(t / prepared));
      if (t <= risen) return Vector3.lerp(plie(1), over, lift(t));
      if (t <= turned) return over;
      if (t <= landed) return Vector3.lerp(over, plie(1), 1 - lift(t));
      const up: number = minimumJerk.share(
        clamp((t - landed) / (end - landed)),
      );
      return { ...plie(1), y: standing.y - depth * (1 - up) };
    };

    // The retiré is a configuration of the working leg, not a foot pose:
    // the hip turned out within its range, its flexion, abduction and the
    // knee's chosen once, on the risen stance, so the pointed toe comes
    // nearest a point `TOUCH` of the stature before the standing knee
    // (placed in closed form between the supporting hip joint and ankle,
    // bent along the heading). The foot that configuration places is the
    // gesture's, carried with the hips through the turn, so the leg can
    // always reach it.
    const upper: IAutoMovieVector3 = body.rest.get(
      supporting === "left" ? "leftUpperLeg" : "rightUpperLeg",
    )!;
    const rest: IAutoMovieVector3 = body.rest.get("hips")!;
    const leg: AutoMovieHumanoidBone =
      working === "left" ? "leftUpperLeg" : "rightUpperLeg";
    const shin: AutoMovieHumanoidBone =
      working === "left" ? "leftLowerLeg" : "rightLowerLeg";
    const foot: AutoMovieHumanoidBone =
      working === "left" ? "leftFoot" : "rightFoot";
    const shaped: IAutoMovieMotionHumanFoot.IPlacement =
      ((): IAutoMovieMotionHumanFoot.IPlacement => {
        const heading: number = yaw(risen);
        const frame: IAutoMovieMotionHumanFrame = {
          origin: hips(risen),
          yaw: heading,
        };
        const knee: IAutoMovieVector3 = kneeBetween(
          HumanFrame.point(frame, upper),
          support(risen).ankle,
          body.measure.thigh,
          body.measure.shank,
          HumanFrame.forward(heading),
        );
        const target: IAutoMovieVector3 = HumanFrame.point(
          { origin: knee, yaw: heading },
          { x: 0, y: 0, z: TOUCH * body.measure.stature },
        );
        const root: IAutoMovieVector3 = Vector3.subtract(
          frame.origin,
          HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
            rest,
          ),
        );
        let best: IAutoMovieMotionHumanFoot.IPlacement | undefined;
        let nearest: number = Infinity;
        for (
          let flexion: number = FLEXION[0]!;
          flexion <= FLEXION[1]!;
          flexion += STEP
        )
          for (let bend: number = KNEE[0]!; bend <= KNEE[1]!; bend += STEP)
            for (
              let abduction: number = ABDUCTION[0]!;
              abduction <= ABDUCTION[1]!;
              abduction += STEP
            ) {
              const posed: IAutoMovieResolvedBone = poseBones(
                body,
                resolveHumanPosture(body, {
                  ...entry,
                  root,
                  yaw: heading,
                  limbs: {},
                  joints: {
                    ...entry.joints,
                    [leg]: [flexion, abduction, TURNOUT],
                    [shin]: [bend, 0, 0],
                    [foot]: [-POINT, 0, 0],
                  },
                }),
                undefined,
                new Set<AutoMovieHumanoidBone>([foot]),
              ).get(foot)!;
              const placed: IAutoMovieMotionHumanFoot.IPlacement = {
                ankle: posed.worldPosition,
                rotation: posed.worldRotation,
              };
              const off: number = Vector3.distance(
                HumanFoot.point(body, working, "toe", placed),
                target,
              );
              if (off < nearest) {
                nearest = off;
                best = placed;
              }
            }
        // Held in the hips' frame on the risen stance.
        return {
          ankle: HumanFrame.local(frame, best!.ankle),
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -heading),
            best!.rotation,
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
      stood(supporting, 0.05 * prepared),
      {
        at: 0.45 * prepared,
        leave: end,
        place: fourth[supporting],
        bears: true,
        clearance,
        hold: support,
      },
    ];
    course[working] = [
      stood(working, 0.55 * prepared),
      {
        at: 0.95 * prepared,
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

  /** A share held within [0, 1]. */
  function clamp(share: number): number {
    return Math.max(0, Math.min(1, share));
  }

  /** The knee where a thigh and a shank meet between a hip joint and an ankle, bent toward a pole direction (the law of cosines in their plane). */
  function kneeBetween(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    thigh: number,
    shank: number,
    pole: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const up: IAutoMovieVector3 = Vector3.subtract(hip, ankle);
    const d: number = Math.min(thigh + shank - 1e-6, Vector3.length(up));
    const u: IAutoMovieVector3 = Vector3.normalize(up);
    const across: IAutoMovieVector3 = Vector3.subtract(
      pole,
      Vector3.scale(u, Vector3.dot(pole, u)),
    );
    const w: IAutoMovieVector3 =
      Vector3.length(across) > 1e-9 ? Vector3.normalize(across) : pole;
    const cosine: number = Math.max(
      -1,
      Math.min(1, (shank * shank + d * d - thigh * thigh) / (2 * shank * d)),
    );
    return Vector3.add(
      ankle,
      Vector3.add(
        Vector3.scale(u, shank * cosine),
        Vector3.scale(w, shank * Math.sqrt(1 - cosine * cosine)),
      ),
    );
  }
}

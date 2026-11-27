import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBaseball,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanVerdicts } from "../../audit/AutoMovieMotionHumanVerdicts";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanPlaced } from "../../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { exercise } from "../../exercise/internal/exercise";
import { HumanBoneGroups } from "../../posture/HumanBoneGroups";
import { AutoMovieMotionHumanBaseball as baseball } from "../AutoMovieMotionHumanBaseball";

/**
 * A fielder's ground ball: the crouch to the ball and both hands placed, the
 * gloved left on the floor ahead of the shoulders open forward and up with the
 * fingers down, the right over it.
 *
 * Part of `baseball.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `groundBall`.
 */
export function baseballGroundBall(
  prepared: baseballGroundBall.IPrepared,
): () => IAutoMovieMotionHumanPrimitive[] {
  const {
    local,
    entry,
    arm,
    body,
    m,
    modifiers,
    context,
    crouch,
    placed,
  }: baseballGroundBall.IPrepared = prepared;
  return (): IAutoMovieMotionHumanPrimitive[] => {
    // The glove on the floor ahead of the shoulders, open forward and up with the fingers down.
    const front: IAutoMovieVector3 = local(entry, { x: 0, y: 0, z: 1 });
    const facing: IAutoMovieVector3 = Vector3.normalize({ ...front, y: 1 });
    const fingers: IAutoMovieVector3 = Vector3.normalize({
      ...front,
      y: -1,
    });
    const ahead: IAutoMovieVector3 = Vector3.scale(front, baseball.AHEAD * arm);
    const glovePoint: (
      posture: IAutoMovieMotionHumanPosture,
      up: number,
      resolution?: baseballGroundBall.IFK,
    ) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
      up: number,
      resolution?: baseballGroundBall.IFK,
    ): IAutoMovieVector3 =>
      Vector3.add(
        {
          ...AutoMovieMotionHumanPlaced.shoulders(body, posture, resolution),
          y: up * arm,
        },
        ahead,
      );
    const glove: (
      posture: IAutoMovieMotionHumanPosture,
      up: number,
      resolution?: baseballGroundBall.IFK,
    ) => IAutoMovieMotionHumanPlaced.IWristPlace = (
      posture: IAutoMovieMotionHumanPosture,
      up: number,
      resolution?: baseballGroundBall.IFK,
    ): IAutoMovieMotionHumanPlaced.IWristPlace => ({
      point: glovePoint(posture, up, resolution),
      facing,
      forward: fingers,
    });
    // The glove's palm stands on its fingertips, which point 45 degrees down.
    const low: number = (Math.SQRT1_2 * m.hand) / 2 / arm;
    // The hips fall to the squat's depth. Find the trunk's remaining
    // inclination in the same planted geometry the display will use.
    const depth: number = exercise.drop(m, "parallel");
    const plants: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted> =
      AutoMovieMotionHumanTrunk.preparePlanted(
        body,
        AutoMovieMotionHumanTrunk.footing(body, entry),
      );
    const planted: IAutoMovieMotionHumanPosture = plants(entry);
    const read: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(body, HumanBoneGroups.SHOULDERS);
    const wristFromPalm: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.wrist(
      body,
      "left",
      {
        point: { x: 0, y: low * arm, z: 0 },
        facing,
        forward: fingers,
      },
    );
    const outside: (pitch: number) => boolean = (pitch: number): boolean => {
      const bones: ReturnType<typeof read> = read(
        AutoMovieMotionHumanTrunk.sunk(
          body,
          planted,
          depth * modifiers.extent,
          pitch,
          0,
        ),
      );
      const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
      const mid: IAutoMovieVector3 = Vector3.lerp(
        left,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      );
      const wrist: IAutoMovieVector3 = Vector3.add(
        { ...mid, y: 0 },
        Vector3.add(wristFromPalm, ahead),
      );
      const span: number =
        (baseball.REACH * arm) ** 2 -
        (left.x - wrist.x) ** 2 -
        (left.z - wrist.z) ** 2;
      return span < 0 || left.y - wrist.y > Math.sqrt(span);
    };
    // Bound a pitch bracket by the contact skin over the upper body's
    // measured reach from the hips, and keep the reachable bracket end.
    const tolerance: number =
      (180 * AutoMovieMotionHumanVerdicts.SKIN) / (Math.PI * (m.shoulderHeight - m.hipHeight));
    const inclination: number = !outside(0)
      ? 0
      : outside(baseball.INCLINED)
        ? baseball.INCLINED
        : AutoMovieEngineMath.bracketedBisection(outside, 0, baseball.INCLINED, tolerance);
    const together: IAutoMovieMotionHumanArmPlanned.ITogether =
      AutoMovieMotionHumanArmPlanned.together(
        context.handover,
        true,
        context.tempo,
      );
    return [
      crouch(depth, inclination),
      ...placed(
        "left",
        (
          posture: IAutoMovieMotionHumanPosture,
          _seconds: number,
          resolution?: baseballGroundBall.IFK,
        ): ReturnType<typeof glove> => glove(posture, low, resolution),
        "flat",
        "forward",
        together,
      ),
      ...placed(
        "right",
        (
          posture: IAutoMovieMotionHumanPosture,
          _seconds: number,
          resolution?: baseballGroundBall.IFK,
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
          point: glovePoint(posture, low + 0.2, resolution),
          facing: { x: 0, y: -1, z: 0 },
        }),
        "flat",
        "forward",
        together,
      ),
    ];
  };
}

/** The `groundBall` of `baseball.plan`, built from what that plan prepared. */
export namespace baseballGroundBall {
  /**
   * Optional same-person exact FK source used only during an actual current
   * place observation.
   */
  export type IFK = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

  /** What `baseball.plan` prepared for its `groundBall`. */
  export interface IPrepared {
    /** The `local` `baseball.plan` prepared. */
    local: (
      posture: IAutoMovieMotionHumanPosture,
      v: IAutoMovieVector3,
    ) => IAutoMovieVector3;

    /** The `entry` `baseball.plan` prepared. */
    entry: IAutoMovieMotionHumanPosture;

    /** The `arm` `baseball.plan` prepared. */
    arm: number;

    /** The `body` `baseball.plan` prepared. */
    body: IAutoMovieMotionHumanActionContext["body"];

    /** The `m` `baseball.plan` prepared. */
    m: IAutoMovieMotionHumanActionContext["body"]["measure"];

    /** The `modifiers` `baseball.plan` prepared. */
    modifiers: IAutoMovieMotionManner.IModifiers;

    /** The `context` `baseball.plan` prepared. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBaseball.IParams>;

    /** The `crouch` `baseball.plan` prepared. */
    crouch: (
      depth: number,
      pitch: number,
      legs?: readonly AutoMovieHumanSide[],
    ) => IAutoMovieMotionHumanPrimitive;

    /** The `placed` `baseball.plan` prepared. */
    placed: (
      side: AutoMovieHumanSide,
      place: IAutoMovieMotionHumanPlaced.IArm["place"],
      shape: IAutoMovieMotionHumanHand.Shape,
      bend: IAutoMovieMotionHumanPlaced.IArm["bend"],
      together?: IAutoMovieMotionHumanArmPlanned.ITogether,
    ) => IAutoMovieMotionHumanPrimitive[];
  }
}

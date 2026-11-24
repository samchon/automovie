import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanWorkoutKind,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingBody } from "../striking/StrikingBody";
import { ExerciseKey } from "./ExerciseKey";

/**
 * Build the placed arms that lay the palms.
 *
 * @param props What the laid hands are built from.
 * @returns The placed arm primitives, both arms.
 */
export function workoutLaidHands(
  props: workoutLaidHands.IProps,
): IAutoMovieMotionHumanPrimitive[] {
  const context: IAutoMovieMotionHumanActionContext = props.context;
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const duration: number = props.clock.duration;
  const primitives: IAutoMovieMotionHumanPrimitive[] = [];

  // The palms are laid under where the first posture has the hands.
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: props.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const handBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftHand",
    "rightHand",
  ]);
  const hands: ReturnType<typeof StrikingBody.trunk> = props.held
    ? poseBones(body, context.entry.pose, undefined, handBones)
    : StrikingBody.trunk(
        body,
        ExerciseKey.pinned(
          body,
          props.first,
          props.yaw,
          props.kind.pin,
          props.at,
          props.pins,
          read,
          project,
        ),
        read,
        handBones,
        project,
      );
  const restored: IAutoMoviePose | undefined = props.restored;
  for (const side of ["left", "right"] as const) {
    const wrist: IAutoMovieVector3 = ExerciseKey.at(body, hands, `${side}Hand`);
    const laid: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.wrist(
      body,
      side,
      {
        point: { x: 0, y: 0, z: 0 },
        facing: { x: 0, y: -1, z: 0 },
        forward,
      },
    );
    const point: IAutoMovieVector3 = {
      x: wrist.x - laid.x,
      y: 0,
      z: wrist.z - laid.z,
    };
    const arm: (from: number, to: number, rest: IAutoMoviePose) => void = (
      from: number,
      to: number,
      rest: IAutoMoviePose,
    ): void => {
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from,
          to,
          rest: AutoMovieMotionHumanArm.angles(rest, side),
          weight: props.present,
          place: (): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => ({
            point,
            facing: { x: 0, y: -1, z: 0 },
            forward,
          }),
        }),
      );
    };
    const release: number =
      restored === undefined ? duration : props.clock.at("release");
    arm(0, release, context.entry.pose);
    if (restored !== undefined) arm(release, duration, restored);
  }
  return primitives;
}

/**
 * A workout's hands laid on the floor: each palm flat under where the first
 * pinned posture (or, for a held floor stance, the entry) has the hand, held
 * there by the placed arm while the exercise is present (`workout`).
 */
export namespace workoutLaidHands {
  /** What the laid hands are built from. */
  export interface IProps {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext;

    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkoutKind;

    /** The first key. */
    first: IAutoMovieMotionHumanExerciseKey.IKey;

    /** The heading, degrees about +Y. */
    yaw: number;

    /** Where the bearing bones stay, world metres. */
    at: IAutoMovieVector3;

    /** The bones the pin holds. */
    pins: ReadonlySet<AutoMovieHumanoidBone>;

    /** Whether the hands are already laid by a held floor stance at the entry. */
    held: boolean;

    /** The pose the body rises to, when it rises back to a recovered stance. */
    restored: IAutoMoviePose | undefined;

    /** How present the exercise is at a second, in [0, 1]. */
    present: (seconds: number) => number;

    /** The action's clock. */
    clock: IAutoMovieMotionClock;
  }
}

import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWorkoutKind,
  IAutoMovieMotionHumanWorkoutPlace,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsWheel } from "../sport/GymnasticsWheel";
import { ExerciseKey } from "./ExerciseKey";

/** The alternatives of `OfContext`'s site. */
type OfContext = "body" | "entry";

/**
 * Where a workout's bearing bones stay: the one place the kind's pin keeps
 * while the body works, decided once per plan from how the kind is anchored.
 *
 * - `stance`: where the entry shows those bones, so a foot stays where it stands
 *   and not where the keys' own joints would stand it.
 * - `hips`: where they are when the first posture rests with the pelvis over its
 *   place. Feet or toes that bear on the floor are as high above it as when the
 *   body stands on them, and hands as high as a laid palm's wrist; a body that
 *   bears on its trunk is rested by its shapes; a body on a raised support has
 *   its hip joints as high above it as above the floor when it lies flat.
 * - `bar`: the prop's with the joints' own height above it, or, with none, the
 *   places a support exercise's bars stand at (`WorkoutKind.bars`) beside the
 *   place stood on, or the floor rule for a kind done on equipment (an imagined
 *   support). A hanging kind hangs from the bar it names and is refused without
 *   one; hands that grip a bar are pinned by their grip sockets, so the bar
 *   lies in the fists.
 */
export namespace WorkoutPlace {
  /** The hip joints, by which a body on a raised support is placed. */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];

  /**
   * The place the bearing bones keep.
   *
   * @param props The action's context, the kind, the standing posture the
   *   exercise is entered from, the first key, and the prop's place when one
   *   bears the body.
   * @param keepFloorPins Whether the exercise is carrying forward its bearing
   *   pins from a held floor stance.
   * @returns World metres.
   * @throws {HumanRefusal} When a hanging kind names no bar to hang from.
   */
  export function of(
    props: IAutoMovieMotionHumanWorkoutPlace.IOfProps,
    keepFloorPins: boolean = false,
  ): IAutoMovieVector3 {
    const context: Pick<IAutoMovieMotionHumanActionContext, OfContext> =
      props.context;
    const unhung = (): never => {
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: null,
        reason: "a hanging exercise hangs from a bar, and it names none",
        fix: 'name the bar it hangs from in on, { prop, affordance: "bar" }, as createPullUpBar declares it',
      });
    };
    const body: IAutoMovieMotionHumanBody = context.body;
    const kind: IAutoMovieMotionHumanWorkoutKind = props.kind;
    const standing: IAutoMovieMotionHumanPosture = props.standing;
    const borne: IAutoMovieVector3 | null = props.borne;
    const yaw: number = standing.yaw;
    const based: IAutoMovieMotionHumanPosture = ExerciseKey.posed(
      props.first,
      yaw,
    );
    const pelvis = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        humanPostureHeading(posture),
        body.rest.get("hips")!,
      );
    const stood: IAutoMovieVector3 = Vector3.add(
      standing.root,
      pelvis(standing),
    );
    const hips: IAutoMovieVector3 =
      borne === null ? stood : { x: borne.x, y: stood.y, z: borne.z };
    // Where the entry shows the bearing bones: a stance is kept there, not
    // where the keys' own joints would stand it.
    const pins: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      kind.pin.map(
        (pin: IAutoMovieMotionHumanExerciseKey.Pin): AutoMovieHumanoidBone =>
          pin === "gripLeft" || pin === "gripRight"
            ? body.surfaces.sockets[pin].bone
            : pin,
      ),
    );
    const shown = (): IAutoMovieVector3 => {
      const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, context.entry.pose, undefined, pins);
      return Vector3.scale(
        kind.pin.reduce(
          (
            sum: IAutoMovieVector3,
            pin: IAutoMovieMotionHumanExerciseKey.Pin,
          ): IAutoMovieVector3 =>
            Vector3.add(sum, ExerciseKey.at(body, entered, pin)),
          { x: 0, y: 0, z: 0 },
        ),
        1 / kind.pin.length,
      );
    };
    if (kind.anchor === "stance" || keepFloorPins) return shown();
    // Feet or toes that bear on the floor on their soles are as high above
    // it as when the body stands on them, and hands as high as a laid palm's
    // wrist; a body that bears on its trunk, or on the sides of its feet as
    // a side plank does, is rested by its shapes.
    const grounded = (): number | null => {
      if (kind.anchor !== "hips" || kind.raise !== undefined || borne !== null)
        return null;
      const keyed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, based), undefined, pins);
      const soles: boolean = kind.pin.every(
        (bone: IAutoMovieMotionHumanExerciseKey.Pin): boolean =>
          bone !== "gripLeft" &&
          bone !== "gripRight" &&
          /(Foot|Toes)$/.test(bone) &&
          Quaternion.rotateVector(keyed.get(bone)!.worldRotation, {
            x: 0,
            y: 1,
            z: 0,
          }).y > Math.SQRT1_2,
      );
      return soles
        ? shown().y
        : kind.pin.every(
              (bone: IAutoMovieMotionHumanExerciseKey.Pin): boolean =>
                bone.endsWith("Hand"),
            )
          ? GymnasticsWheel.laid(body)
          : null;
    };

    // A body on a raised support (a bench, a seat, a saddle) has its hip
    // joints as high above it as they are above the floor when it lies
    // flat: resting the key's own shapes on the floor first would count
    // the legs that hang beside a bench and float the body by their length
    // (0.51 m on the first run of the supported test).
    const raised: number | null = borne?.y ?? kind.raise?.(body) ?? null;
    const lain = (): number => {
      const flat: IAutoMovieMotionHumanPosture = ExerciseKey.posed(
        ExerciseKey.from(body, { pitch: -90 }, {}),
        yaw,
      );
      return knockdown.rest(body, flat) + ExerciseKey.mean(body, flat, HIPS).y;
    };

    // Where the bearing bones are when the first posture rests on the
    // floor, or on its raised support, with the pelvis over its place.
    const floored = (): IAutoMovieVector3 =>
      ExerciseKey.mean(
        body,
        {
          ...based,
          root: {
            x: hips.x - pelvis(based).x,
            y:
              raised === null
                ? knockdown.rest(body, based)
                : raised + lain() - ExerciseKey.mean(body, based, HIPS).y,
            z: hips.z - pelvis(based).z,
          },
        },
        kind.pin,
      );

    // A bar's place: the prop's with the joints' own height above it, the
    // places a support exercise's bars stand at beside the place stood on,
    // or an imagined support under a kind done on equipment (the body
    // rested on the floor); a hanging kind hangs only from a bar it names.
    const barred = (height: number): IAutoMovieVector3 => {
      const beside: IAutoMovieVector3 = ExerciseKey.mean(
        body,
        {
          ...based,
          root: {
            x: hips.x - pelvis(based).x,
            y: 0,
            z: hips.z - pelvis(based).z,
          },
        },
        kind.pin,
      );
      return { x: beside.x, y: height + (kind.rise?.(body) ?? 0), z: beside.z };
    };
    const rested: IAutoMovieVector3 =
      kind.anchor === "hips"
        ? floored()
        : borne !== null
          ? { ...borne, y: borne.y + (kind.rise?.(body) ?? 0) }
          : kind.bars !== undefined
            ? barred(kind.bars(body))
            : kind.rise !== undefined
              ? floored()
              : unhung();
    const floor: number | null = grounded();
    return floor === null ? rested : { ...rested, y: floor };
  }
}

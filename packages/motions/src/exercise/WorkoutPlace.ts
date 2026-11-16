import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsWheel } from "../sport/GymnasticsWheel";
import { ExerciseKey } from "./ExerciseKey";
import type { WorkoutKind } from "./WorkoutKind";

/**
 * Where a workout's bearing bones stay: the one place the kind's pin keeps
 * while the body works, decided once per plan from how the kind is
 * anchored.
 *
 * - `stance`: where the entry shows those bones, so a foot stays where it
 *   stands and not where the keys' own joints would stand it.
 * - `hips`: where they are when the first posture rests with the pelvis
 *   over its place. Feet or toes that bear on the floor are as high above
 *   it as when the body stands on them, and hands as high as a laid palm's
 *   wrist; a body that bears on its trunk is rested by its shapes; a body
 *   on a raised support has its hip joints as high above it as above the
 *   floor when it lies flat.
 * - `bar`: the prop's with the joints' own height above it, or, with none,
 *   the places a support exercise's bars stand at (`WorkoutKind.bars`)
 *   beside the place stood on, or the floor rule for a kind done on
 *   equipment (an imagined support). A hanging kind hangs from the bar it
 *   names and is refused without one;
 *   hands that grip a bar are pinned by their grip sockets, so the bar lies
 *   in the fists.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is decided, when, and each anchor's rule.
 * @evidence contracts/development/design.md#principled-representation One world point per plan, from which every posture's root follows by the pin, so the support cannot drift between postures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the workout law calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Heights are the entry's own joints', the prop's, the body's shapes' or the body's own for a support exercise's bars; no bar is imagined to hang from.
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
   * @param props The action's context, the kind, the standing posture the exercise is entered from, the first key, and the prop's place when one bears the body.
   * @returns World metres.
   * @throws {HumanRefusal} When a hanging kind names no bar to hang from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each anchor's rule as stated on the namespace, each read from forward kinematics of the first key or from the entry's displayed bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry's bones, the floor rule, then one choice by anchor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A raised body is never rested by its hanging legs; the measured faults each rule answers are noted where the rule is written.
   * @evidence contracts/development/implementation.md#efficient-algorithms Standing anchors return from the entry's requested pin bones; other anchors measure soles only when they choose a floor datum, and compute lying-shape clearance only for a raised floor placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exercise keys' pose and mean and the knockdown's floor rest; branch-local measurements are made once only when that branch consumes them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(props: {
    context: Pick<IHumanActionContext, "body" | "entry">;
    kind: WorkoutKind;
    standing: IHumanPosture;
    first: ExerciseKey.IKey;
    borne: IAutoMovieVector3 | null;
  }): IAutoMovieVector3 {
    const context: Pick<IHumanActionContext, "body" | "entry"> = props.context;
    const unhung = (): never => {
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: null,
        reason: "a hanging exercise hangs from a bar, and it names none",
        fix: 'name the bar it hangs from in on, { prop, affordance: "bar" }, as createPullUpBar declares it',
      });
    };
    const body: IHumanBody = context.body;
    const kind: WorkoutKind = props.kind;
    const standing: IHumanPosture = props.standing;
    const borne: IAutoMovieVector3 | null = props.borne;
    const yaw: number = standing.yaw;
    const based: IHumanPosture = ExerciseKey.posed(props.first, yaw);
    const pelvis = (posture: IHumanPosture): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
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
    const pins: ReadonlySet<AutoMovieHumanoidBone> = new Set(kind.pin.map((pin: ExerciseKey.Pin): AutoMovieHumanoidBone => pin === "gripLeft" || pin === "gripRight" ? body.surfaces.sockets[pin].bone : pin));
    const shown = (): IAutoMovieVector3 => {
      const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, context.entry.pose, undefined, pins);
      return Vector3.scale(kind.pin.reduce((sum: IAutoMovieVector3, pin: ExerciseKey.Pin): IAutoMovieVector3 => Vector3.add(sum, ExerciseKey.at(body, entered, pin)), { x: 0, y: 0, z: 0 }), 1 / kind.pin.length);
    };
    if (kind.anchor === "stance") return shown();
    // Feet or toes that bear on the floor on their soles are as high above
    // it as when the body stands on them, and hands as high as a laid palm's
    // wrist; a body that bears on its trunk, or on the sides of its feet as
    // a side plank does, is rested by its shapes.
    const grounded = (): number | null => {
      if (kind.anchor !== "hips" || kind.raise !== undefined || borne !== null) return null;
      const keyed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, resolveHumanPosture(body, based), undefined, pins);
      const soles: boolean = kind.pin.every(
      (bone: ExerciseKey.Pin): boolean =>
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
          : kind.pin.every((bone: ExerciseKey.Pin): boolean =>
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
      const flat: IHumanPosture = ExerciseKey.posed(ExerciseKey.from(body, { pitch: -90 }, {}), yaw);
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

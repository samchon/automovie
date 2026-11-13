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
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
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
 * - `bar`: the author's place, or the prop's with the joints' own height
 *   above it, or, with neither, the floor rule for a kind done on equipment
 *   (an imagined support) and a bar above the standing reach for a hanging
 *   one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is decided, when, and each anchor's rule.
 * @evidence contracts/development/design.md#principled-representation One world point per plan, from which every posture's root follows by the pin, so the support cannot drift between postures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the workout law calls and the bar's default height.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Heights are the entry's own joints', the prop's or the body's shapes'; the one share stated is the bar's.
 */
export namespace WorkoutPlace {
  /** The hip joints, by which a body on a raised support is placed. */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];

  /** How far above the standing body's overhead grip a bar is when the author places none, a share of the stature (provisional): the feet clear the floor. */
  export const BAR: number = 0.08;

  /**
   * The place the bearing bones keep.
   *
   * @param props The action's context, the kind, the standing posture the exercise is entered from, the first key, the prop's place when one bears the body, and the author's bar.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each anchor's rule as stated on the namespace, each read from forward kinematics of the first key or from the entry's displayed bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry's bones, the floor rule, then one choice by anchor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A raised body is never rested by its hanging legs; the measured faults each rule answers are noted where the rule is written.
   * @evidence contracts/development/implementation.md#efficient-algorithms A handful of forward kinematics, once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the exercise keys' pose and mean and the knockdown's floor rest.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(props: {
    context: Pick<IHumanActionContext, "body" | "entry">;
    kind: WorkoutKind;
    standing: IHumanPosture;
    first: ExerciseKey.IKey;
    borne: IAutoMovieVector3 | null;
    bar: IAutoMovieVector3 | undefined;
  }): IAutoMovieVector3 {
    const context: Pick<IHumanActionContext, "body" | "entry"> = props.context;
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
  const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, context.entry.pose);
  const shown: IAutoMovieVector3 = Vector3.scale(
    kind.pin.reduce(
      (sum: IAutoMovieVector3, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        Vector3.add(sum, entered.get(bone)!.worldPosition),
      { x: 0, y: 0, z: 0 },
    ),
    1 / kind.pin.length,
  );
  // Feet or toes that bear on the floor are as high above it as when the
  // body stands on them, and hands as high as a laid palm's wrist; only a
  // body that bears on its trunk is rested by its shapes.
  const grounded: number | null =
    kind.anchor !== "hips" || kind.raise !== undefined || borne !== null
      ? null
      : kind.pin.every((bone: AutoMovieHumanoidBone): boolean =>
            /(Foot|Toes)$/.test(bone),
          )
        ? shown.y
        : kind.pin.every((bone: AutoMovieHumanoidBone): boolean =>
              bone.endsWith("Hand"),
            )
          ? AutoMovieMotionHumanPlaced.wrist(body, "left", {
              point: { x: 0, y: 0, z: 0 },
              facing: { x: 0, y: -1, z: 0 },
              forward: { x: 0, y: 0, z: 1 },
            }).y
          : null;

  // A body on a raised support (a bench, a seat, a saddle) has its hip
  // joints as high above it as they are above the floor when it lies
  // flat: resting the key's own shapes on the floor first would count
  // the legs that hang beside a bench and float the body by their length
  // (0.51 m on the first run of the supported test).
  const raised: number | null = borne?.y ?? kind.raise?.(body) ?? null;
  const flat: IHumanPosture = ExerciseKey.posed(
    ExerciseKey.of({ pitch: -90 }, {}),
    yaw,
  );
  const lain: number =
    knockdown.rest(body, flat) + ExerciseKey.mean(body, flat, HIPS).y;

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
              : raised + lain - ExerciseKey.mean(body, based, HIPS).y,
          z: hips.z - pelvis(based).z,
        },
      },
      kind.pin,
    );

  // A bar's place: the author's, the prop's with the joints' own height
  // above it, an imagined support under a kind done on equipment (the
  // body rested on the floor), or a bar above the standing reach.
  const rested: IAutoMovieVector3 =
    kind.anchor === "stance"
      ? shown
      : kind.anchor === "hips"
        ? floored()
        : (props.bar ??
          (borne === null
            ? null
            : { ...borne, y: borne.y + (kind.rise?.(body) ?? 0) }) ??
          (kind.rise !== undefined
            ? floored()
            : Vector3.add(
                ExerciseKey.mean(
                  body,
                  { ...based, root: standing.root },
                  kind.pin,
                ),
                { x: 0, y: BAR * body.measure.stature, z: 0 },
              )));
  return grounded === null ? rested : { ...rested, y: grounded };
  }
}

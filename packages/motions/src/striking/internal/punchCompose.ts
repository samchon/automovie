import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingStance } from "./StrikingStance";
import { punchFootwork } from "./punchFootwork";
import { punchGeometry } from "./punchGeometry";

/*
 * The punch's posture at a time and a clock: the footwork's base or a bare
 * base, the guard raised over it, and the striking arm's wrist at `end` sunk by
 * the drop's sag, its elbow led by the wrist's share of its way from the guard
 * so it stays behind the fist (`StrikingStroke.delivery` peaks late), its
 * rotation by the clock, and its reference configuration blended from the
 * launch toward the anchored one unless bare.
 *
 * Part of `punchGeometry.build`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `compose`.
 */
export function punchCompose(
  prepared: punchCompose.IPrepared,
): (
  t: number,
  end: IAutoMovieVector3,
  clock?: number,
  bare?: punchCompose.IBuildComposeBare,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => IAutoMovieMotionHumanPosture {
  const {
    anchored,
    travelled,
    back,
    footwork,
    raised,
    guardAt,
    startElbow,
    hint,
    arm,
    drop,
    sag,
    rotationAt,
    body,
    side,
    launch,
  }: punchCompose.IPrepared = prepared;
  return (
    t: number,
    end: IAutoMovieVector3,
    clock: number = t,
    bare?: punchCompose.IBuildComposeBare,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const reference: IAutoMovieHumanLimbReference | undefined =
      bare === undefined ? anchored(clock) : undefined;

    // The elbow and the arm's reference go out as far as the wrist has: the
    // wrist launches after the skill's lag and peaks late in its delivery
    // (`StrikingStroke.delivery`), so an elbow on the delivery's own clock
    // led it, and mid-flight it stood ahead of the fist with the forearm
    // sweeping back across the line (the small woman's cross met the
    // partner's lead elbow 47 ms before impact with the elbow 15 cm ahead
    // of the wrist). Read as the wrist's share of its way from the guard
    // to where the arm lands, the elbow stays behind the fist.
    const gone: number = travelled(clock);
    const held: number = punchCompose.held(gone, back(clock));
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const posture: IAutoMovieMotionHumanPosture = (bare?.base ?? footwork.base)(
      t,
      clock,
      resolution,
    );
    const guard: ReturnType<typeof StrikingStance.guard> = raised(
      guardAt(posture, resolution, projection),
      clock,
    );
    const elbow: IAutoMovieVector3 = punchCompose.elbow(
      startElbow,
      bare === undefined ? hint(clock) : bare.hint(clock),
      guard[arm]!.bend,
      gone,
      back(clock),
    );
    const wrist: IAutoMovieVector3 = Vector3.add(end, {
      x: 0,
      y: -drop.depth * sag(t),
      z: 0,
    });
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        ...guard,
        [arm]: {
          point: wrist,
          bend: elbow,
          rotation: rotationAt(clock),
          ...(reference === undefined
            ? {}
            : {
                reference: {
                  // Blended as rotations: the launch and the contact
                  // may be written in different charts of the shoulder.
                  upper: blendHumanJoint(
                    body,
                    `${side}UpperArm`,
                    launch.upper,
                    reference.upper,
                    held,
                  ),
                  lower: blendHumanJoint(
                    body,
                    `${side}LowerArm`,
                    launch.lower,
                    reference.lower,
                    held,
                  ),
                },
              }),
        },
      },
    };
  };
}

/*
 * The `compose` of `punchGeometry.build`, built from what that plan prepared.
 */
export namespace punchCompose {
  /*
   * How far the arm's reference has left the launch for the contact: the
   * wrist's share of its way out less its share of the way back, within 0 to
   * 1.
   * Parameter gone: The wrist's share of its way out.
   * Parameter back: The share of the way back.
   * Returns: 0 to 1.
   */
  export function held(gone: number, back: number): number {
    return Math.max(0, Math.min(1, gone - back));
  }

  /*
   * The punching elbow's hint: from where it started toward the contact's hint
   * by the wrist's share of its way out, then toward the guard's bend by the
   * share of the way back.
   * Parameter start: The elbow's hint at the launch, world metres.
   * Parameter hint: The contact's elbow hint, world metres.
   * Parameter guard: The guard's elbow bend, world metres.
   * Parameter gone: The wrist's share of its way out.
   * Parameter back: The share of the way back.
   * Returns: The hint, world metres.
   */
  export function elbow(
    start: IAutoMovieVector3,
    hint: IAutoMovieVector3,
    guard: IAutoMovieVector3,
    gone: number,
    back: number,
  ): IAutoMovieVector3 {
    return Vector3.lerp(Vector3.lerp(start, hint, gone), guard, back);
  }

  /*
   * The record of `IBuildComposeBare`'s site.
   */
  export type IBuildComposeBare = {
    base: punchFootwork.IFootwork["base"];
    hint: (clock: number) => IAutoMovieVector3;
  };

  /*
   * The alternatives of `BuildArm`'s site.
   */
  export type BuildArm = "leftArm" | "rightArm";

  /*
   * What `punchGeometry.build` prepared for its `compose`.
   */
  export interface IPrepared {
    /*
     * The `anchored` `punchGeometry.build` prepared.
     */
    anchored: (clock: number) => IAutoMovieHumanLimbReference;

    /*
     * The `travelled` `punchGeometry.build` prepared.
     */
    travelled: (clock: number) => number;

    /*
     * The `back` `punchGeometry.build` prepared.
     */
    back: (t: number) => number;

    /*
     * The `footwork` `punchGeometry.build` prepared.
     */
    footwork: punchFootwork.IFootwork;

    /*
     * The `raised` `punchGeometry.build` prepared.
     */
    raised: (
      guard: ReturnType<typeof StrikingStance.guard>,
      clock: number,
    ) => ReturnType<typeof StrikingStance.guard>;

    /*
     * The `guardAt` `punchGeometry.build` prepared.
     */
    guardAt: ReturnType<typeof StrikingStance.prepareGuard>;

    /*
     * The `startElbow` `punchGeometry.build` prepared.
     */
    startElbow: IAutoMovieVector3;

    /*
     * The contact elbow hint updated by the prepared tracking corrections.
     */
    hint: (clock: number) => IAutoMovieVector3;

    /*
     * The `arm` `punchGeometry.build` prepared.
     */
    arm: BuildArm;

    /*
     * The `drop` `punchGeometry.build` prepared.
     */
    drop: punchGeometry.ITiming["drop"];

    /*
     * The `sag` `punchGeometry.build` prepared.
     */
    sag: (t: number) => number;

    /*
     * The `rotationAt` `punchGeometry.build` prepared.
     */
    rotationAt: (t: number) => IAutoMovieQuaternion;

    /*
     * The `body` `punchGeometry.build` prepared.
     */
    body: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>["body"];

    /*
     * The `side` `punchGeometry.build` prepared.
     */
    side: punchGeometry.ITiming["side"];

    /*
     * The `launch` `punchGeometry.build` prepared.
     */
    launch: IAutoMovieHumanLimbReference;
  }
}

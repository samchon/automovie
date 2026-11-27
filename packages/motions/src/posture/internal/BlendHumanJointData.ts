import type { AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieJointAxes, IAutoMovieBone, IAutoMovieMotionHumanBody, IAutoMovieRestFrame, IAutoMovieJointRotationDomain } from "@automovie/interface";

import {
  AutoMovieEngineKinematics,
  AutoMovieEngineHumanoidJointAxes,
  AutoMovieEngineDefaultJointAxes,
  AutoMovieEngineSwingTwistRange,
  AutoMovieEngineHumanoidRestFrame,
} from "@automovie/engine";
import { readHumanBone } from "../../body/internal/readHumanBone";







export namespace BlendHumanJointData {
  /*
   * Stateless standalone dispatch preserves targeted lookup without a per-call
   * full index.
   */
  export const COLD: ILookup = {
    constraint: (
      body: IBlendBody,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieJointConstraint | null =>
      AutoMovieEngineKinematics.getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null),
    frame: (
      body: IBlendBody,
      bone: AutoMovieHumanoidBone,
      constraint: IAutoMovieJointConstraint | null,
    ): IFrame => frameOf(bone, axesOf(body, bone), constraint),
  };

  /*
   * Find one joint's last explicit axes, leaving earlier axes as fallback.
   */
  export function axesOf(
    body: IBlendBody,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointAxes | undefined {
    const rows: IAutoMovieBone[] = body.skeleton.bones;
    for (let i: number = rows.length - 1; i >= 0; --i) {
      const row: IAutoMovieBone | undefined = rows[i];
      const axes: IAutoMovieJointAxes | undefined =
        row?.bone === bone ? row.axes : undefined;
      if (axes !== undefined) return axes;
    }
    return AutoMovieEngineHumanoidJointAxes[bone];
  }

  /*
   * One joint's raw axes with their normalized basis and swing-twist chart.
   */
  export function frameOf(
    bone: AutoMovieHumanoidBone,
    axes: IAutoMovieJointAxes | undefined,
    constraint: IAutoMovieJointConstraint | null,
  ): IFrame {
    const basis: IAutoMovieJointAxes = AutoMovieEngineKinematics.normalizeJointAxes(
      axes ?? AutoMovieEngineDefaultJointAxes,
      "jointToQuaternion axes",
    );
    const swing: IAutoMovieJointConstraint["swingTwist"] = constraint?.swingTwist;
    const bounded: boolean = swing !== undefined && swing !== null;
    const joint: ReturnType<typeof AutoMovieEngineSwingTwistRange.fromAxes> = bounded
      ? AutoMovieEngineSwingTwistRange.fromAxes(bone, axes)
      : undefined;
    return {
      basis,
      rest: AutoMovieEngineHumanoidRestFrame[bone],
      domain: {
        bone,
        constraint:
          constraint === null || swing === null
            ? constraint
            : { ...constraint, swingTwist: null },
      },
      range:
        joint === undefined || constraint === null
          ? undefined
          : {
              constraint,
              joint: AutoMovieEngineSwingTwistRange.prepare(bone, joint, constraint),
            },
    };
  }

  /*
   * The existing body records needed to choose a joint's blend.
   */
  export type IBlendBody = Pick<IAutoMovieMotionHumanBody, "bones" | "skeleton">;

  /*
   * One bone's admitted conversion basis, clinical chart and optional range.
   */
  export interface IFrame {
    /*
     * The normalized basis the conversions read.
     */
    readonly basis: IAutoMovieJointAxes;

    /*
     * The clinical rest mapping used in both directions.
     */
    readonly rest: IAutoMovieRestFrame | undefined;

    /*
     * The preferred chart's domain for rotation readback.
     */
    readonly domain: IAutoMovieJointRotationDomain;

    /*
     * The prepared swing-twist range when both a range and raw axes exist.
     */
    readonly range: IRange | undefined;
  }

  /*
   * The constraint and chart a bounded rotation blend uses together.
   */
  export interface IRange {
    /*
     * The resolved range constraint.
     */
    readonly constraint: IAutoMovieJointConstraint;

    /*
     * Its geometric swing region.
     */
    readonly joint: AutoMovieEngineSwingTwistRange.IPrepared;
  }

  /*
   * The two metadata phases: constraint lookup precedes any ball-joint axes work.
   */
  export interface ILookup {
    /*
     * First-match override/default resolution, without reading clinical axes.
     */
    constraint(
      body: IBlendBody,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieJointConstraint | null;

    /*
     * Canonical frame metadata, requested only after the hinge branch.
     */
    frame(
      body: IBlendBody,
      bone: AutoMovieHumanoidBone,
      constraint: IAutoMovieJointConstraint | null,
    ): IFrame;
  }
}

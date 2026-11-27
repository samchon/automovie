import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones
} from "../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  stand
} from "../../../../packages/motions/src/actions/internal/stand";

/**
 * A typed synthetic audit motion for a unit test of one audit check: one person
 * holding the quiet stance at the origin facing +Z (`stand.posture`), the whole
 * body displaced at each second by `shift`, under one action that spans the
 * motion and declares the given contacts. Nothing else is read, so a check's
 * reading follows from the displacement in closed form.
 *
 * @param body The person's body.
 * @param options The displacement, the contacts and the motion's length.
 * @returns The motion, the person's subject `a`.
 */
export function auditStanceMotion(
  body: IAutoMovieMotionHumanBody,
  options: auditStanceMotion.IOptions = {},
): IAutoMovieMotionHumanAuditMotion {
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const duration: number = options.duration ?? 1;
  const shift: (seconds: number) => IAutoMovieVector3 =
    options.shift ?? ((): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }));
  const moved: (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    by: IAutoMovieVector3,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    by: IAutoMovieVector3,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      [...bones].map(
        ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          name,
          { ...bone, worldPosition: AutoMovieEngineVector3.add(bone.worldPosition, by) },
        ],
      ),
    );
  return {
    duration,
    bones: (_subject: string, seconds: number) =>
      moved(
        options.pose === undefined ? still : options.pose(still),
        shift(seconds),
      ),
    segments: () => [
      {
        name: "stand",
        start: 0,
        entryTime: 0,
        end: duration,
        ...(options.physical === true ? { physical: true } : {}),
        plan: { duration, contacts: options.contacts ?? [] },
      },
    ],
    ...(options.support === undefined ? {} : { support: options.support }),
    ...(options.water === undefined ? {} : { water: options.water }),
  };
}

/** Companion types and contacts of {@link auditStanceMotion}. */
export namespace auditStanceMotion {
  /** How the stance is displaced and what its action declares. */
  export interface IOptions {
    /** The motion's length, seconds; 1 when absent. */
    duration?: number;

    /** The whole body's displacement at a second, metres; none when absent. */
    shift?: (seconds: number) => IAutoMovieVector3;

    /**
     * A change to the still stance's bones before the displacement; none when
     * absent.
     */
    pose?: (
      still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The action's contact windows, shares of the motion; none when absent. */
    contacts?: readonly IAutoMovieMotionHumanContactWindow[];

    /** Whether the audit judges the action's balance; false when absent. */
    physical?: boolean;

    /** Whether water carries the person at a second; never when absent. */
    water?: (subject: string, seconds: number) => boolean;

    /** The frame of a support at a second; every support fixed when absent. */
    support?: (
      support: IAutoMovieMotionHumanContactWindow.Support,
      seconds: number,
    ) => IAutoMovieRigidTransform;
  }

  /**
   * Both feet planted over the whole action.
   *
   * @param support What they are planted on; the world floor when absent.
   * @param load Each foot's declared share of the weight; none when absent.
   * @returns The two windows, left first.
   */
  export function plants(
    support: IAutoMovieMotionHumanContactWindow.Support = { kind: "ground" },
    load?: readonly [number, number],
  ): IAutoMovieMotionHumanContactWindow[] {
    return (["leftFoot", "rightFoot"] as const).map(
      (
        part: "leftFoot" | "rightFoot",
        i: number,
      ): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: 1,
        support,
        ...(load === undefined ? {} : { load: load[i]! }),
      }),
    );
  }
}

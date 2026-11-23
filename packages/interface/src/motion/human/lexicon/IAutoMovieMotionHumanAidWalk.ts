import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";

/** A held prop's support order and a sequence of authored floor stations. */
export type IAutoMovieMotionHumanAidWalk =
  | IAutoMovieMotionHumanAidWalk.IHeld
  | IAutoMovieMotionHumanAidWalk.IWalker;

/** The aid alternatives and floor stations of the aided walk. */
export namespace IAutoMovieMotionHumanAidWalk {
  /** A single-grip aid's kind. */
  export type HeldKind = "cane" | "crutch";

  /** What every aided walk names: the prop and the floor stations. */
  export interface ICommon {
    /**
     * The staged prop with its floor track. A cane or crutch declares a grip
     * and a tip. A walker declares two grips and a common floor tip.
     */
    prop: string;

    /** Consecutive floor stations of the body, from the held standing pose. */
    stations: readonly IStation[];

    /**
     * The entry station's world floor point, metres: where the body stands at
     * entry, from which every station's `x` and `z` are measured and about
     * which its `turn` carries the body, its feet and its aid as one rigid
     * whole. Absent, the feet turn about their own midpoint and the aid about
     * its own staged frame, which matches only a walk that never turns.
     */
    origin?: IAutoMovieVector3;
  }

  /** A single-grip aid that swings with the opposite step. */
  export interface IHeld extends ICommon {
    /** The single-grip aid. */
    kind: HeldKind;

    /** The hand that closes on the aid. Defaults to right. */
    hand?: AutoMovieHumanSide;
  }

  /** A walker that advances during both-foot support. */
  export interface IWalker extends ICommon {
    /** The two-handed walker. */
    kind: "walker";
  }

  /** The aided-walk law and the prop track that moves its aid on the same clock. */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanAidWalk> {
    /**
     * From the aid's staged floor frame, the walk's parameters and the walk's
     * first film second (zero when absent), the aid's world frame in metres at
     * each film second.
     */
    track: (
      start: IAutoMovieRigidTransform,
      props: IAutoMovieMotionHumanAidWalk,
      startsAt?: number,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }

  /** A floor endpoint and the film time available to reach it. */
  export interface IStation {
    /** World X displacement from the entry station, in metres. */
    x: number;

    /** World Z displacement from the entry station, in metres. */
    z: number;

    /**
     * Heading change relative to the action entry, in degrees. Defaults to
     * zero.
     */
    turn?: number;

    /** Positive film seconds to advance the aid and both feet once. */
    seconds: number;
  }
}

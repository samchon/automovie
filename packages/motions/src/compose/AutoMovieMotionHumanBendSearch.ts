import {
  HUMANOID_REST_FRAME,
  Vector3,
  decomposeJointRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import { AutoMovieMotionHumanBendSide } from "./AutoMovieMotionHumanBendSide";
import { AutoMovieMotionHumanBendStrain } from "./AutoMovieMotionHumanBendStrain";
import { AutoMovieMotionHumanBendSweep } from "./AutoMovieMotionHumanBendSweep";

/** The alternatives of `PrepareGoal`'s site. */
type PrepareGoal = "point" | "rotation";

/** The alternatives of `PrepareGoalResult`'s site. */
type PrepareGoalResult = "point" | "rotation";

/** The alternatives of `PrepareProps`'s site. */
type PrepareProps = "body" | "posture" | "side";

/** The alternatives of `ContinuedProps`'s site. */
type ContinuedProps = "body" | "posture" | "side" | "point" | "rotation";

/**
 * The elbow search of `AutoMovieMotionHumanBend`: the swivel sweep of a hand
 * goal's elbow over its circle, each place read for its joints' overshoot, the
 * forearm's clearance of the body and its strain, and the best place under a
 * ranking the caller gives. The rule of an allowed place and the strain's terms
 * are stated on `AutoMovieMotionHumanBend.solve`.
 */
export namespace AutoMovieMotionHumanBendSearch {
  /** Three clinical angles of a joint, degrees. */
  export interface IAngles {
    /** Flexion. */
    flexion: number;

    /** Abduction. */
    abduction: number;

    /** Twist. */
    twist: number;
  }

  /** One elbow place of a hand goal as the search reads it. */
  export interface ICandidate {
    /** The elbow's place, world metres. */
    elbow: IAutoMovieVector3;

    /** The shoulder's clinical angles, degrees. */
    angles: IAngles;

    /**
     * Degrees out of range plus the forearm's depth inside its clearance of the
     * body as degrees of upper arm turn; 0 when allowed.
     */
    overshoot: number;

    /** The strain, unitless; read on demand where `least` is given. */
    strain: number;

    /**
     * A certified lower bound of `strain` known without reading it, where the
     * hand's share of the strain is deferred
     * (`AutoMovieMotionHumanBendStrain.least`); absent where `strain` is
     * cheap.
     */
    least?: number;
  }

  /**
   * What the engine's swivel sweep orders candidates by: `overshoot` first,
   * compared exactly, then `deviation`.
   */
  export interface IScore {
    /** The first key. */
    overshoot: number;

    /** The second key, or its certified lower bound where `exact` is given. */
    deviation: number;

    /**
     * The exact second key, read only where its bound cannot decide a
     * comparison (`hingedSwivelAhead`).
     */
    exact?: () => number;
  }

  /**
   * The ranking `solve` takes: overshoot first, then the strain, deferred to
   * its certified lower bound where the candidate carries one.
   *
   * @param candidate The candidate.
   * @returns Its score, whose comparisons are the same as with the strain read
   *   at once.
   */
  export function strained(candidate: ICandidate): IScore {
    return candidate.least === undefined
      ? { overshoot: candidate.overshoot, deviation: candidate.strain }
      : {
          overshoot: candidate.overshoot,
          deviation: candidate.least,
          exact: (): number => candidate.strain,
        };
  }

  /**
   * The ranking that takes the elbow place on a point's side of the
   * shoulder-to-wrist line. Candidates within one degree of that side come
   * first, ordered by overshoot then strain plus the radial discrepancy, which
   * is under 0.0002 there. An elbow place has two arm poses, one per bend
   * branch, and this order takes the allowed one. Every other candidate
   * follows, nearer sides first.
   *
   * @param shoulder The shoulder, world metres.
   * @param wrist The wrist, world metres.
   * @param bend The point whose side is taken, world metres.
   * @returns The ranking.
   */
  export function toward(
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    bend: IAutoMovieVector3,
  ): (candidate: ICandidate) => IScore {
    return AutoMovieMotionHumanBendSide(shoulder, wrist, bend);
  }

  /**
   * The strain `search` ranks an elbow place by, read from the rotations of
   * another fit of the same arm (`fitChainToTarget`'s `strain`): the upper
   * arm's bone-local rotation, read in the arm's own clinical frame, and the
   * lower arm's world rotation.
   *
   * @param body The body.
   * @param side The arm.
   * @param rotation The hand's world rotation, when its turn counts as strain.
   * @returns The strain of a candidate, or null when the rig has no arm chain.
   */
  export function strainOf(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion | undefined,
  ):
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        lowerWorld: IAutoMovieQuaternion,
      ) => number)
    | null {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain(
        body,
        { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
        side,
      );
    const neutral: IAngles | null = body.hanging[side];
    if (chain === null || neutral === null) return null;
    const upperBone: AutoMovieHumanoidBone = chain.prepared.chain.upper;
    const lowerAxes: IAutoMovieJointAxes | undefined =
      chain.axes[chain.prepared.chain.lower];
    if (lowerAxes === undefined) return null;
    const strained: (
      u: IAngles,
      lowerWorld: () => IAutoMovieQuaternion,
    ) => number = AutoMovieMotionHumanBendStrain(
      chain,
      body,
      side,
      rotation,
      neutral,
      lowerAxes,
    );
    return (
      upper: IAutoMovieQuaternion,
      _lower: IAutoMovieQuaternion,
      lowerWorld: IAutoMovieQuaternion,
    ): number =>
      strained(
        decomposeJointRotation(
          upper,
          chain.axes[upperBone],
          HUMANOID_REST_FRAME[upperBone],
          chain.prepared.upperDomain,
        ),
        (): IAutoMovieQuaternion => lowerWorld,
      );
  }
  /** The alternatives of `ContinuedResult2`'s site. */
  type ContinuedResult2 = IContinuedResult2 | string;

  /** The record of `IContinuedResult2`'s site. */
  type IContinuedResult2 = {
    candidate: ICandidate;
    seed: IAutoMovieSwivelSeed;
  };

  /** The alternatives of `ContinuedResult`'s site. */
  type ContinuedResult = IContinuedResult | string;

  /** The record of `IContinuedResult`'s site. */
  type IContinuedResult = { candidate: ICandidate; seed: IAutoMovieSwivelSeed };

  /**
   * `AutoMovieMotionHumanBend.solve`'s search with the seed it was chosen at,
   * on one request's trunk prepared once: cold, or continued from a nearby
   * solve's seed; legality first, then the least strain.
   *
   * @param props The request; its `fallback` is not read.
   * @returns The search of the request, given the seed of a nearby solve of the
   *   same arm to continue (`IAutoMovieSwivelNear`) or none to sweep every
   *   swivel: the candidate and its swivel and bend branch, or the reason there
   *   is none.
   */
  export function continued(
    props: Pick<IAutoMovieMotionHumanBend.ISolve, ContinuedProps>,
  ): (near?: IAutoMovieSwivelNear) => ContinuedResult {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain(props.body, props.posture, props.side);
    const neutral: IAngles | null = props.body.hanging[props.side];
    return (near?: IAutoMovieSwivelNear): ContinuedResult2 => {
      if (chain === null || neutral === null) return "the rig has no arm chain";
      if (
        Vector3.length(Vector3.subtract(props.point, chain.shoulder)) >
        chain.span
      )
        return "the wrist is beyond the arm's span";
      return (
        AutoMovieMotionHumanBendSweep(
          chain,
          props.body,
          props.side,
          props.point,
          props.rotation,
          neutral,
          strained,
          near,
          true,
        ) ?? "the arm chain is degenerate"
      );
    };
  }

  /**
   * The shoulder angles of an unloaded hanging arm: the wrist straight below
   * the shoulder of an upright trunk, as far as the relaxed elbow
   * (`stand.ELBOW`) leaves it, the elbow on the hint's side. The body reads it
   * once per side (`IAutoMovieMotionHumanBody.hanging`).
   *
   * @param body The body.
   * @param side The arm.
   * @param hint The `hang` preset's hint for an upright trunk at the origin.
   * @returns The angles, or null when the rig has no arm chain.
   */
  export function hanging(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    hint: IAutoMovieVector3,
  ): IAngles | null {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain(
        body,
        { root: { x: 0, y: 0, z: 0 }, yaw: 0 },
        side,
      );
    if (chain === null) return null;

    // The wrist under the elbow a standing posture relaxes the arm to
    // (`stand.ELBOW`): the law of cosines on the two segments, as a share
    // of the straight arm.
    const upper: number = body.measure.upperArm;
    const fore: number = body.measure.forearm;
    const flexion: number = (stand.ELBOW * Math.PI) / 180;
    const share: number =
      Math.sqrt(
        upper * upper + fore * fore + 2 * upper * fore * Math.cos(flexion),
      ) /
      (upper + fore);
    const point: IAutoMovieVector3 = {
      x: chain.shoulder.x,
      y: chain.shoulder.y - share * chain.span,
      z: chain.shoulder.z,
    };
    return (
      AutoMovieMotionHumanBendSweep(
        chain,
        body,
        side,
        point,
        undefined,
        null,
        AutoMovieMotionHumanBendSide.prepare(chain.shoulder, point, hint),
      )?.candidate.angles ?? null
    );
  }
  /** The alternatives of `SearchResult`'s site. */
  type SearchResult = ICandidate | string;

  /**
   * The search `solve` and `strain` share: prepares the chain, refuses a wrist
   * out of reach and returns the best candidate under a ranking.
   *
   * @param props The request.
   * @param rank The ranking of a candidate, given the prepared chain; its
   *   overshoot is positive wherever the candidate's is, so the swivels the
   *   upper arm's range refuses are spared.
   * @returns The candidate, or the reason there is none.
   */
  export function search(
    props: IAutoMovieMotionHumanBend.ISolve,
    rank: (
      chain: AutoMovieMotionHumanBendChain.IChain,
    ) => (candidate: ICandidate) => IScore,
  ): SearchResult {
    return prepare(props)(props, rank);
  }
  /** The alternatives of `PrepareResult2`'s site. */
  type PrepareResult2 = ICandidate | string;

  /** The alternatives of `PrepareResult`'s site. */
  type PrepareResult = ICandidate | string;

  /**
   * Prepare one unchanged body's trunk/side for actual differently ranked
   * sweeps.
   */
  export function prepare(
    props: Pick<IAutoMovieMotionHumanBend.ISolve, PrepareProps>,
    source?: AutoMovieMotionHumanBendChain.IPrepared,
  ): (
    goal: Pick<IAutoMovieMotionHumanBend.ISolve, PrepareGoalResult>,
    rank: Parameters<typeof search>[1],
  ) => PrepareResult {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain(
        props.body,
        props.posture,
        props.side,
        source,
      );
    const neutral: IAngles | null = props.body.hanging[props.side];
    return (
      goal: Pick<IAutoMovieMotionHumanBend.ISolve, PrepareGoal>,
      rank: Parameters<typeof search>[1],
    ): PrepareResult2 => {
      if (chain === null || neutral === null) return "the rig has no arm chain";
      const distance: number = Vector3.length(
        Vector3.subtract(goal.point, chain.shoulder),
      );
      if (distance > chain.span)
        return `the wrist is ${distance.toFixed(3)} m from the shoulder and the arm is ${chain.span.toFixed(3)} m long`;
      const ranking: (candidate: ICandidate) => IScore = rank(chain);
      return (
        AutoMovieMotionHumanBendSweep(
          chain,
          props.body,
          props.side,
          goal.point,
          goal.rotation,
          neutral,
          ranking,
          undefined,
          ranking === strained,
        )?.candidate ?? "the arm chain is degenerate"
      );
    };
  }
}

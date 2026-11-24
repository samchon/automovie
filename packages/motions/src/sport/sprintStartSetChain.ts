/** The record of `IOfNext`'s site. */
type IOfNext = { miss: number };

/** The record of `IOfLast`'s site. */
type IOfLast = { miss: number };

/** The record of `IOfPlacedResult`'s site. */
type IOfPlacedResult = { miss: number };

/** The record of `IOfPlaced`'s site. */
type IOfPlaced = { miss: number };
/**
 * The set on the chain.
 *
 * @param props The chain's ends, lengths and angles.
 * @returns The set whose shoulders lie the arms' reach from the wrists, the hip
 *   above the knee's line and the shoulders ahead of the hip; of several, the
 *   one whose shoulders stand nearest over the wrists. None when no elevation
 *   of the shank reaches.
 */
export function sprintStartSetChain(
  props: sprintStartSetChain.IProps,
): sprintStartSetChain.ISet | undefined {
  const knee: number = (props.knee * Math.PI) / 180;
  const hip: number = (props.hip * Math.PI) / 180;

  // The chain at an elevation of the shank above the run's heading.
  const placed: (elevation: number) => sprintStartSetChain.ISet & IOfPlaced = (
    elevation: number,
  ): sprintStartSetChain.ISet & IOfPlacedResult => {
    const k: sprintStartSetChain.IPoint = {
      u: props.ankle.u + props.shank * Math.cos(elevation),
      v: props.ankle.v + props.shank * Math.sin(elevation),
    };
    // The thigh turned from the knee-to-ankle direction by the knee's
    // angle, to the side that puts the hip above.
    const down: sprintStartSetChain.IPoint = {
      u: (props.ankle.u - k.u) / props.shank,
      v: (props.ankle.v - k.v) / props.shank,
    };
    const h: sprintStartSetChain.IPoint = higher(
      at(k, turned(down, knee), props.thigh),
      at(k, turned(down, -knee), props.thigh),
    );
    // The trunk turned from the hip-to-knee direction by the hip's angle,
    // to the side that puts the shoulders ahead.
    const thigh: sprintStartSetChain.IPoint = {
      u: (k.u - h.u) / props.thigh,
      v: (k.v - h.v) / props.thigh,
    };
    const a: sprintStartSetChain.IPoint = at(
      h,
      turned(thigh, hip),
      props.trunk,
    );
    const b: sprintStartSetChain.IPoint = at(
      h,
      turned(thigh, -hip),
      props.trunk,
    );
    const s: sprintStartSetChain.IPoint = a.u >= b.u ? a : b;
    return {
      hip: h,
      shoulders: s,
      miss: Math.hypot(s.u - props.wrist.u, s.v - props.wrist.v) - props.arm,
    };
  };
  const admitted: (set: sprintStartSetChain.ISet) => boolean = (
    set: sprintStartSetChain.ISet,
  ): boolean => set.shoulders.u > set.hip.u && set.shoulders.v > props.wrist.v;
  let best: sprintStartSetChain.ISet | undefined;

  // The elevations are bracketed a degree apart.
  const STEP: number = Math.PI / 180;
  let last: sprintStartSetChain.ISet & IOfLast = placed(STEP);
  for (let e: number = 2 * STEP; e < Math.PI / 2; e += STEP) {
    const next: sprintStartSetChain.ISet & IOfNext = placed(e);
    if (Math.sign(next.miss) !== Math.sign(last.miss)) {
      let low: number = e - STEP;
      let high: number = e;
      const sign: number = Math.sign(last.miss);
      for (let i: number = 0; i < 50; ++i) {
        const middle: number = (low + high) / 2;
        if (Math.sign(placed(middle).miss) === sign) low = middle;
        else high = middle;
      }
      const root: sprintStartSetChain.ISet = placed((low + high) / 2);
      if (
        admitted(root) &&
        (best === undefined ||
          Math.abs(root.shoulders.u - props.wrist.u) <
            Math.abs(best.shoulders.u - props.wrist.u))
      )
        best = { hip: root.hip, shoulders: root.shoulders };
    }
    last = next;
  }
  return best;
}

/**
 * The set position's sagittal chain in closed form: the front shank, thigh,
 * trunk and straight arms in the run's vertical plane, from the front ankle on
 * its block to the wrists on the line, at the measured front knee and front hip
 * angles.
 *
 * The chain has one freedom once both angles are held: the shank's elevation.
 * Each elevation places the knee on the shank, the hip a thigh away at the
 * knee's angle and the shoulders a trunk away at the hip's, and the shoulders'
 * distance to the wrists falls or rises with it; the elevation at which that
 * distance is the arms' reach is the set. It is read by bisection on that one
 * scalar, so the whole-body fit starts from the measured set instead of
 * searching the trunk's tilt and the arms' lean.
 */
export namespace sprintStartSetChain {
  /** A point of the run's vertical plane. */
  export interface IPoint {
    /** Along the run, metres. */
    u: number;

    /** Up, metres. */
    v: number;
  }

  /** The chain's measures. */
  export interface IProps {
    /** The front ankle on its block. */
    ankle: IPoint;

    /** The wrists' midpoint over the laid hands. */
    wrist: IPoint;

    /** The thigh, hip joint to knee, metres. */
    thigh: number;

    /** The shank, knee to ankle, metres. */
    shank: number;

    /** The trunk, the hip joints' midpoint to the shoulders', metres. */
    trunk: number;

    /** The arms' reach, shoulder to wrist, metres. */
    arm: number;

    /** The front knee's included angle, degrees. */
    knee: number;

    /**
     * The front hip's included angle between the knee and the shoulders,
     * degrees.
     */
    hip: number;
  }

  /** The chain's set: its hip joints' and shoulders' midpoints. */
  export interface ISet {
    /** The hip joints' midpoint. */
    hip: IPoint;

    /** The shoulders' midpoint. */
    shoulders: IPoint;
  }

  /**
   * Where the rear ankle lies along the run: the law of cosines' distance from
   * the hip of a leg at `angle` degrees of included knee angle, at the height
   * of the ankle on its block, behind the hip.
   *
   * @param hip The hip joints' midpoint.
   * @param ankle The rear ankle on its block, whose height it keeps.
   * @param thigh The thigh, metres.
   * @param shank The shank, metres.
   * @param angle The rear knee's included angle, degrees.
   * @returns The ankle's place along the run, metres; none when the hip stands
   *   beyond that leg's reach of the ankle's height.
   */
  export function rear(
    hip: IPoint,
    ankle: IPoint,
    thigh: number,
    shank: number,
    angle: number,
  ): number | undefined {
    const reach: number = Math.sqrt(
      thigh * thigh +
        shank * shank -
        2 * thigh * shank * Math.cos((angle * Math.PI) / 180),
    );
    const drop: number = hip.v - ankle.v;
    return Math.abs(drop) < reach
      ? hip.u - Math.sqrt(reach * reach - drop * drop)
      : undefined;
  }
}

/**
 * A unit direction turned counterclockwise in the plane (toward up from along)
 * by `angle` radians.
 */
function turned(
  d: sprintStartSetChain.IPoint,
  angle: number,
): sprintStartSetChain.IPoint {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  return { u: d.u * c - d.v * s, v: d.u * s + d.v * c };
}

/** The point `length` along a unit direction from `from`. */
function at(
  from: sprintStartSetChain.IPoint,
  d: sprintStartSetChain.IPoint,
  length: number,
): sprintStartSetChain.IPoint {
  return { u: from.u + d.u * length, v: from.v + d.v * length };
}

/** The higher of two points. */
function higher(
  a: sprintStartSetChain.IPoint,
  b: sprintStartSetChain.IPoint,
): sprintStartSetChain.IPoint {
  return a.v >= b.v ? a : b;
}

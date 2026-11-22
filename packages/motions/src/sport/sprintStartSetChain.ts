/**
 * The set position's sagittal chain in closed form: the front shank, thigh,
 * trunk and straight arms in the run's vertical plane, from the front ankle
 * on its block to the wrists on the line, at the measured front knee and
 * front hip angles.
 *
 * The chain has one freedom once both angles are held: the shank's
 * elevation. Each elevation places the knee on the shank, the hip a thigh
 * away at the knee's angle and the shoulders a trunk away at the hip's,
 * and the shoulders' distance to the wrists falls or rises with it; the
 * elevation at which that distance is the arms' reach is the set. It is read
 * by bisection on that one scalar, so the whole-body fit starts from the
 * measured set instead of searching the trunk's tilt and the arms' lean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, its one freedom and how the set is read on it.
 * @evidence contracts/development/design.md#principled-representation Plane points are (along the run, up) metres; angles are included angles in degrees, as the set's measures are.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function serves the set's seed and its rear block.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is assumed: every point follows from the body's lengths and the measured angles.
 */
export namespace sprintStartSetChain {
  /**
   * A point of the run's vertical plane.
   *
   * @evidence contracts/development/design.md#principled-representation Metres along the run's heading from the set frame's origin, and up from the floor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two coordinates the chain reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No lateral coordinate: the chain is the sagittal one.
   * @evidence contracts/development/common.md#meaningful-documentation States both axes and their unit.
   */
  export interface IPoint {
    /** Along the run, metres. */
    u: number;

    /** Up, metres. */
    v: number;
  }

  /**
   * The chain's measures.
   *
   * @evidence contracts/development/design.md#principled-representation Segment lengths in metres and included angles in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two ends, four lengths and two angles the chain needs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's own; the angles are the set's measured ones.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   */
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

    /** The front hip's included angle between the knee and the shoulders, degrees. */
    hip: number;
  }

  /**
   * The chain's set: its hip joints' and shoulders' midpoints.
   *
   * @evidence contracts/development/design.md#principled-representation Two plane points in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hip feeds the rear block, the shoulders and both feed the seed's trunk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both lie on the one chain the measures define.
   * @evidence contracts/development/common.md#meaningful-documentation States both points.
   */
  export interface ISet {
    /** The hip joints' midpoint. */
    hip: IPoint;

    /** The shoulders' midpoint. */
    shoulders: IPoint;
  }

  /**
   * The set on the chain.
   *
   * @param props The chain's ends, lengths and angles.
   * @returns The set whose shoulders lie the arms' reach from the wrists, the hip above the knee's line and the shoulders ahead of the hip; of several, the one whose shoulders stand nearest over the wrists. None when no elevation of the shank reaches.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of a planar three-link chain at two held included angles, and a bisection on its one remaining freedom.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement of the chain, one bracketing pass over the shank's elevations and one bisection per bracket.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bracket is a sign change of the reach's miss; no elevation is taken where none reaches.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed count of scalar placements: one pass of a degree's step over a quarter turn and fifty halvings per bracket.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each placement is a handful of products; nothing is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two fresh points.
   * @evidence contracts/development/common.md#meaningful-documentation States the chosen root and the empty case.
   */
  export function of(props: IProps): ISet | undefined {
    const knee: number = (props.knee * Math.PI) / 180;
    const hip: number = (props.hip * Math.PI) / 180;

    // The chain at an elevation of the shank above the run's heading.
    const placed: (elevation: number) => ISet & { miss: number } = (
      elevation: number,
    ): ISet & { miss: number } => {
      const k: IPoint = {
        u: props.ankle.u + props.shank * Math.cos(elevation),
        v: props.ankle.v + props.shank * Math.sin(elevation),
      };
      // The thigh turned from the knee-to-ankle direction by the knee's
      // angle, to the side that puts the hip above.
      const down: IPoint = {
        u: (props.ankle.u - k.u) / props.shank,
        v: (props.ankle.v - k.v) / props.shank,
      };
      const h: IPoint = higher(
        at(k, turned(down, knee), props.thigh),
        at(k, turned(down, -knee), props.thigh),
      );
      // The trunk turned from the hip-to-knee direction by the hip's angle,
      // to the side that puts the shoulders ahead.
      const thigh: IPoint = {
        u: (k.u - h.u) / props.thigh,
        v: (k.v - h.v) / props.thigh,
      };
      const a: IPoint = at(h, turned(thigh, hip), props.trunk);
      const b: IPoint = at(h, turned(thigh, -hip), props.trunk);
      const s: IPoint = a.u >= b.u ? a : b;
      return {
        hip: h,
        shoulders: s,
        miss:
          Math.hypot(s.u - props.wrist.u, s.v - props.wrist.v) - props.arm,
      };
    };
    const admitted: (set: ISet) => boolean = (set: ISet): boolean =>
      set.shoulders.u > set.hip.u && set.shoulders.v > props.wrist.v;
    let best: ISet | undefined;

    // The elevations are bracketed a degree apart.
    const STEP: number = Math.PI / 180;
    let last: ISet & { miss: number } = placed(STEP);
    for (let e: number = 2 * STEP; e < Math.PI / 2; e += STEP) {
      const next: ISet & { miss: number } = placed(e);
      if (Math.sign(next.miss) !== Math.sign(last.miss)) {
        let low: number = e - STEP;
        let high: number = e;
        const sign: number = Math.sign(last.miss);
        for (let i: number = 0; i < 50; ++i) {
          const middle: number = (low + high) / 2;
          if (Math.sign(placed(middle).miss) === sign) low = middle;
          else high = middle;
        }
        const root: ISet = placed((low + high) / 2);
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
   * Where the rear ankle lies along the run: the law of cosines' distance
   * from the hip of a leg at `angle` degrees of included knee angle, at the
   * height of the ankle on its block, behind the hip.
   *
   * @param hip The hip joints' midpoint.
   * @param ankle The rear ankle on its block, whose height it keeps.
   * @param thigh The thigh, metres.
   * @param shank The shank, metres.
   * @param angle The rear knee's included angle, degrees.
   * @returns The ankle's place along the run, metres; none when the hip stands beyond that leg's reach of the ankle's height.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The law of cosines for the leg's hip-to-ankle distance and Pythagoras for its run.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two closed forms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A height beyond the leg's reach returns none rather than a clamped place.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads only its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States the construction, units and the empty case.
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

/** A unit direction turned counterclockwise in the plane (toward up from along) by `angle` radians. */
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

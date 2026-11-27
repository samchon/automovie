import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingBody } from "../../striking/internal/StrikingBody";

/**
 * How far above the crown the loop's plane passes, metres (provisional: clear
 * of the hair).
 */
const CLEAR: number = 0.06;

/**
 * How far off the chest the loop's front rests beyond the holding hands'
 * clearance (`IProps.clearance`), metres: half a pendant's thickness.
 */
const REST: number = 0.003;

/** How finely the front's fall is searched, degrees. */
const STEP: number = 1;

/** Refuse an unresolved sweep within one hundredth of the skin distance. */
const SWEEP_RESOLUTION: number = AutoMovieMotionHumanAuditSkin.BUILT / 100;

/** The model's up, along which a loop's normal lies. */
const NORMAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The model's forward, from a loop's back toward its front. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The path of a neck loop set over a partner's head, as frames of the loop,
 * from where the hand holds it to where it is worn.
 *
 * The partner's head is read where it is: the crown, the nape, the throat and
 * the sternum regions on the displayed bones. The neck's axis runs from the
 * middle of the nape and the throat up to the crown; the head's forward is the
 * nape-to-throat direction across it. Five frames, each reached on a
 * minimum-jerk share of its own segment, the segments shared out by the
 * distance their pivot travels: the loop as the hands hold it; level above the
 * crown, `CLEAR` over it, its centre on the neck's axis and its front toward
 * the face; level around the neck, centred on the axis; slid back till its back
 * point lies on the nape; turned until its front clears the chest and both
 * grips clear the shoulders. Where both grips cannot settle at the nape, the
 * assisting hand releases after the loop clears the head. The carrier alone
 * then translates and pitches it to the nape on one segment.
 */
export namespace placeOverHeadPath {
  /** What the path is prepared from. */
  export interface IProps {
    /** The loop's world frame as the hand holds it at entry. */
    start: IAutoMovieRigidTransform;

    /** The loop's back point (`wear`) in its own frame, metres. */
    wear: IAutoMovieVector3;

    /** The loop's front (`front`) in its own frame, metres. */
    front: IAutoMovieVector3;

    /** The loop's centre, the middle of its `opening`, in its own frame, metres. */
    centre: IAutoMovieVector3;

    /** Half the opening's clear breadth, metres. */
    halfBreadth: number;

    /** The partner's body. */
    body: IAutoMovieMotionHumanBody;

    /** The partner's displayed bones where the path is read. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /**
     * How far off the chest the hands holding the loop's front must stay,
     * metres: the gripping hand's depth below its handle and the audit's skin.
     */
    clearance: number;

    /** Prepared geometric distances of the chosen hands and rigid loop. */
    handGap?: IHandGap;
  }

  /** The checked parts as measurements of a candidate rigid loop frame. */
  export interface IHandGap {
    /** Geometric gap of both grips to the partner's shoulders and chest. */
    shoulders: (frame: IAutoMovieRigidTransform) => number;

    /** Sweeps are available when the loop declares its collision shapes. */
    sweeps?: {
      /** Passage around the head, when both hands hold the loop. */
      assisted: ISweep;

      /** Final placement by the carrier alone. */
      carried: ISweep;
    };
  }

  /** Signed gap and maximum distance of any checked point from a pivot. */
  export interface ISweep {
    /** The distance to the nearest obstacle at a placed frame, metres. */
    gap: (frame: IAutoMovieRigidTransform) => number;

    /** A bound on the distance of any checked point from a local pivot. */
    radius: (pivot: IAutoMovieVector3) => number;
  }

  /** The prepared path. */
  export interface IPath {
    /** The loop's frame at a progress in [0, 1]. */
    at: (progress: number) => IAutoMovieRigidTransform;

    /** The frame above the crown, where the hands reach highest. */
    apex: IAutoMovieRigidTransform;

    /** The worn frame. */
    worn: IAutoMovieRigidTransform;

    /** The length the pivots travel, metres. */
    length: number;

    /** Where the assisting hand releases, as a fraction of the stroke. */
    assistUntil?: number;
  }

  /**
   * The terminal angle at or below the material's fall that leaves both hands
   * the audit skin's distance from the partner. Probe upward from the preferred
   * angle, then refine the first crossing bracket.
   *
   * @param limit The angle permitted by the medal and chest, in degrees.
   * @param gap The smaller of the hands' signed clearances at the angle, in
   *   metres.
   * @returns The admitted terminal angle, or undefined when no bracket clears.
   */
  export function settledFall(
    limit: number,
    gap: (degrees: number) => number,
  ): number | undefined {
    const clear = (degrees: number): boolean =>
      gap(degrees) >= AutoMovieMotionHumanAuditSkin.BUILT;
    if (clear(limit)) return limit;
    let off: number = Math.max(0, limit - STEP);
    while (off > 0 && !clear(off)) off = Math.max(0, off - STEP);
    if (!clear(off)) return undefined;
    let on: number = Math.min(limit, off + STEP);
    for (let i: number = 0; i < 40; ++i) {
      const mid: number = (off + on) / 2;
      if (clear(mid)) off = mid;
      else on = mid;
    }
    return off;
  }

  /**
   * Arc length of the loop's front as it falls about the side-to-side axis
   * through the nape.
   *
   * @param front The front point in the loop's frame.
   * @param wear The fixed nape point in the loop's frame.
   * @param degrees The fall angle in degrees.
   * @returns Metres travelled by the front.
   */
  export function fallArc(
    front: IAutoMovieVector3,
    wear: IAutoMovieVector3,
    degrees: number,
  ): number {
    const radius: number = Math.hypot(front.y - wear.y, front.z - wear.z);
    return (radius * degrees * Math.PI) / 180;
  }

  /**
   * Certify the whole span of a signed-distance function by subdivision. A
   * signed distance changes by at most the distance its probe travels, and the
   * minimum of such distances inherits the same bound. The midpoint's remaining
   * margin therefore covers a whole subspan when it exceeds the maximum probe
   * travel from that midpoint to either end.
   *
   * @param gap The minimum signed distance along a uniform parameter.
   * @param travel The largest change in probe position per unit parameter.
   * @param minimum The required clearance, metres.
   * @returns Whether all points of the span have the clearance.
   */
  export function clearsSweep(
    gap: (share: number) => number,
    travel: number,
    minimum: number,
  ): boolean {
    const check = (from: number, to: number): boolean => {
      const mid: number = (from + to) / 2;
      const margin: number = gap(mid) - minimum;
      const movement: number = (travel * (to - from)) / 2;
      if (margin >= movement) return true;
      return (
        margin >= 0 &&
        movement > SWEEP_RESOLUTION &&
        check(from, mid) &&
        check(mid, to)
      );
    };
    return gap(0) >= minimum && gap(1) >= minimum && check(0, 1);
  }

  /**
   * Prepare the path.
   *
   * @param props The loop and the partner.
   * @returns The path.
   */
  export function prepare(props: IProps): IPath {
    const region = (
      name: AutoMovieHumanoidRegion,
    ): ReturnType<typeof StrikingBody.region> =>
      StrikingBody.region(props.body, props.bones, name);
    const crown: IAutoMovieVector3 = region("crown").point;
    const nape: IAutoMovieVector3 = region("nape").point;
    const throat: IAutoMovieVector3 = region("throat").point;
    const chest: ReturnType<typeof StrikingBody.region> = region("sternum");
    const neck: IAutoMovieVector3 = Vector3.lerp(nape, throat, 0.5);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(crown, neck),
    );
    const across: IAutoMovieVector3 = Vector3.subtract(throat, nape);
    const forward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(across, Vector3.scale(up, Vector3.dot(across, up))),
    );
    const level: IAutoMovieQuaternion = HumanHand.align(
      { normal: NORMAL, forward: FORWARD },
      { normal: up, forward },
    );
    // The front's fall about the nape's side-to-side axis.
    const side: IAutoMovieVector3 = Quaternion.rotateVector(level, {
      x: 1,
      y: 0,
      z: 0,
    });
    const tilted = (degrees: number): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(Quaternion.fromAxisAngle(side, degrees), level),
      );
    const atFall = (degrees: number): IAutoMovieRigidTransform =>
      aligned(tilted(degrees), props.wear, nape);
    const gap = (degrees: number): number => {
      const frame: IAutoMovieRigidTransform = atFall(degrees);
      const front: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, props.front),
      );
      return (
        Vector3.dot(Vector3.subtract(front, chest.point), chest.normal) -
        REST -
        props.clearance
      );
    };
    // The hands hold the front until the loop is worn, so its front comes no
    // nearer the chest than they can: a loop whose front is already within
    // that clearance when level cannot be lowered onto the chest by hand.
    if (gap(0) <= 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: gap(0) + REST + props.clearance,
        feasible: {
          kind: "range",
          minimum: REST + props.clearance,
          maximum: null,
          unit: "m",
        },
        reason: `the loop's front, held level at the nape, lies within the holding hands' clearance of ${(1000 * (REST + props.clearance)).toFixed(0)} mm off the partner's chest`,
        fix: "use a loop whose front hangs farther from the nape",
      });
    let fall: number = 90;
    for (let d: number = STEP; d <= 90; d += STEP)
      if (gap(d) <= 0) {
        let lo: number = Math.max(0, d - STEP);
        let hi: number = d;
        for (let i: number = 0; i < 40; ++i) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) > 0) lo = mid;
          else hi = mid;
        }
        fall = lo;
        break;
      }
    const apex: IKey = {
      frame: aligned(
        level,
        props.centre,
        Vector3.add(crown, Vector3.scale(up, CLEAR)),
      ),
      pivot: props.centre,
    };
    let neckKey: IKey = {
      frame: aligned(level, props.centre, neck),
      pivot: props.wear,
    };
    const handGap: IProps["handGap"] = props.handGap;
    let released: boolean = false;
    if (handGap !== undefined) {
      const settled: number | undefined = settledFall(
        fall,
        (degrees: number): number => handGap.shoulders(atFall(degrees)),
      );
      if (settled !== undefined) fall = settled;
      else {
        // Use half the opening's spare radial clearance to pass behind the
        // head. Check the complete passage before letting the assistant go.
        const spare: number = props.halfBreadth - props.body.measure.headRadius;
        const behind: IAutoMovieVector3 = Vector3.subtract(
          neck,
          Vector3.scale(forward, spare / 2),
        );
        neckKey = {
          frame: aligned(level, props.centre, behind),
          pivot: props.wear,
        };
        const sweeps: IHandGap["sweeps"] = handGap.sweeps;
        const carrierFall: number | undefined =
          sweeps !== undefined && clear(apex, neckKey, sweeps.assisted)
            ? carriedFall(neckKey, fall, atFall, sweeps.carried)
            : undefined;
        if (carrierFall === undefined)
          throw new HumanRefusal({
            kind: "reach",
            axis: "prop",
            value: handGap.shoulders(atFall(0)),
            reason:
              "the loop cannot clear the partner during handover at the nape",
            fix: "use a loop whose grips reach farther from the partner or adjust their entry pose",
          });
        fall = carrierFall;
        released = true;
      }
    }
    const worn: IAutoMovieRigidTransform = atFall(fall);
    const keys: IKey[] = [
      { frame: props.start, pivot: props.centre },
      apex,
      neckKey,
    ];
    if (!released) keys.push({ frame: atFall(0), pivot: props.wear });
    keys.push({ frame: worn, pivot: props.wear });

    // The last segment includes the front's travel about the nape as well
    // as any translation of the pivot.
    const turnLength: number = fallArc(props.front, props.wear, fall);
    const lengths: number[] = keys
      .slice(0, -1)
      .map((key: IKey, i: number): number => {
        const final: boolean = i + 2 === keys.length;
        if (final && !released) return Math.max(1e-6, turnLength);
        const travel: number = Vector3.distance(
          pivotOf(key.frame, key.pivot),
          pivotOf(keys[i + 1]!.frame, key.pivot),
        );
        return Math.max(1e-6, travel + (final ? turnLength : 0));
      });
    const total: number = lengths.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    return {
      apex: keys[1]!.frame,
      worn,
      length: total,
      ...(released ? { assistUntil: 1 - lengths.at(-1)! / total } : {}),
      at: (progress: number): IAutoMovieRigidTransform => {
        let left: number = Math.min(1, Math.max(0, progress)) * total;
        for (let i: number = 0; i < lengths.length; ++i) {
          if (left <= lengths[i]! || i === lengths.length - 1) {
            const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
              Math.min(1, left / lengths[i]!),
            );
            const a: IKey = keys[i]!;
            const b: IKey = keys[i + 1]!;
            return between(a, b, s);
          }
          left -= lengths[i]!;
        }
        return worn;
      },
    };
  }

  /** One key frame and the loop point it pivots on into the next. */
  interface IKey {
    /** The loop's world frame. */
    frame: IAutoMovieRigidTransform;

    /** The loop point, in its own frame, the segment from this key pivots on. */
    pivot: IAutoMovieVector3;
  }

  /** Check a translation of the pivot combined with the shortest rotation. */
  function clear(a: IKey, b: IKey, sweep: ISweep): boolean {
    const travel: number =
      Vector3.distance(pivotOf(a.frame, a.pivot), pivotOf(b.frame, a.pivot)) +
      sweep.radius(a.pivot) *
        Quaternion.angle(a.frame.rotation, b.frame.rotation);
    return clearsSweep(
      (share: number): number => sweep.gap(between(a, b, share)),
      travel,
      AutoMovieMotionHumanAuditSkin.BUILT,
    );
  }

  /** The carrier slides the released loop forward as its front descends. */
  function carriedFall(
    neck: IKey,
    limit: number,
    atFall: (degrees: number) => IAutoMovieRigidTransform,
    carrier: ISweep,
  ): number | undefined {
    for (let degrees: number = limit; ; degrees = Math.max(0, degrees - STEP)) {
      if (clear(neck, { frame: atFall(degrees), pivot: neck.pivot }, carrier))
        return degrees;
      if (degrees === 0) return undefined;
    }
  }

  /** The same uniform motion is used by the certificate and the path. */
  function between(a: IKey, b: IKey, share: number): IAutoMovieRigidTransform {
    return aligned(
      Quaternion.slerp(a.frame.rotation, b.frame.rotation, share),
      a.pivot,
      Vector3.lerp(pivotOf(a.frame, a.pivot), pivotOf(b.frame, a.pivot), share),
    );
  }
}

/** Put a loop's local pivot on the world anchor under the chosen rotation. */
function aligned(
  rotation: IAutoMovieQuaternion,
  local: IAutoMovieVector3,
  world: IAutoMovieVector3,
): IAutoMovieRigidTransform {
  return {
    position: Vector3.subtract(world, Quaternion.rotateVector(rotation, local)),
    rotation,
  };
}

/** A loop point's world place on a frame. */
function pivotOf(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}

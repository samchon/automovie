import {
  type IAutoMovieCameraFrameEntry,
  IAutoMovieClip,
  type IAutoMovieCompileCameraMove,
  IAutoMovieProductionFrameRate,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { ease } from "../../motion/internal/ease";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";
import { AutoMovieEngineFramingAimFraction } from "../AutoMovieEngineFramingAimFraction";
import { AutoMovieEngineFramingHeightFraction } from "../AutoMovieEngineFramingHeightFraction";
import { lookRotation } from "./lookRotation";

/*
 * Compile a camera's `frame` entries into one clip of its world translation and
 * rotation, the deterministic shot grammar.
 *
 * Framing fixes the distance and the aim. The frame must show the framing's
 * AutoMovieEngineFramingHeightFraction multiple of the subject's height vertically
 * and of its width (twice `radius`) horizontally, each by the pinhole fit `d =
 * (visible / 2) / tan(half-angle)`, and the camera stands at whichever distance
 * is larger. It aims at AutoMovieEngineFramingAimFraction of the height above the
 * subject's base. The camera approaches along its staged bearing, the direction
 * from the aim point to the staged camera, so the side staging chose is kept
 * and only the distance is solved; a camera staged on the aim point uses +Z.
 *
 * Move picks the path over the span `[start, start + duration]`, clipped to the
 * shot, where an `"auto"` duration runs to the next entry's start or the shot
 * end:
 *
 * - `static` holds one framed key at the start.
 * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in and
 *   out.
 * - `orbit` swings 45 degrees about world up around the start aim, eased in and
 *   out.
 * - `truck` slides one framed distance toward the camera's screen-left while
 *   looking at the subject, eased in and out and riding the subject's animated
 *   base when it has one; a camera staged straight above or below uses world -X
 *   as screen-left.
 * - `follow` re-frames against the animated base at every key, or holds one
 *   framed key for an unsampled subject. Authored lookahead changes aim by
 *   reading the subject ahead of the key time up to the shot end. Translation
 *   uses the current sample.
 * - `whip` keeps the staged position and turns from the staged rotation onto the
 *   aim within 0.2 seconds, without solving a distance.
 *
 * Push-in, orbit, truck and follow are keyed at the span's ends and at every
 * delivery frame between them, the shot-local instants `k × denominator /
 * numerator` of `frameRate`. Keys are linear, so each delivered frame lands on
 * the path itself and the speed between frames is the eased path's own, with no
 * step from coarser sampling.
 *
 * An entry that is followed by another holds its last pose until its span ends.
 * An entry that starts where an earlier entry of positive span ended continues
 * from the pose the camera reached, taking its bearing and starting distance
 * from that position. A push-in, orbit, truck or sampled follow then eases from
 * the reached distance to its own framing's end distance, 0.8 times the framed
 * distance for a push-in and the framed distance otherwise, so it reverses only
 * when that authored end lies farther out. A static entry, or a follow of an
 * unsampled subject, keeps the reached pose under the previous entry's framing;
 * under a different framing, an authored re-frame, it takes its own framed
 * distance. A continuing entry whose first pose differs from the reached one,
 * by a re-frame or a new aim, steps there: the reached pose stays as its own
 * key 1e-6 s before the start, so the change is not spread over the previous
 * entry. A gap between two entries plays as a linear re-frame. A key landing
 * within 1e-9 s of the previous one otherwise replaces it, so a later entry at
 * the same instant as a zero-span one wins. Entries must be sorted by `start`
 * and must not overlap, which `performShot` checks. Returns null for no
 * entries, and throws an `Error` for a framing or move outside the grammar, an
 * invalid `frameRate`, or a frame index that is not a safe integer.
 * Parameter props.clipId: - Id the returned clip carries.
 * Parameter props.camera: - The staged camera: its id names the tracks, its
 * vertical field of view sets the fit, and its transform sets the bearing and
 * the whip's position.
 * Parameter props.entries: - Frame actions with their resolved subjects.
 * Parameter props.shotDuration: - Shot length in seconds; the clip's duration.
 * Parameter props.aspect: - Frame width over height for the horizontal fit. A
 * camera states only its vertical field of view, so without this a subject
 * with a `radius` cannot be fitted across the delivered frame. Omitted,
 * non-finite or non-positive, it is 1, an assumed square frame; a narrower
 * portrait output requires its actual aspect and is not bounded by that
 * fallback. A subject with no `radius` is unaffected.
 * Parameter props.frameRate: - Exact delivery frame rate the moving paths are keyed
 * at; omitted, 24 frames per second.
 */
export function compileCameraMove(
  props: IAutoMovieCompileCameraMove.IProps,
): IAutoMovieClip | null {
  const { clipId, camera, entries, shotDuration }: typeof props = props;
  if (entries.length === 0) return null;
  const halfY: number = Math.tan(((camera.fovY / 2) * Math.PI) / 180);
  const aspect: number =
    props.aspect !== undefined && props.aspect > 0 ? props.aspect : 1;
  const halfX: number = halfY * aspect;
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate ?? FALLBACK_FRAME_RATE,
  );

  const keys: IKey[] = [];
  function push(
    t: number,
    pos: IAutoMovieVector3,
    rot: IAutoMovieQuaternion,
  ): void {
    const last: IKey | undefined = keys[keys.length - 1];
    // A zero-width segment would divide the sampler's local time by zero.
    if (last !== undefined && t <= last.t + SAME_INSTANT)
      keys[keys.length - 1] = { t: last.t, pos, rot };
    else keys.push({ t, pos, rot });
  }

  /*
   * Start an entry at `t`: from a reached pose it differs from, keep that pose
   * as its own key just before `t`, so the change is a step at `t` and not a
   * ramp across the previous entry, which replacing the reached key would be.
   */
  function begin(
    t: number,
    pos: IAutoMovieVector3,
    rot: IAutoMovieQuaternion,
    reached: IKey | null,
  ): void {
    if (reached === null || samePose(reached, pos, rot)) {
      push(t, pos, rot);
      return;
    }
    const prior: IKey | undefined = keys[keys.length - 2];
    const before: number =
      prior === undefined
        ? t - STEP_SECONDS
        : Math.max(t - STEP_SECONDS, (prior.t + t) / 2);
    keys[keys.length - 1] = { t: before, pos: reached.pos, rot: reached.rot };
    keys.push({ t, pos, rot });
  }

  // The previous entry's span and framing; its last key is the pose the
  // camera reached when it ends.
  let previous: {
    t0: number;
    t1: number;
    framing: IAutoMovieCameraFrameEntry["action"]["framing"];
  } | null = null;
  entries.forEach((entry: IAutoMovieCameraFrameEntry, i: number): void => {
    const { action, subject }: IAutoMovieCameraFrameEntry = entry;
    const t0: number = action.start;
    const t1: number =
      action.duration === "auto"
        ? (entries[i + 1]?.action.start ?? shotDuration)
        : Math.min(t0 + action.duration, shotDuration);
    const reached: IKey | null =
      previous !== null &&
      previous.t1 > previous.t0 + SAME_INSTANT &&
      t0 <= previous.t1 + SAME_INSTANT
        ? keys[keys.length - 1]!
        : null;
    const reframed: boolean =
      previous !== null && previous.framing !== action.framing;
    previous = { t0, t1, framing: action.framing };

    if (
      !Object.prototype.hasOwnProperty.call(
        AutoMovieEngineFramingAimFraction,
        action.framing,
      )
    )
      throw new Error(`unknown camera framing "${String(action.framing)}"`);
    const aimOffset: number =
      subject.height * AutoMovieEngineFramingAimFraction[action.framing];
    function aimOf(base: IAutoMovieVector3): IAutoMovieVector3 {
      return {
        x: base.x,
        y: base.y + aimOffset,
        z: base.z,
      };
    }
    const aim0: IAutoMovieVector3 = aimOf(subject.base);
    if (action.move === "whip") {
      const origin: IKey = reached ?? {
        t: t0,
        pos: camera.transform.translation,
        rot: camera.transform.rotation,
      };
      push(t0, origin.pos, origin.rot);
      push(
        Math.min(t0 + WHIP_SECONDS, t1),
        origin.pos,
        lookRotation(AutoMovieEngineVector3.subtract(aim0, origin.pos)),
      );
      holdUntil(t1, i);
      return;
    }

    // A figure binds on height and a mass on width; `radius` is absent or zero
    // for a single body, which leaves the vertical fit alone.
    const fraction: number = AutoMovieEngineFramingHeightFraction[action.framing];
    const width: number = (subject.radius ?? 0) * 2;
    const distance: number = Math.max(
      (subject.height * fraction) / 2 / halfY,
      (width * fraction) / 2 / halfX,
    );

    // A continuing entry starts at the reached offset from its own aim. A
    // moving one eases from that distance to its own framing's end distance,
    // so it reverses only when that authored end lies farther out. A hold
    // keeps the reached distance unless its framing differs from the previous
    // entry's, an authored re-frame that steps to its own framed distance.
    const toReached: IAutoMovieVector3 | null =
      reached === null ? null : AutoMovieEngineVector3.subtract(reached.pos, aim0);
    const reach: number = toReached === null ? 0 : AutoMovieEngineVector3.length(toReached);
    const continues: boolean = reach >= SAME_INSTANT;
    const holds: boolean =
      action.move === "static" ||
      (action.move === "follow" && subject.at === null);
    const fromDistance: number =
      continues && !(holds && reframed)
        ? reach
        : action.move === "push-in"
          ? distance * PUSH_IN_FROM
          : distance;
    const toDistance: number = holds
      ? fromDistance
      : action.move === "push-in"
        ? distance * PUSH_IN_TO
        : distance;

    const toCamera: IAutoMovieVector3 = continues
      ? toReached!
      : AutoMovieEngineVector3.subtract(camera.transform.translation, aim0);
    const bearing: IAutoMovieVector3 =
      AutoMovieEngineVector3.length(toCamera) < 1e-9
        ? { x: 0, y: 0, z: 1 }
        : AutoMovieEngineVector3.normalize(toCamera);
    const side: IAutoMovieVector3 = AutoMovieEngineVector3.cross(bearing, UP);
    const screenLeft: IAutoMovieVector3 =
      AutoMovieEngineVector3.length(side) < 1e-9
        ? { x: -1, y: 0, z: 0 }
        : AutoMovieEngineVector3.normalize(side);

    /*
     * Fit position to the current base and orient toward the selected aim base.
     */
    function framedAt(
      base: IAutoMovieVector3,
      d: number,
      aimBase: IAutoMovieVector3 = base,
    ): IKey {
      const aim: IAutoMovieVector3 = aimOf(base);
      const pos: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        aim,
        AutoMovieEngineVector3.scale(bearing, d),
      );
      const target: IAutoMovieVector3 = aimBase === base ? aim : aimOf(aimBase);
      return { t: 0, pos, rot: lookRotation(AutoMovieEngineVector3.subtract(target, pos)) };
    }

    /*
     * Eased progress of a key time through the span; a zero span is complete.
     */
    function eased(t: number): number {
      return ease("easeInOut", t1 > t0 ? (t - t0) / (t1 - t0) : 1);
    }

    /*
     * Camera distance from the aim at a key time, eased from start to end.
     */
    function distanceAt(t: number): number {
      return fromDistance + (toDistance - fromDistance) * eased(t);
    }

    /*
     * Write one key, the span's first through begin.
     */
    function key(
      t: number,
      pos: IAutoMovieVector3,
      rot: IAutoMovieQuaternion,
    ): void {
      if (t === t0) begin(t, pos, rot, reached);
      else push(t, pos, rot);
    }

    switch (action.move) {
      case "static": {
        const k: IKey = framedAt(subject.base, fromDistance);
        key(t0, k.pos, k.rot);
        break;
      }
      case "push-in": {
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const f: IKey = framedAt(subject.base, distanceAt(t));
          key(t, f.pos, f.rot);
        }
        break;
      }
      case "orbit": {
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const swing: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
            UP,
            ORBIT_DEGREES * eased(t),
          );
          const u: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(swing, bearing);
          const pos: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            aim0,
            AutoMovieEngineVector3.scale(u, distanceAt(t)),
          );
          key(t, pos, lookRotation(AutoMovieEngineVector3.subtract(aim0, pos)));
        }
        break;
      }
      case "truck": {
        // Travel is perpendicular to the bearing, so the staged depth holds;
        // stage the camera on the other side for rightward travel.
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const base: IAutoMovieVector3 = subject.at?.(t) ?? subject.base;
          const aim: IAutoMovieVector3 = aimOf(base);
          const pos: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            framedAt(base, distanceAt(t)).pos,
            AutoMovieEngineVector3.scale(screenLeft, distance * TRUCK_DISTANCE * eased(t)),
          );
          key(t, pos, lookRotation(AutoMovieEngineVector3.subtract(aim, pos)));
        }
        break;
      }
      case "follow": {
        if (subject.at === null) {
          const k: IKey = framedAt(subject.base, fromDistance);
          key(t0, k.pos, k.rot);
          break;
        }
        const lookahead: number = action.lookahead ?? 0;
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const base: IAutoMovieVector3 = subject.at(t);
          const aimTime: number = Math.min(t + lookahead, shotDuration);
          // Sample the current base before a future read can reuse its storage.
          const f: IKey =
            aimTime > t
              ? framedAt({ ...base }, distanceAt(t), subject.at(aimTime))
              : framedAt(base, distanceAt(t));
          key(t, f.pos, f.rot);
        }
        break;
      }
      default:
        throw new Error(`unknown camera frame move "${String(action.move)}"`);
    }
    holdUntil(t1, i);
  });

  /*
   * Hold the last pose to a span's end when another entry follows it.
   */
  function holdUntil(t1: number, i: number): void {
    const last: IKey = keys[keys.length - 1]!;
    if (i + 1 < entries.length && t1 > last.t + SAME_INSTANT)
      keys.push({ t: t1, pos: last.pos, rot: last.rot });
  }

  const times: number[] = keys.map((k: IKey): number => k.t);
  return {
    id: clipId,
    name: null,
    duration: shotDuration,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: camera.id, path: "translation" },
        times,
        values: keys.flatMap((k: IKey): number[] => [
          k.pos.x,
          k.pos.y,
          k.pos.z,
        ]),
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: camera.id, path: "rotation" },
        times: [...times],
        values: keys.flatMap((k: IKey): number[] => [
          k.rot.x,
          k.rot.y,
          k.rot.z,
          k.rot.w,
        ]),
        interpolation: "linear",
      },
    ],
  };
}

/*
 * World up: the horizon a camera keeps level.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * A whip pan snaps to its new aim in this many seconds.
 */
const WHIP_SECONDS: number = 0.2;

/*
 * An orbit sweeps this many degrees about world up over its span.
 */
const ORBIT_DEGREES: number = 45;

/*
 * A push-in starts at this multiple of the framed distance.
 */
const PUSH_IN_FROM: number = 1.25;

/*
 * A push-in ends at this multiple of the framed distance.
 */
const PUSH_IN_TO: number = 0.8;

/*
 * A truck crosses this multiple of the framed distance toward screen-left.
 */
const TRUCK_DISTANCE: number = 1;

/*
 * Frame rate the moving paths are keyed at when the caller states no delivery
 * rate: 24 frames per second, the theatrical sound-film rate.
 */
const FALLBACK_FRAME_RATE: IAutoMovieProductionFrameRate = {
  numerator: 24,
  denominator: 1,
};

/*
 * Seconds within which two key times are the same instant.
 */
const SAME_INSTANT: number = 1e-9;

/*
 * Seconds before an entry's start at which a step keeps the reached pose: far
 * above SAME_INSTANT and far below any delivery frame interval, so the
 * frame before the start still shows the reached pose and the frame at the
 * start shows the new one.
 */
const STEP_SECONDS: number = 1e-6;

/*
 * One camera key: shot-local seconds, world position and world rotation.
 */
interface IKey {
  /*
   * Shot-local seconds.
   */
  t: number;

  /*
   * World position in metres.
   */
  pos: IAutoMovieVector3;

  /*
   * World rotation.
   */
  rot: IAutoMovieQuaternion;
}

/*
 * Whether a key already holds a pose: positions within 1e-9 m and rotations
 * within 1e-12 of the same orientation, either quaternion sign.
 */
function samePose(
  key: IKey,
  pos: IAutoMovieVector3,
  rot: IAutoMovieQuaternion,
): boolean {
  const dot: number =
    key.rot.x * rot.x +
    key.rot.y * rot.y +
    key.rot.z * rot.z +
    key.rot.w * rot.w;
  return (
    AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(key.pos, pos)) < 1e-9 &&
    Math.abs(dot) > 1 - 1e-12
  );
}

/*
 * Key times of one moving span: its start, every delivery frame strictly inside
 * it, and its end, in shot-local seconds.
 *
 * Frame `k` sits at `k × denominator / numerator`, the expression the render
 * frame sampler uses, so a delivered frame reads a key rather than a chord
 * between two. A frame within 1e-9 s of either end is left to that end. A zero
 * span gives its start alone. Throws when the first or last frame index is not
 * a safe integer, because the enumeration could then not progress.
 */
function frameKeyTimes(
  t0: number,
  t1: number,
  rate: IAutoMovieProductionFrameRate,
): number[] {
  const times: number[] = [t0];
  if (!(t1 > t0)) return times;
  const first: number = Math.floor((t0 * rate.numerator) / rate.denominator);
  const last: number = Math.ceil((t1 * rate.numerator) / rate.denominator);
  for (let k: number = first; k <= last; ++k) {
    const t: number = (k * rate.denominator) / rate.numerator;
    if (t > t0 + SAME_INSTANT && t < t1 - SAME_INSTANT) times.push(t);
  }
  times.push(t1);
  return times;
}

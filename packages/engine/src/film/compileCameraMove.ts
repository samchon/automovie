import {
  type IAutoMovieCameraFrameEntry,
  IAutoMovieClip,
  type IAutoMovieCompileCameraMove,
  IAutoMovieProductionFrameRate,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ease } from "../motion/ease";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";
import { FRAMING_AIM_FRACTION } from "./constants/FRAMING_AIM_FRACTION";
import { FRAMING_HEIGHT_FRACTION } from "./constants/FRAMING_HEIGHT_FRACTION";
import { lookRotation } from "./lookRotation";

/** World up: the horizon a camera keeps level. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A whip pan snaps to its new aim in this many seconds. */
const WHIP_SECONDS: number = 0.2;

/** An orbit sweeps this many degrees about world up over its span. */
const ORBIT_DEGREES: number = 45;

/** A push-in starts at this multiple of the framed distance. */
const PUSH_IN_FROM: number = 1.25;

/** A push-in ends at this multiple of the framed distance. */
const PUSH_IN_TO: number = 0.8;

/** A truck crosses this multiple of the framed distance toward screen-left. */
const TRUCK_DISTANCE: number = 1;

/**
 * Frame rate the moving paths are keyed at when the caller states no delivery rate: 24 frames per second, the theatrical sound-film rate.
 */
const FALLBACK_FRAME_RATE: IAutoMovieProductionFrameRate = {
  numerator: 24,
  denominator: 1,
};

/** Seconds within which two key times are the same instant. */
const SAME_INSTANT: number = 1e-9;

/**
 * One camera key: shot-local seconds, world position and world rotation.
 */
interface IKey {
  /** Shot-local seconds. */
  t: number;

  /** World position in metres. */
  pos: IAutoMovieVector3;

  /** World rotation. */
  rot: IAutoMovieQuaternion;
}

/**
 * Compile a camera's `frame` entries into one clip of its world translation and rotation, the deterministic shot grammar.
 *
 * Framing fixes the distance and the aim. The frame must show the framing's {@link FRAMING_HEIGHT_FRACTION} multiple of the subject's height vertically and of its width (twice `radius`) horizontally, each by the pinhole fit `d = (visible / 2) / tan(half-angle)`, and the camera stands at whichever distance is larger. It aims at {@link FRAMING_AIM_FRACTION} of the height above the subject's base. The camera approaches along its staged bearing, the direction from the aim point to the staged camera, so the side staging chose is kept and only the distance is solved; a camera staged on the aim point uses +Z.
 *
 * Move picks the path over the span `[start, start + duration]`, clipped to the shot, where an `"auto"` duration runs to the next entry's start or the shot end:
 *
 * - `static` holds one framed key at the start.
 * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in and out.
 * - `orbit` swings 45 degrees about world up around the start aim, eased in and out.
 * - `truck` slides one framed distance toward the camera's screen-left while looking at the subject, eased in and out and riding the subject's animated base when it has one; a camera staged straight above or below uses world -X as screen-left.
 * - `follow` re-frames against the animated base at every key, or holds one framed key for an unsampled subject. Authored lookahead changes aim by reading the subject ahead of the key time up to the shot end. Translation uses the current sample.
 * - `whip` keeps the staged position and turns from the staged rotation onto the aim within 0.2 seconds, without solving a distance.
 *
 * Push-in, orbit, truck and follow are keyed at the span's ends and at every delivery frame between them, the shot-local instants `k × denominator / numerator` of `frameRate`. Keys are linear, so each delivered frame lands on the path itself and the speed between frames is the eased path's own, with no step from coarser sampling.
 *
 * An entry that is followed by another holds its last pose until its span ends. An entry that starts where an earlier entry of positive span ended continues from the pose the camera reached: it takes its bearing and its distance from that position, so a hold keeps it, a push-in dollies in from it and an orbit swings it. Only its rotation re-aims there when its aim differs. A gap between two entries plays as a linear re-frame. A key landing within 1e-9 s of the previous one replaces it, so a later entry at the same instant as a zero-span one wins. Entries must be sorted by `start` and must not overlap, which `performShot` checks. Returns null for no entries, and throws an `Error` for a framing or move outside the grammar, an invalid `frameRate`, or a frame index that is not a safe integer.
 *
 * @param props.clipId - Id the returned clip carries.
 * @param props.camera - The staged camera: its id names the tracks, its vertical field of view sets the fit, and its transform sets the bearing and the whip's position.
 * @param props.entries - Frame actions with their resolved subjects.
 * @param props.shotDuration - Shot length in seconds; the clip's duration.
 * @param props.aspect - Frame width over height for the horizontal fit. A camera states only its vertical field of view, so without this a subject with a `radius` cannot be fitted across the delivered frame. Omitted, non-finite or non-positive, it is 1, an assumed square frame; a narrower portrait output requires its actual aspect and is not bounded by that fallback. A subject with no `radius` is unaffected.
 * @param props.frameRate - Exact delivery frame rate the moving paths are keyed at; omitted, 24 frames per second.
 */
export function compileCameraMove(
  props: IAutoMovieCompileCameraMove.IProps,
): IAutoMovieClip | null {
  const { clipId, camera, entries, shotDuration }: typeof props = props;
  if (entries.length === 0) return null;
  const halfY: number = Math.tan(((camera.fovY / 2) * Math.PI) / 180);
  const aspect: number =
    props.aspect !== undefined &&
    Number.isFinite(props.aspect) &&
    props.aspect > 0
      ? props.aspect
      : 1;
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

  // The span of the previous entry, whose last key is the pose the camera
  // reached when it ends.
  let previous: { t0: number; t1: number } | null = null;
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
    previous = { t0, t1 };

    if (
      !Object.prototype.hasOwnProperty.call(
        FRAMING_AIM_FRACTION,
        action.framing,
      )
    )
      throw new Error(`unknown camera framing "${String(action.framing)}"`);
    const aimOffset: number =
      subject.height * FRAMING_AIM_FRACTION[action.framing];
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
        lookRotation(Vector3.subtract(aim0, origin.pos)),
      );
      holdUntil(t1, i);
      return;
    }

    // A figure binds on height and a mass on width; `radius` is absent or zero
    // for a single body, which leaves the vertical fit alone. A continuing
    // entry instead keeps the reached offset from its aim, read as this move's
    // starting multiple of the framed distance.
    const fraction: number = FRAMING_HEIGHT_FRACTION[action.framing];
    const width: number = (subject.radius ?? 0) * 2;
    const toReached: IAutoMovieVector3 | null =
      reached === null ? null : Vector3.subtract(reached.pos, aim0);
    const reach: number = toReached === null ? 0 : Vector3.length(toReached);
    const continues: boolean = reach >= SAME_INSTANT;
    const distance: number = continues
      ? reach / (action.move === "push-in" ? PUSH_IN_FROM : 1)
      : Math.max(
          (subject.height * fraction) / 2 / halfY,
          (width * fraction) / 2 / halfX,
        );

    const toCamera: IAutoMovieVector3 = continues
      ? toReached!
      : Vector3.subtract(camera.transform.translation, aim0);
    const bearing: IAutoMovieVector3 =
      Vector3.length(toCamera) < 1e-9
        ? { x: 0, y: 0, z: 1 }
        : Vector3.normalize(toCamera);
    const side: IAutoMovieVector3 = Vector3.cross(bearing, UP);
    const screenLeft: IAutoMovieVector3 =
      Vector3.length(side) < 1e-9
        ? { x: -1, y: 0, z: 0 }
        : Vector3.normalize(side);

    /** Fit position to the current base and orient toward the selected aim base. */
    function framedAt(
      base: IAutoMovieVector3,
      d: number,
      aimBase: IAutoMovieVector3 = base,
    ): IKey {
      const aim: IAutoMovieVector3 = aimOf(base);
      const pos: IAutoMovieVector3 = Vector3.add(
        aim,
        Vector3.scale(bearing, d),
      );
      const target: IAutoMovieVector3 = aimBase === base ? aim : aimOf(aimBase);
      return { t: 0, pos, rot: lookRotation(Vector3.subtract(target, pos)) };
    }

    /** Eased progress of a key time through the span; a zero span is complete. */
    function eased(t: number): number {
      return ease("easeInOut", t1 > t0 ? (t - t0) / (t1 - t0) : 1);
    }

    switch (action.move) {
      case "static": {
        const k: IKey = framedAt(subject.base, distance);
        push(t0, k.pos, k.rot);
        break;
      }
      case "push-in": {
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const scale: number =
            PUSH_IN_FROM + (PUSH_IN_TO - PUSH_IN_FROM) * eased(t);
          const f: IKey = framedAt(subject.base, distance * scale);
          push(t, f.pos, f.rot);
        }
        break;
      }
      case "orbit": {
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const swing: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            UP,
            ORBIT_DEGREES * eased(t),
          );
          const u: IAutoMovieVector3 = Quaternion.rotateVector(swing, bearing);
          const pos: IAutoMovieVector3 = Vector3.add(
            aim0,
            Vector3.scale(u, distance),
          );
          push(t, pos, lookRotation(Vector3.subtract(aim0, pos)));
        }
        break;
      }
      case "truck": {
        // Travel is perpendicular to the bearing, so the staged depth holds;
        // stage the camera on the other side for rightward travel.
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const base: IAutoMovieVector3 = subject.at?.(t) ?? subject.base;
          const aim: IAutoMovieVector3 = aimOf(base);
          const pos: IAutoMovieVector3 = Vector3.add(
            framedAt(base, distance).pos,
            Vector3.scale(screenLeft, distance * TRUCK_DISTANCE * eased(t)),
          );
          push(t, pos, lookRotation(Vector3.subtract(aim, pos)));
        }
        break;
      }
      case "follow": {
        if (subject.at === null) {
          const k: IKey = framedAt(subject.base, distance);
          push(t0, k.pos, k.rot);
          break;
        }
        const lookahead: number = action.lookahead ?? 0;
        for (const t of frameKeyTimes(t0, t1, rate)) {
          const base: IAutoMovieVector3 = subject.at(t);
          const aimTime: number = Math.min(t + lookahead, shotDuration);
          // Sample the current base before a future read can reuse its storage.
          const f: IKey =
            aimTime > t
              ? framedAt({ ...base }, distance, subject.at(aimTime))
              : framedAt(base, distance);
          push(t, f.pos, f.rot);
        }
        break;
      }
      default:
        throw new Error(`unknown camera frame move "${String(action.move)}"`);
    }
    holdUntil(t1, i);
  });

  /** Hold the last pose to a span's end when another entry follows it. */
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

/**
 * Key times of one moving span: its start, every delivery frame strictly inside it, and its end, in shot-local seconds.
 *
 * Frame `k` sits at `k × denominator / numerator`, the expression the render frame sampler uses, so a delivered frame reads a key rather than a chord between two. A frame within 1e-9 s of either end is left to that end. A zero span gives its start alone. Throws when the first or last frame index is not a safe integer, because the enumeration could then not progress.
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
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last))
    throw new Error(
      "camera move cannot enumerate a frame index that is not a safe integer",
    );
  for (let k: number = first; k <= last; ++k) {
    const t: number = (k * rate.denominator) / rate.numerator;
    if (t > t0 + SAME_INSTANT && t < t1 - SAME_INSTANT) times.push(t);
  }
  times.push(t1);
  return times;
}

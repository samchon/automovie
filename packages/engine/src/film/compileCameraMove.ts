import {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ease } from "../motion/ease";
import { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";
import { FRAMING_AIM_FRACTION } from "./constants/FRAMING_AIM_FRACTION";
import { FRAMING_HEIGHT_FRACTION } from "./constants/FRAMING_HEIGHT_FRACTION";
import { lookRotation } from "./lookRotation";

/** World up: the horizon a camera keeps level. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A whip pan snaps to its new aim in this many seconds. */
const WHIP_SECONDS: number = 0.2;

/** An orbit sweeps this many degrees about world up over its span. */
const ORBIT_DEGREES: number = 45;

/** Key segments an orbit is sampled at. */
const ORBIT_SEGMENTS: number = 8;

/** A push-in starts at this multiple of the framed distance. */
const PUSH_IN_FROM: number = 1.25;

/** A push-in ends at this multiple of the framed distance. */
const PUSH_IN_TO: number = 0.8;

/** Key segments a push-in's eased dolly is sampled at. */
const PUSH_IN_SEGMENTS: number = 8;

/** A truck crosses this multiple of the framed distance toward screen-left. */
const TRUCK_DISTANCE: number = 1;

/** Key segments a truck is sampled at. */
const TRUCK_SEGMENTS: number = 8;

/** Follow moves sample the subject's animated base at this rate, in hertz. */
const FOLLOW_HZ: number = 4;

/** One camera key: shot-local seconds, world position and world rotation. */
interface IKey {
  /** Shot-local seconds. */
  t: number;

  /** World position in metres. */
  pos: IAutoMovieVector3;

  /** World rotation. */
  rot: IAutoMovieQuaternion;
}

/**
 * Compile a camera's `frame` entries into one clip of its world translation and
 * rotation, the deterministic shot grammar.
 *
 * Framing fixes the distance and the aim. The frame must show the framing's
 * {@link FRAMING_HEIGHT_FRACTION} multiple of the subject's height vertically
 * and of its width (twice `radius`) horizontally, each by the pinhole fit
 * `d = (visible / 2) / tan(half-angle)`, and the camera stands at whichever
 * distance is larger. It aims at {@link FRAMING_AIM_FRACTION} of the height
 * above the subject's base. The camera approaches along its staged bearing,
 * the direction from the aim point to the staged camera, so the side staging
 * chose is kept and only the distance is solved; a camera staged on the aim
 * point uses +Z.
 *
 * Move picks the path over the span `[start, start + duration]`, clipped to the
 * shot, where an `"auto"` duration runs to the next entry's start or the shot
 * end:
 *
 * - `static` holds one framed key at the start.
 * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in
 *   and out over eight segments.
 * - `orbit` swings 45 degrees about world up around the start aim, eased over
 *   eight segments.
 * - `truck` slides one framed distance toward the camera's screen-left while
 *   looking at the subject, eased over eight segments and riding the subject's
 *   animated base when it has one; a camera staged straight above or below
 *   uses world -X as screen-left.
 * - `follow` re-frames against the animated base at 4 Hz, at least two keys,
 *   or holds one framed key when the subject does not move.
 * - `whip` keeps the staged position and turns from the staged rotation onto
 *   the aim within 0.2 seconds, without solving a distance.
 *
 * Keys are linear, so the gap between two entries plays as a re-frame move,
 * and a key landing within 1e-9 s of the previous one replaces it, the later
 * framing winning. Entries must be sorted by `start` and must not overlap,
 * which `performShot` checks. Returns null for no entries, and throws an
 * `Error` for a framing or move outside the grammar.
 *
 * @param props.clipId - Id the returned clip carries.
 * @param props.camera - The staged camera: its id names the tracks, its
 *   vertical field of view sets the fit, and its transform sets the bearing
 *   and the whip's position.
 * @param props.entries - Frame actions with their resolved subjects.
 * @param props.shotDuration - Shot length in seconds; the clip's duration.
 * @param props.aspect - Frame width over height for the horizontal fit. A
 *   camera states only its vertical field of view, so without this a subject
 *   with a `radius` cannot be fitted across the frame. Omitted, non-finite or
 *   non-positive, it is 1, a square frame, the narrowest any raster of that
 *   height has, so an unknown aspect pulls back rather than crops. A subject
 *   with no `radius` is unaffected.
 *
 * @evidence contracts/common.md#principled-implementation The distance is the pinhole fit on each axis with the binding axis winning, the aim and path are look-at rotations along the staged bearing, and eased segments are sampled into linear keys; the premises are a valid positive vertical field of view, which scene validation guarantees, and sorted non-overlapping entries, which `performShot` gates, and the limitation is that the linear keys approximate the eased orbit arc between its eight samples.
 * @evidence contracts/common.md#clear-and-simple-design One compiler owns the whole framing grammar and every move's path, keyed into one two-track clip; resolving subjects belongs to `performShot` and the grammar tables to their constants, and coverage takes reuse this function with their own camera.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no subject or camera; the +Z bearing and world -X screen-left are stated fallbacks for geometrically undefined directions, and an unknown framing or move throws instead of falling back to a default.
 * @evidence contracts/common.md#meaningful-documentation States the distance and aim solve, the bearing rule and its fallback, each move's path with its constants, span and auto-duration rules, key merging, the input preconditions, the null and error returns, and each parameter's role, units and default.
 * @evidence contracts/performance.md#efficient-algorithms Linear in entries times keys per move, where every move has at most nine keys except `follow`, which has four per second of its span; each key costs one look rotation, and the two tracks are built in one pass over the keys each.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one camera's entries, called once per take; the hero and coverage takes have different cameras and entries, so nothing is shared between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the key list is a local bounded by the keys above, and the returned clip is a fresh value owned by the caller.
 */
export function compileCameraMove (props: {
  clipId: string;
  camera: IAutoMovieCamera;
  entries: IAutoMovieCameraFrameEntry[];
  shotDuration: number;
  aspect?: number;
}): IAutoMovieClip | null {
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

  const keys: IKey[] = [];
  function push (
    t: number,
    pos: IAutoMovieVector3,
    rot: IAutoMovieQuaternion,
  ): void {
    const last: IKey | undefined = keys[keys.length - 1];
    // A zero-width segment would divide the sampler's local time by zero.
    if (last !== undefined && t <= last.t + 1e-9)
      keys[keys.length - 1] = { t: last.t, pos, rot };
    else keys.push({ t, pos, rot });
  }

  entries.forEach((entry: IAutoMovieCameraFrameEntry, i: number): void => {
    const { action, subject }: IAutoMovieCameraFrameEntry = entry;
    const t0: number = action.start;
    const t1: number =
      action.duration === "auto"
        ? (entries[i + 1]?.action.start ?? shotDuration)
        : Math.min(t0 + action.duration, shotDuration);

    if (
      !Object.prototype.hasOwnProperty.call(
        FRAMING_AIM_FRACTION,
        action.framing,
      )
    )
      throw new Error(`unknown camera framing "${String(action.framing)}"`);
    const aimOffset: number =
      subject.height * FRAMING_AIM_FRACTION[action.framing];
    function aimOf (base: IAutoMovieVector3): IAutoMovieVector3 { return ({
      x: base.x,
      y: base.y + aimOffset,
      z: base.z,
    }); }
    const aim0: IAutoMovieVector3 = aimOf(subject.base);
    if (action.move === "whip") {
      push(t0, camera.transform.translation, camera.transform.rotation);
      push(
        Math.min(t0 + WHIP_SECONDS, t1),
        camera.transform.translation,
        lookRotation(Vector3.subtract(aim0, camera.transform.translation)),
      );
      return;
    }

    // A figure binds on height and a mass on width; `radius` is absent or zero
    // for a single body, which leaves the vertical fit alone.
    const fraction: number = FRAMING_HEIGHT_FRACTION[action.framing];
    const width: number = (subject.radius ?? 0) * 2;
    const distance: number = Math.max(
      (subject.height * fraction) / 2 / halfY,
      (width * fraction) / 2 / halfX,
    );

    const toCamera: IAutoMovieVector3 = Vector3.subtract(
      camera.transform.translation,
      aim0,
    );
    const bearing: IAutoMovieVector3 =
      Vector3.length(toCamera) < 1e-9
        ? { x: 0, y: 0, z: 1 }
        : Vector3.normalize(toCamera);
    const side: IAutoMovieVector3 = Vector3.cross(bearing, UP);
    const screenLeft: IAutoMovieVector3 =
      Vector3.length(side) < 1e-9
        ? { x: -1, y: 0, z: 0 }
        : Vector3.normalize(side);

    function framedAt (base: IAutoMovieVector3, d: number): IKey {
      const aim: IAutoMovieVector3 = aimOf(base);
      const pos: IAutoMovieVector3 = Vector3.add(aim, Vector3.scale(bearing, d));
      return { t: 0, pos, rot: lookRotation(Vector3.subtract(aim, pos)) };
    }

    switch (action.move) {
      case "static": {
        const k: IKey = framedAt(subject.base, distance);
        push(t0, k.pos, k.rot);
        break;
      }
      case "push-in": {
        for (let k: number = 0; k <= PUSH_IN_SEGMENTS; ++k) {
          const p: number = k / PUSH_IN_SEGMENTS;
          const scale: number =
            PUSH_IN_FROM + (PUSH_IN_TO - PUSH_IN_FROM) * ease("easeInOut", p);
          const f: IKey = framedAt(subject.base, distance * scale);
          push(t0 + (t1 - t0) * p, f.pos, f.rot);
        }
        break;
      }
      case "orbit": {
        for (let k: number = 0; k <= ORBIT_SEGMENTS; ++k) {
          const p: number = k / ORBIT_SEGMENTS;
          const swing: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            UP,
            ORBIT_DEGREES * ease("easeInOut", p),
          );
          const u: IAutoMovieVector3 = Quaternion.rotateVector(swing, bearing);
          const pos: IAutoMovieVector3 = Vector3.add(
            aim0,
            Vector3.scale(u, distance),
          );
          push(
            t0 + (t1 - t0) * p,
            pos,
            lookRotation(Vector3.subtract(aim0, pos)),
          );
        }
        break;
      }
      case "truck": {
        // Travel is perpendicular to the bearing, so the staged depth holds;
        // stage the camera on the other side for rightward travel.
        for (let k: number = 0; k <= TRUCK_SEGMENTS; ++k) {
          const p: number = k / TRUCK_SEGMENTS;
          const t: number = t0 + (t1 - t0) * p;
          const base: IAutoMovieVector3 = subject.at?.(t) ?? subject.base;
          const aim: IAutoMovieVector3 = aimOf(base);
          const pos: IAutoMovieVector3 = Vector3.add(
            framedAt(base, distance).pos,
            Vector3.scale(
              screenLeft,
              distance * TRUCK_DISTANCE * ease("easeInOut", p),
            ),
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
        const steps: number = Math.max(2, Math.ceil((t1 - t0) * FOLLOW_HZ) + 1);
        for (let k: number = 0; k < steps; ++k) {
          const t: number = t0 + ((t1 - t0) * k) / (steps - 1);
          const f: IKey = framedAt(subject.at(t), distance);
          push(t, f.pos, f.rot);
        }
        break;
      }
      default:
        throw new Error(`unknown camera frame move "${String(action.move)}"`);
    }
  });

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
        values: keys.flatMap((k: IKey): number[] => [k.pos.x, k.pos.y, k.pos.z]),
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

import { IAutoMovieCamera, IAutoMovieClip, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ease } from "../motion/ease";
import { FRAMING_AIM_FRACTION } from "./FRAMING_AIM_FRACTION";
import { FRAMING_HEIGHT_FRACTION } from "./FRAMING_HEIGHT_FRACTION";
import { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";
import { lookRotation } from "./lookRotation";

/** World up: the horizon a camera keeps level. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A whip pan snaps to its new aim in this many seconds. */
const WHIP_SECONDS = 0.2;

/** An orbit sweeps this arc over its span, sampled at this many segments. */
const ORBIT_DEGREES = 45;

const ORBIT_SEGMENTS = 8;

/** A push-in dollies from this to this multiple of the framed distance. */
const PUSH_IN_FROM = 1.25;

const PUSH_IN_TO = 0.8;

/** A push-in eases in/out over this many segments (a smooth dolly, not a ramp). */
const PUSH_IN_SEGMENTS = 8;

/** A truck crosses one solved framing distance along the camera's screen-left. */
const TRUCK_DISTANCE = 1;

const TRUCK_SEGMENTS = 8;

/** Follow moves sample the subject's animated base at this rate (Hz). */
const FOLLOW_HZ = 4;

/**
 * Compile a shot's `frame` actions into the live camera's motion clip, the
 * deterministic shot grammar: **framing** picks the distance (the fraction of
 * the subject's extent the frame shows, fitted to the camera's field of view by
 * `d = (visible/2) / tan(half-angle)`, vertically against the subject's height
 * and horizontally against its width, whichever demands the greater distance)
 * and the aim height; **move** picks the path: `static` locks the framed
 * position, `push-in` dollies from 1.25× to 0.8× of the framed distance,
 * `orbit` sweeps 45° around the subject, `follow` re-frames against the
 * subject's animated base, and `whip` pans in place from the staged orientation
 * onto the subject.
 *
 * The camera approaches along its **staged bearing** (the direction from the
 * subject's aim point to where staging placed the camera), so the side the
 * director chose is preserved; only the distance is solved. Consecutive entries
 * are keyed back to back, so the sampler's linear interpolation plays the gap
 * between two framings as a deliberate re-frame move.
 *
 * Entries must be sorted by `start` and non-overlapping (the shot builder
 * gates that); returns null when there is nothing to compile.
 *
 * @param props.aspect Frame width over height, for the horizontal half of the
 *   fit. A camera states only its VERTICAL field of view, so the raster is the
 *   only thing that knows how wide the frame is, and a subject with a measured
 *   `radius` cannot be fitted across the frame without it. Omitted, the solve
 *   assumes a square frame: the widest subject any raster of that height could
 *   fail to hold, so an unknown aspect pulls back far enough rather than
 *   cropping a mass it could not measure. A subject with no `radius` is
 *   unaffected either way.
 * @evidence requirements/camera/position-and-movement.md#camera-path-time-sampling Fits authored subjects through the declared lens and emits camera keyframes at each framing span on the shot clock.
 * @evidence requirements/camera/position-and-movement.md#camera-speed-easing Samples push-in, orbit, and truck moves at fixed bounded segment counts and applies the same `easeInOut` curve to their authored progress.
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-sampling Samples a moving framed subject through `subject.at(t)` at each emitted truck or follow key time instead of reusing its opening position.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-direct-sampling compileCameraMove resolves the authored camera move at explicit shot-local times, making the camera path directly sampleable.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Resolves the framed subject at the same shot-local instant used to emit each camera transform; it does not claim a target-loss transition policy.
 */
export const compileCameraMove = (props: {
  clipId: string;
  camera: IAutoMovieCamera;
  entries: IAutoMovieCameraFrameEntry[];
  shotDuration: number;
  aspect?: number;
}): IAutoMovieClip | null => {
  const { clipId, camera, entries, shotDuration } = props;
  if (entries.length === 0) return null;
  const halfY = Math.tan(((camera.fovY / 2) * Math.PI) / 180);
  // A non-finite or non-positive aspect describes no raster; the square
  // assumption above is what an absent one already means, so they agree.
  const aspect =
    props.aspect !== undefined &&
    Number.isFinite(props.aspect) &&
    props.aspect > 0
      ? props.aspect
      : 1;
  const halfX = halfY * aspect;

  const keys: {
    t: number;
    pos: IAutoMovieVector3;
    rot: IAutoMovieQuaternion;
  }[] = [];
  const push = (
    t: number,
    pos: IAutoMovieVector3,
    rot: IAutoMovieQuaternion,
  ): void => {
    const last = keys[keys.length - 1];
    // Two moves may abut on the same instant; the later framing wins the key
    // (a zero-width span would divide the sampler's local time by zero).
    if (last !== undefined && t <= last.t + 1e-9)
      keys[keys.length - 1] = { t: last.t, pos, rot };
    else keys.push({ t, pos, rot });
  };

  entries.forEach((entry, i) => {
    const { action, subject } = entry;
    const t0 = action.start;
    const t1 =
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
    const framing = action.framing as keyof typeof FRAMING_AIM_FRACTION;
    const aimFraction = FRAMING_AIM_FRACTION[framing];
    const aimOffset = subject.height * aimFraction;
    const aimOf = (base: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: base.x,
      y: base.y + aimOffset,
      z: base.z,
    });
    const aim0 = aimOf(subject.base);

    // Fit both ways and take the demanding one. The framing grammar states how
    // much of the frame the subject fills; for a figure that is a question
    // about height, and for a mass it is a question about width, so the frame
    // has to hold `fraction` times each of them and the camera stands at
    // whichever distance is the further back. `radius` is absent or zero for
    // every subject that is one body, which leaves the vertical fit alone and
    // the solved distance byte-identical to what it has always been.
    const fraction = FRAMING_HEIGHT_FRACTION[framing];
    const width = (subject.radius ?? 0) * 2;
    const distance = Math.max(
      (subject.height * fraction) / 2 / halfY,
      (width * fraction) / 2 / halfX,
    );

    // The staged bearing: subject → staged camera. A camera staged exactly on
    // the aim point has no bearing; fall back to +Z so the solve stays total.
    const toCamera = Vector3.subtract(camera.transform.translation, aim0);
    const bearing =
      Vector3.length(toCamera) < 1e-9
        ? { x: 0, y: 0, z: 1 }
        : Vector3.normalize(toCamera);
    // Horizontal screen-left under the staged bearing. A vertically staged
    // camera has no horizontal side from that bearing, so keep the move total
    // with the conventional world -X fallback.
    const side = Vector3.cross(bearing, UP);
    const screenLeft =
      Vector3.length(side) < 1e-9
        ? { x: -1, y: 0, z: 0 }
        : Vector3.normalize(side);

    const framedAt = (
      base: IAutoMovieVector3,
      d: number,
    ): { pos: IAutoMovieVector3; rot: IAutoMovieQuaternion } => {
      const aim = aimOf(base);
      const pos = Vector3.add(aim, Vector3.scale(bearing, d));
      return { pos, rot: lookRotation(Vector3.subtract(aim, pos)) };
    };

    switch (action.move) {
      case "static": {
        const k = framedAt(subject.base, distance);
        push(t0, k.pos, k.rot);
        break;
      }
      case "push-in": {
        // Ease the dolly in and out instead of ramping at constant speed: the
        // distance eases from 1.25× to 0.8× of framed, so the camera creeps in,
        // accelerates, and settles: a cinematic push, not a mechanical slide.
        for (let k = 0; k <= PUSH_IN_SEGMENTS; ++k) {
          const p = k / PUSH_IN_SEGMENTS;
          const scale =
            PUSH_IN_FROM + (PUSH_IN_TO - PUSH_IN_FROM) * ease("easeInOut", p);
          const f = framedAt(subject.base, distance * scale);
          push(t0 + (t1 - t0) * p, f.pos, f.rot);
        }
        break;
      }
      case "orbit": {
        // Ease the swept angle in and out (not the radius or the endpoints): the
        // orbit creeps off its mark, accelerates through the mid-arc, and settles
        // onto the far bearing: a reveal orbit, not a turntable at constant rate.
        for (let k = 0; k <= ORBIT_SEGMENTS; ++k) {
          const p = k / ORBIT_SEGMENTS;
          const swing = Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            ORBIT_DEGREES * ease("easeInOut", p),
          );
          const u = Quaternion.rotateVector(swing, bearing);
          const pos = Vector3.add(aim0, Vector3.scale(u, distance));
          push(
            t0 + (t1 - t0) * p,
            pos,
            lookRotation(Vector3.subtract(aim0, pos)),
          );
        }
        break;
      }
      case "truck": {
        // A lateral truck preserves the staged depth axis (movement is
        // perpendicular to `bearing`) while its look-at rotation keeps the
        // subject framed. "truck" is screen-left; stage the camera on the
        // reverse side when the composition calls for rightward travel.
        for (let k = 0; k <= TRUCK_SEGMENTS; ++k) {
          const p = k / TRUCK_SEGMENTS;
          const t = t0 + (t1 - t0) * p;
          const base = subject.at?.(t) ?? subject.base;
          const aim = aimOf(base);
          const framed = framedAt(base, distance);
          const pos = Vector3.add(
            framed.pos,
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
          const k = framedAt(subject.base, distance);
          push(t0, k.pos, k.rot);
          break;
        }
        const steps = Math.max(2, Math.ceil((t1 - t0) * FOLLOW_HZ) + 1);
        for (let k = 0; k < steps; ++k) {
          const t = t0 + ((t1 - t0) * k) / (steps - 1);
          const f = framedAt(subject.at(t), distance);
          push(t, f.pos, f.rot);
        }
        break;
      }
      case "whip": {
        const k = framedAt(subject.base, distance);
        push(t0, camera.transform.translation, camera.transform.rotation);
        push(
          Math.min(t0 + WHIP_SECONDS, t1),
          camera.transform.translation,
          lookRotation(Vector3.subtract(aim0, camera.transform.translation)),
        );
        // Whip pans in place. The framed distance is not honored; `k` exists
        // only to keep the framing math total for future dolly-after-whip.
        void k;
        break;
      }
      default:
        throw new Error(`unknown camera frame move "${String(action.move)}"`);
    }
  });

  return {
    id: clipId,
    name: null,
    duration: shotDuration,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: camera.id, path: "translation" },
        times: keys.map((k) => k.t),
        values: keys.flatMap((k) => [k.pos.x, k.pos.y, k.pos.z]),
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: camera.id, path: "rotation" },
        times: keys.map((k) => k.t),
        values: keys.flatMap((k) => [k.rot.x, k.rot.y, k.rot.z, k.rot.w]),
        interpolation: "linear",
      },
    ],
  };
};

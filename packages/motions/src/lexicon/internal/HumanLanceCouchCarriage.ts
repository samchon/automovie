import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** The least rotation taking one unit direction onto another. */
function between(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const u: IAutoMovieVector3 = Vector3.normalize(from);
  const v: IAutoMovieVector3 = Vector3.normalize(to);
  const dot: number = Math.max(-1, Math.min(1, Vector3.dot(u, v)));
  const axis: IAutoMovieVector3 = Vector3.cross(u, v);
  if (Vector3.length(axis) < 1e-9) {
    if (dot > 0) return Quaternion.identity();
    const side: IAutoMovieVector3 =
      Math.abs(u.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    return Quaternion.fromAxisAngle(
      Vector3.normalize(Vector3.cross(u, side)),
      180,
    );
  }
  return Quaternion.fromAxisAngle(
    Vector3.normalize(axis),
    (Math.acos(dot) * 180) / Math.PI,
  );
}

/**
 * The carriage that holds the lance along a direction with its grip at a
 * station, from the arm's own line: the hand's line continues the forearm, so
 * the shaft keeps the angle to the forearm that the hand's grasp of it holds,
 * and the elbow lies one upper arm from the shoulder, the lower of the two such
 * places.
 *
 * @param arm The rider's lance arm.
 * @param shoulder The right shoulder, seat-frame metres.
 * @param tool The held lance in the hand's frame.
 * @param grip The grip's station, seat-frame metres.
 * @param along The direction the shaft runs, seat frame.
 * @returns The hand's frame and the elbow.
 * @throws {HumanRefusal} On `target` when no elbow one upper arm from the
 *   shoulder lays the forearm at the grasp's angle to the shaft.
 */
export function HumanLanceCouchCarriage(
  arm: HumanLanceCouchCarriage.IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  grip: IAutoMovieVector3,
  along: IAutoMovieVector3,
): HumanLanceCouchCarriage.ICarriage {
  const d: IAutoMovieVector3 = Vector3.normalize(along);
  const shaft: IAutoMovieVector3 = Vector3.normalize(tool.axis);
  const alpha: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(arm.line, shaft))),
  );
  // The forearm from the elbow to the grip socket, the hand's half included.
  const fore: number = arm.fore;
  const upper: number = arm.upperArm;
  // An orthonormal pair square to the shaft.
  const seed: IAutoMovieVector3 =
    Math.abs(d.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const p: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seed, Vector3.scale(d, Vector3.dot(seed, d))),
  );
  const q: IAutoMovieVector3 = Vector3.cross(d, p);
  // The forearm at the grasp's angle to the shaft about it, by an angle phi: the elbow one upper arm from the shoulder solves A cos(phi) + B sin(phi) = C.
  const w: IAutoMovieVector3 = Vector3.subtract(
    Vector3.subtract(grip, shoulder),
    Vector3.scale(d, fore * Math.cos(alpha)),
  );
  const s: number = fore * Math.sin(alpha);
  const forearm = (phi: number): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.scale(d, Math.cos(alpha)),
      Vector3.scale(
        Vector3.add(
          Vector3.scale(p, Math.cos(phi)),
          Vector3.scale(q, Math.sin(phi)),
        ),
        Math.sin(alpha),
      ),
    );
  let f: IAutoMovieVector3;
  if (s < 1e-6) f = d;
  else {
    const A: number = Vector3.dot(w, p);
    const B: number = Vector3.dot(w, q);
    const C: number = (Vector3.dot(w, w) + s * s - upper * upper) / (2 * s);
    const R: number = Math.hypot(A, B);
    if (R < 1e-9 || Math.abs(C) > R)
      throw new HumanRefusal({
        kind: "reach",
        axis: "target",
        value: Vector3.distance(grip, shoulder),
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: upper + fore,
          unit: "m",
        },
        reason: `no elbow one upper arm from the shoulder lays the forearm at the grasp's ${((alpha * 180) / Math.PI).toFixed(0)} degrees to the lance with the grip ${Vector3.distance(grip, shoulder).toFixed(2)} m from the shoulder`,
        fix: "hold the lance nearer the shoulder or along another line",
      });
    const base: number = Math.atan2(B, A);
    const spread: number = Math.acos(C / R);
    const one: IAutoMovieVector3 = forearm(base + spread);
    const two: IAutoMovieVector3 = forearm(base - spread);
    // The lower elbow: the arm hangs from the shoulder rather than raising it.
    f = one.y >= two.y ? one : two;
  }
  const elbow: IAutoMovieVector3 = Vector3.subtract(
    grip,
    Vector3.scale(f, fore),
  );
  // The hand's line onto the forearm, then turned about it until the shaft runs along `d`.
  const onto: IAutoMovieQuaternion = between(arm.line, f);
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(onto, shaft);
  const a: IAutoMovieVector3 = Vector3.subtract(
    turned,
    Vector3.scale(f, Vector3.dot(turned, f)),
  );
  const b: IAutoMovieVector3 = Vector3.subtract(
    d,
    Vector3.scale(f, Vector3.dot(d, f)),
  );
  const roll: number =
    Vector3.length(a) < 1e-9 || Vector3.length(b) < 1e-9
      ? 0
      : Math.atan2(Vector3.dot(f, Vector3.cross(a, b)), Vector3.dot(a, b));
  return {
    hand: {
      point: grip,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(f, (roll * 180) / Math.PI),
          onto,
        ),
      ),
    },
    elbow,
  };
}

/** `HumanLanceCouchCarriage` and its records. */
export namespace HumanLanceCouchCarriage {
  /**
   * A mounted arm's carriage of a held lance: the hand's frame and the elbow
   * that lays it with the wrist neutral.
   */
  export interface ICarriage {
    /** The hand's grip frame, seat-frame metres and rotation. */
    hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /** The elbow, seat-frame metres. */
    elbow: IAutoMovieVector3;
  }

  /** The rider's lance arm, read from the body. */
  export interface IArm {
    /** The upper arm's length, metres. */
    upperArm: number;

    /**
     * From the elbow to the grip socket, metres: the forearm and the wrist's
     * distance to the grip.
     */
    fore: number;

    /**
     * The hand's own line from the wrist to the grip socket, in the hand's
     * frame, which the tool's axis is read in.
     */
    line: IAutoMovieVector3;
  }
}

import type { HumanReferenceRig } from "../bodies/HumanReferenceRig";

/** A point or direction in space. */
type V3 = [number, number, number];

/**
 * The resting thumb of a reference body read from its own rig: the angle
 * between successive bones at the MCP and the IP joints, and the metacarpal
 * and the proximal phalanx in the hand's frame.
 *
 * - Metacarpal: from `thumb_01` (the CMC joint) to `thumb_02` (the MCP joint).
 * - Proximal phalanx: from `thumb_02` to `thumb_03` (the IP joint).
 * - Distal phalanx: along `thumb_03`'s own x axis, the rig's bone direction,
 *   since the rig carries no joint beyond the IP.
 *
 * The hand's frame: `e_a` from the wrist (`hand`) to the third MCP
 * (`middle_01`); `e_b` the radial direction, from the fifth MCP (`pinky_01`)
 * to the second (`index_01`), made normal to `e_a`; `e_c = e_a x e_b`, signed
 * so that the palm is positive, read by the middle finger's own resting curl
 * (`middle_02` to `middle_03` bends toward the palm). In that frame a bone's
 * flexion is its angle toward `e_c` from `e_a`, and its spread its angle
 * toward `e_b`. The MCP and IP angles are unsigned angles between bones.
 */
export namespace HumanReferenceThumb {
  /** One hand's reading, degrees. */
  export interface IReading {
    /** Which hand: `l` or `r`. */
    side: "l" | "r";

    /** Angle between the metacarpal and the proximal phalanx. */
    mcp: number;

    /** Angle between the proximal and the distal phalanx. */
    ip: number;

    /** The metacarpal's flexion in the hand's frame, palm positive. */
    metacarpalFlexion: number;

    /** The metacarpal's spread in the hand's frame, radial positive. */
    metacarpalSpread: number;

    /** The proximal phalanx's flexion against the hand's axis, palm positive. */
    proximalFlexion: number;

    /** The proximal phalanx's spread against the hand's axis, radial positive. */
    proximalSpread: number;
  }

  /** The rig joints one hand's reading needs, by their name without the side. */
  export const JOINTS: readonly string[] = ["hand", "middle_01", "middle_02", "middle_03", "index_01", "pinky_01", "thumb_01", "thumb_02", "thumb_03"];

  /**
   * Read one hand's thumb from a rig.
   *
   * @param rig The reference's rig.
   * @param side Which hand.
   * @throws Error when a joint the reading needs is missing.
   */
  export function read(rig: HumanReferenceRig.IRig, side: "l" | "r"): IReading {
    const at: (name: string) => HumanReferenceRig.IJoint = (name: string): HumanReferenceRig.IJoint => {
      const joint: HumanReferenceRig.IJoint | undefined = rig.get(`${name}_${side}`);

      if (joint === undefined) throw new Error(`the rig has no joint ${name}_${side}`);
      return joint;
    };

    // The hand's frame, from the wrist and the knuckles.
    const ea: V3 = unit(sub(at("middle_01").origin, at("hand").origin));
    const radial: V3 = sub(at("index_01").origin, at("pinky_01").origin);
    const eb: V3 = unit(sub(radial, scale(ea, dot(radial, ea))));
    const curl: number = dot(sub(at("middle_03").origin, at("middle_02").origin), cross(ea, eb));
    const ec: V3 = scale(cross(ea, eb), curl < 0 ? -1 : 1);

    // The thumb's bones.
    const metacarpal: V3 = sub(at("thumb_02").origin, at("thumb_01").origin);
    const proximal: V3 = sub(at("thumb_03").origin, at("thumb_02").origin);
    const distal: V3 = at("thumb_03").axes[0]!;
    const toward: (v: V3, e: V3) => number = (v: V3, e: V3): number => degrees(Math.atan2(dot(v, e), dot(v, ea)));

    return {
      side,
      mcp: between(metacarpal, proximal),
      ip: between(proximal, distal),
      metacarpalFlexion: toward(metacarpal, ec),
      metacarpalSpread: toward(metacarpal, eb),
      proximalFlexion: toward(proximal, ec),
      proximalSpread: toward(proximal, eb),
    };
  }

  /**
   * The angle between the lines of two directions, degrees, from 0 to 90.
   * The rig's x axes point along the bone on one side and back toward the
   * wrist on the mirrored side, so a bone is read as a line; a resting joint
   * bends far less than 90 degrees, where a line angle and a direction angle
   * agree.
   *
   * @param a A direction.
   * @param b A direction.
   */
  export function between(a: V3, b: V3): number {
    return degrees(Math.acos(Math.min(1, Math.abs(dot(unit(a), unit(b))))));
  }

  /**
   * Radians to degrees.
   *
   * @param r Angle, radians.
   */
  function degrees(r: number): number {
    return (r * 180) / Math.PI;
  }

  /**
   * Difference of two vectors.
   *
   * @param a Minuend.
   * @param b Subtrahend.
   */
  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * A vector scaled.
   *
   * @param a The vector.
   * @param s The factor.
   */
  function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /**
   * Dot product.
   *
   * @param a A vector.
   * @param b A vector.
   */
  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Cross product.
   *
   * @param a A vector.
   * @param b A vector.
   */
  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /**
   * A vector made unit length.
   *
   * @param a The vector.
   */
  function unit(a: V3): V3 {
    return scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
  }
}

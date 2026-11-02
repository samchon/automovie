/** The least resting abduction of a straight arm beside the generated trunk. */
export namespace AutoMovieHumanArmClearance {
  /** Registered-frame point in millimetres. */
  export type Vector = [number, number, number];

  /** Geometry of the arm's two straight neutral segments. */
  export interface IArm {
    /** Glenohumeral centre. */
    shoulder: Vector;
    /** Shoulder to elbow distance. */
    upperLength: number;
    /** Elbow to wrist distance. */
    foreLength: number;
    /** Outermost upper-arm section radius. */
    upperRadius: number;
    /** Outermost forearm section radius. */
    foreRadius: number;
    /** Anatomical side. */
    side: 1 | -1;
  }

  /**
   * Clear the side projection against two finite outer-radius capsules. This
   * is a conservative model bound, not a clinical resting-angle observation.
   * The shared attachment above the upper-radius depth belongs to the joint.
   * Cylinder contact and endpoint-sphere contact determine their own segment;
   * choosing a radius by world vertical depth would miss a raised elbow.
   */
  export function angle(arm: IArm, skin: readonly Vector[]): number {
    let result: number = 0;
    for (const p of skin) {
      const t: number = arm.shoulder[1] - p[1];
      if (t < arm.upperRadius) continue;
      const delta: number = arm.side * (p[2] - arm.shoulder[2]);
      const distance: number = Math.hypot(t, delta);
      const alpha: number = Math.atan2(delta, t);
      result = Math.max(result, contact(distance, alpha, 0, arm.upperLength, arm.upperRadius));
      result = Math.max(result, contact(distance, alpha, arm.upperLength, arm.upperLength + arm.foreLength, arm.foreRadius));
    }
    if (result > Math.PI / 2) throw new Error("The arm cannot clear the trunk within outward abduction");
    return result * 180 / Math.PI;
  }

  /** Angular end of the forbidden interval of one finite segment capsule. */
  function contact(distance: number, alpha: number, from: number, to: number, radius: number): number {
    const nearest: number = Math.max(from, Math.min(to, distance));
    if (Math.abs(distance - nearest) >= radius) return 0;
    const cylinder: number = Math.sqrt(Math.max(0, distance * distance - radius * radius));
    if (distance >= radius && cylinder >= from && cylinder <= to)
      return Math.max(0, alpha + Math.asin(radius / distance));
    const endpoint: number = cylinder < from ? from : to;
    if (endpoint === 0 || distance === 0 || distance + endpoint <= radius)
      throw new Error("The trunk lies inside an immovable arm attachment");
    const cosine: number = (distance * distance + endpoint * endpoint - radius * radius) / (2 * distance * endpoint);
    return Math.max(0, alpha + Math.acos(Math.max(-1, Math.min(1, cosine))));
  }
}

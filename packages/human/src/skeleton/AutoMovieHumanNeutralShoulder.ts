import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanNeutralBody } from "./IAutoMovieHumanNeutralBody";
import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The shoulder's neutral: the arm hanging at the side, resting against the
 * trunk.
 *
 * A straight arm hung plumb from its shoulder would pass through the hip, so
 * the resting angle is the least abduction at which the arm's own skin clears
 * the trunk's and the leg's: at each depth under the shoulder the arm's own
 * radius there (its skin's farthest distance from the bone line, read off the
 * arm chain at the bind and carried onto the straightened arm) must reach no
 * further toward the body than the body's skin at that depth.
 * The bind's bend gives the elbow's plane, which neutral lays in the sagittal
 * plane: the upper arm turns about its own axis until the forearm lies
 * forward of it.
 */
export namespace AutoMovieHumanNeutralShoulder {
  /** One shoulder's neutral. */
  export interface IOutput {
    /** The upper arm's world turn from the bind. */
    turn: Math3D.Quaternion;

    /** The arm's unit direction at neutral, from the shoulder down. */
    down: Math3D.Vector;

    /** The resting abduction from the plumb line, degrees. */
    resting: number;
  }

  /**
   * Derive one shoulder's neutral.
   *
   * @param body The bind skeleton.
   * @param rings The skin of the trunk, the legs and the arms; the arm's own chain sizes it, the others are cleared.
   * @param side Which arm.
   * @returns The upper arm's turn, direction and resting angle.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    rings: readonly IAutoMovieHumanChainRings[],
    side: "left" | "right",
  ): IOutput {
    const s: number = side === "left" ? 1 : -1;
    const angle: number = restingAngle(rings, body, side);
    const radians: number = (angle * Math.PI) / 180;
    const down: Math3D.Vector = [0, -Math.cos(radians), s * Math.sin(radians)];
    const upper: Math3D.Vector = body.direction(`${side}UpperArm`);
    const fore: Math3D.Vector = body.direction(`${side}LowerArm`);
    return {
      turn: Turn.frame(
        upper,
        Math3D.unit(Turn.perpendicular(fore, upper)),
        down,
        Turn.FORWARD,
      ),
      down,
      resting: angle,
    };
  /** Width of a station bin of the arm's radius profile, mm. */
  export const BIN: number = 5;

  /**
   * The least abduction at which the straight arm's skin clears the trunk and
   * the leg beside it.
   *
   * The arm's own skin is read from where its chain leaves the trunk (its first
   * ring, where the axilla makes them one surface and flesh gives) down to the
   * wrist: each skin point is carried onto the straightened arm by its station
   * along its own bone (the humerus above the elbow, the forearm below) and its
   * distance from that bone. Without an arm chain the forearm's joint radius
   * stands for the skin from the elbow down.
   */
  function restingAngle(
    rings: readonly IAutoMovieHumanChainRings[],
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
  ): number {
    const s: number = side === "left" ? 1 : -1;
    const at: (bone: string) => Math3D.Vector = (
      bone: string,
    ): Math3D.Vector => body.byBone.get(`${side}${bone}`)!.position;
    const shoulder: Math3D.Vector = at("UpperArm");
    const elbow: Math3D.Vector = at("LowerArm");
    const upper: number = Turn.length(shoulder, elbow);
    const fore: number = upper + Turn.length(elbow, at("Hand"));
    const profile: IProfile = armProfile(rings, body, side);

    // For each skin point of the trunk and this leg beside the arm, the sine
    // of the angle from plumb at which the arm's skin at that depth touches it.
    let widest: number = 0;
    for (const chain of rings) {
      if (chain.chain !== "trunk" && chain.chain !== `leg.${side}`) continue;
      for (let k: number = 0; k < chain.points.length / 3; k++) {
        const y: number = chain.points[3 * k + 1]!;
        const z: number = chain.points[3 * k + 2]!;
        const t: number = shoulder[1] - y;
        if (t < profile.from || t > fore) continue;
        widest = Math.max(widest, (s * z + profile.radius(t) - s * shoulder[2]) / t);
      }
    }
    return (Math.asin(Math.min(1, widest)) * 180) / Math.PI;
  }

  /** The straight arm's radius along its length. */
  interface IProfile {
    /** Depth under the shoulder from which the arm's skin is its own, mm. */
    from: number;

    /**
     * The arm's radius at a depth under the shoulder, mm.
     *
     * @param t Depth along the straight arm, mm.
     */
    radius(t: number): number;
  }

  /**
   * The arm's radius profile from its own skin, or the forearm's joint radius
   * from the elbow down when the rings hold no arm chain.
   */
  function armProfile(
    rings: readonly IAutoMovieHumanChainRings[],
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
  ): IProfile {
    const at: (bone: string) => Math3D.Vector = (bone: string): Math3D.Vector => body.byBone.get(`${side}${bone}`)!.position;
    const shoulder: Math3D.Vector = at("UpperArm");
    const elbow: Math3D.Vector = at("LowerArm");
    const upper: number = Turn.length(shoulder, elbow);
    const arm: IAutoMovieHumanChainRings | undefined = rings.find((r: IAutoMovieHumanChainRings): boolean => r.chain === `arm.${side}`);
    if (arm === undefined) {
      const radius: number = body.byBone.get(`${side}LowerArm`)!.radius;
      return { from: upper, radius: (): number => radius };
    }
    const humerus: Math3D.Vector = Math3D.unit(Math3D.sub(elbow, shoulder));
    const forearm: Math3D.Vector = Math3D.unit(Math3D.sub(at("Hand"), elbow));

    // Each skin point onto the straight arm: station and distance from the
    // nearer bone line within that bone's span.
    const reading: (p: Math3D.Vector) => [number, number] = (p: Math3D.Vector): [number, number] => {
      const a: number = Turn.dot(Math3D.sub(p, shoulder), humerus);
      const b: number = Turn.dot(Math3D.sub(p, elbow), forearm);
      const da: number = Turn.length(p, Math3D.add(shoulder, [humerus[0] * a, humerus[1] * a, humerus[2] * a]));
      const db: number = Turn.length(p, Math3D.add(elbow, [forearm[0] * b, forearm[1] * b, forearm[2] * b]));
      return a <= upper && (b < 0 || da <= db) ? [a, da] : [upper + b, db];
    };
    const bins: Map<number, number> = new Map();
    const count: number = arm.points.length / 3;
    const ringMeans: number[] = arm.stations.map((): number => 0);
    for (let k: number = 0; k < count; k++) {
      const [t, r] = reading([arm.points[3 * k]!, arm.points[3 * k + 1]!, arm.points[3 * k + 2]!]);
      const bin: number = Math.floor(t / BIN);
      bins.set(bin, Math.max(bins.get(bin) ?? 0, r));
      const ring: number = Math.floor(k / arm.phases);
      ringMeans[ring] = ringMeans[ring]! + t / arm.phases;
    }

    // The arm's own skin starts past the ring nearest the shoulder.
    const root: number = ringMeans.indexOf(Math.min(...ringMeans));
    let from: number = 0;
    for (let j: number = root * arm.phases; j < (root + 1) * arm.phases; j++)
      from = Math.max(from, reading([arm.points[3 * j]!, arm.points[3 * j + 1]!, arm.points[3 * j + 2]!])[0]);
    return {
      from,
      radius: (t: number): number => {
        const bin: number = Math.floor(t / BIN);
        return Math.max(bins.get(bin - 1) ?? 0, bins.get(bin) ?? 0, bins.get(bin + 1) ?? 0);
      },
    };
  }
}

/**
 * The leg's stations: where landmarks stand on the bones and where the chain's
 * layers stand between the two rings.
 *
 * A station is the height of a section's origin on the leg's axis (the chain's
 * own parameter). Every landmark is a share of a bone from its joint (the
 * thigh from the hip centre to the knee centre, the shank from the knee centre
 * to the ankle centre), never a fraction of the distance between the rings, so
 * the foot's ring height and the crotch height move no landmark.
 *
 * Layers are spaced by one density, equidistributed between the rings: no
 * spacing coarser than the rows' finest pitch; within a joint's bend, close
 * enough that a row turns by no more than {@link ROW_TURN} under the joint's
 * whole range of motion; and under the crotch ring, doubling from the trunk's
 * first row so the rows either side of the ring match.
 */
export namespace AutoMovieHumanLegStations {
  /** A joint's bend along the leg. */
  export interface IBend {
    /** Station of the joint, mm. */
    at: number;

    /** Half of the bend's length, mm. */
    half: number;

    /** The joint's whole range of motion on its flexion channel, radians. */
    range: number;
  }

  /** What the layers are spaced from. */
  export interface IInput {
    /** Station of the ankle ring, mm. */
    bottom: number;

    /** Station of the crotch ring, mm. */
    top: number;

    /** The joints' bends. */
    bends: readonly IBend[];

    /** The trunk's first row spacing above the crotch ring, mm. */
    first: number;

    /** The coarsest spacing a layer may have, mm: the rows' finest pitch. */
    coarsest: number;
  }

  /** The two segments a landmark can be a share of. */
  export type Segment = "thigh" | "shank";

  /** The bones a landmark height is read on. */
  export interface IBones {
    /** Hip centre height, mm. */
    hip: number;

    /** Knee centre height, mm. */
    knee: number;

    /** Ankle centre height, mm. */
    ankle: number;
  }

  /**
   * Skin depths either side of a joint over which its bend spreads, as the
   * rig's cut does: the frames turn over it and its rows are spaced in it.
   */
  export const BEND: number = 1.5;

  /** Largest turn of a row under a joint's whole range of motion, radians (12 degrees). */
  export const ROW_TURN: number = (12 * Math.PI) / 180;

  /**
   * The leg joints' flexion ranges in degrees, the pose channels'
   * `legs.<side>.*` rows (sourced in `docs/anatomy/joint-range.md`), which
   * generation may not import.
   */
  export const RANGES: Readonly<
    Record<"ankle.dorsiflexion" | "knee.flexion" | "hip.flexion", readonly [number, number]>
  > = {
    "ankle.dorsiflexion": [-58.35, 13.25],
    "knee.flexion": [-1.3, 139.8],
    "hip.flexion": [-17.75, 132.1],
  };

  /**
   * The coarsest layer spacing, world mm: below the 10 mm step of the
   * reference pack's leg curves, so a leg holds at least as many layers as the
   * references (72 on f1).
   */
  export const COARSEST: number = 9.5;

  /** Integration step of the layer density, mm. */
  export const DENSITY_STEP: number = 0.25;

  /** A joint's whole range of motion along its flexion channel, radians. */
  export function range(channel: keyof typeof RANGES): number {
    const [low, high] = RANGES[channel];
    return ((high - low) * Math.PI) / 180;
  }

  /**
   * The height of a landmark on a bone.
   *
   * @param bones The joints' heights.
   * @param segment The thigh runs from the hip centre (share 0) to the knee
   *   centre (1), the shank from the knee centre (0) to the ankle centre (1).
   * @param share Share of the bone's length; a share outside 0 to 1 extends it.
   * @returns Height of the point on the bone line, mm.
   */
  export function heightAt(bones: IBones, segment: Segment, share: number): number {
    const from: number = segment === "thigh" ? bones.hip : bones.knee;
    const to: number = segment === "thigh" ? bones.knee : bones.ankle;
    return from + share * (to - from);
  }

  /**
   * Stations of the layers, by equidistribution of one density.
   *
   * @param input The rings, the bends and the spacing limits.
   * @returns Strictly increasing stations from the ankle ring to the crotch ring, both included.
   */
  export function layers(input: IInput): number[] {
    const { bottom, top, bends } = input;

    // The density is the layers wanted per mm at a station: the larger of the
    // coarsest spacing's, each joint's (its range over the row turn, times the
    // bend's own quintic turning rate) and the doubling under the crotch ring.
    const density = (s: number): number => {
      let m: number = 1 / input.coarsest;
      for (const b of bends) {
        const x: number = (s - b.at) / b.half;
        if (Math.abs(x) >= 1) continue;
        const y: number = (x + 1) / 2;
        const rate: number = (30 * y * y * (1 - y) * (1 - y)) / (2 * b.half);
        m = Math.max(m, (b.range * rate) / ROW_TURN);
      }
      return Math.max(m, 1 / (Math.LN2 * (input.first + (top - s))));
    };

    // Simpson's rule for the cumulative density on a fine grid.
    const steps: number = Math.ceil((top - bottom) / DENSITY_STEP);
    const h: number = (top - bottom) / steps;
    const sums: number[] = [0];
    for (let i: number = 0; i < steps; i++) {
      const a: number = bottom + i * h;
      sums.push(sums[i]! + ((density(a) + 4 * density(a + h / 2) + density(a + h)) * h) / 6);
    }

    // Equal shares of the total: layer k stands where the cumulative density reaches k / count.
    const count: number = Math.ceil(sums[steps]! - 1e-9);
    const out: number[] = [bottom];
    let i: number = 0;
    for (let k: number = 1; k < count; k++) {
      const goal: number = (sums[steps]! * k) / count;
      while (sums[i + 1]! < goal) i++;
      const f: number = (goal - sums[i]!) / (sums[i + 1]! - sums[i]!);
      out.push(bottom + (i + f) * h);
    }
    out.push(top);
    return out;
  }
}

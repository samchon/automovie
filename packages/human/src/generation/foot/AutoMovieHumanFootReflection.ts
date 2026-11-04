import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The declared reflection from the left foot's construction to the right's:
 * points mirrored across the midline (z to -z), phase reversed (the right's
 * point at phase t is the mirror of the left's at -t), frames mirrored with
 * `v` turned over so their normals still point up their chains, and a
 * branch's arcs mirrored and reversed in ring order.
 */
export namespace AutoMovieHumanFootReflection {
  /** A left-frame section sample for a side. */
  export function sample(s: AutoMovieHumanLimbFrame.ISample, sign: 1 | -1): AutoMovieHumanLimbFrame.ISample {
    if (sign === 1) return s;
    const n: number = s.ring.length;
    return {
      station: s.station,
      frame: AutoMovieHumanLimbFrame.mirror(s.frame),
      ring: s.ring.map((_: G.Vec3, m: number): G.Vec3 => G.sided(s.ring[(n - m) % n]!, -1)),
    };
  }

  /** A left foot's arcs of a ring for a side. */
  export function arcs(list: readonly [number, number][], sign: 1 | -1): [number, number][] {
    return sign === 1
      ? list.map((a: [number, number]): [number, number] => [a[0], a[1]])
      : [...list].reverse().map((a: [number, number]): [number, number] => [G.wrap(G.TWO_PI - a[1]), G.wrap(G.TWO_PI - a[0])]);
  }
}

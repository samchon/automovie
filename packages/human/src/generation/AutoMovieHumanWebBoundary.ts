import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanWebPatch as Patch } from "./AutoMovieHumanWebPatch";

/** Physical boundary jets shared by a web, its parent and its child. */
export namespace AutoMovieHumanWebBoundary {
  /**
   * Express a physical station jet at a declared finite parameter speed.
   * Removing tangential station acceleration preserves geometric curvature;
   * the caller supplies the bounded row map's own tangential acceleration.
   * A zero station tangent is refused because it defines no regular boundary.
   */
  export function geometric(
    jet: Patch.IJet,
    speed: number,
    acceleration: number = 0,
  ): Patch.IJet {
    const length: number = Math.hypot(...jet.first);
    if (length === 0)
      throw new Error("A web boundary needs a regular station tangent");
    const tangent: Patch.Vec3 = jet.first.map(
      (x: number): number => x / length,
    ) as Patch.Vec3;
    const along: number = jet.second.reduce(
      (sum: number, x: number, k: number): number => sum + x * tangent[k]!,
      0,
    );
    const factor: number = (speed * speed) / (length * length);
    return {
      value: jet.value,
      first: tangent.map((x: number): number => x * speed) as Patch.Vec3,
      second: jet.second.map(
        (x: number, k: number): number =>
          factor * (x - along * tangent[k]!) + acceleration * tangent[k]!,
      ) as Patch.Vec3,
    };
  }

  /** Cache the four section evaluators shared by every phase of one boundary. */
  export function sampler(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    direction: -1 | 1,
  ): (phase: number) => Patch.IJet {
    const span: number =
      chain.layers[chain.layers.length - 1]!.y - chain.layers[0]!.y;
    const h: number = Math.min(0.05, span / 3);
    const inward: -1 | 1 = s === chain.layers[0]!.y ? 1 : -1;
    const sections: ((phase: number) => Patch.Vec3)[] = [0, 1, 2, 3].map(
      (i: number): ((phase: number) => Patch.Vec3) =>
        AutoMovieHumanLoftChain.sampler(chain, s + inward * i * h),
    );
    return (phase: number): Patch.IJet => {
      const [a, b, c, d] = sections.map(
        (section: (phase: number) => Patch.Vec3): Patch.Vec3 => section(phase),
      ) as [Patch.Vec3, Patch.Vec3, Patch.Vec3, Patch.Vec3];
      const first: Patch.Vec3 = [0, 0, 0];
      const second: Patch.Vec3 = [0, 0, 0];
      for (let k: number = 0; k < 3; k++) {
        first[k] =
          (direction *
            inward *
            (-11 * a[k]! + 18 * b[k]! - 9 * c[k]! + 2 * d[k]!)) /
          (6 * h);
        second[k] = (2 * a[k]! - 5 * b[k]! + 4 * c[k]! - d[k]!) / (h * h);
      }
      return { value: a, first, second };
    };
  }

  /** One-sided second-order endpoint jet of a normalized reference curve. */
  export function jet(
    curve: (t: number) => Patch.Vec3,
    end: 0 | 1,
  ): Patch.IJet {
    const h: number = 1e-4;
    const sign: number = end === 0 ? 1 : -1;
    const a: Patch.Vec3 = curve(end);
    const b: Patch.Vec3 = curve(end + sign * h);
    const c: Patch.Vec3 = curve(end + sign * 2 * h);
    const d: Patch.Vec3 = curve(end + sign * 3 * h);
    const first: Patch.Vec3 = [0, 0, 0];
    const second: Patch.Vec3 = [0, 0, 0];
    for (let k: number = 0; k < 3; k++) {
      first[k] =
        (sign * (-11 * a[k]! + 18 * b[k]! - 9 * c[k]! + 2 * d[k]!)) / (6 * h);
      second[k] = (2 * a[k]! - 5 * b[k]! + 4 * c[k]! - d[k]!) / (h * h);
    }
    return { value: a, first, second };
  }

  /**
   * Close a reference curve on physical boundary jets. Its original speed and
   * tangential acceleration are retained; normal acceleration follows the
   * neighbour, which is the geometric C2 condition under a change of parameter.
   * A null endpoint leaves that endpoint's complete reference jet unchanged.
   */
  export function fit(
    reference: (t: number) => Patch.Vec3,
    from: Patch.IJet | null,
    to: Patch.IJet | null,
  ): (t: number) => Patch.Vec3 {
    const original: [Patch.IJet, Patch.IJet] = [
      jet(reference, 0),
      jet(reference, 1),
    ];
    return Patch.constrain(reference, original, [
      from === null ? original[0] : match(original[0], from),
      to === null ? original[1] : match(original[1], to),
    ]);
  }

  /** The neighbour's geometric jet under the reference curve's parameter speed. */
  function match(original: Patch.IJet, target: Patch.IJet): Patch.IJet {
    const speed: number = Math.hypot(...target.first);
    if (speed < 1e-12)
      return { ...target, first: [0, 0, 0], second: [0, 0, 0] };
    const factor: number = Math.hypot(...original.first) / speed;
    const tangent: Patch.Vec3 = target.first.map(
      (x: number): number => x / speed,
    ) as Patch.Vec3;
    const curvature: Patch.Vec3 = target.second.map(
      (x: number): number => x * factor * factor,
    ) as Patch.Vec3;
    const acceleration: number = tangent.reduce(
      (sum: number, x: number, k: number): number =>
        sum + x * (original.second[k]! - curvature[k]!),
      0,
    );
    return {
      value: target.value,
      first: target.first.map((x: number): number => x * factor) as Patch.Vec3,
      second: curvature.map(
        (x: number, k: number): number => x + acceleration * tangent[k]!,
      ) as Patch.Vec3,
    };
  }
}

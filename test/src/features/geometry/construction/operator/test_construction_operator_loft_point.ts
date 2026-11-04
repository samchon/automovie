import { AutoMovieLoftChain, AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";

type V3 = [number, number, number];

/**
 * `AutoMovieLoftChain.point` reads a spline chain's point at a station and a
 * phase exactly as the station's whole sampler (`AutoMovieLoftChain.sampler`)
 * does, bit for bit, while it combines only the controls the phase reads.
 *
 * Scenarios:
 * 1. Four made spline chains of order 16 over five layers: cubic (no station curvatures, level layers), quintic (curvatures and moving planes with their station derivatives), lifted on every layer with lift curvatures, and lifted on some layers only (the others lift by zero). At 23 stations (the layers themselves, points between them and both ends) and 19 phases each (negative, past a turn, on and between controls), every coordinate of `point` is `Object.is` the sampler's, read first at a fresh station and again once the station is kept.
 * 2. Red proof: a copy of a chain with one control of one layer moved by 1e-9 mm, read by `point`, differs from the original's sampler at a station beside that layer, so the comparison sees a change of one control's last bits.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public `AutoMovieLoftChain.point` and `AutoMovieLoftChain.sampler` on made chains and compares their coordinates with `Object.is`. It catches a lazily combined control that differs from the row's (another Hermite rule, another order of terms, a lift read from the wrong layer, a missing zero lift), a control the phase reads but the lazy reader never fills, and a kept station that answers for another; any reader equal to the sampler passes.
 * @evidence contracts/testing.md#independent-expectations The expectation is the sampler's own point, the whole-row evaluation `point` replaces; equality is exact, since the claim is the same arithmetic per control.
 * @evidence contracts/testing.md#distinguishing-cases Positive: cubic, quintic, fully and partly lifted chains, fresh and kept stations, phases on and off the controls and outside one turn. Negative: a chain one control off. Harmonic chains keep the sampler itself and are not read here.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_loft_point`; it builds made chains in process and starts no host, browser or GPU.
 */
export function test_construction_operator_loft_point(): void {
  const failures: string[] = [];
  const chains: IAutoMovieLoftChain[] = [made("cubic", false, "none"), made("quintic", true, "none"), made("lifted", true, "all"), made("partly lifted", false, "some")];
  const stations: number[] = [];
  for (let k: number = 0; k <= 22; k++) stations.push((k * 200) / 22);
  const phases: number[] = [-1.3, -0.2, 0, 0.05, 0.3927, 0.7, 1, 1.5, 2, 2.5, Math.PI, 3.5, 4, 4.5, 5, 5.5, 6, 2 * Math.PI, 7.1];
  for (const chain of chains)
    for (const pass of ["fresh", "kept"])
      for (const s of stations) {
        const whole: (t: number) => V3 = AutoMovieLoftChain.sampler(chain, s);
        for (const t of phases) {
          const want: V3 = whole(t);
          const got: V3 = AutoMovieLoftChain.point(chain, s, t);
          if (!got.every((x: number, k: number): boolean => Object.is(x, want[k]))) failures.push(`${chain.name}, ${pass} station ${s}, phase ${t}: point [${got.join(", ")}] against the sampler's [${want.join(", ")}]`);
        }
      }

  // 2. A chain one control off reads differently.
  const original: IAutoMovieLoftChain = chains[1]!;
  const moved: IAutoMovieLoftChain = structuredClone(original);
  moved.name = "moved";
  moved.layers[2]!.coefficients[5] = moved.layers[2]!.coefficients[5]! + 1e-9;
  const s: number = (moved.layers[2]!.y + moved.layers[3]!.y) / 2;
  const reference: (t: number) => V3 = AutoMovieLoftChain.sampler(original, s);
  const t: number = (2 * Math.PI * 5.5) / original.order;
  if (AutoMovieLoftChain.point(moved, s, t).every((x: number, k: number): boolean => Object.is(x, reference(t)[k]))) failures.push("proof: a chain one control off by 1e-9 mm reads the same point");

  if (failures.length !== 0) throw new Error(`${failures.length} failures:\n${failures.slice(0, 40).join("\n")}`);
}

/** A made spline chain of order 16 over five layers from 0 to 200 mm, its numbers from a fixed sequence. */
function made(name: string, quintic: boolean, lift: "none" | "all" | "some"): IAutoMovieLoftChain {
  const N: number = 16;
  let state: number = 12345 + name.length * 977;
  const next = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const row = (scale: number): number[] => Array.from({ length: 2 * N }, (): number => (next() - 0.5) * scale);
  const half = (scale: number): number[] => Array.from({ length: N }, (): number => (next() - 0.5) * scale);
  const ring = (radius: number): number[] =>
    Array.from({ length: 2 * N }, (_: unknown, k: number): number => {
      const phi: number = (2 * Math.PI * (k % N)) / N;
      return (k < N ? radius * Math.cos(phi) : radius * Math.sin(phi)) + (next() - 0.5) * 2;
    });
  const tilt = (y: number): AutoMovieLoftFrame.IFrame => {
    const a: number = 0.1 * next();
    return { origin: [next(), y, next()], u: [Math.cos(a), Math.sin(a), 0], v: [0, 0, 1] };
  };
  const delta = (scale: number): AutoMovieLoftFrame.IFrame => ({
    origin: [(next() - 0.5) * scale, 1, (next() - 0.5) * scale],
    u: [(next() - 0.5) * scale, (next() - 0.5) * scale, 0],
    v: [0, 0, 0],
  });
  const layers: IAutoMovieLoftChain.ILayer[] = [0, 40, 95, 150, 200].map((y: number, i: number): IAutoMovieLoftChain.ILayer => {
    const lifted: boolean = lift === "all" || (lift === "some" && i % 2 === 1);
    return {
      y,
      coefficients: ring(40 + 5 * i),
      slopes: row(0.2),
      ...(quintic ? { curvatures: row(0.01), frame: tilt(y), frameSlopes: delta(0.01), frameCurvatures: delta(0.001) } : {}),
      ...(lifted ? { lift: half(3), liftSlopes: half(0.05), ...(lift === "all" ? { liftCurvatures: half(0.002) } : {}) } : {}),
    };
  });
  return { name, basis: "spline", order: N, rule: "polar", samples: N, layers };
}

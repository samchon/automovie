import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftRelief,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieLoftRelief,
  type IAutoMovieViewPart,
} from "@automovie/engine";

type V3 = [number, number, number];

/**
 * A relief whose axis turns with the phase is cast square to a round base all the way round.
 *
 * Fixture: a tube of radius 20 mm on the horizontal course from station 0 to 100. Its radial direction at phase 0 and its direction of increasing phase there are read off the bare tube. The relief is a 9 by 15 net over stations 20..80 and phases -1.4..1.4 (middle phase 0), every inner control 3 mm, with those two directions as `axis` and `turn`.
 *
 * Scenarios:
 * 1. Direction law: at each sampled phase the composed point is the bare point moved by the height `AutoMovieLoftRelief.height` reads along `cos t axis + sin t turn`, within 1e-9 mm.
 * 2. Radial cast: at each sampled station and phase the composed point stands at 20 mm plus that height from the tube's centre line, within 1e-6 mm, so the height never slides along the wall; with the same net on the fixed `axis` alone the point at phase 0.9 stands more than 0.5 mm nearer.
 * 3. Jet: what the relief adds to the chain's first and second phase derivatives and its mixed derivative in `AutoMovieLoftJet.at` equals central differences of what it adds to the points and to the first derivatives, within 1e-5; the bare tube's own derivatives are left out of the comparison.
 * 4. Fixed axis unchanged: `AutoMovieLoftRelief.direction` of a relief without `turn` is its axis with zero derivatives.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Composes the relief onto a lofted chain and reads `AutoMovieLoftChain.point`, `AutoMovieLoftJet.at` and `AutoMovieLoftRelief.direction`, the readers every consumer of a relief goes through.
 * @evidence contracts/development/testing.md#independent-expectations The direction is recomputed here from the two vectors and the phase; the radial distance is the tube's own radius plus the height; the derivatives are checked against differences of points.
 * @evidence contracts/development/testing.md#distinguishing-cases The same net on a fixed axis is read at a phase far round the tube, where it falls short of the radial cast, so a reader that ignored `turn` fails scenarios 1 and 2.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on one made tube, reached by `--include construction_relief_turn`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the fixture and each numbered scenario with its tolerance.
 */
export function test_construction_relief_turn(): void {
  const failures: string[] = [];
  const bare: IAutoMovieLoftChain | null = AutoMovieViewLoft.create(tube()).chain;
  if (bare === null) throw new Error("The made tube did not loft");
  const at = (chain: IAutoMovieLoftChain, s: number, t: number): V3 => AutoMovieLoftChain.point(chain, s, t) as V3;
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
  const unit = (a: V3): V3 => [a[0] / norm(a), a[1] / norm(a), a[2] / norm(a)];
  const centre = (s: number): V3 => {
    const a: V3 = at(bare, s, 0);
    const b: V3 = at(bare, s, Math.PI);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  };
  const axis: V3 = unit(sub(at(bare, 50, 0), centre(50)));
  const turn: V3 = unit(sub(at(bare, 50, Math.PI / 2), centre(50)));
  const rows: number = 9;
  const columns: number = 15;
  const net: number[] = Array.from({ length: rows * columns }, (_: unknown, k: number): number => {
    const r: number = Math.floor(k / columns);
    const c: number = k % columns;
    return r >= 3 && r < rows - 3 && c >= 3 && c < columns - 3 ? 3 : 0;
  });
  const turning: IAutoMovieLoftRelief = { name: "turning", stations: [20, 80], phases: [-1.4, 1.4], axis, turn, rows, columns, heights: net };
  const fixed: IAutoMovieLoftRelief = { name: "fixed", stations: [20, 80], phases: [-1.4, 1.4], axis, rows, columns, heights: net };
  const round: IAutoMovieLoftChain = { ...bare, reliefs: [turning] };
  const flat: IAutoMovieLoftChain = { ...bare, reliefs: [fixed] };

  // 1-2. The direction law and the radial cast.
  for (const s of [30, 50, 70])
    for (const t of [-1.2, -0.6, 0, 0.5, 1.2]) {
      const h: number = AutoMovieLoftRelief.height(turning, s, t)[0];
      const e: V3 = [0, 1, 2].map((k: number): number => Math.cos(t) * axis[k]! + Math.sin(t) * turn[k]!) as V3;
      const b: V3 = at(bare, s, t);
      const expected: V3 = [b[0] + h * e[0], b[1] + h * e[1], b[2] + h * e[2]];
      const off: number = norm(sub(at(round, s, t), expected));
      if (!(off <= 1e-9)) failures.push(`station ${s} phase ${t}: ${off} mm off the height along the turned axis`);
      const radius: number = norm(sub(at(round, s, t), centre(s)));
      if (!(Math.abs(radius - (20 + h)) <= 1e-6)) failures.push(`station ${s} phase ${t}: radius ${radius} mm, not 20 + ${h}`);
    }
  const height: number = AutoMovieLoftRelief.height(turning, 50, 0.9)[0];
  const short: number = 20 + height - norm(sub(at(flat, 50, 0.9), centre(50)));
  if (!(height > 2 && short > 0.5)) failures.push(`proof: at phase 0.9 the fixed axis stands only ${short} mm short of the radial cast of ${height} mm`);

  // 3. What the relief adds to the phase derivatives, against differences of what it adds to the points and to the first derivatives.
  const step: number = 1e-4;
  const added = (read: (chain: IAutoMovieLoftChain) => readonly number[]): V3 => sub(read(round) as V3, read(bare) as V3);
  const slope = (plus: V3, minus: V3): V3 => sub(plus, minus).map((x: number): number => x / (2 * step)) as V3;
  // The samples stand off the net's knots (stations 20 + 10 i, phases -1.4 + 0.2333 j): at a knot the height's third derivative jumps and a
  // central difference of its first derivative is off by half the step times that jump.
  for (const [s, t] of [[43, 0.8], [55, -1.0], [47, 1.25]] as [number, number][]) {
    const got = (pick: (jet: AutoMovieLoftJet.IJet) => readonly number[]): V3 => added((chain: IAutoMovieLoftChain): readonly number[] => pick(AutoMovieLoftJet.at(chain, s, t)));
    const first: V3 = slope(added((chain: IAutoMovieLoftChain): readonly number[] => at(chain, s, t + step)), added((chain: IAutoMovieLoftChain): readonly number[] => at(chain, s, t - step)));
    const second: V3 = slope(added((chain: IAutoMovieLoftChain): readonly number[] => AutoMovieLoftJet.at(chain, s, t + step).t), added((chain: IAutoMovieLoftChain): readonly number[] => AutoMovieLoftJet.at(chain, s, t - step).t));
    const mixed: V3 = slope(added((chain: IAutoMovieLoftChain): readonly number[] => AutoMovieLoftJet.at(chain, s + step, t).t), added((chain: IAutoMovieLoftChain): readonly number[] => AutoMovieLoftJet.at(chain, s - step, t).t));
    for (const [name, value, want] of [["t", got((jet: AutoMovieLoftJet.IJet): readonly number[] => jet.t), first], ["tt", got((jet: AutoMovieLoftJet.IJet): readonly number[] => jet.tt), second], ["st", got((jet: AutoMovieLoftJet.IJet): readonly number[] => jet.st), mixed]] as [string, V3, V3][]) {
      const off: number = norm(sub(value, want));
      if (!(off <= 1e-5)) failures.push(`station ${s} phase ${t}: the relief's part of jet.${name} is ${off} off the difference`);
    }
  }

  // 4. A fixed axis.
  const [e, e1, e2] = AutoMovieLoftRelief.direction(fixed, 0.9);
  if (norm(sub(e, axis)) !== 0 || norm(e1) !== 0 || norm(e2) !== 0) failures.push("a relief without a turn does not read its own axis with zero derivatives");

  if (failures.length > 0) throw new Error("relief turn:\n" + failures.join("\n"));
}

/** A 20 mm tube on the horizontal course, open at both ends. */
function tube(): IAutoMovieViewPart {
  const outline = (sign: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "bottom", station: 0, value: 20 * sign },
      { site: "top", station: 100, value: 20 * sign },
    ],
  });
  return {
    name: "turn-tube",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 25, 50, 75, 100],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [
          { site: "bottom", station: 0, value: AutoMovieViewSection.ELLIPSE },
          { site: "top", station: 100, value: AutoMovieViewSection.ELLIPSE },
        ],
      },
    },
    order: 16,
    samples: 16,
  };
}

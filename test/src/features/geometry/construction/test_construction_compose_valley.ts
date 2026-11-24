import type {
  IAutoMovieConstructionSplitCompose,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { AutoMovieConstructionSplitCompose } from "@automovie/engine";

type V3 = [number, number, number];

/**
 * A composed end derives each seam's valley from its children's skins cut by the seam plane, and measures the host's end ring against the composed outline: zero on a host that ends on the outline, the closed-form distance, refused, on a round ring.
 *
 * Fixture (millimetres, made closed-form skins; the end plane `z = 0` with the normal `(0, 0, -1)`, out of the host): child `B` is the cylinder of radius `r` about the line through the origin along `(0, 0, -1)`; `A` and `C` are its mirror images in the seam planes, cylinders of radius `r` through `(+-s, 0, 0)` leaning by `b` away from `B` (axes `(+-sin b, 0, -cos b)`); order `A`, `B`, `C`; stations from -12 to 60 along each axis, 32 columns, rail 6. In the end plane `A`'s section is `((x - s) cos b)^2 + y^2 = r^2` and `B`'s `x^2 + y^2 = r^2`; they cross at `x* = s cos b / (1 + cos b)`, `y* = +-sqrt(r^2 - x*^2)`. The seam plane between them passes through both forks with the normal `(-cos(b / 2), 0, -sin(b / 2))`, and `B`'s skin meets it where `x = sqrt(r^2 - y^2)`, at the distance `(sqrt(r^2 - y^2) - x*) / sin(b / 2)` from the forks' chord along the bisector; `A`'s cut is the same curve by the mirror. The host's ring is a made closed form by its phase: the composed outline itself, its four lobes each a quarter turn of phase and meeting at the forks (the outline is not star-shaped about `B`'s centre, so it is not given in polar form), or a circle of radius 24.5.
 *
 * Scenarios:
 * 1. The valley's closed form, `r = 9`, `s = 15`, `b = 0.3`, the host on the outline: each seam's seven knots stand at the shares `i / 8` of the chord between its forks and at the depth `(sqrt(81 - y^2) - x*) / sin 0.15`, within 1e-8 mm; the deepest is the middle one, `(9 - x*) / sin 0.15`.
 * 2. The valley moves with the children: with `b = 0.45`, with `s = 16` and with `r = 10` the knots stand at the same closed form of the new values, within 1e-8 mm. Red control: the base valley's middle depth differs from each by more than 0.5 mm, and a straight chord's depth, 0, from all by more than 6 mm.
 * 3. A host that ends on the outline stands at zero: the reported greatest distance is under 1e-8 mm, and each seam's forks on the ring are the phases at which the ring's lobes meet, `0.01 +- pi / 4` and `0.01 +- 3 pi / 4`, within 1e-9 rad.
 * 4. A round ring is refused with its distance: the circle of radius 24.5 stands `24.5 - 9 = 15.5` mm from `B`'s lobe wherever that lobe is its nearest, and a little more beside a fork, where the fork is nearer than either lobe's foot; the refusal names a greatest distance between 15.5 and 15.52 mm and the band's length 6.
 * 5. A ring within the band's length is admitted and reported: the outline scaled by 1.1 about the origin stands up to more than 0.5 mm and less than 6 mm off, and the report's greatest distance is at least its mean.
 * 6. A terminal ring with a fixed-station point reader requires one preparation and one read per uniform sample. Both seam searches and the outline-distance check use those same physical samples.
 * 7. Shrinking the outline host by one tenth along the chord axis leaves the composed forks outside the host chord. The same cylindrical skin law is read at interior shares of the exact shorter chord, without passing any external points to the seam.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieConstructionSplitCompose.derive` on made closed-form skins and rings and reads its valleys, seam phases and host report. It catches a valley left on the chord, read from the wrong arc or the wrong plane, knots that ignore a child's angle, spacing or size, a host ring spanned silently and a distance measured to a covered arc.
 * @evidence contracts/development/testing.md#independent-expectations The crossing of two sections, the cylinder's cut by the bisector plane, the outline's polar radius and the circle's distance to a lobe are solved here by hand from the fixture; none reads the operator's cuts.
 * @evidence contracts/development/testing.md#distinguishing-cases Three changed values against the base; a ring on the outline against a round one and a scaled one; a derived valley against a straight chord.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_compose_valley`; it evaluates made closed forms in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each numbered case, its geometric input, and its closed form or sampling expectation.
 */
export function test_construction_compose_valley(): void {
  const failures: string[] = [];
  const turn: number = 2 * Math.PI;
  const n: number = 32;
  const stations: number[] = Array.from({ length: 10 }, (_: unknown, i: number): number => -12 + 8 * i);
  /** A cylinder of radius r about the line through `origin` along the unit `axis`, its phase 0 along `ex`. */
  const tube = (name: string, r: number, origin: V3, ex: V3, axis: V3): IAutoMovieConstructionSplitCompose.IChild => {
    const at = (cos: number, sin: number, u: number): V3 => [origin[0] + r * cos * ex[0] + u * axis[0], origin[1] + r * sin + u * axis[1], origin[2] + r * cos * ex[2] + u * axis[2]];
    const surface: IAutoMovieSolidSurface = {
      name,
      orientation: 1,
      period: turn,
      domain: [-12, 60],
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
        p: at(Math.cos(v), Math.sin(v), u),
        u: axis,
        v: [-r * Math.sin(v) * ex[0], r * Math.cos(v), -r * Math.sin(v) * ex[2]],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-r * Math.cos(v) * ex[0], -r * Math.sin(v), -r * Math.cos(v) * ex[2]],
      }),
    };
    return { name, surface, into: 1, stations, rail: 6, basis: { origin, x: ex, y: [0, 1, 0], z: axis } };
  };
  const fork = (s: number, b: number): number => (s * Math.cos(b)) / (1 + Math.cos(b));
  /** The ring's phase at which `A`'s lobe begins on the outline ring, a little off the ring's samples. */
  const SHIFT: number = 0.01;
  /**
   * The composed outline as a ring by a phase: four quarter turns, `A`'s lobe by its ellipse's own angle from one fork to the other
   * through its far side, `B`'s upper lobe by its polar angle, `C`'s lobe as `A`'s mirrored, `B`'s lower lobe; the quarters meet at
   * the forks, the first beginning at the phase `SHIFT - pi / 4`.
   */
  const outline = (r: number, s: number, b: number) => (phi: number): [number, number] => {
    const x: number = fork(s, b);
    const y: number = Math.sqrt(r * r - x * x);
    const leaning: number = Math.atan2(y / r, ((x - s) * Math.cos(b)) / r);
    const polar: number = Math.atan2(y, x);
    const t: number = ((((phi - SHIFT + Math.PI / 4) % turn) + turn) % turn) / (Math.PI / 2);
    const quarter: number = Math.min(3, Math.floor(t));
    const f: number = t - quarter;
    const lobe = (angle: number): [number, number] => [s + (r / Math.cos(b)) * Math.cos(angle), r * Math.sin(angle)];
    if (quarter === 0) return lobe(-leaning + 2 * leaning * f);
    if (quarter === 1) return [r * Math.cos(polar + (Math.PI - 2 * polar) * f), r * Math.sin(polar + (Math.PI - 2 * polar) * f)];
    if (quarter === 2) {
      const [px, py]: [number, number] = lobe(leaning - 2 * leaning * f);
      return [-px, py];
    }
    return [r * Math.cos(Math.PI + polar + (Math.PI - 2 * polar) * f), r * Math.sin(Math.PI + polar + (Math.PI - 2 * polar) * f)];
  };
  const derive = (
    r: number,
    s: number,
    b: number,
    at: (phi: number) => [number, number],
    observed?: { preparations: number; uniform: number; jets: number },
  ): IAutoMovieConstructionSplitCompose.IDerived | string => {
    const phases: Set<number> = new Set(
      Array.from({ length: 8 * n }, (_, k: number): number => (turn * k) / (8 * n)),
    );
    const point = (phi: number): V3 => {
      const [x, y] = at(phi);
      return [x, y, 0];
    };
    const host: IAutoMovieSolidSurface = {
      name: "host",
      orientation: 1,
      period: turn,
      jet: (_: number, phi: number): IAutoMovieSolidSurface.IJet => {
        if (observed !== undefined) ++observed.jets;
        return {
          p: point(phi),
          u: [0, 0, -1],
          v: [0, 0, 0],
          uu: [0, 0, 0],
          uv: [0, 0, 0],
          vv: [0, 0, 0],
        };
      },
      ...(observed === undefined ? {} : {
        pointAt: (station: number): ((phase: number) => V3) => {
          if (station !== 0) throw new Error(`unexpected host scope: ${station}`);
          ++observed.preparations;
          return (phase: number): V3 => {
            if (phases.has(phase)) ++observed.uniform;
            return point(phase);
          };
        },
      }),
    };
    return AutoMovieConstructionSplitCompose.derive({
      compose: { frame: "tree", plane: { point: [0, 0, 0], normal: [0, 0, -1] } },
      host: { surface: host, station: 0, basis: { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, -1] } },
      children: [
        tube("A", r, [s, 0, 0], [Math.cos(b), 0, Math.sin(b)], [Math.sin(b), 0, -Math.cos(b)]),
        tube("B", r, [0, 0, 0], [1, 0, 0], [0, 0, -1]),
        tube("C", r, [-s, 0, 0], [Math.cos(b), 0, -Math.sin(b)], [-Math.sin(b), 0, -Math.cos(b)]),
      ],
      count: n,
    });
  };
  /** The closed-form knots against a derivation's: the greatest error in place and depth, and the middle depth. */
  const check = (what: string, r: number, s: number, b: number): number => {
    const made: IAutoMovieConstructionSplitCompose.IDerived | string = derive(r, s, b, outline(r, s, b));
    if (typeof made === "string") {
      failures.push(`${what}: ${made}`);
      return NaN;
    }
    const x: number = fork(s, b);
    const y: number = Math.sqrt(r * r - x * x);
    let off: number = 0;
    for (const knots of made.valleys) {
      if (knots.length !== n / 4 - 1) failures.push(`${what}: ${knots.length} knots, not ${n / 4 - 1}`);
      knots.forEach(([along, depth]: IAutoMovieConstructionSplitSeam.Knot, i: number): void => {
        const place: number = (2 * y * (i + 1)) / (n / 4);
        off = Math.max(off, Math.abs(along - place), Math.abs(depth - (Math.sqrt(r * r - (place - y) ** 2) - x) / Math.sin(b / 2)));
      });
    }
    if (!(off <= 1e-8)) failures.push(`${what}: the valley's knots stand ${off} mm off (sqrt(r^2 - y^2) - x*) / sin(b / 2)`);
    if (!(made.host.max <= 1e-8)) failures.push(`${what}: the host on the outline stands ${made.host.max} mm off it`);
    // The forks on the ring: the phases at which its quarters meet.
    const expected: [number, number][] = [[SHIFT - Math.PI / 4, SHIFT + Math.PI / 4], [SHIFT - (3 * Math.PI) / 4, SHIFT + (3 * Math.PI) / 4]];
    made.seams.forEach(([a, e]: [number, number], j: number): void => {
      if (!(Math.abs(a - expected[j]![0]) <= 1e-9 && Math.abs(e - expected[j]![1]) <= 1e-9)) failures.push(`${what}: seam ${j}'s phases [${a}, ${e}], not [${expected[j]!.join(", ")}]`);
    });
    return made.valleys[0]![n / 8 - 1]![1];
  };

  // 1-3. The closed form, and its movement with the children.
  const base: number = check("base", 9, 15, 0.3);
  if (!(Math.abs(base - (9 - fork(15, 0.3)) / Math.sin(0.15)) <= 1e-8)) failures.push(`base: the middle knot is ${base} mm deep, not ${(9 - fork(15, 0.3)) / Math.sin(0.15)}`);
  for (const [what, r, s, b] of [["lean 0.45", 9, 15, 0.45], ["spacing 16", 9, 16, 0.3], ["radius 10", 10, 15, 0.3]] as const) {
    const moved: number = check(what, r, s, b);
    if (!(Math.abs(moved - base) > 0.5 && moved > 6)) failures.push(`red control: ${what}'s middle depth ${moved} mm against the base's ${base} and a chord's 0`);
  }

  // 4. A round ring is refused with its closed-form distance.
  const round: IAutoMovieConstructionSplitCompose.IDerived | string = derive(9, 15, 0.3, (phi: number): [number, number] => [24.5 * Math.cos(phi), 24.5 * Math.sin(phi)]);
  const named: RegExpMatchArray | null = typeof round === "string" ? round.match(/up to ([0-9.]+) mm .*length ([0-9.]+) mm/) : null;
  if (named === null || !(Number(named[1]) >= 15.5 - 1e-9 && Number(named[1]) <= 15.52 && Number(named[2]) === 6)) failures.push(`round ring: ${typeof round === "string" ? round : "admitted, greatest distance " + round.host.max}`);

  // 5. A ring within the band's length is admitted and reported.
  const scaled: IAutoMovieConstructionSplitCompose.IDerived | string = derive(9, 15, 0.3, (phi: number): [number, number] => {
    const [px, py]: [number, number] = outline(9, 15, 0.3)(phi);
    return [1.1 * px, 1.1 * py];
  });
  if (typeof scaled === "string") failures.push(`scaled ring: ${scaled}`);
  else if (!(scaled.host.max > 0.5 && scaled.host.max < 6 && scaled.host.max >= scaled.host.mean && scaled.host.mean > 0)) failures.push(`scaled ring: greatest ${scaled.host.max} mm, mean ${scaled.host.mean} mm`);

  const observed: { preparations: number; uniform: number; jets: number } = {
    preparations: 0,
    uniform: 0,
    jets: 0,
  };
  const prepared: IAutoMovieConstructionSplitCompose.IDerived | string =
    derive(9, 15, 0.3, outline(9, 15, 0.3), observed);
  if (typeof prepared === "string" || prepared.host.max > 1e-8 || prepared.seams.length !== 2)
    failures.push(`prepared host ring changed the physical composition: ${prepared}`);
  if (observed.preparations !== 1 || observed.jets !== 0 || observed.uniform !== 8 * n)
    failures.push(`fixed host ring: ${JSON.stringify(observed)}`);

  const original = outline(9, 15, 0.3);
  const reduction: number = 0.9;
  const narrow: IAutoMovieConstructionSplitCompose.IDerived | string = derive(9, 15, 0.3, (phi: number): [number, number] => {
    const [px, py]: [number, number] = original(phi);
    return [px, reduction * py];
  });
  if (typeof narrow === "string") failures.push(`narrow ring: ${narrow}`);
  else {
    const x: number = fork(15, 0.3);
    const y: number = reduction * Math.sqrt(81 - x * x);
    for (const knots of narrow.valleys) {
      if (knots.length !== n / 4 - 1) failures.push(`narrow ring: ${knots.length} knots, not ${n / 4 - 1}`);
      knots.forEach(([along, depth]: IAutoMovieConstructionSplitSeam.Knot, i: number): void => {
        const share: number = (2 * y * (i + 1)) / (n / 4);
        const exact: number = (Math.sqrt(81 - (share - y) ** 2) - x) / Math.sin(0.15);
        if (!(Math.abs(along - share) <= 1e-8 && Math.abs(depth - exact) <= 1e-8))
          failures.push(`narrow ring: knot ${along}, ${depth} mm; expected ${share}, ${exact} mm`);
      });
    }
  }

  if (failures.length !== 0) throw new Error("test_construction_compose_valley:\n" + failures.join("\n"));
}

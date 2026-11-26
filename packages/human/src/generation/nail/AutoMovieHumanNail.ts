import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNail,
} from "@automovie/interface";

/**
 * A nail on a digit's distal segment: one law for every finger and toe.
 *
 * The nail is a feature of the digit's own skin: a relief of the digit's family (`INail.bed`) that takes the skin inside the nail's
 * outline onto the plate's upper face, with the folds' walls outside the outline, and a second relief (`INail.strip`) that draws the
 * free edge's step for a close-up. The whole distal segment's skin follows one bone, so the nail rides it; a material finds its
 * region by `owns`. The plate is also returned as a conic family of its own (`INail.plate`), a straight body with these sections
 * which nothing joins: a join cannot serve a part whose closed end lies on its own join loop.
 *
 * Inputs are the distal segment's frame (the last joint's centre, the distal and the dorsal direction), the digit's own skin as its
 * family lofts it, and published proportions (`IProportions`). Nothing is read from a reference body and nothing is stored per digit.
 *
 * The construction, in order:
 *
 * 1. The digit's breadth `B` across the last joint and its length `T` from that joint to the tip are read on the skin.
 * 2. The plate's width is `W = width B` and its length from the proximal fold to the tip `W / aspect`, so the proximal fold stands
 *    at `x_f = T - W / aspect` along the distal direction.
 * 3. The nail's own frame, from the skin over the whole bed: its long axis is the straight line through the middles of the skin's
 *    breadth, its roll levels the skin's two edges on the mean, and its pitch is the taut line over the dorsal skin from the fold.
 * 4. The free edge's apex stands on the middle line where a straight edge laid from the fold, one `fold` under the skin there, stands
 *    one `thickness` over the skin. The crown runs between those two places with the bed's own lengthwise arch over that chord.
 * 5. Every section across is a conic through its crown and its two edges. At the fold and at the free edge the edges stand under the
 *    crown by what the skin's edges stand under the skin's crown there; midway they stand under it by the published circle's sagitta;
 *    the difference runs out to both ends. A digit with no published radius is its bed's arc all along.
 * 6. The outline is the two edges, which keep the plate's share of the digit's breadth, the proximal fold's half ellipse, and the
 *    free edge, which is the tip's own plan contour moved back by the apex's distance from the tip.
 * 7. The bed takes the skin inside the outline onto the plate's upper face. Outside the outline the fold's wall rises from the plate's
 *    edge to the skin: beside the plate over the room the digit has there, behind it over two ramps. At the free edge the plate comes
 *    down to the skin inside the outline, as a slope in the bed and as a step one thickness long in the strip.
 */
export namespace AutoMovieHumanNail {

  /**
   * Whether a point of the digit's skin belongs to the nail: inside the plate's outline in the nail's plan and on the plate's side of
   * the digit. The nail is a relief of the digit's own face and owns no vertex of the mesh, so a material finds its region by this.
   *
   * The outline is the one the bed is made from: the two edges, the proximal half ellipse and the free edge. A point of the digit's
   * underside lies inside that plan as well, so the point must also stand over the plate's back.
   *
   * @param nail The nail.
   * @param point A point in the figure's frame, mm.
   */
  export function owns(nail: IAutoMovieHumanNail.INail, point: readonly number[]): boolean {
    const { frame, plan }: IAutoMovieHumanNail.INail = nail;
    const d: AutoMovieVector3Tuple = sub(point, frame.origin);
    const [x, y, z]: [number, number, number] = [dot(d, frame.distal), dot(d, frame.dorsal), dot(d, cross(frame.distal, frame.dorsal))];
    if (!(x >= plan.span[0] && x <= tabled(plan.front, z) && y >= plan.floor)) return false;
    const [centre, deep, wide]: [number, number, number] = plan.bend;
    if (x < centre) return Math.abs(z) <= wide * Math.sqrt(Math.max(0, 1 - ((centre - x) / deep) ** 2));
    return Math.abs(z) <= tabled(plan.edges, x);
  }

  /** A table `[at, value][]` with `at` increasing, read at a place: straight between its rows and held past its ends. */
  function tabled(table: readonly [number, number][], at: number): number {
    let i: number = 0;
    while (i < table.length - 2 && at >= table[i + 1]![0]) i += 1;
    const [a, b]: [[number, number], [number, number]] = [table[i]!, table[i + 1]!];
    return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, (at - a[0]) / (b[0] - a[0])));
  }

  /** The bed's net spacing over the ramp's half width: a roll is resolved by samplings a quarter of it apart (the lofting skill's fitting rule). */
  const NET: number = 0.5;

  /** The bed's depth under the plate's upper face over the fold's depth: the skin under the plate only has to stay inside the plate's body. */
  const UNDER: number = 0;

  /** The ramp's half width over the fold's depth. */
  const RAMP: number = 2;

  /** Phases a ring of the skin is read at before a point on it is refined: a digit's section turns by 2 degrees between two of them. */
  const RING: number = 180;

  /** The ellipse's shoulder: `sqrt(2) - 1`, the conic through the middle of a quarter ellipse. */
  const ELLIPSE: number = Math.SQRT2 - 1;

  const sub = (a: readonly number[], b: readonly number[]): AutoMovieVector3Tuple => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mix = (a: AutoMovieVector3Tuple, p: number, b: AutoMovieVector3Tuple, q: number): AutoMovieVector3Tuple => [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
  const unit = (a: AutoMovieVector3Tuple): AutoMovieVector3Tuple => {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  };

  /** Stations along the bed the nail's frame is fitted over. */
  const BED: number = 9;

  /**
   * How far the fitted skin may stand off the digit across the plate, mm: the greatest rms of f1's fitted tip sections (0.08 to
   * 0.17 mm, the body note's dome table). Over the plate's half width it is the angle a level roll read on that skin can be off by.
   */
  const FIT_RMS: number = 0.17;

  /** The golden section's share, `(sqrt(5) - 1) / 2`. */
  const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

  /** The vector a 3 by 3 matrix takes to a given one, by determinants; `null` where the matrix has none. */
  function solved(matrix: readonly number[][], vector: readonly number[]): number[] | null {
    const det = (m: readonly number[][]): number => m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) - m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) + m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const whole: number = det(matrix);
    if (whole === 0 || !Number.isFinite(whole)) return null;
    return [0, 1, 2].map((k: number): number => det(matrix.map((row: number[], a: number): number[] => row.map((x: number, b: number): number => (b === k ? vector[a]! : x)))) / whole);
  }

  /**
   * The middle weight of the conic from a level crown to an upright side extreme that turns on `radius` at the crown, where a conic of
   * weight `w` and depth `drop` turns on `2 w^2 side^2 / drop`, and has fallen `sagitta` at the edge. By bisection between the section
   * model's bounds of a shoulder `w / (1 + w)`, 0.03 and 0.85; where no weight between them passes through the edge, the ellipse's.
   */
  function weight(side: number, radius: number, edge: number, sagitta: number): number {
    const miss = (w: number): number => sink(side, (2 * w * w * side * side) / radius, w, edge) - sagitta;
    let [a, b]: [number, number] = [0.03 / 0.97, 0.85 / 0.15];
    if (miss(a) * miss(b) > 0) return Math.SQRT1_2;
    const rising: boolean = miss(b) > 0;
    for (let i: number = 0; i < 48; ++i) {
      const w: number = (a + b) / 2;
      if (miss(w) > 0 === rising) b = w;
      else a = w;
    }
    return (a + b) / 2;
  }

  /**
   * How far the conic from a level crown to an upright side extreme has fallen a distance from the median line. The conic is the rational
   * quadratic on the crown `(0, 0)`, the corner `(side, 0)` and the side extreme `(side, drop)` with the middle weight `w`: at parameter
   * `t` it stands `side (2 w t (1 - t) + t^2) / D` from the median line and `drop t^2 / D` under the crown, `D = (1 - t)^2 + 2 w t (1 - t) + t^2`.
   */
  export function sink(side: number, drop: number, w: number, z: number): number {
    let [a, b]: [number, number] = [0, 1];
    for (let i: number = 0; i < 48; ++i) {
      const t: number = (a + b) / 2;
      if ((side * (2 * w * t * (1 - t) + t * t)) / ((1 - t) * (1 - t) + 2 * w * t * (1 - t) + t * t) < z) a = t;
      else b = t;
    }
    const t: number = (a + b) / 2;
    return (drop * t * t) / ((1 - t) * (1 - t) + 2 * w * t * (1 - t) + t * t);
  }

  /** The quintic step from 0 at 0 to 1 at 1, C2 at both ends. */
  export function step(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * x * (10 + x * (-15 + 6 * x));
  }

  /** Read a skin in a frame. */
  function reader(skin: IAutoMovieHumanNail.ISkin, frame: IAutoMovieHumanNail.IFrame): IReader {
    const lateral: AutoMovieVector3Tuple = cross(frame.distal, frame.dorsal);
    const at = (station: number, phase: number): AutoMovieVector3Tuple => {
      const d: AutoMovieVector3Tuple = sub(skin.point(station, phase), frame.origin);
      return [dot(d, frame.distal), dot(d, frame.dorsal), dot(d, lateral)];
    };
    // The distance along grows with the station on the distal segment, so a bisection finds the station. Twenty-four halvings take a
    // distal segment of 30 mm under 2e-6 mm, the chord error of the net a digit's skin is read on (`AutoMovieHumanF1Nails`).
    const station = (x: number, phase: number): number => {
      let [low, high]: [number, number] = [skin.first, skin.tip];
      for (let i: number = 0; i < 24; ++i) {
        const middle: number = (low + high) / 2;
        if (at(middle, phase)[0] < x) low = middle;
        else high = middle;
      }
      return (low + high) / 2;
    };
    const lateralAt = (x: number, phase: number): AutoMovieVector3Tuple => at(station(x, phase), phase);
    // The skin's ring a distance along, read once at `RING` phases: every question about that distance starts from it.
    const rings: Map<number, AutoMovieVector3Tuple[]> = new Map();
    const ring = (x: number): AutoMovieVector3Tuple[] => {
      let made: AutoMovieVector3Tuple[] | undefined = rings.get(x);
      if (made === undefined) rings.set(x, (made = Array.from({ length: RING }, (_: unknown, k: number): AutoMovieVector3Tuple => lateralAt(x, (2 * Math.PI * k) / RING))));
      return made;
    };
    // The dorsal phase: where the skin crosses the median plane on the dorsal side, found once on a scan and refined by bisection.
    const crossing = (x: number, z: number, from: number, to: number): number => {
      let [a, b]: [number, number] = [from, to];
      const sign: number = Math.sign(lateralAt(x, a)[2] - z);
      for (let i: number = 0; i < 48; ++i) {
        const middle: number = (a + b) / 2;
        if (Math.sign(lateralAt(x, middle)[2] - z) === sign) a = middle;
        else b = middle;
      }
      return (a + b) / 2;
    };
    const find = (x: number, z: number): { station: number; phase: number; height: number } => {
      const count: number = RING;
      const around: AutoMovieVector3Tuple[] = ring(x);
      let best: { phase: number; height: number } | null = null;
      for (let k: number = 0; k < count; ++k) {
        const [a, b]: [number, number] = [(2 * Math.PI * k) / count, (2 * Math.PI * (k + 1)) / count];
        const [p, q]: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] = [around[k]!, around[(k + 1) % count]!];
        if (p[2] - z === 0 || (p[2] - z) * (q[2] - z) < 0) {
          const phase: number = crossing(x, z, a, b);
          const height: number = lateralAt(x, phase)[1];
          if (best === null || height > best.height) best = { phase, height };
        }
      }
      if (best === null) throw new Error("nail: the skin has no dorsal point " + x.toFixed(2) + " mm along and " + z.toFixed(2) + " mm aside; it spans " + Math.min(...around.map((p: AutoMovieVector3Tuple): number => p[2])).toFixed(2) + " to " + Math.max(...around.map((p: AutoMovieVector3Tuple): number => p[2])).toFixed(2) + " mm there");
      return { station: station(x, best.phase), phase: best.phase, height: best.height };
    };
    const extent = (x: number): [number, number] => {
      let [least, greatest]: [number, number] = [Infinity, -Infinity];
      for (const p of ring(x)) {
        least = Math.min(least, p[2]);
        greatest = Math.max(greatest, p[2]);
      }
      return [least, greatest];
    };
    return { lateral, at, station, ring, find, extent };
  }

  /**
   * One digit's nail.
   *
   * @param name The plate's chain name.
   * @param bed The bed's relief name.
   * @param segment The distal segment's frame.
   * @param skin The digit's own skin.
   * @param proportions The digit's row.
   * @param margin How far the plate's side extreme stands outside its edge, under the lateral fold, mm: room for the merge's rail.
   * @param spread How far a digit's nail may turn about its long axis from its segment's frame, rad: the spread of the prior the
   *   skin's levelling is weighed against.
   */
  export function create(name: string, bed: string, segment: IAutoMovieHumanNail.IFrame, skin: IAutoMovieHumanNail.ISkin, proportions: IAutoMovieHumanNail.IProportions, margin: number, spread: number): IAutoMovieHumanNail.INail {
    // 1. Breadth across the joint and length to the tip, in the segment's frame.
    const first: IReader = reader(skin, segment);
    const across: [number, number] = first.extent(0);
    const breadth: number = across[1] - across[0];
    let width: number = proportions.width * breadth;
    let half: number = width / 2;
    const tip0: number = first.at(skin.tip, 0)[0];
    let fold0: number = tip0 - width / proportions.aspect;
    // The middle of the skin's breadth a distance along: the dorsal profile and the plate's edges are read about it.
    const mid = (r: IReader, x: number): number => {
      const [a, b]: [number, number] = r.extent(x);
      return (a + b) / 2;
    };
    if (!(fold0 > 0)) throw new Error("nail: " + name + "'s proximal fold stands " + fold0.toFixed(2) + " mm from the last joint, behind it");

    // 3. The nail's frame from the digit's own skin, over the whole bed. A rigid plate lies on its bed along its whole length, so
    // no one station sets its frame: at `BED` stations from the fold nine tenths of the way to the tip, the long axis is the straight
    // line fitted by least squares to the middles of the skin's breadth (the segment's axis runs to the pad's far point and stands off
    // them), and the roll is the one at which the turns that would level the skin's two edges at each station have a mean of zero.
    let frame: IAutoMovieHumanNail.IFrame = segment;
    let roll: number = 0;
    const midway0: number = (fold0 + tip0) / 2;
    const bed0: number[] = Array.from({ length: BED }, (_: unknown, k: number): number => fold0 + (0.9 * (tip0 - fold0) * k) / (BED - 1));
    const mean = (values: readonly number[]): number => values.reduce((sum: number, x: number): number => sum + x, 0) / values.length;
    let passes: number = 0;
    const residuals: [number, number, number][] = [];
    // What the roll's objective read on the last pass.
    let misfit: number = 0;
    let objective: number = 0;
    let conditioning: number = 0;
    const levelling: [number, number][] = [];
    // The greatest of the values round a ring, by the parabola through the greatest sample and its two neighbours.
    const peak = (values: readonly number[]): number => {
      let top: number = 0;
      for (let k: number = 1; k < values.length; ++k) if (values[k]! > values[top]!) top = k;
      const [before, here, after]: [number, number, number] = [values[(top + values.length - 1) % values.length]!, values[top]!, values[(top + 1) % values.length]!];
      const bend: number = before - 2 * here + after;
      return bend < 0 ? here - (after - before) ** 2 / (8 * bend) : here;
    };
    // The dorsal height of a ring `[height, aside][]` at an offset aside, on the ring's own chord there (two degrees of the ring: a
    // thousandth of its reach off the skin).
    const crest = (ring: readonly [number, number][], z: number): number => {
      let best: number = -Infinity;
      for (let k: number = 0; k < ring.length; ++k) {
        const [p, q]: [[number, number], [number, number]] = [ring[k]!, ring[(k + 1) % ring.length]!];
        if (p[1] === q[1] || (p[1] - z) * (q[1] - z) > 0) continue;
        best = Math.max(best, p[0] + ((q[0] - p[0]) * (z - p[1])) / (q[1] - p[1]));
      }
      return best;
    };
    // The stations are cut square to the long axis, so at a fixed axis the rings are fixed, and a roll or a shift of the frame only
    // turns the coordinates the same rings are read in: on them the roll is settled alone, by its objective below, with no skin
    // read. But every pass cuts the rings anew at the axis the pass before fitted, and the re-cut rings feed the shift, the slope
    // and the roll back into each other at first order: stepped by what each pass asked, the three fell by 0.3 to 0.6 a pass and
    // two of f1's toes ended at the cap (run 16-41-29). So the three are solved together, by a secant step: the matrix that tells
    // how the last step changed what was asked, started as the identity (the plain step) and corrected each pass by Broyden's
    // rank-one rule, is solved for the step that would leave nothing asked. The fixed point is the plain iteration's whatever the
    // matrix is. A step over eight times what was asked would mean a contraction slower than seven eighths a pass, beyond any
    // read on f1 (0.3 to 0.8), and starts the matrix again. The shift is counted in bed lengths, so the three are of one scale.
    const bedLength: number = tip0 - fold0;
    let secant: number[][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    let taken: { wanted: number[]; move: number[] } | null = null;
    for (let i: number = 0, last: number = Infinity; i < 24 && Math.abs(last) > 1e-7; ++i) {
      passes = i + 1;
      const cut: IReader = reader(skin, frame);
      const rings: AutoMovieVector3Tuple[][] = bed0.map((x: number): AutoMovieVector3Tuple[] => cut.ring(x));
      // The frame rolled by an angle: `dorsal cos + lateral sin`, so a point `[height, aside]` reads `[y cos + z sin, z cos - y sin]`.
      // A skin that stands higher on the `+lateral` side faces away from it, so the levelling turn leans the dorsal to the lower side.
      const levelled = (by: number): { turn: number; slope: number; shift: number } => {
        const [c, s]: [number, number] = [Math.cos(by), Math.sin(by)];
        const turned: [number, number][][] = rings.map((ring: AutoMovieVector3Tuple[]): [number, number][] => ring.map((p: AutoMovieVector3Tuple): [number, number] => [p[1] * c + p[2] * s, p[2] * c - p[1] * s]));
        const spans: [number, number][] = turned.map((ring: [number, number][]): [number, number] => [-peak(ring.map((p: [number, number]): number => -p[1])), peak(ring.map((p: [number, number]): number => p[1]))]);
        const middles: number[] = spans.map((d: [number, number]): number => (d[0] + d[1]) / 2);
        const lean: number = bed0.reduce((sum: number, x: number, k: number): number => sum + (x - mean(bed0)) * (middles[k]! - mean(middles)), 0) / bed0.reduce((sum: number, x: number): number => sum + (x - mean(bed0)) ** 2, 0);
        const asked: number = mean(
          spans.map((d: [number, number], k: number): number => {
            const e: number = Math.min(half * Math.min(1, (d[1] - d[0]) / (spans[0]![1] - spans[0]![0])), 0.45 * (d[1] - d[0]));
            return -Math.atan2(crest(turned[k]!, middles[k]! + e) - crest(turned[k]!, middles[k]! - e), 2 * e);
          }),
        );
        return { turn: asked, slope: lean, shift: mean(middles) - lean * mean(bed0) };
      };
      // The roll. On these rings the mean levelling turn is a function of the roll alone, and the roll, counted from the segment's
      // frame, is the value that makes `(turn / error)^2 + (roll / spread)^2` least within a quarter turn either side: the skin's
      // evidence, whose error is the fitted skin's across the plate, against the prior that the nail lies in its segment's frame.
      // No crossing of the turn through zero is sought: a far, weakly held one on a round back lowers the first term a little and
      // pays the second in full. Sought as the nearest crossing it rolled f1's two roundest toes 25 and 36 degrees (run 16-16-14).
      // The objective is read at 49 rolls, each of its local leasts is placed by forty golden sections of the two steps about it,
      // and the least of those is taken.
      const error: number = FIT_RMS / half;
      const cost = (by: number): number => (levelled(by).turn / error) ** 2 + ((roll + by) / spread) ** 2;
      levelling.length = 0;
      for (let n: number = 0; n < 25; ++n) levelling.push([-Math.PI / 2 + (n * Math.PI) / 24, levelled(-Math.PI / 2 + (n * Math.PI) / 24 - roll).turn]);
      const [from, to]: [number, number] = [-Math.PI / 2 - roll, Math.PI / 2 - roll];
      const sampled: number[] = Array.from({ length: 49 }, (_: unknown, n: number): number => cost(from + ((to - from) * n) / 48));
      let [fewest, angle]: [number, number] = [Infinity, 0];
      for (let n: number = 0; n <= 48; ++n) {
        if ((n > 0 && sampled[n - 1]! < sampled[n]!) || (n < 48 && sampled[n + 1]! < sampled[n]!)) continue;
        let [shy, past]: [number, number] = [Math.max(from, from + ((to - from) * (n - 1)) / 48), Math.min(to, from + ((to - from) * (n + 1)) / 48)];
        for (let k: number = 0; k < 40; ++k) {
          const [inner, outer]: [number, number] = [past - (past - shy) * GOLDEN, shy + (past - shy) * GOLDEN];
          if (cost(inner) < cost(outer)) past = outer;
          else shy = inner;
        }
        const found: number = cost((shy + past) / 2);
        if (found < fewest) [fewest, angle] = [found, (shy + past) / 2];
      }
      conditioning = (levelled(angle - 0.05).turn - levelled(angle + 0.05).turn) / 0.1;
      misfit = levelled(angle).turn;
      objective = fewest;
      const { slope, shift }: { slope: number; shift: number } = levelled(angle);
      residuals.push([angle, slope, shift]);
      last = Math.abs(angle) + Math.abs(slope) + Math.abs(shift);
      // What this pass asks, and the secant's correction from what the last step did to what was asked then.
      const wanted: number[] = [angle, slope, shift / bedLength];
      const earlier: { wanted: number[]; move: number[] } | null = taken;
      if (earlier !== null) {
        const square: number = earlier.move.reduce((sum: number, x: number): number => sum + x * x, 0);
        if (square > 0)
          secant = secant.map((row: number[], a: number): number[] => {
            const miss: number = earlier.wanted[a]! - wanted[a]! - row.reduce((sum: number, x: number, b: number): number => sum + x * earlier.move[b]!, 0);
            return row.map((x: number, b: number): number => x + (miss * earlier.move[b]!) / square);
          });
      }
      let move: number[] | null = solved(secant, wanted);
      if (move === null || !(Math.hypot(move[0]!, move[1]!, move[2]!) <= 8 * Math.hypot(wanted[0]!, wanted[1]!, wanted[2]!))) {
        secant = [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ];
        move = wanted;
      }
      taken = { wanted, move };
      roll += move[0]!;
      const levelDorsal: AutoMovieVector3Tuple = unit(mix(frame.dorsal, Math.cos(move[0]!), cut.lateral, Math.sin(move[0]!)));
      const sideways: AutoMovieVector3Tuple = cross(frame.distal, levelDorsal);
      frame = { origin: [0, 1, 2].map((k: number): number => frame.origin[k]! + sideways[k]! * move[2]! * bedLength) as AutoMovieVector3Tuple, distal: unit(mix(frame.distal, 1, sideways, move[1]!)), dorsal: levelDorsal };
      // The cap bounds the work, not the answer: where it ends the fit first, what was still asked at the last pass stays in
      // `residuals` and is the frame's remaining uncertainty.
    }
    // Pitch: a plate is straight along its length and lies on the digit from the fold on, so its line is the taut line over the dorsal
    // skin from the fold's point: the steepest rise of the skin's median profile seen from that point, read every quarter millimetre
    // from half a millimetre on. On a skin that only falls away that is its tangent at the fold; on one with a rise before the tip the
    // line rests on the rise.
    const rolled: IReader = reader(skin, frame);

    // 2, bounded. The plate's edges stay on the digit's back: midway along the plate they stand no farther under the crown than `wrap`
    // of the digit's height there. Where the asked width would wrap farther, the plate is narrowed, and shortened with it, to that.
    const [atFold, atMiddle]: [[number, number], [number, number]] = [rolled.extent(fold0), rolled.extent(midway0)];
    const tall: number = Math.max(...rolled.ring(midway0).map((p: AutoMovieVector3Tuple): number => p[1])) - Math.min(...rolled.ring(midway0).map((p: AutoMovieVector3Tuple): number => p[1]));
    const centre: number = (atMiddle[0] + atMiddle[1]) / 2;
    const fall = (e: number): number => rolled.find(midway0, centre).height - (rolled.find(midway0, centre + e).height + rolled.find(midway0, centre - e).height) / 2;
    const asked: number = Math.min(half * Math.min(1, (atMiddle[1] - atMiddle[0]) / (atFold[1] - atFold[0])), 0.49 * (atMiddle[1] - atMiddle[0]));
    let kept: number = asked;
    if (fall(asked) > proportions.wrap * tall)
      for (let [a, b, i]: [number, number, number] = [0, asked, 0]; i < 40; ++i) {
        kept = (a + b) / 2;
        if (fall(kept) > proportions.wrap * tall) b = kept;
        else a = kept;
      }
    const narrowed: number = kept / (half * Math.min(1, (atMiddle[1] - atMiddle[0]) / (atFold[1] - atFold[0])));
    width *= narrowed;
    half *= narrowed;
    fold0 = tip0 - width / proportions.aspect;
    const foldHeight: number = rolled.find(fold0, mid(rolled, fold0)).height;
    const end: number = rolled.at(skin.tip, 0)[0];
    let rise: number = -Infinity;
    for (let x: number = fold0 + 0.5; x < end - 0.25; x += 0.25) rise = Math.max(rise, (rolled.find(x, mid(rolled, x)).height - foldHeight) / (x - fold0));
    // The bed's net needs its three outer rings zero, so three cells before the tip the bed must already lower nothing: the plate's
    // face must stand `UNDER` folds over the skin there. Where the skin falls away too late for that (a short toe whose back slopes
    // all the way to its tip), the line is raised until it does.
    const last: number = end - 3 * NET * RAMP * proportions.fold;
    if (last > fold0 + 1) rise = Math.max(rise, (rolled.find(last, mid(rolled, last)).height + UNDER * proportions.fold - (foldHeight - proportions.fold)) / (last - fold0));
    const pitch: number = Math.atan(rise);
    const lateral: AutoMovieVector3Tuple = rolled.lateral;
    const distal: AutoMovieVector3Tuple = unit(mix(frame.distal, Math.cos(pitch), frame.dorsal, Math.sin(pitch)));
    frame = { origin: frame.origin, distal, dorsal: cross(lateral, distal) };
    const read: IReader = reader(skin, frame);

    // 2 and 3 in the nail's frame: the fold's point is the skin's point found above, the crown line one fold under it.
    const foldPoint: { station: number; phase: number } = rolled.find(fold0, mid(rolled, fold0));
    const at: AutoMovieVector3Tuple = sub(skin.point(foldPoint.station, foldPoint.phase), frame.origin);
    const fold: number = dot(at, frame.distal);
    const crown: number = dot(at, frame.dorsal) - proportions.fold;
    const tip: number = read.at(skin.tip, 0)[0];
    const height = (x: number): number => read.find(x, mid(read, x)).height;

    // 5. The free edge: where the crown line stands one thickness over the skin and stays so to the tip. Read back from the tip a tenth
    // of a millimetre at a time to the last place it does not, then by bisection: a skin that dips and rises again under the plate
    // (the thumb's fitted dorsum does, by 0.2 mm) has an earlier place where the line is that far over it, which is not the plate's end.
    const proud = (x: number): number => crown - height(x) - proportions.thickness;
    let high: number = tip - 1e-3;
    if (proud(high) < 0) throw new Error("nail: " + name + "'s plate never stands a thickness over the skin before the tip");
    let low: number = high;
    while (low > fold && proud(low) >= 0) {
      high = low;
      low -= 0.1;
    }
    low = Math.max(low, fold);
    for (let i: number = 0; i < 48; ++i) {
      const middle: number = (low + high) / 2;
      if (proud(middle) < 0) low = middle;
      else high = middle;
    }
    // The plate's sections end one thickness before the free edge's place on the middle line and its cap closes on from there.
    const free: number = (low + high) / 2;
    const edge: number = free - proportions.thickness;
    if (!(edge > fold)) throw new Error("nail: " + name + "'s plate is shorter than it is thick");
    // The plate's arch along its length. A plate is convex along its length as well as across (the fingernail curvature literature
    // states it so; no normal lengthwise radius was found in it), and it grows on its bed, so its crown takes the bed's own arch:
    // over the straight line from the fold to the free edge it stands by as much as the skin's middle line stands over its own chord
    // between those two places. Both ends keep their definitions, one fold under the skin at the fold and one thickness over it at
    // the free edge, and between them the crown runs from under the digit's back to over it. Held straight, the plate lay a fold
    // under the back all along (run 15-09-05: 5.69 mm against a back at 6.14). Read one net cell apart.
    const archCount: number = Math.max(2, Math.ceil((free - fold) / (NET * RAMP * proportions.fold)) + 1);
    const [backAtFold, backAtFree]: [number, number] = [height(fold), height(free)];
    const arch: [number, number][] = Array.from({ length: archCount }, (_: unknown, k: number): [number, number] => {
      const x: number = fold + ((free - fold) * k) / (archCount - 1);
      return [x, k === 0 || k === archCount - 1 ? 0 : height(x) - (backAtFold + ((backAtFree - backAtFold) * k) / (archCount - 1))];
    });
    const lifted = (x: number): number => (x <= fold || x >= free ? 0 : tabled(arch, x));

    // 4. The sections at the knots, a millimetre apart at most, from the hidden root to the free edge.
    // The plate runs on under the proximal fold two ramps, the room the fold's blend and the bed's ramp need, and no farther: the
    // published 4 mm of plate hidden under the fold (Michelucci 2023) is not modelled, because a digit twists along its length (the
    // big toe's two sides stand 2 mm apart in height at its fold and level midway) and a long straight root showed through the skin on
    // the lower side (probe 13-28-55, a lobe 3.7 mm long).
    const root: number = Math.max(fold - 2 * RAMP * proportions.fold, read.at(skin.first, foldPoint.phase)[0] + 1);
    const count: number = Math.ceil(edge - root) + 1;
    const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => root + ((edge - root) * i) / (count - 1));
    const reach = (x: number): number => {
      const [a, b]: [number, number] = read.extent(x);
      return (b - a) / 2;
    };
    const reachAtFold: number = reach(fold);
    // The plate keeps its share of the digit's breadth where the tip narrows, so its edges run along the skin and never past its sides.
    const edgeAt = (x: number): number => half * Math.min(1, reach(x) / reachAtFold);
    // The plate's arc across. A plate lies on its bed across as it does along. At the fold and at the free edge its section is the
    // bed's: its edges stand under its crown by what the skin's edges stand under the skin's crown there (`bedArc`), so the plate is
    // one fold under the skin all across at the fold and one thickness over it all across at the free edge. The published radius is
    // the plate's own arc where a gauge reads it, on its open middle: midway its edges stand the published circle's sagitta under its
    // crown. Between, the difference of the two, read midway (`ownArc`), runs out to nothing at both ends by `4 t (1 - t)`, the lowest
    // polynomial that is one midway and zero at both ends. A digit with no published radius has no difference to add. One circle held
    // from fold to free edge set a finger's edges 1.1 mm under the skin at the fold and 1.7 mm over it at the far end (run 15-27-45).
    const bedArc = (x: number, e: number): number => height(x) - (read.find(x, mid(read, x) + e).height + read.find(x, mid(read, x) - e).height) / 2;
    const halfway: number = (fold + free) / 2;
    const gauged: number = (proportions.radius ?? 0) * width;
    const ownArc: number = proportions.radius === null ? 0 : gauged - Math.sqrt(gauged * gauged - edgeAt(halfway) ** 2) - bedArc(halfway, edgeAt(halfway));
    const section = (x: number): ISection => {
      const e: number = edgeAt(x);
      // A digit twists along its length (the big toe's two sides stand 2 mm apart in height at its fold and level midway), and the
      // plate, which grows on it, twists with it: each section is turned about the course until the skin's two edges would stand
      // equally high in it, by the angle the two heights ask for. A plate held square all along showed its root through the skin on
      // the lower side (probes 13-27-27 to 13-32-21: a lobe 2 to 3.7 mm long on the big toe).
      const [up, down]: [number, number] = [read.find(x, mid(read, x) + e).height, read.find(x, mid(read, x) - e).height];
      const turn: number = -Math.atan2(up - down, 2 * e);
      // The edge's depth under the crown: the bed's own here and the plate's own share of the published difference. A bed that is flat
      // or hollow across leaves a plate as good as flat, on a radius of a thousand widths. The section's circle is the one through
      // its crown and its two edges: a chord `2 e` with the sagitta `s` lies on the radius `(e^2 + s^2) / (2 s)`.
      const share: number = Math.max(0, Math.min(1, (x - fold) / (free - fold)));
      const sagitta: number = Math.max((e * e) / (2000 * width), height(x) - (up + down) / 2 + 4 * share * (1 - share) * ownArc);
      const arcRadius: number = (e * e + sagitta * sagitta) / (2 * sagitta);
      const under: number = (up + down) / 2 - (crown + lifted(x) - sagitta);
      // The side extreme stands outside the edge by the margin's share of the half width, so it narrows with the plate and stays within
      // the digit's breadth. The upper face is the conic from the level crown to the upright side extreme that turns on the published
      // radius at the crown and passes through the edge (`weight`). The body under it is as deep as that conic on purpose: the
      // bedded skin, half a fold under the face, lies well inside it, so the plate meets the skin along one curve only. A shell one
      // thickness deep met the bed along its underside as well (probe 13-18-26: nine of ten traces lost, `crossings left 4`).
      const side: number = e * (1 + margin / half);
      const w: number = weight(side, arcRadius, e, sagitta);
      return { edge: e, side, drop: (2 * w * w * side * side) / arcRadius, weight: w, sagitta, turn, under, reach: reach(x) };
    };
    // A rigid plate twists at one rate along its length: the sections take the straight line fitted to the turns the skin asks for at
    // each of them, by least squares. Each station's own turn follows the skin's small unevenness, most where the tip narrows and the
    // two edges stand close (probe 13-34-20: the middle toe's blend folded before its far corner).
    const loose: ISection[] = stations.map(section);
    const [meanX, meanTurn]: [number, number] = [stations.reduce((sum: number, x: number): number => sum + x, 0) / count, loose.reduce((sum: number, s: ISection): number => sum + s.turn, 0) / count];
    const rate: number = stations.reduce((sum: number, x: number, i: number): number => sum + (x - meanX) * (loose[i]!.turn - meanTurn), 0) / stations.reduce((sum: number, x: number): number => sum + (x - meanX) ** 2, 0);
    const sections: ISection[] = loose.map((s: ISection, i: number): ISection => ({ ...s, turn: meanTurn + rate * (stations[i]! - meanX) }));
    const shallow: number = Math.min(...sections.map((s: ISection): number => s.drop));
    // The course runs under the crown line half a thickness over the shallowest section's floor, so every section holds it and the
    // cap, which closes on the course, ends inside the digit: the skin must stand over the cap's pole, or the pole would show through it
    // and the meeting curve would run over the one point of the plate that has no chart (probe 13-24-46: `rails` at the toe.middle's pole).
    const below: number = shallow + proportions.thickness / 2;
    // The cap is one thickness long, the plate's end face a quarter round, and shorter where the tip's skin falls away sooner than
    // that: the longest of a thickness and its halves whose pole the skin still covers.
    const pole = (length: number): number => crown - below - height(Math.min(tip - 1e-3, edge + length));
    let cap: number = proportions.thickness;
    while (!(pole(cap) < 0) && cap > proportions.thickness / 64) cap /= 2;
    if (!(pole(cap) < 0)) throw new Error("nail: " + name + "'s plate would end " + pole(cap).toFixed(2) + " mm out of the skin");
    const world = (x: number, y: number): AutoMovieVector3Tuple => [0, 1, 2].map((k: number): number => frame.origin[k]! + frame.distal[k]! * x + frame.dorsal[k]! * y) as AutoMovieVector3Tuple;
    const plate: IAutoMovieHumanConicLoft.IFamily = {
      name,
      centres: [world(root, crown - below), world(edge, crown - below)],
      halves: [],
      up: frame.dorsal,
      layout: AutoMovieHumanConicSection.bilateral(0),
      knots: stations.map((x: number): number => x - root),
      values: [
        // front (+u) extreme on the median line, the crown: u, mm
        sections.map((): number => below),
        // side (+v) extreme: u, mm
        sections.map((s: ISection): number => below - s.drop),
        // side (+v) extreme: v, mm
        sections.map((s: ISection): number => s.side),
        // back (-u) extreme on the median line: u, mm
        sections.map((s: ISection): number => below - s.drop - proportions.thickness),
        // shoulder of the upper face's arc, share
        sections.map((s: ISection): number => s.weight / (1 + s.weight)),
        // shoulder of the lower face's arc, share
        sections.map((): number => ELLIPSE),
      ],
      // The root closes under the fold, never seen. The free edge closes in a cap one thickness long: the plate's end face, a quarter
      // round as high as the plate stands over the skin there. A longer cap would bring the plate's crown down under the skin before
      // its end, and the free edge would dive where the nail has a ledge.
      tips: [
        { from: 0, tip: -proportions.thickness, covered: true },
        // The cap starts on the last knot's own number: `edge - root` and the knot `(root + (edge - root)) - root` may stand one unit in the
        // last place apart, which the loft refuses as two stations (run 13-48-20, the big toe's plate).
        { from: stations[count - 1]! - root, tip: stations[count - 1]! - root + cap },
      ],
      // The engine's chart has `v = u x t` for the course's direction `t`, the opposite of the nail's lateral `t x u`, and a roll turns
      // `u` toward `v`: a section's turn toward the lateral is the roll's negative.
      roll: { knots: stations.map((x: number): number => x - root), values: sections.map((s: ISection): number => -s.turn) },
      pitch: NET * RAMP * proportions.fold,
    };

    // 6. The bed. The plate's upper face over the nail's plane, and how far inside the outline a point of that plane stands.
    const ramp: number = RAMP * proportions.fold;
    const between = (x: number): ISection => {
      let i: number = 0;
      while (i < sections.length - 2 && x >= stations[i + 1]!) i += 1;
      const [a, b]: [ISection, ISection] = [sections[i]!, sections[i + 1]!];
      const t: number = Math.max(0, Math.min(1, (x - stations[i]!) / (stations[i + 1]! - stations[i]!)));
      const lerp = (p: number, q: number): number => p + (q - p) * t;
      return { edge: lerp(a.edge, b.edge), side: lerp(a.side, b.side), drop: lerp(a.drop, b.drop), weight: lerp(a.weight, b.weight), sagitta: lerp(a.sagitta, b.sagitta), turn: lerp(a.turn, b.turn), under: lerp(a.under, b.under), reach: lerp(a.reach, b.reach) };
    };
    const face = (x: number, z: number): number => {
      const s: ISection = between(x);
      // The section turned by `turn` about the course point, `below` under the crown line: its point `v` aside and `u` over the course
      // stands `v cos + u sin` aside and `u cos - v sin` over it in the nail's frame. The `v` under a lateral place by a fixed point.
      const over = (v: number): number => below - sink(s.side, s.drop, s.weight, Math.min(Math.abs(v), s.side));
      let v: number = z;
      for (let i: number = 0; i < 6; ++i) v = (z - over(v) * Math.sin(s.turn)) / Math.cos(s.turn);
      return crown + lifted(x) - below + over(v) * Math.cos(s.turn) - v * Math.sin(s.turn);
    };
    // The free edge across the plate: an edge of the plate, drawn by the outline's rule. A trimmed nail's free edge follows the tip,
    // so its line is the tip's own plan contour moved back along the nail's axis by as far as its apex stands before the tip: an
    // offset aside, it stands that distance behind the farthest place at which the digit's skin still reaches that offset. The
    // contour is read on the skin's extents from the tip back, a tenth of a millimetre apart on the stations the apex was searched
    // over, each side by its own extent, and placed between two stations by the straight line through their readings; the line is
    // tabled at offsets one net cell apart. Derived instead as the place where the plate stands a thickness over the skin at each
    // offset, it depended on the plate's arc and the tip's at once and came out a gable (run 15-27-45).
    const frontCount: number = 2 * Math.ceil(half / (NET * ramp)) + 1;
    const sides: [number, number, number][] = [];
    for (let x: number = tip - 1e-3; x > fold; x -= 0.1) {
      const [least, greatest]: [number, number] = read.extent(x);
      sides.push([x, least, greatest]);
      if (least <= -half && greatest >= half) break;
    }
    const past = (row: [number, number, number], z: number): number => (z >= 0 ? row[2] - z : z - row[1]);
    const front: [number, number][] = Array.from({ length: frontCount }, (_: unknown, k: number): [number, number] => {
      const z: number = -half + (2 * half * k) / (frontCount - 1);
      const found: number = sides.findIndex((row: [number, number, number]): boolean => past(row, z) >= 0);
      if (found < 0) return [z, sides[sides.length - 1]![0] - (tip - free)];
      if (found === 0) return [z, sides[0]![0] - (tip - free)];
      const [here, before]: [number, number] = [past(sides[found]!, z), past(sides[found - 1]!, z)];
      return [z, sides[found]![0] + (0.1 * here) / (here - before) - (tip - free)];
    });
    const frontLeast: number = Math.min(...front.map((row: [number, number]): number => row[1]));
    const frontMost: number = Math.max(...front.map((row: [number, number]): number => row[1]));
    // The lateral fold's wall takes the room the digit has beside the plate: from the plate's edge out to the skin's side, and one
    // thickness at least. Jung's width is measured between the lowest points of the lateral grooves, so the plate keeps its width
    // and the wall rises outside it; it ends where the skin turns under, so the relief never moves skin past the digit's side.
    const room = (s: ISection): number => Math.max(proportions.thickness, s.reach - s.edge);
    // The outline's proximal end is one curve tangent to both edges, since the folds are one groove round the plate: the half ellipse
    // with the plate's half width across and `deep` along, centred at `bend`. An ellipse's end turns on its other half axis squared
    // over this one, so with `deep = half / (2 lunula)` the fold's apex turns on the stated radius `lunula W`. The wall's outer border
    // is the ellipse about the same centre that is the lateral wall wider across and two ramps longer along, the room the digit has
    // along its length behind the fold.
    const deep: number = half / (2 * proportions.lunula);
    const bend: number = fold + deep;
    const wide: number = between(bend).edge;
    const beside: number = room(between(bend));
    const lowering = (x: number, y: number, z: number, sharp: boolean): number => {
      const s: ISection = between(x);
      // At the folds the wall lies outside the outline; `limit` is the outline's half width at this distance along. Behind `bend` the
      // share falls from the outline to the wall's outer border along the ray from the ellipses' centre: a point `r` along that ray,
      // where the outline stands `r / inner` and the border `r / outer`.
      let [share, limit]: [number, number] = [step(1 + (s.edge - Math.abs(z)) / room(s)), s.edge];
      if (x < bend) {
        const [along, aside]: [number, number] = [bend - x, Math.abs(z)];
        const inner: number = Math.hypot(along / deep, aside / wide);
        const outer: number = Math.hypot(along / (deep + 2 * ramp), aside / (wide + beside));
        share = inner <= 1 ? 1 : outer >= 1 ? 0 : step((1 / outer - 1) / (1 / outer - 1 / inner));
        limit = along >= deep ? 0 : wide * Math.sqrt(1 - (along / deep) ** 2);
      }
      // At the free edge the ramp lies inside the outline, the plate coming down to the tip's skin over the last two ramps before its
      // apex. It is drawn twice: by the bed's own net as that slope, which the net resolves, and by the edge's strip, fine along the
      // digit, as the difference between a step one thickness long and that slope.
      const left: number = tabled(front, z) - x;
      const slope: number = step(left / (2 * ramp));
      // Outside the outline the wall goes down to the plate's edge, not on down the plate's side: the face is read at the outline there.
      // Read on down the side it asked the net for 2 to 3.7 mm at its border (run 14-39-31, `clipped`).
      const over: number = y - (face(x, Math.max(-limit, Math.min(limit, z))) - UNDER * proportions.fold);
      // The relief is the nail's own surface: inside the outline the skin goes to the plate's face, down where the face lies under it
      // and up where the face stands over it, toward the free edge.
      return share * (sharp ? step(left / proportions.thickness) - slope : slope) * over;
    };
    const cell: number = NET * ramp;
    const reachOut: number = 2 * ramp + 3 * cell;
    // The window's phases, read on the skin's ring midway along the plate: from the dorsal line each way round to the lateral wall's
    // end, or to the skin's side where it turns under before that, and three cells on, which the net's zero rings take.
    const midway: number = (fold + edge) / 2;
    const walled: number = between(midway).edge + room(between(midway));
    const around: AutoMovieVector3Tuple[] = read.ring(midway);
    const around0: number = read.find(midway, mid(read, midway)).phase;
    const start: number = Math.round((around0 / (2 * Math.PI)) * RING) % RING;
    const walk = (direction: 1 | -1): { steps: number; length: number } => {
      let [length, extra, steps]: [number, number, number] = [0, 0, 0];
      let reached: boolean = false;
      while (extra < 3 * cell && steps < RING / 2) {
        const p: AutoMovieVector3Tuple = around[(((start + direction * steps) % RING) + RING) % RING]!;
        const q: AutoMovieVector3Tuple = around[(((start + direction * (steps + 1)) % RING) + RING) % RING]!;
        const piece: number = Math.hypot(q[1] - p[1], q[2] - p[2]);
        if (Math.abs(q[2]) >= walled || (Math.abs(p[2]) > half / 2 && Math.abs(q[2]) < Math.abs(p[2]))) reached = true;
        length += piece;
        if (reached) extra += piece;
        steps += 1;
      }
      return { steps, length };
    };
    const [down, up]: [{ steps: number; length: number }, { steps: number; length: number }] = [walk(-1), walk(1)];
    const opening: number = (2 * Math.PI * (start - down.steps)) / RING;
    const span: number = (2 * Math.PI * (down.steps + up.steps)) / RING;
    const girth: number = down.length + up.length;
    const columns: number = Math.max(7, Math.ceil(girth / cell) + 3);
    const phases: [number, number] = [opening < 0 ? opening + 2 * Math.PI : opening, 0];
    // A window along the digit that holds two distances along the nail at every one of its columns. A row of the digit's chart is not
    // a line across the nail, whose frame is pitched and rolled against the digit's course, so the stations are read at every
    // column's phase and the window runs from the least to the greatest; cut at one phase, the strip's last rows and outer columns
    // still lay before the free edge at the sides (run 15-09-05, `clippedIn`).
    const windowed = (from: number, to: number): [number, number] => {
      let [least, greatest]: [number, number] = [Infinity, -Infinity];
      for (let j: number = 0; j < columns; ++j) {
        const phase: number = phases[0] + (span * (j - 1)) / (columns - 3);
        least = Math.min(least, read.station(from, phase));
        greatest = Math.max(greatest, read.station(Math.min(tip, to), phase));
      }
      return [least, Math.min(skin.tip - 1e-6, greatest)];
    };
    const net: { stations: [number, number]; phases: [number, number] } = { stations: windowed(fold - reachOut, frontMost + reachOut), phases };
    const rows: number = Math.max(7, Math.ceil((net.stations[1] - net.stations[0]) / cell) + 3);
    let clipped: number = 0;
    let clippedAt: [number, number] = [0, 0];
    let clippedIn: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    // A net's heights over the window's phases between two stations. Each control stands at its Greville abscissa: control `i` of `n`
    // at parameter `i - 1` of `[0, n - 3]`. The back of a row ends at its own two sides, the controls that stand farthest to either
    // side in it; a control past them lies on the underside, where the lateral offset reads as the back's again, and holds zero.
    const fill = (count: number, from: number, to: number, sharp: boolean): number[] => {
      const out: number[] = [];
      for (let i: number = 0; i < count; ++i) {
        const s: number = Math.max(skin.first, Math.min(skin.tip, from + ((to - from) * (i - 1)) / (count - 3)));
        const points: AutoMovieVector3Tuple[] = Array.from({ length: columns }, (_: unknown, j: number): AutoMovieVector3Tuple => read.at(s, net.phases[0] + (span * (j - 1)) / (columns - 3)));
        let [least, greatest]: [number, number] = [0, 0];
        for (let j: number = 1; j < columns; ++j) {
          if (points[j]![2] < points[least]![2]) least = j;
          if (points[j]![2] > points[greatest]![2]) greatest = j;
        }
        for (let j: number = 0; j < columns; ++j) {
          const p: AutoMovieVector3Tuple = points[j]!;
          const d: number = j < Math.min(least, greatest) || j > Math.max(least, greatest) ? 0 : lowering(p[0], p[1], p[2], sharp);
          const outer: boolean = i < 3 || j < 3 || i >= count - 3 || j >= columns - 3;
          if (outer && Math.abs(d) > clipped) {
            clipped = Math.abs(d);
            clippedAt = [p[0], p[2]];
            clippedIn = [sharp ? 1 : 0, i, j, count, columns];
          }
          out.push(outer ? 0 : -d);
        }
      }
      return out;
    };
    const heights: number[] = fill(rows, net.stations[0], net.stations[1], false);
    // The free edge's strip: the bed's window round the digit, and along it from two ramps and three of its own cells before the
    // apex to three cells past it; its cells along are a quarter of the step's length, one thickness (the lofting skill's rule).
    const fine: number = proportions.thickness / 4;
    const band: [number, number] = windowed(frontLeast - 2 * ramp - 3 * fine, frontMost + 3 * fine);
    const lines: number = Math.max(7, Math.ceil((band[1] - band[0]) / fine) + 3);
    const steps: number[] = fill(lines, band[0], band[1], true);
    const visible: ISection[] = sections.filter((_: unknown, i: number): boolean => stations[i]! >= fold);
    // A conic of middle weight `w` from a level start to an upright end turns on the radius `2 w^2 side^2 / drop` at its start.
    const radii: number[] = visible.map((s: ISection): number => (2 * s.weight * s.weight * s.side * s.side) / s.drop);
    const sagittas: number[] = visible.map((s: ISection): number => s.sagitta);
    return {
      plate,
      bed: { name: bed, stations: net.stations, phases: [net.phases[0], net.phases[0] + span], axis: frame.dorsal, rows, columns, heights },
      strip: { name: bed + ".edge", stations: band, phases: [net.phases[0], net.phases[0] + span], axis: frame.dorsal, rows: lines, columns, heights: steps },
      frame,
      plan: {
        span: [fold, free],
        bend: [bend, deep, wide],
        front,
        edges: stations.map((x: number, i: number): [number, number] => [x, sections[i]!.edge]),
        // The plate's back stands its deepest section's drop and one thickness under the crown line (the plate family's back extreme).
        floor: crown - Math.max(...sections.map((s: ISection): number => s.drop)) - proportions.thickness,
      },
      profile: stations.map((x: number, i: number): { along: number; middle: number; height: number; edge: number; turn: number } => ({ along: x, middle: mid(read, x), height: height(x), edge: loose[i]!.edge, turn: loose[i]!.turn })),
      outline: {
        centre: [read.station(midway, around0), around0],
        semi: [(read.station(edge, around0) - read.station(fold, around0)) / 2, Math.abs(Math.asin(Math.sin(read.find(midway, mid(read, midway) + between(midway).edge).phase - around0)))],
      },
      readings: {
        breadth,
        tip: tip0,
        width,
        narrowed,
        roll,
        pitch,
        span: [fold, free],
        under: [Math.min(...visible.map((s: ISection): number => s.under)), Math.max(...visible.map((s: ISection): number => s.under))],
        radius: [Math.min(...radii), Math.max(...radii)],
        sagitta: [Math.min(...sagittas), Math.max(...sagittas)],
        clipped,
        clippedAt,
        clippedIn,
        passes,
        residuals,
        misfit,
        objective,
        conditioning,
        levelling,
      },
    };
  }

  /** One section of the plate, in its own chart about its crown. */
  interface ISection {
    /** The edge's distance from the median line, mm. */
    edge: number;

    /** The side extreme's distance from the median line, mm. */
    side: number;

    /** How far the side extreme stands under the crown, mm. */
    drop: number;

    /** The middle weight of the upper face's conic from the crown to the side extreme. */
    weight: number;

    /** How far the edge stands under the crown, mm. */
    sagitta: number;

    /** The section's turn about the plate's course from the nail's dorsal direction toward its lateral, radians. */
    turn: number;

    /** How far the plate's edge lies under the mean of the skin's two edges there, mm; negative where it stands over them. */
    under: number;

    /** Half the skin's breadth there, mm. */
    reach: number;
  }

  /** A skin read in a frame: `[along the distal axis, dorsal height, lateral]` from the frame's origin. */
  interface IReader {
    /** The frame's lateral direction, `distal x dorsal`. */
    lateral: AutoMovieVector3Tuple;

    /** The chart point's frame coordinates. */
    at: (station: number, phase: number) => AutoMovieVector3Tuple;

    /** The station whose point at a phase stands a distance along the distal axis. */
    station: (x: number, phase: number) => number;

    /** The phase and station of the dorsal skin at a distance along and a lateral offset. */
    find: (x: number, z: number) => { station: number; phase: number; height: number };

    /** The skin's ring a distance along, at `RING` equal steps of phase from 0. */
    ring: (x: number) => AutoMovieVector3Tuple[];

    /** The skin's lateral extent at a distance along: `[least, greatest]`. */
    extent: (x: number) => [number, number];
  }
}

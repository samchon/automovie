import { AutoMovieConicFieldJet, AutoMovieLoftAdmissionError, AutoMovieLoftSectionNative, AutoMovieLoftViewRead, AutoMovieLoftViewSource, AutoMovieNaturalSpline, AutoMovieSolidVector } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBoundSection,
  IAutoMovieViewPart,
  IAutoMovieConicFieldJet,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionJet,
} from "@automovie/interface";

type V = AutoMovieVector3Tuple;
type P = AutoMovieVector2Tuple;
type J = IAutoMovieConicFieldJet.IJet;
type Clock = { point: P; first: P; second: P };
type Boundary = { address: Clock; position: Clock };
const { add, subtract, multiply, divide, constant } = AutoMovieConicFieldJet.AD;

/** One planar chart for an actual bounded source with an inherited closed boundary. */
export namespace AutoMovieHumanBoundSection {
  /** The source's monotone clock span. */
  export type IArc = IAutoMovieHumanBoundSection.IArc;

  /**
   * Bind the original section generator on a bounded proximal span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each chart translates the actual master along a constant transverse axis. An original monotone coordinate gives its inverse and its two analytic chain-rule derivatives. One normalized C2 composition attains the inherited boundary and leaves the distal native field unchanged.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The measured transverse law vanishes on the original curve by construction. No single station-as-phase graph, resampled mesh law, finite-difference jet or nearest projection selects a branch.
   */
  export function create(input: {
    name: string;
    domain: readonly [number, number];
    /** The fixed station where the entire master still lies in the full-strength field. */
    protectedFrom: number;
    /** Two physical chart coordinates and local section coordinates at one actual master clock. */
    boundary: (clock: number) => Boundary;
    /** Independent original bounded stock, including its protected endpoint. */
    stock: Pick<IAutoMovieLoftSectionConnect.IOriginal, "point" | "phase" | "jet">;
    /** Regular original overlapping chart arcs and their own monotone-coordinate premises. */
    arcs: readonly IArc[];
    /** Two actual fitted local vector components, before multiplication by transverse distance. */
    guide: (arc: number, station: number, phase: number) => IAutoMovieLoftSectionJet;
  }): IAutoMovieLoftSectionConnect.IOriginal {
    const [start, mark] = input.domain, full = input.protectedFrom;
    if (!(Number.isFinite(start) && start < full && full < mark && Number.isFinite(mark) && input.arcs.length > 0))
      throw new AutoMovieLoftAdmissionError("the bound section lacks its original proximal and protected domains");
    const turn = 2 * Math.PI;
    const unwrap = (angle: number, near: number): number => near + Math.atan2(Math.sin(angle - near), Math.cos(angle - near));
    const arcs = input.arcs.map((arc) => {
      const [a, b] = arc.clock, along = arc.along, across = along === 0 ? 1 : 0;
      if (!(Number.isFinite(a) && b > a && b - a < turn && arc.width > 0 && Number.isFinite(arc.width)))
        throw new AutoMovieLoftAdmissionError("a bound-section arc lacks a bounded original clock or its transverse extent");
      const middle = a + (b - a) / 2, phase = input.boundary(middle).address.point[1];
      const read = (t: number) => {
        const original = input.boundary(t);
        const q: P = [original.address.point[0], unwrap(original.address.point[1], phase)];
        if (!(q[0] >= start && q[0] <= full) || ![...q, ...original.address.first, ...original.address.second].every(Number.isFinite))
          throw new AutoMovieLoftAdmissionError("the actual master leaves its original proximal chart");
        return { ...original, address: { ...original.address, point: q } };
      };
      const clocks = [a, middle, b].map((t) => ({ clock: t, ...read(t).address }));
      const first = clocks[0]!.point[along], last = clocks[2]!.point[along];
      const rank = Math.sign(last - first);
      if (rank === 0 || clocks.some((site) => !(rank * site.first[along] > 0)))
        throw new AutoMovieLoftAdmissionError("an original chart arc has no directed transverse inverse: " +
          JSON.stringify({ along, rank, clocks }));
      return {
        ...arc, across, read, middle, phase, first, last, rank,
        inverse(s: number, p: number): { clock: number; value: Boundary; transverse: number } | null {
          const q: P = [s, unwrap(p, phase)], target = q[along];
          if (!(target >= Math.min(first, last) && target <= Math.max(first, last))) return null;
          let lo = a, hi = b;
          let t = lo + (hi - lo) / 2, value = read(t);
          while (true) {
            const readOut = value.address.point[along];
            if (!(rank * value.address.first[along] > 0))
              throw new AutoMovieLoftAdmissionError("an original chart arc reverses inside its transverse inverse");
            if (readOut === target || !(t > lo && t < hi)) break;
            if (rank * (readOut - target) > 0) hi = t;
            else lo = t;
            t = lo + (hi - lo) / 2;
            value = read(t);
          }
          const transverse = q[across] - value.address.point[across];
          return Math.abs(transverse) < arc.width ? { clock: t, value, transverse } : null;
        },
      };
    });
    // Fixed zero/one neighborhoods of the original atlas guarantee identity on the master.
    for (const arc of arcs) {
      for (const clock of [arc.clock[0], arc.middle, arc.clock[1]]) {
        const value = arc.read(clock).address.point;
        if (!arcs.some((other) => {
          const next = other.clock[0] + (other.clock[1] - other.clock[0]) / 2;
          const alias = next + Math.atan2(Math.sin(clock - next), Math.cos(clock - next));
          return Math.abs(alias - next) <= (other.clock[1] - other.clock[0]) / 4 &&
            other.inverse(value[0], value[1]) !== null;
        })) throw new AutoMovieLoftAdmissionError("the original arcs leave a gap in the boundary clock cover");
      }
    }
    const at = (s: number, phi: number, order: 0 | 1 | 2): IAutoMovieLoftSectionJet => {
      if (!(s >= start && s <= mark) || !Number.isFinite(phi))
        throw new AutoMovieLoftAdmissionError("the original section query is outside its bounded chart");
      const position = input.stock.point(s, phi);
      const base = order === 2 ? components(input.stock.jet(s, phi)) : order === 1
        ? phase(input.stock.phase(s, phi)) : position.map(constant) as [J, J];
      if (s === mark) return local(base);
      let total = constant(0);
      const sum: [J, J] = [constant(0), constant(0)];
      for (const [i, arc] of arcs.entries()) {
        const root = arc.inverse(s, phi);
        if (root === null) continue;
        const { address, position } = root.value;
        const rate = address.first[arc.along], rate2 = address.second[arc.along];
        const first = 1 / rate, second = -rate2 / (rate * rate * rate);
        const t: J = arc.along === 0 ? [root.clock, first, 0, second, 0, 0] : [root.clock, 0, first, 0, 0, second];
        const d = address.first[arc.across], dd = address.second[arc.across];
        const across: J = arc.across === 0 ? [root.transverse, 1, 0, 0, 0, 0] : [root.transverse, 0, 1, 0, 0, 0];
        const u = subtract(across, pull(t, 0, d, dd));
        const w = multiply(bump(divide(subtract(t, constant(arc.middle)), constant((arc.clock[1] - arc.clock[0]) / 2))),
          bump(divide(u, constant(arc.width))));
        if (w[0] === 0) continue;
        total = add(total, w);
        const stock = order === 0 ? input.stock.point(...address.point).map(constant) as [J, J]
          : components(input.stock.jet(...address.point));
        const guide = components(input.guide(i, s, phi));
        for (const k of [0, 1] as const) {
          const a = stock[k], x = address.first, xx = address.second;
          const a1 = a[1] * x[0] + a[2] * x[1];
          const a2 = a[3] * x[0] ** 2 + 2 * a[4] * x[0] * x[1] + a[5] * x[1] ** 2 + a[1] * xx[0] + a[2] * xx[1];
          const delta = pull(t, position.point[k] - a[0], position.first[k] - a1, position.second[k] - a2);
          sum[k] = add(sum[k], multiply(w, add(delta, multiply(u, guide[k]))));
        }
      }
      if (total[0] === 0) return local(base);
      const station: J = [s, 1, 0, 0, 0, 0];
      const end = flat(divide(subtract(constant(mark), station), constant(mark - full)));
      const strength = multiply(end, flat(total));
      return local([0, 1].map((k) => add(base[k]!, multiply(strength, divide(sum[k]!, total)))) as [J, J]);
    };
    return { name: input.name, domain: input.domain, point: (s, p) => at(s, p, 0).p,
      phase: (s, p) => at(s, p, 1), jet: (s, p) => at(s, p, 2) };
  }

  /**
   * The port from a side part's joint loop to its protected mark (`portSection` states the blend and its basis).
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the one port construction.
   * @evidence contracts/development/common.md#meaningful-documentation Names where the blend is stated.
   */
  export function port(input: Parameters<typeof portSection>[0]): ReturnType<typeof portSection> {
    return portSection(input);
  }

  /**
   * Carry one original world master into the child's actual bounded planar sections.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A certified plane-foot owner fixes each station; implicit differentiation uses the actual axis and world curve through second order. The native local stock and the new span use the same direct outline owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest old wall, extrapolated chart root or active feature projection repairs a missing original plane foot. Arcs and held samples are finite admission evidence.
   */
  export function conic(input: {
    view: IAutoMovieViewPart;
    station: (world: V) => readonly [number, number][];
    at: (clock: number) => { point: V; first: V; second: V };
    count: number;
    mark: number;
    reach: number;
    tolerance: number;
  }) {
    const { view, mark, reach, count, tolerance } = input;
    const source = AutoMovieLoftViewSource.create(view)?.source;
    if (source === undefined || source === null || !(reach > 0))
      throw new AutoMovieLoftAdmissionError("the child has no original native stock and transverse reach");
    const [first, last] = source.domain;
    if (!(mark > first && mark < last && count >= 8 && Number.isInteger(count)))
      throw new AutoMovieLoftAdmissionError("the child has no protected native interval beyond its root");
    const values = (s: number) => {
      const value = AutoMovieLoftViewRead.values(source, s);
      if (typeof value === "string") throw new AutoMovieLoftAdmissionError(value);
      return value;
    };
    const stock = {
      point: (s: number, phi: number): P => AutoMovieLoftSectionNative.point(values(s))(phi),
      phase: (s: number, phi: number) => AutoMovieLoftSectionNative.phase(values(s))(phi),
      jet: (s: number, phi: number): IAutoMovieLoftSectionJet => {
        const value = AutoMovieLoftViewRead.jets(source, s);
        if (typeof value === "string") throw new AutoMovieLoftAdmissionError(value);
        return AutoMovieLoftSectionNative.jet(value)(phi);
      },
    };
    const boundary = (clock: number): Boundary => addressOf(view, input.station, input.at, first, mark, tolerance, clock);
    const turn = 2 * Math.PI, step = turn / count;
    const clocks: number = 2 * count;
    const samples: Boundary[] = Array.from({ length: clocks }, (_, i): Boundary => boundary((turn * i) / clocks));
    const unwrap = (angle: number, near: number): number => near +
      Math.atan2(Math.sin(angle - near), Math.cos(angle - near));
    const phases: number[] = [samples[0]!.address.point[1]];
    for (let i: number = 1; i <= clocks; ++i)
      phases.push(unwrap(samples[i % clocks]!.address.point[1], phases[i - 1]!));
    const phaseTurn: number = turn * Math.round((phases[clocks]! - phases[0]!) / turn);
    const max: number = Math.max(...samples.map((p): number => p.address.point[0]));
    const protectedFrom = max + (mark - max) / 2;
    const arcs = Array.from({ length: count }, (_, i): IArc => {
      const address = samples[2 * i]!.address;
      const a = address.first, along = Math.abs(a[0]) / (mark - first) > Math.abs(a[1]) / turn ? 0 : 1;
      const section = stock.jet(...address.point);
      const velocity = along === 0 ? Math.hypot(...section.t) : Math.hypot(1, ...section.s);
      if (!(velocity > 0)) throw new AutoMovieLoftAdmissionError("the child has no regular transverse guide at master clock " + i);
      return { clock: [(i - 1) * step, (i + 1) * step], along, width: reach / velocity };
    });
    const zero = (): IAutoMovieLoftSectionJet => local([constant(0), constant(0)]);
    const section = create({ name: view.name, domain: [first, mark], protectedFrom, boundary, stock, arcs, guide: zero });
    return {
      view: { ...view, originalSection: section },
      childAt: (clock: number): Clock => {
        const laps: number = Math.floor(clock / turn);
        const canonical: number = clock - laps * turn;
        const k: number = Math.min(clocks - 1, Math.floor((canonical * clocks) / turn));
        const address: Clock = boundary(canonical).address;
        return { ...address, point: [address.point[0], unwrap(address.point[1], phases[k]!) + laps * phaseTurn] };
      },
    };
  }
}

/**
 * The port: a side part's sections from its joint's loop to its protected mark (joints-one-shot.md, "The port blend, ruled"; the human
 * skill's Connections rule: the child's view curves start from the loop the parent publishes). Along each phase's ray about the child's
 * section centre the radius is the convex blend `r = (1 - q(tau)) r_L(phi) + q(tau) r_M(s, phi)` of the loop's radius `r_L` and the
 * child's own section `r_M`, with `q` the quintic Hermite step `6 t^5 - 15 t^4 + 10 t^3` (`flat`: `q(0) = 0`, `q(1) = 1`, first and
 * second derivatives zero at both ends) and `tau = (s - s_L(phi)) / (mark - s_L(phi))` running from the loop's own station at that phase
 * to the mark, held to [0, 1]. A convex combination of two star-shaped radial functions about the same centre is star-shaped; it is
 * the loop at `tau = 0` and meets the child's surface C2 at the mark. With the host's normal (`normal`, the parent's publication) the
 * radius also carries the host's slope, `h1(tau) (mark - s_L) sigma(phi)` (`leave`), `sigma` the radius's station rate that keeps the
 * port's station tangent in the host's tangent plane at the loop: the port leaves the loop along the host's skin, the "values and slopes"
 * of the Connections rule (joints-one-shot.md, "The port's slope"), and the star-shape guard decides where that holds. Without it the
 * port left the armscye with a zero radial slope, up to 133 degrees off the trunk's skin. The loop's station and radius by phase are
 * the periodic natural cubics through the master's exact clock samples (three turns, the middle one read), so the port's jets are exact
 * up to that interpolation, which the samples' own spacing bounds.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The loop at each clock is the master's certified plane address; the blend is a convex radial combination by the quintic Hermite step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A master clock without one plane address, or a loop station not before the mark, is refused by name; nothing is clamped but the step's own parameter.
 */
function portSection(input: {
  view: IAutoMovieViewPart;
  station: (world: V) => readonly [number, number][];
  at: (clock: number) => { point: V; first: V; second: V };
  count: number;
  mark: number;
  tolerance: number;
  normal?: (clock: number) => V;
}): { view: IAutoMovieViewPart; childAt: (clock: number) => Clock } {
  const { view, mark, count, tolerance } = input;
  const source = AutoMovieLoftViewSource.create(view)?.source;
  if (source === undefined || source === null) throw new AutoMovieLoftAdmissionError("the child has no original native stock");
  const [first, last] = source.domain;
  if (!(mark > first && mark < last && count >= 8 && Number.isInteger(count)))
    throw new AutoMovieLoftAdmissionError("the child's protected mark " + mark + " is not inside its source " + first + " to " + last);
  const jets = (s: number) => {
    const value = AutoMovieLoftViewRead.jets(source, s);
    if (typeof value === "string") throw new AutoMovieLoftAdmissionError(value);
    return value;
  };
  const turn = 2 * Math.PI, clocks = 2 * count;
  // The loop's address and radius at each master clock: the certified plane address on the child's course, the radius about its centre.
  const samples = Array.from({ length: clocks }, (_, i: number) => {
    const clock = (turn * i) / clocks, curve = input.at(clock), roots = input.station(curve.point);
    if (roots.length !== 1) throw new AutoMovieLoftAdmissionError("the child has " + roots.length + " original section addresses at master clock " + clock);
    const [s, phi] = roots[0]!;
    if (!(s >= first && s < mark)) throw new AutoMovieLoftAdmissionError("the loop at clock " + clock + " stands at station " + s + ", not inside the port " + first + " to " + mark);
    const frame = view.axis.at(s);
    const q = AutoMovieSolidVector.sub(curve.point, frame.origin as V);
    const r: number = Math.hypot(AutoMovieSolidVector.dot(q, frame.u as V), AutoMovieSolidVector.dot(q, frame.v as V));
    // The host's slope: the radius's station rate that keeps the port's station tangent in the host's tangent plane at the loop. With
    // `P = o + r (cos phi u + sin phi v)` the tangent is `o' + r w' + r_s e` (`e` the ray, `w'` its station rate), and `n . P_s = 0`
    // for the host's normal `n` gives `r_s = -n . (o' + r w') / (n . e)`.
    let sigma: number = 0;
    if (input.normal !== undefined) {
      const jet = view.axis.jet?.(s);
      if (jet === undefined || jet === null) throw new AutoMovieLoftAdmissionError("the child's course has no jet at the loop's station " + s);
      const n: V = input.normal(clock), c: number = Math.cos(phi), d: number = Math.sin(phi);
      const { add, scale, dot } = AutoMovieSolidVector;
      const e: V = add(scale(jet.value.u as V, c), scale(jet.value.v as V, d));
      const turned: V = add(scale(jet.first.u as V, c), scale(jet.first.v as V, d));
      const across: number = dot(n, e);
      if (!(Math.abs(across) > 0)) throw new AutoMovieLoftAdmissionError("the host's tangent plane holds the child's ray at clock " + clock);
      sigma = -dot(n, add(jet.first.origin as V, scale(turned, r))) / across;
    }
    return { clock, s, phi, r, sigma };
  });
  const unwrap = (angle: number, near: number): number => near + Math.atan2(Math.sin(angle - near), Math.cos(angle - near));
  const phases: number[] = [samples[0]!.phi];
  for (let i = 1; i < clocks; ++i) phases.push(unwrap(samples[i]!.phi, phases[i - 1]!));
  const sense: number = Math.sign(unwrap(samples[0]!.phi, phases.at(-1)!) - phases.at(-1)!) || 1;
  const order = phases.map((p, i) => ({ p: sense > 0 ? p : -p, s: samples[i]!.s, r: samples[i]!.r, sigma: samples[i]!.sigma }))
    .sort((a, b) => a.p - b.p);
  const base: number = order[0]!.p;
  const xs: number[] = [], ss: number[] = [], rs: number[] = [], sigmas: number[] = [];
  for (let k = -1; k <= 1; ++k) for (const row of order) { xs.push(row.p + k * turn); ss.push(row.s); rs.push(row.r); sigmas.push(row.sigma); }
  const sSpline = AutoMovieNaturalSpline.create(xs, ss), rSpline = AutoMovieNaturalSpline.create(xs, rs);
  const sigmaSpline = AutoMovieNaturalSpline.create(xs, sigmas);
  const loopAt = (phi: number): { s: J; r: J; sigma: J } => {
    const signed = sense > 0 ? phi : -phi;
    const x = base + (((signed - base) % turn) + turn) % turn;
    const [s0, s1, s2] = AutoMovieNaturalSpline.read(sSpline, x), [r0, r1, r2] = AutoMovieNaturalSpline.read(rSpline, x);
    const [g0, g1, g2] = AutoMovieNaturalSpline.read(sigmaSpline, x);
    return { s: [s0, 0, sense * s1, 0, 0, s2], r: [r0, 0, sense * r1, 0, 0, r2], sigma: [g0, 0, sense * g1, 0, 0, g2] };
  };
  const at = (s: number, phi: number): IAutoMovieLoftSectionJet => {
    const own = AutoMovieLoftSectionNative.jet(jets(Math.max(s, first)))(phi);
    if (s >= mark) return own;
    const [mx, my] = components(own);
    const loop = loopAt(phi);
    const length = subtract(constant(mark), loop.s);
    const t = divide(subtract([s, 1, 0, 0, 0, 0], loop.s), length);
    const tau = flat(t);
    const keep = subtract(constant(1), tau);
    // The host's slope carried by the first-derivative Hermite basis over the port's own length: `h1(t) (mark - s_L) sigma` along the
    // ray has station rate `sigma` at the loop and vanishes with its first two derivatives at the mark.
    const slope = multiply(leave(t), multiply(length, loop.sigma));
    const c = Math.cos(phi), d = Math.sin(phi);
    const radial = add(multiply(keep, loop.r), slope);
    const lx = multiply(radial, [c, 0, -d, 0, 0, -c]), ly = multiply(radial, [d, 0, c, 0, 0, -d]);
    return local([add(multiply(tau, mx), lx), add(multiply(tau, my), ly)]);
  };
  const section: IAutoMovieLoftSectionConnect.IOriginal = {
    name: view.name, domain: [first, mark],
    point: (s, p) => at(s, p).p,
    phase: (s, p) => { const j = at(s, p); return { p: j.p, t: j.t, tt: j.tt }; },
    jet: (s, p) => at(s, p),
  };
  return {
    view: { ...view, originalSection: section },
    childAt: (clock: number): Clock => {
      const laps: number = Math.floor(clock / turn), canonical: number = clock - laps * turn;
      const k: number = Math.min(clocks - 1, Math.floor((canonical * clocks) / turn));
      const address: Clock = addressOf(view, input.station, input.at, first, mark, tolerance, canonical).address;
      return { ...address, point: [address.point[0], unwrap(address.point[1], phases[k]!) + laps * sense * turn] };
    },
  };
}

/** The master at one clock on the child's certified section plane: its address and local position with their clock derivatives (implicit differentiation of the plane incidence through second order). */
function addressOf(
  view: IAutoMovieViewPart, station: (world: V) => readonly [number, number][], at: (clock: number) => { point: V; first: V; second: V },
  first: number, mark: number, tolerance: number, clock: number,
): Boundary {
  const curve = at(clock), roots = station(curve.point);
  if (roots.length !== 1) throw new AutoMovieLoftAdmissionError("the child has " + roots.length + " original section addresses at master clock " + clock);
  const [s, phi] = roots[0]!, frame = view.axis.jet?.(s);
  if (!(s >= first && s < mark) || frame === undefined || frame === null)
    throw new AutoMovieLoftAdmissionError("the master leaves the child's bounded regular source before its protected station");
  if ((view.reliefs ?? []).some((relief) => s > relief.stations[0] && s < relief.stations[1]))
    throw new AutoMovieLoftAdmissionError("the master crosses an active feature without an original composed section inverse");
  const { value, first: fs, second: fss } = frame;
    const { add, sub, cross, dot, scale } = AutoMovieSolidVector;
    const n = cross(value.u, value.v), ns = add(cross(fs.u, value.v), cross(value.u, fs.v));
    const nss = add(add(cross(fss.u, value.v), scale(cross(fs.u, fs.v), 2)), cross(value.u, fss.v));
    const delta = sub(curve.point, value.origin), gs = dot(ns, delta) - dot(n, fs.origin);
    if (gs === 0 || !(Math.abs(dot(n, delta)) <= tolerance))
      throw new AutoMovieLoftAdmissionError("the actual master has no regular child plane incidence at " + clock);
    const ds = -dot(n, curve.first) / gs;
    const dd = -(dot(n, curve.second) + 2 * ds * dot(ns, curve.first) +
      ds * ds * (dot(nss, delta) - 2 * dot(ns, fs.origin) - dot(n, fss.origin))) / gs;
    const change = sub(curve.first, scale(fs.origin, ds));
    const bend = sub(curve.second, add(scale(fss.origin, ds * ds), scale(fs.origin, dd)));
    const local = (u: V, du: V, ddu: V): [number, number, number] =>
      [dot(delta, u), dot(change, u) + ds * dot(delta, du),
        dot(bend, u) + 2 * ds * dot(change, du) + dot(delta, add(scale(ddu, ds ** 2), scale(du, dd)))];
    const [x, dx, ddx] = local(value.u, fs.u, fss.u);
    const [y, dy, ddy] = local(value.v, fs.v, fss.v);
    const sq = x * x + y * y, angular = x * dy - y * dx;
    if (!(Number.isFinite(sq) && sq > 0))
      throw new AutoMovieLoftAdmissionError("the master goes through the child section origin");
    const dphi = angular / sq;
    const ddphi = (x * ddy - y * ddx - 2 * (x * dx + y * dy) * dphi) / sq;
    return { address: { point: [s, phi], first: [ds, dphi], second: [dd, ddphi] },
      position: { point: [x, y], first: [dx, dy], second: [ddx, ddy] } };
}

function pull(q: J, value: number, first: number, second: number): J {
  return [value, first * q[1], first * q[2], first * q[3] + second * q[1] ** 2,
    first * q[4] + second * q[1] * q[2], first * q[5] + second * q[2] ** 2];
}

function flat(q: J): J {
  const x = q[0];
  if (x <= 0 || x >= 1) return constant(x <= 0 ? 0 : 1);
  return pull(q, x ** 3 * (10 - 15 * x + 6 * x * x), 30 * x * x * (1 - x) ** 2, 60 * x * (1 - x) * (1 - 2 * x));
}

/**
 * The quintic Hermite basis function of the first derivative at 0, `h1(t) = t - 6 t^3 + 8 t^4 - 3 t^5` (Farin, Curves and Surfaces for
 * CAGD, 5th ed., 2002, section 7.5, quintic Hermite interpolation): `h1(0) = 0`, `h1'(0) = 1`, `h1''(0) = 0`, and `h1`, `h1'` and `h1''`
 * zero at 1; zero outside [0, 1].
 */
function leave(q: J): J {
  const x = q[0];
  if (x <= 0 || x >= 1) return constant(0);
  return pull(q, x - 6 * x ** 3 + 8 * x ** 4 - 3 * x ** 5, 1 - 18 * x * x + 32 * x ** 3 - 15 * x ** 4, -36 * x + 96 * x * x - 60 * x ** 3);
}

function bump(q: J): J {
  return flat(multiply(constant(2), subtract(constant(1), multiply(constant(q[0] < 0 ? -1 : 1), q))));
}

function components(p: IAutoMovieLoftSectionJet): [J, J] {
  return [0, 1].map((k): J => [p.p[k]!, p.s[k]!, p.t[k]!, p.ss[k]!, p.st[k]!, p.tt[k]!]) as [J, J];
}

function phase(p: Pick<IAutoMovieLoftSectionJet, "p" | "t" | "tt">): [J, J] {
  return [0, 1].map((k): J => [p.p[k]!, 0, p.t[k]!, 0, 0, p.tt[k]!]) as [J, J];
}

function local(q: [J, J]): IAutoMovieLoftSectionJet {
  if (q.some((row) => !row.every(Number.isFinite)))
    throw new AutoMovieLoftAdmissionError("the original local material jet is not finite");
  const [a, b] = q;
  return { p: [a[0], b[0]], s: [a[1], b[1]], t: [a[2], b[2]], ss: [a[3], b[3]], st: [a[4], b[4]], tt: [a[5], b[5]] };
}

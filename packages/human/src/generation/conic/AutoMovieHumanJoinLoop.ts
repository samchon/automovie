import { AutoMovieHumanMaterialCourse } from "./AutoMovieHumanMaterialCourse";
import { AutoMovieHumanSkinCutLoop } from "./AutoMovieHumanSkinCutLoop";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieLoftAdmissionError,
  AutoMovieConstructionPortCurve,
  AutoMovieConstructionSeeds,
  AutoMovieSolidSharedCurve,
  AutoMovieSolidIntersection,
  AutoMovieSolidVector,
  AutoMovieViewAxis,
  solveAutoMovieHalfPlaneProgram,
  orientAutoMovieSolidChart,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "./AutoMovieHumanConicLoft";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanJoinLoop,
  IAutoMovieHumanLandmarkSurface,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The loop of a part that stands on a host's side, generated for the person: both skins cut by the surface that divides them.
 *
 * Where a part leaves a host's side (the arm at the armscye, the breast on the chest, the auricle's plate at its root), the two
 * families are fitted either side of one dividing surface: on its own side each wall is skin, past it each is a closure nobody sees.
 * The curve the two parts meet on is therefore the surface's trace on the skin, read twice: on the part's chart as the station at
 * which each of its station lines passes the surface, and on the host's chart as the shares of a port loop
 * (`AutoMovieHumanSkinCutLoop.shares`). The crossing of the two fitted walls is not that curve: past the surface each wall is free,
 * and measured on f1's shoulder the walls' crossing jumped between arm stations 74 and 119 over the cap.
 *
 * The loop is handed to the engine as `IAutoMovieConstructionPort.ILoop` on the host's chart, the declared contact of a shared-loop
 * join (`IAutoMovieConstructionJoin.loop`), with the two chart points a point seed names and the largest distance between the two
 * skins on it, which is what the join's tolerance has to admit.
 */
export namespace AutoMovieHumanJoinLoop {
  type V = [number, number, number];

  /** The canonical contact and its two source chart addresses. */
  export type IContact = IAutoMovieHumanJoinLoop.IContact;

  /** Re-read a pair of regular physical source charts at their supplied station/mm and phase/radian addresses. */
  export function columnGap(
    host: IAutoMovieLoftViewFullSource.IReader,
    child: IAutoMovieLoftViewFullSource.IReader,
    onHost: [number, number],
    onChild: [number, number],
  ): number {
    const point = (reader: IAutoMovieLoftViewFullSource.IReader, chart: [number, number]): V => {
      if (!(chart[0] > reader.domain[0] && chart[0] < reader.domain[1] && Number.isFinite(chart[1])))
        throw new Error("the physical contact has no interior station at " + chart[0]);
      const jet: IAutoMovieSolidSurface.IJet = reader.jet(...chart);
      if (![jet.p, jet.u, jet.v, jet.uu, jet.uv, jet.vv].every((v: V): boolean => v.every(Number.isFinite)) ||
          !(Math.hypot(...AutoMovieSolidVector.cross(jet.u, jet.v)) > 0))
        throw new Error("the physical contact has no regular source2");
      return jet.p;
    };
    return Math.hypot(...AutoMovieSolidVector.sub(point(host, onHost), point(child, onChild)));
  }

  /** Part phases the cut is read at: one a degree. */
  const PHASES: number = 360;

  /**
   * How near a section plane a point is taken to lie in it, mm: a picometre. The station's own error is this over `1 - d / R` for a
   * point `d` from the course on a turn of radius `R`, so under a nanometre wherever the search converges at all: stopped at a
   * nanometre from the plane, stations inside a turn of 48.3 mm came back 1.9e-9 to 2.6e-9 mm short at 20 mm from the course.
   */
  const ADDRESS_MM: number = 1e-12;

  /**
   * The distance from the plane under which a search that has stopped shrinking is taken as landed, mm: a course's frames are
   * computed in doubles, and far along a long course their rounding can hold the distance above a picometre.
   */
  const ADDRESS_FLOOR_MM: number = 1e-9;

  /** Steps a point's station is sought in: the secant lands in under ten from 40 mm away on a made turn; a search that needs more is refused. */
  const ADDRESS_STEPS: number = 64;

  /**
   * How far past the loop's half extents on the host's chart a ray is walked for its crossing, as a share: a loop inside its own box
   * lies within `sqrt(2)` of its centre, and the host's skin is read where the part's stands off it by the gap, so twice the box is
   * walked and a ray that has not crossed by then is refused.
   */
  const REACH: number = 2;

  /**
   * A world point's address on a part's chart: the station at which the point lies in the course's section plane, mm, and its polar
   * angle in that station's frame, rad.
   *
   * The section plane's normal is `v x u` (`AutoMovieLoftFrame`), and a point `d` ahead of a section along it lies about `d` of
   * station ahead, so the first step is that distance and lands on a straight course; round a turn the distance to the plane is
   * brought to zero by the secant through the last two stations, which does not depend on how tight the turn is (stepped by the
   * distance alone, a made turn whose tightest radius is 1.6 times the point's distance had not landed in 64 steps).
   *
   * @param part The part whose chart is read.
   * @param domain The part's stations, mm.
   * @param p The point, mm.
   * @param guess The station the search starts at.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The secant method on the signed distance to the section plane, started by one step of that distance; the phase is read in the found station's own frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop, one frame a step, one reader of the distance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No straight-course premise and no nearest-sample search; a point the steps do not reach, or one past the part's stations, is refused with the station it stopped at.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame a step; one or two steps on a straight course, at most `ADDRESS_STEPS`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller walking a curve passes the last station as the next guess.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers.
   * @evidence contracts/development/common.md#meaningful-documentation States units, the premise of convergence and the refusal.
   */
  export function address(
    part: Pick<IAutoMovieViewPart, "axis" | "name">,
    domain: readonly [number, number],
    p: readonly number[],
    guess: number,
  ): [number, number] {
    // The signed distance of the point ahead of the section plane at a station, and the point in that station's frame.
    const read = (station: number): { ahead: number; frame: IAutoMovieLoftSectionFrame; q: V } => {
      const frame: IAutoMovieLoftSectionFrame = part.axis.at(station);
      const q: V = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
      const normal: V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      return { ahead: q[0] * normal[0] + q[1] * normal[1] + q[2] * normal[2], frame, q };
    };
    const clamp = (station: number): number => Math.min(domain[1], Math.max(domain[0], station));
    let [last, lastAhead]: [number, number] = [NaN, NaN];
    let station: number = clamp(guess);
    for (let i: number = 0; i < ADDRESS_STEPS; ++i) {
      const { ahead, frame, q } = read(station);
      // Landed: under the threshold, or the secant no longer moves the station (the frames' own rounding).
      if (Math.abs(ahead) <= ADDRESS_MM || station === last) {
        if (Math.abs(ahead) > ADDRESS_FLOOR_MM) break;
        return [station, Math.atan2(q[0] * frame.v[0] + q[1] * frame.v[1] + q[2] * frame.v[2], q[0] * frame.u[0] + q[1] * frame.u[1] + q[2] * frame.u[2])];
      }
      // The first step is the distance itself; every later one is the secant through the last two stations.
      const slope: number = (ahead - lastAhead) / (station - last);
      const next: number = clamp(Number.isFinite(slope) && slope !== 0 ? station - ahead / slope : station + ahead);
      [last, lastAhead] = [station, ahead];
      station = next;
    }
    throw new Error("join loop: a point has no address on the chart of " + part.name + " (station " + station + " mm after " + ADDRESS_STEPS + " steps)");
  }

  /**
   * Prepare the section-plane roots on an actual placed arclength course.
   * Each bracket has a certified monotone interval and every other interval
   * is excluded before its chart addresses are returned.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Straight and quintic-rotation runs come from the native course; the signed plane distance and its derivative bound certify each searched interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing derivatives, axes without their original placed course and unresolved branches are refused. The certified collection never chooses a nearest sampled station.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed intervals own their frames and tangent derivatives; a query passes each new midpoint to the intervals and brackets it creates.
   * @evidence contracts/development/common.md#meaningful-documentation The axis, domain and section angle belong to the same placed source.
   */
  export function certifiedAddresses(
    part: Pick<IAutoMovieViewPart, "axis" | "name">,
    domain: readonly [number, number],
    family: IAutoMovieHumanConicLoft.IFamily,
    translation: V = [0, 0, 0],
  ): (p: readonly number[]) => [number, number][] {
    if (part.name !== family.name || !translation.every(Number.isFinite) || family.native !== undefined ||
        (family.origin !== undefined && [...family.origin.u, ...family.origin.v].some((value: number): boolean => value !== 0)))
      throw new Error("join loop: " + part.name + " has no certified placed course");
    const base = AutoMovieHumanConicLoft.axis(family);
    const straight = AutoMovieViewAxis.runs(family.centres, family.halves);
    if (typeof straight === "string") throw new Error("join loop: " + straight);
    const cross = (a: readonly number[], b: readonly number[]): V =>
      [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
    const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    const normal = (frame: IAutoMovieLoftSectionFrame): V => cross(frame.v, frame.u);
    const intervals: { lo: number; hi: number; rate: number; second: number }[] = [];
    const interval = (lo: number, hi: number, angle: number): void => {
      const from: number = Math.max(lo, domain[0]);
      const to: number = Math.min(hi, domain[1]);
      if (from >= to) return;
      const length: number = hi - lo;
      // The quintic angle derivative peaks at 30/(16L). Its second derivative
      // is 60 t (1-t)(1-2t)/L², bounded by 15/L² on the unit turn.
      const rate: number = angle === 0 ? 0 : (angle * 30) / (16 * length);
      intervals.push({ lo: from, hi: to, rate, second: angle === 0 ? 0 : (angle * 15) / (length * length) + rate * rate });
    };
    straight.forEach((run, i): void => {
      interval(i === 0 ? Math.min(domain[0], run.start) : run.start, i === straight.length - 1 ? Math.max(domain[1], run.end) : run.end, 0);
      const next = straight[i + 1];
      if (next === undefined || run.end === next.start) return;
      const a: V = normal(base.at(run.end));
      const b: V = normal(base.at(next.start));
      interval(run.end, next.start, Math.atan2(Math.hypot(...cross(a, b)), dot(a, b)));
    });
    if (intervals.length === 0) throw new Error("join loop: " + part.name + " has no certified station interval");
    /** The placed section plane and its tangent derivative at one station. */
    type Plane = { station: number; frame: IAutoMovieLoftSectionFrame; tangent: V; velocity: V };
    const at = (s: number): Plane => {
      const value = part.axis.at(s);
      const jet = base.jet?.(s);
      if (jet === undefined || jet === null) throw new Error("join loop: " + part.name + " has no physical course jet at " + s + " mm");
      const own = jet.value;
      if (!value.origin.every((x: number, k: number): boolean => x === own.origin[k]! + translation[k]!) ||
          ![value.u, value.v].every((vector, j): boolean => vector.every((x: number, k: number): boolean => x === [own.u, own.v][j]![k]!)))
        throw new Error("join loop: " + part.name + " source axis differs from its placed course at " + s + " mm");
      const [a, b] = [cross(jet.first.v, value.u), cross(value.v, jet.first.u)];
      return { station: s, frame: value, tangent: normal(value), velocity: [a[0] + b[0], a[1] + b[1], a[2] + b[2]] };
    };
    /** The ends and midpoint a whole course interval shares across every query. */
    type CourseInterval = { low: Plane; high: Plane; mid: Plane; rate: number; second: number };
    const course: CourseInterval[] = [];
    for (const { lo, hi, rate, second } of intervals) {
      const adjacent: Plane | undefined = course.at(-1)?.high;
      course.push({
        low: adjacent?.station === lo ? adjacent : at(lo),
        high: at(hi),
        mid: at((lo + hi) / 2),
        rate,
        second,
      });
    }

    return (world: readonly number[]): [number, number][] => {
      /** The query's signed distance and slope at an already prepared plane. */
      type Sample = { station: number; ahead: number; q: V; slope: number; frame: IAutoMovieLoftSectionFrame };
      const read = ({ station, frame, tangent, velocity }: Plane): Sample => {
        const q: V = [world[0]! - frame.origin[0], world[1]! - frame.origin[1], world[2]! - frame.origin[2]];
        return { station, ahead: dot(q, tangent), q, slope: -1 + dot(q, velocity), frame };
      };
      /** Adjacent samples bound a branch and a certified one may hold one root. */
      type Branch = { low: Sample; high: Sample; mid?: Sample };
      const roots: (Branch & { straight: boolean })[] = [];
      for (const { low, high, mid, rate, second } of course) {
        const pending: Branch[] = [{ low: read(low), high: read(high), mid: read(mid) }];
        let splits: number = 0;
        while (pending.length > 0) {
          const { low, high, mid }: Branch = pending.pop()!;
          const lo: number = low.station, hi: number = high.station;
          const middle: number = (lo + hi) / 2;
          const half: number = (hi - lo) / 2;
          const centre: Sample = mid ?? (middle === lo ? low : middle === hi ? high : read(at(middle)));
          const { ahead, q, slope }: Sample = centre;
          const reach: number = Math.hypot(...q) + half;
          // f'= -1 + (world-origin)·T'; f''=(world-origin)·T'' for unit arclength.
          if (Math.abs(ahead) > (1 + reach * rate) * half + ADDRESS_FLOOR_MM) continue;
          if (Math.abs(slope) > reach * second * half + Number.EPSILON * Math.max(1, Math.abs(slope))) {
            if (low.ahead === 0) roots.push({ low, high: low, straight: rate === 0 });
            if (high.ahead === 0) roots.push({ low: high, high, straight: rate === 0 });
            if (low.ahead * high.ahead < 0) roots.push({ low, high, mid: centre, straight: rate === 0 });
            continue;
          }
          if (middle === lo || middle === hi || splits >= ADDRESS_STEPS)
            throw new Error("join loop: " + part.name + " has an uncertified plane branch " + lo + ".." + hi + " mm");
          ++splits;
          pending.push({ low: centre, high }, { low, high: centre });
        }
      }
      const unique = roots.filter(({ low, high }, i): boolean =>
        i === 0 || low.station !== roots[i - 1]!.low.station || high.station !== roots[i - 1]!.high.station);
      return unique.map(({ low, high, mid, straight }): [number, number] => {
        let lo: number = low.station, hi: number = high.station, first: number = low.ahead;
        let s: number = straight ? Math.min(hi, Math.max(lo, lo + first)) : (lo + hi) / 2;
        let result: Sample = s === lo ? low : s === hi ? high : s === mid?.station ? mid : read(at(s));
        for (let i: number = 0; i < ADDRESS_STEPS && Math.abs(result.ahead) > ADDRESS_MM; ++i) {
          if (s === lo || s === hi) break;
          if ((result.ahead < 0) === (first < 0)) {
            lo = s;
            first = result.ahead;
          } else hi = s;
          s = (lo + hi) / 2;
          result = read(at(s));
        }
        if (Math.abs(result.ahead) > ADDRESS_FLOOR_MM) throw new Error("join loop: " + part.name + " plane-address distance at " + s + " mm is " + result.ahead);
        return [s, Math.atan2(dot(result.q, result.frame.v), dot(result.q, result.frame.u))];
      });
    };
  }

  /**
   * Prepare a station reader for callers that need one mathematical foot.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same certified section-plane collection and enforces a single chart address.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects zero and competing chart addresses before a point is returned.
   */
  export function certifiedAddress(
    part: Pick<IAutoMovieViewPart, "axis" | "name">,
    domain: readonly [number, number],
    family: IAutoMovieHumanConicLoft.IFamily,
    translation: V = [0, 0, 0],
  ): (p: readonly number[]) => [number, number] {
    const addresses = certifiedAddresses(part, domain, family, translation);
    return (world: readonly number[]): [number, number] => {
      const rows = addresses(world);
      if (rows.length !== 1)
        throw new Error("join loop: " + part.name + " has " + rows.length + " certified plane addresses");
      return rows[0]!;
    };
  }


  /** Plane addresses on the same bone course in its original arclength or native increasing material parameter. */
  export function materialAddresses(
    part: Pick<IAutoMovieViewPart, "axis" | "name">, domain: readonly [number, number],
    family: IAutoMovieHumanConicLoft.IFamily, reference: IAutoMovieHumanConicLoft.IFamily,
  ): (world: readonly number[]) => [number, number][] {
    if (family.native === undefined) return certifiedAddresses(part, domain, family);
    const bone = { ...family, native: undefined };
    const axis = AutoMovieHumanConicLoft.axis(bone);
    const map = AutoMovieHumanMaterialCourse.map(reference, bone);
    const physical: [number, number] = [map(domain[0]), map(domain[1])];
    const collect = certifiedAddresses({ name: part.name, axis }, physical, bone);
    return (world): [number, number][] => collect(world).map(([station]): [number, number] => {
      let lo: number = domain[0], hi: number = domain[1];
      let from: number = physical[0], to: number = physical[1];
      for (let i: number = 0; i < ADDRESS_STEPS; ++i) {
        const middle: number = (lo + hi) / 2;
        if (middle === lo || middle === hi) break;
        const value: number = map(middle);
        if (!Number.isFinite(value)) throw new Error("the material course has no finite station");
        if (value < station) [lo, from] = [middle, value];
        else [hi, to] = [middle, value];
      }
      const [s, resolved]: [number, number] = Math.abs(from - station) < Math.abs(to - station) ? [lo, from] : [hi, to];
      const actual = part.axis.at(s), registered = axis.at(resolved);
      if (![actual.origin, actual.u, actual.v].every((v, k): boolean =>
          v.every((x, j): boolean => x === [registered.origin, registered.u, registered.v][k]![j]!)))
        throw new Error("the actual material course differs from its registered bone plane");
      const q: V = [world[0]! - actual.origin[0], world[1]! - actual.origin[1], world[2]! - actual.origin[2]];
      const ahead: number = AutoMovieSolidVector.dot(q, AutoMovieSolidVector.cross(actual.v, actual.u));
      if (Math.abs(ahead) > ADDRESS_FLOOR_MM) throw new Error("the material section does not contain the physical contact");
      return [s, Math.atan2(AutoMovieSolidVector.dot(q, actual.v), AutoMovieSolidVector.dot(q, actual.u))];
    });
  }

  /** Locate one actual host-divider component independently of the child's material. */
  function dividerComponent(
    host: IAutoMovieViewPart, count: number, landmarks: readonly V[],
    divider: IAutoMovieHumanLandmarkSurface.ISurface, owns: IAutoMovieHumanJoinLoop.IRegisteredOwner, tolerance: number, grazing: number,
  ) {
    const side = divider.side, source = Full.create(host), h = sourceSurface(host);
    if (landmarks.length < 3 || landmarks.some((p): boolean => !owns(p, true) || !Number.isFinite(side(p)) || Math.abs(side(p)) > tolerance))
      throw new Error("the independent landmarks do not belong to their registered divider");
    const limit: number = owns.extent(divider);
    const located = landmarks.map((world) => {
      const [r, theta] = divider.address(world);
      const regular = divider.jet(r, theta);
      if (!(r > 0 && r <= limit && AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(regular.p, world)) <= tolerance &&
          AutoMovieSolidVector.dot(AutoMovieSolidVector.cross(regular.u, regular.v), divider.normal) < 0))
        throw new Error("the registered physical landmark is unavailable on its original polar divider");
      const hostAddress = address(host, source.domain, world, (source.domain[0] + source.domain[1]) / 2);
      const hostPoint = source.point(...hostAddress);
      return { r, theta, hostAddress, hostGap: AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(hostPoint, world)) };
    });
    if (!(Number.isFinite(limit) && limit > 0)) throw new Error("the registered divider has no finite radial search");
    const p = { name: host.name + ".divider", domain: [0, limit] as [number, number], orientation: -1 as const,
      period: 2 * Math.PI, jet: divider.jet, point: (r: number, theta: number): V => divider.jet(r, theta).p };
    const phases = located.map((q): number => q.theta).sort((a, b): number => a - b);
    const lines = phases.flatMap((a, k): number[] => [a, (a + phases[(k + 1) % phases.length]! + (k + 1 === phases.length ? 2 * Math.PI : 0)) / 2]);
    const physical = connected(h, p, located.map((q): number => q.r), lines, count, tolerance, grazing,
      (seed): boolean => owns(h.point(seed.y, seed.theta), true), (curve): boolean => {
        const kept = curve.points.filter((q): boolean => owns(q.point, true));
        if (kept.length > 0 && kept.length < curve.points.length) throw new Error("the connected host divider leaves the registered material support");
        return kept.length === curve.points.length && Math.abs(curve.partWinding) === 1;
      });
    for (const q of located) {
      if (q.hostGap <= tolerance && !physical.contains(source.point(...q.hostAddress), [q.r, q.theta]))
        throw new Error("a registered landmark present on both walls belongs to another material component");
    }
    return { physical, source, side };
  }

  /**
   * Read the registered original host-divider curve and both clock derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The original host and independent landmark divider own the connected regular curve. The actual host preimage supplies the loop's first and second clock derivatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The other wall has no influence on locating or shaping the master curve. A missing continued point refuses the callback.
   */
  export function master(
    host: IAutoMovieViewPart, count: number, landmarks: readonly V[],
    divider: IAutoMovieHumanLandmarkSurface.ISurface, owns: IAutoMovieHumanJoinLoop.IRegisteredOwner, tolerance: number, grazing: number,
  ) {
    const { physical, source, side } = dividerComponent(host, count, landmarks, divider, owns, tolerance, grazing);
    const curve = physical.curve, start = curve.points[0]!.t;
    const read = (clock: number): IAutoMovieSolidIntersection.IPoint => {
      const at = curve.at(start + clock);
      if (at === null || at.face !== 0 || !owns(at.point, true) || !(Math.abs(side(at.point)) <= tolerance))
        throw new AutoMovieLoftAdmissionError("the original host-divider component is unavailable at clock " + clock);
      return at;
    };
    const hostAt: IAutoMovieSolidSharedCurve.Loop = (clock) => {
      const q = read(clock);
      return { point: [q.y, q.theta], first: [q.rate[2], q.rate[3]], second: [q.rate2[2], q.rate2[3]] };
    };
    const at = (clock: number): { point: V; first: V; second: V } => {
      const q = hostAt(clock), h = source.jet(...q.point);
      const [a, b] = q.first, [aa, bb] = q.second;
      const ax = AutoMovieSolidVector;
      return { point: h.p, first: ax.add(ax.scale(h.u, a), ax.scale(h.v, b)),
        second: ax.add(ax.add(ax.scale(h.uu, a * a), ax.scale(h.uv, 2 * a * b)),
          ax.add(ax.scale(h.vv, b * b), ax.add(ax.scale(h.u, aa), ax.scale(h.v, bb)))) };
    };
    // The host's unit normal at the loop from its own first derivatives, turned out of the host (away from its course): with the loop's
    // tangent it spans the host's tangent plane, the slope the parent publishes for a child that leaves the loop.
    const normal = (clock: number): V => {
      const q = hostAt(clock), h = source.jet(...q.point), ax = AutoMovieSolidVector;
      const n: V = ax.cross(h.u, h.v), length: number = Math.hypot(n[0], n[1], n[2]);
      if (!(length > 0)) throw new AutoMovieLoftAdmissionError("the host has no tangent plane at the loop's clock " + clock);
      const centre = host.axis.at(q.point[0]).origin;
      const out: number = ax.dot(n, ax.sub(h.p, [centre[0]!, centre[1]!, centre[2]!])) < 0 ? -1 : 1;
      return ax.scale(n, out / length);
    };
    return { at, hostAt, normal };
  }

  /** Construct the legacy radial spelling when a caller explicitly owns a radial port. */
  export function dividerLoop(
    host: IAutoMovieViewPart, count: number, landmarks: readonly V[],
    divider: IAutoMovieHumanLandmarkSurface.ISurface, owns: IAutoMovieHumanJoinLoop.IRegisteredOwner, tolerance: number, grazing: number,
  ): IContact["loop"] {
    const { physical, source, side } = dividerComponent(host, count, landmarks, divider, owns, tolerance, grazing);
    const { centre, semi } = radial(physical, count);
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI / 2))
      throw new Error("the connected divider has no bounded single host chart");
    const inside = (s: number, phi: number): number => {
      if (!(s > source.domain[0] && s < source.domain[1])) throw new Error("the divider ray leaves the bounded host chart");
      const p: V = source.point(s, phi);
      const value: number = side(p);
      if (!Number.isFinite(value)) throw new Error("the signed host divider is undefined");
      return value;
    };
    const seed: V = source.point(...centre);
    if (!owns(seed, false) || !(inside(...centre) > 0))
      throw new Error("the independent perimeter does not bracket an interior occupied host germ");
    const shape = AutoMovieHumanSkinCutLoop.shares({
      point: (s, phi): V => {
        if (!(s > source.domain[0] && s < source.domain[1])) throw new Error("the divider ray leaves the bounded host chart");
        return source.point(s, phi);
      },
      centre, semi, count, sense: 1, reach: REACH,
      side: (p): number => {
        const value: number = side(p);
        if (!Number.isFinite(value)) throw new Error("the signed host divider is undefined");
        return -value;
      },
    });
    if (typeof shape === "string") throw new Error(shape);
    for (const [k, share] of shape.entries()) {
      const clock: number = 2 * Math.PI * k / count;
      const at = (r: number): [number, number] => [centre[0] + semi[0] * Math.cos(clock) * r, centre[1] + semi[1] * Math.sin(clock) * r];
      const target: V = source.point(...at(share));
      if (!owns(target, true) || Math.abs(side(target)) > tolerance || !physical.contains(target, divider.address(target)))
        throw new Error("the host divider leaves its registered perimeter at clock " + k);
      for (let j: number = 1; j <= 128; ++j) {
        const q: [number, number] = at(share + (REACH - share) * j / 128);
        const value: number = inside(...q);
        if (value >= 0 && owns(source.point(...q), true))
          throw new Error("the same owner re-enters the divider ray at clock " + k);
      }
    }
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense: 1, shape };
  }

  /** The material chart and outward orientation shared by the divider and transverse producers. */
  function sourceSurface(source: IAutoMovieViewPart): IAutoMovieSolidSurface & { point(u: number, v: number): V } {
    const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(source);
    const [lo, hi] = reader.domain;
    const middle: number = (lo + hi) / 2;
    const jet: IAutoMovieSolidSurface.IJet = reader.jet(middle, 0);
    const facing: number = AutoMovieSolidVector.dot(
      AutoMovieSolidVector.cross(jet.u, jet.v),
      AutoMovieSolidVector.sub(jet.p, source.axis.at(middle).origin),
    );
    if (!(Number.isFinite(facing) && facing !== 0))
      throw new Error(source.name + " has no outward regular source chart");
    return {
      name: source.name,
      domain: [lo, hi],
      period: 2 * Math.PI,
      orientation: facing > 0 ? 1 : -1,
      point: reader.point,
      jet: reader.jet,
    };
  }

  /** The divider supplies the master curve. Read both original full walls and their connected feet by the ordinary mixed-join rule. */
  export function onDivider(
    host: IAutoMovieViewPart, part: IAutoMovieViewPart, count: number,
    divider: IAutoMovieHumanLandmarkSurface.ISurface, owns: IAutoMovieHumanJoinLoop.IRegisteredOwner,
    landmarks: readonly V[], family: IAutoMovieHumanConicLoft.IFamily, reference: IAutoMovieHumanConicLoft.IFamily,
    tolerance: number, grazing: number, observe?: IAutoMovieHumanJoinLoop.IObserve,
  ): IContact {
    const side = divider.side;
    const loop = dividerLoop(host, count, landmarks, divider, owns, tolerance, grazing);
    const curve = AutoMovieConstructionPortCurve.curve(loop, count, 2 * Math.PI);
    if (typeof curve === "string") throw new Error(curve);
    const h = Full.create(host), p = Full.create(part);
    const addresses = materialAddresses(part, p.domain, family, reference);
    const foot = (world: V): [number, number] => {
      const possible = addresses(world).filter(([s, phi]): boolean =>
        s > p.domain[0] && s < p.domain[1] && Math.hypot(...AutoMovieSolidVector.sub(world, p.point(s, phi))) <= tolerance);
      if (possible.length !== 1) throw new Error(part.name + " has " + possible.length + " material-matched bounded divider feet");
      return possible[0]!;
    };
    const at = curve.at(0).point, child = foot(h.point(...at));
    const contact: IContact = { loop, host: [at[0] / 1000, at[1]], part: [child[0] / 1000, child[1]], stations: [], gap: 0 };
    return shared(host, part, contact, count, tolerance, grazing, (a, b, k, found): void => {
      if (!owns(a, true) || !owns(b, true) || ![side(a), side(b)].every((v): boolean => Number.isFinite(v) && Math.abs(v) <= tolerance))
        throw new Error("the two actual walls leave their registered divider at material clock " + k);
      const expected = foot(a), jet = p.jet(...expected);
      const ds: number = found[0] - expected[0], dp: number = Math.atan2(Math.sin(found[1] - expected[1]), Math.cos(found[1] - expected[1]));
      if (!(Math.hypot(...jet.u.map((v, i): number => ds * v + dp * jet.v[i]!)) <= tolerance))
        throw new Error("the actual mixed join left its certified divider foot at material clock " + k);
    }, observe);
  }

  /** Admit the connected physical feet, closed chart and mixed smooth/fold law of the same declared host loop. */
  export function shared(
    host: IAutoMovieViewPart, part: IAutoMovieViewPart, contact: IContact, count: number, tolerance: number, grazing: number,
    owns: (a: V, b: V, clock: number, child: [number, number]) => void,
    observe?: IAutoMovieHumanJoinLoop.IObserve,
  ): IContact {
    const h = sourceSurface(host), p = sourceSurface(part);
    const curve = AutoMovieConstructionPortCurve.curve(contact.loop, count, h.period);
    if (typeof curve === "string") throw new Error("the independently constructed host loop cannot be parameterized: " + curve);
    const start: [number, number] = [contact.part[0] * 1000, contact.part[1]];
    const result = AutoMovieSolidSharedCurve.create({ part: p, host: h, loop: curve.at,
      count, tolerance, grazing, keep: "outside", start });
    if (result.shared === null) throw new Error("the registered divider has no common material boundary: " +
      result.diagnostics.map((fault): string => fault.detail).join(", "));
    const points = result.shared.curve.points;
    if (points.length !== count) throw new Error("the registered divider did not cover every material clock");
    let maximum = 0;
    for (const [k, point] of points.entries()) {
      const a = h.jet(point.y, point.theta).p, b = p.jet(point.s, point.phi).p;
      const gap = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      observe?.([point.y, point.theta], [point.s, point.phi]);
      if (!(gap <= tolerance)) throw new Error("the two physical walls differ at clock " + k + " by " + gap + " mm");
      owns(a, b, k, [point.s, point.phi]);
      maximum = Math.max(maximum, gap);
    }
    for (let index: number = 0; index < count; ++index) {
      const clock: number = (2 * Math.PI * (index + 0.5)) / count;
      const point = result.shared.curve.at(clock);
      if (point === null || point.face !== 0)
        throw new Error("the shared foot leaves its original face between columns at " + clock);
      const onHost: [number, number] = curve.at(clock).point;
      const onPart: [number, number] = [point.s, point.phi];
      const a: V = h.jet(...onHost).p, b: V = p.jet(...onPart).p;
      const gap: number = Math.hypot(...AutoMovieSolidVector.sub(a, b));
      observe?.held?.(clock, onHost, onPart);
      if (!(gap <= tolerance))
        throw new Error("the actual held wall gap at " + clock + " radians is " + gap + " mm");
      owns(a, b, index + 0.5, onPart);
      maximum = Math.max(maximum, gap);
    }
    const first = points[0]!;
    return { ...contact, host: [first.y / 1000, first.theta], part: [first.s / 1000, first.phi],
      stations: points.map((point): number => point.s), gap: maximum };
  }

  /** Walk the actual two chart surfaces from existing bounded material station lines before selecting an anatomical component. */
  function connected(
    h: IAutoMovieSolidSurface & { point(u: number, v: number): V }, p: IAutoMovieSolidSurface & { point(u: number, v: number): V },
    cells: readonly number[], phases: readonly number[], count: number, tolerance: number, grazing: number,
    possible: (seed: IAutoMovieSolidIntersection.IInput["seed"]) => boolean, eligible: (curve: IAutoMovieSolidIntersection.ICurve) => boolean,
  ) {
    const [lo, hi] = p.domain!;
    const ranges = [...new Set([lo, ...cells.filter((s): boolean => s > lo && s < hi), hi])].sort((a, b): number => a - b);
    const norm = (a: V, b: V): number => AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(a, b));
    const wrap = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));
    const world = (seed: IAutoMovieSolidIntersection.IInput["seed"]): V => p.point(seed.s, seed.phi);
    const owns = (
      curve: IAutoMovieSolidIntersection.ICurve, target: V, child: [number, number], host?: [number, number], meeting: number = 0,
    ): boolean => {
      const closest = curve.points.reduce((best, next) => norm(next.point, target) < norm(best.point, target) ? next : best);
      let point = closest;
      for (let i: number = 0; i < ADDRESS_STEPS; ++i) {
        const delta = AutoMovieSolidVector.sub(point.point, target);
        const gap: number = AutoMovieSolidVector.norm(delta);

        // A seed is resolved only to its own meeting gap, so its distance from the curve is read at the trace's resolution there.
        const resolution: number = host === undefined ? tolerance : aliasResolution(tolerance, meeting, point.angle);
        if (gap <= resolution) {
          const a = p.jet(...child);
          const close = (jet: IAutoMovieSolidSurface.IJet, ds: number, phase: number): boolean =>
            AutoMovieSolidVector.norm(AutoMovieSolidVector.add(AutoMovieSolidVector.scale(jet.u, ds),
              AutoMovieSolidVector.scale(jet.v, wrap(phase)))) <= resolution;
          if (host === undefined) return close(a, point.s - child[0], point.phi - child[1]);
          const b = h.jet(...host);
          return point.angle >= grazing && close(a, point.s - child[0], point.phi - child[1]) &&
            close(b, point.y - host[0], point.theta - host[1]);
        }
        const square = AutoMovieSolidVector.dot(point.tangent, point.tangent);
        if (!(square > 0)) return false;
        const step = AutoMovieSolidVector.dot(point.tangent, delta) / square;
        const next = curve.at(point.t - step);
        if (next === null || !(norm(next.point, target) < gap)) return false;
        point = next;
      }
      return false;
    };
    const walked: IAutoMovieSolidIntersection.ICurve[] = [], accepted: IAutoMovieSolidIntersection.ICurve[] = [];
    type Line = { from: number; to: number; phase: number };
    type Seed = IAutoMovieSolidIntersection.IInput["seed"];
    let rejected: number = 0, unclosed: number = 0;
    const missing: { line: Line; detail: string }[] = [];
    const unowned: { line: Line; seed: Seed }[] = [];
    const observedAliases: { line: Line; seed: Seed; trace: number }[] = [];
    const branches: {
      line: Line; part: [number, number]; host: [number, number]; gapMm: number; result: string;
      diagnostics: IAutoMovieSolidIntersection.IResult["diagnostics"]; winding?: [number, number];
      closing?: { host: [number, number]; part: [number, number] } | null; detail?: string;
    }[] = [];
    for (let i = 1; i < ranges.length; ++i) for (const phase of phases) {
      const line: Line = { from: ranges[i - 1]!, to: ranges[i]!, phase };
      const seed = AutoMovieConstructionSeeds.create({ type: "search", hostFace: h.name, partFace: p.name,
        phase, from: (line.from - lo) / (hi - lo), to: (line.to - lo) / (hi - lo) },
        p, ranges, h, 0, tolerance);
      if (typeof seed === "string") { missing.push({ line, detail: seed }); continue; }
      if (!possible(seed)) { ++rejected; unowned.push({ line, seed }); continue; }
      const meeting: number = norm(p.point(seed.s, seed.phi), h.point(seed.y, seed.theta));
      const match: number = walked.findIndex((curve): boolean =>
        owns(curve, world(seed), [seed.s, seed.phi], [seed.y, seed.theta], meeting));
      if (match !== -1) { observedAliases.push({ line, seed, trace: match }); continue; }
      const entry: (typeof branches)[number] = { line, part: [seed.s, seed.phi], host: [seed.y, seed.theta],
        gapMm: norm(p.point(seed.s, seed.phi), h.point(seed.y, seed.theta)), result: "unclosed", diagnostics: [] };
      branches.push(entry);
      const found = AutoMovieSolidIntersection.trace({ part: p, host: h, seed, parameter: { kind: "arc" }, count, tolerance, grazing });
      entry.diagnostics = found.diagnostics;
      if (found.curve === null) { ++unclosed; continue; }
      const curve = found.curve;
      walked.push(curve);
      entry.winding = [curve.winding, curve.partWinding];
      const finish: IAutoMovieSolidIntersection.IPoint | null = curve.at(curve.points[0]!.t + 2 * Math.PI);
      entry.closing = finish === null ? null : { host: [finish.y, finish.theta], part: [finish.s, finish.phi] };
      if (finish === null) { ++unclosed; entry.detail = "the continued source is unavailable at the closing clock"; continue; }
      if (!eligible(curve)) { ++rejected; entry.result = "unregistered"; continue; }
      if (curve.winding !== 0 || curve.points.length !== count || curve.points.some((q): boolean =>
          q.face !== 0 || !(q.s > lo && q.s < hi && q.y > h.domain![0] && q.y < h.domain![1]) ||
          !(norm(p.point(q.s, q.phi), h.point(q.y, q.theta)) <= tolerance))) {
        ++unclosed; entry.detail = "the registered curve leaves its two complete regular finite source charts"; continue;
      }
      entry.result = "registered";
      accepted.push(curve);
    }
    if (accepted.length !== 1 || unclosed !== 0)
      throw new Error("bounded attachment search found " + accepted.length + " registered closed components, " + unclosed +
        " unresolved eligible traces, " + rejected + " unowned observations and " + missing.length + " lines without a meeting: " +
        JSON.stringify({ part: p.name, host: h.name, partDomain: p.domain, hostDomain: h.domain, rangeCount: ranges.length - 1,
          phases, missing, unowned, branches, observedAliases }));
    const curve = accepted[0]!;
    return { curve, contains: (point: V, child: [number, number]): boolean => owns(curve, point, child) };
  }

  /**
   * How far a seed may stand from a traced loop and still lie on it: the trace's own resolution there.
   *
   * A seed lies on one wall and stands `meeting` from the other. Where the walls meet at the angle `angle`, the points of the first
   * wall within `meeting` of the second lie within `meeting / sin(angle)` of their intersection (two planes through a line at that
   * angle: a point of one at distance `d` from the other stands `d / sin(angle)` from the line), and the traced points are themselves
   * within the tolerance. Two loops of the same walls nearer than this cannot be told apart from that seed, and are aliased.
   *
   * @param tolerance The meeting tolerance the trace converges each point to, mm.
   * @param meeting The seed's own distance between its two walls' points, mm.
   * @param angle The walls' angle at the curve's point nearest the seed, radians.
   * @evidence contracts/development/implementation.md#principled-implementation The planar first-order distance from a point on one wall to the walls' intersection, added to the trace's tolerance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grazing or nonfinite angle gives no resolution; the alias test then fails as it did before.
   */
  export function aliasResolution(tolerance: number, meeting: number, angle: number): number {
    const sine: number = Math.sin(angle);
    if (!(sine > 0 && Number.isFinite(meeting) && meeting >= 0)) return tolerance;
    return tolerance + meeting / sine;
  }

  function radial(component: ReturnType<typeof connected>, count: number) {
    const { curve } = component;
    const wrap = (angle: number): number => Math.atan2(Math.sin(angle), Math.cos(angle));
    const base = curve.points[0]!.theta;
    const chart = curve.points.map((q): [number, number] => [q.y, base + wrap(q.theta - base)]);
    const origin: [number, number] = [0, 0];
    for (const q of chart) { origin[0] += q[0] / count; origin[1] += q[1] / count; }
    const semi: [number, number] = [0, 1].map((axis): number => Math.max(...chart.map((q): number => Math.abs(q[axis]! - origin[axis]!)))) as [number, number];
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI)) throw new Error("the attachment trace has no bounded unwrapped host chart");
    const points = chart.map((q) => ({ x: (q[0] - origin[0]) / semi[0], y: (q[1] - origin[1]) / semi[1] }));
    const area = points.reduce((sum, q, i): number => { const b = points[(i + 1) % count]!; return sum + q.x * b.y - q.y * b.x; }, 0);
    if (area === 0) throw new Error("the attachment trace has zero directed host area");
    if (area < 0) points.reverse();
    const linesIn = points.map((point, i) => {
      const b = points[(i + 1) % count]!, dx = b.x - point.x, dy = b.y - point.y, length = Math.hypot(dx, dy);
      if (!(length > 0)) throw new Error("the attachment trace has an empty edge");
      return { point, direction: { x: dx / length, y: dy / length } };
    });
    const radius = Math.max(...points.map((q): number => Math.hypot(q.x, q.y)));
    let margin = radius, chosen: [number, number] | undefined;
    for (let i: number = 0; i < ADDRESS_STEPS; ++i, margin /= 2) {
      const inset = linesIn.map(({ point, direction }) => ({ point: { x: point.x - direction.y * margin, y: point.y + direction.x * margin }, direction }));
      const solution = solveAutoMovieHalfPlaneProgram(inset, radius, { x: 0, y: 0 });
      if (!solution.feasible) continue;
      const q: [number, number] = [solution.point.x, solution.point.y];
      if (points.every((a, j): boolean => {
        const b = points[(j + 1) % count]!;
        return orientAutoMovieSolidChart([a.x, a.y], [b.x, b.y], q) > 0;
      })) { chosen = [origin[0] + semi[0] * q[0], origin[1] + semi[1] * q[1]]; break; }
    }
    if (chosen === undefined) throw new Error("the traced attachment has no certified strictly interior radial chart kernel");
    const semiFromKernel: [number, number] = [0, 1].map((k): number => Math.max(...chart.map((q): number => Math.abs(q[k]! - chosen![k]!)))) as [number, number];
    return { ...component, centre: chosen, semi: semiFromKernel };
  }

  /**
   * Inspect every declared part-station interval at each registered phase and return the sole observed eligible closed branch.
   * A failed bounded line leaves its interval unobserved. The returned radial centre is interior to the directed host trace.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The existing seed and intersection operators read the original surface jets and both finite material domains.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Competing registered curves and unresolved eligible walks refuse. An independent anatomical classifier and the later shared-wall feet own separate checks.
   */
  export function originalGerm(
    host: IAutoMovieViewPart, part: IAutoMovieViewPart, phases: readonly number[], count: number, tolerance: number, grazing: number,
    possible: (seed: IAutoMovieSolidIntersection.IInput["seed"]) => boolean, eligible: (curve: IAutoMovieSolidIntersection.ICurve) => boolean,
  ) {
    return radial(connected(sourceSurface(host), sourceSurface(part), part.stations, phases, count, tolerance, grazing, possible, eligible), count);
  }

  /** Require a medial contact on the actual registered tragal section before claiming the connected cranial branch. */
  export function cranialGerm(
    host: IAutoMovieViewPart, part: IAutoMovieViewPart, tragion: V, outward: V,
    family: IAutoMovieHumanConicLoft.IFamily, translation: V, count: number, lines: number, tolerance: number, grazing: number,
  ) {
    const h = sourceSurface(host), p = sourceSurface(part);
    const traceLevel = certifiedAddresses(part, p.domain!, family, translation)(tragion);
    if (traceLevel.length !== 1) throw new Error("the registered tragion has " + traceLevel.length + " bounded auricle sections");
    const [station, phi] = traceLevel[0]!;
    const direction = (face: IAutoMovieSolidSurface, s: number, phase: number): number => {
      const jet = face.jet(s, phase);
      return face.orientation * AutoMovieSolidVector.dot(AutoMovieSolidVector.cross(jet.u, jet.v), outward);
    };
    let lastSide: { s: number; phi: number; y: number; theta: number; auricle: number; cranial: number } | undefined;
    const medial = (q: IAutoMovieSolidIntersection.IInput["seed"]): boolean => {
      const auricle = direction(p, q.s, q.phi), cranial = direction(h, q.y, q.theta);
      lastSide = { s: q.s, phi: q.phi, y: q.y, theta: q.theta, auricle, cranial };
      return auricle < 0 && cranial > 0;
    };
    const phases = [...new Set([phi, ...Array.from({ length: lines }, (_, k): number => Math.PI + 2 * Math.PI * k / lines)])];
    try {
      return radial(connected(h, p, part.stations, phases, count, tolerance, grazing, medial, (curve): boolean =>
      curve.points.some((a, i): boolean => {
        const b = curve.points[(i + 1) % curve.points.length]!;
        if (station < Math.min(a.s, b.s) || station > Math.max(a.s, b.s)) return false;
        let left = a, right = b;
        let lo: number = a.t, hi: number = i + 1 === curve.points.length ? curve.points[0]!.t + 2 * Math.PI : b.t;
        for (let j: number = 0; j < ADDRESS_STEPS; ++j) {
          const t: number = lo + (hi - lo) / 2;
          if (!(t > lo && t < hi)) break;
          const mid = curve.at(t);
          if (mid === null) return false;
          if ((left.s - station) * (mid.s - station) <= 0) { right = mid; hi = t; }
          else { left = mid; lo = t; }
        }
        const q = Math.abs(left.s - station) <= Math.abs(right.s - station) ? left : right;
        return Math.abs(q.s - station) <= tolerance && medial(q);
      })), count);
    } catch (error: unknown) {
      throw new Error((error instanceof Error ? error.message : String(error)) +
        "; registered tragal section and last oriented meeting " + JSON.stringify({ station, phi, translation, lastSide }));
    }
  }

  /**
   * Prepare a shared loop from the two directly owned surfaces, located by an
   * independent skin landmark. The trace is only a producer of the host's
   * shares. The construction still admits the periodic port law against both
   * actual realized walls, including between its declared columns.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Traces one transverse phase branch using the existing engine and resamples its corrected points at the host's normalized chart clocks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing, tangent, wrapping or nonstar-shaped branch, a departure from the authored divider or a lost radial-clock bracket is refused without moving either wall or enlarging tolerance.
   * @evidence contracts/development/common.md#meaningful-documentation The landmark is a spatial locator in millimetres, the trace gap a sampled millimetre reading and the returned host/part addresses use metres and radians.
   */
  export function intersection(
    host: IAutoMovieViewPart,
    part: IAutoMovieViewPart,
    anchor: readonly number[],
    dividingSide: (point: readonly number[]) => number,
    count: number,
    tolerance: number,
    grazing: number,
    observe?: (host: [number, number], child: [number, number]) => void,
  ): IContact {
    const a: IAutoMovieSolidSurface = sourceSurface(part);
    const b: IAutoMovieSolidSurface = sourceSurface(host);
    const [s, phi] = address(part, a.domain!, anchor, (a.domain![0] + a.domain![1]) / 2);
    const [y, theta] = address(host, b.domain!, anchor, (b.domain![0] + b.domain![1]) / 2);
    const result: IAutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({
      part: a, host: b, seed: { s, phi, y, theta },
      parameter: { kind: "phase" }, count, tolerance, grazing,
    });
    const curve: IAutoMovieSolidIntersection.ICurve | null = result.curve;
    if (curve === null || result.diagnostics.length !== 0)
      throw new Error("the located transverse contact is unavailable: " +
        result.diagnostics.map((row): string => row.contract + " (" + row.detail + ")").join("; "));
    if (curve.winding !== 0 || curve.partWinding !== 1 ||
        curve.points.some((row): boolean => row.face !== 0))
      throw new Error("the located contact changes host face or chart winding");

    const turn: number = 2 * Math.PI;
    const wrap = (value: number): number => Math.atan2(Math.sin(value), Math.cos(value));
    const hostPhase = (row: IAutoMovieSolidIntersection.IPoint): number => theta + wrap(row.theta - theta);
    const centre: [number, number] = [
      curve.points.reduce((sum, row): number => sum + row.y, 0) / count,
      curve.points.reduce((sum, row): number => sum + hostPhase(row), 0) / count,
    ];
    const semi: [number, number] = [
      Math.max(...curve.points.map((row): number => Math.abs(row.y - centre[0]))),
      Math.max(...curve.points.map((row): number => Math.abs(hostPhase(row) - centre[1]))),
    ];
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI / 2))
      throw new Error("the located contact has no single bounded host chart");
    const clock = (row: IAutoMovieSolidIntersection.IPoint): [number, number, number] => {
      const x: number = (row.y - centre[0]) / semi[0];
      const y: number = wrap(row.theta - centre[1]) / semi[1];
      const rate: number = (x * row.rate[3] / semi[1] - y * row.rate[2] / semi[0]) / (x * x + y * y);
      return [Math.atan2(y, x), Math.hypot(x, y), rate];
    };
    const first: IAutoMovieSolidIntersection.IPoint = curve.points[0]!;
    const origin: number = clock(first)[0];
    const winding: 1 | -1 = clock(first)[2] > 0 ? 1 : -1;
    const rows = [...curve.points, { ...first, t: first.t + turn }];
    const brackets = rows.map((row): { point: IAutoMovieSolidIntersection.IPoint; angle: number } => ({
      point: row,
      angle: winding * wrap(clock(row)[0] - origin),
    }));
    for (let i: number = 0; i < brackets.length; ++i) {
      const at = brackets[i]!;
      if (!(winding * clock(at.point)[2] > 0))
        throw new Error("the located contact reverses its host clock at part phase " + at.point.phi);
      if (i === 0) continue;
      while (at.angle <= brackets[i - 1]!.angle - Math.PI) at.angle += turn;
      if (!(at.angle > brackets[i - 1]!.angle && at.angle <= turn))
        throw new Error("the located contact does not cross each host ray once");
    }
    if (brackets.at(-1)!.angle !== turn)
      throw new Error("the located contact does not complete one host clock turn");

    const points: IAutoMovieSolidIntersection.IPoint[] = [];
    let gap: number = 0;
    const shape: number[] = Array.from({ length: count }, (_: unknown, k: number): number => {
      const wanted: number = turn * k / count;
      const angle: number = ((winding * (wanted - origin)) % turn + turn) % turn;
      const j: number = brackets.findIndex((row): boolean => row.angle >= angle);
      if (j < 0) throw new Error("the trace does not bracket host clock " + k);
      let current: IAutoMovieSolidIntersection.IPoint = brackets[j]!.point;
      if (brackets[j]!.angle !== angle) {
        let lo: number = brackets[j - 1]!.point.t;
        let hi: number = current.t;
        for (let i: number = 0; i < ADDRESS_STEPS; ++i) {
          const [actual, , rate] = clock(current);
          const difference: number = wrap(actual - wanted);
          if (!(winding * rate > 0))
            throw new Error("the located contact reverses its host clock between columns");
          if (difference === 0) break;
          if (winding * difference < 0) lo = current.t;
          else hi = current.t;
          const trial: number = current.t - difference / rate;
          const next: number = trial > lo && trial < hi ? trial : (lo + hi) / 2;
          if (next === lo || next === hi) break;
          const corrected: IAutoMovieSolidIntersection.IPoint | null = curve.at(next);
          if (corrected === null) throw new Error("the contact trace lost host clock " + k);
          current = corrected;
        }
      }
      const [actual, share] = clock(current);
      if (!(share > 0 && Math.cos(actual - wanted) > 0))
        throw new Error("the contact is not on the positive host ray at clock " + k);
      const hostPoint: V = b.jet(
        centre[0] + share * semi[0] * Math.cos(wanted),
        centre[1] + share * semi[1] * Math.sin(wanted),
      ).p;
      const partPoint: V = a.jet(current.s, current.phi).p;
      const distance: number = Math.hypot(...AutoMovieSolidVector.sub(hostPoint, partPoint));
      if (!(distance <= tolerance))
        throw new Error("the contact is not on the requested host ray at clock " + k + ", gap " + distance + " mm");
      const side: number = dividingSide(hostPoint);
      if (!(Math.abs(side) <= tolerance))
        throw new Error("the actual crossing leaves its authored dividing surface at clock " + k + ", signed offset " + side + " mm");
      observe?.([centre[0] + semi[0] * share * Math.cos(wanted), centre[1] + semi[1] * share * Math.sin(wanted)],
        [current.s, current.phi]);
      gap = Math.max(gap, distance);
      points.push(current);
      return share;
    });
    const seed: IAutoMovieSolidIntersection.IPoint = points[0]!;
    return {
      loop: { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense: 1, shape },
      host: [(centre[0] + semi[0] * shape[0]!) / 1000, centre[1]],
      part: [seed.s / 1000, seed.phi],
      gap,
      stations: curve.points.map((p): number => p.s),
    };
  }

  /**
   * Generate the contact of a part on a host.
   *
   * @param host The host's complete source; every point of the part's cut stands inside its course's radius of curvature.
   * @param part The part's complete source on the stored side (+Z), carried inward past the surface.
   * @param count The join's column count: the loop's shares.
   * @param side The dividing surface, mm: positive on the part's side, zero on it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each part station line is sampled at its declared sections and source endpoints, then the one observed crossing is bisected; each point is given its address on the host's chart (the station whose section plane holds it, found by stepping along the course by the point's distance ahead of the plane, and its polar angle in that station's frame); the loop's centre and half extents are those addresses' centroid and extents; its shares are the host's own skin cut by the surface along each column's ray (`AutoMovieHumanSkinCutLoop.shares`), so the loop lies on the surface at every column and is interpolated nowhere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cut the part, address the host, cut the host.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stored loop, landmark or person enters and nothing is faired; a point with no address on the host, a station line with more or fewer than one observed crossing, a loop that is not star-shaped about its centre and a ray without a crossing are refused with their numbers. Sampling cannot distinguish several crossings between one pair of declared sections.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each declared section shares its point reader preparation over all 360 phases. The resulting brackets use at most 40 bisections each, and `count` host rays use 256 steps with at most 60 bisections; no loft and no mesh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source readers are prepared once and serve every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the readers die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' premises, the units and each refusal.
   */
  export function create(host: IAutoMovieViewPart, part: IAutoMovieViewPart, count: number, side: (p: readonly number[]) => number): IContact {
    const [onto, from]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(host), Full.create(part)];

    const chart = (p: readonly number[], guess: number): [number, number] => address(host, onto!.domain, p, guess);

    // Bracket one observed crossing per station line at the source's own
    // declared sections, including an exact final fractional interval.
    const [start, end] = from!.domain;
    const sections: number[] = part.stations.filter((s: number): boolean => s > start && s < end);
    sections.push(end);
    const phases: number[] = Array.from(
      { length: PHASES },
      (_: unknown, j: number): number => (2 * Math.PI * j) / PHASES,
    );
    const at = (s: number): ((phase: number) => number) => {
      const point: (phase: number) => V = from!.pointAt(s);
      return (phase: number): number => {
        const value: number = side(point(phase));
        if (!Number.isFinite(value))
          throw new Error("join loop: the dividing surface is unavailable at " + s + " mm, phase " + phase);
        return value;
      };
    };
    const atStart: (phase: number) => number = at(start);
    const lines = phases.map((phase: number) => ({
      phase,
      station: start,
      value: atStart(phase),
      zero: null as number | null,
      brackets: [] as { lo: number; hi: number; negative: boolean }[],
    }));
    for (const s of sections) {
      const read: (phase: number) => number = at(s);
      for (const line of lines) {
        const value: number = read(line.phase);
        if (value === 0) {
          if (line.zero !== null || line.value === 0 || s === end)
            throw new Error("join loop: the dividing surface meets a station line without an interior crossing at phase " + line.phase);
          line.zero = s;
          continue;
        }
        if (line.value === 0)
          throw new Error("join loop: the dividing surface meets the first section at phase " + line.phase);
        if ((line.value < 0) !== (value < 0)) {
          const [lo, hi] = line.zero === null ? [line.station, s] : [line.zero, line.zero];
          line.brackets.push({ lo, hi, negative: line.value < 0 });
        } else if (line.zero !== null) {
          throw new Error("join loop: tangent contact at phase " + line.phase);
        }
        line.station = s;
        line.value = value;
        line.zero = null;
      }
    }
    const roots = lines.map(({ phase, brackets }) => {
      if (brackets.length !== 1)
        throw new Error("join loop: the part's station line at phase " + phase + " rad passes the dividing surface " + brackets.length + " times, not once");
      return { phase, ...brackets[0]! };
    });
    // A section at the same exact midpoint is prepared only once per group.
    // Each phase still sees its own original sequence of bisection queries.
    for (let i: number = 0; i < 40; ++i) {
      const sections = new Map<number, (typeof roots)[number][]>();
      for (const root of roots) {
        const middle: number = (root.lo + root.hi) / 2;
        if (middle === root.lo || middle === root.hi) continue;
        const row = sections.get(middle);
        if (row === undefined) sections.set(middle, [root]);
        else row.push(root);
      }
      if (sections.size === 0) break;
      for (const [s, row] of sections) {
        const read: (phase: number) => number = at(s);
        for (const root of row) {
          const value: number = read(root.phase);
          if (value === 0) {
            root.lo = s;
            root.hi = s;
          } else if ((value < 0) === root.negative) root.lo = s;
          else root.hi = s;
        }
      }
    }
    const stations: number[] = roots.map(({ lo, hi }): number => (lo + hi) / 2);

    // Each point's address on the host's chart, with the gap between the two skins there. The phase is unwrapped along the ring, so a
    // loop across the chart's seam keeps one centre.
    let gap: number = 0;
    const points: [number, number][] = [];
    stations.forEach((station: number, j: number): void => {
      const p: readonly number[] = from!.point(station, (2 * Math.PI * j) / PHASES);
      const [s, t]: [number, number] = chart(p, points.length === 0 ? (onto!.domain[0] + onto!.domain[1]) / 2 : points.at(-1)![0]);
      const before: number = points.length === 0 ? t : points.at(-1)![1];
      const phase: number = before + Math.atan2(Math.sin(t - before), Math.cos(t - before));
      const q: readonly number[] = onto!.point(s, phase);
      gap = Math.max(gap, Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!));
      points.push([s, phase]);
    });
    const centre: [number, number] = [0, 1].map((k: number): number => points.reduce((sum: number, p: [number, number]): number => sum + p[k]!, 0) / PHASES) as [number, number];
    const semi: [number, number] = [0, 1].map((k: number): number => Math.max(...points.map((p: [number, number]): number => Math.abs(p[k]! - centre[k]!)))) as [number, number];
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI)) throw new Error("join loop: the loop's half extents on the host's chart are " + semi.join(" mm and ") + " rad");

    // Star-shaped about the centre: the part's ring turns one way round it, once.
    const clocks: number[] = points.map((p: [number, number]): number => Math.atan2((p[1] - centre[1]) / semi[1], (p[0] - centre[0]) / semi[0]));
    const steps: number[] = clocks.map((clock: number, j: number): number => {
      const d: number = clock - clocks[(j + PHASES - 1) % PHASES]!;
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const turn: number = steps.reduce((sum: number, d: number): number => sum + d, 0);
    const back: number = steps.filter((d: number): boolean => Math.sign(turn) * d <= 0).length;
    if (Math.abs(Math.abs(turn) - 2 * Math.PI) > 1e-6 || back > 0)
      throw new Error("join loop: the loop is not star-shaped about its centre on the host's chart (" + back + " of " + PHASES + " steps turn back)");

    // The host's own skin cut by the same surface, along each column's ray from the centre.
    const shape: number[] | string = AutoMovieHumanSkinCutLoop.shares({
      point: (u: number, v: number): V => onto!.point(u, v) as V,
      centre,
      semi,
      sense: 1,
      count,
      side: (p: V): number => -side(p),
      reach: REACH,
    });
    if (typeof shape === "string") throw new Error("join loop: " + shape);

    // The part's ring point nearest clock 0, for the seed.
    const first: number = clocks.reduce((best: number, clock: number, j: number): number => (Math.abs(clock) < Math.abs(clocks[best]!) ? j : best), 0);
    return {
      loop: { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense: 1, shape },
      part: [stations[first]! / 1000, (2 * Math.PI * first) / PHASES],
      host: [(centre[0] + shape[0]! * semi[0]) / 1000, centre[1]],
      gap,
      stations,
    };
  }
}

import {
  AutoMovieConstructionSeeds,
  type AutoMovieSolidIntersection,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type {
  AutoMovieConstructionSeed,
  IAutoMovieConstructionSearchSeed,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A returned meeting, without a trace or a Human figure. */
type Seed = AutoMovieSolidIntersection.IInput["seed"];

/** Invocation-local counts observe only callbacks authored by this test. */
interface Reads {
  /** Host jet invocations, without changing their geometric output. */
  host: number;

  /** Part jet invocations, without changing their geometric output. */
  part: number;
}

/**
 * Fixed-phase seed search finds an owned transverse meeting on regular analytic surfaces.
 *
 * Scenarios:
 * 1. The periodic part P(s,phi)=(s,A*sin(phi),f(s)+A*(1-cos(phi))) over a plane has one crossing at s=L/2 for f/L=q^3-5q/4, q=s/L-1/2. Its two endpoint Newton starts cycle exactly 0<->L at unit scale despite that unique regular transverse crossing.
 * 2. A quadratic-height periodic part has two transverse roots L/4 and 3L/4. Its world X=3s-7L/4 puts the first root outside the host's owned [0,L] chart, while the later root is inside. Both search directions must return that owned root, rather than delegating a rejected extension seed to a later full trace.
 * 3. Three common length units, two fixed phases and both height signs preserve the same independent roots. Exact share-endpoint roots, a point seed's metre conversion and invalid shares retain their distinct behavior.
 * 4. A disjoint regular periodic part and polynomial graph exercise cold-foot work. Counters report actual authored callback reads without asserting the current duplicated work as a contract or replacing Foot. A simpler separated plane case must also return a search failure.
 * 5. A round tube whose centre rises as a(1.5t-0.25) over a plane keeps its phase-0 line above the plane (z >= 0.75a) while its phase-pi line crosses it at t = 5/6. A fixed phase-0 search must refuse; a search over two lines (`phases: 2`) must return the phase-pi crossing at 5L/6 with phase pi, in three units and both directions; a line count of 0, 1.5, -2 or NaN is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production seed owner directly on analytic two-jet surfaces, then reads its returned chart coordinates on both surfaces and checks actual domains, gap, phase and independent root station. It collects every failure before throwing; callback counts are diagnostic observations rather than a snapshot of bad work.
 * @evidence contracts/development/testing.md#independent-expectations The cubic is strictly decreasing since 3q^2-5/4<=-1/2 on [-1/2,1/2], with its sole zero at q=0; endpoint Newton quotients are exactly -L and +L. The quadratic is (s/L-1/4)(s/L-3/4); X at its roots is -L and L/2. Both crossing-family charts have cross-product norm at least A because their axial X derivative is 1 or 3; their root angles are at least atan(1/2) and atan(1/6). The disjoint tube's unit Z derivative and the graph's X/Z parameters likewise give regular charts. The side tube's phase-0 line z = a(1.5t+0.75) is at least 0.75a, and its phase-pi line z = a(1.5t-1.25) vanishes only at t = 5/6. Tolerances scale a 1e-12*L meeting gap by the inverse root slope, without fitting observed outputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a missed unique root, an unowned first root hiding an owned one, forward/reverse shares, both ordinate signs, nonzero phases, three scales, exact boundary roots, no crossing, point-only conversion, equal/external/nonfinite shares, a crossing only on another line than the declared phase, and invalid line counts. Actual f1 geometry and exhaustive/global intersection discovery remain outside this unit.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous synthetic CPU unit through --include construction_seed_search, with no Human generation, fixture, native artifact, host, foreign-method replacement or global patch.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The periodic part P(s,phi)=(s,A*sin(phi),f(s)+A*(1-cos(phi))) over a plane has one crossing at s=L/2 for f/L=q^3-5q/4, q=s/L-1/2. Its two...).
 */
export function test_construction_seed_search(): void {
  const failures: string[] = [];
  for (const length of [0.001, 1, 1000])
    for (const direction of [1, -1])
      for (const sign of [1, -1])
        for (const phase of [0, Math.PI / 3]) {
          for (const kind of ["cycle", "domain"] as const) {
            const reads: Reads = { host: 0, part: 0 };
            const part: IAutoMovieSolidSurface = tube(
              length,
              phase,
              sign,
              kind,
              reads,
            );
            const host: IAutoMovieSolidSurface = plane(length, 0, reads);
            const search: IAutoMovieConstructionSearchSeed = {
              type: "search",
              partFace: part.name,
              hostFace: host.name,
              phase,
              from: direction > 0 ? 0 : 1,
              to: direction > 0 ? 1 : 0,
            };
            const found: Seed | string = AutoMovieConstructionSeeds.create(
              search,
              part,
              [0, length],
              host,
              7,
              1e-12 * length,
            );
            const expected: number = length * (kind === "cycle" ? 0.5 : 0.75);
            meeting(
              failures,
              `${kind}/${length}/${direction}/${sign}/${phase}`,
              found,
              part,
              host,
              expected,
              phase,
              4e-12 * length,
            );
          }
        }

  const boundaryReads: Reads = { host: 0, part: 0 };
  const boundaryPart: IAutoMovieSolidSurface = tube(
    1,
    0,
    1,
    "boundary",
    boundaryReads,
  );
  const boundaryHost: IAutoMovieSolidSurface = plane(1, 0, boundaryReads);
  for (const direction of [1, -1]) {
    const search: IAutoMovieConstructionSearchSeed = {
      type: "search",
      partFace: boundaryPart.name,
      hostFace: boundaryHost.name,
      phase: 0,
      from: direction > 0 ? 0 : 1,
      to: direction > 0 ? 1 : 0,
    };
    meeting(
      failures,
      `boundary/${direction}`,
      AutoMovieConstructionSeeds.create(
        search,
        boundaryPart,
        [0, 1],
        boundaryHost,
        7,
        1e-12,
      ),
      boundaryPart,
      boundaryHost,
      direction > 0 ? 0 : 1,
      0,
      4e-12,
    );
  }

  const pointReads: Reads = { host: 0, part: 0 };
  const pointPart: IAutoMovieSolidSurface = tube(1, 0, 1, "cycle", pointReads);
  const pointHost: IAutoMovieSolidSurface = plane(1, 0, pointReads);
  const point: AutoMovieConstructionSeed = {
    type: "point",
    partFace: pointPart.name,
    hostFace: pointHost.name,
    part: [0.002, 0.25],
    host: [0.003, 0.5],
  };
  const converted: Seed | string = AutoMovieConstructionSeeds.create(
    point,
    pointPart,
    [0, 1],
    pointHost,
    7,
    1e-12,
  );
  if (typeof converted === "string")
    failures.push(`point conversion: ${converted}`);
  else {
    near(failures, "point part metre conversion", converted.s, 2, 0);
    near(failures, "point host metre conversion", converted.y, 3, 0);
    if (
      converted.phi !== 0.25 ||
      converted.theta !== 0.5 ||
      converted.face !== 7 ||
      pointReads.host !== 0 ||
      pointReads.part !== 0
    )
      failures.push(
        "point conversion changed phase/face or evaluated a surface",
      );
  }
  for (const shares of [
    [0.5, 0.5],
    [-0.1, 1],
    [0, 1.1],
    [NaN, 1],
    [0, Infinity],
  ] as [number, number][]) {
    const search: IAutoMovieConstructionSearchSeed = {
      type: "search",
      partFace: pointPart.name,
      hostFace: pointHost.name,
      phase: 0,
      from: shares[0],
      to: shares[1],
    };
    if (
      typeof AutoMovieConstructionSeeds.create(
        search,
        pointPart,
        [0, 1],
        pointHost,
        7,
        1e-12,
      ) !== "string"
    )
      failures.push(`invalid search shares accepted: ${shares}`);
  }
  if (pointReads.host !== 0 || pointReads.part !== 0)
    failures.push("invalid shares evaluated a surface before refusal");

  const separatedReads: Reads = { host: 0, part: 0 };
  const separatedPart: IAutoMovieSolidSurface = tube(
    1,
    0,
    1,
    "boundary",
    separatedReads,
  );
  const separatedHost: IAutoMovieSolidSurface = plane(1, 2, separatedReads);
  const separated: IAutoMovieConstructionSearchSeed = {
    type: "search",
    partFace: separatedPart.name,
    hostFace: separatedHost.name,
    phase: 0,
    from: 0,
    to: 1,
  };
  if (
    typeof AutoMovieConstructionSeeds.create(
      separated,
      separatedPart,
      [0, 0.5, 1],
      separatedHost,
      7,
      1e-12,
    ) !== "string"
  )
    failures.push("disjoint fixed-phase line returned a meeting");

  const coldReads: Reads = { host: 0, part: 0 };
  const coldPart: IAutoMovieSolidSurface = coldTube(coldReads);
  const coldHost: IAutoMovieSolidSurface = coldGraph(coldReads);
  const cold: IAutoMovieConstructionSearchSeed = {
    type: "search",
    partFace: coldPart.name,
    hostFace: coldHost.name,
    phase: 0,
    from: 0,
    to: 1,
  };
  if (
    typeof AutoMovieConstructionSeeds.create(
      cold,
      coldPart,
      [0, 0.25, 0.5, 0.75, 1],
      coldHost,
      7,
      1e-12,
    ) !== "string"
  )
    failures.push("disjoint polynomial graph returned a meeting");
  // 5. A tube over a plane whose top line (phase 0) stands above the plane over its whole length and whose bottom line (phase pi) crosses
  // it once: fixed at phase 0 the search must refuse; given two lines it must return the bottom line's crossing, with that phase.
  for (const length of [0.001, 1, 1000])
    for (const direction of [1, -1]) {
      const window: Reads = { host: 0, part: 0 };
      const part: IAutoMovieSolidSurface = sideTube(length, window);
      const host: IAutoMovieSolidSurface = plane(length, 0, window);
      const shares: Pick<IAutoMovieConstructionSearchSeed, "from" | "to"> = {
        from: direction > 0 ? 0 : 1,
        to: direction > 0 ? 1 : 0,
      };
      const fixed: Seed | string = AutoMovieConstructionSeeds.create(
        { type: "search", partFace: part.name, hostFace: host.name, phase: 0, ...shares },
        part,
        [0, length / 2, length],
        host,
        7,
        1e-12 * length,
      );
      if (typeof fixed !== "string")
        failures.push(`window/${length}/${direction}: the top line never crosses, yet a fixed phase-0 search returned ${JSON.stringify(fixed)}`);
      meeting(
        failures,
        `window/${length}/${direction}`,
        AutoMovieConstructionSeeds.create(
          { type: "search", partFace: part.name, hostFace: host.name, phase: 0, phases: 2, ...shares },
          part,
          [0, length / 2, length],
          host,
          7,
          1e-12 * length,
        ),
        part,
        host,
        (5 * length) / 6,
        Math.PI,
        4e-12 * length,
      );
    }
  for (const phases of [0, 1.5, -2, NaN]) {
    const part: IAutoMovieSolidSurface = sideTube(1, { host: 0, part: 0 });
    const host: IAutoMovieSolidSurface = plane(1, 0, { host: 0, part: 0 });
    // At phase pi the line itself crosses, so only the line count's refusal can return a string.
    if (typeof AutoMovieConstructionSeeds.create({ type: "search", partFace: part.name, hostFace: host.name, phase: Math.PI, phases, from: 0, to: 1 }, part, [0, 0.5, 1], host, 7, 1e-12) !== "string")
      failures.push(`invalid line count accepted: ${phases}`);
  }
  console.log("seed search authored callback observations", {
    separated: separatedReads,
    cold: coldReads,
  });
  TestValidator.predicate(
    `${failures.length} independent seed-search findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** A regular periodic tube; its selected meridian has an independent cubic, quadratic or endpoint-zero height. */
function tube(
  length: number,
  phase: number,
  sign: number,
  kind: "cycle" | "domain" | "boundary",
  reads: Reads,
): IAutoMovieSolidSurface {
  return {
    name: `analytic.${kind}`,
    domain: [0, length],
    period: 2 * Math.PI,
    orientation: sign > 0 ? -1 : 1,
    jet: (station: number, phi: number): IAutoMovieSolidSurface.IJet => {
      ++reads.part;
      const t: number = station / length;
      const q: number = t - 0.5;
      const x: number = kind === "domain" ? 3 * t - 1.75 : t;
      const firstX: number = kind === "domain" ? 3 : 1;
      const height: number =
        kind === "cycle"
          ? q ** 3 - 1.25 * q
          : kind === "domain"
            ? (t - 0.25) * (t - 0.75)
            : t * (1 - t);
      const first: number =
        kind === "cycle"
          ? 3 * q * q - 1.25
          : kind === "domain"
            ? 2 * t - 1
            : 1 - 2 * t;
      const second: number =
        kind === "cycle" ? 6 * q : kind === "domain" ? 2 : -2;
      const c: number = Math.cos(phi - phase);
      const s: number = Math.sin(phi - phase);
      const a: number = 0.01 * length;
      return {
        p: [length * x, a * s, sign * (length * height + a * (1 - c))],
        u: [firstX, 0, sign * first],
        v: [0, a * c, sign * a * s],
        uu: [0, 0, (sign * second) / length],
        uv: [0, 0, 0],
        vv: [0, -a * s, sign * a * c],
      };
    },
  };
}

/** A plane with physical X station and dimensionless transverse parameter, regular on its whole chart. */
function plane(
  length: number,
  height: number,
  reads: Reads,
): IAutoMovieSolidSurface {
  return {
    name: "analytic.plane",
    domain: [0, length],
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      ++reads.host;
      return {
        p: [u, length * v, height],
        u: [1, 0, 0],
        v: [0, length, 0],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      };
    },
  };
}

/**
 * A round tube of radius a = L/100 along X whose centre rises as c(t) = a (1.5 t - 0.25), t = s/L: its line at phase 0 is z = c + a >= 0.75 a,
 * above the plane z = 0 everywhere, and its line at phase pi is z = c - a = a (1.5 t - 1.25), which crosses the plane once, at t = 5/6.
 */
function sideTube(length: number, reads: Reads): IAutoMovieSolidSurface {
  const a: number = 0.01 * length;
  return {
    name: "analytic.side-tube",
    domain: [0, length],
    period: 2 * Math.PI,
    orientation: 1,
    jet: (station: number, phi: number): IAutoMovieSolidSurface.IJet => {
      ++reads.part;
      const t: number = station / length;
      const c: number = a * (1.5 * t - 0.25);
      return {
        p: [station, a * Math.sin(phi), c + a * Math.cos(phi)],
        u: [1, 0, (1.5 * a) / length],
        v: [0, a * Math.cos(phi), -a * Math.sin(phi)],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, -a * Math.sin(phi), -a * Math.cos(phi)],
      };
    },
  };
}

/** A regular tube's selected line is (0,0,s), disjoint from the graph whose X=0 ordinate is two. */
function coldTube(reads: Reads): IAutoMovieSolidSurface {
  return {
    name: "analytic.cold-tube",
    domain: [0, 1],
    period: 2 * Math.PI,
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      ++reads.part;
      return {
        p: [0.01 * (1 - Math.cos(v)), 0.01 * Math.sin(v), u],
        u: [0, 0, 1],
        v: [0.01 * Math.sin(v), 0.01 * Math.cos(v), 0],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0.01 * Math.cos(v), -0.01 * Math.sin(v), 0],
      };
    },
  };
}

/**
 * A regular graph with independently specified endpoint jets and a positive interior bump.
 *
 * The quintic has f(0)=f(1)=2, f'(0)=-1/2, f''(0)=-1/8 and f'(1)=f''(1)=0. Its Bezier controls [2,1.9,1.79375,2,2,2] bound its value below by 1.79375. For a target (0,0,v), the exact foot Newton equations cycle 0<->1 without the world-step bound acting. The nonnegative 4096*u^3*(1-u)^3 bump preserves those endpoint jets and contributes at least 3375/4096 at every interior 1/16 grid point, raising its ordinate above two. This exposes coarse-start work rather than an anatomical prior or an asserted bad-output contract.
 */
function coldGraph(reads: Reads): IAutoMovieSolidSurface {
  return {
    name: "analytic.cold-graph",
    domain: [0, 1],
    orientation: 1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => {
      ++reads.host;
      const f: number =
        2 -
        u / 2 -
        (u * u) / 16 +
        (51 * u ** 3) / 16 -
        (67 * u ** 4) / 16 +
        (25 * u ** 5) / 16 +
        4096 * u ** 3 * (1 - u) ** 3;
      const first: number =
        -0.5 -
        u / 8 +
        (153 * u * u) / 16 -
        (67 * u ** 3) / 4 +
        (125 * u ** 4) / 16 +
        12288 * u * u * (1 - u) ** 2 * (1 - 2 * u);
      const second: number =
        -0.125 +
        (153 * u) / 8 -
        (201 * u * u) / 4 +
        (125 * u ** 3) / 4 +
        24576 * u * (1 - u) * (1 - 5 * u + 5 * u * u);
      return {
        p: [u, f, v],
        u: [1, first, 0],
        v: [0, 0, 1],
        uu: [0, second, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      };
    },
  };
}

/** Check both the independent root and the returned physical meeting/domain, without treating search exhaustion as an absence certificate. */
function meeting(
  failures: string[],
  label: string,
  found: Seed | string,
  part: IAutoMovieSolidSurface,
  host: IAutoMovieSolidSurface,
  expected: number,
  phase: number,
  tolerance: number,
): void {
  if (typeof found === "string") {
    failures.push(`${label}: ${found}; expected owned crossing at ${expected}`);
    return;
  }
  near(failures, `${label} root`, found.s, expected, tolerance);
  const a: IAutoMovieSolidSurface.IJet = part.jet(found.s, found.phi);
  const b: IAutoMovieSolidSurface.IJet = host.jet(found.y, found.theta);
  const gap: number = Math.hypot(
    ...a.p.map((v: number, i: number): number => v - b.p[i]!),
  );
  near(failures, `${label} world gap`, gap, 0, tolerance);
  if (
    found.phi !== phase ||
    found.face !== 7 ||
    ![found.s, found.y, found.theta].every(Number.isFinite) ||
    (part.domain !== undefined &&
      !(found.s >= part.domain[0] && found.s <= part.domain[1])) ||
    (host.domain !== undefined &&
      !(found.y >= host.domain[0] && found.y <= host.domain[1]))
  )
    failures.push(
      `${label}: phase/face/nonfinite/domain premise failed: ${JSON.stringify(found)}`,
    );
}

/** Collect every finite absolute-error mismatch through the installed two-argument predicate API. */
function near(
  failures: string[],
  label: string,
  actual: number,
  expected: number,
  tolerance: number,
): void {
  try {
    TestValidator.predicate(label, nclose(actual, expected, tolerance));
  } catch {
    failures.push(
      `${label}: ${actual}, expected ${expected} within ${tolerance}`,
    );
  }
}

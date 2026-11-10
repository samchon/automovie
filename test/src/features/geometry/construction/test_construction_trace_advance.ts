import {
  type AutoMovieSolidIntersection,
  AutoMovieSolidTraceLaw,
  AutoMovieSolidTraceSolve,
  type IAutoMovieSolidAtlas,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** World position or derivative of one analytic chart. */
type V = [number, number, number];
/** The actual meeting point and its physical parameter rates. */
type Point = AutoMovieSolidIntersection.IPoint;
/** Exact surface map and its two derivative orders. */
type Jet = IAutoMovieSolidSurface.IJet;
/** Existing meeting tolerance; no test changes the solver's acceptance rule. */
const TOLERANCE: number = 1e-12;

/** Query-owned observations, reset after the actual initial meeting. */
interface Work {
  /** Total part/host jet requests after seed correction. */
  jets: number;
  /** Consecutive changes of the law's requested t for these phase fixtures. */
  candidates: number;
  /** Last observed law parameter, absent before the first candidate. */
  last: number | null;
  /** Requested candidate parameters, bounded by the independent callback guard. */
  parameters: number[];
  /** Seed correction is outside the measured advance. */
  active: boolean;
  /** An explicitly armed callback exception, including undefined or null. */
  failure: {
    /** The original thrown value, without conversion or wrapping. */ value: unknown;
  } | null;
}

/** One real solver input with independent analytic surface definitions. */
interface Problem {
  /** The caller-owned part whose jet requests are counted. */
  part: IAutoMovieSolidSurface;
  /** The caller-owned host charts and their actual crossing map. */
  host: IAutoMovieSolidAtlas;
  /** The unchanged phase law, with query-owned observation. */
  law: AutoMovieSolidTraceLaw.ILaw;
  /** A real initial meeting, obtained through the production solver. */
  from: Point;
  /** Observations retained only until this test completes. */
  work: Work;
}

/** A small observed-work record, without timing or heap claims. */
interface Reading {
  /** The independent scenario that owned these callbacks. */
  name: string;
  /** Observed candidate-t changes for this phase-law fixture. */
  candidates: number;
  /** Actual part/host jet requests, including rejected and polished readings. */
  jets: number;
}

/**
 * Continuation recovers through easier geometry and has a finite correction budget.
 *
 * Scenarios:
 * 1. A rational graph and a plane have the unique intersection
 *    (t,0,w*w/(w*w+t*t)). Three feature widths require local small steps
 *    without retaining that step through the remaining flat region; reverse
 *    continuation checks the same curve and its analytic derivatives.
 * 2. A reparameterized unit cylinder and a plane require respectively 512
 *    and 1024 accepted unit-angle steps under the retained quadratic predictor.
 *    The first fits the 1024-candidate product budget; the second spends that
 *    budget, including initial rejections, and returns null without a 1025th.
 * 3. A large representable parameter cannot admit a smaller progressing step;
 *    it fails before querying a rounded-back candidate, while a line at the
 *    same parameter advances normally. Equal targets retain identity without
 *    callbacks. Original thrown values and their request counts are preserved.
 * 4. A regular line crosses two actual plane charts and keeps its new face
 *    coordinates. A permanently rejected kept region returns null.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls real TraceSolve.solve/advance with analytic surface jets and the ordinary phase law, observing endpoint positions/derivatives, atlas ownership, null failures and callback work. A callback guard makes a broken unbounded implementation fail rather than hang. No foreign method or runtime is replaced.
 * @evidence contracts/development/testing.md#independent-expectations Intersecting A(s,t)=(t,s,1/(1+(t/w)^2)) with y=0 fixes the rational curve; its expanded derivatives provide tangent and curvature expectations. A unit circle's quadratic prediction has angle-one defect about 0.164 and allowance about 0.280, while angle two is rejected; the accepted step does not meet the one-eighth recovery threshold. Thus 512 steps plus 9 initial rejections fit 1024, while 1024 plus 10 do not. The budget is product policy, not a mathematical convergence guarantee. Point/derivative tolerances follow the existing intersection question, 1e-9 absolute and 1e-8 relative.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes forward/reverse local features, regular constant-curvature paths before/at budget exhaustion, no-op identity, representable-spacing failure beside valid large-parameter progress, thrown Error/undefined/null with one observed failing jet request, face crossing and an open/rejected atlas. Existing operator intersection/angle and construction arc tests own closed-loop publication, their physical curves and requested arc limitations. Candidate-t counts apply to these phase fixtures, not arbitrary callback implementations.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous CPU question owns its analytic callbacks and counters; seed acquisition is excluded from advance counts. An owned guard stops after 16384 jet requests so a broken implementation fails without hanging or changing production limits. No person, process, browser, target attachment, profile or wall-time/heap assertion is started.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A rational graph and a plane have the unique intersection).
 */
export function test_construction_trace_advance(): void {
  const failures: string[] = [];
  const readings: Reading[] = [];
  for (const width of [1 / 64, 1 / 1024, 1 / 16384]) {
    check(
      "localized graph " + width,
      (): void => {
        const problem: Problem = graph(width, 0);
        const point: Point = required(
          run(problem, 1, "graph " + width, readings),
        );
        graphPoint(point, 1, width);
        bounded(problem);
      },
      failures,
    );
  }
  check(
    "reverse graph",
    (): void => {
      const problem: Problem = graph(1 / 1024, 1);
      graphPoint(required(run(problem, 0, "reverse", readings)), 0, 1 / 1024);
      bounded(problem);
    },
    failures,
  );
  check(
    "before work limit",
    (): void => {
      const problem: Problem = circle(16384, 0);
      const point: Point = required(
        run(problem, 1 / 32, "before budget", readings),
      );
      vector(point.point, [Math.cos(512), Math.sin(512), 0], 1e-9);
      bounded(problem);
    },
    failures,
  );
  check(
    "work limit",
    (): void => {
      const problem: Problem = circle(32768, 0);
      if (run(problem, 1 / 32, "at budget", readings) !== null)
        throw new Error("An incomplete endpoint escaped the correction budget");
      if (problem.work.candidates !== 1024)
        throw new Error(
          "The regular circle did not spend exactly the product candidate budget",
        );
      bounded(problem);
    },
    failures,
  );
  check(
    "representable progress",
    (): void => {
      const start: number = 2 ** 53;
      const problem: Problem = circle(2, start);
      if (run(problem, start + 4, "representable spacing", readings) !== null)
        throw new Error("A rounded-back parameter was published");
      if (problem.work.parameters.some((t: number): boolean => t === start))
        throw new Error("A nonadvancing candidate reached the surface solver");
      bounded(problem);
    },
    failures,
  );
  check(
    "large progressing parameter",
    (): void => {
      const start: number = 2 ** 53;
      const problem: Problem = line(true, start);
      const point: Point = required(
        run(problem, start + 4, "large progressing parameter", readings),
      );
      if (point.t !== start + 4)
        throw new Error("A representable large target was rejected");
      vector(point.point, [4, 0, 0], 1e-9);
      bounded(problem);
    },
    failures,
  );
  check(
    "same target",
    (): void => {
      const problem: Problem = graph(1 / 64, 0);
      if (
        run(problem, 0, "same target", readings) !== problem.from ||
        problem.work.jets !== 0 ||
        problem.work.candidates !== 0
      )
        throw new Error("An equal target lost its no-op identity");
    },
    failures,
  );
  for (const value of [new Error("owned surface failure"), undefined, null]) {
    check(
      "original callback failure " + String(value),
      (): void => {
        const problem: Problem = graph(1 / 64, 0);
        problem.work.failure = { value };
        let failed: boolean = false;
        let caught: unknown;
        try {
          run(problem, 1, "callback failure", readings);
        } catch (error: unknown) {
          failed = true;
          caught = error;
        }
        if (
          !failed ||
          caught !== value ||
          problem.work.jets !== 1 ||
          problem.work.candidates !== 0
        )
          throw new Error(
            "The original callback failure or its observed request was replaced",
          );
      },
      failures,
    );
  }
  check(
    "atlas crossing",
    (): void => {
      const problem: Problem = line(true);
      const point: Point = required(
        run(problem, 1, "atlas crossing", readings),
      );
      vector(point.point, [1, 0, 0], 1e-9);
      if (point.face !== 1 || !nclose(point.y, 0.5, 1e-9))
        throw new Error("The crossing lost the receiver's chart");
    },
    failures,
  );
  check(
    "rejected atlas",
    (): void => {
      const problem: Problem = line(false);
      if (run(problem, 1, "rejected atlas", readings) !== null)
        throw new Error("An unavailable neighbour became a curve");
      bounded(problem);
    },
    failures,
  );
  console.log({
    traceAdvanceWork: readings,
    scope: "owned callback counts; no person or timing claim",
  });
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Collect every independent problem before reporting the complete question. */
function check(name: string, job: () => void, failures: string[]): void {
  try {
    job();
  } catch (error: unknown) {
    failures.push(
      name +
        ": " +
        (error instanceof Error
          ? (error.stack ?? error.message)
          : String(error)),
    );
  }
}

/** A successful endpoint must actually exist, rather than passing a null oracle. */
function required(point: Point | null): Point {
  if (point === null)
    throw new Error("The regular analytic curve did not reach its endpoint");
  return point;
}

/** Compare finite Cartesian values with absolute or component-relative error, keeping zero components strict. */
function vector(
  actual: V,
  expected: V,
  tolerance: number,
  relative: boolean = false,
): void {
  if (
    !actual.every((value: number, q: number): boolean =>
      nclose(
        value,
        expected[q]!,
        relative ? tolerance * Math.max(1, Math.abs(expected[q]!)) : tolerance,
      ),
    )
  )
    throw new Error(
      `Vector ${actual.join(",")} differs from ${expected.join(",")}`,
    );
}

/** Read the graph's closed form in expanded physical coordinates, not through its jet callback. */
function graphPoint(point: Point, target: number, width: number): void {
  const square: number = width * width;
  const denominator: number = square + target * target;
  const first: number = (-2 * square * target) / denominator ** 2;
  const second: number =
    (2 * square * (3 * target * target - square)) / denominator ** 3;
  if (point.t !== target)
    throw new Error("The endpoint parameter is incomplete");
  vector(point.point, [target, 0, square / denominator], 1e-9);
  vector(point.tangent, [1, 0, first], 1e-8, true);
  vector(point.second, [0, 0, second], 1e-8, true);
}

/** Observe actual callback work without asserting a host-dependent time or byte limit. */
function bounded(problem: Problem): void {
  if (problem.work.candidates > 1024 || problem.work.jets > 16384)
    throw new Error(
      "Continuation exceeded its independent callback-work budget",
    );
}

/** Record partial work even if the tested function preserves a callback exception. */
function run(
  problem: Problem,
  target: number,
  name: string,
  readings: Reading[],
): Point | null {
  try {
    return AutoMovieSolidTraceSolve.advance(
      problem.part,
      problem.host,
      problem.law,
      problem.from,
      target,
      TOLERANCE,
    );
  } finally {
    readings.push({
      name,
      candidates: problem.work.candidates,
      jets: problem.work.jets,
    });
  }
}

/** Exact C-infinity localized graph; the input jet uses a different normalized expression from its oracle. */
function graph(width: number, start: number): Problem {
  const part: IAutoMovieSolidSurface = {
    name: "rational graph",
    orientation: 1,
    jet: (s: number, t: number): Jet => {
      const x: number = t / width;
      const d: number = 1 + x * x;
      return {
        p: [t, s, 1 / d],
        u: [0, 1, 0],
        v: [1, 0, (-2 * x) / (width * d * d)],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, (2 * (3 * x * x - 1)) / (width * width * d ** 3)],
      };
    },
  };
  return made(
    part,
    {
      name: "plane atlas",
      faces: [plane(0)],
      kept: (): boolean => true,
      across: (): null => null,
    },
    start,
  );
}

/** A regular unit circle whose exact angular advance fixes predictor error independently of position. */
function circle(frequency: number, start: number): Problem {
  const part: IAutoMovieSolidSurface = {
    name: "angular cylinder",
    orientation: 1,
    period: (2 * Math.PI) / frequency,
    jet: (s: number, t: number): Jet => {
      const angle: number = frequency * (t - start);
      const c: number = Math.cos(angle);
      const a: number = Math.sin(angle);
      return {
        p: [c, a, s],
        u: [0, 0, 1],
        v: [-frequency * a, frequency * c, 0],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-frequency * frequency * c, -frequency * frequency * a, 0],
      };
    },
  };
  const host: IAutoMovieSolidSurface = {
    name: "z plane",
    orientation: 1,
    jet: (u: number, v: number): Jet => ({
      p: [u, v, 0],
      u: [1, 0, 0],
      v: [0, 1, 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
  return made(
    part,
    {
      name: "circle atlas",
      faces: [host],
      kept: (): boolean => true,
      across: (): null => null,
    },
    start,
  );
}

/** Two planes cover a straight intersection, or an intentionally unavailable continuation. */
function line(crossing: boolean, start: number = 0): Problem {
  const part: IAutoMovieSolidSurface = {
    name: "line plane",
    orientation: 1,
    jet: (s: number, t: number): Jet => ({
      p: [t - start, s, 0],
      u: [0, 1, 0],
      v: [1, 0, 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
  const host: IAutoMovieSolidAtlas = {
    name: "two planes",
    faces: [plane(0), plane(0.5)],
    kept: (face: number, u: number): boolean =>
      face === 0 ? u <= (crossing ? 0.5 : 0) : u >= 0,
    across: (
      _face: number,
      u: number,
      v: number,
    ): { face: number; u: number; v: number } | null =>
      crossing ? { face: 1, u: u - 0.5, v } : null,
  };
  return made(part, host, start);
}

/** A plane in y=0 with its own translated first coordinate. */
function plane(offset: number): IAutoMovieSolidSurface {
  return {
    name: "y plane " + offset,
    orientation: 1,
    jet: (u: number, v: number): Jet => ({
      p: [u + offset, 0, v],
      u: [1, 0, 0],
      v: [0, 0, 1],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
}

/** Construct owned observational callbacks around real analytic inputs, without patching any foreign object. */
function made(
  part: IAutoMovieSolidSurface,
  host: IAutoMovieSolidAtlas,
  start: number,
): Problem {
  const work: Work = {
    jets: 0,
    candidates: 0,
    last: null,
    parameters: [],
    active: false,
    failure: null,
  };
  const count: () => void = (): void => {
    if (!work.active) return;
    ++work.jets;
    if (work.failure !== null) throw work.failure.value;
    if (work.jets > 16384)
      throw new Error(
        "The owned analytic callback stopped an unbounded advance",
      );
  };
  const source: IAutoMovieSolidSurface = {
    ...part,
    jet: (u: number, v: number): Jet => {
      count();
      return part.jet(u, v);
    },
  };
  const atlas: IAutoMovieSolidAtlas = {
    ...host,
    faces: host.faces.map(
      (face: IAutoMovieSolidSurface): IAutoMovieSolidSurface => ({
        ...face,
        jet: (u: number, v: number): Jet => {
          count();
          return face.jet(u, v);
        },
      }),
    ),
  };
  const original: AutoMovieSolidTraceLaw.ILaw | null =
    AutoMovieSolidTraceLaw.of({ kind: "phase" });
  if (original === null)
    throw new Error("The actual phase law was unavailable");
  const law: AutoMovieSolidTraceLaw.ILaw = {
    ...original,
    g: (p: V, phi: number, t: number): number => {
      if (work.active && t !== work.last) {
        work.candidates++;
        work.last = t;
        work.parameters.push(t);
      }
      return original.g(p, phi, t);
    },
  };
  const from: Point | null = AutoMovieSolidTraceSolve.solve(
    source,
    atlas,
    law,
    start,
    [0, start, 0, 0],
    0,
    TOLERANCE,
  );
  if (from === null)
    throw new Error("The independent regular fixture had no initial meeting");
  work.active = true;
  return { part: source, host: atlas, law, from, work };
}

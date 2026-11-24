import { AutoMovieSolidIntersection as Intersection } from "@automovie/engine";
import type {
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** An actual open-neighbour request observed on the authored atlas. */
interface Crossing {
  face: number;
  u: number;
  v: number;
}

/**
 * A failed arc walk retains both actual directions and their last attempted
 * step.
 *
 * Scenarios:
 *
 * 1. A unit cylinder meets the plane y=0 in a circle. Keeping only the host strip
 *    |x|<=1e-9 leaves open arcs, so no closed intersection can be issued. The
 *    seed is regular and exact. The existing count8 stride is pi/4; even its
 *    24th halved attempt is outside this strip at tolerance1e-12.
 * 2. Both directions reach an actually observed open atlas neighbour. Each
 *    diagnostic retains its last accepted seed, attempted h/prediction/tangent
 *    and the same rejected host chart actually passed to across, rather than
 *    only the first direction's rounded point or an invented failure reason.
 * 3. The same complete plane keeps the circle and needs no failure context.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the existing public Intersection.trace on authored analytic surface/atlas inputs. The current string-only failure is a compiling behavioral RED; no new engine API, solver setting, foreign-method replacement, Human, mesh or renderer is needed. Both failure directions are checked before the aggregate verdict.
 * @evidence contracts/development/testing.md#independent-expectations A(s,phi)=(cos(phi),s,sin(phi)) and B(y,theta)=(y,0,theta) meet on the unit circle. Its regular seed at phi=pi/2 has tangent +/-X. The thin kept strip cannot contain that circle, and every first-step halving remains outside it. Captured actual across arguments independently identify the rejected host chart, while the plane/circle equations give part station0 and phase atan2(host.v,host.u); retained point/chart and h/prediction consistency are checked numerically, without a saved production output or copied solver computation.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a regular initial meeting from failed continuation, both directions, actual open-neighbour refusal from a generic null, last accepted versus last attempted coordinates, and the identical unrestricted passing plane. Existing trace-advance/owned-domain fixtures own work budgets, arbitrary callback exceptions and other domain/Jacobian failures.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU test discovered as construction_trace_failure_context, using only public in-memory operators and owned callbacks. The supervisor owns grouped RED/GREEN after the single shared watch; this test starts no process or checker. Counts are printed for RED/GREEN review of instrumentation's unchanged callback work.
 * @evidence contracts/development/common.md#meaningful-documentation Names the three scenarios, mm versus radian chart coordinates, actual rejected-neighbour observation, bounded diagnostic expectations and lack of a whole-domain or Human-shape claim.
 */
export function test_construction_trace_failure_context(): void {
  const failures: string[] = [];
  const crossings: Crossing[] = [];
  let partReads: number = 0;
  let hostReads: number = 0;
  const part: IAutoMovieSolidSurface = {
    name: "failure-cylinder",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [-1, 1],
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet {
      partReads++;
      return {
        p: [Math.cos(t), s, Math.sin(t)],
        u: [0, 1, 0],
        v: [-Math.sin(t), 0, Math.cos(t)],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-Math.cos(t), 0, -Math.sin(t)],
      };
    },
  };
  const plane: IAutoMovieSolidSurface = {
    name: "open-strip-host",
    orientation: 1,
    domain: [-2, 2],
    jet(y: number, theta: number): IAutoMovieSolidSurface.IJet {
      hostReads++;
      return {
        p: [y, 0, theta],
        u: [1, 0, 0],
        v: [0, 0, 1],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      };
    },
  };
  const host: IAutoMovieSolidAtlas = {
    name: "thin-open-strip",
    faces: [plane],
    kept: (_face: number, y: number, _theta: number): boolean =>
      Math.abs(y) <= 1e-9,
    across: (face: number, u: number, v: number): null => {
      crossings.push({ face, u, v });
      return null;
    },
  };
  const seed: IAutoMovieSolidIntersection.IInput["seed"] = {
    s: 0,
    phi: Math.PI / 2,
    y: Math.cos(Math.PI / 2),
    theta: 1,
    face: 0,
  };
  const result: IAutoMovieSolidIntersection.IResult = Intersection.trace({
    part,
    host,
    seed,
    parameter: { kind: "arc" },
    count: 8,
    tolerance: 1e-12,
    grazing: 0.01,
  });
  if (result.curve !== null)
    failures.push("an open kept strip published a closed circle");
  const failedPartReads: number = partReads;
  const failedHostReads: number = hostReads;
  const diagnostic: string =
    result.diagnostics.find(
      (d: { contract: string }): boolean => d.contract === "traced loop",
    )?.detail ?? "";
  if (!diagnostic.includes("lost after"))
    failures.push("the independent first-step failure changed stage");
  const marker: string = " | walkFailure=";
  const position: number = diagnostic.indexOf(marker);
  let context: unknown;
  if (position < 0)
    failures.push("actual forward/reverse walk failure context is unavailable");
  else {
    try {
      context = JSON.parse(diagnostic.slice(position + marker.length));
    } catch {
      failures.push("walk failure context is not readable structured evidence");
    }
  }
  if (field(context, "stage") !== "length-walk")
    failures.push("actual first length-walk stage missing");
  const rawDirections: unknown = field(context, "directions");
  const directions: readonly unknown[] = Array.isArray(rawDirections)
    ? rawDirections
    : [];
  if (directions.length !== 2)
    failures.push("both failed directions were not retained");
  for (const sense of [1, -1]) {
    const side: unknown = directions.find(
      (value: unknown): boolean => field(value, "sense") === sense,
    );
    const actualCrossings: Crossing[] = crossings.filter(
      (c: Crossing): boolean => sense * c.u > 0,
    );
    const actual: Crossing | undefined = actualCrossings.at(-1);
    if (actual === undefined) {
      failures.push(
        "actual open-neighbour counterpart missing for sense " + sense,
      );
      continue;
    }
    const last: unknown = field(side, "last");
    const step: unknown = field(side, "step");
    const solve: unknown = field(side, "solve");
    if (field(solve, "reason") !== "host-open-boundary")
      failures.push("actual open-boundary reason missing for sense " + sense);
    if (
      !vector(field(last, "chart"), [0, Math.PI / 2, seed.y, 1]) ||
      !vector(field(last, "point"), [seed.y, 0, 1]) ||
      field(last, "face") !== 0
    )
      failures.push("last accepted regular meeting lost for sense " + sense);
    if (
      !vector(field(solve, "chart"), [
        0,
        Math.atan2(actual.v, actual.u),
        actual.u,
        actual.v,
      ]) ||
      field(solve, "face") !== actual.face
    )
      failures.push(
        "last rejected native chart differs from actual across call for sense " +
          sense,
      );
    const h: unknown = field(step, "h");
    if (!(typeof h === "number" && h > 1e-9 && h < Math.PI / 4))
      failures.push(
        "last attempted positive halved step missing for sense " + sense,
      );
    else if (
      !vector(field(step, "predicted"), [seed.y + sense * h, 0, 1]) ||
      !vector(field(step, "tangent"), [sense, 0, 0])
    )
      failures.push("last step prediction/tangent lost for sense " + sense);
  }
  const complete: IAutoMovieSolidAtlas = {
    ...host,
    kept: (_face: number, _y: number, _theta: number): boolean => true,
    across: (_face: number, _u: number, _v: number): null => null,
  };
  const passed: IAutoMovieSolidIntersection.IResult = Intersection.trace({
    part,
    host: complete,
    seed,
    parameter: { kind: "arc" },
    count: 8,
    tolerance: 1e-12,
    grazing: 0.01,
  });
  if (passed.curve === null || passed.diagnostics.length !== 0)
    failures.push("unrestricted analytic circle counterpart failed");
  console.log({
    traceFailureWork: {
      partReads: failedPartReads,
      hostReads: failedHostReads,
      openNeighbourCalls: crossings.length,
    },
    scope: "existing rejected queries only; no Human or timing claim",
  });
  TestValidator.predicate(
    "actual walk failure context: " + failures.join(" | "),
    failures.length === 0,
  );
}

/** Read one diagnostic member without casting an unvalidated JSON object. */
function field(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return undefined;
  return Object.entries(value).find(
    ([name]: [string, unknown]): boolean => name === key,
  )?.[1];
}

/** Diagnostic vectors use the analytic fixture's mm/radian coordinates. */
function vector(value: unknown, expected: readonly number[]): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every(
      (component: unknown, index: number): boolean =>
        typeof component === "number" &&
        nclose(component, expected[index]!, 1e-10),
    )
  );
}

import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
  AutoMovieSolidChain,
  AutoMovieSolidMesh,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** All six world vectors in physical station mm and polar phase radians. */
type World = IAutoMovieSolidSurface.IJet;

/** The actual source axis's available second-order frame reading. */
type AxisJet = NonNullable<
  ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
>;

/**
 * Original local2 and actual axis2 share the kernel's existing world product rule.
 *
 * Scenarios:
 * 1. The circle r(s)=1+s*s moves on o=(s*s,s,s*s*s) while its plane rotates by s*s. Closed differentiation of that whole world map supplies all six independent vectors, including nonzero frame-second and mixed terms.
 * 2. The identical original part also goes through actual ViewLoft and SolidChain.surface. Its regular world jets agree without manufacturing a chain or sampling a replacement frame. Fresh outputs and unchanged original scalar records preserve ownership.
 * 3. Missing/null axis2, nonfinite frame data, a singular source pole, invalid query coordinates and world overflow produce explicit failures. Finite source values are not promoted into missing derivatives.
 * 4. The actual axis callback and a returned value getter throw their original Error object through the public query; numerical admission does not swallow foreign exceptions.
 * 5. A finite surface Point0 does not supply physical2 to the grid. Its explicit numeric admission refusal is named and atomic, while an actual source callback error still propagates by identity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public source/world reader and the real ViewLoft/SolidChain consumer, observing all p/u/v/uu/uv/vv fields, failures, fresh vectors and exception identity. No Human generation or synthetic proxy surface supplies the new result.
 * @evidence contracts/development/testing.md#independent-expectations Uses P=(s*s+r*cos(phi+s*s),s,s*s*s+r*sin(phi+s*s)), r=1+s*s and its explicit first/second partials. A 2e-9 absolute budget covers these unit-scale finite binary64 expressions; equality with the actual loft is separate wiring evidence, not its own numerical oracle or a global cap/domain certificate. A unit frame rotating at1e154 radians/mm has finite second-frame components1e308, while a constant radius4 makes its world second derivative overflow at station0.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers negative and cardinal phases, nonprincipal stations, changing frame speed and acceleration, complete source2 versus absent axis2/pole jets, malformed finite-data boundaries, overflow and foreign callback/getter identity. Existing source_field/conic_field own broader local scalar/shape cases; this question owns world lifting and its actual loft equivalence.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous CPU question under --include construction_source_world_jet. Uses one small original part and actual loft only; no person, process, viewer, profiler or GPU is created.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The circle r(s)=1+s*s moves on o=(s*s,s,s*s*s) while its plane rotates by s*s. Closed differentiation of that whole world map supplies all...).
 */
export function test_construction_source_world_jet(): void {
  const failures: string[] = [];
  const part: IAutoMovieViewPart = original();
  const source: AutoMovieLoftViewSource.ISource = prepare(part);
  const before: string = JSON.stringify(source);
  const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (loft.chain === null)
    throw new Error(
      `Unexpected actual loft failure: ${JSON.stringify(loft.diagnostics)}`,
    );
  const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(
    loft.chain,
  );
  if (surface === null)
    throw new Error("The actual regular loft has no surface.");

  for (const station of [0.125, 0.5, 0.875])
    for (const phase of [-0.31, 0, Math.PI / 2, 2.7, 4.9]) {
      const actual: World = read(source, part.axis, station, phase);
      compare(actual, expected(station, phase), "closed world map", failures);
      compare(actual, surface.jet(station, phase), "actual loft", failures);
    }
  const changed: World = read(source, part.axis, 0.5, 0.31);
  changed.p[0] = 1234;
  compare(
    read(source, part.axis, 0.5, 0.31),
    expected(0.5, 0.31),
    "fresh output",
    failures,
  );
  if (JSON.stringify(source) !== before)
    failures.push("World lifting rewrote the original scalar source.");

  refuse(
    AutoMovieLoftViewWorldJet(source, { at: part.axis.at }, 0.5, 0),
    "actual axis2",
    "missing axis2",
    failures,
  );
  refuse(
    AutoMovieLoftViewWorldJet(
      source,
      { at: part.axis.at, jet: (): null => null },
      0.5,
      0,
    ),
    "finite axis2",
    "null axis2",
    failures,
  );
  refuse(
    AutoMovieLoftViewWorldJet(source, part.axis, NaN, 0),
    "finite station and phase",
    "invalid station",
    failures,
  );
  refuse(
    AutoMovieLoftViewWorldJet(source, part.axis, 0.5, Infinity),
    "finite station and phase",
    "invalid phase",
    failures,
  );
  const invalid: AxisJet = frame(0.5);
  invalid.first.u[1] = NaN;
  refuse(
    AutoMovieLoftViewWorldJet(
      source,
      { at: part.axis.at, jet: (): AxisJet => invalid },
      0.5,
      0,
    ),
    "finite axis2",
    "nonfinite frame",
    failures,
  );
  const overflow: IAutoMovieViewPart = {
    ...part,
    axis: { at: (s: number): AxisJet["value"] => rapid(s).value, jet: rapid },
    front: { positive: constant(4), negative: constant(-4) },
    side: { positive: constant(4), negative: constant(-4) },
  };
  refuse(
    AutoMovieLoftViewWorldJet(prepare(overflow), overflow.axis, 0, 0),
    "world total2",
    "world overflow",
    failures,
  );

  const pole: IAutoMovieViewPart = {
    ...part,
    front: { positive: root(1), negative: root(-1) },
    side: { positive: root(1), negative: root(-1) },
    pole: "bottom",
  };
  refuse(
    AutoMovieLoftViewWorldJet(prepare(pole), pole.axis, 0, 0),
    "singular-pole",
    "source pole",
    failures,
  );

  const marker: Error = new Error("actual-axis-marker");
  let caught: unknown = null;
  try {
    AutoMovieLoftViewWorldJet(
      source,
      {
        at: part.axis.at,
        jet: (): never => {
          throw marker;
        },
      },
      0.5,
      0,
    );
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("The actual axis callback lost its Error identity.");
  const getter: AxisJet = frame(0.5);
  Object.defineProperty(getter, "value", {
    get: (): never => {
      throw marker;
    },
  });
  caught = null;
  try {
    AutoMovieLoftViewWorldJet(
      source,
      { at: part.axis.at, jet: (): AxisJet => getter },
      0.5,
      0,
    );
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("The returned frame getter lost its Error identity.");

  unavailableGrid(failures);
  TestValidator.predicate(
    `${failures.length} original world2 findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** A value-capable source still owes a regular physical jet before mesh planning. */
function unavailableGrid(failures: string[]): void {
  const numeric: Error = new AutoMovieLoftAdmissionError("owned missing axis2");
  const callback: Error = new Error("owned physical source callback");
  for (const error of [numeric, callback]) {
    const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    const before: string = JSON.stringify(mesh);
    const details: string[] = [];
    const surface: IAutoMovieSolidSurface = {
      name: "value-without-physical2",
      orientation: 1,
      point: (u: number, v: number): [number, number, number] => [u, v, 0],
      jet: (_u: number, _v: number): never => {
        throw error;
      },
    };
    let thrown: unknown;
    try {
      AutoMovieSolidMesh.face(mesh, {
        surface,
        stations: [0, 1],
        phases: [0, 1],
        loops: [],
        onFailure: (detail: string): void => {
          details.push(detail);
        },
      });
    } catch (caught: unknown) {
      thrown = caught;
    }
    if (error === numeric) {
      if (
        thrown !== undefined ||
        details.length !== 1 ||
        !details[0]!.includes("physical2: owned missing axis2")
      )
        failures.push("Unavailable grid physical2 lost its named admission.");
    } else if (thrown !== callback || details.length !== 0)
      failures.push("Grid admission swallowed an actual callback error.");
    if (JSON.stringify(mesh) !== before)
      failures.push("Unavailable grid physical2 published partial buffers.");
    if (!nclose(surface.point!(0.5, 0.25)[0], 0.5, 0))
      failures.push("Physical2 admission removed an available Point0.");
  }
}

/** Closed world partials derived directly from the complete circle/rotating-plane map. */
function expected(s: number, phi: number): World {
  const r: number = 1 + s * s;
  const first: number = 2 * s;
  const angle: number = phi + s * s;
  const c: number = Math.cos(angle);
  const z: number = Math.sin(angle);
  const a: number = 2 * s;
  return {
    p: [s * s + r * c, s, s * s * s + r * z],
    u: [2 * s + first * c - r * a * z, 1, 3 * s * s + first * z + r * a * c],
    v: [-r * z, 0, r * c],
    uu: [
      2 + 2 * c - 2 * first * a * z - r * a * a * c - 2 * r * z,
      0,
      6 * s + 2 * z + 2 * first * a * c - r * a * a * z + 2 * r * c,
    ],
    uv: [-first * z - r * a * c, 0, first * c - r * a * z],
    vv: [-r * c, 0, -r * z],
  };
}

/** Actual nonlinear axis value and physical derivatives, never a fitted layer table. */
function frame(s: number): AxisJet {
  const c: number = Math.cos(s * s);
  const z: number = Math.sin(s * s);
  const a: number = 2 * s;
  return {
    value: { origin: [s * s, s, s * s * s], u: [c, 0, z], v: [-z, 0, c] },
    first: {
      origin: [2 * s, 1, 3 * s * s],
      u: [-a * z, 0, a * c],
      v: [-a * c, 0, -a * z],
    },
    second: {
      origin: [2, 0, 6 * s],
      u: [-2 * z - a * a * c, 0, 2 * c - a * a * z],
      v: [-2 * c + a * a * z, 0, -2 * z - a * a * c],
    },
  };
}

/** An actual unit frame has finite source2 but its radius4 world product overflows. */
function rapid(s: number): AxisJet {
  const k: number = 1e154;
  const square: number = k * k;
  const c: number = Math.cos(k * s);
  const z: number = Math.sin(k * s);
  return {
    value: { origin: [0, s, 0], u: [c, 0, z], v: [-z, 0, c] },
    first: { origin: [0, 1, 0], u: [-k * z, 0, k * c], v: [-k * c, 0, -k * z] },
    second: {
      origin: [0, 0, 0],
      u: [-square * c, 0, -square * z],
      v: [square * z, 0, -square * c],
    },
  };
}

/** Authored scalar endpoint2 reproduces r(s)=1+s*s on a one-mm station interval. */
function original(): IAutoMovieViewPart {
  /** Four signs share the same original radius function, not emitted coefficients. */
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [0, 1].map(
      (s: number): IAutoMovieViewPart.IKnot => ({
        site: `radius.${s}`,
        station: s,
        value: sign * (1 + s * s),
        jet: { first: 2 * sign * s, second: 2 * sign },
      }),
    ),
  });
  return {
    name: "original-world2",
    axis: { at: (s: number): AxisJet["value"] => frame(s).value, jet: frame },
    stations: [0, 0.5, 1],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [
          { site: "start", station: 0, value: AutoMovieViewSection.ELLIPSE },
          { site: "end", station: 1, value: AutoMovieViewSection.ELLIPSE },
        ],
      },
    },
    order: 16,
    samples: 16,
  };
}

/** A two-knot root-coordinate outline defines sqrt(s), including the singular pole. */
function root(sign: number): IAutoMovieViewPart.IOutline {
  return {
    knots: [
      { site: "pole", station: 0, value: 0 },
      { site: "regular", station: 1, value: sign },
    ],
  };
}

/** A constant original scalar has exact zero physical station derivatives. */
function constant(value: number): IAutoMovieViewPart.IOutline {
  return {
    knots: [
      { site: "start", station: 0, value },
      { site: "end", station: 1, value },
    ],
  };
}

/** Explicit admission protects valid-case failures from being mistaken for expected refusal. */
function prepare(part: IAutoMovieViewPart): AutoMovieLoftViewSource.ISource {
  const out: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (out === null || out.source === null || out.diagnostics.length !== 0)
    throw new Error(`Unexpected source preparation: ${JSON.stringify(out)}`);
  return out.source;
}

/** Read a valid original field through the public world boundary. */
function read(
  source: AutoMovieLoftViewSource.ISource,
  axis: IAutoMovieViewPart["axis"],
  s: number,
  phi: number,
): World {
  const out: World | string = AutoMovieLoftViewWorldJet(source, axis, s, phi);
  if (typeof out === "string") throw new Error(out);
  return out;
}

/** Each negative input must retain its declared unavailable capability or numeric cause. */
function refuse(
  actual: World | string,
  cause: string,
  name: string,
  failures: string[],
): void {
  if (typeof actual !== "string" || !actual.includes(cause))
    failures.push(
      `${name}: ${typeof actual === "string" ? actual : "unexpected world jet"}`,
    );
}

/** All six finite world vectors use one absolute tolerance for these unit-scale fixtures. */
function compare(
  actual: World,
  expected: World,
  name: string,
  failures: string[],
): void {
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    for (let k: number = 0; k < 3; k++)
      if (!nclose(actual[key][k]!, expected[key][k]!, 2e-9))
        failures.push(
          `${name} ${key}[${k}]: ${actual[key][k]}, expected ${expected[key][k]}`,
        );
}

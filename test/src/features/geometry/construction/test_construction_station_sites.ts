import {
  type AutoMovieConstructionRealization,
  AutoMovieLoftChain,
  AutoMovieLoftViewSource,
  AutoMovieViewCurves,
  AutoMovieViewLoft,
  AutoMovieViewParallelAxis,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionNativeContinuation as Made } from "../../internal/construction/ConstructionNativeContinuation";
import { ConstructionShapes as Shapes } from "../../internal/construction/ConstructionShapes";
import { nclose } from "../../internal/nclose";

/** One owner label and its independent, deliberately missing declared station. */
type Fixture = readonly [string, IAutoMovieViewPart];

/** Exact binary station between the fixture's declared 0, 0.5 and 1 mm layers. */
const SITE: number = 0.375;

/**
 * Continuous native sources and girth waypoints have distinct emission contracts.
 *
 * Scenarios:
 * 1. All four edges, common shoulder/girth, all four top shoulders and every
 *    departure retain original values without a layer in direct native mode.
 *    Girth mode refuses missing declared knots; adding them admits the same field.
 * 2. All nine simultaneous missing edge/shoulder/departure sites are reported;
 *    a blank diagnostic label does not waive a girth waypoint obligation.
 * 3. Source curves and direct scalar sources remain readable after loft
 *    refusal. Both outside controls survive a regular partial domain, while
 *    implicit interpolation controls and actual axis knots require no layers.
 * 4. Declarative and evaluated-source construction leaves enforce the same
 *    mode-specific contract, and real zero-pole knots remain admitted.
 *
 * Independent values are r(s)=3+s+s^2, a circular perimeter 2*pi*r(s), a
 * constant ellipse shoulder sqrt(2)-1 and a straight/linear-origin axis.
 * An absolute 3e-9 mm allowance covers guide evaluation only; exact station
 * membership is a declaration premise, independent of geometry tolerance.
 * One portable CPU entry owns its synthetic inputs and starts no host.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual ViewLoft and both ingress paths, preserving continuous native values without extra rows and requiring named refusal for missing generic-girth waypoints. Original scalar sources remain readable; supplied waypoints then admit the same field.
 * @evidence contracts/development/testing.md#independent-expectations The fixture authors r(s)=3+s+s^2, the exact circle perimeter and constant ellipse shoulder. Points follow that polynomial and the actual linear-origin formula, with a fixed 3e-9 mm budget; exact station membership follows the declaration, not a mesh or sampled fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers four edges, both common owners, every top/departure quarter, nine simultaneous omissions, blank labels, outside controls, implicit/axis supports, declarative/evaluated ingress and actual zero poles. Existing parameter and continuation tests own singular-coordinate and shared-boundary details.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous construction_station_sites CPU entry owns synthetic data and no Human generation, external process, browser or GPU; its local collectors finish every case before the final predicate.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: All four edges, common shoulder/girth, all four top shoulders and every).
 */
export function test_construction_station_sites(): void {
  const failures: string[] = [];
  for (const [name, part] of fixtures()) {
    collect(name, failures, (): void => {
      source(part, failures);
      if (part.fullness.kind === "girth")
        rejected(AutoMovieViewLoft.create(part), name, failures);
      else admitted(part, SITE, 0, failures);
      part.stations = [...part.stations, SITE].sort(
        (a: number, b: number): number => a - b,
      );
      admitted(part, SITE, 0, failures);
    });
  }
  collect("all missing sites", failures, (): void => multiple(failures));
  collect("outside controls and axis supports", failures, (): void =>
    supports(failures),
  );
  collect("construction leaves and poles", failures, (): void =>
    consumers(failures),
  );
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Every independent case finishes before the owning entry reports the round. */
function collect(name: string, failures: string[], job: () => void): void {
  try {
    job();
  } catch (error: unknown) {
    failures.push(
      `${name}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
    );
  }
}

/** Original two-end declarations remain the owners of all input polynomials. */
function fixtures(): Fixture[] {
  const result: Fixture[] = [];
  for (let index: number = 0; index < 4; index++) {
    const part: IAutoMovieViewPart = Made.source(`sites.edge.${index}`, 32, 16);
    const [name, curve]: [string, IAutoMovieViewPart.IOutline] = [
      ["front positive", part.front.positive],
      ["front negative", part.front.negative],
      ["side positive", part.side.positive],
      ["side negative", part.side.negative],
    ][index] as [string, IAutoMovieViewPart.IOutline];
    const sign: number = index % 2 === 0 ? 1 : -1;
    insert(curve, name, sign * radius(SITE), sign * (1 + 2 * SITE), sign * 2);
    result.push([name, part]);
  }
  for (const kind of ["shoulder", "girth"] as const)
    for (const quarter of [undefined, 0, 1, 2, 3] as const) {
      const part: IAutoMovieViewPart = Made.source(
        `sites.${kind}.${quarter}`,
        32,
        16,
      );
      const common: IAutoMovieViewPart.IOutline =
        kind === "girth" ? girth() : constant(Math.SQRT2 - 1);
      const departures:
        | IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>
        | undefined =
        quarter === undefined
          ? undefined
          : [constant(0), constant(0), constant(0), constant(0)];
      part.fullness =
        kind === "girth"
          ? { kind, girth: common, departures }
          : { kind, shoulder: common, departures };
      const name: string =
        quarter === undefined ? kind : `departure ${quarter}`;
      const curve: IAutoMovieViewPart.IOutline =
        quarter === undefined ? common : departures![quarter]!;
      insert(
        curve,
        name,
        quarter !== undefined
          ? 0
          : kind === "girth"
            ? 2 * Math.PI * radius(SITE)
            : Math.SQRT2 - 1,
        quarter === undefined && kind === "girth"
          ? 2 * Math.PI * (1 + 2 * SITE)
          : 0,
        quarter === undefined && kind === "girth" ? 4 * Math.PI : 0,
      );
      result.push([name, part]);
    }
  for (let quarter: number = 0; quarter < 4; quarter++) {
    const part: IAutoMovieViewPart = Made.source(
      `sites.top.${quarter}`,
      32,
      16,
    );
    const shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> =
      [
        constant(Math.SQRT2 - 1),
        constant(Math.SQRT2 - 1),
        constant(Math.SQRT2 - 1),
        constant(Math.SQRT2 - 1),
      ];
    part.fullness = { kind: "top", shoulders };
    const name: string = `top shoulder ${quarter}`;
    insert(shoulders[quarter]!, name, Math.SQRT2 - 1, 0, 0);
    result.push([name, part]);
  }
  return result;
}

/** Author a real knot of the identical polynomial, never a sampled fit. */
function insert(
  curve: IAutoMovieViewPart.IOutline,
  site: string,
  value: number,
  first: number,
  second: number,
): void {
  curve.knots.splice(1, 0, {
    site,
    station: SITE,
    value,
    jet: { first, second },
  });
}

/** A constant original fullness/departure law has only its two declared end sites. */
function constant(value: number): IAutoMovieViewPart.IOutline {
  return {
    knots: [0, 1].map(
      (station: number): IAutoMovieViewPart.IKnot => ({
        site: `constant ${station}`,
        station,
        value,
      }),
    ),
  };
}

/** The exact circle perimeter owns girth independently of the section solver. */
function girth(): IAutoMovieViewPart.IOutline {
  return {
    knots: [0, 1].map(
      (station: number): IAutoMovieViewPart.IKnot => ({
        site: `tape ${station}`,
        station,
        value: 2 * Math.PI * radius(station),
        jet: { first: 2 * Math.PI * (1 + 2 * station), second: 4 * Math.PI },
      }),
    ),
  };
}

/** Four original signed curves and any direct scalar source survive row-policy refusal. */
function source(part: IAutoMovieViewPart, failures: string[]): void {
  const curves: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
  if (
    curves.diagnostics.length !== 0 ||
    curves.curves.some(
      (curve: AutoMovieViewCurves.ICurve): boolean => curve.outline === null,
    )
  )
    failures.push("A station-site refusal erased an admitted original curve.");
  for (const [index, curve] of curves.curves.entries()) {
    const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(
      curve,
      part.axis,
      SITE,
    );
    if (typeof read === "string") failures.push(read);
    else if (
      !nclose(
        read.scalar.value,
        (index % 2 === 0 ? 1 : -1) * radius(SITE),
        3e-9,
      )
    )
      failures.push("Original scalar changed to satisfy emission policy.");
  }
  const direct: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (direct !== null && direct.source === null)
    failures.push(
      `The original direct field was erased: ${JSON.stringify(direct.diagnostics)}`,
    );
}

/** No partial final chain/section/surface replaces a missing declared site. */
function rejected(
  loft: AutoMovieViewLoft.IResult,
  name: string,
  failures: string[],
): void {
  if (
    loft.chain !== null ||
    loft.surface !== null ||
    loft.sections.length !== 0
  )
    failures.push(`${name}: missing site still published a final loft.`);
  if (
    !loft.diagnostics.some(
      (diagnostic: AutoMovieViewLoft.IResult["diagnostics"][number]): boolean =>
        diagnostic.contract === "stations" &&
        diagnostic.detail.includes(name) &&
        diagnostic.detail.includes(String(SITE)),
    )
  )
    failures.push(`${name}: missing site lost its named station diagnostic.`);
}

/** The unchanged circle reaches its authored station with its actual axis origin. */
function admitted(
  part: IAutoMovieViewPart,
  station: number,
  originX: number,
  failures: string[],
): void {
  const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (
    loft.chain === null ||
    loft.surface === null ||
    loft.diagnostics.length !== 0
  )
    throw new Error(JSON.stringify(loft.diagnostics));
  const actual: number[] = AutoMovieLoftChain.point(loft.chain, station, 0);
  const expected: number[] = [originX + radius(station), station, 0];
  if (
    actual.some(
      (value: number, index: number): boolean =>
        !nclose(value, expected[index]!, 3e-9),
    )
  )
    failures.push(
      `Admitted original changed: ${actual}, expected ${expected}.`,
    );
  if (
    !loft.chain.layers.some(
      (layer: (typeof loft.chain.layers)[number]): boolean =>
        layer.y === station,
    ) &&
    part.stations.includes(station)
  )
    failures.push("The declared kept site has no actual principal row.");
}

/** One failure round retains every owner and does not infer semantics from site labels. */
function multiple(failures: string[]): void {
  const part: IAutoMovieViewPart = Made.source("sites.multiple", 32, 16);
  const required: [string, IAutoMovieViewPart.IOutline][] = [
    ["front positive", part.front.positive],
    ["front negative", part.front.negative],
    ["side positive", part.side.positive],
    ["side negative", part.side.negative],
  ];
  for (const [index, [name, curve]] of required.entries()) {
    const sign: number = index % 2 === 0 ? 1 : -1;
    insert(curve, name, sign * radius(SITE), sign * (1 + 2 * SITE), sign * 2);
  }
  const common: IAutoMovieViewPart.IOutline = girth();
  const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> =
    [constant(0), constant(0), constant(0), constant(0)];
  part.fullness = { kind: "girth", girth: common, departures };
  insert(
    common,
    "girth",
    2 * Math.PI * radius(SITE),
    2 * Math.PI * (1 + 2 * SITE),
    4 * Math.PI,
  );
  required.push(["girth", common]);
  departures.forEach((curve: IAutoMovieViewPart.IOutline, q: number): void => {
    insert(curve, `departure ${q}`, 0, 0, 0);
    required.push([`departure ${q}`, curve]);
  });
  const missing: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
  if (
    missing.diagnostics.filter(
      (diagnostic: AutoMovieViewLoft.IResult["diagnostics"][number]): boolean =>
        diagnostic.contract === "stations",
    ).length !== 9
  )
    failures.push(
      "One admission round did not collect all nine missing owners.",
    );
  for (const [name] of required) rejected(missing, name, failures);
  const blank: IAutoMovieViewPart = fixtures().find(
    ([name, input]: Fixture): boolean =>
      name === "girth" && input.fullness.kind === "girth",
  )![1];
  if (blank.fullness.kind !== "girth")
    throw new Error("Expected a girth fixture");
  blank.fullness.girth.knots[1]!.site = "";
  rejected(AutoMovieViewLoft.create(blank), "girth", failures);
}

/** Outside source knots and a distinct world-axis source do not declare contour layers. */
function supports(failures: string[]): void {
  const partial: IAutoMovieViewPart = Made.source("sites.partial", 32, 16);
  partial.stations = [0.25, 0.5, 0.75];
  admitted(partial, 0.5, 0, failures);
  const part: IAutoMovieViewPart = Made.source("sites.axis", 32, 16);
  const line: (slope: number) => IAutoMovieViewPart.IOutline = (
    slope: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [0, SITE, 1].map(
      (station: number): IAutoMovieViewPart.IKnot => ({
        site: `axis ${station}`,
        station,
        value: slope * station,
      }),
    ),
  });
  const axis: ReturnType<typeof AutoMovieViewParallelAxis.create> =
    AutoMovieViewParallelAxis.create(
      { x: line(2), y: line(1), z: line(0) },
      [1, 0, 0],
      [0, 0, 1],
    );
  if (typeof axis === "string") throw new Error(axis);
  part.axis = axis;
  admitted(part, SITE, 2 * SITE, failures);
  if (part.stations.includes(SITE))
    failures.push(
      "An axis or interpolation support silently inserted a layer.",
    );
  admitted(Made.source("sites.implicit", 32, 16), 0.2, 0, failures);
}

/** Both tree source ingress paths and real pole declarations share the same operator rule. */
function consumers(failures: string[]): void {
  const frame: Shapes.IFrame = {
    origin: { x: 0, y: 0, z: 0 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 1 },
  };
  const view: IAutoMovieConstructionView = Shapes.cylinder(
    "sites.ast",
    frame,
    0.003,
    0.001,
    3,
  );
  view.front.positive.knots.splice(1, 0, {
    site: "kept AST site",
    station: SITE / 1000,
    value: 0.003,
  });
  const declared: AutoMovieConstructionRealization.IWithoutSkin =
    realizeAutoMovieConstruction(
      { name: "sites.ast", root: view },
      { chord: 0.00005, skin: false },
    );
  const part: IAutoMovieViewPart = fixtures()[0]![1];
  const evaluated: AutoMovieConstructionRealization.IWithoutSkin =
    realizeAutoMovieConstruction(
      {
        name: "sites.source",
        root: { type: "source", name: part.name, source: "original" },
      },
      { chord: 0.00005, skin: false, sources: new Map([["original", part]]) },
    );
  for (const [index, result] of [declared, evaluated].entries()) {
    if (result.chains.length !== 1 || result.diagnostics.length !== 0)
      throw new Error(
        `A tree ingress rejected its continuous native original: ${JSON.stringify(result.diagnostics)}`,
      );
    const point: number[] = result.surfaces[0]!.point!(SITE, 0);
    if (!nclose(point[0]!, index === 0 ? 3 : radius(SITE), 3e-9))
      failures.push(
        "A native ingress lost its original between-row source value.",
      );
  }
  const pole: IAutoMovieConstructionView = Shapes.ellipsoid(
    "sites.poles",
    frame,
    0.003,
    0.003,
    0.002,
    9,
  );
  const closed: AutoMovieConstructionRealization.IWithoutSkin =
    realizeAutoMovieConstruction(
      { name: "sites.poles", root: pole },
      { chord: 0.00005, skin: false },
    );
  if (
    closed.chains.length !== 1 ||
    closed.diagnostics.length !== 0 ||
    closed.chains[0]!.pole === undefined ||
    closed.chains[0]!.opposite === undefined
  )
    failures.push(
      `Real zero pole knots were lost: ${JSON.stringify(closed.diagnostics)}`,
    );
}

/** The independently authored quadratic radius, in millimetres. */
function radius(station: number): number {
  return 3 + station + station * station;
}

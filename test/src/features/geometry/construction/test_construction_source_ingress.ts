import {
  type AutoMovieConstructionRealization,
  AutoMovieConstructionViews,
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionSource,
  IAutoMovieConstructionView,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { ConstructionSourceIngress } from "../../internal/construction/ConstructionSourceIngress";
import { nclose } from "../../internal/nclose";

/** A complete caller-owned source context; its parts are already in kernel mm. */
type Sources = ReadonlyMap<string, IAutoMovieViewPart>;

/** Operator records without final face tessellation. */
type Realization = AutoMovieConstructionRealization.IWithoutSkin;

/**
 * Explicit source leaves preserve their whole generating input through realization.
 *
 * Scenarios:
 * 1. Five principal samples miss a shared parent's sine course. Child world points and every available total2 component at interior stations retain that course and its own exact quintic border/scalars.
 * 2. Ellipse guides and variable-fullness square diagonals agree with independent closed forms, including physical station/mixed derivatives.
 * 3. Equal-value leaf copies and alternating invocation contexts change only with the supplied parent definition; clearing a completed call's map does not change returned source-owned geometry.
 * 4. Explicit-source merge and diff traverse the ordinary engine operators, retain a seam on both analytic operands and preserve cutter orientation.
 * 5. Missing, mismatched and initially/grid-throwing sources are named source diagnostics. An unavailable physical jet remains unavailable, and a missing nested source rolls its failed outer part subtree back to the host's own state.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls realizeAutoMovieConstruction with explicit source leaves and reads its actual point, Jet, surface, join and rollback outputs; ingress pointer identity alone is never the geometric assertion.
 * @evidence contracts/development/testing.md#independent-expectations The shared origin is amplitude*sin(pi*s/5), invisible at stations0,10,20,30,40. Source q=s/40 quintics carry exact normalized endpoint jets. Ellipse-guide and square-diagonal jets follow their closed conic equations; merge/diff seams satisfy the cylinders' or spheres' implicit equations. Missing-source rollback preserves only the structurally retained host.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two parent amplitudes, direct and variable fullness, seven off-layer stations, value-copy leaves, released call maps, ordinary source-free views, both Boolean keeps, absent/mismatched/throwing sources and nested failure atomicity. General loft/cap/Boolean accuracy remains with their existing operator questions.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous CPU unit reached by --include construction_source_ingress; synthetic generating definitions only, with no person generation, process, browser, GPU or registry mutation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Five principal samples miss a shared parent's sine course. Child world points and every available total2 component at interior stations...).
 */
export function test_construction_source_ingress(): void {
  const failures: string[] = [];
  const leaf: IAutoMovieConstructionSource = {
    type: "source",
    name: "child",
    source: "field.child",
  };
  for (const variable of [false, true])
    for (const amplitude of [1, 2, 1]) {
      const family: ReturnType<typeof ConstructionSourceIngress.family> =
        ConstructionSourceIngress.family(amplitude, variable);
      const sources: Map<string, IAutoMovieViewPart> = new Map([
        ["field.parent", family.parent],
        ["field.child", family.child],
      ]);
      const actual: Realization = realize({ ...leaf }, sources);
      if (actual.diagnostics.length !== 0) {
        failures.push(
          `whole field ${amplitude}/${variable}: ${JSON.stringify(actual.diagnostics)}`,
        );
        continue;
      }
      const chain: IAutoMovieLoftChain | undefined = actual.chains[0];
      const surface: (typeof actual.surfaces)[number] | undefined =
        actual.surfaces[0];
      if (chain === undefined || surface === undefined) {
        failures.push("a valid complete source produced no chain/surface");
        continue;
      }

      // Completed realization retains the actual function owners, not later map lookup.
      sources.clear();
      const phi: number = variable ? Math.PI / 4 : 0;
      for (const s of [2.5, 5, 7.25, 12.5, 22.5, 32.5, 37.25]) {
        const expected: AutoMovieLoftJet.IJet =
          ConstructionSourceIngress.expected(amplitude, s, variable);
        const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(chain, s, phi);
        for (const order of ["p", "s", "t", "ss", "st", "tt"] as const)
          close(
            failures,
            `${amplitude}/${variable}/${s}/${order}`,
            jet[order],
            expected[order],
          );
        close(
          failures,
          `point ${amplitude}/${variable}/${s}`,
          AutoMovieLoftChain.point(chain, s, phi),
          expected.p,
        );
        const read: ReturnType<typeof surface.jet> = surface.jet(s, phi);
        for (const [from, to] of [
          ["p", "p"],
          ["u", "s"],
          ["v", "t"],
          ["uu", "ss"],
          ["uv", "st"],
          ["vv", "tt"],
        ] as const)
          close(
            failures,
            `surface ${amplitude}/${variable}/${s}/${from}`,
            read[from],
            expected[to],
          );
      }
    }

  // Both ordinary Boolean operations consume source leaves through their normal path.
  for (const kind of ["merge", "diff"] as const) booleanSources(kind, failures);
  failuresOfSources(leaf, failures);
  TestValidator.predicate(
    `source ingress: ${failures.join("\n")}`,
    failures.length === 0,
  );
}

/** Read the ordinary unskinned product seam with this invocation's explicit context. */
function realize(
  root: AutoMovieConstructionNode,
  sources: Sources,
): Realization {
  return realizeAutoMovieConstruction(
    { name: "source.ingress", root },
    { chord: 1e-4, skin: false, sources },
  );
}

/** Compare finite world tuples to independent formulas with an absolute mm-derived budget. */
function close(
  failures: string[],
  label: string,
  actual: readonly number[],
  expected: readonly number[],
): void {
  if (
    actual.length !== expected.length ||
    !actual.every((value: number, k: number): boolean =>
      nclose(value, expected[k]!, 2e-9),
    )
  )
    failures.push(`${label}: [${actual.join(",")}] != [${expected.join(",")}]`);
}

/** Resolve an existing declarative analytic operand only when constructing this fixture. */
function input(view: IAutoMovieConstructionView): IAutoMovieViewPart {
  const part: IAutoMovieViewPart | string =
    AutoMovieConstructionViews.part(view);
  if (typeof part === "string") throw new Error(part);
  return part;
}

/** Keep the AST source key distinct from the face name and pass no pre-lofted geometry. */
function source(
  part: IAutoMovieViewPart,
  key: string,
): IAutoMovieConstructionSource {
  return { type: "source", name: part.name, source: key };
}

/** Ordinary merge/diff fixture whose source operands have independent implicit equations. */
function booleanSources(kind: "merge" | "diff", failures: string[]): void {
  const merge: boolean = kind === "merge";
  const hostView: IAutoMovieConstructionView = merge
    ? ConstructionShapes.cylinder(
        "beam",
        {
          origin: { x: -0.1, y: 0, z: 0 },
          u: { x: 0, y: 0, z: 1 },
          v: { x: 0, y: 1, z: 0 },
        },
        0.03,
        0.2,
      )
    : ConstructionShapes.ellipsoid(
        "ball",
        ConstructionShapes.DOWN,
        0.04,
        0.04,
        0.04,
      );
  const partView: IAutoMovieConstructionView = merge
    ? ConstructionShapes.cylinder(
        "post",
        {
          origin: { x: 0, y: 0, z: 0 },
          u: { x: 0, y: 1, z: 0 },
          v: { x: 1, y: 0, z: 0 },
        },
        0.015,
        0.08,
      )
    : ConstructionShapes.ellipsoid(
        "dimple",
        {
          origin: { x: 0.04, y: 0, z: 0 },
          u: { x: 1, y: 0, z: 0 },
          v: { x: 0, y: 1, z: 0 },
        },
        0.015,
        0.015,
        0.015,
      );
  const host: IAutoMovieViewPart = input(hostView);
  const part: IAutoMovieViewPart = input(partView);
  const plane: number = (0.04 ** 2 - 0.015 ** 2 + 0.04 ** 2) / 0.08;
  const ring: number = Math.sqrt(0.04 ** 2 - plane ** 2);
  const tree: AutoMovieConstructionNode = ConstructionShapes.join(
    kind,
    `join.${kind}`,
    source(host, "host"),
    source(part, "part"),
    {
      partFace: part.name,
      hostFace: host.name,
      part: merge ? [0.031, Math.PI / 2] : [-ring + 0.0005, Math.PI],
      host: merge ? [0.115, 0.01] : [-ring + 0.0005, 0.01],
    },
    {
      part: { type: "chord", value: merge ? 0.006 : 0.002 },
      host: { type: "chord", value: merge ? 0.006 : 0.002 },
    },
    merge
      ? { type: "phase" }
      : {
          type: "angle",
          centre: { x: plane, y: 0, z: 0 },
          normal: { x: 1, y: 0, z: 0 },
          reference: { x: 0, y: 0, z: 1 },
        },
  );
  const real: Realization = realize(
    tree,
    new Map([
      ["host", host],
      ["part", part],
    ]),
  );
  if (real.diagnostics.length !== 0 || real.joins.length !== 1) {
    failures.push(`${kind} source leaves: ${JSON.stringify(real.diagnostics)}`);
    return;
  }
  const bound: number = merge
    ? 1e-7
    : 1000 *
      (ConstructionChecks.poleSpline(0.04, 0.04, hostView.stations) +
        ConstructionChecks.polarSpline(0.04, 0.04, hostView.order) +
        ConstructionChecks.poleSpline(0.015, 0.015, partView.stations) +
        ConstructionChecks.polarSpline(0.015, 0.015, partView.order));
  for (const point of real.joins[0]!.join.curve.points) {
    const [x, y, z]: readonly number[] = point.point;
    const hostResidual: number = merge
      ? Math.hypot(y!, z!) - 30
      : Math.hypot(x!, y!, z!) - 40;
    const partResidual: number = merge
      ? Math.hypot(x!, y!) - 15
      : Math.hypot(x! - 40, y!, z!) - 15;
    if (!(Math.abs(hostResidual) <= bound && Math.abs(partResidual) <= bound))
      failures.push(`${kind}: seam leaves its analytic operands`);
  }
  if (
    (real.body.faces.find(
      (face: (typeof real.body.faces)[number]): boolean =>
        face.chain === part.name,
    )?.inverted ===
      true) !==
    !merge
  )
    failures.push(
      `${kind}: cutter orientation does not match its declared keep`,
    );
}

/** Missing inputs and callback failures are named, with no fallback or partial subtree. */
function failuresOfSources(
  leaf: IAutoMovieConstructionSource,
  failures: string[],
): void {
  const family: ReturnType<typeof ConstructionSourceIngress.family> =
    ConstructionSourceIngress.family(1, false);
  const throwing: IAutoMovieViewPart = {
    ...family.child,
    axis: {
      at: (): never => {
        throw new Error("source callback failure");
      },
    },
  };

  // Principal stations and the middle anchor are valid; only the first grid midpoint fails.
  const gridThrowing: IAutoMovieViewPart = {
    ...family.child,
    axis: {
      at: (s: number): ReturnType<IAutoMovieViewPart["axis"]["at"]> => {
        if (s === 5) throw new Error("source grid callback failure");
        return family.child.axis.at(s);
      },
      jet: (
        s: number,
      ): ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> => {
        if (s === 5) throw new Error("source grid callback failure");
        return family.child.axis.jet!(s);
      },
    },
  };
  const cases: Sources[] = [
    new Map(),
    new Map([[leaf.source, { ...family.child, name: "other" }]]),
    new Map([[leaf.source, throwing]]),
    new Map([[leaf.source, gridThrowing]]),
  ];
  for (const context of cases) {
    const result: Realization = realize(leaf, context);
    if (
      result.chains.length !== 0 ||
      result.surfaces.length !== 0 ||
      !result.diagnostics.some(
        (d: (typeof result.diagnostics)[number]): boolean =>
          d.node === leaf.name && d.contract === "source",
      )
    )
      failures.push(
        "an absent/mismatched/throwing source was not a named failed leaf",
      );
  }

  // A finite source value does not authorize fabricated physical frame derivatives.
  const unavailable: IAutoMovieViewPart = {
    ...family.child,
    axis: { at: family.child.axis.at, jet: (): null => null },
  };
  const bare: ReturnType<typeof AutoMovieViewLoft.create> =
    AutoMovieViewLoft.create(unavailable);
  if (bare.chain === null)
    failures.push("an unavailable physical jet erased the finite bare source");
  else
    close(
      failures,
      "finite source0 without physical2",
      AutoMovieLoftChain.point(bare.chain, 2.5, 0),
      ConstructionSourceIngress.expected(1, 2.5, false).p,
    );
  const missingJet: Realization = realize(
    leaf,
    new Map([[leaf.source, unavailable]]),
  );
  if (
    missingJet.surfaces.length !== 0 ||
    !missingJet.diagnostics.some(
      (d: (typeof missingJet.diagnostics)[number]): boolean =>
        d.contract === "surface",
    )
  )
    failures.push("an unavailable source jet became a regular surface");

  const beamView: IAutoMovieConstructionView = ConstructionShapes.cylinder(
    "beam",
    {
      origin: { x: -0.1, y: 0, z: 0 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    },
    0.03,
    0.2,
  );
  const beam: IAutoMovieViewPart = input(beamView);
  const ordinary: Realization = realize(beamView, new Map());
  if (ordinary.diagnostics.length !== 0 || ordinary.chains[0] === undefined)
    failures.push("an ordinary view acquired a source-context requirement");
  else
    close(
      failures,
      "ordinary metre view",
      AutoMovieLoftChain.point(ordinary.chains[0], 100, 0),
      [0, 0, 30],
    );
  const post: IAutoMovieViewPart = input(
    ConstructionShapes.cylinder(
      "post",
      {
        origin: { x: 0, y: 0, z: 0 },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      0.015,
      0.08,
    ),
  );
  const absent: IAutoMovieConstructionSource = {
    type: "source",
    name: "absent",
    source: "absent",
  };
  const widths: IAutoMovieConstructionJoin["partWidth"] = {
    type: "chord",
    value: 0.002,
  };
  const inner: AutoMovieConstructionNode = ConstructionShapes.join(
    "merge",
    "inner",
    source(post, "post"),
    absent,
    { partFace: "absent", hostFace: "post", part: [0, 0], host: [0, 0] },
    { part: widths, host: widths },
  );
  const outer: AutoMovieConstructionNode = ConstructionShapes.join(
    "merge",
    "outer",
    source(beam, "beam"),
    inner,
    { partFace: "absent", hostFace: "beam", part: [0, 0], host: [0, 0] },
    { part: widths, host: widths },
  );
  const context: Sources = new Map([
    ["beam", beam],
    ["post", post],
  ]);
  const alone: Realization = realize(source(beam, "beam"), context);
  const broken: Realization = realize(outer, context);
  if (
    broken.chains
      .map((chain: IAutoMovieLoftChain): string => chain.name)
      .join(",") !== "beam" ||
    broken.surfaces.length !== alone.surfaces.length ||
    broken.body.faces.length !== alone.body.faces.length ||
    broken.body.points.length !== alone.body.points.length ||
    broken.joins.length !== 0
  )
    failures.push("a missing nested source retained part-subtree state");
  if (
    !broken.diagnostics.some(
      (d: (typeof broken.diagnostics)[number]): boolean =>
        d.node === "absent" && d.contract === "source",
    )
  )
    failures.push("the missing nested source lost its source diagnostic");
}

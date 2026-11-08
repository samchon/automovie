import {
  AutoMovieConstructionContinuation,
  type AutoMovieConstructionRealization,
  AutoMovieConstructionSeeds,
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieSolidIntersection,
  AutoMovieSolidMesh,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  AutoMovieViewParameter,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionOwnedAtlas } from "../../internal/construction/ConstructionOwnedAtlas";
import { nclose } from "../../internal/nclose";

/**
 * Owned original caps and feasible solver trials share one actual map.
 *
 * Scenarios:
 * 1. A source P(s,phi)=(sqrt(s)cos(phi),s,sqrt(s)sin(phi)) retains a bottom tip at0 and principal rows at1 and4. Positive cap points, all six world derivatives and a whole cap/plane intersection are checked against closed formulas below the first principal row.
 * 2. Truezero supplies its actual Point0 at every phase while physical2 is unavailable. Equal-value copies and nine-station cache eviction preserve held readers; clipped/stale end ownership fails rather than reviving source.domain.
 * 3. A value-only original axis preserves cap Point0 without inventing physical2, and actual axis callback errors retain identity.
 * 4. Bounded synthetic surfaces count outside callbacks. Initial/Newton/polish/Foot paths refuse exterior evaluation; an independent circle and its radius0.55 outward rail cross two bounded plane charts in both directions, including either side of the exact rail boundary. Invalid open-boundary intersections remain null.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises actual ViewLoft to Chain.point/sampler/Jet/Solid.surface, then public Intersection/TraceSolve/Foot consumers; neither a retained pointer alone nor a lower scalar reader supplies success.
 * @evidence contracts/testing.md#independent-expectations The paraboloid follows two linear root-coordinate knots; sqrt(s) differentiates to1/(2sqrt(s)) and-1/(4s^(3/2)), and y=1/4 meets it in the radius1/2 circle. Atlas planes X=u and X=1+u atY=0 meet the cylinder in(1+.3cos(phi),0,.3sin(phi)); shifted centres0.85/1.15 have exact chord0.25 outward rails at radius0.55. Bounded polynomial jets are written directly. The2e-8 mm component allowance covers shared binary64 native arithmetic without changing production tolerances.
 * @evidence contracts/testing.md#distinguishing-cases Separates principal bounds from retained cap ownership, actual value from unavailable physical2, positive cap intersections from outside-domain refusal, equal copies/held samplers/eviction, clipped or rewritten ownership, missing axis2 and callback-error identity. No global cap regularity or nearest-point certificate is asserted.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous CPU question under construction_owned_domain uses synthetic original parts and public operators; no Human generation, viewer, GPU, persistent cache or background process is created.
 */
export function test_construction_owned_domain(): void {
  const failures: string[] = [];
  const original: IAutoMovieViewPart = cap();
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(original);
  if (result.chain === null || result.surface === null)
    throw new Error(JSON.stringify(result.diagnostics));
  const chain: IAutoMovieLoftChain = result.chain;
  const surface: IAutoMovieSolidSurface = result.surface;
  if (
    chain.layers[0]!.y !== 1 ||
    surface.domain?.[0] !== 0 ||
    chain.pole?.source?.station !== 0
  )
    failures.push(
      "The retained original cap did not own its actual tip-to-row interval.",
    );
  const held: ReturnType<typeof AutoMovieLoftChain.sampler> =
    AutoMovieLoftChain.sampler(chain, 0.25);
  const phaseOnly: ReturnType<
    ReturnType<typeof AutoMovieLoftChain.phaseSampler>
  > = AutoMovieLoftChain.phaseSampler(chain, 0.25)(0.7);
  close(
    phaseOnly.p,
    [0.5 * Math.cos(0.7), 0.25, 0.5 * Math.sin(0.7)],
    "cap phase-only value",
    failures,
  );
  close(
    phaseOnly.t,
    [-0.5 * Math.sin(0.7), 0, 0.5 * Math.cos(0.7)],
    "cap phase-only tangent",
    failures,
  );
  for (const s of [0.015625, 0.0625, 0.125, 0.25, 0.5, 0.875])
    for (const phi of [-0.31, 0, 0.7, Math.PI / 2, 3.8]) {
      const r: number = Math.sqrt(s);
      const c: number = Math.cos(phi);
      const t: number = Math.sin(phi);
      const expected: IAutoMovieSolidSurface.IJet = {
        p: [r * c, s, r * t],
        u: [c / (2 * r), 1, t / (2 * r)],
        v: [-r * t, 0, r * c],
        uu: [-c / (4 * r ** 3), 0, -t / (4 * r ** 3)],
        uv: [-t / (2 * r), 0, c / (2 * r)],
        vv: [-r * c, 0, -r * t],
      };
      close(
        AutoMovieLoftChain.point(chain, s, phi),
        expected.p,
        `point ${s}/${phi}`,
        failures,
      );
      const actual: IAutoMovieSolidSurface.IJet = surface.jet(s, phi);
      for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
        close(actual[key], expected[key], `${key} ${s}/${phi}`, failures);
    }
  for (const phi of [-0.2, 0, 1.2, 4.8])
    close(surface.point!(0, phi), [0, 0, 0], "actual collapsed tip", failures);
  if (!throws((): unknown => surface.jet(0, 0)))
    failures.push("Collapsed pole physical2 was fabricated.");
  const mesh: AutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  const apex: number = AutoMovieSolidMesh.vertex(
    mesh,
    surface.point!(0, 0),
    owner,
    0,
    0,
  );
  close(
    AutoMovieSolidMesh.evaluate(mesh, apex),
    [0, 0, 0],
    "actual mesh pole replay without physical2",
    failures,
  );
  if (
    !throws((): unknown => surface.jet(-0.01, 0)) ||
    !throws((): unknown => surface.point!(-0.01, 0))
  )
    failures.push("An outside Taylor map survived.");

  const copied: IAutoMovieLoftChain = {
    ...chain,
    layers: chain.layers.map(
      (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...l,
        coefficients: [...l.coefficients],
        slopes: [...l.slopes],
        curvatures: l.curvatures === undefined ? undefined : [...l.curvatures],
      }),
    ),
  };
  close(
    AutoMovieLoftChain.point(copied, 0.25, 0.7),
    [0.5 * Math.cos(0.7), 0.25, 0.5 * Math.sin(0.7)],
    "equal numeric copy",
    failures,
  );
  for (let i: number = 1; i <= 9; i++)
    AutoMovieLoftChain.point(chain, i / 20, 0.3);
  close(
    held(0.7),
    [0.5 * Math.cos(0.7), 0.25, 0.5 * Math.sin(0.7)],
    "held sampler after eviction",
    failures,
  );
  const clipped: IAutoMovieLoftChain = {
    ...chain,
    layers: chain.layers.slice(1),
  };
  if (!throws((): unknown => AutoMovieLoftChain.point(clipped, 0.25, 0)))
    failures.push("A clipped end was revived from the original scalar domain.");
  const rewritten: IAutoMovieLoftChain = {
    ...copied,
    layers: copied.layers.map(
      (l: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...l,
        frame:
          l.frame === undefined
            ? undefined
            : {
                ...l.frame,
                origin: [
                  l.frame.origin[0] + 1,
                  l.frame.origin[1],
                  l.frame.origin[2],
                ],
              },
      }),
    ),
  };
  if (!throws((): unknown => AutoMovieLoftChain.point(rewritten, 0.25, 0)))
    failures.push("A transformed cap silently retained old world authority.");

  const realized: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      {
        name: "owned-cap-tree",
        root: { type: "source", name: original.name, source: original.name },
      },
      { chord: 1e-5, sources: new Map([[original.name, original]]) },
    );
  if (realized.diagnostics.length !== 0)
    failures.push(`Actual cap skin: ${JSON.stringify(realized.diagnostics)}`);
  let capVertices: number = 0;
  let poleVertices: number = 0;
  for (let i: number = 0; i < realized.mesh.positions.length / 3; i++) {
    const s: number = realized.mesh.coordinates[3 * i + 1]!;
    const phi: number = realized.mesh.coordinates[3 * i + 2]!;
    const p: number[] = realized.mesh.positions
      .slice(3 * i, 3 * i + 3)
      .map((x: number): number => 1000 * x);
    if (s > 0 && s < 1) capVertices++;
    if (s === 0) poleVertices++;
    close(
      p,
      [Math.sqrt(s) * Math.cos(phi), s, Math.sqrt(s) * Math.sin(phi)],
      "realized actual cap grid/apex",
      failures,
    );
  }
  if (capVertices === 0 || poleVertices === 0)
    failures.push(
      "The final skin skipped the actual cap interior or its owned tip.",
    );

  const continued: IAutoMovieLoftChain | string =
    AutoMovieConstructionContinuation.apply(chain, "top", chain, "top");
  if (typeof continued === "string")
    failures.push(`Open-end continuation: ${continued}`);
  else
    close(
      AutoMovieLoftChain.point(continued, 0.25, 0.7),
      [0.5 * Math.cos(0.7), 0.25, 0.5 * Math.sin(0.7)],
      "unchanged far cap after continuation",
      failures,
    );

  const horizontal: IAutoMovieViewPart["axis"] = AutoMovieViewAxis.horizontal();
  const shifted: IAutoMovieViewPart["axis"] = {
    at: (s: number): ReturnType<typeof horizontal.at> => ({
      ...horizontal.at(s),
      origin: [s ** 3, s, 0],
    }),
    jet: (
      s: number,
      parameter?: Parameters<NonNullable<typeof horizontal.jet>>[1],
    ): ReturnType<NonNullable<typeof horizontal.jet>> => {
      const base: ReturnType<NonNullable<typeof horizontal.jet>> =
        horizontal.jet!(s, parameter);
      const inverse: [number, number] | null =
        parameter === undefined
          ? [1, 0]
          : AutoMovieViewParameter.inverseJet(parameter, s);
      if (base === null || inverse === null) return null;
      return {
        value: { ...base.value, origin: [s ** 3, s, 0] },
        first: {
          ...base.first,
          origin: [3 * s * s * inverse[0], inverse[0], 0],
        },
        second: {
          ...base.second,
          origin: [
            6 * s * inverse[0] ** 2 + 3 * s * s * inverse[1],
            inverse[1],
            0,
          ],
        },
      };
    },
  };
  const moving: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...original,
    axis: shifted,
  });
  if (moving.surface === null)
    throw new Error(JSON.stringify(moving.diagnostics));
  const moved: IAutoMovieSolidSurface.IJet = moving.surface.jet(0.25, 0);
  close(
    moved.p,
    [0.515625, 0.25, 0],
    "actual nonlinear cap axis value",
    failures,
  );
  close(moved.u, [1.1875, 1, 0], "actual nonlinear cap axis first", failures);
  close(moved.uu, [-0.5, 0, 0], "actual nonlinear cap axis second", failures);
  const valueOnly: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...original,
    axis: { at: horizontal.at },
  });
  if (valueOnly.chain === null)
    throw new Error(JSON.stringify(valueOnly.diagnostics));
  close(
    AutoMovieLoftChain.point(valueOnly.chain, 0.25, 0),
    [0.5, 0.25, 0],
    "value-only cap",
    failures,
  );
  if (!throws((): unknown => AutoMovieLoftJet.at(valueOnly.chain!, 0.25, 0)))
    failures.push("A finite axis value was promoted to physical2.");

  const cut: IAutoMovieSolidSurface = plane(0.25);
  const searched: ReturnType<typeof AutoMovieConstructionSeeds.create> =
    AutoMovieConstructionSeeds.create(
      {
        type: "search",
        partFace: chain.name,
        hostFace: cut.name,
        phase: 0,
        from: 0,
        to: 1,
      },
      surface,
      chain.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y),
      cut,
      0,
      1e-8,
    );
  if (typeof searched === "string" || !nclose(searched.s, 0.25, 1e-8))
    failures.push(
      `The owned-cap search lost its actual contact: ${JSON.stringify(searched)}`,
    );
  const intersection: AutoMovieSolidIntersection.IResult =
    AutoMovieSolidIntersection.trace({
      part: { ...surface, period: 2 * Math.PI },
      host: cut,
      seed: { s: 0.25, phi: 0, y: 0.5, theta: 0 },
      count: 16,
      tolerance: 1e-8,
      grazing: 0,
    });
  if (intersection.curve === null)
    failures.push(
      `A legitimate original cap contact was refused: ${JSON.stringify(intersection.diagnostics)}`,
    );
  else
    for (const p of intersection.curve.points)
      close(
        p.point,
        [0.5 * Math.cos(p.phi), 0.25, 0.5 * Math.sin(p.phi)],
        "actual cap intersection",
        failures,
      );
  ConstructionOwnedAtlas(failures);
  TestValidator.predicate(
    `${failures.length} owned-domain findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** Two linear root-coordinate knots define sqrt(s), independently of emitted rows. */
function cap(): IAutoMovieViewPart {
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "tip", station: 0, value: 0 },
      { site: "open", station: 4, value: 2 * sign },
    ],
  });
  return {
    name: "owned-original-cap",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 1, 4],
    pole: "bottom",
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: {
        knots: [
          { site: "tip", station: 0, value: AutoMovieViewSection.ELLIPSE },
          { site: "open", station: 4, value: AutoMovieViewSection.ELLIPSE },
        ],
      },
    },
    order: 16,
    samples: 16,
  };
}

/** Independent horizontal Cartesian chart, with physical u=X and v=Z. */
function plane(y: number): IAutoMovieSolidSurface {
  return {
    name: "horizontal-contact",
    orientation: -1,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [u, y, v],
      u: [1, 0, 0],
      v: [0, 0, 1],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
}

/** Accumulate every component finding before one assertion. */
function close(
  actual: readonly number[],
  expected: readonly number[],
  label: string,
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (x: number, i: number): boolean => !nclose(x, expected[i]!, 2e-8),
    )
  )
    failures.push(
      `${label}: ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`,
    );
}

/** Observe existing explicit failure without depending on text or swallowing success. */
function throws(read: () => unknown): boolean {
  try {
    read();
    return false;
  } catch (error: unknown) {
    return error instanceof Error;
  }
}

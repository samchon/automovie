import {
  AutoMovieLoftChain,
  type AutoMovieLoftContract,
  AutoMovieLoftFrame,
  AutoMovieLoftJet,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** Four signed source extents in their existing guide order. */
type Quarters = IAutoMovieViewPart.IQuarters<number>;
/** World point or derivative triple; units follow its derivative order. */
type V3 = [number, number, number];

/**
 * The view-to-section operator lofts a part from its four outlines and its
 * girth into a chain whose sections read back every outline knot at its
 * guides and its girth at its girth knots, C2 in station, marked as view
 * layers and readable as a solid surface; a broken box, a bad order or too
 * few stations is reported, never thrown.
 *
 * Scenarios:
 * 1. A straight 200 mm part with outline and girth knots at stations 0, 100 and 200 and layers every 20 mm: no diagnostic, a chain and a solid surface, continuity declared C2 in phase and station, every layer carrying its box, and at each knot station the chain's own points at the four guide phases on the outlines' values and the section's girth on the girth knot; the same reader with any extent 0.5 mm off must fail.
 * 2. Station continuity: at every interior layer the chain's point and both station derivatives, read by `AutoMovieLoftJet.at` just below and above the layer and extrapolated to it, agree; the chain below a layer joined to a copy with that layer's station curvature moved by 0.01 above it must fail the same reader.
 * 3. A front medial knot moved across the lateral outline at station 100 gives an `outline order` diagnostic there and leaves every broken station out with one diagnostic each (`outline order` or `half extent`); a side edge on the wrong side of the axis gives `half extent` at every station and no chain; an order of 10 gives `order` and no chain; one station gives `stations` and no chain.
 * 4. A part closing at its top in a pole: the tip station carries no layer and the chain carries the axis point there as its pole.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieViewLoft.create` on made parts and reads the result's chain through the public chain evaluators (`AutoMovieLoftChain.sampler`, `.frame`, `AutoMovieLoftFrame.local`, `AutoMovieLoftJet.at`), its sections' girths, its surface, continuity and diagnostics. It catches a section that misses its outline at a knot, a girth knot not honoured, a chain that steps in curvature across a layer, a layer without its box, and a broken input thrown or silently built; any operator that honours its knots, is C2 in station and reports what it drops passes.
 * @evidence contracts/development/testing.md#independent-expectations Expectations are the part's own inputs: the outline knots' values at their stations (the outlines own the extremes) and the girth knots (the girth owns the fullness), within rounding (1e-9 mm on points, the solve's 1e-6 mm on girths); C2 in station is read by second-order extrapolation from 1 and 2 micrometres on each side, whose truncation is below 1e-9 of the chain's fourth station derivative, against 1e-7 mm per mm squared; the diagnostics' contract names are the operator's published ones (#3046 item 7). The girth knots are put mid-reach of each knot's box (`AutoMovieViewSection.range`) so the input is valid by construction. Oracle limits: between knots the outlines are the natural spline's and the girth's reach is not re-derived, so values there are read only through continuity.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: a valid tapering part and one closing in a pole. Negative: an outline crossing its opposite, an axis outside the box, an order not a multiple of 4, a single station, and the made copies with a moved extent or curvature. The section's shape belongs to `test_construction_operator_view_section`, the girth solve to `test_construction_operator_view_section_girth`; whole-figure section invariants to `test_human_audit_sections`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_view_section_chain`; it builds made parts in process, generates no person and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A straight 200 mm part with outline and girth knots at stations 0, 100 and 200 and layers every 20 mm: no diagnostic, a chain and a solid...).
 */
export function test_construction_operator_view_section_chain(): void {
  const failures: string[] = [];

  // 1. A valid part.
  const made: IAutoMovieViewPart = part();
  const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(made);
  if (result.diagnostics.length !== 0)
    failures.push(
      `valid part: diagnostics ${result.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail}`).join("; ")}`,
    );
  if (result.surface === null) failures.push("valid part: no solid surface");
  if (result.continuity.phase !== "C2" || result.continuity.station !== "C2")
    failures.push(
      `valid part: continuity ${JSON.stringify(result.continuity)}`,
    );
  const chain: IAutoMovieLoftChain | null = result.chain;
  if (chain === null) failures.push("valid part: no chain");
  else {
    if (chain.layers.length !== made.stations.length)
      failures.push(
        `valid part: ${chain.layers.length} layers for ${made.stations.length} stations`,
      );
    chain.layers.forEach((l: IAutoMovieLoftChain.ILayer, i: number): void => {
      if (l.view === undefined)
        failures.push(`valid part: layer ${i} carries no box`);
    });
    for (const s of [0, 100, 200]) {
      const want: Quarters = extentsAt(made, s);
      failures.push(...knot(chain, s, want));
      const view: IAutoMovieLoftChain.IView | undefined = chain.layers.find(
        (l: IAutoMovieLoftChain.ILayer): boolean => l.y === s,
      )?.view;
      if (
        view === undefined ||
        view.extents.some(
          (e: number, g: number): boolean =>
            !(Math.abs(e - want[g]!) <= 1e-12 * want[g]!),
        )
      )
        failures.push(
          `station ${s}: declared box [${view?.extents.join(", ")}] against the outlines [${want.join(", ")}]`,
        );
      const section: AutoMovieViewLoft.IStation | undefined =
        result.sections.find(
          (x: AutoMovieViewLoft.IStation): boolean => x.station === s,
        );
      const g: number = girthAt(made, s);
      if (
        section === undefined ||
        !(Math.abs(section.section.girth - g) <= 1e-6)
      )
        failures.push(
          `station ${s}: girth ${section?.section.girth} against the knot ${g} mm`,
        );
    }
    if (
      knot(
        chain,
        100,
        extentsAt(made, 100).map((e: number, g: number): number =>
          g === 1 ? e + 0.5 : e,
        ) as Quarters,
      ).length === 0
    )
      failures.push("proof: an extent 0.5 mm off passes the knot reader");

    // 2. C2 in station at every interior layer, and red on a made break: the
    // chain read below a layer and a copy with that layer's station
    // curvature moved by 0.01 read above it (a chain's layers share their
    // jets, so a real break can only be made across two chains).
    const own: (
      c: IAutoMovieLoftChain,
    ) => (s: number, t: number) => AutoMovieLoftJet.IJet =
      (
        c: IAutoMovieLoftChain,
      ): ((s: number, t: number) => AutoMovieLoftJet.IJet) =>
      (s: number, t: number): AutoMovieLoftJet.IJet =>
        AutoMovieLoftJet.at(c, s, t);
    for (let i: number = 1; i + 1 < chain.layers.length; i++)
      failures.push(...station(own(chain), chain.layers[i]!.y));

    // Clone numeric data independently, then explicitly retain the callable
    // axis owner. No engine reader sees the temporary source-free records.
    const bent: IAutoMovieLoftChain = structuredClone({
      ...chain,
      layers: chain.layers.map(
        (original: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => {
          const numeric: IAutoMovieLoftChain.ILayer = { ...original };
          delete numeric.frameSource;
          return numeric;
        },
      ),
    });
    chain.layers.forEach(
      (original: IAutoMovieLoftChain.ILayer, index: number): void => {
        const copied: IAutoMovieLoftChain.ILayer = bent.layers[index]!;
        const source: IAutoMovieLoftChain.ILayer["frameSource"] =
          original.frameSource;
        if (source !== undefined) {
          const snapshot: Omit<
            NonNullable<IAutoMovieLoftChain.ILayer["frameSource"]>,
            "axis"
          > = structuredClone({
            station: source.station,
            frame: source.frame,
            jet: source.jet,
          });
          copied.frameSource = { ...snapshot, axis: source.axis };
          for (const key of ["origin", "u", "v"] as const) {
            if (copied.frameSource.frame[key] === source.frame[key])
              failures.push(
                "copy proof: a mutable source value snapshot is shared",
              );
            if (source.jet !== null && copied.frameSource.jet !== null)
              for (const order of ["value", "first", "second"] as const)
                if (
                  copied.frameSource.jet[order][key] === source.jet[order][key]
                )
                  failures.push(
                    "copy proof: a mutable source jet snapshot is shared",
                  );
          }
        }
        for (const key of [
          "coefficients",
          "slopes",
          "curvatures",
          "lift",
          "liftSlopes",
          "liftCurvatures",
        ] as const)
          if (original[key] !== undefined && original[key] === copied[key])
            failures.push(`copy proof: mutable ${key} rows are shared`);
        for (const key of ["frame", "frameSlopes", "frameCurvatures"] as const)
          for (const component of ["origin", "u", "v"] as const)
            if (
              original[key] !== undefined &&
              original[key]![component] === copied[key]![component]
            )
              failures.push(
                `copy proof: mutable ${key}.${component} rows are shared`,
              );
      },
    );

    // Separate layer records keep the equivalence reader immutable when bent
    // receives its defect; all six vectors must first equal the original.
    const originalJet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
      chain,
      107.5,
      0.37,
    );
    const equivalent: IAutoMovieLoftChain = {
      ...bent,
      layers: bent.layers.map(
        (copied: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
          ...copied,
        }),
      ),
    };
    const copiedJet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
      equivalent,
      107.5,
      0.37,
    );
    for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
      if (
        !originalJet[key].every((value: number, coordinate: number): boolean =>
          Object.is(value, copiedJet[key][coordinate]),
        )
      )
        failures.push(`copy proof: original ${key} changed before the defect`);
    const layer: IAutoMovieLoftChain.ILayer = bent.layers[5]!;
    layer.curvatures = layer.curvatures!.map((c: number, k: number): number =>
      k === 0 ? c + 0.01 : c,
    );
    const broken: (s: number, t: number) => AutoMovieLoftJet.IJet = (
      s: number,
      t: number,
    ): AutoMovieLoftJet.IJet =>
      s < layer.y
        ? AutoMovieLoftJet.at(chain, s, t)
        : AutoMovieLoftJet.at(bent, s, t);
    if (station(broken, layer.y).length === 0)
      failures.push(
        "proof: a station curvature that steps by 0.01 at a layer passes the station reader",
      );
  }

  // 3. Broken inputs, each reported.
  const crossed: IAutoMovieViewPart = part();
  crossed.front.negative.knots[1]!.value = 55;
  const c: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(crossed);
  const order: AutoMovieLoftContract.IDiagnostic[] = c.diagnostics.filter(
    (d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.contract === "outline order",
  );
  if (
    !order.some((d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.detail.includes("station 100 mm"),
    )
  )
    failures.push(
      "crossed outline: no outline order diagnostic at station 100",
    );
  if (
    c.chain !== null &&
    c.chain.layers.some((l: IAutoMovieLoftChain.ILayer): boolean => l.y === 100)
  )
    failures.push("crossed outline: station 100 kept in the chain");
  const dropped: number = c.diagnostics.filter(
    (d: AutoMovieLoftContract.IDiagnostic): boolean =>
      d.contract === "outline order" ||
      d.contract === "half extent" ||
      d.contract === "view section" ||
      d.contract === "shoulder",
  ).length;
  if (
    c.chain !== null &&
    c.chain.layers.length + dropped !== crossed.stations.length
  )
    failures.push(
      `crossed outline: ${c.chain.layers.length} layers and ${dropped} dropped-station diagnostics for ${crossed.stations.length} stations`,
    );
  const outside: IAutoMovieViewPart = part();
  for (const k of outside.side.negative.knots) k.value = 5;
  const o: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(outside);
  if (o.chain !== null) failures.push("axis outside the box: a chain is built");
  if (
    o.diagnostics.filter(
      (d: AutoMovieLoftContract.IDiagnostic): boolean =>
        d.contract === "half extent",
    ).length !== outside.stations.length
  )
    failures.push(
      `axis outside the box: ${o.diagnostics.length} diagnostics, expected one half extent per station`,
    );
  const odd: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...part(),
    order: 10,
  });
  if (
    odd.chain !== null ||
    !odd.diagnostics.some(
      (d: AutoMovieLoftContract.IDiagnostic): boolean => d.contract === "order",
    )
  )
    failures.push("order 10: no order diagnostic, or a chain");
  const single: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({
    ...part(),
    stations: [100],
  });
  if (
    single.chain !== null ||
    !single.diagnostics.some(
      (d: AutoMovieLoftContract.IDiagnostic): boolean =>
        d.contract === "stations",
    )
  )
    failures.push("one station: no stations diagnostic, or a chain");

  // 4. A part closing at its top in a pole.
  const tipped: IAutoMovieViewPart = {
    ...part([50, 30, -38, -26], [0, 0, 0, 0]),
    pole: "top",
  };
  const t: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(tipped);
  if (t.chain === null)
    failures.push(
      `pole: no chain (${t.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ")})`,
    );
  else {
    if (
      t.chain.layers.some(
        (l: IAutoMovieLoftChain.ILayer): boolean => l.y === 200,
      )
    )
      failures.push("pole: the tip station carries a layer");
    const p: V3 | undefined = t.chain.pole?.point;
    if (
      t.chain.pole?.end !== "top" ||
      p === undefined ||
      Math.hypot(p[0], p[1] - 200, p[2]) > 1e-12
    )
      failures.push(
        `pole: ${JSON.stringify(t.chain.pole)}, expected the axis point [0, 200, 0] at the top`,
      );
  }

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} view loft failures:\n${failures.join("\n")}`,
    );
}

/**
 * A straight part along `+y` from 0 to 200 mm, its plane's `u` along `+x` and
 * `v` along `+z`, layers every 20 mm. Outline knots at 0, 100 and 200 mm:
 * the front edges and side edges as given at 100 mm and tapering to 0.8 at
 * 0 and 0.7 at 200 mm unless the top knot is given; the girth knots
 * mid-reach of each knot's box, or 0 where the box closes.
 */
function part(
  middle: Quarters = [50, 30, -38, -26],
  top?: Quarters,
): IAutoMovieViewPart {
  const at: Quarters[] = [
    middle.map((v: number): number => 0.8 * v) as Quarters,
    middle,
    top ?? (middle.map((v: number): number => 0.7 * v) as Quarters),
  ];
  const stations: number[] = [0, 100, 200];
  const outline: (g: number) => IAutoMovieViewPart.IOutline = (
    g: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: stations.map(
      (s: number, i: number): IAutoMovieViewPart.IKnot => ({
        site: `made ${i}`,
        station: s,
        value: at[i]![g]!,
      }),
    ),
  });
  const girth: IAutoMovieViewPart.IOutline = {
    knots: stations.map((s: number, i: number): IAutoMovieViewPart.IKnot => {
      const e: Quarters = [at[i]![0], at[i]![1], -at[i]![2], -at[i]![3]];
      const range: AutoMovieViewSection.IRange | null = e.every(
        (x: number): boolean => x > 0,
      )
        ? AutoMovieViewSection.range({ extents: e })
        : null;
      return {
        site: `made girth ${i}`,
        station: s,
        value: range === null ? 0 : (range.girth[0] + range.girth[1]) / 2,
      };
    }),
  };
  return {
    name: "made",
    axis: AutoMovieViewAxis.straight([0, 0, 0], [1, 0, 0], [0, 0, 1]),
    stations: Array.from(
      { length: 11 },
      (_: unknown, i: number): number => 20 * i,
    ),
    front: { positive: outline(0), negative: outline(2) },
    side: { positive: outline(1), negative: outline(3) },
    fullness: { kind: "girth", girth },
    order: 16,
    samples: 64,
  };
}

/** The box's half extents a part's knots give at a knot station. */
function extentsAt(p: IAutoMovieViewPart, s: number): Quarters {
  const value: (o: IAutoMovieViewPart.IOutline) => number = (
    o: IAutoMovieViewPart.IOutline,
  ): number =>
    o.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.station === s)!
      .value;
  return [
    value(p.front.positive),
    value(p.side.positive),
    -value(p.front.negative),
    -value(p.side.negative),
  ];
}

/** The girth knot's value at a knot station. */
function girthAt(p: IAutoMovieViewPart, s: number): number {
  if (p.fullness.kind !== "girth")
    throw new Error("the made part's fullness is its girth");
  return p.fullness.girth.knots.find(
    (k: IAutoMovieViewPart.IKnot): boolean => k.station === s,
  )!.value;
}

/** Every failure of the chain's own points at the four guide phases to stand on the box's sides at a station. */
function knot(
  chain: IAutoMovieLoftChain,
  s: number,
  extents: Quarters,
): string[] {
  const out: string[] = [];
  const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);
  const point: (t: number) => V3 = AutoMovieLoftChain.sampler(chain, s);
  for (let g: number = 0; g < 4; g++) {
    const [x, z]: [number, number] = AutoMovieLoftFrame.local(
      f,
      point((g * Math.PI) / 2),
    );
    const want: [number, number] = [
      [extents[0], 0],
      [0, extents[1]],
      [-extents[2], 0],
      [0, -extents[3]],
    ][g] as [number, number];
    const miss: number = Math.hypot(x - want[0], z - want[1]);
    // The section B-spline interpolates its points through the periodic
    // filter truncated at 14 neighbours (`AutoMovieSplineCurve.interpolate`):
    // its points stand off by at most `2 sqrt 3 (2 - sqrt 3)^14 / (sqrt 3 - 1)`,
    // under 5e-8, of the largest extent.
    const limit: number = 5e-8 * Math.max(...extents);
    if (!(miss <= limit))
      out.push(
        `station ${s} guide ${g}: chain point (${x}, ${z}) is ${miss} mm from the outline point (${want.join(", ")})`,
      );
  }
  return out;
}

/**
 * Every C2 failure across one station: the point, the first and the second
 * station derivatives at eight phases, each extrapolated to the station from
 * 1 and 2 micrometres on each side, agree within 1e-7 (mm, mm per mm, mm per
 * mm squared).
 */
function station(
  jet: (s: number, t: number) => AutoMovieLoftJet.IJet,
  y: number,
): string[] {
  const out: string[] = [];
  const h: number = 1e-3;
  for (let i: number = 0; i < 8; i++) {
    const t: number = (2 * Math.PI * i) / 8 + 0.1;
    const read: (s: number) => V3[] = (s: number): V3[] => {
      const j: AutoMovieLoftJet.IJet = jet(s, t);
      return [j.p, j.s, j.ss] as V3[];
    };
    const [b1, b2, a1, a2]: V3[][] = [
      read(y - h),
      read(y - 2 * h),
      read(y + h),
      read(y + 2 * h),
    ];
    ["point", "station slope", "station curvature"].forEach(
      (name: string, k: number): void => {
        const step: number = Math.hypot(
          ...[0, 1, 2].map(
            (c: number): number =>
              2 * b1![k]![c]! - b2![k]![c]! - (2 * a1![k]![c]! - a2![k]![c]!),
          ),
        );
        if (!(step <= 1e-7))
          out.push(
            `station ${y} phase ${t.toFixed(2)}: ${name} steps by ${step}`,
          );
      },
    );
  }
  return out;
}

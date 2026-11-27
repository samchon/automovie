import { AutoMovieEngineViewOutline } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
  AutoMovieHumanNativeScaleProfile as Profile,
  AutoMovieHumanNativeSourceLaw,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * A native tissue scale about a declared scaling centre holds that centre still and moves every chart coordinate by c + a·(f - c).
 *
 * Every case is an ellipse of semi-axes A = 20 mm along u and B = 10 mm along v whose own centre stands off the course at e = (3, -2) mm
 * (layout limb(0), constant at its knots 0, 50 and 100 mm, source sampled every 2 mm). Its +u and -u extremes read u = 3 ± 20 with touch
 * v = -2, its +v and -v extremes v = -2 ± 10 with touch u = 3. The scale is the profile [[0, (1, 1)], [30, (1.2, 0.9)], [100, (1.2, 0.9)]]:
 * a = 1 + 0.2 h(s/30), b = 1 - 0.1 h(s/30), h the quintic share 10t^3 - 15t^4 + 6t^5, both held past 30.
 *
 * Scenarios:
 * 1. Centre on the ellipse's own centre, c = e: the extremes read 3 ± 20 a and -2 ± 10 b with slopes ±20 a', ±10 b' and second
 *    derivatives ±20 a'', ±10 b'', so the front and back move by equal and opposite amounts, and all four touch offsets stay at -2 and 3
 *    with zero derivatives. A junction at 30 bound to the constant ratio (1.2, 0.9) about the same centre is admitted.
 * 2. Centre on the line c(s) = (1 + 0.02 s, 0.5 - 0.01 s): each coordinate f reads c + k (f - c), slope c' + k' (f - c) - k c' and second
 *    derivative k'' (f - c) - 2 k' c', k the ratio of its direction: at 30 mm the front stands at 1.6 + 1.2·21.4 = 27.28 and the back at
 *    1.6 - 1.2·18.6 = -20.72, a move of +4.28 and -3.72 where a scale about the course gives +4.6 and -3.4. The product is a sextic, so
 *    between the 2 mm knots its quintic span is off by at most 6 k5 |c'| h^6/46080, about 1e-9 mm (k5 = 0.2·720/30^5), inside the limits.
 * 3. The family's knot controls follow the same law: at the 50 mm knot the +u extreme's u and v read 2 + 1.2·21 and 0 + 0.9·(-2).
 * 4. The zero line reads the same numbers as no centre, and a unit ratio about any centre returns the original outline objects.
 * 5. Refused: a centre off the course at a closing pole whose ratio is not 1 ("closing pole"); a centre with v off the median line of a
 *    bilateral family ("median line"); a centre with a plain scale function that carries no jet ("jet-carrying").
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds native families through Native.create and the constant target through the source law, and reads the produced outlines through the engine's outline reader and the family's own field reader.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the closed form of an ellipse scaled about a fixed point, c + k (f - c), with the quintic and its derivatives in expanded form; none is read from a run.
 * @evidence contracts/development/testing.md#distinguishing-cases A centre on the section's own centre, a moving centre off it, the zero line, a unit ratio, both chart directions, both sides, extremes and touch offsets, knots and between knots, a bound junction and three refusals, all findings collected.
 * @evidence contracts/development/testing.md#execution-ownership Small made families and sources built inside the test; no person, reference body, loft or realization.
 * @evidence contracts/development/common.md#meaningful-documentation States the ellipse, the law's closed forms, the worked numbers at 30 mm and the truncation bound.
 */
export function test_human_native_centred_scale(): void {
  const failures: string[] = [];
  const [A, B]: [number, number] = [20, 10];
  const e: AutoMovieVector2Tuple = [3, -2];
  const rho: number = Math.SQRT2 - 1;
  const prior: IAutoMovieHumanConicLoft.IFamily = {
    name: "offset",
    centres: [
      [0, 0, 0],
      [0, 120, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: S.limb(0),
    knots: [0, 50, 100],
    values: [e[0] + A, e[1], e[0], e[1] + B, e[0] - A, e[1], e[0], e[1] - B, rho, rho, rho, rho].map(
      (value: number): number[] => [value, value, value],
    ),
  };
  const stations: number[] = Array.from({ length: 51 }, (_: unknown, k: number): number => 2 * k);
  const original: IAutoMovieViewPart = H.part(prior, stations);
  const axis: IAutoMovieViewAxis.IAxis = H.axis(prior);
  const anchors: [number, AutoMovieVector2Tuple][] = [
    [0, [1, 1]],
    [30, [1.2, 0.9]],
    [100, [1.2, 0.9]],
  ];
  const fixed = (c: AutoMovieVector2Tuple): Profile.ICentre => ({
    jet: (): Profile.IJet => ({ value: [c[0], c[1]], first: [0, 0], second: [0, 0] }),
    breaks: [],
  });
  const line: Profile.ICentre = {
    jet: (s: number): Profile.IJet => ({ value: [1 + 0.02 * s, 0.5 - 0.01 * s], first: [0.02, -0.01], second: [0, 0] }),
    breaks: [],
  };
  const create = (
    scale: (s: number) => AutoMovieVector2Tuple,
    centre: Profile.ICentre | undefined,
    protection: Native.ISpec["protection"] = [],
    family: IAutoMovieHumanConicLoft.IFamily = prior,
    source: IAutoMovieViewPart = original,
  ): IAutoMovieHumanConicLoft.IFamily =>
    Native.create({
      original: family,
      bone: family,
      originals: new Map([[family.name, source]]),
      axis: H.axis(family),
      scale,
      station: (s: number): number => s,
      features: [],
      protection,
      ...(centre === undefined ? {} : { centre }),
    });
  const read = (outline: IAutoMovieViewPart.IOutline, s: number): [number, number, number] => {
    const curve = AutoMovieEngineViewOutline.create(outline);
    if ("contract" in curve) throw new Error(curve.detail);
    const reading = AutoMovieEngineViewOutline.at(curve, s);
    if (typeof reading === "string" || reading.stationJet === null) throw new Error("unreadable source at " + s);
    return [reading.value, reading.stationJet[0], reading.stationJet[1]];
  };
  const touch = (part: IAutoMovieViewPart, q: number): IAutoMovieViewPart.IOutline => {
    if (part.fullness.kind !== "top" || part.fullness.touch === undefined) throw new Error("the ellipse source has no touch offsets");
    return part.fullness.touch[q]!;
  };
  const ratio = (s: number): [number, number, number][] => {
    const t: number = Math.min(1, Math.max(0, s / 30));
    const inside: boolean = s > 0 && s < 30;
    const h: number[] = [
      10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5,
      inside ? (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4) / 30 : 0,
      inside ? (60 * t - 180 * t ** 2 + 120 * t ** 3) / 900 : 0,
    ];
    return [
      [1 + 0.2 * h[0]!, 0.2 * h[1]!, 0.2 * h[2]!],
      [1 - 0.1 * h[0]!, -0.1 * h[1]!, -0.1 * h[2]!],
    ];
  };
  const limits: number[] = [1e-9 * A, 1e-9 * A, 1e-8 * A];
  const check = (what: string, got: [number, number, number], expected: number[]): void => {
    for (const k of [0, 1, 2])
      if (!(Math.abs(got[k]! - expected[k]!) <= limits[k]!)) failures.push(`${what}: order ${k} reads ${got[k]} against ${expected[k]}`);
  };

  // The eight coordinate outlines: name, reader, chart direction and unscaled value.
  const outlines: [string, (part: IAutoMovieViewPart) => IAutoMovieViewPart.IOutline, 0 | 1, number][] = [
    ["+u", (part) => part.front.positive, 0, e[0] + A],
    ["-u", (part) => part.front.negative, 0, e[0] - A],
    ["+v", (part) => part.side.positive, 1, e[1] + B],
    ["-v", (part) => part.side.negative, 1, e[1] - B],
    ["touch +u", (part) => touch(part, 0), 1, e[1]],
    ["touch +v", (part) => touch(part, 1), 0, e[0]],
    ["touch -u", (part) => touch(part, 2), 1, e[1]],
    ["touch -v", (part) => touch(part, 3), 0, e[0]],
  ];
  const half: number[] = Array.from({ length: 201 }, (_: unknown, k: number): number => k / 2);
  const compare = (name: string, part: IAutoMovieViewPart, centre: (s: number) => [AutoMovieVector2Tuple, AutoMovieVector2Tuple]): void => {
    for (const s of half) {
      const k: [number, number, number][] = ratio(s);
      const [c, c1]: [AutoMovieVector2Tuple, AutoMovieVector2Tuple] = centre(s);
      for (const [what, select, d, f] of outlines)
        check(`${name} ${what} at ${s}`, read(select(part), s), [
          c[d] + k[d]![0] * (f - c[d]),
          c1[d] + k[d]![1] * (f - c[d]) - k[d]![0] * c1[d],
          k[d]![2] * (f - c[d]) - 2 * k[d]![1] * c1[d],
        ]);
    }
  };

  // 1. The centre on the ellipse's own centre, with a bound junction about the same centre.
  let own: IAutoMovieViewPart | undefined;
  try {
    own = H.source(
      create(Profile.create(anchors), fixed(e), [
        {
          sources: new Map([[prior.name, AutoMovieHumanNativeSourceLaw.create(original, axis, [1.2, 0.9], [], fixed(e))]]),
          requirement: { type: "junction", station: 30 },
        },
      ]),
    );
  } catch (error: unknown) {
    failures.push("a junction bound about the same centre was refused: " + String(error));
  }
  if (own !== undefined) {
    compare("own centre", own, (): [AutoMovieVector2Tuple, AutoMovieVector2Tuple] => [e, [0, 0]]);
    for (const q of [0, 1, 2, 3]) {
      const got: [number, number, number] = read(touch(own, q), 30);
      if (!(Math.abs(got[0] - (q % 2 === 0 ? e[1] : e[0])) <= limits[0]!)) failures.push(`the centre moved along touch ${q}: ${got[0]}`);
    }
  }

  // 2. A moving centre off the ellipse's own.
  const moving: IAutoMovieHumanConicLoft.IFamily = create(Profile.create(anchors), line);
  const moved: IAutoMovieViewPart = H.source(moving);
  compare("line centre", moved, (s: number): [AutoMovieVector2Tuple, AutoMovieVector2Tuple] => [
    [1 + 0.02 * s, 0.5 - 0.01 * s],
    [0.02, -0.01],
  ]);
  for (const [what, select, value] of [
    ["front", (part: IAutoMovieViewPart): IAutoMovieViewPart.IOutline => part.front.positive, 27.28],
    ["back", (part: IAutoMovieViewPart): IAutoMovieViewPart.IOutline => part.front.negative, -20.72],
  ] as const)
    if (!(Math.abs(read(select(moved), 30)[0] - value) <= 1e-9)) failures.push(`the ${what} at 30 reads ${read(select(moved), 30)[0]} against ${value}`);

  // 3. The family's knot controls.
  const knot: number[] = H.reader(moving)(50);
  if (!(Math.abs(knot[0]! - (2 + 1.2 * 21)) <= 1e-9) || !(Math.abs(knot[1]! - 0.9 * -2) <= 1e-9))
    failures.push(`the +u extreme's knot control at 50 reads [${knot[0]}, ${knot[1]}] against [27.2, -1.8]`);

  // 4. The zero line is the course; a unit ratio returns the original objects.
  const plain: IAutoMovieViewPart = H.source(create(Profile.create(anchors), undefined));
  const zero: IAutoMovieViewPart = H.source(create(Profile.create(anchors), fixed([0, 0])));
  for (const s of half)
    for (const [what, select] of outlines) {
      const [x, y]: [number, number, number][] = [read(select(plain), s), read(select(zero), s)];
      if (![0, 1, 2].every((k: number): boolean => Math.abs(x![k]! - y![k]!) <= 1e-12)) failures.push(`the zero line differs from no centre on ${what} at ${s}`);
    }
  const unit: IAutoMovieViewPart = H.source(create(Profile.constant([1, 1]), line));
  if (unit.front.positive !== original.front.positive || unit.side.negative !== original.side.negative || touch(unit, 1) !== touch(original, 1))
    failures.push("a unit ratio about a centre did not return the original source objects");

  // 5. Refusals.
  const capped: IAutoMovieHumanConicLoft.IFamily = { ...prior, name: "capped", tips: [null, { from: 100, tip: 120 }] };
  const bilateral: IAutoMovieHumanConicLoft.IFamily = { ...prior, name: "bilateral", layout: S.bilateral(0) };
  for (const [what, word, bad] of [
    ["a centre off the course at a closing pole", "closing pole", (): unknown => H.source(create(Profile.create(anchors), fixed(e), [], capped, H.part(capped, stations)))],
    ["a centre off the median line of a bilateral family", "median line", (): unknown => create(Profile.create(anchors), fixed(e), [], bilateral)],
    ["a centre under a plain scale function", "jet-carrying", (): unknown => H.source(create((s: number): AutoMovieVector2Tuple => Profile.create(anchors)(s), fixed(e)))],
  ] as const) {
    let message: string | null = null;
    try {
      bad();
    } catch (error: unknown) {
      message = String(error);
    }
    if (message === null) failures.push(what + " was accepted");
    else if (!message.includes(word)) failures.push(`${what} was refused for another reason: ${message}`);
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

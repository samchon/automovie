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
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * A station-varying native scale applies to the source function, so the wall reads the scale law between the family's knots and a site
 * junction binds an equal value instead of writing a ridge.
 *
 * Every case is a circle of radius R = 100 mm with one median per quarter at share 0.5 (layout limb(1)), constant at its knots 0, 50 and
 * 100 mm, whose original source is sampled every 2 mm. Under a diagonal scale (a, b) the circle's +u extreme is R·a, its +v extreme R·b,
 * its first median stands at R(1 + 0.5)/2 · (a, b) with tangent angle atan2(b, -a), and every conic shoulder is unchanged (affine
 * invariance of the median construction and of the conic's shoulder).
 *
 * Scenarios:
 * 1. Isotropic profile [[0, 1], [30, 1.1], [100, 1.1]] with a junction at 30 bound to the source scaled by 1.1: the +u and +v extremes
 *    and the median's u read R·c(s), R·c'(s) and R·c''(s) with c = 1 + 0.1·(10t^3 - 15t^4 + 6t^5), t = s/30, held at 1.1 past 30, at
 *    every half millimetre; |f''| stays within R·0.1·(10/sqrt 3)/30^2, the quintic's own bound.
 * 2. The same law passed as a plain function (no jet) with the same junction is refused when its source is read, because its knot-sampled
 *    wall disagrees with the bound value at 30; the refusal names the family and outline ("made pieces.0.0.u", the first one bound), the
 *    junction ("protected junction at 30 disagrees") and both readings ("target value/slope/second … against function …").
 * 3. Anisotropic profile [[0, (1, 1)], [30, (1.2, 0.9)], [100, (1.2, 0.9)]]: extremes R·a and R·b, the median at R·0.75·(a, b), its angle
 *    atan2(b, -a) with first derivative (b a' - a b')/(a^2 + b^2), and the shoulder outline equal to the original's at every station.
 *    The angle is exact at the source's knots (every 2 mm) and a quintic Hermite span between them, so between knots it is held to the
 *    Birkhoff-Priver (1967) bounds of two-point quintic Hermite interpolation, M h^6/46080, sqrt(5) M h^5/30000 and M h^4/1920, h = 2 mm.
 *    M bounds the angle's sixth station derivative: the angle is F(g(t)), t = s/30, g the quintic share, with F' = 0.3/q and
 *    q = 2 + 0.2g + 0.05g^2 in [2, 2.25], so |F'| <= 0.15, |F''| <= 0.0225, |F'''| <= 0.01425, and by Cauchy's estimate on discs of
 *    radius 3 clear of q's roots -2 +- 6i, |F4| <= 0.1206, |F5| <= 0.1608, |F6| <= 0.268; with |g'| <= 1.875, |g''| <= 10/sqrt 3,
 *    |g'''| <= 60, |g4| <= 360, g5 = 720 and g6 = 0, Faa di Bruno's sixth-order formula gives at most 4335, taken as M = 4400/30^6.
 * 4. Identity: a profile that is 1 at every site, with the same junction bound to the unscaled source, returns the original outline
 *    objects themselves.
 * 5. A constant profile 1.1 returns the same source, number for number, as the plain constant scale `() => [1.1, 1.1]`.
 * 6. A limb form: the root ratio 1.1 handed over between 20 and 50 mm to a profile 1.2 at 60 and 1.0 at 90, with junctions at 10 (root)
 *    and 90 (site), reads R·(1.1 + w(s)·(p(s) - 1.1)) and is admitted.
 * 7. A profile that varies only between the family's knots, [[0, 1], [25, 1.1], [50, 1]], reads R·1.1 at 25 and its quintics on both
 *    sides, although every family knot samples the ratio 1.
 * 8. A capped circle (cap from 100 to its pole at 120 mm, outlines in the pole's root parameter) under the anisotropic profile
 *    [[0, (1, 1)], [40, (1.2, 0.9)], [110, (1, 1.1)]]: at every source knot short of the pole, the +u and +v extremes' value, station
 *    slope and station second derivative equal the product rule c f, c' f + c f', c'' f + 2 c' f' + c f'' on the original outline's own
 *    station jet, and the pole knot stays 0.
 * 9. The production limb scope: a family authored with a distal cap whose original source and whose every request drop that cap
 *    (`AutoMovieHumanF1SourceScope` on the arm, hand and leg). Under scenario 6's handoff and junctions the request is admitted and reads
 *    the same R·(1.1 + w(s)·(p(s) - 1.1)): the scale applies to the requested scope's source function, not to its knot controls.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds native families through Native.create and reads the produced source outlines through the engine's own outline reader, the stage the loft consumes.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the closed form of a scaled circle: R times the expanded quintic and its derivatives, atan2 of the scaled tangent, and the unchanged shoulder; the capped case applies the station product rule to the original outline's reading, where the law works in the root parameter. None is read from a run.
 * @evidence contracts/development/common.md#meaningful-documentation The fixtures compare constant, isotropic, anisotropic and between-knot scaling, carried and declined junctions, parameter-specific cap jets, and the limb's distal scope.
 */
export function test_human_native_station_scale(): void {
  const failures: string[] = [];
  const R: number = 100;
  const share: number = 0.5;
  const median: number = (R * (1 + share)) / 2;
  const prior: IAutoMovieHumanConicLoft.IFamily = {
    name: "made",
    centres: [
      [0, 0, 0],
      [0, 120, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: S.limb(1),
    knots: [0, 50, 100],
    values: [R, 0, share, 0, R, share, -R, 0, share, 0, -R, share, ...new Array<number>(8).fill(0.4)].map(
      (value: number): number[] => [value, value, value],
    ),
  };
  const stations: number[] = Array.from({ length: 51 }, (_: unknown, k: number): number => 2 * k);
  const original: IAutoMovieViewPart = H.part(prior, stations);
  const originals: Map<string, IAutoMovieViewPart> = new Map([[prior.name, original]]);
  const axis: IAutoMovieViewAxis.IAxis = H.axis(prior);
  const bound = (station: number, ratio: AutoMovieVector2Tuple): Native.ISpec["protection"][number] => ({
    sources: new Map([[prior.name, AutoMovieHumanNativeSourceLaw.create(original, axis, ratio, [])]]),
    requirement: { type: "junction", station },
  });
  const build = (
    scale: (s: number) => AutoMovieVector2Tuple,
    protection: Native.ISpec["protection"],
    family: IAutoMovieHumanConicLoft.IFamily = prior,
    sources: ReadonlyMap<string, IAutoMovieViewPart> = originals,
  ): IAutoMovieViewPart =>
    H.source(
      Native.create({
        original: family,
        bone: family,
        originals: sources,
        axis: H.axis(family),
        scale,
        station: (s: number): number => s,
        features: [],
        protection,
      }),
    );
  const read = (outline: IAutoMovieViewPart.IOutline, s: number, ends: IAutoMovieViewOutline.IEnds = {}): [number, number, number] => {
    const curve = AutoMovieEngineViewOutline.create(outline, ends);
    if ("contract" in curve) throw new Error(curve.detail);
    const reading = AutoMovieEngineViewOutline.at(curve, s);
    if (typeof reading === "string" || reading.stationJet === null) throw new Error("unreadable source at " + s);
    return [reading.value, reading.stationJet[0], reading.stationJet[1]];
  };
  const piece = (part: IAutoMovieViewPart): IAutoMovieViewPart.ISplit => {
    if (part.fullness.kind !== "top" || part.fullness.pieces?.[0]?.[0] === undefined) throw new Error("the circle source has no first median");
    return part.fullness.pieces[0][0];
  };
  const quintic = (s: number, from: number, to: number): [number, number, number] => {
    const length: number = to - from;
    const t: number = Math.min(1, Math.max(0, (s - from) / length));
    const inside: boolean = s > from && s < to;
    return [
      10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5,
      inside ? (30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4) / length : 0,
      inside ? (60 * t - 180 * t ** 2 + 120 * t ** 3) / length ** 2 : 0,
    ];
  };
  const check = (what: string, got: [number, number, number], expected: [number, number, number]): void => {
    const limits: number[] = [1e-9 * R, 1e-9 * R, 1e-8 * R];
    for (const k of [0, 1, 2])
      if (!(Math.abs(got[k]! - expected[k]!) <= limits[k]!))
        failures.push(`${what}: order ${k} reads ${got[k]} against ${expected[k]}`);
  };
  const half: number[] = Array.from({ length: 201 }, (_: unknown, k: number): number => k / 2);

  // 1. Isotropic profile with a bound junction.
  const anchors: [number, AutoMovieVector2Tuple][] = [
    [0, [1, 1]],
    [30, [1.1, 1.1]],
    [100, [1.1, 1.1]],
  ];
  const bound30: Native.ISpec["protection"] = [bound(30, [1.1, 1.1])];
  let isotropic: IAutoMovieViewPart | undefined;
  try {
    isotropic = build(Profile.create(anchors), bound30);
  } catch (error: unknown) {
    failures.push("the jet-carrying profile with an equal junction was refused: " + String(error));
  }
  if (isotropic !== undefined) {
    const limit: number = (R * 0.1 * (10 / Math.sqrt(3))) / 900;
    for (const s of half) {
      const [h, h1, h2] = quintic(s, 0, 30);
      const expected: [number, number, number] = [1 + 0.1 * h, 0.1 * h1, 0.1 * h2];
      check(`isotropic +u at ${s}`, read(isotropic.front.positive, s), [R * expected[0], R * expected[1], R * expected[2]]);
      check(`isotropic +v at ${s}`, read(isotropic.side.positive, s), [R * expected[0], R * expected[1], R * expected[2]]);
      check(`isotropic median u at ${s}`, read(piece(isotropic).u, s), [median * expected[0], median * expected[1], median * expected[2]]);
      const curvature: number = read(isotropic.front.positive, s)[2];
      if (!(Math.abs(curvature) <= limit + 1e-8 * R)) failures.push(`isotropic +u second derivative ${curvature} at ${s} exceeds the law's bound ${limit}`);
    }
  }

  // 2. The same law without its jet is refused at the junction.
  const plain: Profile.IScale = Profile.create(anchors);
  let refusal: string | null = null;
  try {
    build((s: number): AutoMovieVector2Tuple => plain(s), bound30);
  } catch (error: unknown) {
    refusal = String(error);
  }
  if (refusal === null) failures.push("a knot-sampled wall that disagrees with its junction at 30 was accepted");
  else if (!refusal.includes("protected junction at 30 disagrees") || !refusal.includes("made pieces.0.0.u") || !/target value\/slope\/second .+ against function .+/.test(refusal))
    failures.push("the junction refusal does not name its family, outline, station and both readings: " + refusal);

  // 3. Anisotropic profile: the scaled ellipse.
  const stretch: Profile.IScale = Profile.create([
    [0, [1, 1]],
    [30, [1.2, 0.9]],
    [100, [1.2, 0.9]],
  ]);
  const anisotropic: IAutoMovieViewPart = build(stretch, []);
  const originalPiece: IAutoMovieViewPart.ISplit = piece(original);
  const sixth: number = 4400 / 30 ** 6;
  const truncation: number[] = [(sixth * 2 ** 6) / 46080, (Math.sqrt(5) * sixth * 2 ** 5) / 30000, (sixth * 2 ** 4) / 1920];
  for (const s of half) {
    const [h, h1, h2] = quintic(s, 0, 30);
    const [a, a1, a2]: number[] = [1 + 0.2 * h, 0.2 * h1, 0.2 * h2];
    const [b, b1, b2]: number[] = [1 - 0.1 * h, -0.1 * h1, -0.1 * h2];
    check(`anisotropic +u at ${s}`, read(anisotropic.front.positive, s), [R * a!, R * a1!, R * a2!]);
    check(`anisotropic +v at ${s}`, read(anisotropic.side.positive, s), [R * b!, R * b1!, R * b2!]);
    check(`anisotropic median u at ${s}`, read(piece(anisotropic).u, s), [median * a!, median * a1!, median * a2!]);
    check(`anisotropic median v at ${s}`, read(piece(anisotropic).v, s), [median * b!, median * b1!, median * b2!]);
    const r2: number = a! * a! + b! * b!;
    const n: number = b! * a1! - a! * b1!;
    const angle: [number, number, number] = [
      Math.atan2(b!, -a!),
      n / r2,
      ((b! * a2! - a! * b2!) * r2 - n * 2 * (a! * a1! + b! * b1!)) / (r2 * r2),
    ];
    const got: [number, number, number] = read(piece(anisotropic).angle, s);
    const knot: boolean = s % 2 === 0;
    for (const k of [0, 1, 2])
      if (!(Math.abs(got[k]! - angle[k]!) <= (knot ? 1e-12 : truncation[k]!)))
        failures.push(`anisotropic median angle order ${k} ${knot ? "at knot" : "between knots at"} ${s}: ${got[k]} against ${angle[k]}`);
    if (!(Math.abs(read(piece(anisotropic).shoulder, s)[0] - read(originalPiece.shoulder, s)[0]) <= 1e-12))
      failures.push("anisotropic median shoulder changed at " + s);
  }

  // 4. Identity returns the original outline objects.
  const identity: IAutoMovieViewPart = build(
    Profile.create([
      [0, [1, 1]],
      [30, [1, 1]],
      [100, [1, 1]],
    ]),
    [bound(30, [1, 1])],
  );
  if (
    identity.front.positive !== original.front.positive ||
    identity.side.negative !== original.side.negative ||
    piece(identity).angle !== originalPiece.angle ||
    piece(identity).u !== originalPiece.u
  )
    failures.push("an identity profile did not return the original source objects");

  // 5. A constant profile reads the plain constant scale's source exactly.
  const constant: IAutoMovieViewPart = build(Profile.constant([1.1, 1.1]), [bound(30, [1.1, 1.1])]);
  const today: IAutoMovieViewPart = build((): AutoMovieVector2Tuple => [1.1, 1.1], [bound(30, [1.1, 1.1])]);
  if (JSON.stringify([constant.front, constant.side, constant.fullness]) !== JSON.stringify([today.front, today.side, today.fullness]))
    failures.push("a constant profile changed the constant-scale source");

  // 6. A limb's root handoff with root and site junctions.
  const site: Profile.IScale = Profile.create([
    [60, [1.2, 1.2]],
    [90, [1, 1]],
  ]);
  const limb: Profile.IScale = Profile.handoff(Profile.constant([1.1, 1.1]), site, 20, 50);
  let handed: IAutoMovieViewPart | undefined;
  try {
    handed = build(limb, [bound(10, [1.1, 1.1]), bound(90, [1, 1])]);
  } catch (error: unknown) {
    failures.push("a limb handoff with equal root and site junctions was refused: " + String(error));
  }
  if (handed !== undefined)
    for (const s of half) {
      const [w, w1, w2] = quintic(s, 20, 50);
      const [p, p1, p2] = quintic(s, 60, 90);
      const target: number[] = [1.2 - 0.2 * p, -0.2 * p1, -0.2 * p2];
      const value: [number, number, number] = [
        1.1 + w * (target[0]! - 1.1),
        w1 * (target[0]! - 1.1) + w * target[1]!,
        w2 * (target[0]! - 1.1) + 2 * w1 * target[1]! + w * target[2]!,
      ];
      check(`limb +u at ${s}`, read(handed.front.positive, s), [R * value[0], R * value[1], R * value[2]]);
    }

  // 7. A profile that varies only between the family's knots.
  const between: IAutoMovieViewPart = build(
    Profile.create([
      [0, [1, 1]],
      [25, [1.1, 1.1]],
      [50, [1, 1]],
    ]),
    [],
  );
  for (const s of half) {
    const [up, up1, up2] = quintic(s, 0, 25);
    const [down, down1, down2] = quintic(s, 25, 50);
    check(`between-knot +u at ${s}`, read(between.front.positive, s), [
      R * (1 + 0.1 * (up - down)),
      R * 0.1 * (up1 - down1),
      R * 0.1 * (up2 - down2),
    ]);
  }

  // 8. A capped circle: the outlines are read in the pole's root parameter.
  const capped: IAutoMovieHumanConicLoft.IFamily = { ...prior, name: "capped", tips: [null, { from: 100, tip: 120 }] };
  const cappedOriginal: IAutoMovieViewPart = H.part(capped, stations);
  const pole: number = cappedOriginal.stations.at(-1)!;
  const ends: IAutoMovieViewOutline.IEnds = { top: pole };
  if (cappedOriginal.pole !== "top" || pole !== 120) failures.push(`the capped circle does not close at its 120 mm pole: ${cappedOriginal.pole} at ${pole}`);
  else {
    const cappedPart: IAutoMovieViewPart = build(
      Profile.create([
        [0, [1, 1]],
        [40, [1.2, 0.9]],
        [110, [1, 1.1]],
      ]),
      [],
      capped,
      new Map([[capped.name, cappedOriginal]]),
    );
    for (const [name, k, select] of [
      ["+u", 0, (part: IAutoMovieViewPart): IAutoMovieViewPart.IOutline => part.front.positive],
      ["+v", 1, (part: IAutoMovieViewPart): IAutoMovieViewPart.IOutline => part.side.positive],
    ] as const)
      for (const knot of select(cappedOriginal).knots) {
        const s: number = knot.station;
        const changedKnot: IAutoMovieViewPart.IKnot | undefined = select(cappedPart).knots.find(
          (other: IAutoMovieViewPart.IKnot): boolean => other.station === s,
        );
        if (changedKnot === undefined) {
          failures.push(`capped ${name} lost its source knot at ${s}`);
          continue;
        }
        if (s === pole) {
          if (changedKnot.value !== 0) failures.push(`capped ${name} pole knot reads ${changedKnot.value}`);
          continue;
        }
        const [up, up1, up2] = quintic(s, 0, 40);
        const [on, on1, on2] = quintic(s, 40, 110);
        const rise: number = k === 0 ? 0.2 : -0.1;
        const fall: number = k === 0 ? -0.2 : 0.2;
        const c: number[] = [1 + rise * up + fall * on, rise * up1 + fall * on1, rise * up2 + fall * on2];
        const [f, f1, f2] = read(select(cappedOriginal), s, ends);
        const expected: number[] = [c[0]! * f, c[1]! * f + c[0]! * f1, c[2]! * f + 2 * c[1]! * f1 + c[0]! * f2];
        const got: [number, number, number] = read(select(cappedPart), s, ends);
        for (const order of [0, 1, 2])
          if (!(Math.abs(got[order]! - expected[order]!) <= 1e-9 * Math.max(R, Math.abs(expected[order]!))))
            failures.push(`capped ${name} order ${order} at ${s}: ${got[order]} against ${expected[order]}`);
      }
  }

  // 9. The production limb scope: the family is authored with a distal cap, its original source and every request drop that cap.
  const scoped: IAutoMovieHumanConicLoft.IFamily = { ...capped, name: "scoped" };
  const scopedOriginal: IAutoMovieViewPart = H.part({ ...scoped, tips: [null, null] }, stations);
  const scopedAxis: IAutoMovieViewAxis.IAxis = H.axis(scoped);
  const scopedBound = (station: number, ratio: AutoMovieVector2Tuple): Native.ISpec["protection"][number] => ({
    sources: new Map([[scoped.name, AutoMovieHumanNativeSourceLaw.create(scopedOriginal, scopedAxis, ratio, [])]]),
    requirement: { type: "junction", station },
  });
  let scopedPart: IAutoMovieViewPart | undefined;
  try {
    const family: IAutoMovieHumanConicLoft.IFamily = Native.create({
      original: scoped,
      bone: scoped,
      originals: new Map([[scoped.name, scopedOriginal]]),
      axis: scopedAxis,
      scale: limb,
      station: (s: number): number => s,
      features: [],
      protection: [scopedBound(10, [1.1, 1.1]), scopedBound(90, [1, 1])],
    });
    scopedPart = H.source({ ...family, tips: [null, null] });
  } catch (error: unknown) {
    failures.push("a cap-dropping request under a limb handoff was refused: " + String(error));
  }
  if (scopedPart !== undefined)
    for (const s of half) {
      const [w, w1, w2] = quintic(s, 20, 50);
      const [p, p1, p2] = quintic(s, 60, 90);
      const target: number[] = [1.2 - 0.2 * p, -0.2 * p1, -0.2 * p2];
      const value: [number, number, number] = [
        1.1 + w * (target[0]! - 1.1),
        w1 * (target[0]! - 1.1) + w * target[1]!,
        w2 * (target[0]! - 1.1) + 2 * w1 * target[1]! + w * target[2]!,
      ];
      check(`scoped limb +u at ${s}`, read(scopedPart.front.positive, s), [R * value[0], R * value[1], R * value[2]]);
    }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

import { nclose } from "../../internal/predicates";
import { AutoMovieViewOutline } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
  AutoMovieHumanNativeFeatureLaw,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieLoftRelief,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * Native source generation resolves material controls, placed directions and caller scope once.
 *
 * Scenarios:
 * 1. Radial2 gives a height2 on both sides while a station shift0.25 stays0.25; along2 gives the original window[2,4] and shift0.5 once even with an already placed bone window.
 * 2. Caller cap centre/from/covered/own requests reach the actual native part rather than an equal-ended stale original; bare requests remain bare.
 * 3. A valid grooved source crossing atan2's cut under uniform2 preserves the original intermediate tangent direction and native angle curve.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls NativeFamily.create and actual ConicLoft.part/mirror consumers, detecting double material transport, radial station-warp scaling, discarded cap requests and angle winding loss.
 * @evidence contracts/development/testing.md#independent-expectations Literal height/window/shift arithmetic separates radial and longitudinal units; caller cap behavior is compared with the independently generated requested native source; uniform positive scaling preserves tangent direction.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes both reflected sides, unchanged/changed/bare scope, four cap controls and a branch-cut middle knot beside normal endpoints, collecting all findings.
 * @evidence contracts/development/testing.md#execution-ownership Small made control tables and native scalar factories only; no person, mesh reference, emitted loft, renderer, process or global cache.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three stage/scope scenarios and distinguishes height from station-shift units.
 */
export function test_human_native_family_scope(): void {
  const failures: string[] = [];
  const heights: number[] = new Array<number>(49).fill(0);
  heights[24] = 1;
  const shift: number[] = new Array<number>(49).fill(0);
  shift[24] = 0.25;
  const net: IAutoMovieLoftRelief = {
    name: "made",
    stations: [1, 2],
    phases: [0, 2 * Math.PI],
    rows: 7,
    columns: 7,
    heights,
    axis: [1, 0, 0],
    shift,
  };
  const prior: IAutoMovieHumanConicLoft.IFamily = {
    name: "made",
    centres: [
      [0, 0, 0],
      [0, 20, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: S.limb(0),
    knots: [0, 2, 4],
    values: [
      [3, 2.5, 2],
      [0, 0, 0],
      [0, 0, 0],
      [2, 2, 2],
      [-2, -2, -2],
      [0, 0, 0],
      [0, 0, 0],
      [-2, -2, -2],
      ...[0, 1, 2, 3].map((): number[] => [0.4, 0.4, 0.4]),
    ],
    tips: [null, { from: 4, tip: 6 }],
    reliefs: [net],
  };
  const source = (family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieViewPart =>
    H.part(family, [0, 2, 4]);
  const originals: Map<string, IAutoMovieViewPart> = new Map([
    [prior.name, source(prior)],
    ["made.mirror", source(H.mirror(prior, "made.mirror"))],
  ]);
  const axis: IAutoMovieViewAxis.IAxis = H.axis(prior);
  const spec = (
    radial: number,
    along: number,
    bone: IAutoMovieHumanConicLoft.IFamily = prior,
  ): Native.ISpec => ({
    original: prior,
    bone,
    originals,
    axis,
    scale: (): AutoMovieVector2Tuple => [radial, radial],
    station: (s: number): number => s * along,
    features: AutoMovieHumanNativeFeatureLaw.resolve(
      prior.reliefs ?? [],
      bone.reliefs ?? [],
      (): AutoMovieVector2Tuple => [radial, radial],
      (s: number): number => s * along,
    ),
    protection: [],
  });
  const radial: IAutoMovieHumanConicLoft.IFamily = Native.create(spec(2, 1));
  for (const family of [radial, H.mirror(radial, "made.mirror")]) {
    const part: IAutoMovieViewPart = H.part(family, [0, 2, 4]);
    if (!nclose(part.reliefs?.[0]?.heights[24] ?? NaN, 2, 1e-12))
      failures.push("radial height was not applied once on " + family.name);
    if (!nclose(part.reliefs?.[0]?.shift?.[24] ?? NaN, 0.25, 1e-12))
      failures.push(
        "radial scale changed longitudinal shift on " + family.name,
      );
  }
  const placed: IAutoMovieHumanConicLoft.IFamily = {
    ...prior,
    reliefs: [{ ...net, stations: [2, 4] }],
  };
  const along: IAutoMovieHumanConicLoft.IFamily = Native.create(spec(1, 2, placed));
  for (const family of [along, H.mirror(along, "made.mirror")]) {
    const part: IAutoMovieViewPart = H.part(family, [0, 4, 8]);
    const feature: IAutoMovieLoftRelief | undefined = part.reliefs?.[0];
    if (
      feature === undefined ||
      !nclose(feature.stations[0], 2, 1e-12) ||
      !nclose(feature.stations[1], 4, 1e-12)
    )
      failures.push("material window was applied twice on " + family.name);
    if (!nclose(feature?.shift?.[24] ?? NaN, 0.5, 1e-12))
      failures.push(
        "along2 did not scale its longitudinal shift once on " + family.name,
      );
  }
  const unchanged: IAutoMovieHumanConicLoft.IFamily = Native.create(spec(1, 1));
  const cap: IAutoMovieHumanConicLoft.ITip = prior.tips![1]!;
  const read = (part: IAutoMovieViewPart): number => {
    const curve = AutoMovieViewOutline.create(part.front.positive, {
      top: part.stations.at(-1)!,
    });
    if ("contract" in curve) throw new Error(curve.detail);
    const value = AutoMovieViewOutline.at(curve, 5);
    if (typeof value === "string") throw new Error(value);
    return value.value;
  };
  for (const tip of [
    { ...cap, centre: [0.5, 0] as [number, number] },
    { ...cap, from: 3 },
    { ...cap, covered: true },
    { ...cap, own: true },
  ]) {
    const requested: IAutoMovieHumanConicLoft.IFamily = { ...unchanged, tips: [null, tip] };
    const actual: IAutoMovieViewPart = H.part(requested, [0, 2, 4]);
    const expected: IAutoMovieViewPart = H.part(
      { ...requested, native: undefined },
      [0, 2, 4],
    );
    if (!nclose(read(actual), read(expected), 1e-10))
      failures.push("caller cap request was discarded: " + JSON.stringify(tip));
  }
  for (const sampling of [{ phase: Math.PI / 64 }, { pitch: 0.05 }]) {
    const requested: IAutoMovieHumanConicLoft.IFamily = { ...unchanged, ...sampling };
    const actual: IAutoMovieViewPart = H.part(requested, [0, 2, 4]);
    const expected: IAutoMovieViewPart = H.part(
      { ...requested, native: undefined },
      [0, 2, 4],
    );
    if (actual.samples !== expected.samples || actual.samples < 128)
      failures.push(
        "native source discarded explicit sampling " +
          JSON.stringify(sampling) +
          " actual=" +
          actual.samples +
          " expected=" +
          expected.samples,
      );
  }
  const bare: IAutoMovieViewPart = H.part(
    { ...radial, reliefs: undefined },
    [0, 2, 4],
  );
  if ((bare.reliefs?.length ?? 0) !== 0)
    failures.push("bare caller scope regained a feature");
  const ellipse: number = Math.SQRT2 - 1;
  const groove: IAutoMovieHumanConicLoft.IFamily = {
    ...prior,
    name: "groove",
    tips: undefined,
    reliefs: undefined,
    layout: S.inflected(0, [0]),
    values: [
      [22, 21, 19],
      [3, 4, 2],
      [0.3, 0.3, 0.3],
      [0.4, 0.6, 0.4],
      [0.4, 0.4, 0.4],
      [0.75, 0.75, 0.75],
      [-0.4, -0.4, -0.4],
      [-2, -1, 0],
      [17, 18, 16],
      [-25, -24, -23],
      [-3, -2, -1],
      [4, 3, 2],
      [-14, -15, -16],
      ...[0, 1, 2, 3, 4, 5, 6].map((): number[] => [ellipse, ellipse, ellipse]),
    ],
  };
  const groovePart: IAutoMovieViewPart = source(groove);
  const mapped: IAutoMovieHumanConicLoft.IFamily = Native.create({
    ...spec(2, 1),
    original: groove,
    bone: groove,
    axis: H.axis(groove),
    originals: new Map([["groove", groovePart]]),
    features: [],
  });
  for (const s of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]) {
    const a: IAutoMovieHumanConicSection.IChain = S.resolve(H.reader(groove)(s), groove.layout);
    const b: IAutoMovieHumanConicSection.IChain = S.resolve(H.reader(mapped)(s), mapped.layout);
    const oldT: AutoMovieVector2Tuple = a.input.tangents[1]!;
    const newT: AutoMovieVector2Tuple = b.input.tangents[1]!;
    if (
      Math.abs(oldT[0] * newT[1] - oldT[1] * newT[0]) > 1e-10 ||
      oldT[0] * newT[0] + oldT[1] * newT[1] <= 0
    )
      failures.push(
        "uniform affine changed an intermediate inflection direction at " + s,
      );
  }
  const newGroovePart: IAutoMovieViewPart = H.part(mapped, [0, 2, 4]);
  if (
    groovePart.fullness.kind !== "top" ||
    newGroovePart.fullness.kind !== "top" ||
    groovePart.fullness.pieces === undefined ||
    newGroovePart.fullness.pieces === undefined
  )
    failures.push("actual grooved native source has no original pieces");
  else {
    const a = AutoMovieViewOutline.create(
      groovePart.fullness.pieces[0][0]!.angle,
    );
    const b = AutoMovieViewOutline.create(
      newGroovePart.fullness.pieces[0][0]!.angle,
    );
    if ("contract" in a || "contract" in b)
      failures.push("groove original angle-source admission failed");
    else
      for (const s of [0.5, 1, 1.5, 2.5, 3, 3.5]) {
        const x = AutoMovieViewOutline.at(a, s);
        const y = AutoMovieViewOutline.at(b, s);
        if (
          typeof x === "string" ||
          typeof y === "string" ||
          Math.abs(Math.sin(x.value - y.value)) > 1e-10 ||
          Math.cos(x.value - y.value) <= 0
        )
          failures.push("actual uniform native piece angle changed at " + s);
      }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

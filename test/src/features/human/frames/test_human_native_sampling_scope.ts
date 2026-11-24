import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
} from "@automovie/human";
import type { IAutoMovieHumanConicLoft, IAutoMovieViewPart } from "@automovie/interface";

/**
 * Native turn sampling reads regular wall rings while both caps retain their poles.
 *
 * Scenarios:
 * 1. A two-millimetre circle's three wall rings require the minimum48 phases at pitch100/turnpi, with one closing cap.
 * 2. The same source closes at both ends; both reflected sides retain48 finite ordered phases and the declared pole stations.
 * 3. Two layer grids sampled in one prepared scope carry the same outline, caps and finite phase ordering.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls ordinary and actual NativeFamily/ConicLoft part/mirror consumers with turn sampling; passing collapsed pole rings into the wall sampler produces an empty clock and fails.
 * @evidence contracts/development/testing.md#independent-expectations Each convex radius2 wall ring has perimeter4pi and total turn2pi. Three such rings at pitch100/turnpi plus phasepi need fewer than48 density units even under the sum bound, so the fixed minimum48 is the independent count.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes one/two caps, ordinary/native sources, both reflected sides, and distinct grids sampled from one prepared source.
 * @evidence contracts/development/testing.md#execution-ownership Tiny made circles and their direct native sampling consumer only; no person, reference, whole realization, host or process.
 * @evidence contracts/development/common.md#meaningful-documentation Names the regular-wall sampling contract and separates that from retaining all emitted cap layers.
 */
export function test_human_native_sampling_scope(): void {
  const failures: string[] = [];
  const shoulder: number = Math.SQRT2 - 1;
  for (const both of [false, true]) {
    const prior: IAutoMovieHumanConicLoft.IFamily = {
      name: "circle",
      centres: [
        [0, 0, 0],
        [0, 10, 0],
      ],
      halves: [],
      up: [1, 0, 0],
      layout: S.limb(0),
      knots: [0, 2, 4],
      values: [
        [2, 2, 2],
        [0, 0, 0],
        [0, 0, 0],
        [2, 2, 2],
        [-2, -2, -2],
        [0, 0, 0],
        [0, 0, 0],
        [-2, -2, -2],
        ...[0, 1, 2, 3].map((): number[] => [shoulder, shoulder, shoulder]),
      ],
      tips: [both ? { from: 0, tip: -2 } : null, { from: 4, tip: 6 }],
    };
    const bank = new Map<string, IAutoMovieViewPart>([
      [prior.name, H.part(prior, [0, 2, 4])],
      ["circle.mirror", H.part(H.mirror(prior, "circle.mirror"), [0, 2, 4])],
    ]);
    const native = Native.create({
      original: prior,
      bone: prior,
      originals: bank,
      axis: H.axis(prior),
      scale: () => [1, 1],
      station: (s: number): number => s,
      features: [],
      protection: [],
    });
    const sample = native.native!.preparePart!(native);
    const coarse: IAutoMovieViewPart = sample([0, 2, 4], native);
    const fine: IAutoMovieViewPart = sample([0, 1, 2, 3, 4], { ...native, turn: Math.PI });
    if (fine.front !== coarse.front || fine.side !== coarse.side || fine.fullness !== coarse.fullness)
      failures.push("layer sampling replaced the prepared scalar controls");
    if (fine.stations.includes(1) === false || fine.stations.includes(3) === false || coarse.stations.includes(1))
      failures.push("preparation retained the previous sampling grid");
    if (coarse.stations[0] !== (both ? -2 : 0) || fine.stations[0] !== coarse.stations[0] ||
      coarse.stations.at(-1) !== 6 || fine.stations.at(-1) !== 6)
      failures.push("layer sampling changed a prepared cap extent");

    for (const [kind, family] of [
      ["ordinary", prior],
      ["native", native],
    ] as const)
      for (const side of [family, H.mirror(family, "circle.mirror")]) {
        const part = H.part(
          { ...side, pitch: 100, phase: Math.PI, turn: Math.PI },
          [0, 2, 4],
        );
        const phases = part.phases;
        if (
          part.samples !== 48 ||
          phases === undefined ||
          phases.length !== 48 ||
          phases.some(
            (p: number, k: number): boolean =>
              !Number.isFinite(p) ||
              p < 0 ||
              p >= 2 * Math.PI ||
              (k > 0 && p <= phases[k - 1]!),
          )
        )
          failures.push(
            kind +
              " " +
              side.name +
              " " +
              (both ? "two" : "one") +
              " caps lost the regular48-phase clock: samples=" +
              part.samples,
          );
        if (part.stations[0] !== (both ? -2 : 0) || part.stations.at(-1) !== 6)
          failures.push(kind + " sampling changed emitted pole/domain");
      }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

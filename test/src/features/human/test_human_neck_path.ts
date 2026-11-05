import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckSurface as Neck } from "../../../../packages/human/src/generation/AutoMovieHumanNeckSurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain as Loft } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanSkeleton as Skeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../../../../packages/human/src/typings/AutoMovieHumanSex";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Requested display heights follow the source path through the neck and chin.
 *
 * Scenarios:
 *
 * 1. A 1660 mm narrow female and a 1780 mm male use their complete public head
 * dimensions with every neck/foot opt-in combination over the same whole body.
 * 2. Actual source courses survive in anatomical order when the lower head's
 * centre revisits a world height and when the body stores its chains reversed.
 * 3. A requested height between a descending principal pair has an earlier
 * ascending source crossing; that first branch owns the display course.
 * 4. A positive requested band extending above the source crown still refuses.
 * 5. Null, zero, negative and nonfinite lengths and invalid physical scales refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates two fresh whole people, exercises all four public Skeleton exterior combinations, compares every emitted neck/head point with its actual source curve, reverses chain storage, and targets a measured lower-head reversal to distinguish first-path ownership from global-height uniqueness or a later crossing. Missing source heights still refuse.
 * @evidence contracts/testing.md#independent-expectations An optional display port preserves the body's rig and original source coordinates. Anatomical chain adjacency defines path order independently of array storage; a dense 64-subinterval polyline brackets the first crossing of the requested height and bounds its permitted source station without reproducing the producer's principal-interval bisection. The two authored dimension records came from real failed consumers; no generated coordinate or fitted answer is copied. A reversal is a fixture premise for branch coverage, not a claim that every anatomical centre path must reverse. The source sampler's documented inability to detect a wholly hidden intra-interval first crossing remains outside these expectations.
 * @evidence contracts/testing.md#distinguishing-cases Covers female and male bodies, supplied and omitted survey fields, all exterior option combinations, normal and reversed source storage, a later revisit to the same height, exact source point retention, and an absent target. Existing foot tests own foot anatomy, immutable foot lifetime and Viewer articulation; this unit does not certify rendered skin continuity or whole-domain appearance.
 * @evidence contracts/testing.md#execution-ownership This discoverable CPU unit builds each whole body once, uses the public Skeleton evaluator with that exact calibration, and starts no browser, GPU, process, dense skin or production host. It accumulates all cases and findings before rejecting the round.
 */
export function test_human_neck_path(): void {
  const defects: string[] = [];
  const base: IAutoMovieHumanParameters["head"] = {
    length: 180, cephalicIndex: 79, circumference: 545, height: 219,
    faceHeight: 111, faceWidth: 134, mandibularWidth: 99, minimumFrontalWidth: 103,
    mouthOpening: 48, mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
      },
      intercanthalWidth: 32,
      nose: { width: 31, height: 48, protrusion: 17 },
      mouth: { width: 46, upperVermilionHeight: 6, lowerVermilionHeight: 8 },
    },
    earPair: {
      left: { length: 59, breadth: 28, protrusion: 17 },
      right: { length: 59, breadth: 28, protrusion: 17 },
    },
  };
  const cases: IAutoMovieHumanParameters[] = [
    {
      body: { anatomy: {
        sex: AutoMovieHumanSex.Female, stature: 1660,
        chestCircumference: 790, underbustCircumference: 740, waistCircumference: 640,
        hipCircumference: 875, acrossBackShoulderWidth: 355, neckCircumference: 305,
        upperArmCircumference: 235, forearmCircumference: 215,
      } },
      head: {
        ...base, length: 184, cephalicIndex: 80, circumference: 535, height: 214,
        faceHeight: 110, faceWidth: 125, mandibularWidth: 95, minimumFrontalWidth: 100,
        face: {
          eyePair: {
            left: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
            right: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
          },
          intercanthalWidth: 30,
          nose: { width: 31, height: 48, protrusion: 19 },
          mouth: { width: 43, upperVermilionHeight: 8, lowerVermilionHeight: 10 },
        },
        earPair: {
          left: { length: 58, breadth: 26, protrusion: 18 },
          right: { length: 58, breadth: 26, protrusion: 18 },
        },
      },
    },
    { body: { anatomy: { sex: AutoMovieHumanSex.Male, stature: 1780 } }, head: base },
  ];
  let folds: number = 0;
  for (const params of cases) {
    const label: string = `${params.body.anatomy.sex}/${params.body.anatomy.stature}`;
    try {
      const body: IAutoMovieHumanBodyCalibration = AutoMovieHumanBodyLaw.calibrate(params).body;
      const scale: number = params.body.anatomy.stature! / body.stature / 1000;
      const length: number = AutoMovieHumanBodyLaw.headInputs(params).neckLength;
      const ordinary: Neck.IOutput = Neck.derive(body, scale, null, length);
      const reordered: Neck.IOutput = Neck.derive({ ...body, chains: [...body.chains].reverse() }, scale, null, length);
      const plain: Skeleton.IOutput = Skeleton.prepare(params, { calibration: body })({});
      for (const neck of [false, true])
        for (const foot of [false, true]) {
          try {
            const output: Skeleton.IOutput = Skeleton.prepare(params, { calibration: body, neckSurface: neck, footSurface: foot })({});
            if ((output.neckSurface !== undefined) !== neck || (output.footSurface !== undefined) !== foot || output.bones.length !== plain.bones.length)
              defects.push(`${label}/${neck}/${foot}: changed rig or option admission`);
            for (let index: number = 0; index < plain.bones.length; index++) {
              const before: Skeleton.IBone = plain.bones[index]!;
              const after: Skeleton.IBone = output.bones[index]!;
              if (before.bone !== after.bone || before.parent !== after.parent || !nclose(before.radius, after.radius, 0))
                defects.push(`${label}/${neck}/${foot}/${before.bone}: changed rest identity`);
              for (let axis: number = 0; axis < 3; axis++)
                if (!nclose(before.position[axis]!, after.position[axis]!, 0) ||
                    (before.tip !== null && (after.tip === null || !nclose(before.tip[axis]!, after.tip[axis]!, 0))) ||
                    !nclose(plain.posed[index]!.position[axis]!, output.posed[index]!.position[axis]!, 0))
                  defects.push(`${label}/${neck}/${foot}/${before.bone}: changed rig position`);
              for (let axis: number = 0; axis < 4; axis++)
                if (!nclose(plain.posed[index]!.rotation[axis]!, output.posed[index]!.rotation[axis]!, 0))
                  defects.push(`${label}/${neck}/${foot}/${before.bone}: changed clinical frame`);
            }
          } catch (error) {
            defects.push(`${label}/${neck}/${foot}: ${String(error)}`);
          }
        }
      const sections: Neck.ISection[] = [...ordinary.sections, ...ordinary.headSections];
      const reversed: Neck.ISection[] = [...reordered.sections, ...reordered.headSections];
      const names: string[] = ["upper", "head", "head.lower", "head.middle", "head.upper"];
      for (let index: number = 0; index < sections.length; index++) {
        const section: Neck.ISection = sections[index]!;
        const other: Neck.ISection = reversed[index]!;
        const chain: IAutoMovieHumanLoftChain = body.chains.find((item: IAutoMovieHumanLoftChain): boolean => item.name === section.chain)!;
        if (section.chain !== other.chain || !nclose(section.stationMm, other.stationMm, 1e-6) || !nclose(section.centre[1], section.requestedHeight, 1e-8))
          defects.push(`${label}/${index}: storage-dependent or displaced source address`);
        if (index > 0 && (names.indexOf(section.chain) < names.indexOf(sections[index - 1]!.chain) ||
            (section.chain === sections[index - 1]!.chain && section.stationMm < sections[index - 1]!.stationMm)))
          defects.push(`${label}/${index}: reversed anatomical path`);
        const ring: [number, number, number][] = Loft.ring(chain, section.stationMm, section.sourcePhases);
        for (let point: number = 0; point < ring.length; point++)
          for (let axis: number = 0; axis < 3; axis++)
            if (!nclose(section.points[point]![axis]!, ring[point]![axis]! * scale, 1e-12) ||
                !nclose(section.points[point]![axis]!, other.points[point]![axis]!, 1e-12))
              defects.push(`${label}/${index}: changed source point`);
      }

      // A later descending visit supplies a target that already had to be
      // crossed on the way up from the neck. Its earlier branch must survive.
      const lower: IAutoMovieHumanLoftChain = body.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === "head.lower")!;
      const descending: number = lower.layers.findIndex((layer: IAutoMovieHumanLoftChain.ILayer, index: number): boolean =>
        index + 1 < lower.layers.length && Loft.axis(lower, layer.y)[1] - Loft.axis(lower, lower.layers[index + 1]!.y)[1] > 1e-4);
      if (descending >= 0) {
        folds++;
        const target: number = (Loft.axis(lower, lower.layers[descending]!.y)[1] + Loft.axis(lower, lower.layers[descending + 1]!.y)[1]) / 2;
        const band: number = (target - ordinary.sections[0]!.centre[1] / scale) * scale * 1000;
        const folded: Neck.ISection = Neck.derive(body, scale, null, band).sections.at(-1)!;
        const path: IAutoMovieHumanLoftChain[] = ["head", "head.lower"].map((name: string): IAutoMovieHumanLoftChain => body.chains.find((chain: IAutoMovieHumanLoftChain): boolean => chain.name === name)!);
        let bound: { chain: string; lo: number; hi: number } | undefined;
        for (const chain of path) {
          for (let layer: number = 1; layer < chain.layers.length && bound === undefined; layer++) {
            const start: number = chain.layers[layer - 1]!.y;
            const span: number = chain.layers[layer]!.y - start;
            for (let part: number = 0; part < 64; part++) {
              const lo: number = start + span * part / 64;
              const hi: number = start + span * (part + 1) / 64;
              if (Loft.axis(chain, lo)[1] <= target && Loft.axis(chain, hi)[1] >= target) {
                bound = { chain: chain.name, lo, hi };
                break;
              }
            }
          }
          if (bound !== undefined) break;
        }
        if (bound === undefined || folded.chain !== bound.chain || folded.stationMm < bound.lo - 1e-5 || folded.stationMm > bound.hi + 1e-5)
          defects.push(`${label}: skipped first anatomical crossing`);
      }
      if (!throwsError((): void => { Neck.derive(body, scale, null, 2 * params.body.anatomy.stature!); }))
        defects.push(`${label}: invented absent display height`);
      for (const invalid of [null, 0, -1, NaN, Infinity])
        if (!throwsError((): void => { Neck.derive(body, scale, null, invalid); }))
          defects.push(`${label}: admitted invalid display length ${invalid}`);
      for (const invalid of [0, -1, NaN, Infinity])
        if (!throwsError((): void => { Neck.derive(body, invalid, null, length); }))
          defects.push(`${label}: admitted invalid physical scale ${invalid}`);
    } catch (error) {
      defects.push(`${label}: ${String(error)}`);
    }
  }
  if (folds === 0) defects.push("authored regression inputs no longer exercise a lower-head reversal");
  TestValidator.equals("neck display follows the canonical source path without changing geometry", defects, []);
}

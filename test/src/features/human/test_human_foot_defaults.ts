import {
  type IAutoMovieLoftChain as IAutoMovieHumanLoftChain,
  AutoMovieLoftChain as Loft,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  AutoMovieHumanSex,
  type IAutoMovieHumanParameters,
  AutoMovieHumanSkeleton as Skeleton,
} from "../../../../packages/human/src";
import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanFootSurface as Foot } from "../../../../packages/human/src/generation/AutoMovieHumanFootSurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/predicates";

/**
 * Public survey defaults reach the optional exterior through real preparation.
 *
 * Scenarios:
 *
 * 1. A 1700 mm female with only sex/stature and a complete head prepares both
 * neck and feet without an injected calibration or any supplied body surveys.
 * 2. A 1800 mm male with independently measured unequal feet takes the same
 * path, preserving each side's source courses rather than copying its partner.
 * 3. Every foot source station and point survives; each ball is the nearest
 * plantar sample to its own MTP among the retained courses, not a chain end.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public Skeleton.prepare with neckSurface and footSurface together and no calibration, checks bilateral finite articulated modules, every actual foot source station/point, and MTP-relative plantar landmark selection. It catches the obsolete forefoot-chain requirement, truncation of the new fan, fabricated or reflected partner geometry, and ball addresses tied to the distal web ring.
 * @evidence contracts/testing.md#independent-expectations Source identity compares independently calibrated curves at the returned material addresses; coverage comes from the source's principal stations, not a copied course count. Each anatomical ball must lie below its own MTP and be at least as close as a dense 256-phase scan of all retained source courses, with 0.1 micrometre comparison slack. That scan is an independent discrete upper bound on distance, not the producer's bounded phase optimizer; it does not certify an optimum between retained longitudinal courses. Existing surface tests own heel-floor and anatomical ordering assertions.
 * @evidence contracts/testing.md#distinguishing-cases Covers omitted surveys, explicit unequal side dimensions, both sexes, both anatomical sides, neck/foot option composition and the full ankle-to-web fan including its exact shared rigid boundary. Existing preparation tests own display omission, clamping and immutable snapshot lifetime; Viewer tests own emitted Float32 geometry, malformed handoff refusal and articulated drawing.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous CPU test owns fresh parameters and calibrations per case, imports the actual public Human entry, and starts no browser, process, GPU, dense skin or consumer installation. All cases and findings are collected before failure.
 */
export function test_human_foot_defaults(): void {
  const defects: string[] = [];
  const cases: IAutoMovieHumanParameters[] = [
    {
      body: { anatomy: { sex: AutoMovieHumanSex.Female, stature: 1700 } },
      head: HumanPeople.params("f1").head,
    },
    {
      body: { anatomy: { sex: AutoMovieHumanSex.Male, stature: 1800 } },
      head: HumanPeople.params("m1").head,
      extremities: {
        feet: {
          left: { footLength: 270, footBreadth: 102, ankleHeight: 73 },
          right: { footLength: 250, footBreadth: 94, ankleHeight: 68 },
        },
      },
    },
  ];
  for (const params of cases) {
    const label: string = `${params.body.anatomy.sex}/${params.body.anatomy.stature}`;
    try {
      const output: Skeleton.IOutput = Skeleton.prepare(params, {
        neckSurface: true,
        footSurface: true,
      })({});
      const body: IAutoMovieHumanBodyCalibration =
        AutoMovieHumanBodyLaw.calibrate(params).body;
      if (
        output.neckSurface === undefined ||
        output.footSurface === undefined
      ) {
        defects.push(`${label}: missing requested exterior`);
        continue;
      }
      for (const side of ["left", "right"] as const) {
        const foot: Foot.ISide = output.footSurface[side];
        const courses: Foot.ICourse[] = [
          ...foot.hindfoot.courses,
          ...foot.forefoot.courses,
        ];
        const chain: IAutoMovieHumanLoftChain = body.chains.find(
          (item: IAutoMovieHumanLoftChain): boolean =>
            item.name === `foot.${side}`,
        )!;
        if (
          foot.hindfoot.bone !== `${side}Subtalar` ||
          foot.forefoot.bone !== `${side}Midfoot` ||
          foot.hindfoot.courses.length < 2 ||
          foot.forefoot.courses.length < 2
        )
          defects.push(`${label}/${side}: lost articulated foot module`);
        for (const layer of chain.layers)
          if (
            !courses.some(
              (course: Foot.ICourse): boolean =>
                course.chain === chain.name && course.stationMm === layer.y,
            )
          )
            defects.push(
              `${label}/${side}/${layer.y}: missing principal foot station`,
            );
        for (const course of courses) {
          if (course.chain !== chain.name) {
            defects.push(`${label}/${side}: source outside its own foot fan`);
            continue;
          }
          const actual: Foot.Vector[] = Loft.ring(
            chain,
            course.stationMm,
            course.sourcePhases,
          );
          for (let index: number = 0; index < actual.length; index++)
            for (let axis: number = 0; axis < 3; axis++)
              if (
                !nclose(
                  course.points[index]![axis]!,
                  actual[index]![axis]! / 1000,
                  1e-12,
                )
              )
                defects.push(
                  `${label}/${side}/${course.stationMm}: changed source geometry`,
                );
        }

        // A dense independent scan can disprove a mislabeled course without
        // reproducing the source's phase bracketing or optimization method.
        for (const [landmark, bone] of [
          ["medialBall", "HalluxProximal"],
          ["lateralBall", "Toe5Proximal"],
        ] as const) {
          const centre: Foot.Vector = output.bones.find(
            (item: Skeleton.IBone): boolean => item.bone === `${side}${bone}`,
          )!.position;
          const address: Foot.ILandmark = foot.landmarks[landmark];
          const point: Foot.Vector =
            foot[address.module].courses[address.course]!.points[
              address.point
            ]!;
          const distance: number = Math.hypot(
            ...point.map(
              (value: number, axis: number): number => value - centre[axis]!,
            ),
          );
          let bound: number = Infinity;
          for (const course of foot.forefoot.courses) {
            const sample: (phase: number) => Foot.Vector = Loft.sampler(
              chain,
              course.stationMm,
            );
            for (let phase: number = 0; phase < 256; phase++) {
              const candidate: Foot.Vector = sample(
                (2 * Math.PI * phase) / 256,
              ).map((value: number): number => value / 1000) as Foot.Vector;
              if (candidate[1] <= centre[1])
                bound = Math.min(
                  bound,
                  Math.hypot(
                    ...candidate.map(
                      (value: number, axis: number): number =>
                        value - centre[axis]!,
                    ),
                  ),
                );
            }
          }
          if (
            address.module !== "forefoot" ||
            point[1] > centre[1] ||
            !Number.isFinite(distance) ||
            distance > bound + 1e-7
          )
            defects.push(
              `${label}/${side}/${landmark}: wrong plantar metatarsal course`,
            );
        }
      }
    } catch (error) {
      defects.push(`${label}: ${String(error)}`);
    }
  }
  TestValidator.equals(
    "public default anatomy preserves actual complete foot exteriors",
    defects,
    [],
  );
}

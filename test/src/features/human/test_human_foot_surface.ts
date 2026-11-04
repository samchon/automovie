import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanFootSurface as Foot } from "../../../../packages/human/src/generation/AutoMovieHumanFootSurface";
import type { AutoMovieHumanSkeletonLaw } from "../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanPeople } from "../internal/HumanPeople";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Original polygon feet retain real calcaneal/ball anatomy and source identity.
 *
 * Scenarios:
 *
 * 1. Female/male reference and stature-end bodies have a plantar heel posterior
 * to the ankle near the neutral floor, and medial/lateral balls below their MTPs.
 * 2. Every returned point reads back on its canonical source curve, all source
 * stations survive, the Midfoot course is identical across rigid modules, and
 * anatomical samples address actual ring vertices with truthful heights.
 * 3. Doubling the physical unit scale doubles every coordinate and extent,
 * without changing source addresses or the supported anatomy.
 * 4. Zero/negative/nonfinite scales refuse before publishing a descriptor.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual bilateral foot exteriors from four whole calibrated people and checks anatomical heel/MTP relations, physical scaling, source-point identity, source station retention, shared seam and real vertex landmark addresses. It catches an ankle-tube heel, missing hindfoot, moved or flattened source points, omitted courses, detached landmarks or stale side geometry.
 * @evidence contracts/testing.md#independent-expectations Standing anatomical neutral places the plantar heel at the floor, with the ankle above and anterior to the calcaneal contact; 2 mm uses the existing ISO 20685-1 foot-dimension tolerance. Hallux and fifth-MTP plantar skin lies below their own joint centres and medial/lateral ordering follows anatomy. Source evaluation and metre scaling are public coordinate/attachment contracts, not a second foot law. Height metadata is checked without asserting that all three named points bear weight or share a supporting plane; original emitted toes and actual contact admission remain Viewer/operator responsibilities.
 * @evidence contracts/testing.md#distinguishing-cases Covers both sides, female/male references and tall/short consistent whole people; all retained source courses and nonuniform critical phases, a unit-scale change, and invalid scale inputs. The prepared-foot test owns unchanged FK and frozen lifetime; actual polygon emission, posed articulation and full-foot support belong to Viewer and operator validation.
 * @evidence contracts/testing.md#execution-ownership This discoverable CPU unit reaches calibration already owned by HumanPeople and the renderer-free foot producer, starts no browser, GPU, process or dense skin generator, and audits every finding before failing.
 */
export function test_human_foot_surface(): void {
  const defects: string[] = [];
  for (const name of ["f1", "m1", "tall", "short"]) {
    const person: HumanPeople.IPerson = HumanPeople.person(name);
    const source: Foot.IOutput = Foot.derive(person.body, 0.001);
    const doubled: Foot.IOutput = Foot.derive(person.body, 0.002);
    for (const side of ["left", "right"] as const) {
      const own: Foot.ISide = source[side];
      const joint: (part: string) => AutoMovieHumanSkeletonLaw.IBone = (
        part: string,
      ): AutoMovieHumanSkeletonLaw.IBone =>
        person.body.skeleton!.find(
          (bone: AutoMovieHumanSkeletonLaw.IBone): boolean =>
            bone.bone === `${side}${part}`,
        )!;
      const actual: (landmark: Foot.Landmark) => Foot.Vector = (
        landmark: Foot.Landmark,
      ): Foot.Vector => {
        const address: Foot.ILandmark = own.landmarks[landmark];
        return own[address.module].courses[address.course]!.points[
          address.point
        ]!;
      };
      const heel: Foot.Vector = actual("plantarHeel");
      const medial: Foot.Vector = actual("medialBall");
      const lateral: Foot.Vector = actual("lateralBall");
      const ankle: Foot.Vector = joint("Foot").position;
      const toward: Foot.Vector = joint("Foot").toward;
      if (
        !(
          (heel[0] - ankle[0] / 1000) * (toward[0] - ankle[0]) +
            (heel[2] - ankle[2] / 1000) * (toward[2] - ankle[2]) <
          0
        )
      )
        defects.push(`${name}/${side}: heel is not posterior to its ankle`);
      if (!nclose(heel[1], 0, 0.002))
        defects.push(`${name}/${side}: neutral plantar heel height ${heel[1]}`);
      if (
        !(
          medial[1] <= joint("HalluxProximal").position[1] / 1000 &&
          lateral[1] <= joint("Toe5Proximal").position[1] / 1000
        )
      )
        defects.push(
          `${name}/${side}: ball samples are not plantar to their MTP centres`,
        );
      if (!((side === "left" ? 1 : -1) * (lateral[2] - medial[2]) > 0))
        defects.push(`${name}/${side}: medial/lateral ball order`);
      const hindSeam: Foot.ICourse = own.hindfoot.courses.at(-1)!;
      const frontSeam: Foot.ICourse = own.forefoot.courses[0]!;
      for (let point: number = 0; point < hindSeam.points.length; point++)
        for (let axis: number = 0; axis < 3; axis++)
          if (
            !nclose(
              hindSeam.points[point]![axis]!,
              frontSeam.points[point]![axis]!,
              0,
            )
          )
            defects.push(`${name}/${side}: independently changed Midfoot seam`);
      for (const module of ["hindfoot", "forefoot"] as const)
        own[module].courses.forEach(
          (course: Foot.ICourse, courseIndex: number): void => {
            const chain: IAutoMovieHumanLoftChain = person.body.chains.find(
              (item: IAutoMovieHumanLoftChain): boolean =>
                item.name === course.chain,
            )!;
            const measured: Foot.Vector[] = AutoMovieHumanLoftChain.ring(
              chain,
              course.stationMm,
              course.sourcePhases,
            );
            const scaled: Foot.ICourse =
              doubled[side][module].courses[courseIndex]!;
            if (
              course.points.length < 8 ||
              course.points.length !== measured.length ||
              !(course.depth > 0 && course.breadth > 0)
            )
              defects.push(
                `${name}/${side}/${course.chain}: source course health`,
              );
            for (let point: number = 0; point < measured.length; point++)
              for (let axis: number = 0; axis < 3; axis++)
                if (
                  !nclose(
                    course.points[point]![axis]!,
                    measured[point]![axis]! / 1000,
                    1e-12,
                  ) ||
                  !nclose(
                    scaled.points[point]![axis]!,
                    2 * course.points[point]![axis]!,
                    1e-12,
                  )
                )
                  defects.push(
                    `${name}/${side}/${course.chain}/${course.stationMm}: moved source point or wrong metre scaling`,
                  );
            if (
              !nclose(scaled.depth, 2 * course.depth, 1e-12) ||
              !nclose(scaled.breadth, 2 * course.breadth, 1e-12)
            )
              defects.push(`${name}/${side}: changed dimension scaling`);
          },
        );
      for (const chain of person.body.chains.filter(
        (item: IAutoMovieHumanLoftChain): boolean =>
          item.name === `foot.${side}`,
      ))
        for (const layer of chain.layers)
          if (
            ![...own.hindfoot.courses, ...own.forefoot.courses].some(
              (course: Foot.ICourse): boolean =>
                course.chain === chain.name && course.stationMm === layer.y,
            )
          )
            defects.push(
              `${name}/${side}/${chain.name}/${layer.y}: omitted canonical station`,
            );
      for (const landmark of [
        "plantarHeel",
        "medialBall",
        "lateralBall",
      ] as const)
        if (
          !nclose(own.support.landmarkHeights[landmark], actual(landmark)[1], 0)
        )
          defects.push(`${name}/${side}/${landmark}: false source height`);
    }
    for (const scale of [0, -1, NaN, Infinity])
      if (
        !throwsError((): void => {
          Foot.derive(person.body, scale);
        })
      )
        defects.push(`${name}: admitted invalid physical scale ${scale}`);
  }
  TestValidator.equals(
    "anatomical source foot and actual landmark identity",
    defects,
    [],
  );
}

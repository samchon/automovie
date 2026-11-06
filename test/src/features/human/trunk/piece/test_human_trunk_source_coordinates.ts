import {
  AutoMovieConstructionViews,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanChestWall } from "../../../../../../packages/human/src/generation/AutoMovieHumanChestWall";
import { AutoMovieHumanTrunkAxis } from "../../../../../../packages/human/src/generation/trunk/AutoMovieHumanTrunkAxis";
import { AutoMovieHumanSex } from "../../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * World back plus local radius share one parameter while world height keeps
 * its physical meaning; compressed thorax calipers supply only a skin-template ratio.
 *
 * Scenarios:
 * 1. Unequal back/radius knot lists reproduce a known quintic axis and both jets.
 * 2. Both nonzero poles, interior heights, world translation and metre replay agree.
 * 3. Incompatible spans refuse rather than constructing a substitute axis.
 * 4. Both retained thorax ratios close their ellipse tape without a rectangular box.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the production TrunkAxis through ConstructionViews.frame and ChestWall.box through the engine section-length owner. It catches fitting the axis in physical Y while the radius uses angle, lost normalized jets, recentering, double unit conversion and feasibility-only thorax sizing.
 * @evidence contracts/testing.md#independent-expectations Authored C(t)=10+5(10t^3-15t^4+6t^5), R(t)=40t(1-t), B=C-R and Y=bottom+height*sin(pi*t/2)^2 determine values and analytic first/second angle jets independently. The retained Heinz regression constants determine only B:D; actual ellipse perimeter must equal G within1e-6mm. These assertions establish construction identities, not skin anatomy or final loft fidelity.
 * @evidence contracts/testing.md#distinguishing-cases Different knot lists prevent point-only equality from hiding interpolation loss. Poles have nonzero X, interior queries include unlisted stations, X translation preserves jets, mismatched spans refuse, and female/male templates at three tapes distinguish the former minimum-feasibility rule.
 * @evidence contracts/testing.md#execution-ownership Synchronous CPU source units using f1 resolved inputs and analytic scalar records; no Human generation, private reference read, renderer, process or GPU.
 */
export function test_human_trunk_source_coordinates(): void {
  const defects: string[] = [];
  const bottom: number = 800;
  const height: number = 700;
  const station = (t: number): number =>
    bottom + height * Math.sin((Math.PI * t) / 2) ** 2;
  const c = (t: number): number =>
    10 + 5 * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5);
  const c1 = (t: number): number => 150 * t * t * (1 - t) ** 2;
  const c2 = (t: number): number => 300 * t * (1 - t) * (1 - 2 * t);
  const radius: IAutoMovieViewPart.IOutline = {
    range: { minimum: 0, maximum: null },
    knots: [0, 0.2, 0.7, 1].map(
      (t: number): IAutoMovieViewPart.IKnot => ({
        site: `r.${t}`,
        station: station(t),
        value: 40 * t * (1 - t),
        jet: { first: 40 - 80 * t, second: -80 },
      }),
    ),
  };
  const back: IAutoMovieViewPart.IOutline = {
    knots: [0, 0.35, 0.8, 1].map(
      (t: number): IAutoMovieViewPart.IKnot => ({
        site: `b.${t}`,
        station: station(t),
        value: c(t) - 40 * t * (1 - t),
        jet: { first: c1(t) - 40 + 80 * t, second: c2(t) + 80 },
      }),
    ),
  };
  for (const translation of [0, 577]) {
    const shifted: IAutoMovieViewPart.IOutline = {
      knots: back.knots.map(
        (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
          ...k,
          value: k.value + translation,
        }),
      ),
    };
    const built: AutoMovieHumanTrunkAxis.IResult | string =
      AutoMovieHumanTrunkAxis.create(shifted, radius, {
        bottom,
        top: bottom + height,
      });
    if (typeof built === "string") {
      defects.push(built);
      continue;
    }
    const axis: ReturnType<typeof AutoMovieConstructionViews.frame> =
      AutoMovieConstructionViews.frame(built.axis);
    if (typeof axis === "string") {
      defects.push(axis);
      continue;
    }
    const parameter: NonNullable<IAutoMovieViewPart.IOutline["parameter"]> = {
      type: "angle",
      bottom,
      top: bottom + height,
    };
    for (const t of [0, 0.1, 0.35, 0.5, 0.63, 0.8, 0.95, 1]) {
      const y: number = station(t);
      const frame: ReturnType<typeof axis.at> = axis.at(y);
      const jet: ReturnType<NonNullable<typeof axis.jet>> =
        axis.jet?.(y, parameter) ?? null;
      const positionMiss: number = Math.hypot(
        frame.origin[0] - c(t) - translation,
        frame.origin[1] - y,
        frame.origin[2],
      );
      if (positionMiss > 1e-9 || jet === null)
        defects.push(
          `Trunk common-parameter point/jet failed at ${t}: ${positionMiss}`,
        );
      else if (
        Math.abs(jet.value.origin[0] - c(t) - translation) > 1e-9 ||
        Math.abs(jet.first.origin[0] - c1(t) / Math.PI) > 1e-9 ||
        Math.abs(jet.second.origin[0] - c2(t) / Math.PI ** 2) > 1e-8 ||
        Math.abs(jet.first.origin[1] - (height * Math.sin(Math.PI * t)) / 2) >
          1e-8 ||
        Math.abs(jet.second.origin[1] - (height * Math.cos(Math.PI * t)) / 2) >
          1e-8
      )
        defects.push(`Trunk common-parameter derivatives failed at ${t}`);
    }
  }
  if (
    typeof AutoMovieHumanTrunkAxis.create(
      { knots: back.knots.slice(1) },
      radius,
      { bottom, top: bottom + height },
    ) !== "string"
  )
    defects.push("Mismatched back/radius spans were accepted");

  const measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve> =
    AutoMovieHumanBodyAnatomy.resolve(HumanPeople.params("f1"));
  for (const sex of [AutoMovieHumanSex.Female, AutoMovieHumanSex.Male])
    for (const girth of [600, 760, 1000]) {
      const box: ReturnType<typeof AutoMovieHumanChestWall.box> =
        AutoMovieHumanChestWall.box({ ...measures, sex }, girth);
      const expectedRatio: number =
        sex === AutoMovieHumanSex.Female
          ? (19.97 + 0.1828 * girth) / (74.78 + 0.2164 * girth)
          : (-2.46 + 0.2085 * girth) / (87.04 + 0.2104 * girth);
      const e: number = AutoMovieViewSection.ELLIPSE;
      const tape: number = AutoMovieViewSection.length(
        AutoMovieViewSection.of(
          {
            extents: [
              box.depth / 2,
              box.breadth / 2,
              box.depth / 2,
              box.breadth / 2,
            ],
          },
          [e, e, e, e],
        ),
      );
      if (
        !Number.isFinite(tape) ||
        Math.abs(tape - girth) > 1e-6 ||
        Math.abs(box.depth / box.breadth - expectedRatio) > 1e-12
      )
        defects.push(
          `Thorax ellipse/ratio failed for ${sex}, G${girth}: ${tape}`,
        );
    }
  if (defects.length !== 0)
    throw new Error(`Trunk source-coordinate findings:\n${defects.join("\n")}`);
}

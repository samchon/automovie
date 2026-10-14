import type { AutoMovieGuidePass } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";
import { namedFacts, nclose } from "../internal/predicates";

type ReviewView = {
  id: string;
  angleDeg: number;
  elevationDeg: number;
  pose: "rest" | "rom-extremes";
  pass: AutoMovieGuidePass;
};

/**
 * Load the declared view set from source without making it public API.
 *
 * The review coverage gate consumes these descriptors; the existing source-module hook reaches their retained compatibility barrel without adding package API.
 */
const unit: { autoMovieAssetReviewViews: (props: { rigged: boolean }) => ReviewView[] } = loadSourceModule<{
  autoMovieAssetReviewViews: (props: { rigged: boolean }) => Array<{
    id: string;
    angleDeg: number;
    elevationDeg: number;
    pose: "rest" | "rom-extremes";
    pass: AutoMovieGuidePass;
  }>;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/assetReviewViews.ts",
  ),
);
const autoMovieAssetReviewViews: typeof unit.autoMovieAssetReviewViews = unit.autoMovieAssetReviewViews;

/**
 * The retained review protocol requires six face directions, two opposing obliques and a separate outline pass. A rig adds its extreme-range pose without displacing those obligations. Descriptors state the required sampled population; they do not capture a frame or prove complete visibility of occluded detail.
 *
 * Scenarios:
 *
 * 1. A rigless model owes exactly nine views, in canonical order, at the exact
 *    angles, elevations, poses and passes the contract states.
 * 2. The four horizontal faces are taken at zero elevation and a quarter turn
 *    apart, which is what makes them face views rather than raised quarters.
 * 3. The poles share one azimuth at opposite elevations inside the retained protocol's [-85,85] interval.
 * 4. The two obliques share an elevation and stand exactly a half turn apart.
 * 5. No two views name the same id, and no two ask for the same azimuth,
 *    elevation, pose and pass, so no view in the set is another one twice.
 * 6. Every descriptor azimuth is inside [0,360); actual capture admission is not run here.
 * 7. A rigged model owes the same nine plus its extreme-range pose, and nothing
 *    in the rest-pose set moves to make room for it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production descriptor factory and checks exact ordered view identity, numeric directions, pose/pass membership, uniqueness, admitted angle intervals and additive rig coverage, catching shifted, duplicated or displaced required views.
 * @evidence contracts/testing.md#independent-expectations The retained nine-view review protocol independently supplies literal ids, directions, poses and passes; the rig adds one authored ROM obligation. Descriptor equality does not prove physical capture, renderer limits or visible asset quality, and byte-equivalent rest serialization is a supplemental preservation check.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts rigless nine and rigged ten descriptors, straight horizontal faces, symmetric poles, opposite obliques and separate outline, with uniqueness/range boundaries; current resident receipts and required-pass satisfaction belong to the review gate's units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit reaches the consumed factory through the existing source loader and owns all assertions directly; it starts no capture, browser, GPU, filesystem project or dynamic case.
 */
export function test_production_asset_review_view_set(): void {
  const rest: ReviewView[] = autoMovieAssetReviewViews({ rigged: false });
  const expected: ReadonlyArray<readonly [string, number, number, ReviewView["pose"], AutoMovieGuidePass]> = [
    ["turntable-front", 0, 0, "rest", "beauty"],
    ["turntable-right", 90, 0, "rest", "beauty"],
    ["turntable-back", 180, 0, "rest", "beauty"],
    ["turntable-left", 270, 0, "rest", "beauty"],
    ["turntable-top", 0, 85, "rest", "beauty"],
    ["turntable-bottom", 0, -85, "rest", "beauty"],
    ["oblique-front-right-top", 45, 30, "rest", "beauty"],
    ["oblique-rear-left-top", 225, 30, "rest", "beauty"],
    ["top-outline", 0, 65, "rest", "outline"],
  ];

  TestValidator.equals(
    "a rigless model owes the six faces, two obliques and the outline pass",
    rest.map((view: ReviewView): readonly [string, ReviewView["pose"], AutoMovieGuidePass] => [view.id, view.pose, view.pass]),
    expected.map((view: (typeof expected)[number]): readonly [string, ReviewView["pose"], AutoMovieGuidePass] => [view[0], view[3], view[4]]),
  );
  TestValidator.predicate(
    "every required view retains its exact authored numeric direction",
    rest.every((view: ReviewView, index: number): boolean =>
      nclose(view.angleDeg, expected[index]![1], 0) &&
      nclose(view.elevationDeg, expected[index]![2], 0)),
  );

  TestValidator.equals(
    "the set closes every axis and repeats no view",
    namedFacts([
      [
        "the four horizontal faces are straight on, a quarter turn apart",
        (): boolean =>
          [0, 90, 180, 270].every(
            (angleDeg: number, index: number): boolean =>
              nclose(rest[index]!.angleDeg, angleDeg, 0) &&
              nclose(rest[index]!.elevationDeg, 0, 0),
          ),
      ],
      [
        "the poles are one azimuth at opposite elevations",
        (): boolean =>
          nclose(rest[4]!.angleDeg, rest[5]!.angleDeg, 0) &&
          nclose(rest[4]!.elevationDeg, -rest[5]!.elevationDeg, 0),
      ],
      [
        "and every elevation is inside the interval capture will accept",
        (): boolean =>
          rest.every(
            (view: ReviewView): boolean => view.elevationDeg >= -85 && view.elevationDeg <= 85,
          ),
      ],
      [
        "the two obliques stand a half turn apart at one elevation",
        (): boolean =>
          nclose(rest[6]!.elevationDeg, rest[7]!.elevationDeg, 0) &&
          nclose(Math.abs(rest[7]!.angleDeg - rest[6]!.angleDeg), 180, 0),
      ],
      [
        "every azimuth is inside the interval capture will accept",
        (): boolean => rest.every((view: ReviewView): boolean => view.angleDeg >= 0 && view.angleDeg < 360),
      ],
      [
        "no id repeats",
        (): boolean => new Set(rest.map((view: ReviewView): string => view.id)).size === rest.length,
      ],
      [
        "and no two views ask for the same picture",
        (): boolean =>
          new Set(
            rest.map((view: ReviewView): string =>
              JSON.stringify([
                view.angleDeg,
                view.elevationDeg,
                view.pose,
                view.pass,
              ]),
            ),
          ).size === rest.length,
      ],
    ]),
    {
      "the four horizontal faces are straight on, a quarter turn apart": true,
      "the poles are one azimuth at opposite elevations": true,
      "and every elevation is inside the interval capture will accept": true,
      "the two obliques stand a half turn apart at one elevation": true,
      "every azimuth is inside the interval capture will accept": true,
      "no id repeats": true,
      "and no two views ask for the same picture": true,
    },
  );

  const rigged: ReviewView[] = autoMovieAssetReviewViews({ rigged: true });

  TestValidator.equals(
    "a rig adds its extreme range without displacing a shape view",
    {
      added: rigged
        .slice(rest.length)
        .map((view: ReviewView): readonly [string, ReviewView["pose"], AutoMovieGuidePass] => [view.id, view.pose, view.pass]),
      restUnchanged:
        JSON.stringify(rigged.slice(0, rest.length)) === JSON.stringify(rest),
    },
    {
      added: [["rig-rom-extremes", "rom-extremes", "beauty"]],
      restUnchanged: true,
    },
  );
}

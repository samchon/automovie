import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieAnalysisSolid,
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieHalfSpacePlane,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { analysisContext, boxSolid } from "./analysisFixtures";
import { hasViolation, namedFacts, nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_environment_context.
 *
 * Scenarios:
 * 1. the declared site validates clean.
 * 2. an instant is found by id and absent ids read as null.
 * 3. context occluders convert to analysis solids without gaining ownership.
 * 4. every declared field of the context has a refusing twin.
 *
 * The independently authored site fields are the valid baseline, exact id lookup returns its named instant or null, and solid projection preserves id plus plane count while dropping kind. Nonblank/unique/range/time-order requirements determine each located mutation fault; no external weather or ownership is inferred from copied metadata.
 * Valid site, present/absent instant and one declared neighbouring box contrast with blank labels, duplicate ids, zero axes, invalid time order/illuminance/humidity. Later parts own reserved ids, horizon and analytic rays.
 */
export function assertAnalysisEnvironmentContextPart1(): {
  context: IAutoMovieEnvironmentContext;
  neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] };
  occluded: IAutoMovieEnvironmentContext;
  broken: (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ) => ReturnType<typeof AutoMovieEngineEnvironment.validateContext>;
  instantOf: (
    index: number,
    patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
  ) => IAutoMovieEnvironmentContext["instants"];
} {
  const context: IAutoMovieEnvironmentContext = analysisContext();
  TestValidator.equals(
    "the declared site validates clean",
    AutoMovieEngineEnvironment.validateContext({ context }),
    { success: true },
  );
  TestValidator.equals(
    "an instant is found by id and absent ids read as null",
    [
      AutoMovieEngineEnvironment.instant(context, "noon")?.label,
      AutoMovieEngineEnvironment.instant(context, "dawn"),
    ],
    ["equinox-1200", null],
  );

  const neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] } =
    boxSolid("neighbour", { x: 2, y: 0, z: -2 }, { x: 4, y: 10, z: 2 });
  const occluded: IAutoMovieEnvironmentContext = analysisContext({
    occluders: [{ ...neighbour, kind: "neighbour-tower" }],
  });
  TestValidator.predicate(
    "context occluders convert to analysis solids without gaining ownership",
    ((): boolean => {
      const observed: (string | number)[][] = AutoMovieEngineEnvironment.contextSolids(
        occluded,
      ).map((solid: IAutoMovieAnalysisSolid): (string | number)[] => [
        solid.id,
        solid.planes.length,
      ]);
      return (
        Array.isArray(observed) &&
        observed.length === 1 &&
        Array.isArray(observed[0]!) &&
        observed[0]!.length === 2 &&
        observed[0]![0] === "neighbour" &&
        typeof observed[0]![1]! === "number" &&
        nclose(observed[0]![1]!, 6)
      );
    })(),
  );

  const broken: (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ) => ReturnType<typeof AutoMovieEngineEnvironment.validateContext> = (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ): ReturnType<typeof AutoMovieEngineEnvironment.validateContext> =>
    AutoMovieEngineEnvironment.validateContext({
      context: analysisContext(overrides),
    });
  const instantOf: (
    index: number,
    patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
  ) => IAutoMovieEnvironmentContext["instants"] = (
    index: number,
    patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
  ): IAutoMovieEnvironmentContext["instants"] => {
    const instants: IAutoMovieEnvironmentInstant[] = analysisContext().instants;
    instants[index] = { ...instants[index]!, ...patch };
    return instants;
  };
  TestValidator.equals(
    "every declared field of the context has a refusing twin",
    namedFacts([
      [
        "zero north",
        (): boolean =>
          hasViolation(
            broken({ north: { x: 0, y: 0, z: 0 } }),
            "range",
            "north",
          ),
      ],
      [
        "zero ground up",
        (): boolean =>
          hasViolation(
            broken({ ground: { up: { x: 0, y: 0, z: 0 }, elevation: 0 } }),
            "range",
            "ground.up",
          ),
      ],
      [
        "blank instant label",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(0, { label: "" }) }),
            "type",
            "instants[0].label",
          ),
      ],
      [
        "duplicate instant id",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(1, { id: "noon" }) }),
            "type",
            "instants[1].id",
          ),
      ],
      [
        "non-increasing instant time",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(1, { time: -10 }) }),
            "range",
            "instants[1].time",
          ),
      ],
      [
        "zero sun",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(0, { sun: { x: 0, y: 0, z: 0 } }) }),
            "range",
            "instants[0].sun",
          ),
      ],
      [
        "negative beam",
        (): boolean =>
          hasViolation(
            broken({
              instants: instantOf(0, { directNormalIlluminance: -1 }),
            }),
            "range",
            "instants[0].directNormalIlluminance",
          ),
      ],
      [
        "negative sky",
        (): boolean =>
          hasViolation(
            broken({
              instants: instantOf(0, { diffuseHorizontalIlluminance: -5 }),
            }),
            "range",
            "instants[0].diffuseHorizontalIlluminance",
          ),
      ],
      [
        "out of range humidity",
        (): boolean =>
          hasViolation(
            broken({
              instants: instantOf(0, { outdoorRelativeHumidity: 1.5 }),
            }),
            "range",
            "instants[0].outdoorRelativeHumidity",
          ),
      ],
    ]),
    {
      "zero north": true,
      "zero ground up": true,
      "blank instant label": true,
      "duplicate instant id": true,
      "non-increasing instant time": true,
      "zero sun": true,
      "negative beam": true,
      "negative sky": true,
      "out of range humidity": true,
    },
  );
  return { context, neighbour, occluded, broken, instantOf };
}

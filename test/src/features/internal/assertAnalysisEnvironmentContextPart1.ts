import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieEnvironmentInstant,
  IAutoMovieHalfSpacePlane,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieAnalysisSolid } from "../../../../packages/engine/src/analysis/IAutoMovieAnalysisSolid";
import { autoMovieContextSolids } from "../../../../packages/engine/src/analysis/autoMovieContextSolids";
import { autoMovieEnvironmentInstant } from "../../../../packages/engine/src/analysis/autoMovieEnvironmentInstant";
import { validateAutoMovieEnvironmentContext } from "../../../../packages/engine/src/analysis/validateAutoMovieEnvironmentContext";
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
 * The independently authored site fields are the valid baseline, exact id lookup returns its named instant or null, and solid projection preserves id plus plane count while dropping kind. Version/unit/nonblank/finite/range/time-order requirements determine each located mutation fault; no external weather or ownership is inferred from copied metadata.
 * Valid site, present/absent instant and one declared neighbouring box contrast with wrong version/units, blank/duplicate ids, zero/nonfinite axes, invalid elevation/time/illuminance/temperature/humidity. Later parts own reserved ids, horizon and analytic rays; the parent owns resident-slot regressions.
 */
export function assertAnalysisEnvironmentContextPart1(): {
  context: IAutoMovieEnvironmentContext;
  neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] };
  occluded: IAutoMovieEnvironmentContext;
  broken: (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ) => ReturnType<typeof validateAutoMovieEnvironmentContext>;
  instantOf: (
    index: number,
    patch: Partial<IAutoMovieEnvironmentContext["instants"][number]>,
  ) => IAutoMovieEnvironmentContext["instants"];
} {
  const context: IAutoMovieEnvironmentContext = analysisContext();
  TestValidator.equals(
    "the declared site validates clean",
    validateAutoMovieEnvironmentContext({ context }),
    { success: true },
  );
  TestValidator.equals(
    "an instant is found by id and absent ids read as null",
    [
      autoMovieEnvironmentInstant(context, "noon")?.label,
      autoMovieEnvironmentInstant(context, "dawn"),
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
      const observed: (string | number)[][] = autoMovieContextSolids(
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
  ) => ReturnType<typeof validateAutoMovieEnvironmentContext> = (
    overrides: Partial<IAutoMovieEnvironmentContext>,
  ): ReturnType<typeof validateAutoMovieEnvironmentContext> =>
    validateAutoMovieEnvironmentContext({
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
        "version",
        (): boolean =>
          hasViolation(
            broken({ version: 2 as unknown as 1 }),
            "type",
            "version",
          ),
      ],
      [
        "units",
        (): boolean =>
          hasViolation(
            broken({ units: "foot" as unknown as "meter" }),
            "type",
            "$input.units",
          ),
      ],
      [
        "blank id",
        (): boolean => hasViolation(broken({ id: "  " }), "type", "$input.id"),
      ],
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
        "non-finite north",
        (): boolean =>
          hasViolation(
            broken({ north: { x: Number.NaN, y: 0, z: -1 } }),
            "range",
            "north.x",
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
        "non-finite elevation",
        (): boolean =>
          hasViolation(
            broken({
              ground: { up: { x: 0, y: 1, z: 0 }, elevation: Number.NaN },
            }),
            "range",
            "ground.elevation",
          ),
      ],
      [
        "blank instant id",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(0, { id: " " }) }),
            "type",
            "instants[0].id",
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
        "non-finite instant time",
        (): boolean =>
          hasViolation(
            broken({ instants: instantOf(0, { time: Number.NaN }) }),
            "range",
            "instants[0].time",
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
        "non-finite beam",
        (): boolean =>
          hasViolation(
            broken({
              instants: instantOf(0, { directNormalIlluminance: Number.NaN }),
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
        "non-finite outdoor temperature",
        (): boolean =>
          hasViolation(
            broken({
              instants: instantOf(0, { outdoorAirTemperature: Number.NaN }),
            }),
            "range",
            "instants[0].outdoorAirTemperature",
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
      version: true,
      units: true,
      "blank id": true,
      "zero north": true,
      "non-finite north": true,
      "zero ground up": true,
      "non-finite elevation": true,
      "blank instant id": true,
      "blank instant label": true,
      "duplicate instant id": true,
      "non-finite instant time": true,
      "non-increasing instant time": true,
      "zero sun": true,
      "negative beam": true,
      "non-finite beam": true,
      "negative sky": true,
      "non-finite outdoor temperature": true,
      "out of range humidity": true,
    },
  );
  return { context, neighbour, occluded, broken, instantOf };
}

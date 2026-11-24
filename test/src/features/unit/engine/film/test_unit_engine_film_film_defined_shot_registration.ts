import { compileDefinedShot, defineShot } from "@automovie/engine";
import {
  type IAutoMovieAuthoringDiagnostic,
  type IAutoMovieCompiledDefinedShot,
  IAutoMovieDefinedShot,
  type IAutoMovieEngineShotRuntime,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../../internal/predicates";

/**
 * The host capabilities the boundary carries.
 *
 * Every case here fails before the runtime is read -- a throwing builder -- so
 * the shape only has to exist.
 */
const runtime: () => IAutoMovieEngineShotRuntime =
  (): IAutoMovieEngineShotRuntime =>
    ({
      frameFormat: { width: 1920, height: 1080 },
      skeleton: (): null => null,
      synthesize: (): null => null,
    }) as unknown as IAutoMovieEngineShotRuntime;

/** A registration the boundary accepts, so a case breaks one field only. */
const registered: (
  overrides?: Record<string, unknown>,
) => IAutoMovieDefinedShot<null> = (
  overrides: Record<string, unknown> = {},
): IAutoMovieDefinedShot<null> =>
  ({
    ...defineShot<null>("opening", {
      scene: "sc",
      contract: { beat: "b1" },
      build: (): {} => ({}),
    } as never),
    ...overrides,
  }) as unknown as IAutoMovieDefinedShot<null>;

const compile: (
  shot: IAutoMovieDefinedShot<null>,
) => IAutoMovieCompiledDefinedShot = (
  shot: IAutoMovieDefinedShot<null>,
): IAutoMovieCompiledDefinedShot =>
  compileDefinedShot({ shot, context: null, runtime: runtime() });

const codes: (compiled: IAutoMovieCompiledDefinedShot) => string[] = (
  compiled: IAutoMovieCompiledDefinedShot,
): string[] =>
  compiled.success === true
    ? []
    : compiled.diagnostics.map(
        (
          diagnostic: IAutoMovieAuthoringDiagnostic,
        ): IAutoMovieAuthoringDiagnostic["code"] => diagnostic.code,
      );

/**
 * Shot builder throws remain structured compilation diagnostics.
 *
 * Scenarios:
 * 1. A throwing builder becomes builder-failed carrying its thrown text.
 * 2. Re-registering preserves the new argument id.
 */
export function test_unit_engine_film_film_defined_shot_registration(): void {
  const thrown: IAutoMovieCompiledDefinedShot = compile(
    registered({
      build: (): never => {
        throw new Error("opening source failure");
      },
    }),
  );
  TestValidator.equals(
    "the shot boundary reports author mistakes as diagnostics, never as stacks",
    namedFacts([
      [
        "aThrowingBuilderBecomesBuilderFailed",
        (): boolean => codes(thrown).join(",") === "builder-failed",
      ],
      [
        "theBuilderFailureCarriesItsText",
        (): boolean =>
          thrown.success === false &&
          thrown.diagnostics[0]!.fact.includes("opening source failure"),
      ],
      [
        "theRegistrationIdOutranksTheDefinitionId",
        (): boolean =>
          defineShot<null>("renamed", registered()).id === "renamed",
      ],
    ]),
    {
      aThrowingBuilderBecomesBuilderFailed: true,
      theBuilderFailureCarriesItsText: true,
      theRegistrationIdOutranksTheDefinitionId: true,
    },
  );
}
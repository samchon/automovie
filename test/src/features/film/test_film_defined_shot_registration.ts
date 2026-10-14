import { IAutoMovieDefinedShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieAuthoringDiagnostic, IAutoMovieCompiledDefinedShot, IAutoMovieShotRuntime, compileDefinedShot, defineShot } from "@automovie/engine";




import { namedFacts } from "../internal/predicates";

/**
 * The host capabilities the boundary carries.
 *
 * Every case here fails before the runtime is read -- registration, a throwing
 * boundary, a throwing builder -- so the shape only has to exist.
 */
const runtime: () => IAutoMovieShotRuntime = (): IAutoMovieShotRuntime =>
  ({
    frameFormat: { width: 1920, height: 1080 },
    skeleton: (): null => null,
    synthesize: (): null => null,
  }) as unknown as IAutoMovieShotRuntime;

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

const paths: (compiled: IAutoMovieCompiledDefinedShot) => string[] = (
  compiled: IAutoMovieCompiledDefinedShot,
): string[] =>
  compiled.success === true
    ? []
    : compiled.diagnostics.map(
        (diagnostic: IAutoMovieAuthoringDiagnostic): string => diagnostic.path,
      );

/**
 * Shot registration faults and builder throws remain structured compilation diagnostics.
 *
 * Scenarios:
 * 1. Blank id, scene and contract beat identify their fields; three blanks produce three diagnostics.
 * 2. A missing contract becomes pipeline-failed at $shot, and a throwing builder becomes builder-failed carrying its thrown text.
 * 3. Re-registering preserves the new argument id, including refusal of a blank new id.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls defineShot and compileDefinedShot and observes diagnostic codes, paths, counts and thrown text, catching an overwritten registration address or an exception escaping these early boundaries.
 * @evidence contracts/testing.md#independent-expectations The registration contract requires nonblank addresses and gives the explicit id argument precedence; exception translation names registration or build. Expected paths and messages are authored literals, not output snapshots. The partial runtime is never read by these failing phases.
 * @evidence contracts/testing.md#distinguishing-cases Covers separate and combined blank fields, a missing contract, a throwing builder and valid/blank re-registration ids. Successful staging, performance and continuity are exercised by the defined-shot tests; this entry does not execute those later phases.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable entry owns its named facts and calls portable engine source; namedFacts evaluates in order and stops at its first false fact. It starts no host, renderer or generated project.
 */
export function test_film_defined_shot_registration(): void {
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
        "blankIdIsRegistrationInvalid",
        (): boolean => {
          const compiled: IAutoMovieCompiledDefinedShot = compile(
            registered({ id: "  " }),
          );
          return (
            codes(compiled).join(",") === "registration-invalid" &&
            paths(compiled).join(",") === "$shot.id"
          );
        },
      ],
      [
        "blankSceneIsRegistrationInvalid",
        (): boolean =>
          paths(compile(registered({ scene: "" }))).join(",") === "$shot.scene",
      ],
      [
        "blankBeatIsRegistrationInvalid",
        (): boolean =>
          paths(compile(registered({ contract: { beat: " " } }))).join(",") ===
          "$shot.contract.beat",
      ],
      [
        "everyBlankFieldIsReported",
        (): boolean =>
          paths(
            compile(registered({ id: "", scene: "", contract: { beat: "" } })),
          ).length === 3,
      ],
      [
        "aThrowingBoundaryBecomesPipelineFailed",
        (): boolean => {
          const compiled: IAutoMovieCompiledDefinedShot = compile(
            registered({ contract: undefined }) as IAutoMovieDefinedShot<null>,
          );
          return (
            codes(compiled).join(",") === "pipeline-failed" &&
            paths(compiled).join(",") === "$shot"
          );
        },
      ],
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
      [
        "aBlankReregisteredIdIsRegistrationInvalid",
        (): boolean =>
          paths(compile(defineShot<null>(" ", registered()))).join(",") ===
          "$shot.id",
      ],
    ]),
    {
      blankIdIsRegistrationInvalid: true,
      blankSceneIsRegistrationInvalid: true,
      blankBeatIsRegistrationInvalid: true,
      everyBlankFieldIsReported: true,
      aThrowingBoundaryBecomesPipelineFailed: true,
      aThrowingBuilderBecomesBuilderFailed: true,
      theBuilderFailureCarriesItsText: true,
      theRegistrationIdOutranksTheDefinitionId: true,
      aBlankReregisteredIdIsRegistrationInvalid: true,
    },
  );
}

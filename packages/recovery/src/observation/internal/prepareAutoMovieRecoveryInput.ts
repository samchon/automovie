import type {
  IAutoMovieRecoveryPreparedInput,
  IAutoMovieRecoveryRegisteredInput,
  IAutoMovieRecoveryRegistration,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

/*
 * Prepare already evaluated, registered indexed triangles for the observation
 * API: the declared registration and arrays are borrowed as they are. The
 * caller owns loading and evaluation. For GLB/glTF inputs, first use ingest's
 * `AutoMovieIngestExternalModel.inspectBytes` for bytes/profile/sidecars; its validation
 * facts alone are not evaluated positions. This operation borrows
 * geometry and policy and performs no transform, decoder, fitting, repair or
 * normal copying.
 */
export function prepareAutoMovieRecoveryInput(
  input: IAutoMovieRecoveryRegisteredInput,
): IAutoMovieRecoveryResult<IAutoMovieRecoveryPreparedInput> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "registered-triangles-v1";
  const registration: IAutoMovieRecoveryRegistration = input.registration;
  return {
    operator,
    status: "complete",
    value: {
      observation: {
        ...input.policy,
        verticesMm: input.verticesMm,
        triangles: input.triangles,
      },
      registration,
    },
    diagnostics: registration.uncertainty.slice(),
  };
}

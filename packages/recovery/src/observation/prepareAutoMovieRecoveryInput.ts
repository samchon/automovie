import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryPreparedInput,
  IAutoMovieRecoveryRegisteredInput,
  IAutoMovieRecoveryRegistration,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

/**
 * Admit already evaluated, registered indexed triangles for the observation
 * API. The caller owns loading and evaluation. For GLB/glTF inputs, first use
 * ingest's inspectAutoMovieExternalModelBytes for bytes/profile/sidecars; its
 * validation facts alone are not evaluated positions. This operation borrows
 * geometry and policy and performs no transform, decoder, fitting, repair or
 * normal copying.
 */
export function prepareAutoMovieRecoveryInput(
  input: IAutoMovieRecoveryRegisteredInput,
): IAutoMovieRecoveryResult<IAutoMovieRecoveryPreparedInput> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "registered-triangles-v1";
  const registration: IAutoMovieRecoveryRegistration | undefined =
    input?.registration;
  const finiteTuple: (value: unknown, length: number) => boolean = (
    value: unknown,
    length: number,
  ): boolean => {
    if (!Array.isArray(value) || value.length !== length) return false;
    for (let i: number = 0; i < length; i++)
      if (!Number.isFinite(value[i])) return false;
    return true;
  };
  const stringList: (value: unknown) => boolean = (value: unknown): boolean => {
    if (!Array.isArray(value)) return false;
    for (const item of value) if (typeof item !== "string") return false;
    return true;
  };
  if (
    !registration ||
    registration.units !== "mm" ||
    registration.handedness !== "right-handed" ||
    typeof registration.frame !== "string" ||
    !registration.frame.trim() ||
    typeof registration.evaluatedPose !== "string" ||
    !registration.evaluatedPose.trim() ||
    registration.componentPolicy !== "all-evaluated" ||
    !stringList(registration.uncertainty) ||
    !finiteTuple(registration.sourceToRegistered, 16)
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "Explicit supported millimetre registration, evaluated pose, component policy and finite applied transform are required",
      ],
    };
  if (
    !Array.isArray(input.verticesMm) ||
    !input.verticesMm.length ||
    !Array.isArray(input.triangles) ||
    !input.triangles.length
  )
    return {
      operator,
      status: "refused",
      diagnostics: [
        "Nonempty evaluated position and triangle arrays are required",
      ],
    };
  for (let i: number = 0; i < input.verticesMm.length; i++) {
    const point: IAutoMovieRecoveryInput["verticesMm"][number] =
      input.verticesMm[i]!;
    if (!finiteTuple(point, 3))
      return {
        operator,
        status: "refused",
        diagnostics: [`verticesMm[${i}] must be a finite millimetre triple`],
      };
  }
  for (let i: number = 0; i < input.triangles.length; i++) {
    const face: IAutoMovieRecoveryInput["triangles"][number] =
      input.triangles[i]!;
    if (
      !Array.isArray(face) ||
      face.length !== 3 ||
      [0, 1, 2].some(
        (slot: number): boolean =>
          !Number.isSafeInteger(face[slot]) ||
          face[slot]! < 0 ||
          face[slot]! >= input.verticesMm.length,
      )
    )
      return {
        operator,
        status: "refused",
        diagnostics: [`triangles[${i}] must address three existing vertices`],
      };
  }
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

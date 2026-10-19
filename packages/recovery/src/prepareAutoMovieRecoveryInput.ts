import type { IAutoMovieRecoveryInput, IAutoMovieRecoveryRegistration } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";

/**
 * Admit already evaluated, registered indexed triangles for the observation API.
 * The caller owns loading and evaluation. For GLB/glTF inputs, first use ingest's
 * inspectAutoMovieExternalModelBytes for bytes/profile/sidecars; its validation
 * facts alone are not evaluated positions. This operation borrows geometry and
 * policy and performs no transform, decoder, fitting, repair or normal copying.
 *
 * @evidence contracts/common.md#principled-implementation Explicit registration metadata and complete finite/index scans admit the evaluated triangle population without interpreting container facts as geometry.
 * @evidence contracts/common.md#clear-and-simple-design Host evaluation and registration are separated from numerical observation while the public input shares one interface owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame, unit, pose, component, visibility or transform is inferred and no invalid index is repaired.
 * @evidence contracts/common.md#meaningful-documentation States the ingest handoff, borrowed ownership, validation scope and absence of coordinate conversion.
 * @evidence contracts/performance.md#efficient-algorithms Admission visits V vertices and T triangles once with constant auxiliary storage, excluding returned diagnostic text.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted arrays are borrowed rather than copied, refitted or decoded again; their caller must keep them stable during observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No handle, worker or cache is acquired; the returned observation record borrows geometry and registration from the caller.
 */
export function prepareAutoMovieRecoveryInput(input: {
  registration: IAutoMovieRecoveryRegistration;
  verticesMm: IAutoMovieRecoveryInput["verticesMm"];
  triangles: IAutoMovieRecoveryInput["triangles"];
  policy: Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles">;
}): IAutoMovieRecoveryOperation.Result<{
  observation: IAutoMovieRecoveryInput;
  registration: IAutoMovieRecoveryRegistration;
}> {
  const schema: IAutoMovieRecoveryOperation.Result<never>["schema"] = "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<never>["operator"] = "registered-triangles-v1";
  const registration: IAutoMovieRecoveryRegistration | undefined = input?.registration;
  const finiteTuple: (value: unknown, length: number) => boolean = (value: unknown, length: number): boolean => {
    if (!Array.isArray(value) || value.length !== length) return false;
    for (let i: number = 0; i < length; i++) if (!Number.isFinite(value[i])) return false;
    return true;
  };
  const stringList: (value: unknown) => boolean = (value: unknown): boolean => {
    if (!Array.isArray(value)) return false;
    for (const item of value) if (typeof item !== "string") return false;
    return true;
  };
  if (
    !registration || registration.schema !== "automovie-recovery-registration-v1" ||
    registration.units !== "mm" || registration.handedness !== "right-handed" ||
    typeof registration.frame !== "string" || !registration.frame.trim() ||
    typeof registration.evaluatedPose !== "string" || !registration.evaluatedPose.trim() ||
    registration.componentPolicy !== "all-evaluated" ||
    !stringList(registration.uncertainty) ||
    !finiteTuple(registration.sourceToRegistered, 16)
  ) return { schema, operator, status: "refused", diagnostics: ["Explicit supported millimetre registration, evaluated pose, component policy and finite applied transform are required"] };
  if (!Array.isArray(input.verticesMm) || !input.verticesMm.length || !Array.isArray(input.triangles) || !input.triangles.length)
    return { schema, operator, status: "refused", diagnostics: ["Nonempty evaluated position and triangle arrays are required"] };
  for (let i: number = 0; i < input.verticesMm.length; i++) {
    const point: IAutoMovieRecoveryInput["verticesMm"][number] = input.verticesMm[i]!;
    if (!finiteTuple(point, 3))
      return { schema, operator, status: "refused", diagnostics: [
        `verticesMm[${i}] must be a finite millimetre triple`,
      ] };
  }
  for (let i: number = 0; i < input.triangles.length; i++) {
    const face: IAutoMovieRecoveryInput["triangles"][number] = input.triangles[i]!;
    if (!Array.isArray(face) || face.length !== 3 || [0, 1, 2].some((slot: number): boolean => !Number.isSafeInteger(face[slot]) || face[slot]! < 0 || face[slot]! >= input.verticesMm.length))
      return { schema, operator, status: "refused", diagnostics: [`triangles[${i}] must address three existing vertices`] };
  }
  return { schema, operator, status: "complete", value: {
    observation: { ...input.policy, verticesMm: input.verticesMm, triangles: input.triangles },
    registration,
  }, diagnostics: registration.uncertainty.slice() };
}

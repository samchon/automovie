import type { IAutoMovieBicubicAtlasGeometry } from "../../../interface/src/model/IAutoMovieBicubicAtlasGeometry";

/**
 * Admit the global recipe and identify its structurally usable patch occurrences.
 * Invalid coefficient or canonical-boundary declarations omit only incident patches and retain
 * exact diagnostics; valid independent patches remain available for display.
 * Producer source-fit qualifications are retained as diagnostics independently
 * of structural completeness and never suppress finite usable patches.
 * An empty declared patch array is an explicit incomplete generated domain.
 *
 * @evidence contracts/common.md#principled-implementation Global identity and budgets admit the recipe; dense finite controls, unique sixteen-index patches and admitted canonical declarations select usable incident primitives without inferring topology or embedding.
 * @evidence contracts/common.md#clear-and-simple-design Engine validation and realization share one structural admission owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld, coefficient repair, relaxed budget or source geometry substitution occurs.
 * @evidence contracts/common.md#meaningful-documentation States global refusal, local primitive omission, retained diagnostics and the absence of geometric quality certification.
 * @evidence contracts/performance.md#efficient-algorithms Linear passes admit C controls, sixteen references per P patches and A authorities/B bindings; sorting U retained control IDs adds O(U log U).
 * @evidence contracts/performance.md#reuse-equivalent-work This pure call owns no cross-request cache; realization invokes it before allocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local identity sets expire on return or refusal; admitted patch, control and boundary arrays transfer to the caller and grow only with the input declarations.
 */
export function admitAutoMovieBicubicAtlas(
  input: IAutoMovieBicubicAtlasGeometry,
): {
  patches: number[];
  controls: number[];
  diagnostics: string[];
  boundaryAuthorities: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
  >;
  boundaryBindings: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
  >;
} {
  if (
    input.type !== "bicubic-atlas" ||
    typeof input.topologyDomain !== "string" ||
    !input.topologyDomain.trim() ||
    !Array.isArray(input.controls) ||
    !Array.isArray(input.patches) ||
    !(input.tolerance > 0 && Number.isFinite(input.tolerance * 1000)) ||
    !Number.isSafeInteger(input.maxCells) ||
    input.maxCells < 1 ||
    !Number.isSafeInteger(input.maxVertices) ||
    input.maxVertices < 3 ||
    (input.cellBudgetPolicy !== undefined &&
      input.cellBudgetPolicy !== "retain-coarse" &&
      input.cellBudgetPolicy !== "omit-unresolved") ||
    (input.boundaryAuthorities !== undefined &&
      !Array.isArray(input.boundaryAuthorities)) ||
    (input.boundaryBindings !== undefined &&
      !Array.isArray(input.boundaryBindings))
  )
    throw new Error(
      "A named bicubic atlas needs finite tolerance and positive cell/vertex budgets",
    );
  const invalid: Set<number> = new Set(),
    diagnostics: string[] = [],
    patches: number[] = [],
    used: Set<number> = new Set();
  if (!input.patches.length)
    diagnostics.push(
      "No declared bicubic patches; empty generated geometry is incomplete and has no source fallback",
    );
  if (input.sourceFit !== undefined) {
    const fit: NonNullable<IAutoMovieBicubicAtlasGeometry["sourceFit"]> =
      input.sourceFit;
    if (
      !fit ||
      typeof fit.qualified !== "boolean" ||
      (fit.maximumResidual !== null &&
        !(Number.isFinite(fit.maximumResidual) && fit.maximumResidual >= 0)) ||
      !Array.isArray(fit.unqualifiedPatches) ||
      fit.unqualifiedPatches.some(
        (id: string): boolean => typeof id !== "string",
      ) ||
      !Array.isArray(fit.diagnostics) ||
      fit.diagnostics.some(
        (message: string): boolean => typeof message !== "string",
      )
    )
      diagnostics.push(
        "Malformed source-fit qualification metadata; finite structural geometry remains displayable",
      );
    else {
      for (const message of fit.diagnostics)
        diagnostics.push(`source-fit: ${message}`);
      if (!fit.qualified)
        diagnostics.push(
          `source-fit unqualified; ${fit.unqualifiedPatches.length} affected patches remain finite display candidates`,
        );
    }
  }
  for (let i: number = 0; i < input.controls.length; i++) {
    const point: IAutoMovieBicubicAtlasGeometry["controls"][number] =
      input.controls[i]!;
    if (
      !point ||
      ![point.x, point.y, point.z].every(
        (value: number): boolean =>
          Number.isFinite(value) && Number.isFinite(value * 1000),
      )
    ) {
      invalid.add(i);
      diagnostics.push(
        `Unrepresentable model-metre coefficient at controls[${i}]`,
      );
    }
  }
  const names: Set<string> = new Set();
  for (let i: number = 0; i < input.patches.length; i++) {
    const patch: IAutoMovieBicubicAtlasGeometry["patches"][number] =
      input.patches[i]!;
    if (
      !patch ||
      typeof patch.id !== "string" ||
      !patch.id.trim() ||
      names.has(patch.id) ||
      !Array.isArray(patch.controlIds) ||
      patch.controlIds.length !== 16 ||
      Array.from(
        { length: 16 },
        (_: unknown, k: number): number => patch.controlIds[k]!,
      ).some(
        (id: number): boolean =>
          !Number.isSafeInteger(id) ||
          id < 0 ||
          id >= input.controls.length ||
          invalid.has(id),
      )
    ) {
      diagnostics.push(`Omitted structurally invalid patch at patches[${i}]`);
      continue;
    }
    names.add(patch.id);
    patches.push(i);
  }
  const authorities: Map<
      string,
      NonNullable<IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]>[number]
    > = new Map(),
    invalidAuthorities: Set<string> = new Set();
  for (const authority of input.boundaryAuthorities ?? []) {
    if (
      !authority ||
      typeof authority.id !== "string" ||
      !authority.id.trim() ||
      authorities.has(authority.id) ||
      !Array.isArray(authority.controlIds) ||
      authority.controlIds.length !== 4 ||
      Array.from(
        { length: 4 },
        (_: unknown, k: number): number => authority.controlIds[k]!,
      ).some(
        (id: number): boolean =>
          !Number.isSafeInteger(id) ||
          id < 0 ||
          id >= input.controls.length ||
          invalid.has(id),
      )
    ) {
      diagnostics.push(
        "Omitted structurally invalid canonical boundary authority",
      );
      if (authority && typeof authority.id === "string")
        invalidAuthorities.add(authority.id);
      continue;
    }
    authorities.set(authority.id, authority);
  }
  for (const id of invalidAuthorities) authorities.delete(id);
  const bindings: Set<string> = new Set(),
    omitted: Set<string> = new Set();
  const admittedBindings: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
  > = [];
  for (const binding of input.boundaryBindings ?? []) {
    if (!binding) {
      diagnostics.push("Omitted malformed canonical boundary binding");
      continue;
    }
    const key: string = `${binding.patch}:${binding.side}`;
    if (
      !names.has(binding.patch) ||
      ![0, 1, 2, 3].includes(binding.side) ||
      !authorities.has(binding.authority) ||
      typeof binding.normalFan !== "string" ||
      !binding.normalFan.trim() ||
      bindings.has(key) ||
      !Number.isFinite(binding.start) ||
      !Number.isFinite(binding.end) ||
      binding.start < 0 ||
      binding.start > 1 ||
      binding.end < 0 ||
      binding.end > 1 ||
      binding.start === binding.end
    ) {
      diagnostics.push(
        `Omitted incident patch for invalid canonical boundary binding ${key}`,
      );
      if (names.has(binding.patch)) omitted.add(binding.patch);
      continue;
    }
    bindings.add(key);
    admittedBindings.push(binding);
  }
  const retained: number[] = patches.filter(
    (id: number): boolean => !omitted.has(input.patches[id]!.id),
  );
  const retainedNames: Set<string> = new Set(
    retained.map((id: number): string => input.patches[id]!.id),
  );
  const boundaryBindings: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
  > = admittedBindings.filter(
    (
      binding: NonNullable<
        IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
      >[number],
    ): boolean => retainedNames.has(binding.patch),
  );
  const usedAuthorities: Set<string> = new Set(
    boundaryBindings.map(
      (
        binding: NonNullable<
          IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
        >[number],
      ): string => binding.authority,
    ),
  );
  const boundaryAuthorities: NonNullable<
    IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
  > = [...authorities.values()].filter(
    (
      authority: NonNullable<
        IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
      >[number],
    ): boolean => usedAuthorities.has(authority.id),
  );
  for (const id of retained)
    for (const control of input.patches[id]!.controlIds) used.add(control);
  for (const authority of boundaryAuthorities)
    for (const id of authority.controlIds) used.add(id);
  return {
    patches: retained,
    controls: [...used].sort((a: number, b: number): number => a - b),
    diagnostics,
    boundaryAuthorities,
    boundaryBindings,
  };
}

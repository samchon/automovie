import * as THREE from "three";

import { reportAutoMovieResourceRetirement } from "../../../viewer/src/reportAutoMovieResourceRetirement";

/**
 * Own the optional part-colour materials beside an existing polygon drawing.
 *
 * Geometry and the default clay belong to the caller. Each replacement builds
 * all assignments, takes ownership of the new RGB pool, then retires the old
 * pool. A failed build or retirement refuses further replacements and retains
 * bounded uncertain owners without retrying their attempted cleanup.
 *
 * The drawing's guarded disposer invokes dispose inside its existing fan-out,
 * passes failure as that collector's primary cause, and calls completeRetirement
 * only after the entire drawing retires successfully. This preserves resource
 * attempt order, one-attempt semantics and uncertain ownership on failure.
 *
 * @param material Borrowed default clay, also used as the clone template.
 * @param partMeshes Existing meshes indexed by their actual emitted bone names.
 * @returns Colour replacement and the drawing owner's retirement hooks.
 *
 * @evidence contracts/common.md#principled-implementation Validates RGB overrides and assigns matching original meshes without modifying geometry, bone placements or body dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Palette ownership stays separate from shape selection, display mesh assembly and joint annotations; the drawing retains the outer disposal guard.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy correction, shader, palette preset or new cleanup collector is introduced; the existing retirement reporter attempts independent owned materials.
 * @evidence contracts/common.md#meaningful-documentation States borrowed defaults, new-pool ownership before old retirement, sticky replacement failure and the caller's guarded fan-out responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Each replacement scans emitted parts once and constructs at most one material per matched RGB value.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal current RGB overrides share one material; omitted parts reuse borrowed clay and every original geometry remains unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The current pool replaces the old pool; one failed replacement retains bounded uncertain owners and its original cause, while the caller's completed retirement releases pool references without retries.
 */
export function createHumanPolygonPalette(
  material: THREE.MeshStandardMaterial,
  partMeshes: ReadonlyMap<string, THREE.Mesh>,
): {
  /** Validate and replace colours; undefined restores the borrowed clay. */
  setPartColors: (colors?: Readonly<Record<string, number>>) => void;
  /** Original sticky replacement cause for the drawing's outer collector. */
  readonly failure: { error: unknown } | undefined;
  /** Attempt current materials once under the caller's sticky disposal guard. */
  dispose: () => void;
  /** Drop pool references only after the whole drawing retired successfully. */
  completeRetirement: () => void;
} {
  let colorMaterials: Map<number, THREE.MeshStandardMaterial> = new Map();
  let colorFailure: { error: unknown } | undefined;
  const uncertainMaterials: Set<THREE.MeshStandardMaterial> = new Set();

  const setPartColors: (colors?: Readonly<Record<string, number>>) => void = (
    colors?: Readonly<Record<string, number>>,
  ): void => {
    if (colorFailure !== undefined) throw colorFailure.error;
    createHumanPolygonPalette.validate(colors);
    const next: Map<number, THREE.MeshStandardMaterial> = new Map();
    const assignments: [THREE.Mesh, THREE.MeshStandardMaterial][] = [];
    try {
      for (const [name, mesh] of partMeshes) {
        const value: number | undefined = colors?.[name];
        let selected: THREE.MeshStandardMaterial = material;
        if (value !== undefined) {
          if (!next.has(value)) {
            const tinted: THREE.MeshStandardMaterial = material.clone();
            next.set(value, tinted);
            tinted.color.setHex(value);
          }
          selected = next.get(value)!;
        }
        assignments.push([mesh, selected]);
      }
    } catch (error: unknown) {
      for (const tinted of next.values()) uncertainMaterials.add(tinted);
      try {
        reportAutoMovieResourceRetirement(
          [...next.values()].map(
            (tinted: THREE.MeshStandardMaterial): (() => void) =>
              (): void =>
                tinted.dispose(),
          ),
          { error },
        );
      } catch (cause: unknown) {
        colorFailure = { error: cause };
        throw cause;
      }
    }
    const previous: Map<number, THREE.MeshStandardMaterial> = colorMaterials;
    colorMaterials = next;
    for (const [mesh, selected] of assignments) mesh.material = selected;
    try {
      reportAutoMovieResourceRetirement(
        [...previous.values()].map(
          (tinted: THREE.MeshStandardMaterial): (() => void) =>
            (): void =>
              tinted.dispose(),
        ),
      );
    } catch (error: unknown) {
      for (const tinted of previous.values()) uncertainMaterials.add(tinted);
      colorFailure = { error };
      throw error;
    }
  };

  return {
    setPartColors,
    get failure(): { error: unknown } | undefined {
      return colorFailure;
    },
    dispose: (): void => {
      reportAutoMovieResourceRetirement(
        [...colorMaterials.values()].map(
          (tinted: THREE.MeshStandardMaterial): (() => void) =>
            (): void =>
              tinted.dispose(),
        ),
      );
    },
    completeRetirement: (): void => {
      colorMaterials.clear();
      uncertainMaterials.clear();
    },
  };
}

/** Colour input semantics shared by admission and later replacements. */
export namespace createHumanPolygonPalette {
  /**
   * Admit optional RGB overrides before allocation and during replacement.
   * Every supplied value, including an unmatched part entry, must be an integer
   * in [0, 0xffffff]. Undefined admits the default clay; invalid values throw.
   * Keys are not interpreted as anatomy or required to match an emitted mesh.
   *
   * @evidence contracts/common.md#principled-implementation Applies the same integer RGB domain to initial admission and explicit replacements without mutating the input.
   * @evidence contracts/common.md#clear-and-simple-design One predicate over supplied values owns colour admission independently of palette allocation and part matching.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp channels, invent missing values or reinterpret unmatched names as generated parts.
   * @evidence contracts/common.md#meaningful-documentation States the inclusive RGB domain, optional-default behavior, unmatched-entry policy and throwing refusal.
   * @evidence contracts/performance.md#efficient-algorithms Object.values snapshots P supplied values and some checks at most P entries before admission or refusal.
   * @evidence contracts/performance.md#reuse-equivalent-work Both construction and later replacements call this same validator rather than duplicating the admission rule.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the temporary values snapshot is allocated; no input map, material, geometry or cleanup task is retained.
   */
  export function validate(colors?: Readonly<Record<string, number>>): void {
    if (
      colors !== undefined &&
      Object.values(colors).some(
        (value: number): boolean =>
          !Number.isInteger(value) || value < 0 || value > 0xffffff,
      )
    )
      throw new Error("Polygon part colours require RGB hex integers");
  }
}

import * as THREE from "three";

import { reportAutoMovieResourceRetirement } from "../reportAutoMovieResourceRetirement.js";

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
 * @evidence contracts/development/implementation.md#principled-implementation Validates RGB overrides and assigns matching original meshes without modifying geometry, bone placements or body dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Palette ownership stays separate from shape selection, display mesh assembly and joint annotations; the drawing retains the outer disposal guard.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy correction, shader, palette preset or new cleanup collector is introduced; the existing retirement reporter attempts independent owned materials.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed defaults, new-pool ownership before old retirement, sticky replacement failure and the caller's guarded fan-out responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each replacement scans emitted parts once and constructs at most one material per matched RGB value.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal current RGB overrides share one material; omitted parts reuse borrowed clay and every original geometry remains unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The current pool replaces the old pool; one failed replacement retains bounded uncertain owners and its original cause, while the caller's completed retirement releases pool references without retries.
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

  /**
   * Preserve complete palette replacement before retiring the previous pool.
   *
   * Principled implementation: Admits RGB values, builds all assignments with one clone per distinct matched colour, publishes the new pool and then attempts all previous materials; failures remain sticky with bounded uncertain owners.
   * Clear and simple design: Palette material ownership remains separate from original shape/pose and the drawing's outer disposal guard.
   * Prohibited implementation shortcuts: Changes actual part materials without geometry edits, source scaling or fixture-specific palettes.
   * Meaningful documentation: States replacement-before-retirement and sticky failure semantics.
   * Efficient algorithms: O(P+C) work for P emitted parts and C previous colours, with at most one new material per distinct matched RGB.
   * Reuse equivalent work: Equal current RGBs share one clone; unmatched/omitted parts reuse the borrowed clay.
   * Bound retention and release resources: Successful replacement releases the previous pool; terminal failure retains only bounded current/uncertain pools for the drawing's one-attempt retirement policy.
   */
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

/** Colour input semantics shared by admission and later replacements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the optional clay default, inclusive RGB domain, unmatched-entry policy and refusal behavior.
 * @evidence contracts/development/design.md#principled-representation Represents Colour input semantics shared by admission and later replacements: companion namespace of 1 member (`validate`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `createHumanPolygonPalette` in packages/render/src/scene/human-polygon/createHumanPolygonPalette.ts; its surface is the 1 member listed and the text shows 1 other file naming it, mostly packages/render (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace createHumanPolygonPalette {
  /**
   * Admit optional RGB overrides before allocation and during replacement.
   * Every supplied value, including an unmatched part entry, must be an integer
   * in [0, 0xffffff]. Undefined admits the default clay; invalid values throw.
   * Keys are not interpreted as anatomy or required to match an emitted mesh.
   *
   * Principled implementation: Admits undefined or integer RGB hex values from zero through 0xffffff without mutation.
   * Clear and simple design: One validator serves initial palette admission and replacements before allocation.
   * Prohibited implementation shortcuts: Does not clamp channels or infer anatomy from colour keys.
   * Meaningful documentation: States optional clay defaults, inclusive integer domain and unmatched-key admission.
   * Efficient algorithms: Copies/checks P supplied values once, O(P) time and temporary values storage.
   * Reuse equivalent work: Both original construction and later replacements share the same admission rule.
   * Bound retention and release resources: Retains no input map, geometry, material or task.
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

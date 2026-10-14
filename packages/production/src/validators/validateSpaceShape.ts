import type { IAutoMovieConstraintViolation } from "@automovie/interface";

import {
  pushViolation,
  validateArrayArtifact,
  validateObjectArtifact,
} from "@automovie/engine";

/**
 * Admit the nested ordinary JSON containers and strings that the typed engine space validator dereferences. Scene artifact admission calls this first; true means this pass appended no structural findings, without admitting geometric or numeric semantics.
 *
 * Surface and walkable lists, polygon point objects, optional hole-ring lists and heightfield sample arrays receive their owning shape checks. Parsed JSON arrays are dense; arbitrary sparse host arrays are not density-checked and skipped hole slots can still reach unsafe typed-engine access.
 *
 * Emptiness, uniqueness, ring area/crossing, hole containment, ground variants, ramp degeneracy, height-rule ranges and walkable references remain with validateSpace. Values and numeric precision policies are unchanged by this structural pass; true does not guarantee that delegated diagnostic conversion of malformed scalar objects cannot throw.
 *
 * @evidence contracts/common.md#principled-implementation Object, array and string guards establish visited nested shapes for ordinary dense JSON before validateSpace dereferences them; scalar, footprint and height semantics remain with that engine validator. Any appended structural finding makes the boolean false, but host-array density is not admitted.
 * @evidence contracts/common.md#clear-and-simple-design One raw-payload ingress protects the typed engine validator without restating its geometric or numeric decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Required malformed lists refuse without coercion, while an omitted optional holes list remains omitted. Sparse host arrays can skip structural visits and still provoke typed-engine dereferences; that admission gap remains unresolved.
 * @evidence contracts/common.md#meaningful-documentation States which structural premises are established, the delegated semantic rules and when the boolean permits typed validation.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in surface, walkable-id and footprint/hole-point populations. Heightfield samples are checked only as an array because engine semantics checks their scalar values; findings grow with malformed fields.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each admitted shape is visited once per scene validation; no cross-read shape verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns appended violations and their original values; traversal retains no private data or resource after return.
 * @author Samchon
 */
export function validateSpaceShape(space: unknown, path: string, violations: IAutoMovieConstraintViolation[]): boolean {
  const before: number = violations.length;
  if (!validateObjectArtifact(space, path, "space", violations)) return false;
  requireStringField(space.id, `${path}.id`, "space id", violations);
  if (
    validateArrayArtifact(
      space.surfaces,
      `${path}.surfaces`,
      "space surfaces",
      violations,
    )
  )
    space.surfaces.forEach((surface: unknown, index: number): void => {
      validateSurfaceShape(surface, `${path}.surfaces[${index}]`, violations);
    });
  if (
    validateArrayArtifact(
      space.walkable,
      `${path}.walkable`,
      "space walkable ids",
      violations,
    )
  )
    space.walkable.forEach((id: unknown, index: number): void => {
      requireStringField(
        id,
        `${path}.walkable[${index}]`,
        "walkable surface id",
        violations,
      );
    });
  return violations.length === before;
}

function validateSurfaceShape(surface: unknown, path: string, violations: IAutoMovieConstraintViolation[]): void {
  if (!validateObjectArtifact(surface, path, "space surface", violations))
    return;
  requireStringField(surface.id, `${path}.id`, "surface id", violations);
  requireStringField(surface.kind, `${path}.kind`, "surface kind", violations);
  if (
    validateArrayArtifact(
      surface.polygon,
      `${path}.polygon`,
      "surface footprint",
      violations,
    )
  )
    surface.polygon.forEach((point: unknown, index: number): void => {
      validateObjectArtifact(
        point,
        `${path}.polygon[${index}]`,
        "footprint point",
        violations,
      );
    });
  // The one place the payload nests three deep: holes are rings of points, and
  // the engine maps over both levels, so a hole list that is not a list of
  // lists reaches `.map` as a throw instead of a located violation.
  if (
    surface.holes !== undefined &&
    validateArrayArtifact(
      surface.holes,
      `${path}.holes`,
      "footprint holes",
      violations,
    )
  )
    surface.holes.forEach((hole: unknown, index: number): void => {
      const hp: string = `${path}.holes[${index}]`;
      if (!validateArrayArtifact(hole, hp, "footprint hole", violations))
        return;
      hole.forEach((point: unknown, at: number): void => {
        validateObjectArtifact(point, `${hp}[${at}]`, "hole point", violations);
      });
    });
  // A surface states its ground exactly one way, and WHICH way is the engine's
  // rule to enforce: absence is a located `validateSpace` violation rather than
  // a shape refusal, because a payload that omits both is well-formed JSON
  // saying something wrong, not malformed JSON. Only presence is shaped here.
  if (surface.anchor !== undefined)
    validateObjectArtifact(
      surface.anchor,
      `${path}.anchor`,
      "surface anchor",
      violations,
    );
  if (surface.rampTo !== null && surface.rampTo !== undefined)
    validateObjectArtifact(
      surface.rampTo,
      `${path}.rampTo`,
      "surface ramp anchor (null when flat)",
      violations,
    );
  if (
    surface.height !== undefined &&
    validateObjectArtifact(
      surface.height,
      `${path}.height`,
      "surface height rule",
      violations,
    ) &&
    surface.height.kind === "heightfield"
  )
    // The one array inside a height rule. Every other field is a scalar the
    // engine range-checks, but `samples` is walked, so a non-array would reach
    // `.forEach` as a throw.
    validateArrayArtifact(
      surface.height.samples,
      `${path}.height.samples`,
      "heightfield samples",
      violations,
    );
}

function requireStringField(value: unknown, path: string, label: string, violations: IAutoMovieConstraintViolation[]): void {
  if (typeof value === "string") return;
  pushViolation(violations, "type", path, `${label} must be a string`, value);
}

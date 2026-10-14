import type { IAutoMovieConstraintViolation } from "@automovie/interface";

import {
  pushViolation,
  validateArrayArtifact,
  validateObjectArtifact,
} from "@automovie/engine";

/**
 * Structural floor for an externally supplied space, the
 * JSON shape the engine's `validateSpace` dereferences without checking,
 * because inside the engine the value is already typed.
 *
 * Scene artifact admission uses this before calling the typed space validator.
 * A space has a
 * nested array of objects each holding a further array of vectors ??and, since
 * a footprint may be holed, a further array of those ??so a malformed one would
 * otherwise reach `surface.polygon.forEach`, `surface.holes.map` or
 * `surface.height.samples.forEach` as a throw instead of a field-located
 * violation.
 *
 * Types only. Emptiness, uniqueness, whether a ring encloses area or crosses
 * itself, whether a hole lies inside its own plate, which ground statement a
 * surface is allowed, ramp axes, height-rule ranges, and walkable resolution
 * stay with the engine's `validateSpace`, so every space rule has exactly one
 * owner and staging cannot disagree with a committed scene. Returns whether the
 * shape is safe to hand to that validator.
 *
 * @evidence contracts/common.md#principled-implementation Object, array and string guards establish every nested shape validateSpace dereferences; scalar, footprint and height semantics stay with that engine validator. Any appended structural finding makes the boolean false.
 * @evidence contracts/common.md#clear-and-simple-design One raw-payload ingress protects the typed engine validator without restating its geometric or numeric decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and malformed lists are refused rather than defaulted or coerced, and no frame or authored surface changes the guards.
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

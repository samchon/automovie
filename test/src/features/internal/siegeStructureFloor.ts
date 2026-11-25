import type { createSiegeEngine } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "./archetypeSpanObservation";

/** Actual source and posed public launcher. */
type Engine = ReturnType<typeof createSiegeEngine>;

/**
 * Inspect every real siege solid at all dimension-derived support extrema.
 *
 * @param engine Actual neutral producer output with the complete visible
 *   solids.
 * @param label Complete kind/seed identity.
 * @param findings Whole-round failure collector.
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete declared arm/winch domains, literal expected carrier groups, actual primitive observations and strict world-floor zero without a contact tolerance. Pin extraction is model +Z and cannot change its support height, checked separately by the control unit.
 * @evidence contracts/development/implementation.md#principled-implementation Actual box vertices and actual cylinder endpoints/axis generate their stationary support angles; interval endpoints are always included. A plumb counterweight is lowest at the short arm's vertical position. Winch angles map back through its declared ratio. At those real public poses, independently observe complete cylinder support and every actual box vertex against floor zero.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Classify the closed physical groups, gather all analytic critical/end angles from actual neutral solids, then inspect every real primitive through public articulate at the union of those angles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Calls no production clearance/section/fitting helper, samples no angle grid and uses no centre-only ground substitute or negative-gap tolerance. Unknown physical ids/shape families fail explicitly rather than being omitted.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P) critical-angle construction and O(P*K) actual solid observations for its bounded union of K endpoint/stationary angles; no movie frame sweep, renderer or wall-clock claim is used.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One union of critical angles serves all actual solids; the existing independent cylinder endpoint reader and engine quaternion/vector primitives supply raw observations only.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All angles and posed outputs are call-local; only caller-owned failures escape, without a host or retained history.
 */
export function siegeStructureFloor(
  engine: Engine,
  label: string,
  findings: string[],
): void {
  const d: Engine["dimensions"] = engine.dimensions;
  const first: number = -d.cocked!;
  const last: number = d.reach!;
  const angles: Set<number> = new Set([first, last, 0]);
  const arm: ReadonlySet<string> = new Set([
    "arm",
    "axle",
    "counterweight-axle",
    "pouch",
    "pouch-left",
    "pouch-right",
    "pouch-back",
    "sling-left",
    "sling-right",
  ]);
  const windlass: ReadonlySet<string> = new Set([
    "winch-shaft",
    "winch-drum",
    "winch-crank",
    "winch-grip",
  ]);
  const fixed: ReadonlySet<string> = new Set([
    "base",
    "post-left",
    "post-right",
    "release-rail-left",
    "release-rail-right",
    "release-crossbar",
    "release-bed--1",
    "release-bed-1",
    "release-carriage",
    "release-pin",
    "release-link",
    "release-guide--1",
    "release-guide-1",
  ]);
  for (const part of engine.parts) {
    if (part.id === "counterweight") {
      if (90 >= first && 90 <= last) angles.add(90);
      continue;
    }
    const ratio: number = arm.has(part.id)
      ? 1
      : windlass.has(part.id)
        ? d.winchRatio!
        : 0;
    if (ratio === 0) {
      if (!fixed.has(part.id))
        throw new Error(`Unknown actual siege carrier ${part.id}`);
      continue;
    }
    const height: number = ratio === 1 ? d.axleHeight! : 0.6;
    if (part.geometry.type !== "primitive")
      throw new Error("Actual siege support must retain its primitive");
    if (part.geometry.shape.type === "box") {
      for (const vertex of corners(part))
        critical(vertex.y - height, vertex.z, ratio);
    } else if (part.geometry.shape.type === "cylinder") {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        part.transform!.rotation,
        { x: 0, y: 1, z: 0 },
      );
      const xAxis: boolean = [
        "axle",
        "counterweight-axle",
        "winch-shaft",
        "winch-drum",
        "winch-grip",
      ].includes(part.id);
      for (const point of archetypeSpanObservation.ends(part)) {
        if (xAxis) critical(point.y - height, point.z, ratio);
        else
          for (const sign of [-1, 1] as const)
            critical(
              point.y - height + sign * part.geometry.shape.radius * axis.z,
              point.z - sign * part.geometry.shape.radius * axis.y,
              ratio,
            );
      }
    } else throw new Error(`Unsupported actual siege support ${part.id}`);
  }
  for (const angle of angles) {
    const posed: Engine = engine.articulate({ arm: angle });
    for (const part of posed.parts) {
      let minimum: number;
      if (part.geometry.type !== "primitive")
        throw new Error("Actual siege solid disappeared");
      if (part.geometry.shape.type === "box")
        minimum = Math.min(
          ...corners(part).map((point: IAutoMovieVector3): number => point.y),
        );
      else if (part.geometry.shape.type === "cylinder") {
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          part.transform!.rotation,
          { x: 0, y: 1, z: 0 },
        );
        minimum =
          part.transform!.translation.y -
          (Math.abs(axis.y) * part.geometry.shape.height) / 2 -
          part.geometry.shape.radius * Math.hypot(axis.x, axis.z);
      } else throw new Error(`Unsupported actual posed siege solid ${part.id}`);
      try {
        TestValidator.predicate(
          `${label}/${angle}/${part.id} actual complete solid floor: ${minimum}`,
          minimum >= 0,
        );
      } catch (error) {
        findings.push(String(error));
      }
    }
  }

  /** A_cos(theta)+B_sin(theta) reaches its minimum at atan2(B,A)+180 degrees. */
  function critical(cosine: number, sine: number, ratio: number): void {
    const base: number = (Math.atan2(sine, cosine) * 180) / Math.PI + 180;
    const turn: number = Math.ceil((first * ratio - base) / 360);
    const angle: number = (base + 360 * turn) / ratio;
    if (angle >= first && angle <= last) angles.add(angle);
  }
}

/**
 * Every vertex follows from the actual box dimensions and current rigid
 * transform.
 */
function corners(part: IAutoMovieModelPart): IAutoMovieVector3[] {
  if (part.geometry.type !== "primitive" || part.geometry.shape.type !== "box")
    throw new Error("A real siege box is required");
  const shape: typeof part.geometry.shape = part.geometry.shape;
  const result: IAutoMovieVector3[] = [];
  for (const x of [-1, 1] as const)
    for (const y of [-1, 1] as const)
      for (const z of [-1, 1] as const)
        result.push(
          Vector3.add(
            part.transform!.translation,
            Quaternion.rotateVector(part.transform!.rotation, {
              x: (x * shape.width) / 2,
              y: (y * shape.height) / 2,
              z: (z * shape.depth) / 2,
            }),
          ),
        );
  return result;
}

import type { AutoMovieArchetype } from "@automovie/archetypes";
import type {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { convexCellClosedBox } from "./convexCellClosedBox";
import { qclose, vclose } from "./predicates";

/**
 * Observe actual convex-cell meshes and colliders against authored box fixtures.
 *
 * Coordinates are metres. The caller supplies independently dimensioned corners,
 * an explicit expected rigid placement and analytic volume; this observer reads
 * only public archetype parts and shapes and starts no renderer or host.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual artifact ownership, metre coordinates, independently supplied expectations and the public in-memory observation boundary.
 * @evidence contracts/development/design.md#principled-representation Groups fixture placement, scalar TRS observation and actual mesh/collider comparison under one observation owner; expected dimensions and mass calculations remain with the test.
 * @evidence contracts/development/design.md#minimal-and-owned-surface frame, transformed and expectCell serve the convex-cell unit's existing scenarios; corner matching stays private and topology remains delegated to its existing oracle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses no private source import, production hull generator or sampled production output as an expected coordinate or volume. It does not claim rendered-pixel or arbitrary-polytope certification.
 */
export namespace convexCellObservation {
  /**
   * Make an explicit unit-scale fixture placement, defaulting to identity.
   *
   * @param translation Metre origin, retained by reference and not mutated here.
   * @param rotation Unit quaternion, retained by reference and not normalized.
   * @returns A new transform record with a new unit-scale vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States identity defaults, SI units, unit-quaternion premise, borrowed input references and independent returned scale.
   * @evidence contracts/development/implementation.md#principled-implementation Writes the caller's explicit rigid fixture frame without calling the production frame implementation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns one transform record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer a frame from observed output, normalize its input or change an authored expectation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and fixed-size output.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call authors an independent fixture placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the two supplied input references in its returned record and acquires no external resource.
   */
  export function frame(
    translation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
    rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  ): IAutoMovieTransform {
    return { translation, rotation, scale: { x: 1, y: 1, z: 1 } };
  }

  /**
   * Apply a supplied TRS to a metre point with independent scalar arithmetic.
   *
   * @param point Local coordinates, not mutated.
   * @param transform Component scale, unit quaternion and parent-space metre origin.
   * @returns A new parent-space point, without input normalization or repair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines local and parent frames, operation order, unit-quaternion premise and new output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Applies component scale and expands q*p*q-conjugate as p+w*(2*q.xyz cross p)+q.xyz cross (2*q.xyz cross p), then translates. This observes coordinates without calling production quaternion or frame helpers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scale, compute three doubled cross-product components, then return rotated and translated coordinates.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No result is rounded, clamped or normalized; malformed observed values remain available for the caller's finite comparisons to reject.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and fixed-size local/output records.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each input point is transformed independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows inputs only during the call, returns one point and retains no cache or external resource.
   */
  export function transformed(
    point: IAutoMovieVector3,
    transform: IAutoMovieTransform,
  ): IAutoMovieVector3 {
    const p: IAutoMovieVector3 = {
      x: point.x * transform.scale.x,
      y: point.y * transform.scale.y,
      z: point.z * transform.scale.z,
    };
    const q: IAutoMovieQuaternion = transform.rotation;
    const tx: number = 2 * (q.y * p.z - q.z * p.y);
    const ty: number = 2 * (q.z * p.x - q.x * p.z);
    const tz: number = 2 * (q.x * p.y - q.y * p.x);
    return {
      x: p.x + q.w * tx + q.y * tz - q.z * ty + transform.translation.x,
      y: p.y + q.w * ty + q.z * tx - q.x * tz + transform.translation.y,
      z: p.z + q.w * tz + q.x * ty - q.y * tx + transform.translation.z,
    };
  }

  /**
   * Compare one actual visible mesh and hull with the same authored box cell.
   *
   * @param label Assertion context.
   * @param archetype Actual public model at its current pose.
   * @param id Part and collider id in that model.
   * @param corners Independent box corners in local metres.
   * @param expected Independently authored current rigid placement.
   * @param volume Analytic box volume in cubic metres.
   * @throws {Error} For missing mesh/hull correspondence or a failed assertion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual versus authored inputs, local/current frames, SI units, exact ids and failure effects; coordinate tolerance is 1e-10 metres and rotation/unit-scale tolerance is 1e-12.
   * @evidence contracts/development/implementation.md#principled-implementation Reads real part and shape outputs, compares both local and transformed corner sets with the caller's fixture and delegates finite outward closed topology and analytic signed volume to convexCellClosedBox.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Locate mesh and hull, parse actual positions, prepare independent placed corners and run the complete current-frame and geometry predicate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires a real mesh and hull rather than accepting primitives or missing shapes. Every observed point matches an expected corner and every expected corner is present, permitting duplicated render vertices without weakening the expected solid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Public shapes scans model parts; subsequent corner comparisons cost O((V+H)*C), with V render vertices, H hull points and C=8 fixture corners, plus the topology oracle's documented work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One parsed actual vertex list feeds local/world comparisons and the unchanged topology oracle; one expected placed corner list serves mesh and hull checks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All observations and transformed point arrays are call-local. Inputs are not mutated, no cache escapes and no host or resource is started.
   */
  export function expectCell(
    label: string,
    archetype: AutoMovieArchetype,
    id: string,
    corners: readonly IAutoMovieVector3[],
    expected: IAutoMovieTransform,
    volume: number,
  ): void {
    const part: IAutoMovieModelPart | undefined = archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    const hull: IAutoMoviePhysicalShape | undefined = archetype
      .shapes()
      .find(
        (candidate: IAutoMoviePhysicalShape): boolean => candidate.id === id,
      );
    if (
      part?.geometry.type !== "mesh" ||
      part.transform === null ||
      hull?.kind !== "hull"
    )
      throw new Error(
        `${label} must expose its visible mesh and exact hull collider`,
      );
    const hullFrame: IAutoMovieTransform = frame(
      hull.transform.position,
      hull.transform.rotation,
    );
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const vertices: IAutoMovieVector3[] = [];
    for (let offset: number = 0; offset < mesh.positions.length; offset += 3)
      vertices.push({
        x: mesh.positions[offset]!,
        y: mesh.positions[offset + 1]!,
        z: mesh.positions[offset + 2]!,
      });
    const world: IAutoMovieVector3[] = corners.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        transformed(point, expected),
    );
    TestValidator.predicate(
      `${label} mesh and hull retain local points and current TRS`,
      vclose(part.transform.translation, expected.translation, 1e-10) &&
        qclose(part.transform.rotation, expected.rotation, 1e-12) &&
        vclose(part.transform.scale, { x: 1, y: 1, z: 1 }, 1e-12) &&
        vclose(hullFrame.translation, expected.translation, 1e-10) &&
        qclose(hullFrame.rotation, expected.rotation, 1e-12) &&
        hull.points.length === corners.length &&
        sameCorners(vertices, corners) &&
        sameCorners(hull.points, corners) &&
        sameCorners(
          vertices.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              transformed(p, part.transform!),
          ),
          world,
        ) &&
        sameCorners(
          hull.points.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 =>
              transformed(p, hullFrame),
          ),
          world,
        ) &&
        convexCellClosedBox(mesh, vertices, corners, volume),
    );
  }

  /** Duplicated render vertices are permitted; every point and every expected corner must match. */
  function sameCorners(
    points: readonly IAutoMovieVector3[],
    corners: readonly IAutoMovieVector3[],
  ): boolean {
    return (
      points.length >= corners.length &&
      points.every((point: IAutoMovieVector3): boolean =>
        corners.some((corner: IAutoMovieVector3): boolean =>
          vclose(point, corner, 1e-10),
        ),
      ) &&
      corners.every((corner: IAutoMovieVector3): boolean =>
        points.some((point: IAutoMovieVector3): boolean =>
          vclose(point, corner, 1e-10),
        ),
      )
    );
  }
}

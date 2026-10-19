import * as THREE from "three";

import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { createAutoMovieResourceRetirement } from "./createAutoMovieResourceRetirement.js";

/**
 * Display caller-supplied generating polylines in model metres without refitting.
 * Closed lines omit the repeated endpoint. The builder owns one material and one
 * geometry per line, registers allocations before attachment and transfers an
 * idempotent asynchronous disposer. Public disposal attempts every owned resource;
 * it does not certify physical GPU-driver retirement. The caller owns mounting.
 *
 * @evidence contracts/common.md#principled-implementation Validated finite float32-representable generating samples become native Line/LineLoop objects; line closure and identity are explicit and geometry is never inferred from a displayed mesh.
 * @evidence contracts/common.md#clear-and-simple-design This generic viewer producer owns rendering and resource lifetime for construction while recovery and other generators remain the authorities for the lines' numerical meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No curve refit, source overlay, coordinate weld, native method replacement or construction inferred from visible triangles enters display; invalid points and point budgets refuse before native allocation.
 * @evidence contracts/common.md#meaningful-documentation States metre units, closed-line endpoint convention, float32 display admission, caller mounting, first-allocation rollback, owned resources and disposal limits.
 * @evidence contracts/performance.md#efficient-algorithms Validation and position conversion cost O(P) for P supplied points, bounded by maxPoints, with one geometry per line and one material shared by the call's lines.
 * @evidence contracts/performance.md#reuse-equivalent-work All same-colour lines in this returned construction share one owned material; geometry is created once and no cross-request cache retains caller records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Construction rollback immediately owns every native allocation; successful output transfers geometries/material and one shared retirement promise to the caller, with no renderer, RAF, listener or global registry acquired.
 */
export function buildAutoMovieConstruction(
  lines: readonly {
    id: string;
    closed: boolean;
    points: readonly [number, number, number][];
  }[],
  options: { color: number; maxPoints: number },
): { object: THREE.Group; dispose: () => Promise<void> } {
  if (
    !Array.isArray(lines) ||
    !options ||
    !Number.isInteger(options.color) ||
    options.color < 0 ||
    options.color > 0xffffff ||
    !Number.isSafeInteger(options.maxPoints) ||
    options.maxPoints < 1
  )
    throw new Error(
      "Construction needs an explicit colour and positive point budget",
    );
  const names: Set<string> = new Set();
  let count: number = 0;
  for (let index: number = 0; index < lines.length; index++) {
    const line: (typeof lines)[number] = lines[index];
    if (
      !line ||
      typeof line.id !== "string" ||
      !line.id ||
      names.has(line.id) ||
      typeof line.closed !== "boolean" ||
      !Array.isArray(line.points) ||
      line.points.length < (line.closed ? 3 : 2)
    )
      throw new Error(
        "Construction lines need unique identities and enough ordered points",
      );
    names.add(line.id);
    count += line.points.length;
    if (!Number.isSafeInteger(count) || count > options.maxPoints)
      throw new Error("Construction point population exceeds maxPoints");
    for (let point: number = 0; point < line.points.length; point++) {
      const position: [number, number, number] = line.points[point];
      if (!Array.isArray(position) || position.length !== 3)
        throw new Error("Construction points need three metre coordinates");
      for (let axis: number = 0; axis < 3; axis++)
        if (
          !Number.isFinite(position[axis]) ||
          !Number.isFinite(Math.fround(position[axis]))
        )
          throw new Error(
            "Construction coordinates must be finite and float32-representable",
          );
    }
  }
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): {
      object: THREE.Group;
      dispose: () => Promise<void>;
    } => {
      const object: THREE.Group = new THREE.Group();
      const material: THREE.LineBasicMaterial = own(
        new THREE.LineBasicMaterial({ color: options.color }),
      );
      const resources: { dispose(): void }[] = [material];
      for (const line of lines) {
        const geometry: THREE.BufferGeometry = own(new THREE.BufferGeometry());
        resources.push(geometry);
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(line.points.flat(), 3),
        );
        const drawable: THREE.Line = line.closed
          ? new THREE.LineLoop(geometry, material)
          : new THREE.Line(geometry, material);
        drawable.name = line.id;
        object.add(drawable);
      }
      return {
        object,
        dispose: createAutoMovieResourceRetirement(
          resources.map(
            (resource: { dispose(): void }): (() => void) =>
              (): void =>
                resource.dispose(),
          ),
        ),
      };
    },
  );
}

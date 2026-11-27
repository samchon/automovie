import type { IAutoMovieConstructionPolyline } from "@automovie/interface";
import * as THREE from "three";

import { constructOwnedResources } from "./constructOwnedResources";
import { createResourceRetirement } from "./createResourceRetirement";

/*
 * Display caller-supplied generating polylines in model metres without
 * refitting. Closed lines omit the repeated endpoint. The builder owns one
 * material and one geometry per line, registers allocations before attachment
 * and transfers an idempotent asynchronous disposer. Public disposal attempts
 * every owned resource; it does not certify physical GPU-driver retirement. The
 * caller owns mounting.
 */
export function buildConstruction(
  lines: readonly IAutoMovieConstructionPolyline[],
  options: { color: number; maxPoints: number },
): { object: THREE.Group; dispose: () => Promise<void> } {
  if (options.color < 0 || options.color > 0xffffff || options.maxPoints < 1)
    throw new Error(
      "Construction needs an explicit colour and positive point budget",
    );
  const names: Set<string> = new Set();
  let count: number = 0;
  for (let index: number = 0; index < lines.length; index++) {
    const line: (typeof lines)[number] = lines[index];
    if (
      !line ||
      !line.id ||
      names.has(line.id) ||
      line.points.length < (line.closed ? 3 : 2)
    )
      throw new Error(
        "Construction lines need unique identities and enough ordered points",
      );
    names.add(line.id);
    count += line.points.length;
    if (count > options.maxPoints)
      throw new Error("Construction point population exceeds maxPoints");
    for (let point: number = 0; point < line.points.length; point++) {
      const position: [number, number, number] = line.points[point];
      if (position.length !== 3)
        throw new Error("Construction points need three metre coordinates");
    }
  }
  return constructOwnedResources(
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
        dispose: createResourceRetirement(
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

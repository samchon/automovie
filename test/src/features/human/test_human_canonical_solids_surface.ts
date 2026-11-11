import { physicalHullFaces, physicalHullNearest } from "@automovie/engine";
import { AutoMovieHumanCanonicalSolids } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  type AutoMovieHumanPolygon,
  buildHumanPolygon,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";

/**
 * The polygon man's colliders are the surface that is drawn: each module's
 * convex solids and its drawn mesh coincide in both directions.
 *
 * Scenarios:
 * 1. Every drawn module but a finger phalanx has at least one solid, and no
 *    solid exists without a drawn module.
 * 2. The pelvis, whose hip ring lies inside the straight run from the pelvis
 *    floor to a wider waist, is cut into more than one solid, while a round
 *    limb stays one.
 * 3. Every vertex of every drawn triangle lies on the surface of one of its
 *    module's solids, and every edge midpoint and centroid within 3 mm of it.
 * 4. Every sampled point of every solid face lies within 3 mm of the drawn
 *    mesh, unless it is on or inside another solid of the same module, where
 *    two cut runs meet inside the body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the drawing through the viewer's public entry and the solids through Human's, then measures actual triangles against actual hulls; a ring edited for one consumer only moves a vertex off its solid, and a concave run kept as one hull fails the cut of scenario 2.
 * @evidence contracts/development/testing.md#independent-expectations The expected vertex gap is zero, because both are stated to be built from one set of ring points; the 10 micrometre allowance is the single precision of the mesh buffer over a body two metres tall. Between vertices the two may differ, since the hull of two rings of different proportions can join one ring's corner to the next ring's neighbouring corner where the drawing folds the quad of matching corners (1.94 mm on this fixture's chest); that is held to the 3 mm fidelity the contact laws rely on. Triangle distance comes from three.js, hull distance from the engine.
 * @evidence contracts/development/testing.md#distinguishing-cases A trunk of rings with three different proportions (skew bands), a pelvis that must be cut, round limbs, a palm and a foot on tilted axes, and a head closed on a pole; mesh to solid and solid to mesh are measured separately since either can pass alone.
 * @evidence contracts/development/testing.md#execution-ownership One portable CPU unit over the synthetic skeleton fixture: no Human is generated and no renderer starts; it owns and disposes its drawing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_human_canonical_solids_surface(): void {
  const input: AutoMovieHumanPolygon.IInput = createHumanPolygonFixture();
  // Human's frame and the canonical frame differ by (x, y, z) -> (z, y, x).
  const reflect = (p: readonly number[]): IAutoMovieVector3 => ({
    x: p[2]!,
    y: p[1]!,
    z: p[0]!,
  });
  const solids: AutoMovieHumanCanonicalSolids.ISolid[] =
    AutoMovieHumanCanonicalSolids.build(
      new Map(
        input.bones.map(
          (
            bone: AutoMovieHumanPolygon.IBone,
          ): [string, AutoMovieHumanCanonicalSolids.IJoint] => [
            bone.bone,
            {
              parent: bone.parent,
              carrier: "hips",
              position: reflect(bone.position),
              tip: bone.tip === null ? null : reflect(bone.tip),
              radius: bone.radius,
            },
          ],
        ),
      ),
    );
  const of = (bone: string): AutoMovieHumanCanonicalSolids.ISolid[] =>
    solids.filter(
      (solid: AutoMovieHumanCanonicalSolids.ISolid): boolean =>
        solid.id === bone || solid.id.startsWith(`${bone}.`),
    );
  const signed = (
    solid: AutoMovieHumanCanonicalSolids.ISolid,
    p: IAutoMovieVector3,
  ): number =>
    physicalHullNearest(solid.points, {
      x: p.x - solid.centre.x,
      y: p.y - solid.centre.y,
      z: p.z - solid.centre.z,
    }).distance;

  const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(input);
  const defects: string[] = [];
  let claimed: number = 0;
  let cornerWorst: number = 0;
  let cornerWhere: string = "none";
  let meshWorst: number = 0;
  let meshWhere: string = "none";
  let solidWorst: number = 0;
  let solidWhere: string = "none";
  for (const bone of input.bones) {
    const part: THREE.Mesh | undefined = drawing.parts.get(bone.bone);
    const own: AutoMovieHumanCanonicalSolids.ISolid[] = of(bone.bone);
    claimed += own.length;
    if (part === undefined) {
      if (own.length > 0) defects.push(`${bone.bone}: solid without a mesh`);
      continue;
    }
    if (own.length === 0) {
      if (!/Proximal$/.test(bone.bone))
        defects.push(`${bone.bone}: mesh without a solid`);
      continue;
    }
    const positions: THREE.BufferAttribute = part.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const index: THREE.BufferAttribute = part.geometry.getIndex()!;
    const corner = (i: number): THREE.Vector3 =>
      new THREE.Vector3(
        positions.getZ(i) + bone.position[2],
        positions.getY(i) + bone.position[1],
        positions.getX(i) + bone.position[0],
      );
    const triangles: THREE.Triangle[] = [];
    for (let i: number = 0; i < index.count; i += 3)
      triangles.push(
        new THREE.Triangle(
          corner(index.getX(i)),
          corner(index.getX(i + 1)),
          corner(index.getX(i + 2)),
        ),
      );

    // 3. The mesh lies on its solids.
    for (const triangle of triangles) {
      const mid = (a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 =>
        a.clone().add(b).multiplyScalar(0.5);
      for (const p of [
        triangle.a,
        triangle.b,
        triangle.c,
        mid(triangle.a, triangle.b),
        mid(triangle.b, triangle.c),
        mid(triangle.c, triangle.a),
        triangle.getMidpoint(new THREE.Vector3()),
      ]) {
        const each: number[] = own.map(
          (solid: AutoMovieHumanCanonicalSolids.ISolid): number =>
            signed(solid, p),
        );
        if (p === triangle.a || p === triangle.b || p === triangle.c) {
          const off: number = Math.min(...each.map(Math.abs));
          if (off > cornerWorst) {
            cornerWorst = off;
            cornerWhere = bone.bone;
          }
        }
        const gap: number = Math.abs(Math.min(...each));
        if (gap > meshWorst) {
          meshWorst = gap;
          meshWhere = bone.bone;
        }
      }
    }

    // 4. The solids lie on the mesh.
    const nearest: THREE.Vector3 = new THREE.Vector3();
    for (const solid of own)
      for (const face of physicalHullFaces(solid.points).faces) {
        const loop: THREE.Vector3[] = face.loop.map(
          (p: IAutoMovieVector3): THREE.Vector3 =>
            new THREE.Vector3(
              p.x + solid.centre.x,
              p.y + solid.centre.y,
              p.z + solid.centre.z,
            ),
        );
        const centre: THREE.Vector3 = new THREE.Vector3();
        for (const p of loop) centre.addScaledVector(p, 1 / loop.length);
        const samples: THREE.Vector3[] = [centre];
        loop.forEach((p: THREE.Vector3, i: number): void => {
          samples.push(
            p,
            p.clone().lerp(loop[(i + 1) % loop.length]!, 0.5),
            p.clone().lerp(centre, 0.5),
          );
        });
        for (const p of samples) {
          if (
            own.some(
              (other: AutoMovieHumanCanonicalSolids.ISolid): boolean =>
                other !== solid && signed(other, p) <= ALLOWANCE,
            )
          )
            continue;
          let gap: number = Infinity;
          for (const triangle of triangles)
            gap = Math.min(
              gap,
              triangle.closestPointToPoint(p, nearest).distanceTo(p),
            );
          if (gap > solidWorst) {
            solidWorst = gap;
            solidWhere = solid.id;
          }
        }
      }
  }
  drawing.dispose();

  TestValidator.equals("modules and solids pair up", defects, []);
  TestValidator.equals(
    "every solid belongs to a module",
    claimed,
    solids.length,
  );
  TestValidator.predicate(
    "a concave run is cut and a round limb is not",
    of("hips").length > 1 && of("leftLowerLeg").length === 1,
  );
  TestValidator.predicate(
    `every drawn vertex lies on a solid (${cornerWorst} m at ${cornerWhere})`,
    cornerWorst <= ALLOWANCE,
  );
  TestValidator.predicate(
    `the mesh lies within the fidelity of its solids (${meshWorst} m at ${meshWhere})`,
    meshWorst <= FIDELITY,
  );
  TestValidator.predicate(
    `the solids lie within the fidelity of the mesh (${solidWorst} m at ${solidWhere})`,
    solidWorst <= FIDELITY,
  );
}

/** The single precision of a mesh buffer over a two metre body, metres. */
const ALLOWANCE: number = 1e-5;

/** How far a drawn band may lie from its solid's face between shared vertices, metres. */
const FIDELITY: number = 3e-3;

import { simulateSoftBody, softBodySurfaceGeometry } from "@automovie/engine";
import { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodySurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { exactValues, softPanel } from "../internal/softFixtures";

/** A flat rug lying in the world `xz` plane. */
const rug: (columns: number, rows: number) => IAutoMovieSoftBodyDomain = (columns: number, rows: number): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns,
    rows,
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 0, z: 1 },
    overrides: { id: "rug" },
  });

/**
 * The drawable panel is derived from the solved particles alone, and its
 * normals, UVs, indices and bounds are the hand-computable consequences of that
 * lattice.
 *
 * The renderer must stay a projection. If a viewer built its own cloth mesh it
 * would be a second opinion about where the fabric is, and a second opinion can
 * disagree with the solved field. This test checks selected derived attributes
 * through the mesh producer itself.
 *
 * The rug lies in the `xz` plane, where the quad `(c, r) → (c, r+1) → (c+1, r)`
 * has edge vectors `(0, 0, sv)` and `(su, 0, 0)`, whose cross product is `(0,
 * su·sv, 0)`: the surface faces `+y`, exactly, with no residual in the other
 * two components.
 *
 * Scenarios:
 *
 * 1. A 3×3 rug emits one vertex per particle, four quads, twenty-four indices, and
 *    vertex positions bit-identical to the solved particle array.
 * 2. Every normal of a flat rug is exactly `(0, 1, 0)`: the area-weighted sum
 *    normalizes to an exact axis rather than to a value merely close to one.
 * 3. UVs are the normalized lattice coordinates, with both extremes present and
 *    the interior at exactly one half.
 * 4. Bounds are the world extent of the drawn panel, and a hanging curtain's
 *    normals face `+z` rather than `+y`, which is what proves the derivation
 *    reads the lattice instead of assuming an orientation.
 * 5. A lattice one particle wide emits no triangle and reports `null` bounds: a
 *    single row of particles is a cord, not a surface. Its normals fall back to
 *    `(0, 1, 0)` rather than dividing by a zero-length accumulation.
 * 6. The mirror boundary — one particle deep rather than one wide — behaves the
 *    same way, and its UV rule degenerates on the other axis: the `u` extreme
 *    is still reached while every `v` is exactly zero.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives softBodySurfaceGeometry from step-zero solver states and checks vertex/index counts, exact rest positions, selected normalized UV coordinates, axial normals, curtain XY bounds, and triangle-free/null-bounds cord degeneracies. It does not inspect every emitted index or every bound component.
 * @evidence contracts/testing.md#independent-expectations A 3-by-3 lattice has 9 vertices and 4 quads with 6 indices each; normalized coordinates include 0, 1/2 and 1. The authored XZ winding has +Y cross products while the X/-Y curtain winding has +Z. Quarter-metre spacing gives curtain X [0,0.5] and Y [-0.5,0]. These are geometric hand expectations rather than snapshots of the producer.
 * @evidence contracts/testing.md#distinguishing-cases Flat and hanging panels distinguish orientation-dependent normals; one-column and one-row lattices distinguish both no-triangle boundaries and their UV axes. Deformed/nonzero-step surfaces, arbitrary numerical scales, singleton lattices and renderer adoption are outside this derivation test.
 * @evidence contracts/testing.md#execution-ownership The named test_soft_body_surface_geometry entry directly exercises portable CPU solver and mesh derivation with shared softPanel/exactValues fixtures; it starts no renderer and provides no visual proof or dynamically registered cases.
 */
export function test_soft_body_surface_geometry(): void {
  const flat: IAutoMovieSoftBodyDomain = rug(3, 3);
  const surface: IAutoMovieSoftBodySurface = softBodySurfaceGeometry({
    domain: flat,
    state: simulateSoftBody(flat, 0),
  });
  TestValidator.equals(
    "one vertex per particle and two triangles per quad",
    namedFacts([
      ["vertices", (): boolean => surface.mesh.positions.length === 27],
      ["indices", (): boolean => (surface.mesh.indices ?? []).length === 24],
      ["positions", (): boolean => exactValues(surface.mesh.positions, flat.rest)],
      ["step", (): boolean => surface.step === 0],
      ["domain", (): boolean => surface.domain === "rug"],
      ["skinless", (): boolean => surface.mesh.skin === null],
    ]),
    {
      vertices: true,
      indices: true,
      positions: true,
      step: true,
      domain: true,
      skinless: true,
    },
  );

  TestValidator.predicate(
    "a flat rug faces exactly +y",
    (surface.mesh.normals ?? []).every((value: number, index: number): boolean =>
      nclose(value, index % 3 === 1 ? 1 : 0, 0) && Object.is(value, index % 3 === 1 ? 1 : 0),
    ),
  );

  TestValidator.equals(
    "UVs are the normalized lattice coordinates",
    namedFacts([
      ["origin", (): boolean => nclose((surface.mesh.uvs ?? [])[0] ?? NaN, 0, 0)],
      ["centre", (): boolean => nclose((surface.mesh.uvs ?? [])[8] ?? NaN, 0.5, 0)],
      ["far", (): boolean => nclose((surface.mesh.uvs ?? [])[17] ?? NaN, 1, 0)],
      ["count", (): boolean => (surface.mesh.uvs ?? []).length === 18],
    ]),
    { origin: true, centre: true, far: true, count: true },
  );

  const curtain: IAutoMovieSoftBodyDomain = softPanel({
    columns: 3,
    rows: 3,
    overrides: { id: "drape" },
  });
  const hanging: IAutoMovieSoftBodySurface = softBodySurfaceGeometry({
    domain: curtain,
    state: simulateSoftBody(curtain, 0),
  });
  TestValidator.equals(
    "bounds are the world extent, and a hanging panel faces +z",
    namedFacts([
      ["minX", (): boolean => nclose(hanging.bounds?.min.x ?? NaN, 0)],
      ["maxX", (): boolean => nclose(hanging.bounds?.max.x ?? NaN, 0.5)],
      ["minY", (): boolean => nclose(hanging.bounds?.min.y ?? NaN, -0.5)],
      ["maxY", (): boolean => nclose(hanging.bounds?.max.y ?? NaN, 0)],
      [
        "normals",
        (): boolean =>
          (hanging.mesh.normals ?? []).every((value: number, index: number): boolean =>
            nclose(value, index % 3 === 2 ? 1 : 0, 0) && Object.is(value, index % 3 === 2 ? 1 : 0),
          ),
      ],
    ]),
    { minX: true, maxX: true, minY: true, maxY: true, normals: true },
  );

  const cord: IAutoMovieSoftBodyDomain = softPanel({ columns: 1, rows: 4, overrides: { id: "cord" } });
  const thread: IAutoMovieSoftBodySurface = softBodySurfaceGeometry({
    domain: cord,
    state: simulateSoftBody(cord, 0),
  });
  TestValidator.equals(
    "a one-particle-wide lattice is a cord, not a surface",
    namedFacts([
      ["indices", (): boolean => (thread.mesh.indices ?? []).length === 0],
      ["bounds", (): boolean => thread.bounds === null],
      ["vertices", (): boolean => thread.mesh.positions.length === 12],
      [
        "normals",
        (): boolean =>
          (thread.mesh.normals ?? []).every((value: number, index: number): boolean =>
            nclose(value, index % 3 === 1 ? 1 : 0, 0) && Object.is(value, index % 3 === 1 ? 1 : 0),
          ),
      ],
      ["uvs", (): boolean => nclose((thread.mesh.uvs ?? [])[0] ?? NaN, 0, 0)],
    ]),
    { indices: true, bounds: true, vertices: true, normals: true, uvs: true },
  );

  const batten: IAutoMovieSoftBodyDomain = softPanel({
    columns: 4,
    rows: 1,
    overrides: { id: "batten" },
  });
  const rail: IAutoMovieSoftBodySurface = softBodySurfaceGeometry({
    domain: batten,
    state: simulateSoftBody(batten, 0),
  });
  TestValidator.equals(
    "a one-particle-deep lattice is the mirror boundary of the cord",
    namedFacts([
      ["indices", (): boolean => (rail.mesh.indices ?? []).length === 0],
      ["bounds", (): boolean => rail.bounds === null],
      ["u", (): boolean => nclose((rail.mesh.uvs ?? [])[6] ?? NaN, 1, 0)],
      [
        "v",
        (): boolean =>
          (rail.mesh.uvs ?? []).every(
            (value: number, index: number): boolean => index % 2 === 0 || nclose(value, 0, 0),
          ),
      ],
    ]),
    { indices: true, bounds: true, u: true, v: true },
  );
}

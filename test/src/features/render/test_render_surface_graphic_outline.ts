import { AutoMovieArchetypeUnits, createSignPost } from "@automovie/archetypes";
import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  type IAutoMovieRenderModeHandle,
  type IAutoMovieSurfaceGraphicsObject,
  applyRenderMode,
  attachAutoMovieSemanticMask,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { renderFixtureNode } from "../internal/renderFixtureNode";

/**
 * A surface graphic stops at its surface's outline in every pass: the STOP
 * sign's square face paints nothing past the octagon's cut corners.
 *
 * Scenarios:
 *
 * 1. A graphic with a white background and a red rect over the whole 30 in STOP
 *    face covers, with its face mesh, exactly the R1-1 octagon's area, 8 a² tan
 *    22.5° for the apothem a of half the size, within 1e-6 m², the rounding of
 *    32-bit vertex positions.
 * 2. In the beauty, mask and graphics passes, a point 2 mm outside the octagon's
 *    diagonal flat across a cut corner lies on no drawn graphic triangle, and a
 *    point 2 mm inside it lies on one.
 * 3. In the albedo pass the graphic is hidden, so neither point is covered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the area, the per-pass corner points and the albedo case.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the graphics on the real STOP sign through the public preparer, applies each pass through applyRenderMode and reads the triangles of the graphic meshes that pass draws.
 * @evidence contracts/development/testing.md#independent-expectations The octagon's area and its diagonal flat at distance a from the centre follow from the regular octagon of across-flats size 30 in, the R1-1 blank; the hidden albedo graphic is the albedo pass's own rule.
 * @evidence contracts/development/testing.md#distinguishing-cases An unclipped square face or layer covers the outside point and exceeds the area; a clip that lost the face's middle misses the inside point or the area. Pixel readback needs a WebGL host and belongs to the visual check.
 * @evidence contracts/development/testing.md#execution-ownership In-memory Three scene graph; no renderer.
 */
export async function test_render_surface_graphic_outline(): Promise<void> {
  const sign: IAutoMovieModel = createSignPost({ model: "STOP 30 in" }, 1);
  const face: IAutoMovieAffordance = sign.affordances!.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === "face",
  )!;
  const a: number = (30 * AutoMovieArchetypeUnits.INCH) / 2;
  const scene: IAutoMovieScene = {
    id: "corner",
    name: null,
    nodes: [renderFixtureNode("stop", sign.id)],
    cameras: [],
    lights: [],
  };
  const white: { r: number; g: number; b: number; a: null; hex: null } = {
    r: 1,
    g: 1,
    b: 1,
    a: null,
    hex: null,
  };
  const tracks: IAutoMovieSurfaceGraphicTrack[] = [
    {
      node: "stop",
      surface: "face",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "printed" },
            background: white,
            layers: [
              {
                kind: "rect",
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                color: { r: 1, g: 0, b: 0, a: null, hex: null },
              },
            ],
          },
        },
      ],
    },
  ];
  const object: ReturnType<typeof buildModel> = buildModel(sign);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const graphics: IAutoMovieSurfaceGraphicsObject =
    await prepareAutoMovieSurfaceGraphics({
      shot: { surfaceGraphics: tracks, duration: 1 },
      scene,
      models: [sign],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  graphics.apply(0);
  attachAutoMovieSemanticMask(mounted.scene, {
    design: scene,
    mask: deriveAutoMovieSemanticMask({ scene, models: [sign] }),
  });
  const root: THREE.Object3D = object.object.getObjectByName(
    "surface-graphic:stop/face",
  )!;

  // The XZ triangles, in the face frame, of every graphic mesh a pass draws.
  const triangles: (mesh: THREE.Mesh) => [number, number][][] = (
    mesh: THREE.Mesh,
  ): [number, number][][] => {
    const position: THREE.BufferAttribute = mesh.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const index: ArrayLike<number> | null =
      mesh.geometry.getIndex()?.array ?? null;
    const count: number = index === null ? position.count : index.length;
    const out: [number, number][][] = [];
    for (let t: number = 0; t + 2 < count; t += 3)
      out.push(
        [0, 1, 2].map((k: number): [number, number] => {
          const i: number = index === null ? t + k : index[t + k]!;
          return [position.getX(i), position.getZ(i)];
        }),
      );
    return out;
  };
  const drawn: () => THREE.Mesh[] = (): THREE.Mesh[] => {
    const meshes: THREE.Mesh[] = [];
    root.traverseVisible((entry: THREE.Object3D): void => {
      if ((entry as THREE.Mesh).isMesh === true)
        meshes.push(entry as THREE.Mesh);
    });
    return meshes;
  };
  const covers: (point: [number, number]) => boolean = (
    point: [number, number],
  ): boolean =>
    drawn().some((mesh: THREE.Mesh): boolean =>
      triangles(mesh).some((triangle: [number, number][]): boolean => {
        const [p, q, r]: [
          [number, number],
          [number, number],
          [number, number],
        ] = triangle as [[number, number], [number, number], [number, number]];
        const side: (u: [number, number], v: [number, number]) => number = (
          u: [number, number],
          v: [number, number],
        ): number =>
          (v[0] - u[0]) * (point[1] - u[1]) - (v[1] - u[1]) * (point[0] - u[0]);
        const s: number[] = [side(p, q), side(q, r), side(r, p)];
        return s.every((v: number): boolean => v >= 0) ||
          s.every((v: number): boolean => v <= 0)
          ? s.some((v: number): boolean => v !== 0)
          : false;
      }),
    );

  // 1. The face mesh covers exactly the octagon.
  const faceMesh: THREE.Mesh = drawn()[0]!;
  const area: number = triangles(faceMesh).reduce(
    (sum: number, [p, q, r]: [number, number][]): number =>
      sum +
      Math.abs(
        (q![0] - p![0]) * (r![1] - p![1]) - (q![1] - p![1]) * (r![0] - p![0]),
      ) /
        2,
    0,
  );
  TestValidator.predicate(
    "the face covers the octagon's area",
    face.outline?.length === 8 &&
      nclose(area, 8 * a * a * Math.tan(Math.PI / 8), 1e-6),
  );

  // 2 and 3. Points across a cut corner's diagonal flat, per pass.
  const along: (distance: number) => [number, number] = (
    distance: number,
  ): [number, number] => [distance / Math.SQRT2, -distance / Math.SQRT2];
  const outside: [number, number] = along(a + 0.002);
  const inside: [number, number] = along(a - 0.002);
  for (const pass of [
    "beauty",
    "mask",
    "graphics",
    "albedo",
  ] as AutoMovieGuidePass[]) {
    const handle: IAutoMovieRenderModeHandle | null =
      pass === "beauty" ? null : applyRenderMode(mounted.scene, pass);
    TestValidator.equals(
      `${pass}: the point past the corner is bare, the point inside ${pass === "albedo" ? "too" : "covered"}`,
      [covers(outside), covers(inside)],
      [false, pass !== "albedo"],
    );
    handle?.restore();
  }
  graphics.dispose();
}

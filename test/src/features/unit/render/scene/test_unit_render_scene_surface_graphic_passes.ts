import { createDevice } from "@automovie/archetypes";
import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import type {
  AutoMovieGuidePass,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
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

import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/**
 * A surface graphic paints its whole face in its own mask colour and draws in
 * no other structural pass.
 *
 * Scenarios:
 *
 * 1. The palette derived from a subject with a phone's screen track holds
 *    `surface-graphic:phone-a/screen`, kind `surface-graphic`, owned by
 *    `node:phone-a`, joined by the graphic root's name.
 * 2. In the mask pass every mesh of the graphic, the face included although its
 *    background is transparent and the rect's depth seal on the rect's own
 *    geometry, takes that entry's colour, and the phone's case keeps the node's
 *    colour.
 * 3. In the depth, normal, outline, pose and albedo passes the graphic root is
 *    hidden, so the drawn meshes are exactly those of the scene without the
 *    track; restoring the pass shows it again.
 */
export async function test_unit_render_scene_surface_graphic_passes(): Promise<void> {
  const phone: IAutoMovieModel = createDevice({ id: "phone", kind: "phone" });
  const scene: IAutoMovieScene = {
    id: "desk",
    name: null,
    nodes: [renderFixtureNode("phone-a", phone.id)],
    cameras: [],
    lights: [],
  };
  const object: ReturnType<typeof buildModel> = buildModel(phone);
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> => object,
  );
  const drawn: () => THREE.Mesh[] = (): THREE.Mesh[] => {
    const meshes: THREE.Mesh[] = [];
    mounted.scene.traverseVisible((entry: THREE.Object3D): void => {
      if ((entry as THREE.Mesh).isMesh === true)
        meshes.push(entry as THREE.Mesh);
    });
    return meshes;
  };
  const before: Set<THREE.Mesh> = new Set(drawn());

  const tracks: IAutoMovieSurfaceGraphicTrack[] = [
    {
      node: "phone-a",
      surface: "screen",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "emissive", luminance: 300 },
            background: null,
            layers: [
              {
                kind: "rect",
                x: 0.1,
                y: 0.1,
                width: 0.3,
                height: 0.2,
                color: { r: 0, g: 1, b: 0, a: null, hex: null },
              },
            ],
          },
        },
      ],
    },
  ];
  const graphics: IAutoMovieSurfaceGraphicsObject =
    await prepareAutoMovieSurfaceGraphics({
      shot: { surfaceGraphics: tracks, duration: 1 },
      scene,
      models: [phone],
      resolveNode: (): ReturnType<typeof buildModel> => object,
    });
  graphics.apply(0);
  const root: THREE.Group = object.object.getObjectByName(
    "surface-graphic:phone-a/screen",
  ) as THREE.Group;

  // 1. The palette entry.
  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
    scene,
    models: [phone],
    surfaceGraphics: tracks,
  });
  const entry: IAutoMovieSemanticMaskEntry | undefined = mask.entries.find(
    (candidate: IAutoMovieSemanticMaskEntry): boolean =>
      candidate.id === "surface-graphic:phone-a/screen",
  );
  const node: IAutoMovieSemanticMaskEntry | undefined = mask.entries.find(
    (candidate: IAutoMovieSemanticMaskEntry): boolean =>
      candidate.id === "node:phone-a",
  );
  TestValidator.equals(
    "surface graphic entry",
    entry === undefined
      ? null
      : [entry.kind, entry.owner, entry.nodes, root.name],
    [
      "surface-graphic",
      "node:phone-a",
      ["surface-graphic:phone-a/screen"],
      "surface-graphic:phone-a/screen",
    ],
  );

  // 2. The mask pass paints the whole face in the entry's colour.
  attachAutoMovieSemanticMask(mounted.scene, { design: scene, mask });
  const masked: IAutoMovieRenderModeHandle = applyRenderMode(
    mounted.scene,
    "mask",
  );
  const colourOf: (mesh: THREE.Mesh) => string = (mesh: THREE.Mesh): string =>
    `#${(mesh.material as THREE.MeshBasicMaterial).color.getHexString().toUpperCase()}`;
  const graphicMeshes: THREE.Mesh[] = drawn().filter(
    (mesh: THREE.Mesh): boolean => !before.has(mesh),
  );
  TestValidator.predicate(
    "every graphic mesh, the face included, takes the entry's colour",
    graphicMeshes.length === 3 &&
      graphicMeshes.every(
        (mesh: THREE.Mesh): boolean => colourOf(mesh) === entry?.color,
      ),
  );
  TestValidator.predicate(
    "the case keeps the node's colour",
    [...before].every(
      (mesh: THREE.Mesh): boolean => colourOf(mesh) === node?.color,
    ),
  );
  masked.restore();

  // 3. Every other structural pass hides the graphic.
  for (const pass of [
    "depth",
    "normal",
    "outline",
    "pose",
    "albedo",
  ] as AutoMovieGuidePass[]) {
    const handle: IAutoMovieRenderModeHandle = applyRenderMode(
      mounted.scene,
      pass,
    );
    TestValidator.predicate(
      `${pass} hides the graphic`,
      root.visible === false &&
        drawn().every((mesh: THREE.Mesh): boolean => {
          let current: THREE.Object3D | null = mesh;
          while (current !== null && current !== root) current = current.parent;
          return current === null;
        }),
    );
    handle.restore();
    TestValidator.predicate(`${pass} restores the graphic`, root.visible);
  }
  graphics.dispose();
}

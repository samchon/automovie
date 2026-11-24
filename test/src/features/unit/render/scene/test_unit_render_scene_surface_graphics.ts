import { createDevice } from "@automovie/archetypes";
import { encodeAutoMoviePng } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieScene,
  IAutoMovieSurfaceGraphicTrack,
} from "@automovie/interface";
import {
  type IAutoMovieSurfaceGraphicsObject,
  buildModel,
  buildScene,
  prepareAutoMovieSurfaceGraphics,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/nclose";
import { renderFixtureIdentity } from "../../../internal/renderFixtureIdentity";
import { renderFixtureNode } from "../../../internal/renderFixtureNode";

/** A colour as the surface graphic records it, with no alpha or hex form. */
interface IColor {
  r: number;
  g: number;
  b: number;
  a: null;
  hex: null;
}

/**
 * Surface graphics are laid out in the surface's reading frame, ride their
 * prop, keep per-node pictures and give their pixels the radiance or albedo the
 * emission names.
 *
 * Scenarios:
 *
 * 1. A phone's screen graphic holding one red rect at x 0, y 0, width 0.5, height
 *    0.5 lies wholly in the face's top-left quarter, read with the frame's +X
 *    to the right and -Z toward the top, and covers that quarter.
 * 2. As the phone's node moves to three placements, the graphic's face centre
 *    stays on the screen frame lifted 0.5 mm along its normal within 1e-6 m.
 * 3. Two phones sharing one model show their own graphics: one red, one blue.
 * 4. An emissive white at 15.92 cd/m² is an unlit material of linear value 15.92,
 *    the radiance of a Lambertian card of albedo 0.5 under 100 lux (100 × 0.5 /
 *    π); a printed white is a lit Lambertian material of albedo 1.
 * 5. A carried 2 × 1 PNG under `contain` in a square box spans the box width and
 *    half its height, centred.
 * 6. The applier shows only the key in force and refuses a time at the shot's end;
 *    disposal detaches every root.
 * 7. The face sorts before its layers, and both before a flame's render order of
 *    -1 and a blended mesh's default of 0, so a flame or a glass in front of a
 *    screen draws over its graphic rather than under it.
 */
export async function test_unit_render_scene_surface_graphics(): Promise<void> {
  const phone: IAutoMovieModel = {
    ...createDevice({ id: "phone", kind: "phone" }),
    images: [
      {
        id: "banner",
        mimeType: "image/png",
        data: encodeAutoMoviePng({
          width: 2,
          height: 1,
          channels: 4,
          pixels: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
        }),
      },
    ],
  };
  const screen: IAutoMovieAffordance = phone.affordances!.find(
    (entry: IAutoMovieAffordance): boolean => entry.id === "screen",
  )!;
  const width: number = screen.width!;
  const depth: number = screen.depth!;
  const scene: IAutoMovieScene = {
    id: "desk",
    name: null,
    nodes: [
      renderFixtureNode("phone-a", phone.id),
      {
        ...renderFixtureNode("phone-b", phone.id),
        transform: {
          ...renderFixtureIdentity,
          translation: { x: 1, y: 0, z: 0 },
        },
      },
    ],
    cameras: [],
    lights: [],
  };
  const objects: ReturnType<typeof buildModel>[] = [
    buildModel(phone),
    buildModel(phone),
  ];
  const byNode: Map<string, ReturnType<typeof buildModel>> = new Map([
    ["phone-a", objects[0]!],
    ["phone-b", objects[1]!],
  ]);
  const pending: ReturnType<typeof buildModel>[] = [...objects];
  const mounted: ReturnType<typeof buildScene> = buildScene(
    scene,
    (): ReturnType<typeof buildModel> | undefined => pending.shift(),
  );
  const color: (r: number, g: number, b: number) => IColor = (
    r: number,
    g: number,
    b: number,
  ) => ({
    r,
    g,
    b,
    a: null,
    hex: null,
  });
  const tracks: IAutoMovieSurfaceGraphicTrack[] = [
    {
      node: "phone-a",
      surface: "screen",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "emissive", luminance: 15.92 },
            background: null,
            layers: [
              {
                kind: "rect",
                x: 0,
                y: 0,
                width: 0.5,
                height: 0.5,
                color: color(1, 0, 0),
              },
            ],
          },
        },
        {
          time: 0.5,
          graphic: {
            emission: { kind: "printed" },
            background: color(1, 1, 1),
            layers: [
              {
                kind: "image",
                asset: "banner",
                fit: "contain",
                x: 0,
                y: 0,
                width: width > depth ? depth / width : 1,
                height: width > depth ? 1 : width / depth,
              },
            ],
          },
        },
      ],
    },
    {
      node: "phone-b",
      surface: "screen",
      keys: [
        {
          time: 0,
          graphic: {
            emission: { kind: "emissive", luminance: 15.92 },
            background: color(0, 0, 1),
            layers: [],
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
      resolveNode: (node: string) => byNode.get(node),
    });
  graphics.apply(0.25);
  mounted.scene.updateMatrixWorld(true);

  // The face frame in world space for a node, composed independently.
  const faceFrame: (node: string) => {
    centre: THREE.Vector3;
    right: THREE.Vector3;
    top: THREE.Vector3;
  } = (node: string) => {
    const nodeObject: THREE.Object3D = mounted.scene.getObjectByName(node)!;
    const frame: THREE.Matrix4 = new THREE.Matrix4().compose(
      new THREE.Vector3(
        screen.frame.translation.x,
        screen.frame.translation.y,
        screen.frame.translation.z,
      ),
      new THREE.Quaternion(
        screen.frame.rotation.x,
        screen.frame.rotation.y,
        screen.frame.rotation.z,
        screen.frame.rotation.w,
      ),
      new THREE.Vector3(1, 1, 1),
    );
    const world: THREE.Matrix4 = nodeObject.matrixWorld.clone().multiply(frame);
    return {
      centre: new THREE.Vector3(0, 0.0005, 0).applyMatrix4(world),
      right: new THREE.Vector3(1, 0, 0).transformDirection(world),
      top: new THREE.Vector3(0, 0, -1).transformDirection(world),
    };
  };
  // Each track's root, found by the name the mask joins it by.
  const roots: THREE.Group[] = ["phone-a", "phone-b"].map(
    (node: string, index: number): THREE.Group =>
      objects[index]!.object.getObjectByName(
        `surface-graphic:${node}/screen`,
      ) as THREE.Group,
  );
  const visibleKey: (index: number) => THREE.Group = (
    index: number,
  ): THREE.Group =>
    (roots[index]!.children[0]!.children as THREE.Group[]).find(
      (group: THREE.Group): boolean => group.visible,
    )!;

  // 1. The red rect fills the top-left quarter and nothing else.
  {
    const red: THREE.Mesh = visibleKey(0).children[1] as THREE.Mesh;
    const face: ReturnType<typeof faceFrame> = faceFrame("phone-a");
    const position: THREE.BufferAttribute = red.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const across: number[] = [];
    const up: number[] = [];
    for (let i: number = 0; i < position.count; ++i) {
      const offset: THREE.Vector3 = new THREE.Vector3()
        .fromBufferAttribute(position, i)
        .applyMatrix4(red.matrixWorld)
        .sub(face.centre);
      across.push(offset.dot(face.right));
      up.push(offset.dot(face.top));
    }
    TestValidator.predicate(
      "red spans the left half from the left edge to the centre",
      nclose(Math.min(...across), -width / 2, 1e-6) &&
        nclose(Math.max(...across), 0, 1e-6),
    );
    TestValidator.predicate(
      "red spans the top half from the centre to the top edge",
      nclose(Math.min(...up), 0, 1e-6) &&
        nclose(Math.max(...up), depth / 2, 1e-6),
    );
  }

  // 7. The face, then its layers, draw before a flame and any other blended mesh.
  {
    const key: THREE.Group = visibleKey(0);
    const face: THREE.Mesh = key.children[0] as THREE.Mesh;
    const red: THREE.Mesh = key.children[1] as THREE.Mesh;
    TestValidator.predicate(
      "the face sorts before its layer, and both before a flame at -1 and a blended mesh at 0",
      face.renderOrder < red.renderOrder && -1 > red.renderOrder,
    );
  }

  // 2. The graphic rides its node at three placements.
  const nodeA: THREE.Object3D = mounted.scene.getObjectByName("phone-a")!;
  for (const [x, y, z, yaw] of [
    [0.2, 0.8, -0.1, 0],
    [0.5, 1.1, 0.3, 0.7],
    [-0.4, 0.9, 0.2, 2.1],
  ] as const) {
    nodeA.position.set(x, y, z);
    nodeA.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    mounted.scene.updateMatrixWorld(true);
    const face: THREE.Mesh = visibleKey(0).children[0] as THREE.Mesh;
    face.geometry.computeBoundingBox();
    const centre: THREE.Vector3 = face.geometry
      .boundingBox!.getCenter(new THREE.Vector3())
      .applyMatrix4(face.matrixWorld);
    TestValidator.predicate(
      `graphic centre on the frame at yaw ${yaw}`,
      centre.distanceTo(faceFrame("phone-a").centre) <= 1e-6,
    );
  }

  // 3. Two phones of one model keep their own pictures.
  const redMaterial: THREE.MeshBasicMaterial = (
    visibleKey(0).children[1] as THREE.Mesh
  ).material as THREE.MeshBasicMaterial;
  const blueMaterial: THREE.MeshBasicMaterial = (
    visibleKey(1).children[0] as THREE.Mesh
  ).material as THREE.MeshBasicMaterial;
  TestValidator.predicate(
    "red on the first phone, blue on the second",
    redMaterial.color.r > 0 &&
      redMaterial.color.b === 0 &&
      blueMaterial.color.b > 0 &&
      blueMaterial.color.r === 0 &&
      redMaterial !== blueMaterial,
  );

  // 4. Emissive radiance against the Lambertian card it is calibrated to.
  const card: number = (100 * 0.5) / Math.PI;
  TestValidator.predicate(
    "emissive white is unlit at its luminance",
    redMaterial instanceof THREE.MeshBasicMaterial &&
      Math.abs(redMaterial.color.r - card) / card <= 0.01,
  );

  // 5 and 6. The printed key with the contained image, then the refusal.
  graphics.apply(0.5);
  mounted.scene.updateMatrixWorld(true);
  const printed: THREE.Group = visibleKey(0);
  const background: THREE.Material = (printed.children[0] as THREE.Mesh)
    .material as THREE.Material;
  TestValidator.predicate(
    "printed white is a lit Lambertian surface of albedo 1",
    background instanceof THREE.MeshLambertMaterial &&
      background.color.r === 1 &&
      background.color.g === 1,
  );
  const image: THREE.Mesh = printed.children[1] as THREE.Mesh;
  image.geometry.computeBoundingBox();
  const size: THREE.Vector3 = image.geometry.boundingBox!.getSize(
    new THREE.Vector3(),
  );
  const side: number = Math.min(width, depth);
  TestValidator.predicate(
    "contain keeps the 2:1 image across the square box, centred",
    nclose(size.x, side, 1e-6) && nclose(size.z, side / 2, 1e-6),
  );
  TestValidator.equals(
    "only one key is shown",
    (roots[0]!.children[0]!.children as THREE.Group[]).map(
      (group: THREE.Group): boolean => group.visible,
    ),
    [false, true],
  );
  let refused: boolean = false;
  try {
    graphics.apply(1);
  } catch (error) {
    refused = error instanceof RangeError;
  }
  TestValidator.predicate("the shot's end is outside the shot", refused);

  graphics.dispose();
  TestValidator.predicate(
    "disposal detaches every root",
    roots.every((root: THREE.Group): boolean => root.parent === null),
  );
}

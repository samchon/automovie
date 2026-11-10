import { TestValidator } from "@nestia/e2e";
import { PNG } from "pngjs";
import * as THREE from "three";

import {
  type IAutoMovieSceneRaster,
  encodeAutoMovieRasterPng,
  rasterizeAutoMovieScene,
  stampAutoMovieRasterLabel,
} from "../../../../packages/template/scaffold/production/src/executable/viewer/node/raster";

/**
 * The Node rasterizer draws a three.js scene through its camera without a
 * browser, resolving visibility by depth, clipping behind the camera,
 * following skinned bones, and encoding a PNG any reader decodes.
 *
 * Scenarios:
 *
 * 1. An unlit red quad filling the view's centre draws pure red at the centre
 *    and the scene's background colour at a corner outside the quad.
 * 2. A near green quad hides a far red quad at the centre in either
 *    submission order.
 * 3. A quad entirely behind the camera draws nothing, and one crossing the
 *    camera plane draws only its visible half.
 * 4. Moving a skinned quad's bone sideways moves its pixels: the centre is
 *    covered before the move and empty after it.
 * 5. The PNG decodes to the same size and centre pixel, and a stamped label
 *    whitens part of the top-left corner.
 * 6. A zero-sized raster is refused.
 * 7. A point of fixed size 9 covers pixels 4 away from its centre but not 6,
 *    and a default size-1 point covers only its own pixel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws actual three.js scenes through the public rasterizer and reads its RGBA output and decoded PNG bytes, so coverage, depth, clipping, skinning and encoding are observed in pixels rather than in internal state.
 * @evidence contracts/development/testing.md#independent-expectations Expected colours are the authored sRGB bytes of unlit materials and the background; quad placements are chosen so the centre pixel lies well inside or outside each quad, independent of the rasterizer's arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts covered and uncovered pixels, both submission orders, fully behind and partly behind geometry, bone before and after a move, an invalid size, and a sized point against a default one.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes and camera and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An unlit red quad filling the view's centre draws pure red at the centre).
 */
export function test_viewer_node_raster(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    60,
    1,
    0.1,
    100,
  );
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const draw = (scene: THREE.Scene): IAutoMovieSceneRaster =>
    rasterizeAutoMovieScene({ scene, camera, width: 64, height: 64 });
  const at = (raster: IAutoMovieSceneRaster, x: number, y: number): number[] =>
    Array.from(
      raster.pixels.subarray(
        (y * raster.width + x) * 4,
        (y * raster.width + x) * 4 + 3,
      ),
    );
  const quad = (color: number, z: number, size: number = 2): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.position.z = z;
    return mesh;
  };
  const scene = (...objects: THREE.Object3D[]): THREE.Scene => {
    const s: THREE.Scene = new THREE.Scene();
    s.background = new THREE.Color(0x0000ff);
    s.add(...objects);
    return s;
  };

  // 1. Coverage and background.
  const single: IAutoMovieSceneRaster = draw(scene(quad(0xff0000, 0)));
  TestValidator.equals(
    "centre is the unlit red",
    at(single, 32, 32),
    [255, 0, 0],
  );
  TestValidator.equals(
    "corner is the background",
    at(single, 0, 0),
    [0, 0, 255],
  );

  // 2. Depth, in both orders.
  for (const order of [
    [quad(0xff0000, -1), quad(0x00ff00, 1)],
    [quad(0x00ff00, 1), quad(0xff0000, -1)],
  ])
    TestValidator.equals(
      "the near quad wins",
      at(draw(scene(...order)), 32, 32),
      [0, 255, 0],
    );

  // 3. Near-plane clipping.
  TestValidator.equals(
    "a quad behind the camera draws nothing",
    at(draw(scene(quad(0xff0000, 6))), 32, 32),
    [0, 0, 255],
  );
  const crossing: THREE.Mesh = quad(0xff0000, 0, 20);
  crossing.rotation.x = -Math.PI / 2;
  crossing.position.y = -1;
  const floor: IAutoMovieSceneRaster = draw(scene(crossing));
  TestValidator.equals(
    "the visible floor draws below the horizon",
    at(floor, 32, 60),
    [255, 0, 0],
  );
  TestValidator.equals(
    "nothing draws above the horizon",
    at(floor, 32, 4),
    [0, 0, 255],
  );

  // 4. Skinning follows the bone.
  const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1);
  const count: number = geometry.getAttribute("position").count;
  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(new Array(count * 4).fill(0), 4),
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(
      Array.from({ length: count * 4 }, (_: unknown, i: number): number =>
        i % 4 === 0 ? 1 : 0,
      ),
      4,
    ),
  );
  const bone: THREE.Bone = new THREE.Bone();
  const skinned: THREE.SkinnedMesh = new THREE.SkinnedMesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
  );
  skinned.add(bone);
  skinned.bind(new THREE.Skeleton([bone]));
  const posed: THREE.Scene = scene(skinned);
  TestValidator.equals(
    "the bound quad covers the centre",
    at(draw(posed), 32, 32),
    [255, 255, 255],
  );
  bone.position.x = 2;
  TestValidator.equals(
    "the moved bone uncovers the centre",
    at(draw(posed), 32, 32),
    [0, 0, 255],
  );

  // 5. PNG and label.
  const png: PNG = PNG.sync.read(encodeAutoMovieRasterPng(single));
  TestValidator.equals("png size", [png.width, png.height], [64, 64]);
  TestValidator.equals(
    "png centre",
    Array.from(png.data.subarray((32 * 64 + 32) * 4, (32 * 64 + 32) * 4 + 3)),
    [255, 0, 0],
  );
  stampAutoMovieRasterLabel(single, "1.5s", 2);
  let white: number = 0;
  for (let y: number = 0; y < 14; y++)
    for (let x: number = 0; x < 30; x++)
      if (at(single, x, y).every((c: number): boolean => c === 255)) white++;
  TestValidator.predicate("the label whitens the corner", white > 10);

  // 6. Refusal.
  TestValidator.error("a zero-sized raster is refused", (): void => {
    rasterizeAutoMovieScene({
      scene: new THREE.Scene(),
      camera,
      width: 0,
      height: 64,
    });
  });

  // 7. Point size in output pixels.
  const dot = (size?: number): THREE.Points =>
    new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 0, 0], 3),
      ),
      new THREE.PointsMaterial({
        color: 0xffffff,
        ...(size === undefined ? {} : { size }),
        sizeAttenuation: false,
      }),
    );
  const sized: IAutoMovieSceneRaster = draw(scene(dot(9)));
  TestValidator.equals(
    "a size-9 point covers 4 pixels out",
    at(sized, 36, 32),
    [255, 255, 255],
  );
  TestValidator.equals(
    "a size-9 point stops before 6 pixels out",
    at(sized, 38, 32),
    [0, 0, 255],
  );
  const plain: IAutoMovieSceneRaster = draw(scene(dot()));
  TestValidator.equals(
    "a default point covers its pixel",
    at(plain, 32, 32),
    [255, 255, 255],
  );
  TestValidator.equals(
    "a default point covers only its pixel",
    at(plain, 34, 32),
    [0, 0, 255],
  );
}

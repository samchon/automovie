import {
  type IAutoMovieRenderModeHandle,
  type IAutoMovieSceneRaster,
  applyAutoMovieInspectionShade,
  applyRenderMode,
  rasterizeAutoMovieScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The Node rasterizer draws the guide passes and the inspection shades the
 * way their materials state them: depth as a grey ramp, normals as colour,
 * the outline as a white shell around a black fill, each side of a surface
 * in its own colour, a wireframe as edges that take a depth pass's grey, and
 * a clipping plane as a cut.
 *
 * Scenarios:
 *
 * 1. A quad 5 m from the camera under the depth pass draws three quarters
 *    grey over a black background, the same quad 10 m away draws half grey,
 *    a 10 m range halves the near quad's grey, and restoring gives the
 *    authored colours back.
 * 2. A quad facing the camera under the normal pass draws the +Z normal
 *    colour, and the same quad turned 45 degrees about Y draws the turned
 *    normal's colour.
 * 3. A unit sphere under the outline pass with a half-metre shell draws a
 *    white ring outside its black fill and black beyond the ring, the default
 *    shell width leaves that ring pixel black, restoring gives the background
 *    back, and after the sphere moves an update brings the ring to where the
 *    sphere stands.
 * 4. A quad under the faces shade draws the front colour toward the camera
 *    and the back colour when turned away, over the unchanged background.
 * 5. A wireframe quad draws its border and leaves its interior empty, with
 *    fewer covered pixels than the same quad filled, and a triangle collapsed
 *    onto a line draws that line as a wireframe and nothing when filled.
 * 6. A quad whose material holds a clipping plane keeping positive X draws
 *    its right half only.
 * 7. A wireframe quad 5 m from the camera under the depth pass draws its
 *    border in the three quarters grey of that distance and leaves its
 *    interior black.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public guide passes and shade to actual three.js scenes and reads the rasterizer's RGBA output, so each pass is observed in pixels rather than in the override materials.
 * @evidence contracts/development/testing.md#independent-expectations Expected greys come from the documented depth mapping at authored distances, normal colours from the authored orientation, shade colours from the palette's sRGB bytes, and covered pixels from the perspective projection of authored sizes, each with a one-byte allowance for the transfer table.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts two distances and two ranges, two orientations, a wide shell against the default one, the ring around a moved sphere against the place it left, both sides of a surface, wireframe against filled for a quad and for a triangle without area, the kept half of a cut against the removed half, and a depth wireframe's grey border against its black interior.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes and camera and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A quad 5 m from the camera under the depth pass draws three quarters grey).
 */
export function test_viewer_raster_guide_passes(): void {
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
  const near = (
    title: string,
    actual: number[],
    expected: number[],
    tolerance: number = 1,
  ): void =>
    TestValidator.predicate(
      `${title}: ${actual.join(",")} within ${tolerance} of ${expected.join(",")}`,
      actual.length === expected.length &&
        actual.every(
          (value: number, i: number): boolean =>
            Math.abs(value - expected[i]!) <= tolerance,
        ),
    );

  // 1. Depth ramp.
  const shallow: THREE.Scene = scene(quad(0xff0000, 0));
  const depth: IAutoMovieRenderModeHandle = applyRenderMode(shallow, "depth");
  const ramp: IAutoMovieSceneRaster = draw(shallow);
  near(
    "a quad 5 m away is three quarters grey",
    at(ramp, 32, 32),
    [191, 191, 191],
  );
  TestValidator.equals(
    "the depth background is black",
    at(ramp, 0, 0),
    [0, 0, 0],
  );
  depth.restore();
  const restored: IAutoMovieSceneRaster = draw(shallow);
  TestValidator.equals(
    "restoring gives the quad its colour back",
    at(restored, 32, 32),
    [255, 0, 0],
  );
  TestValidator.equals(
    "restoring gives the background back",
    at(restored, 0, 0),
    [0, 0, 255],
  );
  const deep: THREE.Scene = scene(quad(0xff0000, -5));
  applyRenderMode(deep, "depth");
  near(
    "a quad 10 m away is half grey",
    at(draw(deep), 32, 32),
    [128, 128, 128],
  );
  const ranged: THREE.Scene = scene(quad(0xff0000, 0));
  applyRenderMode(ranged, "depth", { depthRange: 10 });
  near(
    "a 10 m range halves the near quad's grey",
    at(draw(ranged), 32, 32),
    [128, 128, 128],
  );

  // 2. Normal pass.
  const facing: THREE.Scene = scene(quad(0xff0000, 0));
  applyRenderMode(facing, "normal");
  near(
    "a quad facing the camera draws +Z",
    at(draw(facing), 32, 32),
    [128, 128, 255],
  );
  const turned: THREE.Mesh = quad(0xff0000, 0);
  turned.rotation.y = Math.PI / 4;
  const oblique: THREE.Scene = scene(turned);
  applyRenderMode(oblique, "normal");
  near(
    "a quad turned 45 degrees draws its normal",
    at(draw(oblique), 32, 32),
    [218, 128, 218],
  );

  // 3. Outline shell.
  const ball = (): THREE.Mesh =>
    new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    );
  const wide: THREE.Scene = scene(ball());
  const outline: IAutoMovieRenderModeHandle = applyRenderMode(wide, "outline", {
    edgeWidth: 0.5,
  });
  const ring: IAutoMovieSceneRaster = draw(wide);
  TestValidator.equals(
    "the shell is white outside the fill",
    at(ring, 46, 32),
    [255, 255, 255],
  );
  TestValidator.equals("the fill is black", at(ring, 32, 32), [0, 0, 0]);
  TestValidator.equals("beyond the shell is black", at(ring, 0, 0), [0, 0, 0]);
  outline.restore();
  const plain: IAutoMovieSceneRaster = draw(wide);
  TestValidator.equals(
    "restoring the outline gives the background back",
    at(plain, 0, 0),
    [0, 0, 255],
  );
  TestValidator.equals(
    "restoring the outline gives the sphere its colour back",
    at(plain, 32, 32),
    [255, 0, 0],
  );
  const thin: THREE.Scene = scene(ball());
  applyRenderMode(thin, "outline");
  TestValidator.equals(
    "the default shell does not reach the wide ring",
    at(draw(thin), 46, 32),
    [0, 0, 0],
  );
  // A sphere moved 1.5 m to the left: its shell spans pixels -4.5 to 32 on the middle row and its fill 2.8 to 26.5.
  const globe: THREE.Mesh = ball();
  const roaming: THREE.Scene = scene(globe);
  const follow: IAutoMovieRenderModeHandle = applyRenderMode(
    roaming,
    "outline",
    { edgeWidth: 0.5 },
  );
  globe.position.x = -1.5;
  follow.update?.();
  const moved: IAutoMovieSceneRaster = draw(roaming);
  TestValidator.equals(
    "after an update the shell is around the moved sphere",
    at(moved, 0, 32),
    [255, 255, 255],
  );
  TestValidator.equals(
    "and has left where the sphere was",
    at(moved, 46, 32),
    [0, 0, 0],
  );

  // 4. Facing shade.
  const sided: THREE.Mesh = quad(0xff0000, 0);
  const faced: THREE.Scene = scene(sided);
  const shading: { update: () => void; restore: () => void } =
    applyAutoMovieInspectionShade(faced, "faces");
  const front: IAutoMovieSceneRaster = draw(faced);
  near(
    "the side toward the camera is the front colour",
    at(front, 32, 32),
    [176, 176, 176],
  );
  TestValidator.equals(
    "the faces shade keeps the background",
    at(front, 0, 0),
    [0, 0, 255],
  );
  sided.rotation.y = Math.PI;
  near(
    "the side turned away is the back colour",
    at(draw(faced), 32, 32),
    [139, 26, 26],
  );
  shading.restore();
  TestValidator.equals(
    "ending the shade gives the quad its colour back",
    at(draw(faced), 32, 32),
    [255, 0, 0],
  );

  // 5. Wireframe.
  const covered = (raster: IAutoMovieSceneRaster): number => {
    let count: number = 0;
    for (let y: number = 0; y < raster.height; y++)
      for (let x: number = 0; x < raster.width; x++)
        if (at(raster, x, y).join(",") === "255,0,0") count++;
    return count;
  };
  const framed: THREE.Mesh = quad(0xff0000, 0, 2.075);
  const frame: THREE.Scene = scene(framed);
  const filled: number = covered(draw(frame));
  (framed.material as THREE.MeshBasicMaterial).wireframe = true;
  const wire: IAutoMovieSceneRaster = draw(frame);
  TestValidator.equals(
    "a wireframe draws its border",
    at(wire, 32, 20),
    [255, 0, 0],
  );
  TestValidator.equals(
    "a wireframe leaves its interior empty",
    at(wire, 32, 26),
    [0, 0, 255],
  );
  TestValidator.predicate(
    `a wireframe covers fewer pixels than the filled quad: ${covered(wire)} of ${filled}`,
    covered(wire) > 0 && covered(wire) < filled,
  );
  // Two vertices at one place and a third two metres to the right, 5 cm below the view axis so the collapsed triangle lies on pixel row 32.
  const collapsed: THREE.Mesh = new THREE.Mesh(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [-1, -0.05, 0, -1, -0.05, 0, 1, -0.05, 0],
        3,
      ),
    ),
    new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
  );
  const flat: THREE.Scene = scene(collapsed);
  TestValidator.equals(
    "a filled triangle without area draws nothing",
    covered(draw(flat)),
    0,
  );
  (collapsed.material as THREE.MeshBasicMaterial).wireframe = true;
  const line: IAutoMovieSceneRaster = draw(flat);
  TestValidator.equals(
    "its wireframe draws the line it collapsed onto",
    at(line, 32, 32),
    [255, 0, 0],
  );
  TestValidator.equals(
    "and nothing two rows away",
    at(line, 32, 30),
    [0, 0, 255],
  );

  // 6. Clipping plane.
  const cut: THREE.Mesh = quad(0xff0000, 0);
  (cut.material as THREE.MeshBasicMaterial).clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
  ];
  const half: IAutoMovieSceneRaster = draw(scene(cut));
  TestValidator.equals(
    "the kept side of the plane draws",
    at(half, 38, 32),
    [255, 0, 0],
  );
  TestValidator.equals(
    "the other side of the plane is cut away",
    at(half, 26, 32),
    [0, 0, 255],
  );

  // 7. Depth wireframe.
  const cage: THREE.Mesh = quad(0xff0000, 0, 2.075);
  const caged: THREE.Scene = scene(cage);
  applyRenderMode(caged, "depth");
  (cage.material as THREE.ShaderMaterial).wireframe = true;
  const edges: IAutoMovieSceneRaster = draw(caged);
  near(
    "a depth wireframe draws its border in the grey of its distance",
    at(edges, 32, 20),
    [191, 191, 191],
  );
  TestValidator.equals(
    "a depth wireframe leaves its interior black",
    at(edges, 32, 26),
    [0, 0, 0],
  );
}

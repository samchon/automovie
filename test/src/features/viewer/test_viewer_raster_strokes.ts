import {
  type IAutoMovieSceneRaster,
  rasterizeAutoMovieScene,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The Node rasterizer draws lines the way an inspection mark needs them:
 * coloured per vertex, as wide as the material says, on the layers the
 * camera sees, in front of a surface they lie on, through a surface when the
 * depth test is off, in the transparent pass when the material says so, and
 * over an earlier line at the same depth.
 *
 * Scenarios:
 *
 * 1. A white line with a red vertex and a blue vertex draws the mean of the
 *    two colours on its own row and nothing two rows away.
 * 2. A line of width 5 covers two rows either side of its own and not the
 *    third, a line of width 1 covers only its own row, and a line of width 4
 *    covers one row either side and not the second.
 * 3. A line on a layer the camera does not see is not drawn while its child
 *    on a seen layer is, and a camera that sees both layers draws both.
 * 4. A depth-tested line lying in a quad's plane is drawn over the quad,
 *    and the same line one centimetre behind the quad is hidden.
 * 5. A line a metre behind a quad is drawn through it when its depth test is
 *    off and hidden when its depth test is on.
 * 6. A line without a depth test that is attached before a quad is drawn
 *    through it at a later render order, and painted over by the quad at the
 *    same render order.
 * 7. Behind a half-transparent quad, a line without a depth test whose
 *    material is flagged transparent is drawn over the quad at a later render
 *    order and veiled by it at the same one, the same line placed nearer than
 *    the quad is drawn over it at the same render order, and a line that is
 *    not flagged is veiled whatever its render order.
 * 8. A green line drawn after a red one along the same slanted segment, from
 *    the opposite end, replaces it on every pixel at width 1 and at width 5,
 *    and the same green line pushed a centimetre farther along its lines of
 *    sight leaves every pixel red.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws actual three.js lines through the public rasterizer and reads its RGBA output, so colour, width, layers and depth behaviour are observed in pixels.
 * @evidence contracts/development/testing.md#independent-expectations Expected colours are the authored material and vertex colours, and expected rows follow from the authored width in pixels around a line placed away from a pixel boundary; for the coincident lines the expectation is that no pixel keeps the hidden line's colour, which follows from both lines covering one segment.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts covered and uncovered rows at three widths, a seen layer against an unseen one under two cameras, a line in a surface's plane against one behind it, the depth test on against off, a later render order against an equal one, and under a transparent surface a flagged line against an unflagged one, two render orders and a farther origin against a nearer one, and a second line at the first one's depth against one behind it.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes and camera and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A white line with a red vertex and a blue vertex draws the mean of the two colours).
 */
export function test_viewer_raster_strokes(): void {
  const eye = (): THREE.PerspectiveCamera => {
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
      60,
      1,
      0.1,
      100,
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    return camera;
  };
  const camera: THREE.PerspectiveCamera = eye();
  const draw = (
    scene: THREE.Scene,
    through: THREE.Camera = camera,
  ): IAutoMovieSceneRaster =>
    rasterizeAutoMovieScene({
      scene,
      camera: through,
      width: 64,
      height: 64,
    });
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
  // A horizontal line a metre either side of the view axis, 5 cm below it so
  // that its row is pixel row 32 and not a boundary between two rows.
  const stroke = (
    z: number,
    parameters: THREE.LineBasicMaterialParameters,
  ): THREE.Line =>
    new THREE.Line(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute([-1, -0.05, z, 1, -0.05, z], 3),
      ),
      new THREE.LineBasicMaterial(parameters),
    );
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
  const blue: number[] = [0, 0, 255];
  const white: number[] = [255, 255, 255];

  // 1. Vertex colours.
  const tinted: THREE.Line = stroke(0, { color: 0xffffff, vertexColors: true });
  tinted.geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute([1, 0, 0, 0, 0, 1], 3),
  );
  const mixed: IAutoMovieSceneRaster = draw(scene(tinted));
  near(
    "a segment is the mean of its vertex colours",
    at(mixed, 32, 32),
    [188, 0, 188],
  );
  TestValidator.equals(
    "a width-1 line leaves the row two above",
    at(mixed, 32, 30),
    blue,
  );

  // 2. Width in pixels.
  const five: IAutoMovieSceneRaster = draw(
    scene(stroke(0, { color: 0xffffff, linewidth: 5 })),
  );
  for (const row of [30, 31, 32, 33, 34])
    TestValidator.equals(`width 5 covers row ${row}`, at(five, 32, row), white);
  for (const row of [29, 35])
    TestValidator.equals(`width 5 leaves row ${row}`, at(five, 32, row), blue);
  const one: IAutoMovieSceneRaster = draw(
    scene(stroke(0, { color: 0xffffff, linewidth: 1 })),
  );
  TestValidator.equals("width 1 covers its row", at(one, 32, 32), white);
  for (const row of [31, 33])
    TestValidator.equals(`width 1 leaves row ${row}`, at(one, 32, row), blue);
  const four: IAutoMovieSceneRaster = draw(
    scene(stroke(0, { color: 0xffffff, linewidth: 4 })),
  );
  for (const row of [31, 32, 33])
    TestValidator.equals(`width 4 covers row ${row}`, at(four, 32, row), white);
  for (const row of [30, 34])
    TestValidator.equals(`width 4 leaves row ${row}`, at(four, 32, row), blue);

  // 3. Camera layers.
  const unseen: THREE.Line = stroke(0, { color: 0xff0000 });
  unseen.layers.set(1);
  const child: THREE.Line = stroke(0, { color: 0x00ff00 });
  child.position.y = 1;
  unseen.add(child);
  const layered: THREE.Scene = scene(unseen);
  const narrow: IAutoMovieSceneRaster = draw(layered);
  TestValidator.equals(
    "a line on an unseen layer is not drawn",
    at(narrow, 32, 32),
    blue,
  );
  TestValidator.equals(
    "its child on a seen layer is drawn",
    at(narrow, 32, 21),
    [0, 255, 0],
  );
  const both: THREE.PerspectiveCamera = eye();
  both.layers.enable(1);
  const wide: IAutoMovieSceneRaster = draw(layered, both);
  TestValidator.equals(
    "a camera that sees the layer draws the line",
    at(wide, 32, 32),
    [255, 0, 0],
  );
  TestValidator.equals(
    "and still draws the child",
    at(wide, 32, 21),
    [0, 255, 0],
  );

  // 4. Depth lead on a surface.
  TestValidator.equals(
    "a line in a quad's plane is drawn over the quad",
    at(draw(scene(quad(0xff0000, 0), stroke(0, { color: 0xffffff }))), 32, 32),
    white,
  );
  TestValidator.equals(
    "a line a centimetre behind the quad is hidden",
    at(
      draw(scene(quad(0xff0000, 0), stroke(-0.01, { color: 0xffffff }))),
      32,
      32,
    ),
    [255, 0, 0],
  );
  TestValidator.equals(
    "the same line without the quad is drawn",
    at(draw(scene(stroke(-0.01, { color: 0xffffff }))), 32, 32),
    white,
  );

  // 5. Depth test off.
  TestValidator.equals(
    "a line without a depth test is drawn through the quad",
    at(
      draw(
        scene(
          quad(0xff0000, 0),
          stroke(-1, { color: 0xffffff, depthTest: false }),
        ),
      ),
      32,
      32,
    ),
    white,
  );
  TestValidator.equals(
    "the same line with a depth test is hidden by the quad",
    at(draw(scene(quad(0xff0000, 0), stroke(-1, { color: 0xffffff }))), 32, 32),
    [255, 0, 0],
  );

  // 6. Render order.
  const through = (renderOrder: number): number[] => {
    const first: THREE.Line = stroke(-1, { color: 0xffffff, depthTest: false });
    first.renderOrder = renderOrder;
    return at(draw(scene(first, quad(0xff0000, 0))), 32, 32);
  };
  TestValidator.equals(
    "a later render order draws the line after the quad attached behind it",
    through(1),
    white,
  );
  TestValidator.equals(
    "at one render order the quad attached later paints over the line",
    through(0),
    [255, 0, 0],
  );

  // 7. Transparent pass: a half-transparent red quad at the origin, and a white line whose object stands `z` metres from it, so the two never share a depth.
  const veiled = (
    parameters: THREE.LineBasicMaterialParameters,
    renderOrder: number,
    z: number = -1,
  ): number[] => {
    const pane: THREE.Mesh = quad(0xff0000, 0);
    const glass: THREE.MeshBasicMaterial =
      pane.material as THREE.MeshBasicMaterial;
    glass.transparent = true;
    glass.opacity = 0.5;
    const mark: THREE.Line = stroke(0, {
      color: 0xffffff,
      depthTest: false,
      ...parameters,
    });
    mark.position.z = z;
    mark.renderOrder = renderOrder;
    return at(draw(scene(mark, pane)), 32, 32);
  };
  // Half red over white is the mean of the two in linear light.
  const pink: number[] = [255, 188, 188];
  TestValidator.equals(
    "a transparent line at a later render order is drawn over the pane",
    veiled({ transparent: true }, 1),
    white,
  );
  near(
    "at the pane's render order the farther line is drawn first and veiled",
    veiled({ transparent: true }, 0),
    pink,
  );
  TestValidator.equals(
    "and the nearer line is drawn after the pane",
    veiled({ transparent: true }, 0, 1),
    white,
  );
  near(
    "a line that is not flagged transparent is veiled at any render order",
    veiled({}, 1),
    pink,
  );

  // 8. Coincident strokes: a segment slanted across rows and depths, drawn red from one end and then green from the other. `away` scales the green ends' offsets from the camera, so 1 is the same segment and 1.002 the segment about a centimetre farther along the same lines of sight, on the same pixels.
  const slanted = (
    color: number,
    linewidth: number,
    forward: boolean,
    away: number,
  ): THREE.Line => {
    const ends: number[][] = [
      [-1, -0.55, -0.5],
      [1, 0.45, 0.5],
    ].map((end: number[]): number[] => [
      end[0]! * away,
      end[1]! * away,
      5 + (end[2]! - 5) * away,
    ]);
    return new THREE.Line(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          (forward ? ends : [ends[1]!, ends[0]!]).flat(),
          3,
        ),
      ),
      new THREE.LineBasicMaterial({ color, linewidth }),
    );
  };
  const tally = (
    linewidth: number,
    away: number,
  ): { red: number; green: number } => {
    const raster: IAutoMovieSceneRaster = draw(
      scene(
        slanted(0xff0000, linewidth, true, 1),
        slanted(0x00ff00, linewidth, false, away),
      ),
    );
    const counts: { red: number; green: number } = { red: 0, green: 0 };
    for (let y: number = 0; y < raster.height; y++)
      for (let x: number = 0; x < raster.width; x++) {
        const pixel: string = at(raster, x, y).join(",");
        if (pixel === "255,0,0") counts.red++;
        else if (pixel === "0,255,0") counts.green++;
      }
    return counts;
  };
  for (const linewidth of [1, 5]) {
    const same: { red: number; green: number } = tally(linewidth, 1);
    TestValidator.predicate(
      `at width ${linewidth} the later coincident line replaces the earlier on every pixel: ${same.red} red, ${same.green} green`,
      same.red === 0 && same.green > 0,
    );
    const farther: { red: number; green: number } = tally(linewidth, 1.002);
    TestValidator.predicate(
      `at width ${linewidth} the same line a centimetre farther stays hidden: ${farther.red} red, ${farther.green} green`,
      farther.red > 0 && farther.green === 0,
    );
  }
}

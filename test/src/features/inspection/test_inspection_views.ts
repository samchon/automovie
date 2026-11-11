import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionView,
  type IAutoMovieViewerSubjectBounds,
  applyAutoMovieInspection,
  parseAutoMovieInspectionView,
  resolveAutoMovieInspectionView,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";
import { nclose } from "../internal/nclose";

/**
 * One view grammar is parsed by one function and resolved into a camera by one function, for every named viewpoint, a fixed camera, the delivery camera, a subject's own view, the orthographic switch and a focus.
 *
 * Scenarios:
 *
 * 1. Each of the eight named viewpoints on a known box stands on its documented side, looks at the box's centre and holds every corner of the box, and the record keeps its position, target, up and field of view.
 * 2. The same text and bounds resolved twice give equal records.
 * 3. `front@ortho` gives an orthographic camera holding every corner, whose recorded metres per pixel equal the measured span of one pixel at the box.
 * 4. A focus pattern on one of two quads frames that quad's box, not the scene's; `@flagged` with no flagged mark throws saying none is flagged, and with one frames the flagged mark.
 * 5. A fixed view stands and looks as written with no fitting, and `film` returns the delivery camera itself.
 * 6. Malformed text and an unknown switch are refused listing the accepted forms; an unknown name is refused listing the names; a switch on a subject's own view is refused.
 * 7. A subject's own view resolved at two seconds gives two cameras, both recorded.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Parses view texts, applies an inspection for focus bounds, resolves cameras and reads their positions, directions, projections, projected corners and records.
 * @evidence contracts/development/testing.md#independent-expectations Sides come from the documented viewpoint table, containment from projecting the box's corners through the returned camera, and the orthographic scale from projecting two points one metre apart.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts every named viewpoint, perspective against orthographic, a focus against none, a flagged focus with and without a flagged mark, fitted against fixed and film views, valid against refused texts, and two seconds of a subject's view. The sphere fit itself belongs to the framing tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and cameras and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Each of the eight named viewpoints on a known box stands on its documented side).
 */
export function test_inspection_views(): void {
  const film: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const bounds: IAutoMovieViewerSubjectBounds = { min: { x: -1, y: 0, z: -0.5 }, max: { x: 1, y: 2, z: 0.5 } };
  const resolve = (
    text: string,
    box: IAutoMovieViewerSubjectBounds | null = bounds,
    seconds: number = 0,
    views?: Record<string, (seconds: number) => { position: [number, number, number]; target: [number, number, number] }>,
  ) =>
    resolveAutoMovieInspectionView({
      view: parseAutoMovieInspectionView(text),
      text,
      bounds: box,
      camera: film,
      ...(views === undefined ? {} : { views }),
      seconds,
      width: 1280,
      height: 720,
    });
  const holds = (camera: THREE.Camera, box: IAutoMovieViewerSubjectBounds): boolean =>
    [box.min.x, box.max.x].every((x: number) =>
      [box.min.y, box.max.y].every((y: number) =>
        [box.min.z, box.max.z].every((z: number): boolean => {
          const p: THREE.Vector3 = new THREE.Vector3(x, y, z).project(camera);
          return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1;
        }),
      ),
    );

  // 1. Every named viewpoint.
  const sides: Record<string, [number, number, number]> = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    right: [1, 0, 0],
    left: [-1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0],
  };
  for (const name of ["front", "back", "right", "left", "top", "bottom", "three-quarter", "three-quarter-back"]) {
    const { camera, record } = resolve(name);
    const side: THREE.Vector3 = camera.position.clone().sub(new THREE.Vector3(0, 1, 0)).normalize();
    const expected: [number, number, number] | undefined = sides[name];
    TestValidator.predicate(
      `${name} stands on its side, looks at the centre and holds the box`,
      (expected === undefined
        ? name === "three-quarter"
          ? side.x > 0 && side.y > 0 && side.z > 0
          : side.x < 0 && side.y > 0 && side.z < 0
        : nclose(side.x, expected[0]) && nclose(side.y, expected[1]) && nclose(side.z, expected[2])) &&
        nclose(record.target.x, 0) &&
        nclose(record.target.y, 1) &&
        nclose(record.target.z, 0) &&
        holds(camera, bounds) &&
        record.projection === "perspective" &&
        record.fovDeg === 40 &&
        record.metresPerPixel === null,
    );
  }
  TestValidator.predicate(
    "top looks down with -Z up",
    nclose(resolve("top").record.up.z, -1) && nclose(resolve("bottom").record.up.z, 1),
  );

  // 2. Repeatable.
  TestValidator.equals("the same text and bounds give the same camera", resolve("three-quarter@ortho").record, resolve("three-quarter@ortho").record);

  // 3. Orthographic.
  const flat = resolve("front@ortho");
  const ortho: THREE.OrthographicCamera = flat.camera as THREE.OrthographicCamera;
  const a: THREE.Vector3 = new THREE.Vector3(0, 1, 0).project(ortho);
  const b: THREE.Vector3 = new THREE.Vector3(1, 1, 0).project(ortho);
  const pixels: number = ((b.x - a.x) / 2) * 1280;
  TestValidator.predicate(
    `an orthographic camera holds the box and records its scale: ${flat.record.metresPerPixel} against ${1 / pixels}`,
    ortho instanceof THREE.OrthographicCamera &&
      flat.record.projection === "orthographic" &&
      flat.record.fovDeg === null &&
      holds(ortho, bounds) &&
      nclose(flat.record.metresPerPixel!, 1 / pixels, 1e-9),
  );

  // 4. Focus.
  const stage: THREE.Scene = InspectionScene.scene(InspectionScene.quad("near", -3, 1), InspectionScene.quad("far", 3, 1));
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["probe"] }),
    marks: [InspectionScene.mark("far/probe", "probe", 0x00aa00, { type: "points", points: [3, 2, 0] }, { flagged: true })],
  });
  const view: IAutoMovieInspectionView = parseAutoMovieInspectionView("front@focus=near");
  const focused: IAutoMovieViewerSubjectBounds | null = handle.bounds(view.type === "named" ? view.focus : null);
  TestValidator.predicate(
    `a focus frames the matched quad: ${JSON.stringify(focused)}`,
    focused !== null && nclose(focused.min.x, -3.5) && nclose(focused.max.x, -2.5),
  );
  TestValidator.predicate(
    "the focused camera centres on that quad",
    nclose(resolve("front@focus=near", focused).record.target.x, -3),
  );
  const flagged: IAutoMovieViewerSubjectBounds | null = handle.bounds({ type: "flagged" });
  TestValidator.predicate("a flagged focus frames the flagged mark", flagged !== null && nclose(flagged.min.y, 2) && nclose(flagged.max.x, 3));
  handle.restore();
  const plain: IAutoMovieInspectionHandle = applyAutoMovieInspection({ scene: stage, request: InspectionScene.ask({}) });
  try {
    plain.bounds({ type: "flagged" });
    TestValidator.predicate("no flagged mark is refused", false);
  } catch (error) {
    TestValidator.predicate("no flagged mark is refused saying so", error instanceof Error && error.message.includes("flagged"));
  }
  TestValidator.error("a focus matching nothing is refused", (): unknown => plain.bounds({ type: "pattern", pattern: "nobody" }));
  plain.restore();

  // 5. Fixed and film.
  const fixed = resolve("0,1,5:0,1,0");
  TestValidator.predicate(
    "a fixed view stands and looks as written",
    fixed.camera.position.equals(new THREE.Vector3(0, 1, 5)) &&
      nclose(fixed.camera.getWorldDirection(new THREE.Vector3()).z, -1) &&
      fixed.record.target.z === 0,
  );
  TestValidator.predicate("film is the delivery camera itself", resolve("film").camera === film);

  // 6. Refusals.
  for (const text of ["", "1,2:3", "front@zoom", "front@ortho@ortho", "film@ortho", "1,1,1:2,2,2@ortho", "front@focus=", "front@flagged@focus=a"])
    try {
      parseAutoMovieInspectionView(text);
      TestValidator.predicate(`"${text}" is refused`, false);
    } catch (error) {
      TestValidator.predicate(`"${text}" is refused listing the forms`, error instanceof Error && error.message.includes("x,y,z:tx,ty,tz"));
    }
  const orbit = (seconds: number): { position: [number, number, number]; target: [number, number, number] } => ({
    position: [seconds, 1, 4],
    target: [seconds, 1, 0],
  });
  try {
    resolve("sideways", bounds, 0, { orbit });
    TestValidator.predicate("an unknown name is refused", false);
  } catch (error) {
    TestValidator.predicate(
      "an unknown name is refused listing the names",
      error instanceof Error && error.message.includes("orbit") && error.message.includes("three-quarter-back"),
    );
  }
  TestValidator.error("a switch on a subject's view is refused", (): unknown => resolve("orbit@ortho", bounds, 0, { orbit }));

  // 7. A subject's view at two seconds.
  TestValidator.equals(
    "two seconds give two cameras",
    [0, 3].map((seconds: number) => {
      const placed = resolve("orbit", null, seconds, { orbit });
      return [placed.camera.position.toArray(), placed.record.position.x];
    }),
    [
      [[0, 1, 4], 0],
      [[3, 1, 4], 3],
    ],
  );
}

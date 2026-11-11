import type { IAutoMovieViewerSubjectBounds } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilmProduction } from "../../src/IFilmProduction";
import type { InspectionView } from "../../src/InspectionView";
import { placeInspectionView } from "../../src/placeInspectionView";
import { planInspectionViews } from "../../src/planInspectionViews";

/**
 * Pin where an inspection camera stands for each kind of view.
 *
 * Scenarios:
 * 1. A fixed view stands at its position, looks at its target and takes the picture's aspect.
 * 2. A production view is asked for its pose at the drawn second.
 * 3. A named view stands on its documented side of the box, looks at the box's centre and holds every corner of the box in the picture, in a wide and in a tall picture.
 * 4. A named view without a box and a production view the film does not define are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls placeInspectionView on real cameras and asserts the camera's position, viewing direction, aspect and the projected corners of the framed box; a camera left where it was, a stale aspect, a view from the wrong side or a cropped subject fails.
 * @evidence contracts/development/testing.md#independent-expectations Positions and directions come from the literal points given, the sides from the viewer's documented names (front on +Z, right on +X, top on +Y), and containment from projecting the box's corners through the camera's own matrices.
 * @evidence contracts/development/testing.md#distinguishing-cases One view of each placed kind, two seconds of a moving production view, three named sides in two aspects, and both refusals; reading the request text belongs to the planning test and the framing distance to the viewer's own tests.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test on in-memory cameras, discovered by test/index.ts as an exported test_ function; it mounts no film and draws nothing.
 */
export function test_place_inspection_view(): void {
  const placed = (
    view: InspectionView,
  ): Exclude<InspectionView, { kind: "film" }> => {
    if (view.kind === "film") throw new Error("the film camera is not placed");
    return view;
  };
  // Round to a micrometre; adding zero turns a negative zero into zero.
  const rounded = (vector: THREE.Vector3): number[] =>
    vector
      .toArray()
      .map((value: number): number => Math.round(value * 1e6) / 1e6 + 0);
  const direction = (camera: THREE.PerspectiveCamera): number[] =>
    rounded(camera.getWorldDirection(new THREE.Vector3()));
  const production: Pick<IFilmProduction, "views"> = {
    views: {
      orbit: (
        seconds: number,
      ): {
        position: [number, number, number];
        target: [number, number, number];
      } => ({ position: [seconds, 1, 4], target: [seconds, 1, 0] }),
    },
  };

  // A fixed view: from (0, 1, 5) toward (0, 1, 0) is straight down -Z.
  const fixed: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 1);
  const stood: ReturnType<typeof placeInspectionView> = placeInspectionView({
    camera: fixed,
    view: placed(planInspectionViews("0,1,5:0,1,0", [])[0]!),
    production: {},
    seconds: 0,
    aspect: 2,
    bounds: null,
  });
  TestValidator.equals("fixed position", fixed.position.toArray(), [0, 1, 5]);
  TestValidator.equals("fixed direction", direction(fixed), [0, 0, -1]);
  TestValidator.equals("fixed aspect", fixed.aspect, 2);
  TestValidator.equals("fixed report", stood, {
    position: [0, 1, 5],
    target: [0, 1, 0],
  });

  // A production view follows the film second.
  const preset: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 1);
  for (const seconds of [0, 3]) {
    placeInspectionView({
      camera: preset,
      view: { kind: "preset", id: "orbit" },
      production,
      seconds,
      aspect: 16 / 9,
      bounds: null,
    });
    TestValidator.equals(
      `production view at ${seconds} s`,
      preset.position.toArray(),
      [seconds, 1, 4],
    );
  }
  TestValidator.equals("production view aspect", preset.aspect, 16 / 9);

  // A named view stands on its side of the box and holds all of it.
  const bounds: IAutoMovieViewerSubjectBounds = {
    min: { x: -1, y: 0, z: -0.5 },
    max: { x: 1, y: 2, z: 0.5 },
  };
  const corners: THREE.Vector3[] = [-1, 1].flatMap(
    (x: number): THREE.Vector3[] =>
      [0, 2].flatMap((y: number): THREE.Vector3[] =>
        [-0.5, 0.5].map(
          (z: number): THREE.Vector3 => new THREE.Vector3(x, y, z),
        ),
      ),
  );
  for (const aspect of [16 / 9, 9 / 16])
    for (const [name, axis] of [
      ["front", [0, 0, 1]],
      ["right", [1, 0, 0]],
      ["top", [0, 1, 0]],
    ] as const) {
      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        40,
        1,
      );
      const report: ReturnType<typeof placeInspectionView> =
        placeInspectionView({
          camera,
          view: placed(planInspectionViews(name, [])[0]!),
          production: {},
          seconds: 0,
          aspect,
          bounds,
        });
      TestValidator.equals(
        `${name} side at ${aspect}`,
        rounded(
          camera.position
            .clone()
            .sub(new THREE.Vector3(0, 1, 0))
            .normalize(),
        ),
        [...axis],
      );
      TestValidator.equals(
        `${name} looks at the centre at ${aspect}`,
        rounded(new THREE.Vector3(...report.target)),
        [0, 1, 0],
      );
      TestValidator.equals(`${name} aspect ${aspect}`, camera.aspect, aspect);
      TestValidator.predicate(
        `${name} holds every corner at ${aspect}`,
        corners.every((corner: THREE.Vector3): boolean => {
          const projected: THREE.Vector3 = corner.clone().project(camera);
          return (
            Math.abs(projected.x) <= 1 &&
            Math.abs(projected.y) <= 1 &&
            Math.abs(projected.z) <= 1
          );
        }),
      );
    }

  TestValidator.error("named view with nothing drawn", (): unknown =>
    placeInspectionView({
      camera: new THREE.PerspectiveCamera(40, 1),
      view: placed(planInspectionViews("front", [])[0]!),
      production: {},
      seconds: 0,
      aspect: 1,
      bounds: null,
    }),
  );
  for (const [label, source] of [
    ["film without views", {}],
    ["film without that view", production],
    ["inherited key", production],
  ] as const)
    TestValidator.error(label, (): unknown =>
      placeInspectionView({
        camera: new THREE.PerspectiveCamera(40, 1),
        view: {
          kind: "preset",
          id: label === "inherited key" ? "toString" : "missing",
        },
        production: source,
        seconds: 0,
        aspect: 1,
        bounds: null,
      }),
    );
}

import type { IAutoMovieViewerSubjectBounds } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilmProduction } from "../../src/IFilmProduction";
import { placeInspectionView } from "../../src/placeInspectionView";
import { planInspectionViews } from "../../src/planInspectionViews";

/**
 * Pin which camera each kind of view draws through.
 *
 * Scenarios:
 * 1. The film view is the film's own camera, its aspect matched to the picture.
 * 2. A fixed view stands at its position and looks at its target.
 * 3. A production view is asked for its pose at the drawn second.
 * 4. A named view stands on its documented side of the box and holds every corner of it, in perspective and orthographic.
 * 5. A named view without a box is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the five scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls placeInspectionView on real cameras and asserts the returned camera's identity, position, direction, projection and the projected corners of the framed box.
 * @evidence contracts/development/testing.md#independent-expectations Positions and directions come from the literal points given, the sides from the documented names (front on +Z, right on +X), and containment from projecting the box's corners through the returned camera.
 * @evidence contracts/development/testing.md#distinguishing-cases One view of each kind, two seconds of a moving production view, both projections, and the refusal; the fitting rule itself belongs to the renderer's tests.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test on in-memory cameras, discovered by test/index.ts as an exported test_ function; it mounts no film and draws nothing.
 */
export function test_place_inspection_view(): void {
  const film: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const production: Pick<IFilmProduction, "camera" | "views"> = {
    camera: film,
    views: {
      orbit: (seconds: number): { position: [number, number, number]; target: [number, number, number] } => ({
        position: [seconds, 1, 4],
        target: [seconds, 1, 0],
      }),
    },
  };
  const place = (text: string, seconds: number = 0, bounds: IAutoMovieViewerSubjectBounds | null = null) =>
    placeInspectionView({
      view: planInspectionViews(text, ["orbit"])[0]!,
      production,
      seconds,
      width: 1280,
      height: 720,
      bounds,
    });

  // 1. Film.
  TestValidator.predicate(
    "the film view is the film camera with the picture's aspect",
    place("film").camera === film && film.aspect === 1280 / 720,
  );

  // 2. Fixed.
  const fixed = place("0,1,5:0,1,0");
  TestValidator.equals(
    "a fixed view stands and looks as given",
    [fixed.camera.position.toArray(), fixed.camera.getWorldDirection(new THREE.Vector3()).toArray().map((v: number) => Math.round(v * 1e6) / 1e6 + 0)],
    [[0, 1, 5], [0, 0, -1]],
  );

  // 3. A production view.
  for (const seconds of [0, 3])
    TestValidator.equals(`production view at ${seconds} s`, place("orbit", seconds).camera.position.toArray(), [seconds, 1, 4]);

  // 4. Named views hold the box.
  const bounds: IAutoMovieViewerSubjectBounds = { min: { x: -1, y: 0, z: -0.5 }, max: { x: 1, y: 2, z: 0.5 } };
  for (const text of ["front", "right", "front@ortho", "right@ortho"]) {
    const { camera } = place(text, 0, bounds);
    TestValidator.equals(
      `${text} projection`,
      camera instanceof THREE.OrthographicCamera,
      text.endsWith("@ortho"),
    );
    const side: THREE.Vector3 = camera.position.clone().sub(new THREE.Vector3(0, 1, 0)).normalize();
    TestValidator.predicate(
      `${text} stands on its side`,
      text.startsWith("front") ? side.z > 0.999 : side.x > 0.999,
    );
    TestValidator.predicate(
      `${text} holds every corner`,
      [-1, 1].every((x: number) =>
        [0, 2].every((y: number) =>
          [-0.5, 0.5].every((z: number): boolean => {
            const p: THREE.Vector3 = new THREE.Vector3(x, y, z).project(camera);
            return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1;
          }),
        ),
      ),
    );
  }

  // 5. Nothing to frame.
  TestValidator.error("a named view with nothing drawn", (): unknown => place("front"));
}

import {
  IAutoMovieResolvedCamera,
  intersectsPerspectiveFrustumBox,
  intersectsPerspectiveFrustumSegment,
  intersectsPerspectiveFrustumSphere,
  projectToNdc,
  resolveAutoMovieDeliveryCrop,
} from "@automovie/engine";
import { IAutoMovieDeliveryCrop } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const CAMERA: IAutoMovieResolvedCamera = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

const RIGHT_HALF: IAutoMovieDeliveryCrop = {
  left: 0.5,
  top: 0,
  right: 1,
  bottom: 1,
};

const segment: (
  x: number,
  crop: IAutoMovieDeliveryCrop | undefined,
) => boolean = (x: number, crop: IAutoMovieDeliveryCrop | undefined): boolean =>
  intersectsPerspectiveFrustumSegment({
    camera: CAMERA,
    from: { x, y: 0, z: -2 },
    to: { x, y: 0.5, z: -2 },
    near: 1,
    far: 10,
    halfY: 1,
    aspect: 1,
    crop,
  });

const verticalSegment: (
  y: number,
  crop: IAutoMovieDeliveryCrop | undefined,
) => boolean = (y: number, crop: IAutoMovieDeliveryCrop | undefined): boolean =>
  intersectsPerspectiveFrustumSegment({
    camera: CAMERA,
    from: { x: 0, y, z: -2 },
    to: { x: 0.5, y, z: -2 },
    near: 1,
    far: 10,
    halfY: 1,
    aspect: 1,
    crop,
  });

/**
 * Delivery crop is one validated gate across point and bounded projection.
 *
 * Scenarios:
 *
 * 1. Omitted and explicit whole crops leave projection unchanged.
 * 2. A resolved crop owns its copied edges and remaps its window to output NDC.
 * 3. The right half includes both horizontal edges and excludes either outside
 *    neighbour while the whole gate still accepts the crop-only negative.
 * 4. A bottom-half crop respects top-origin vertical edges and their negatives.
 * 5. Boxes and zero-radius spheres share the off-axis crop boundary.
 * 6. Five nonfinite, out-of-range, empty, or reversed crops throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveAutoMovieDeliveryCrop, projectToNdc, and segment/box/sphere frustum predicates to observe copying, whole-gate parity, affine NDC remapping, closed edges, and invalid crop refusal.
 * @evidence contracts/testing.md#independent-expectations Identity camera, unit half-angle tangent, and depth two place uncropped sides at x/y plus or minus two. Authored half/central crop fractions determine fixed boundary booleans and projected (1,0.5,1); the copied central crop retains literal 0.25/0.75 edges after its source is mutated.
 * @evidence contracts/testing.md#distinguishing-cases Exact edge contact and 0.001 metre neighbours distinguish closed clipping from padding; horizontal versus top-origin vertical crops expose sign conventions, and the whole-gate negative twin distinguishes cropping from ordinary frustum exclusion.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous pure mathematical functions and local records, with one deliberate caller-owned source mutation to test copying. No renderer, resource access, clock, process state, or dependency replacement is involved; exact numeric record checks reuse existing test12ValuesClose, and zero-radius spheres do not exercise conservative finite-radius corner behavior.
 */
export function test_film_camera_delivery_crop(): void {
  const whole: ReturnType<typeof resolveAutoMovieDeliveryCrop> =
    resolveAutoMovieDeliveryCrop(undefined);
  const explicitWhole: IAutoMovieDeliveryCrop = {
    left: 0,
    top: 0,
    right: 1,
    bottom: 1,
  };
  const uncropped: ReturnType<typeof projectToNdc> = projectToNdc(
    CAMERA,
    { x: 0.5, y: 0.25, z: -1 },
    1,
    1,
  );
  const explicit: ReturnType<typeof projectToNdc> = projectToNdc(
    CAMERA,
    { x: 0.5, y: 0.25, z: -1 },
    1,
    1,
    explicitWhole,
  );
  TestValidator.predicate(
    "omitted and explicit whole crops are exact no-ops",
    test12ValuesClose(
      { whole, explicit, uncropped },
      { whole: explicitWhole, explicit: uncropped, uncropped },
    ),
  );

  const source: IAutoMovieDeliveryCrop = {
    left: 0.25,
    top: 0.25,
    right: 0.75,
    bottom: 0.75,
  };
  const resolved: ReturnType<typeof resolveAutoMovieDeliveryCrop> =
    resolveAutoMovieDeliveryCrop(source);
  source.left = 0;
  TestValidator.predicate(
    "a crop resolves by value and maps its window onto the complete output",
    test12ValuesClose(
      {
        resolved,
        projected: projectToNdc(
          CAMERA,
          { x: 0.5, y: 0.25, z: -1 },
          1,
          1,
          resolved,
        ),
      },
      {
        resolved: { left: 0.25, top: 0.25, right: 0.75, bottom: 0.75 },
        projected: { ndcX: 1, ndcY: 0.5, depth: 1 },
      },
    ),
  );

  TestValidator.equals(
    "closed crop edges include exact contact and reject either outside side",
    namedFacts([
      ["leftEdge", (): boolean => segment(0, RIGHT_HALF)],
      ["rightEdge", (): boolean => segment(2, RIGHT_HALF)],
      ["leftOutside", (): boolean => segment(-0.001, RIGHT_HALF) === false],
      ["rightOutside", (): boolean => segment(2.001, RIGHT_HALF) === false],
      [
        "cropOnlyRejection",
        (): boolean =>
          segment(-0.001, undefined) && !segment(-0.001, RIGHT_HALF),
      ],
      [
        "wholeParity",
        (): boolean => segment(-1, undefined) === segment(-1, explicitWhole),
      ],
    ]),
    {
      leftEdge: true,
      rightEdge: true,
      leftOutside: true,
      rightOutside: true,
      cropOnlyRejection: true,
      wholeParity: true,
    },
  );

  const BOTTOM_HALF: IAutoMovieDeliveryCrop = {
    left: 0,
    top: 0.5,
    right: 1,
    bottom: 1,
  };
  TestValidator.equals(
    "top-origin vertical crop includes both exact edges and rejects outside",
    namedFacts([
      ["topEdge", (): boolean => verticalSegment(0, BOTTOM_HALF)],
      ["bottomEdge", (): boolean => verticalSegment(-2, BOTTOM_HALF)],
      ["topOutside", (): boolean => !verticalSegment(0.001, BOTTOM_HALF)],
      ["bottomOutside", (): boolean => !verticalSegment(-2.001, BOTTOM_HALF)],
    ]),
    { topEdge: true, bottomEdge: true, topOutside: true, bottomOutside: true },
  );

  TestValidator.equals(
    "box and sphere acceptance use the same off-axis delivery gate",
    namedFacts([
      [
        "boxAtCropEdge",
        (): boolean =>
          intersectsPerspectiveFrustumBox({
            camera: CAMERA,
            min: { x: 0, y: -0.1, z: -2.1 },
            max: { x: 0.1, y: 0.1, z: -1.9 },
            near: 1,
            far: 10,
            halfY: 1,
            aspect: 1,
            crop: RIGHT_HALF,
          }),
      ],
      [
        "boxOutsideCrop",
        (): boolean =>
          intersectsPerspectiveFrustumBox({
            camera: CAMERA,
            min: { x: -0.2, y: -0.1, z: -2.1 },
            max: { x: -0.1, y: 0.1, z: -1.9 },
            near: 1,
            far: 10,
            halfY: 1,
            aspect: 1,
            crop: RIGHT_HALF,
          }) === false,
      ],
      [
        "sphereAtCropEdge",
        (): boolean =>
          intersectsPerspectiveFrustumSphere({
            camera: CAMERA,
            center: { x: 0, y: 0, z: -2 },
            radius: 0,
            near: 1,
            far: 10,
            halfY: 1,
            aspect: 1,
            crop: RIGHT_HALF,
          }),
      ],
      [
        "sphereOutsideCrop",
        (): boolean =>
          intersectsPerspectiveFrustumSphere({
            camera: CAMERA,
            center: { x: -0.001, y: 0, z: -2 },
            radius: 0,
            near: 1,
            far: 10,
            halfY: 1,
            aspect: 1,
            crop: RIGHT_HALF,
          }) === false,
      ],
    ]),
    {
      boxAtCropEdge: true,
      boxOutsideCrop: true,
      sphereAtCropEdge: true,
      sphereOutsideCrop: true,
    },
  );

  const invalid: IAutoMovieDeliveryCrop[] = [
    { left: Number.NaN, top: 0, right: 1, bottom: 1 },
    { left: -0.1, top: 0, right: 1, bottom: 1 },
    { left: 0, top: 0, right: 1.1, bottom: 1 },
    { left: 0.5, top: 0, right: 0.5, bottom: 1 },
    { left: 0, top: 0.75, right: 1, bottom: 0.25 },
  ];
  TestValidator.predicate(
    "invalid and out-of-raster crop regions fail closed",
    invalid.every((crop: IAutoMovieDeliveryCrop): boolean =>
      throwsError(
        (): ReturnType<typeof resolveAutoMovieDeliveryCrop> =>
          resolveAutoMovieDeliveryCrop(crop),
      ),
    ),
  );
}

import {
  compileCameraMove,
  intersectsPerspectiveFrustumSegment,
  projectToNdc,
  resolveCameraAt,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const HEIGHT: number = 1.7;
const ASPECT: number = 16 / 9;

const camera: () => IAutoMovieCamera = (): IAutoMovieCamera => ({
  id: "cam",
  transform: {
    translation: { x: 0, y: 1, z: 6 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 40,
  near: 0.1,
  far: 200,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
});

const frame: (
  framing: IAutoMovieCameraAction["framing"],
) => IAutoMovieCameraAction = (
  framing: IAutoMovieCameraAction["framing"],
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start: 0,
  duration: "auto",
  framing,
  move: "static",
  on: { kind: "node", node: "hero" },
});

/** Solve the live camera for one framing of a subject standing at `base`. */
const solved: (
  framing: IAutoMovieCameraAction["framing"],
  base: IAutoMovieVector3,
) => ReturnType<typeof resolveCameraAt> = (
  framing: IAutoMovieCameraAction["framing"],
  base: IAutoMovieVector3,
): ReturnType<typeof resolveCameraAt> => {
  const live: IAutoMovieCamera = camera();
  const clip: ReturnType<typeof compileCameraMove> = compileCameraMove({
    clipId: "clip",
    camera: live,
    entries: [
      { action: frame(framing), subject: { base, height: HEIGHT, at: null } },
    ],
    shotDuration: 4,
  });
  return resolveCameraAt(live.transform, clip, live.id, 2);
};

const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Whether a subject standing at `base` reads through a camera framed on
 * `framedOn`. The two differ only in the negative case: a camera re-solved on
 * the displaced subject would simply follow it, which tests nothing.
 */
const readable: (
  framing: IAutoMovieCameraAction["framing"],
  base: IAutoMovieVector3,
  framedOn?: IAutoMovieVector3,
) => boolean = (
  framing: IAutoMovieCameraAction["framing"],
  base: IAutoMovieVector3,
  framedOn: IAutoMovieVector3 = base,
): boolean =>
  intersectsPerspectiveFrustumSegment({
    camera: solved(framing, framedOn),
    from: base,
    to: { x: base.x, y: base.y + HEIGHT, z: base.z },
    near: camera().near,
    far: camera().far,
    halfY: Math.tan((camera().fovY * Math.PI) / 360),
    aspect: ASPECT,
  });

/**
 * A required subject reads when the camera's frame contains part of the
 * subject, not when it contains the subject's ground point.
 *
 * The intended shot sizes provide the semantic oracle: wide and full include
 * the ground point, while medium and close can include the body without its
 * ground point. The staged camera has a slightly tilted bearing; no exact
 * world-height band is inferred from a perpendicular pinhole approximation.
 *
 * Scenarios:
 *
 * 1. All four framings read a correctly staged subject, including the cropped
 *    medium and close shot sizes.
 * 2. The negative twin: with the camera still framed on the origin, a subject
 *    displaced 1,000 m sideways reads at no framing, so widening the test did
 *    not make readability unconditional.
 * 3. The ground point alone still fails `medium` and `close` and still passes
 *    `wide` and `full`, which is exactly the asymmetry that made the point test
 *    wrong. This case tests point projection, not a separate zero-height solve.
 * 4. A subject behind the camera fails on the near plane, and one past `far` fails
 *    on the far plane, at a framing that otherwise reads.
 * 5. Horizontal segments at body height and far above the frame distinguish
 *    intersection from unconditional acceptance.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles and resolves each camera framing, then compares segment/frustum intersection with ground-point projection and with displaced, behind-lens, beyond-far, and high horizontal segments.
 * @evidence contracts/testing.md#independent-expectations Fixed boolean expectations express the intended shot-size semantics and the independently chosen extreme positions; no observed engine output is reused as an expected readability result.
 * @evidence contracts/testing.md#distinguishing-cases All four positive shot sizes are paired with an unfollowed 1000 metre displacement. Medium and close must read the body while rejecting its ground point, and depth and vertical negatives prevent a broad always-visible implementation.
 * @evidence contracts/testing.md#execution-ownership Runs synchronous compilation, clip sampling, projection, and mathematical intersection on local records without a renderer, external resources, clock, or replacement of product dependencies; the result is sampled numerical visibility rather than rendered-image proof.
 */
export function test_film_camera_subject_readability(): void {
  const framings: readonly ["wide", "full", "medium", "close"] = [
    "wide",
    "full",
    "medium",
    "close",
  ];

  TestValidator.equals(
    "every shot size reads a correctly staged subject",
    namedFacts(
      framings.map(
        (f: IAutoMovieCameraAction["framing"]): [string, () => boolean] => [
          f,
          (): boolean => readable(f, ORIGIN),
        ],
      ),
    ),
    { wide: true, full: true, medium: true, close: true },
  );
  TestValidator.equals(
    "a displaced subject reads at no shot size",
    namedFacts(
      framings.map(
        (f: IAutoMovieCameraAction["framing"]): [string, () => boolean] => [
          f,
          (): boolean => readable(f, { x: 1_000, y: 0, z: 0 }, ORIGIN),
        ],
      ),
    ),
    { wide: false, full: false, medium: false, close: false },
  );

  const groundOnly: (framing: IAutoMovieCameraAction["framing"]) => boolean = (
    framing: IAutoMovieCameraAction["framing"],
  ): boolean => {
    const resolved: ReturnType<typeof resolveCameraAt> = solved(
      framing,
      ORIGIN,
    );
    const halfY: number = Math.tan((camera().fovY * Math.PI) / 360);
    const projection: ReturnType<typeof projectToNdc> = projectToNdc(
      resolved,
      ORIGIN,
      halfY,
      ASPECT,
    );
    return (
      projection.depth >= camera().near &&
      projection.depth <= camera().far &&
      Math.abs(projection.ndcX) <= 1 &&
      Math.abs(projection.ndcY) <= 1
    );
  };
  TestValidator.equals(
    "the ground point alone is what the cropped shot sizes exclude",
    namedFacts(
      framings.map(
        (f: IAutoMovieCameraAction["framing"]): [string, () => boolean] => [
          f,
          (): boolean => groundOnly(f),
        ],
      ),
    ),
    { wide: true, full: true, medium: false, close: false },
  );

  const depthProbe: (
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ) => boolean = (from: IAutoMovieVector3, to: IAutoMovieVector3): boolean =>
    intersectsPerspectiveFrustumSegment({
      camera: solved("wide", ORIGIN),
      from,
      to,
      near: camera().near,
      far: camera().far,
      halfY: Math.tan((camera().fovY * Math.PI) / 360),
      aspect: ASPECT,
    });
  const behind: number = solved("wide", ORIGIN).position.z + 1;
  TestValidator.equals(
    "depth bounds still refuse a subject the frame cannot show",
    namedFacts([
      [
        "behindTheLens",
        (): boolean =>
          depthProbe({ x: 0, y: 0, z: behind }, { x: 0, y: HEIGHT, z: behind }),
      ],
      [
        "beyondFar",
        (): boolean =>
          depthProbe({ x: 0, y: 0, z: -1_000 }, { x: 0, y: HEIGHT, z: -1_000 }),
      ],
    ]),
    { behindTheLens: false, beyondFar: false },
  );

  // Fixed horizontal segments distinguish body-height intersection from a
  // segment far above the frame without assuming a particular clipping branch.
  TestValidator.equals(
    "a horizontal segment is decided by its own position",
    namedFacts([
      [
        "insideTheFrame",
        (): boolean =>
          depthProbe({ x: -0.2, y: 0.85, z: 0 }, { x: 0.2, y: 0.85, z: 0 }),
      ],
      [
        "outsideTheFrame",
        (): boolean =>
          depthProbe({ x: -0.2, y: 1_000, z: 0 }, { x: 0.2, y: 1_000, z: 0 }),
      ],
    ]),
    { insideTheFrame: true, outsideTheFrame: false },
  );
}

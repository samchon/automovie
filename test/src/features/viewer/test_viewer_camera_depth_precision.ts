import type { IAutoMovieCamera, IAutoMovieScene } from "@automovie/interface";
import {
  assertAutoMovieViewerCameraDepthPrecision,
  buildScene,
  evaluateAutoMovieViewerCameraDepthPrecision,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

const sourceCamera: (overrides?: Partial<IAutoMovieCamera>) => IAutoMovieCamera = (
  overrides: Partial<IAutoMovieCamera> = {},
): IAutoMovieCamera => {
  const camera: IAutoMovieCamera = {
    id: "camera-main",
    transform: {
      translation: { x: 0, y: 1, z: 10 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    fovY: 45,
    near: 0.25,
    far: 250,
    depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.1 },
    ...overrides,
  };
  camera.depthPrecision = overrides.depthPrecision ?? camera.depthPrecision;
  return camera;
};

const realizedCamera: (source?: IAutoMovieCamera) => THREE.PerspectiveCamera = (
  source: IAutoMovieCamera = sourceCamera(),
): THREE.PerspectiveCamera => {
  const scene: IAutoMovieScene = {
    id: "scene",
    name: null,
    nodes: [],
    cameras: [source],
    lights: [],
  };
  return buildScene(scene, (): undefined => undefined).cameras[0]!;
};

const renderer: (bits: unknown, logarithmic?: boolean, reversed?: boolean) => THREE.WebGLRenderer = (
  bits: unknown,
  logarithmic: boolean = false,
  reversed: boolean = false,
): THREE.WebGLRenderer => {
  const depthBits: number = 0x0d56;
  return {
    capabilities: {
      logarithmicDepthBuffer: logarithmic,
      reversedDepthBuffer: reversed,
    },
    getContext: (): { DEPTH_BITS: number; getParameter: (parameter: number) => unknown } => ({
      DEPTH_BITS: depthBits,
      getParameter: (parameter: number): unknown =>
        parameter === depthBits ? bits : null,
    }),
  } as unknown as THREE.WebGLRenderer;
};

/** Local authored camera and capability operands for the portable observation seam. */
type EvaluateProps = {
  source?: IAutoMovieCamera;
  realized?: THREE.PerspectiveCamera;
  bits?: unknown;
  logarithmic?: boolean;
  reversed?: boolean;
};
const evaluate: (props: EvaluateProps) => ReturnType<typeof evaluateAutoMovieViewerCameraDepthPrecision> = (props: EvaluateProps): ReturnType<typeof evaluateAutoMovieViewerCameraDepthPrecision> => {
  const source: IAutoMovieCamera = props.source ?? sourceCamera();
  return evaluateAutoMovieViewerCameraDepthPrecision({
    renderer: renderer(props.bits ?? 24, props.logarithmic, props.reversed),
    source,
    realized: props.realized ?? realizedCamera(source),
  });
};

/**
 * Three camera clips and supplied capability operands retain addressed admission.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual depth-capability evaluator/wrapper with native cameras and a supplied query port, checking satisfied, mismatched, insufficient, invalid-source/capability and nonstandard-mode reports. Nonfinite observations must become null and the throwing wrapper must distinguish the passing and refused operands.
 * @evidence contracts/testing.md#independent-expectations Authored clips 0.25/250 and required 24 bits define the expected source/native fields; supplied observations 24 versus 23 distinguish the capability threshold. These are explicit operands, not actual GPU measurements, and this unit does not independently certify a metric maximum-step bound or custom projection matrix.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts exact clips with far=251, standard with logarithmic/reversed modes, integer capability with string/fractional/negative operands, and finite positive source fields with invalid identity/clip/bit/budget boundaries. Native framebuffer integration and engine depth-error derivation belong to their owners.
 * @evidence contracts/testing.md#execution-ownership The named portable unit directly invokes observation semantics through an owned structural renderer query port and actual Three camera construction. It starts no WebGL renderer, browser or GPU; local predicates own every case without dynamic registration.
 */
export function test_viewer_camera_depth_precision(): void {
  const accepted: ReturnType<typeof evaluate> = evaluate({});
  TestValidator.equals(
    "buildScene and a supplied standard 24-bit capability preserve the declaration",
    { camera: accepted.camera, minimumDepthBits: accepted.minimumDepthBits,
      observedDepthBits: accepted.observedDepthBits, projection: accepted.projection,
      status: accepted.status, passed: accepted.passed },
    {
      camera: "camera-main",
      minimumDepthBits: 24,
      observedDepthBits: 24,
      projection: "standard",
      status: "satisfied",
      passed: true,
    },
  );
  TestValidator.predicate("authored and realized clip values are preserved",
    accepted.sourceNear !== null && accepted.sourceFar !== null &&
      accepted.realizedNear !== null && accepted.realizedFar !== null &&
      nclose(accepted.sourceNear, 0.25, 0) && nclose(accepted.sourceFar, 250, 0) &&
      nclose(accepted.realizedNear, 0.25, 0) && nclose(accepted.realizedFar, 250, 0));

  const mismatched: THREE.PerspectiveCamera = realizedCamera();
  mismatched.far = 251;
  TestValidator.equals(
    "near/far mismatch and insufficient supplied bits are distinct refusals",
    [evaluate({ realized: mismatched }).status, evaluate({ bits: 23 }).status],
    ["projection-mismatch", "insufficient-capability"],
  );

  TestValidator.equals(
    "non-standard depth modes cannot impersonate the fixed-point metric",
    [
      evaluate({ logarithmic: true }).projection,
      evaluate({ reversed: true }).projection,
      evaluate({ logarithmic: true, reversed: true }).projection,
    ],
    ["logarithmic", "reversed", "logarithmic-reversed"],
  );

  TestValidator.equals(
    "invalid supplied capability observations stay addressed",
    [
      evaluate({ bits: "24" }),
      evaluate({ bits: 1.5 }),
      evaluate({ bits: -1 }),
    ].map((report: ReturnType<typeof evaluate>): ReturnType<typeof evaluate>["status"] => report.status),
    ["invalid-capability", "invalid-capability", "invalid-capability"],
  );

  const invalidSources: IAutoMovieCamera[] = [
    sourceCamera({ id: " " }),
    sourceCamera({ near: Number.NaN }),
    sourceCamera({ near: 0 }),
    sourceCamera({ far: Number.POSITIVE_INFINITY }),
    sourceCamera({ near: 1, far: 1 }),
    sourceCamera({
      depthPrecision: { minimumDepthBits: 1.5, maximumStepMeters: 1 },
    }),
    sourceCamera({
      depthPrecision: { minimumDepthBits: 0, maximumStepMeters: 1 },
    }),
    sourceCamera({
      depthPrecision: { minimumDepthBits: 54, maximumStepMeters: 1 },
    }),
    sourceCamera({
      depthPrecision: {
        minimumDepthBits: 24,
        maximumStepMeters: Number.NaN,
      },
    }),
    sourceCamera({
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0 },
    }),
  ];
  TestValidator.predicate(
    "malformed portable camera operands never become viewer capability passes",
    invalidSources.every(
      (source: IAutoMovieCamera): boolean => evaluate({ source }).status === "invalid-source",
    ),
  );

  const nonFinite: IAutoMovieCamera = sourceCamera({ near: Number.NaN });
  const nonFiniteRealized: THREE.PerspectiveCamera = realizedCamera();
  nonFiniteRealized.far = Number.POSITIVE_INFINITY;
  const serializable: ReturnType<typeof evaluate> = evaluate({
    source: nonFinite,
    realized: nonFiniteRealized,
    bits: "unknown",
  });
  TestValidator.equals(
    "non-finite and non-numeric observations serialize as null",
    [
      serializable.sourceNear,
      serializable.realizedFar,
      serializable.observedDepthBits,
    ],
    [null, null, null],
  );

  TestValidator.equals(
    "assertion returns the passing report and throws the exact negative twin",
    namedFacts([
      [
        "pass",
        (): boolean =>
          assertAutoMovieViewerCameraDepthPrecision({
            renderer: renderer(24),
            source: sourceCamera(),
            realized: realizedCamera(),
          }).passed,
      ],
      [
        "refuse",
        (): boolean =>
          throwsError((): ReturnType<typeof assertAutoMovieViewerCameraDepthPrecision> =>
            assertAutoMovieViewerCameraDepthPrecision({
              renderer: renderer(16),
              source: sourceCamera(),
              realized: realizedCamera(),
            }),
          ),
      ],
    ]),
    { pass: true, refuse: true },
  );
}

import { validateShotArtifact } from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieCameraIntent,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieShotCoverage,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../../internal/predicates";

/** The identity placement every staged object starts from. */
const transform: () => IAutoMovieTransform = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/** A scene camera looking from the origin with the given vertical field. */
const camera: (id: string, fovY: number) => IAutoMovieCamera = (
  id: string,
  fovY: number,
): IAutoMovieCamera => ({
  id,
  transform: transform(),
  fovY,
  near: 0.1,
  far: 100,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
});

/** A scene the shot validator cross-references without complaint. */
const scene: () => IAutoMovieScene = (): IAutoMovieScene => ({
  id: "sc",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "m",
      transform: transform(),
      motion: null,
      pose: null,
    },
  ],
  cameras: [camera("cam", 50), camera("wide", 70)],
  lights: [
    {
      id: "key",
      transform: transform(),
      color: { r: 1, g: 1, b: 1, a: null, hex: null },
      intensity: 1,
      type: "spot",
      range: 10,
      coneAngle: 30,
    },
  ],
});

/** A shot the validator accepts, so each case reports only what it broke. */
const shot: (overrides?: Partial<IAutoMovieShot>) => IAutoMovieShot = (
  overrides: Partial<IAutoMovieShot> = {},
): IAutoMovieShot => ({
  id: "opening",
  name: null,
  scene: "sc",
  camera: "cam",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration: 2,
  ...overrides,
});

/** An event the validator accepts. */
const event: (
  overrides?: Partial<IAutoMovieInteractionEvent>,
) => IAutoMovieInteractionEvent = (
  overrides: Partial<IAutoMovieInteractionEvent> = {},
): IAutoMovieInteractionEvent => ({
  id: "contact-1",
  kind: "contact",
  source: "collisionSolver",
  time: 1,
  actor: null,
  target: null,
  object: null,
  reaction: null,
  point: null,
  actionIndex: null,
  ...overrides,
});

/** A camera intent span the validator accepts. */
const intent: (
  overrides?: Partial<IAutoMovieCameraIntent>,
) => IAutoMovieCameraIntent = (
  overrides: Partial<IAutoMovieCameraIntent> = {},
): IAutoMovieCameraIntent => ({
  start: 0,
  framing: "medium",
  move: "static",
  focus: null,
  focalLength: null,
  ...overrides,
});

/**
 * A coverage take the validator accepts.
 *
 * Coverage plays another angle, so its camera is never the shot's own `cam`.
 */
const take: (
  overrides?: Partial<IAutoMovieShotCoverage>,
) => IAutoMovieShotCoverage = (
  overrides: Partial<IAutoMovieShotCoverage> = {},
): IAutoMovieShotCoverage => ({
  camera: "wide",
  cameraMotion: null,
  cameraIntent: [],
  ...overrides,
});

/**
 * A light-time clip the validator accepts.
 *
 * The scene stages `key` as a spot light, so `/lights/key/intensity` addresses
 * a property that light actually carries.
 */
const lightClip: (overrides?: Partial<IAutoMovieTrack>) => IAutoMovieClip = (
  overrides: Partial<IAutoMovieTrack> = {},
): IAutoMovieClip => ({
  id: "key-fade",
  name: null,
  duration: 2,
  loop: false,
  tracks: [
    {
      channel: {
        kind: "pointer",
        pointer: "/lights/key/intensity",
        valueType: "scalar",
      },
      times: [0, 1],
      values: [1, 0],
      interpolation: "linear",
      ...overrides,
    },
  ],
});

/** An empty object clip with the given id. */
const objectClip: (id: string) => IAutoMovieClip = (
  id: string,
): IAutoMovieClip => ({ id, name: null, duration: 1, loop: false, tracks: [] });

const pathsOf: (validation: IAutoMovieValidation) => string[] = (
  validation: IAutoMovieValidation,
): string[] =>
  validation.success === true
    ? []
    : validation.violations.map(
        (violation: IAutoMovieConstraintViolation): string => violation.path,
      );

interface IShotCase {
  title: string;
  shot: IAutoMovieShot;
  path: string;
}

/**
 * Requires a located error for each out-of-range or unresolved shot field.
 *
 * Scenarios:
 *
 * 1. References: a scene that is not the scene beside it, and a camera no scene
 *    camera supplies.
 * 2. Duration: a non-positive span.
 * 3. Performances: a node the scene does not stage, a start after the shot ends,
 *    and a motion outside the registry the caller resolved.
 * 4. Metadata: events, camera intent and coverage outside the shot clock, with
 *    non-positive focal length, or naming unstaged, live or repeated cameras.
 * 5. Light clips: a channel that does not address a staged light property with its
 *    own value type, and repeated clip ids.
 * 6. Dense empty motions, event/intent/coverage rows and a complete three-instant
 *    clearance plan remain accepted.
 */
export function test_engine_validation_shot_artifact_paths(): void {
  TestValidator.predicate(
    "dense empty performance and motion arrays remain valid",
    validateShotArtifact(
      shot({ lightMotions: [] }),
      scene(),
      new Set<string>(["walk"]),
    ).success,
  );
  TestValidator.predicate(
    "dense event, intent and coverage metadata remain valid",
    validateShotArtifact(
      shot({
        lightMotions: [],
        events: [event()],
        cameraIntent: [intent()],
        coverage: [take()],
      }),
      scene(),
      null,
    ).success,
  );
  const stagedScene: IAutoMovieScene = scene();
  const clearanceScene: IAutoMovieScene = {
    ...stagedScene,
    cameras: stagedScene.cameras.map(
      (camera: IAutoMovieCamera): IAutoMovieCamera =>
        camera.id === "cam"
          ? {
              ...camera,
              clearance: {
                body: { center: { x: 0, y: 0, z: 0 }, radius: 0.1 },
                parentRig: null,
              },
            }
          : camera,
    ),
  };
  TestValidator.predicate(
    "dense endpoint-inclusive clearance metadata remain valid",
    validateShotArtifact(
      shot({
        lightMotions: [],
        cameraClearance: [
          {
            camera: "cam",
            sampleRate: 1,
            sampleTimes: [0, 1, 2],
            intervals: 2,
            status: "clear",
            findings: [],
          },
        ],
      }),
      clearanceScene,
      null,
    ).success,
  );
  const cases: IShotCase[] = [
    {
      title: "a shot naming another scene",
      shot: shot({ scene: "other" }),
      path: "$input.scene",
    },
    {
      title: "a shot naming an absent camera",
      shot: shot({ camera: "absent" }),
      path: "$input.camera",
    },
    {
      title: "a non-positive duration",
      shot: shot({ duration: 0 }),
      path: "$input.duration",
    },
    {
      title: "a performance naming a node the scene does not stage",
      shot: shot({
        performances: [{ node: "ghost", motion: null, startOffset: 0 }],
      }),
      path: "$input.performances[0].node",
    },
    {
      title: "a performance starting after the shot ends",
      shot: shot({
        performances: [{ node: "hero", motion: null, startOffset: 9 }],
      }),
      path: "$input.performances[0].startOffset",
    },
    {
      title: "a performance naming a motion outside the resolved registry",
      shot: shot({
        performances: [{ node: "hero", motion: "sprint", startOffset: 0 }],
      }),
      path: "$input.performances[0].motion",
    },
    {
      title: "duplicate object motion clip ids",
      shot: shot({ objectMotions: [objectClip("twin"), objectClip("twin")] }),
      path: "$input.objectMotions",
    },
    {
      title: "an event timed outside the shot's own clock",
      shot: shot({ events: [event({ time: 9 })] }),
      path: "$input.events[0].time",
    },
    {
      title: "an event timed before the shot starts",
      shot: shot({ events: [event({ time: -1 })] }),
      path: "$input.events[0].time",
    },

    {
      title: "a camera intent starting after the shot ends",
      shot: shot({ cameraIntent: [intent({ start: 9 })] }),
      path: "$input.cameraIntent[0].start",
    },

    {
      title: "a non-positive camera focal length",
      shot: shot({ cameraIntent: [intent({ focalLength: 0 })] }),
      path: "$input.cameraIntent[0].focalLength",
    },
    {
      title: "a coverage take naming a camera the scene does not stage",
      shot: shot({ coverage: [take({ camera: "absent" })] }),
      path: "$input.coverage[0].camera",
    },
    {
      title: "a coverage take playing the shot's own live camera",
      shot: shot({ coverage: [take({ camera: "cam" })] }),
      path: "$input.coverage[0].camera",
    },
    {
      title: "the same coverage camera declared twice",
      shot: shot({ coverage: [take(), take()] }),
      path: "$input.coverage[1].camera",
    },
    {
      title: "a coverage take carrying an out-of-clock camera intent",
      shot: shot({
        coverage: [take({ cameraIntent: [intent({ start: 9 })] })],
      }),
      path: "$input.coverage[0].cameraIntent[0].start",
    },
    {
      title: "a light clip channel that does not address by pointer",
      shot: shot({
        lightMotions: [
          lightClip({
            channel: { kind: "node", node: "key", path: "translation" },
          }),
        ],
      }),
      path: "$input.lightMotions[0].tracks[0].channel.kind",
    },
    {
      title: "a light pointer that names no light property",
      shot: shot({
        lightMotions: [
          lightClip({
            channel: {
              kind: "pointer",
              pointer: "/lights/key",
              valueType: "scalar",
            },
          }),
        ],
      }),
      path: "$input.lightMotions[0].tracks[0].channel.pointer",
    },
    {
      title: "a light pointer whose value type is not what the property is",
      shot: shot({
        lightMotions: [
          lightClip({
            channel: {
              kind: "pointer",
              pointer: "/lights/key/intensity",
              valueType: "vec3",
            },
            values: [0, 0, 0, 1, 1, 1],
          }),
        ],
      }),
      path: "$input.lightMotions[0].tracks[0].channel.valueType",
    },
    {
      title: "a light pointer addressing a light the scene does not stage",
      shot: shot({
        lightMotions: [
          lightClip({
            channel: {
              kind: "pointer",
              pointer: "/lights/ghost/intensity",
              valueType: "scalar",
            },
          }),
        ],
      }),
      path: "$input.lightMotions[0].tracks[0].channel.pointer",
    },
    {
      title: "duplicate light motion clip ids",
      shot: shot({ lightMotions: [lightClip(), lightClip()] }),
      // Both clips carry `key-fade`; the second is where the duplicate is
      // located, and the list path is the prefix that binds either report.
      path: "$input.lightMotions",
    },
  ];
  TestValidator.equals(
    "the shot validator reports the located violation for each field",
    namedFacts(
      cases.map((entry: IShotCase): readonly [string, () => boolean] => [
        entry.title,
        (): boolean => {
          const reported: string[] = pathsOf(
            validateShotArtifact(entry.shot, scene(), new Set(["walk"])),
          );
          // A prefix, because a uniqueness violation locates the entry it
          // found second (`$input.objectMotions[1].id`) while the field
          // this case names is the list itself.
          return reported.some((reportedPath: string): boolean =>
            reportedPath.startsWith(entry.path),
          );
        },
      ]),
    ),
    Object.fromEntries(
      cases.map((entry: IShotCase): [string, true] => [entry.title, true]),
    ),
  );
}

import {
  IAutoMovieCameraCoverageEntry,
  IAutoMovieFramedSubject,
  compileCameraCoverage,
  compileCameraMove,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraIntent,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** The side camera covering the beat from +X (90° FOV simplifies the oracle). */
const ALT: IAutoMovieCamera = {
  id: "cam-alt",
  transform: {
    translation: { x: 5, y: 1.44, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 90,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

const SUBJECT: IAutoMovieFramedSubject = {
  base: { x: 0, y: 0, z: 0 },
  height: 2,
  at: null,
};

const intent: (
  start: number,
  over?: Partial<IAutoMovieCameraIntent>,
) => IAutoMovieCameraIntent = (
  start: number,
  over: Partial<IAutoMovieCameraIntent> = {},
): IAutoMovieCameraIntent => ({
  start,
  framing: "medium",
  move: "static",
  focus: { x: 0, y: 1.2, z: 0 },
  focalLength: 85,
  ...over,
});

const entry: (
  start: number,
  move: "static" | "push-in",
  spanIntent: IAutoMovieCameraIntent,
) => IAutoMovieCameraCoverageEntry = (
  start: number,
  move: "static" | "push-in",
  spanIntent: IAutoMovieCameraIntent,
): IAutoMovieCameraCoverageEntry => ({
  action: {
    verb: "frame",
    actor: "cam-alt",
    start,
    duration: move === "static" ? 1 : "auto",
    framing: "medium",
    move,
    on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
  },
  subject: SUBJECT,
  intent: spanIntent,
});

/**
 * The multi-camera half of #1187 at the camera builder: one beat's coverage
 * take compiles through the SAME framing grammar as the hero take, with the
 * covering camera as the parameter, and pairs the clip with the take's per-span
 * intent records as one `IAutoMovieShotCoverage`. The grammar solves each
 * camera against its own staged bearing, so the side camera frames its own
 * angle; the intent rides as guide metadata, never back into the solve.
 *
 * The 90° FOV has a unit half-angle tangent; a height-2 medium frame shows
 * 1.24 m, hence d = 0.62 and aim = 0.72 times height = y 1.44.
 *
 * Scenarios:
 *
 * 1. A `static medium` span on the +X side camera keys the camera at `(0.62, 1.44,
 *    0)` (bearing +X from the aim), yawed +90° to look −X: the covering
 *    camera's own bearing drives its own angle, not the hero's.
 * 2. Two spans (static 0–1, then push-in to shot end) compile with the same
 *    structure and exact numeric components as
 *    `compileCameraMove` on the same camera and entries, the tracks target
 *    `cam-alt`, and the two intent records ride in span order.
 * 3. The empty entries boundary is a locked-off covering camera: `cameraMotion:
 *    null`, `cameraIntent: []`, the camera id still carried.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileCameraCoverage for a side-camera span, two spans, and empty entries, checking the solved position/orientation, target node ids, clip parity, intent order, and locked-off boundary.
 * @evidence contracts/testing.md#independent-expectations The explicit side-camera bearing and two-metre medium subject give fixed 0.62/1.44 coordinates and a positive 90-degree yaw. Comparison to compileCameraMove establishes assembler delegation only; the separate hand-computed side-camera checks anchor the geometry independently.
 * @evidence contracts/testing.md#distinguishing-cases A camera staged on +X must use its own angle rather than +Z; static then push-in spans must keep their authored intent order, and empty entries must retain the camera id with null motion and no intents.
 * @evidence contracts/testing.md#execution-ownership Runs synchronous compilation on local records without a renderer, resource access, clock, process state, or dependency replacement. Existing test12ValuesClose preserves clip keys, track order, channel metadata, lengths, and exact nclose numeric components; intent identity checks observe the assembler's borrowed-record contract.
 */
export function test_film_camera_coverage(): void {
  // 1. the covering camera's own staged bearing frames its own angle.
  const side: ReturnType<typeof compileCameraCoverage> = compileCameraCoverage({
    camera: ALT,
    clipId: "cam:beat-1:cam-alt",
    entries: [entry(0, "static", intent(0))],
    shotDuration: 2,
  });
  TestValidator.equals("take names its camera", side.camera, "cam-alt");
  TestValidator.predicate(
    "a spanned take compiles a clip",
    side.cameraMotion !== null,
  );
  if (side.cameraMotion !== null) {
    const [translation, rotation]: IAutoMovieTrack[] = side.cameraMotion.tracks;
    TestValidator.predicate(
      "side angle keyed on the camera's own bearing",
      vclose(
        {
          x: translation!.values[0]!,
          y: translation!.values[1]!,
          z: translation!.values[2]!,
        },
        { x: 0.62, y: 1.44, z: 0 },
      ),
    );
    TestValidator.predicate(
      "yawed +90° to look down −X",
      qclose(
        {
          x: rotation!.values[0]!,
          y: rotation!.values[1]!,
          z: rotation!.values[2]!,
          w: rotation!.values[3]!,
        },
        { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      ),
    );
    TestValidator.equals(
      "tracks target the covering camera",
      side.cameraMotion.tracks.map((t: IAutoMovieTrack): string =>
        t.channel.kind === "node" ? t.channel.node : "",
      ),
      ["cam-alt", "cam-alt"],
    );
  }

  // 2. same grammar as the hero builder; intent rides in span order.
  const intents: IAutoMovieCameraIntent[] = [
    intent(0),
    intent(1, { move: "push-in", focus: null, focalLength: 35 }),
  ];
  const entries: IAutoMovieCameraCoverageEntry[] = [
    entry(0, "static", intents[0]!),
    entry(1, "push-in", intents[1]!),
  ];
  const take: ReturnType<typeof compileCameraCoverage> = compileCameraCoverage({
    camera: ALT,
    clipId: "cam:beat-1:cam-alt",
    entries,
    shotDuration: 3,
  });
  const hero: ReturnType<typeof compileCameraMove> = compileCameraMove({
    clipId: "cam:beat-1:cam-alt",
    camera: ALT,
    entries,
    shotDuration: 3,
  });
  TestValidator.predicate(
    "the take's clip is the hero grammar on the same camera",
    test12ValuesClose(take.cameraMotion, hero),
  );
  TestValidator.predicate(
    "intent records ride in span order",
    test12ValuesClose(take.cameraIntent, [intents[0], intents[1]]),
  );
  TestValidator.predicate(
    "intent records retain their caller-owned identities",
    take.cameraIntent.length === 2 &&
      take.cameraIntent[0] === intents[0] &&
      take.cameraIntent[1] === intents[1],
  );

  // 3. no frame spans: a locked-off covering camera.
  const locked: ReturnType<typeof compileCameraCoverage> =
    compileCameraCoverage({
      camera: ALT,
      clipId: "cam:beat-1:cam-alt",
      entries: [],
      shotDuration: 2,
    });
  TestValidator.equals(
    "an empty take is locked off",
    [locked.camera, locked.cameraMotion, locked.cameraIntent],
    ["cam-alt", null, []],
  );
}

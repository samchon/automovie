import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import {
  IAutoMovieActionCall,
  IAutoMovieBlockingCoverage,
  IAutoMovieScene,
  IAutoMovieCamera,
  IAutoMovieConstraintViolation,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

type ICoverage = IAutoMovieBlockingCoverage;

const script: IAutoMovieScript = makeScriptWrite();

/**
 * The duel with two cameras, so the hero and a coverage angle are distinct.
 */
const staged: IAutoMovieStagedSet.ISuccess = ((): IAutoMovieStagedSet.ISuccess => {
  const result: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      cameras: [
        {
          node: "cam-main",
          position: { x: 2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightA" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-alt",
          position: { x: -2, y: 1.5, z: 0.35 },
          lookAt: { kind: "node", node: "knightB" },
          fovDeg: 40,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (result.success !== true) throw new Error("staging fixture must succeed");
  return result;
})();

/**
 * The staged set with one camera's field of view or placement replaced. Staging itself refuses these, which is the point: an EXPLICIT staged set never passes through staging, so this is the shape a caller can hand `performShot`.
 */
const withCamera: (id: string, over: { fovY?: number; x?: number; rotX?: number }) => IAutoMovieStagedSet.ISuccess = (
  id: string,
  over: { fovY?: number; x?: number; rotX?: number },
): typeof staged => ({
  ...staged,
  scene: {
    ...staged.scene,
    cameras: staged.scene.cameras.map((camera: IAutoMovieCamera): IAutoMovieCamera =>
      camera.id !== id
        ? camera
        : {
            ...camera,
            fovY: over.fovY ?? camera.fovY,
            transform: {
              ...camera.transform,
              translation: {
                ...camera.transform.translation,
                x: over.x ?? camera.transform.translation.x,
              },
              rotation: {
                ...camera.transform.rotation,
                x: over.rotX ?? camera.transform.rotation.x,
              },
            },
          },
    ),
  } as IAutoMovieScene,
});

const frame: (actor: string, move?: "static" | "whip") => IAutoMovieActionCall = (
  actor: string,
  move: "static" | "whip" = "static",
): IAutoMovieActionCall => ({
  verb: "frame",
  actor,
  start: 0,
  duration: "auto",
  framing: "medium",
  move,
  on: { kind: "node", node: "knightA" },
});

const coverageOn: (camera: string, move?: "static" | "whip") => ICoverage[] = (
  camera: string,
  move: "static" | "whip" = "static",
): ICoverage[] => [
  {
    camera,
    framing: "medium",
    move,
    on: { kind: "node", node: "knightB" },
  },
];

const perform: (set: IAutoMovieStagedSet.ISuccess, draft: IAutoMovieActionCall[], coverage?: ICoverage[]) => IAutoMoviePerformedShot = (
  set: typeof staged,
  draft: IAutoMovieActionCall[],
  coverage?: ICoverage[],
): IAutoMoviePerformedShot =>
  performShot({
    script,
    staged: set,
    performance: makePerformanceWrite({
      draft,
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    // `actors: []` drops the fixture's default timing anchors, which the draft
    // here (a lone frame action) would not cover: the coverage scenarios must
    // fail for the camera under test and nothing else.
    blocking:
      coverage === undefined
        ? undefined
        : makeBlockingWrite({ coverage, actors: [] }),
  });

/**
 * True when the refusal at `path` states every fragment.
 */
const says: (result: IAutoMoviePerformedShot, path: string, ...fragments: string[]) => boolean = (
  result: IAutoMoviePerformedShot,
  path: string,
  ...fragments: string[]
): boolean =>
  result.success === false &&
  result.violations.some(
    (item: IAutoMovieConstraintViolation): boolean =>
      item.path === path &&
      fragments.every((fragment: string): boolean => item.expected.includes(fragment)),
  );

/**
 * Every numeric value across a compiled clip's tracks.
 */
const clipValues: (result: IAutoMoviePerformedShot) => number[] = (result: IAutoMoviePerformedShot): number[] =>
  result.success !== true || result.shot.cameraMotion === null
    ? []
    : result.shot.cameraMotion.tracks.flatMap((track: IAutoMovieTrack): number[] => track.values);

/**
 * Performs elected and coverage camera moves and checks finite compiled values, field-of-view/placement refusals, whip-only rotation admission and unused-camera counterexamples.
 *
 * Scenarios:
 * 1. Require nonempty finite values from the valid hero camera.
 * 2. Refuse zero, negative, NaN and 180-degree hero lenses and nonfinite placement.
 * 3. Accept 1e-6 and 179.999-degree lenses without claiming their pixels or all key values.
 * 4. Refuse zero field of view and nonfinite placement for the coverage camera.
 * 5. Refuse nonfinite rotation for hero/coverage whip moves, accept their non-whip twins and require finite values from a valid hero whip.
 * 6. Accept unused degenerate cameras and a frameless locked-off fallback.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs elected and coverage camera moves and checks finite compiled values, field-of-view/placement refusals, whip-only rotation admission and unused-camera counterexamples.
 * @evidence contracts/testing.md#independent-expectations The pinhole solve requires finite placement and 0 < fovY < 180; whip consumes staged rotation while other moves derive it. Finiteness is checked on returned keys without comparing captured pixels.
 * @evidence contracts/testing.md#distinguishing-cases Retains both camera roles, zero/negative/NaN/upper-bound fields, legal extreme lenses, malformed whip rotations and non-whip/unused/locked-off neighbors.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_framing_camera unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_framing_camera(): void {
  // 1. the positive floor, and the invariant itself.
  const ok: IAutoMoviePerformedShot = perform(staged, [frame("cam-main")]);
  TestValidator.equals("a valid framing camera compiles", ok.success, true);
  TestValidator.equals(
    "every compiled camera keyframe is finite",
    namedFacts([
      ["refused", (): boolean => clipValues(ok).length > 0],
      ["violated", (): boolean => clipValues(ok).every(Number.isFinite)],
    ]),
    { refused: true, violated: true },
  );

  // 2. the elected camera, one case per condition.
  const heroPath: string = "$staged.scene.cameras[0]";
  for (const [label, fovY] of [
    ["zero", 0],
    ["NaN", Number.NaN],
    ["the exclusive upper bound", 180],
    ["negative", -40],
  ] as const)
    TestValidator.predicate(
      `an elected camera with a ${label} field of view is refused`,
      says(
        perform(withCamera("cam-main", { fovY }), [frame("cam-main")]),
        `${heroPath}.fovY`,
        '"cam-main"',
        "(0, 180)",
      ),
    );
  TestValidator.predicate(
    "an elected camera at a non-finite placement is refused",
    says(
      perform(withCamera("cam-main", { x: Number.POSITIVE_INFINITY }), [
        frame("cam-main"),
      ]),
      `${heroPath}.transform.translation`,
      '"cam-main"',
      "finite point",
    ),
  );

  // 3. the bounds are open, so extreme but legal lenses still compile.
  for (const fovY of [1e-6, 179.999])
    TestValidator.equals(
      `a field of view of ${fovY} still compiles`,
      perform(withCamera("cam-main", { fovY }), [frame("cam-main")]).success,
      true,
    );

  // 4. the second subject: a coverage camera, at its own staged path.
  TestValidator.predicate(
    "a coverage camera with a zero field of view is refused",
    says(
      perform(
        withCamera("cam-alt", { fovY: 0 }),
        [frame("cam-main")],
        coverageOn("cam-alt"),
      ),
      "$staged.scene.cameras[1].fovY",
      '"cam-alt"',
    ),
  );
  TestValidator.predicate(
    "a coverage camera at a non-finite placement is refused",
    says(
      perform(
        withCamera("cam-alt", { x: Number.NaN }),
        [frame("cam-main")],
        coverageOn("cam-alt"),
      ),
      "$staged.scene.cameras[1].transform.translation",
      '"cam-alt"',
    ),
  );

  // 5. the rotation, which ONLY a `whip` reads: it pans in place from the
  //    staged orientation, so that quaternion is pushed verbatim as the first
  //    keyframe while every other move derives its rotation through
  //    lookRotation. The non-whip case is the counter-case that proves the
  //    check follows what the solve consumes rather than validating the whole
  //    transform (#1316).
  TestValidator.predicate(
    "a whip on a camera with a non-finite rotation is refused",
    says(
      perform(withCamera("cam-main", { rotX: Number.NaN }), [
        frame("cam-main", "whip"),
      ]),
      `${heroPath}.transform.rotation`,
      '"cam-main"',
      "whip",
    ),
  );
  TestValidator.equals(
    "the same rotation with a non-whip move still compiles",
    perform(withCamera("cam-main", { rotX: Number.NaN }), [frame("cam-main")])
      .success,
    true,
  );
  TestValidator.predicate(
    "a whip coverage take on a non-finite rotation is refused",
    says(
      perform(
        withCamera("cam-alt", { rotX: Number.POSITIVE_INFINITY }),
        [frame("cam-main")],
        coverageOn("cam-alt", "whip"),
      ),
      "$staged.scene.cameras[1].transform.rotation",
      '"cam-alt"',
    ),
  );
  TestValidator.equals(
    "a non-whip coverage take on the same rotation still compiles",
    perform(
      withCamera("cam-alt", { rotX: Number.POSITIVE_INFINITY }),
      [frame("cam-main")],
      coverageOn("cam-alt"),
    ).success,
    true,
  );
  TestValidator.predicate(
    "a valid whip compiles, and every keyframe it emits is finite",
    ((): boolean => {
      const whipped: IAutoMoviePerformedShot = perform(staged, [frame("cam-main", "whip")]);
      return (
        whipped.success === true &&
        clipValues(whipped).length > 0 &&
        clipValues(whipped).every(Number.isFinite)
      );
    })(),
  );

  // 6. the counter-cases that keep the gate narrow.
  TestValidator.equals(
    "a degenerate camera the shot never frames through is not checked",
    perform(withCamera("cam-alt", { fovY: 0 }), [frame("cam-main")]).success,
    true,
  );
  TestValidator.equals(
    "with no frame action nothing is compiled, so nothing is gated",
    perform(withCamera("cam-main", { fovY: 0 }), []).success,
    true,
  );
}

import type {
  IAutoMovieCamera,
  IAutoMovieConstraintViolation,
  IAutoMovieScript,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieStagedSet, stageScene, Quaternion } from "@automovie/engine";


import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import {
  hasViolation,
  namedFacts,
  nclose,
  vclose,
} from "../internal/predicates";

const script: IAutoMovieScript = makeScriptWrite();

const LENS_A: IAutoMovieVector3 = { x: 2, y: 1.5, z: 0.35 };
const LENS_B: IAutoMovieVector3 = { x: -2, y: 1.5, z: 0.35 };

/** Construct the original camera operands with the supplied id, position and target. */
const camera: (
  node: string,
  position: IAutoMovieVector3,
  lookAt:
    | { kind: "node"; node: string }
    | { kind: "point"; point: IAutoMovieVector3 },
) => {
  node: string;
  position: IAutoMovieVector3;
  lookAt:
    | { kind: "node"; node: string }
    | { kind: "point"; point: IAutoMovieVector3 };
  fovDeg: number;
  near: number;
  far: number;
  depthPrecision: { minimumDepthBits: number; maximumStepMeters: number };
} = (
  node: string,
  position: IAutoMovieVector3,
  lookAt:
    | { kind: "node"; node: string }
    | { kind: "point"; point: IAutoMovieVector3 },
): {
  node: string;
  position: IAutoMovieVector3;
  lookAt:
    | { kind: "node"; node: string }
    | { kind: "point"; point: IAutoMovieVector3 };
  fovDeg: number;
  near: number;
  far: number;
  depthPrecision: { minimumDepthBits: number; maximumStepMeters: number };
} => ({
  node,
  position,
  lookAt,
  fovDeg: 40,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
});

/** Stage the original duel with the supplied cameras and optional set placements. */
const stage: (
  cameras: ReturnType<typeof camera>[],
  set?: { node: string; model: string; position: IAutoMovieVector3 }[],
) => IAutoMovieStagedSet = (
  cameras: ReturnType<typeof camera>[],
  set?: { node: string; model: string; position: IAutoMovieVector3 }[],
): IAutoMovieStagedSet =>
  stageScene(
    script,
    makeStagingWrite(set === undefined ? { cameras } : { cameras, set }),
  );

/**
 * A camera may aim at any staged placement, another camera included.
 *
 * `performShot` resolves a positional target against every staged placement, cameras among them (#1294), so a subject the performance stage happily frames must not be refused one rung earlier. Staging built its own lookup from actors and set pieces alone, which made "camera B opens on camera A" (a making-of angle, a monitor, a mirror) impossible to stage while `perform` accepted the same subject.
 *
 * Widening the table must not widen anything else: the two refusals staging owns for a camera target, an id nothing placed and a camera aimed at its own position, both still fire.
 *
 * Scenarios:
 *
 * 1. `cam-b` aims at `cam-a` and composes the same rotation as an explicit `point`
 * at `cam-a`'s position, which is what proves the id resolved to that camera's own placement rather than to some other one.
 * 2. That rotation aims the camera's local `-Z` (the glTF convention staging
 * lowers every camera by) along `cam-a - cam-b`, normalised `(1, 0, 0)` for these two lenses: an independent geometric oracle, not a re-run of the engine's basis math.
 * 3. The counter-cases one property away still stage: an actor target and a set
 * piece target compose as before.
 * 4. The negative twin: a camera aimed at an id nothing placed is still refused at
 * `$input.cameras[0].lookAt.node`, and the message names all three placement flavours.
 * 5. The boundary the placement entry makes reachable: a camera aimed at itself
 * resolves to its own position, so the zero-length look vector is refused at `$input.cameras[0].lookAt` rather than composing a degenerate rotation.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages camera-id and explicit-point twins and observes their composed camera agreement, an independently expected local-minus-Z direction and preserved target/refusal decisions.
 * @evidence contracts/testing.md#independent-expectations The two authored lens positions imply normalized plus-X aim independently of staging basis math; whole-camera twin equality is metamorphic agreement and does not alone establish correct rotation or rendered framing.
 * @evidence contracts/testing.md#distinguishing-cases Keeps camera, actor and set targets, an unplaced id with located refusal and the self-target zero-vector boundary; GPU framing is outside this numerical entry.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_scene_camera_target and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_scene_camera_target(): void {
  // 1. camera B frames camera A, exactly as an explicit lens point does.
  const staged: IAutoMovieStagedSet = stage([
    camera("cam-a", LENS_A, { kind: "node", node: "knightA" }),
    camera("cam-b", LENS_B, { kind: "node", node: "cam-a" }),
  ]);
  const explicit: IAutoMovieStagedSet = stage([
    camera("cam-a", LENS_A, { kind: "node", node: "knightA" }),
    camera("cam-b", LENS_B, { kind: "point", point: LENS_A }),
  ]);
  TestValidator.equals("a camera may aim at a camera", staged.success, true);
  if (staged.success !== true || explicit.success !== true)
    throw new Error("both camera-target twins must stage");
  const aimed: IAutoMovieCamera = staged.scene.cameras.find(
    (c: IAutoMovieCamera): boolean => c.id === "cam-b",
  )!;
  const twin: IAutoMovieCamera = explicit.scene.cameras.find(
    (c: IAutoMovieCamera): boolean => c.id === "cam-b",
  )!;
  TestValidator.predicate(
    "the camera id composes the explicit lens point's camera",
    aimed.id === twin.id &&
      vclose(aimed.transform.translation, twin.transform.translation, 0) &&
      vclose(aimed.transform.scale, twin.transform.scale, 0) &&
      nclose(aimed.transform.rotation.x, twin.transform.rotation.x, 0) &&
      nclose(aimed.transform.rotation.y, twin.transform.rotation.y, 0) &&
      nclose(aimed.transform.rotation.z, twin.transform.rotation.z, 0) &&
      nclose(aimed.transform.rotation.w, twin.transform.rotation.w, 0) &&
      nclose(aimed.fovY, twin.fovY, 0) &&
      nclose(aimed.near, twin.near, 0) &&
      nclose(aimed.far, twin.far, 0) &&
      aimed.depthPrecision.minimumDepthBits ===
        twin.depthPrecision.minimumDepthBits &&
      nclose(
        aimed.depthPrecision.maximumStepMeters,
        twin.depthPrecision.maximumStepMeters,
        0,
      ) &&
      aimed.clearance === undefined &&
      twin.clearance === undefined,
  );

  // 2. the independent oracle: local -Z points from cam-b at cam-a.
  TestValidator.predicate(
    "the composed rotation aims the lens at the other camera",
    vclose(
      Quaternion.rotateVector(aimed.transform.rotation, {
        x: 0,
        y: 0,
        z: -1,
      }),
      { x: 1, y: 0, z: 0 },
    ),
  );

  // 3. the counter-cases one property away.
  TestValidator.equals(
    "actor and set piece targets still stage",
    stage(
      [
        camera("cam-a", LENS_A, { kind: "node", node: "knightB" }),
        camera("cam-b", LENS_B, { kind: "node", node: "altar" }),
      ],
      [{ node: "altar", model: "box", position: { x: 1, y: 0, z: 1 } }],
    ).success,
    true,
  );

  // 4. the negative twin: an id nothing placed.
  const ghost: IAutoMovieStagedSet = stage([
    camera("cam-a", LENS_A, { kind: "node", node: "nobody" }),
  ]);
  TestValidator.equals(
    "an unplaced camera target is still refused, naming every placement flavour",
    namedFacts([
      [
        "hasViolationGhostType",
        (): boolean =>
          hasViolation(ghost, "type", "$input.cameras[0].lookAt.node"),
      ],
      ["ghostSuccess", (): boolean => ghost.success === false],
      [
        "ghostViolationsItem",
        (): boolean =>
          ghost.success === false &&
          ghost.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.expected.includes("placed actor, set piece, or camera"),
          ),
      ],
    ]),
    {
      hasViolationGhostType: true,
      ghostSuccess: true,
      ghostViolationsItem: true,
    },
  );

  // 5. the boundary: a camera aimed at itself.
  const narcissus: IAutoMovieStagedSet = stage([
    camera("cam-a", LENS_A, { kind: "node", node: "cam-a" }),
  ]);
  TestValidator.predicate(
    "a camera aimed at itself is refused as a zero-length look vector",
    hasViolation(narcissus, "range", "$input.cameras[0].lookAt"),
  );
}

import { spaceGround, stageScene } from "@automovie/engine";
import type { IAutoMovieSpace, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import {
  hasViolation,
  namedFacts,
  nclose,
  vclose,
} from "../internal/predicates";

/** A floor square and a ramp climbing 1 m over the 2 m east of it. */
const makeSpace: (partial?: Partial<IAutoMovieSpace>) => IAutoMovieSpace = (
  partial: Partial<IAutoMovieSpace> = {},
): IAutoMovieSpace => ({
  id: "space-yard",
  surfaces: [
    {
      id: "floor",
      kind: "floor",
      polygon: [
        { x: -2, y: 0, z: -2 },
        { x: 2, y: 0, z: -2 },
        { x: 2, y: 0, z: 2 },
        { x: -2, y: 0, z: 2 },
      ],
      anchor: { x: 0, y: 0, z: 0 },
      rampTo: null,
    },
    {
      id: "ramp",
      kind: "ramp",
      polygon: [
        { x: 2, y: 0, z: -1 },
        { x: 4, y: 0, z: -1 },
        { x: 4, y: 0, z: 1 },
        { x: 2, y: 0, z: 1 },
      ],
      anchor: { x: 2, y: 0, z: 0 },
      rampTo: { x: 4, y: 1, z: 0 },
    },
  ],
  walkable: ["floor", "ramp"],
  ...partial,
});

/**
 * Staging may author the scene's `space` (#1173): ground meaning beside
 * the `set`'s geometry. `stageScene` gates it with the shared `validateSpace`
 * (re-rooted under `$input.space`, so one surface rule can never mean two
 * things) and carries it onto the composed scene. This entry observes staging
 * and ground queries, without proving rendered geometry or historical behavior.
 *
 * Scenarios:
 *
 * 1. A floor + ramp space stages onto the scene verbatim (ids, kinds, anchors, and
 *    walkability), and the composed scene feeds `spaceGround` directly: 0 m
 *    over the floor, 0.5 m at the ramp's midpoint (half of the 1 m climb), and
 *    the 0 m fallback off every footprint.
 * 2. Omitting `space` composes `space: null`, the scalar ground plane the engine
 *    assumed before spaces existed: an absent ground is stated, not implied.
 * 3. The gates fire at the submitted field: a self-crossing footprint, a
 *    degenerate ramp axis, and a walkable id resolving to no surface are each
 *    refused under `$input.space.*` in one round. The footprint witness used to
 *    be a concave one, which #1868 made legal — `surfaceContains` classifies
 *    against the authored ring now, so a notch is a shape rather than something
 *    the validator has to forbid on the query's behalf. A ring that crosses
 *    itself is what the footprint gate still refuses, because two lobes meeting
 *    at a crossing do not form one supported simple footprint ring.
 * 4. A separately authored simple concave quadrilateral stages clean. It is
 *    a valid contrast to the self-crossing quadrilateral, not a one-coordinate
 *    mutation of the same corners. Nonconvexity alone does not cause refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages authored floor/ramp space, observes carried metadata and coordinates, queries its ground heights, and distinguishes malformed crossing/axis/reference refusals from a valid concave ring.
 * @evidence contracts/testing.md#independent-expectations The authored square and one-metre ramp give literal ids and heights zero, one-half and one metre, with zero outside; coordinate predicates compare fixture values rather than sampling an implementation to generate an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains present/omitted space, floor/ramp endpoint and off-footprint queries, self-crossing ring, degenerate ramp, dangling walkable id and concave negative twin; holes and alternative height rules have separate space tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns staging and portable ground callback queries with existing fixtures; no scene mesh, browser, GPU or rendered ground is observed.
 */
export function test_film_stage_scene_space(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({ space: makeSpace() }),
  );
  TestValidator.equals("staging with a space succeeds", staged.success, true);
  if (staged.success !== true) return;

  const space: IAutoMovieSpace | null = staged.scene.space ?? null;
  TestValidator.equals("the space keeps its identity", space?.id, "space-yard");
  TestValidator.equals("the space keeps its walkable ids", space?.walkable, [
    "floor",
    "ramp",
  ]);
  TestValidator.equals(
    "the space keeps both surfaces",
    space?.surfaces.length,
    2,
  );
  if (space === null)
    throw new Error("The accepted stage omitted its authored space.");
  const expected: IAutoMovieSpace = makeSpace();
  for (let index: number = 0; index < expected.surfaces.length; ++index) {
    TestValidator.equals(
      "the surface keeps its identity",
      space.surfaces[index]!.id,
      expected.surfaces[index]!.id,
    );
    TestValidator.equals(
      "the surface keeps its kind",
      space.surfaces[index]!.kind,
      expected.surfaces[index]!.kind,
    );
    TestValidator.equals(
      "the surface keeps every polygon vertex",
      space.surfaces[index]!.polygon.length,
      expected.surfaces[index]!.polygon.length,
    );
    TestValidator.predicate(
      "the surface keeps its polygon coordinates",
      space.surfaces[index]!.polygon.every(
        (point: IAutoMovieVector3, vertex: number): boolean =>
          vclose(point, expected.surfaces[index]!.polygon[vertex]!),
      ),
    );
    TestValidator.predicate(
      "the surface keeps its anchor",
      vclose(space.surfaces[index]!.anchor!, expected.surfaces[index]!.anchor!),
    );
    TestValidator.predicate(
      "the surface keeps its ramp endpoint",
      expected.surfaces[index]!.rampTo === null
        ? space.surfaces[index]!.rampTo === null
        : space.surfaces[index]!.rampTo !== null &&
            vclose(
              space.surfaces[index]!.rampTo!,
              expected.surfaces[index]!.rampTo!,
            ),
    );
  }

  // The composed scene plugs straight into the ground callback the motion
  // seams consume: flat over the floor, half-climbed at the ramp's midpoint.
  const ground: ReturnType<typeof spaceGround> = spaceGround(space!);
  TestValidator.predicate(
    "the staged space answers ground height",
    (): boolean =>
      nclose(ground(0, 0), 0) &&
      nclose(ground(3, 0), 0.5) &&
      nclose(ground(4, 0), 1) &&
      nclose(ground(20, 20), 0),
  );

  // 2. an omitted space is stated as null, not left absent.
  const bare: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  TestValidator.equals(
    "an omitted space composes as null",
    bare.success === true ? bare.scene.space : undefined,
    null,
  );

  // 3. every space gate reports under the submitted field.
  const refused: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      space: makeSpace({
        surfaces: [
          {
            id: "floor",
            kind: "floor",
            // The first edge and the third cross each other, so the ring
            // fails the simple-ring contract even though its lobes have area.
            polygon: [
              { x: -2, y: 0, z: -2 },
              { x: 2, y: 0, z: 2 },
              { x: 2, y: 0, z: -2 },
              { x: -2, y: 0, z: 3 },
            ],
            anchor: { x: 0, y: 0, z: 0 },
            rampTo: null,
          },
          {
            id: "ramp",
            kind: "ramp",
            polygon: [
              { x: 2, y: 0, z: -1 },
              { x: 4, y: 0, z: -1 },
              { x: 4, y: 0, z: 1 },
            ],
            anchor: { x: 2, y: 0, z: 0 },
            // Same (x, z) as the anchor: no axis to interpolate along.
            rampTo: { x: 2, y: 1, z: 0 },
          },
        ],
        walkable: ["floor", "balcony"],
      }),
    }),
  );
  TestValidator.equals(
    "every space gate fires under $input.space in one round",
    namedFacts([
      ["refusedSuccess", (): boolean => refused.success === false],
      [
        "hasViolationRefusedType",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.space.surfaces[0].polygon"),
      ],
      [
        "hasViolationRefusedRange",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.space.surfaces[1].rampTo"),
      ],
      [
        "hasViolationRefusedType2",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "type", "$input.space.walkable[1]"),
      ],
    ]),
    {
      refusedSuccess: true,
      hasViolationRefusedType: true,
      hasViolationRefusedRange: true,
      hasViolationRefusedType2: true,
    },
  );

  // 4. A separate simple concave ring distinguishes nonconvexity from crossing.
  const notched: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      space: makeSpace({
        surfaces: [
          {
            id: "floor",
            kind: "floor",
            polygon: [
              { x: -2, y: 0, z: -2 },
              { x: 2, y: 0, z: -2 },
              { x: 0, y: 0, z: 2 },
              { x: 0, y: 0, z: 0 },
            ],
            anchor: { x: 0, y: 0, z: 0 },
            rampTo: null,
          },
        ],
        walkable: ["floor"],
      }),
    }),
  );
  TestValidator.equals(
    "a notch is a footprint, not a defect",
    notched.success,
    true,
  );
}

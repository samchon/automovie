import type {
  IAutoMovieGeometrySelector,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { GEOMETRY_SELECTOR_TEST_WORLD as WORLD } from "../internal/GEOMETRY_SELECTOR_TEST_WORLD";
import type { IGeometrySelectorTestActorExtra } from "../internal/IGeometrySelectorTestActorExtra";
import { geometrySelectorTestAsk as ask } from "../internal/geometrySelectorTestAsk";
import { geometrySelectorTestMeters as meters } from "../internal/geometrySelectorTestMeters";
import { geometrySelectorTestPoint as point } from "../internal/geometrySelectorTestPoint";
import { geometrySelectorTestValues as values } from "../internal/geometrySelectorTestValues";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * Distance, ground and pose queries resolve selectors, actors and terrain from
 * the compiled records they are handed, and refuse by name what those records
 * cannot answer.
 *
 * Every expected number is hand geometry. The shared humanoid's left hand rests
 * 0.75 m out and 1.4 m up in model space, which doubled in scale and turned a
 * quarter about +Y becomes 1.5 m toward -z and 2.8 m up; its head rests 1.7 m
 * up. The slope rises from one metre at z = 0 to five at z = 10.
 *
 * Scenarios:
 *
 * 1. Point, landmark, actor-root and actor-bone selectors measure 13, 10, 5 and
 *    zero metres, the bone through its actor's scale and turn; the same actor in
 *    another shot measures its head 1.7 m above its root.
 * 2. An object motion moves an actor's root along its path, and an absent sample
 *    time measures at zero.
 * 3. An invalid distance time, an absent landmark, a bone on an actor without a
 *    skeleton, an unresolved bone, an actor in several shots without a shot, an
 *    absent actor with and without a shot, and an actor whose model is absent
 *    each refuse by name.
 * 4. Ground under a point answers the first containing surface's height and
 *    walkability, and zero and not walkable over no surface or no world.
 * 5. A performed actor's root is its node plus the pose root at the performance's
 *    local time; a held actor reports its node, its authored pose, or an empty
 *    pose; a time outside the shot and a missing motion refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual distance/ground/pose dispatcher through existing compiled-record fixtures, observing selector resolution, object/performance-local root sampling, terrain height/walkability and contextual failures instead of fabricated zero distances.
 * @evidence contracts/testing.md#independent-expectations Literal 3/4/12 and 6/8 geometry, rig rest offsets, quarter-turn/doubled-scale placement, linear path and ramp laws supply expected metres independently of the query. This uses the existing incomplete test rig rather than a measured Human model; successful records do not prove compiled-source freshness or rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts point/landmark/root/bone and selected/ambiguous shots, omitted/explicit time, malformed or unresolved selectors/models, walkable/nonwalkable/absent terrain and performed/authored/empty poses. Existing derived tolerances remain unchanged and formerly exact floating observations use zero tolerance.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns only query callbacks/local result records over existing canonical fixtures; it opens no file, render host, browser or GPU and replaces no foreign methods or installed consumers.
 */
export function test_engine_geometry_query_selectors(): void {
  const handWorld: IAutoMovieVector3 = { x: 10, y: 2.8, z: -1.5 };
  TestValidator.equals(
    "selectors resolve to hand-computed world points",
    namedFacts([
      [
        "points",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              from: point(0, 0, 0),
              to: point(3, 4, 12),
            }),
            13,
            0,
          ),
      ],
      [
        "landmark",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              from: { kind: "landmark", landmark: "well" },
              to: point(0, 0, 0),
            }),
            10,
            0,
          ),
      ],
      [
        "actorRoot",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              from: { kind: "actor", actor: "crate" },
              to: point(1, 5, 6),
            }),
            5,
            0,
          ),
      ],
      [
        "turnedScaledBone",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              shot: "a",
              from: { kind: "actor", actor: "hero", bone: "leftHand" },
              to: point(handWorld.x, handWorld.y, handWorld.z),
            }),
            0,
            1e-9,
          ),
      ],
      [
        "headInOtherShot",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              shot: "b",
              from: { kind: "actor", actor: "hero", bone: "head" },
              to: point(0, 0, 0),
            }),
            1.7,
            1e-12,
          ),
      ],
      [
        "pathMidway",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              time: 2,
              from: { kind: "actor", actor: "cart" },
              to: point(0, 0, 0),
            }),
            4,
            1e-12,
          ),
      ],
      [
        "pathStart",
        (): boolean =>
          nclose(
            meters({
              query: "distance",
              from: { kind: "actor", actor: "cart" },
              to: point(0, 0, 0),
            }),
            0,
            0,
          ),
      ],
    ]),
    {
      points: true,
      landmark: true,
      actorRoot: true,
      turnedScaledBone: true,
      headInOtherShot: true,
      pathMidway: true,
      pathStart: true,
    },
  );

  const actor: (
    name: string,
    extra?: IGeometrySelectorTestActorExtra,
  ) => Extract<IAutoMovieGeometrySelector, { kind: "actor" }> = (
    name: string,
    extra: IGeometrySelectorTestActorExtra = {},
  ): Extract<IAutoMovieGeometrySelector, { kind: "actor" }> => ({
    kind: "actor" as const,
    actor: name,
    ...extra,
  });
  TestValidator.equals(
    "a selector the records cannot resolve refuses by name",
    namedFacts([
      [
        "negativeTime",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                time: -1,
                from: point(0, 0, 0),
                to: point(1, 0, 0),
              }),
            "Distance sample time -1 is invalid",
          ),
      ],
      [
        "nanTime",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                time: Number.NaN,
                from: point(0, 0, 0),
                to: point(1, 0, 0),
              }),
            "Distance sample time NaN is invalid",
          ),
      ],
      [
        "landmark",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                from: { kind: "landmark", landmark: "nope" },
                to: point(0, 0, 0),
              }),
            'Landmark "nope" does not exist',
          ),
      ],
      [
        "landmarkWithoutWorld",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof ask> =>
              ask(
                {
                  query: "distance",
                  from: { kind: "landmark", landmark: "well" },
                  to: point(0, 0, 0),
                },
                null,
              ),
            'Landmark "well" does not exist',
          ),
      ],
      [
        "boneWithoutSkeleton",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                from: actor("crate", { bone: "head" }),
                to: point(0, 0, 0),
              }),
            'Actor "crate" has no skeleton, so bone "head" cannot resolve.',
          ),
      ],
      [
        "unresolvedBone",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                shot: "a",
                from: actor("hero", { bone: "rightHand" }),
                to: point(0, 0, 0),
              }),
            'Actor "hero" has no resolved bone "rightHand"',
          ),
      ],
      [
        "ambiguous",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                from: actor("hero"),
                to: point(0, 0, 0),
              }),
            'Actor "hero" appears in multiple compiled shots (a, b)',
          ),
      ],
      [
        "absent",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                from: actor("nobody"),
                to: point(0, 0, 0),
              }),
            'Actor "nobody" does not exist in current compiled scenes',
          ),
      ],
      [
        "absentInShot",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                shot: "a",
                from: actor("nobody"),
                to: point(0, 0, 0),
              }),
            'Actor "nobody" does not exist in shot "a"',
          ),
      ],
      [
        "absentShot",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                shot: "zzz",
                from: actor("crate"),
                to: point(0, 0, 0),
              }),
            'Actor "crate" does not exist in shot "zzz"',
          ),
      ],
      [
        "absentModel",
        (): boolean =>
          throwsError(
            (): number =>
              meters({
                query: "distance",
                from: actor("ghost"),
                to: point(0, 0, 0),
              }),
            'Actor "ghost" references missing model "absent" in shot "c"',
          ),
      ],
    ]),
    {
      negativeTime: true,
      nanTime: true,
      landmark: true,
      landmarkWithoutWorld: true,
      boneWithoutSkeleton: true,
      unresolvedBone: true,
      ambiguous: true,
      absent: true,
      absentInShot: true,
      absentShot: true,
      absentModel: true,
    },
  );

  const ground: (
    x: number,
    z: number,
    world?: typeof WORLD | null,
  ) => ReturnType<typeof ask> = (
    x: number,
    z: number,
    world: typeof WORLD | null = WORLD,
  ): ReturnType<typeof ask> => ask({ query: "ground", point: { x, z } }, world);
  TestValidator.equals(
    "ground answers the first containing surface or none",
    namedFacts([
      [
        "slope",
        (): boolean => {
          const answer: ReturnType<typeof ground> = ground(0, 5);
          return (
            answer.kind === "ground" &&
            nclose(answer.height, 3, 1e-12) &&
            answer.surface === "slope" &&
            answer.walkable === true
          );
        },
      ],
      [
        "ledge",
        (): boolean => {
          const answer: ReturnType<typeof ground> = ground(20, 5);
          return (
            answer.kind === "ground" &&
            nclose(answer.height, 3, 1e-12) &&
            answer.surface === "ledge" &&
            answer.walkable === false
          );
        },
      ],
      [
        "nothing",
        (): boolean => {
          const answer: ReturnType<typeof ground> = ground(100, 100);
          return (
            answer.kind === "ground" &&
            nclose(answer.height, 0, 0) &&
            answer.surface === null &&
            answer.walkable === false
          );
        },
      ],
      [
        "noWorld",
        (): boolean => {
          const answer: ReturnType<typeof ground> = ground(0, 5, null);
          return (
            answer.kind === "ground" &&
            nclose(answer.height, 0, 0) &&
            answer.surface === null
          );
        },
      ],
    ]),
    { slope: true, ledge: true, nothing: true, noWorld: true },
  );

  const walker: ReturnType<typeof values> = values({
    query: "pose",
    actor: "walker",
    shot: "a",
    time: 1,
  });
  const statue: ReturnType<typeof values> = values({
    query: "pose",
    actor: "statue",
    shot: "a",
    time: 0,
  });
  const idle: ReturnType<typeof values> = values({
    query: "pose",
    actor: "idle",
    shot: "a",
    time: 0,
  });
  const crate: ReturnType<typeof values> = values({
    query: "pose",
    actor: "crate",
    shot: "a",
    time: 0,
  });
  TestValidator.equals(
    "a pose query reports the performed or held root and joints",
    namedFacts([
      [
        "walkerRoot",
        (): boolean =>
          walker.held === false &&
          nclose(walker.rootX as number, 0, 0) &&
          nclose(walker.rootY as number, 0, 0) &&
          nclose(walker.rootZ as number, 6, 1e-12),
      ],
      [
        "walkerJoints",
        (): boolean =>
          walker.jointCount === 1 &&
          walker.shot === "a" &&
          walker.actor === "walker",
      ],
      [
        "statue",
        (): boolean =>
          statue.held === true &&
          statue.jointCount === 1 &&
          nclose(statue.rootX as number, 3, 0),
      ],
      [
        "idle",
        (): boolean =>
          idle.held === true &&
          idle.jointCount === 0 &&
          nclose(idle.rootX as number, 4, 0),
      ],
      [
        "crate",
        (): boolean =>
          crate.held === true &&
          crate.jointCount === 0 &&
          nclose(crate.rootY as number, 2, 0),
      ],
      [
        "late",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof values> =>
              values({ query: "pose", actor: "crate", shot: "a", time: 5 }),
            'Actor sample time 5 is outside shot "a" duration 0..4',
          ),
      ],
      [
        "early",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof values> =>
              values({ query: "pose", actor: "crate", shot: "a", time: -1 }),
            'Actor sample time -1 is outside shot "a"',
          ),
      ],
      [
        "missingMotion",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof values> =>
              values({ query: "pose", actor: "dancer", shot: "a", time: 0 }),
            'Actor "dancer" references missing motion "missing-motion"',
          ),
      ],
    ]),
    {
      walkerRoot: true,
      walkerJoints: true,
      statue: true,
      idle: true,
      crate: true,
      late: true,
      early: true,
      missingMotion: true,
    },
  );
}

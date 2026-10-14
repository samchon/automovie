import {
  compiledFormationSlot,
  createAutoMovieSourceOracle,
  instanceSlot,
  materializeCompiledFormation,
  materializeCompiledInstanceSet,
  worldRamp,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const COUNT: number = 2_000;

/** Ground rising from 1 m at z = 0 to 5 m at z = 10, ten metres across. */
const slope: ReturnType<typeof worldRamp> = worldRamp({
  id: "slope",
  from: { x: 0, z: 0 },
  to: { x: 0, z: 10 },
  width: 10,
  baseHeight: 1,
  rise: 4,
  walkable: true,
});

const formation: ReturnType<typeof materializeCompiledFormation> =
  materializeCompiledFormation({
    formation: {
      id: "unit",
      model: "member",
      count: 12,
      layout: {
        kind: "line",
        files: 4,
        ranks: 3,
        spacing: { lateral: 1, depth: 1 },
      },
      anchor: { x: 0, y: 1, z: 1 },
      facingDeg: 0,
      seed: 5,
      capabilities: [],
      heroOverrides: [{ slot: 2, actor: "leader" }],
    },
    surfaces: [slope],
  });

/** A crowd whose design table, default excluded, is tall 2 and short 1. */
const crowd: ReturnType<typeof materializeCompiledInstanceSet> =
  materializeCompiledInstanceSet({
    instanceSet: {
      id: "crowd",
      model: "body",
      prototypes: [
        { id: "tall", model: "tall-body", weight: 2 },
        { id: "short", model: "short-body", weight: 1 },
      ],
      count: COUNT,
      layout: { kind: "grid", rows: 50, columns: 40, spacing: { x: 1, z: 1 } },
      anchor: { x: 0, y: 0, z: 0 },
      facingDeg: 0,
      seed: 99,
      variation: {
        scale: { min: 1, max: 1 },
        palette: ["#ffffff"],
        traits: [],
      },
    },
    world: { routes: [] },
  });

/**
 * A shot source's deterministic helpers answer from the compiled runtime the
 * production holds.
 *
 * The oracle is what a shot source calls while it is still being compiled, so
 * a member it reports has to be the member the compiled record regenerates.
 * The regression this pins is concrete: reading a compiled instance set as a
 * design counted its default prototype twice, so a source asking for a member
 * could be told a different prototype than the one drawn for it.
 *
 * Scenarios:
 *
 * 1. Distance is Euclidean: a 3-4-12 offset is 13 metres.
 * 2. Ground height is the slope's height under a point on it, and zero over no
 *    surface at all.
 * 3. A formation member is the compiled record's member, hero included, and the
 *    unit's members follow the slope instead of standing at the anchor's
 *    height; an instance member is the compiled set's member for every slot.
 * 4. Across two thousand members the default, tall and short prototypes are
 *    chosen about 25%, 50% and 25%, not the 40%, 40% and 20% a doubled default
 *    would give.
 * 5. An id without a compiled record refuses by name, including one only an
 *    inherited object property would answer.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual compiled formation/instance records and calls the real source oracle over every authored slot, comparing complete regenerated records and observing Euclidean distance, sloped/absent ground, hero identity, prototype shares and missing/inherited-id refusals.
 * @evidence contracts/testing.md#independent-expectations The 3-4-12 offset implies13, the authored ramp midpoint implies3 and default/tall/short weights1:2:1 imply .25/.5/.25 independently. Delegated slot comparisons establish adapter consistency rather than independently reprove slot algorithms; literal distribution/terrain/refusal checks complement them. Former exact numeric records use the existing shape-preserving zero-tolerance comparator.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all12 formation and2000 instance members, hero slot2, sloped versus absent support and own-key versus inherited lookup. Strict .04 share boundaries and original1e-12 terrain tolerance remain; fixed seed99 is a witness rather than arbitrary-seed probability proof or rendered placement validation.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit borrows the module-owned compiled fixtures and owns fresh oracle/result arrays; it invokes no production compiler host, filesystem, native renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_source_oracle(): void {
  const oracle: ReturnType<typeof createAutoMovieSourceOracle> =
    createAutoMovieSourceOracle({
      world: { surfaces: [slope] },
      formationRuntime: { unit: formation },
      instanceSetRuntime: { crowd },
    });
  const members: ReturnType<typeof instanceSlot>[] = Array.from(
    { length: COUNT },
    (_: unknown, slot: number): ReturnType<typeof instanceSlot> =>
      oracle.instanceSlot("crowd", slot),
  );
  const share: (prototype: string) => number = (prototype: string): number =>
    members.filter(
      (member: ReturnType<typeof instanceSlot>): boolean =>
        member.prototype === prototype,
    ).length / COUNT;

  TestValidator.predicate(
    "the source oracle's formation members are the compiled record's",
    test12ValuesClose(
      Array.from(
        { length: 12 },
        (_: unknown, slot: number): ReturnType<typeof compiledFormationSlot> =>
          oracle.formationSlot("unit", slot),
      ),
      Array.from(
        { length: 12 },
        (_: unknown, slot: number): ReturnType<typeof compiledFormationSlot> =>
          compiledFormationSlot(formation, slot),
      ),
    ),
  );
  TestValidator.predicate(
    "the source oracle's instance members are the compiled set's",
    test12ValuesClose(
      members,
      Array.from(
        { length: COUNT },
        (_: unknown, slot: number): ReturnType<typeof instanceSlot> =>
          instanceSlot(crowd, slot),
      ),
    ),
  );

  TestValidator.equals(
    "the source oracle answers geometry and refuses unknown runtimes",
    namedFacts([
      [
        "distance",
        (): boolean =>
          nclose(
            oracle.distance({ x: 1, y: 2, z: 3 }, { x: 4, y: 6, z: 15 }),
            13,
            0,
          ),
      ],
      [
        "groundOnSlope",
        (): boolean => nclose(oracle.groundHeight({ x: 0, z: 5 }), 3, 1e-12),
      ],
      [
        "groundOverNothing",
        (): boolean => nclose(oracle.groundHeight({ x: 100, z: 100 }), 0, 0),
      ],
      [
        "heroNamed",
        (): boolean => oracle.formationSlot("unit", 2).node === "leader",
      ],
      [
        "membersFollowSlope",
        (): boolean =>
          Array.from(
            { length: 12 },
            (
              _: unknown,
              slot: number,
            ): ReturnType<typeof compiledFormationSlot> =>
              oracle.formationSlot("unit", slot),
          ).some(
            (member: ReturnType<typeof compiledFormationSlot>): boolean =>
              Math.abs(member.position.y - 1) > 0.3,
          ),
      ],
      [
        "default",
        (): boolean => {
          const value: number = share("default");
          return nclose(value, 0.25, 0.04) && Math.abs(value - 0.25) < 0.04;
        },
      ],
      [
        "tall",
        (): boolean => {
          const value: number = share("tall");
          return nclose(value, 0.5, 0.04) && Math.abs(value - 0.5) < 0.04;
        },
      ],
      [
        "short",
        (): boolean => {
          const value: number = share("short");
          return nclose(value, 0.25, 0.04) && Math.abs(value - 0.25) < 0.04;
        },
      ],
      [
        "unknownFormation",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof compiledFormationSlot> =>
              oracle.formationSlot("missing", 0),
            'Formation "missing" is unavailable.',
          ),
      ],
      [
        "inheritedFormation",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof compiledFormationSlot> =>
              oracle.formationSlot("toString", 0),
            'Formation "toString" is unavailable.',
          ),
      ],
      [
        "unknownInstanceSet",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              oracle.instanceSlot("missing", 0),
            'Instance set "missing" is unavailable.',
          ),
      ],
      [
        "inheritedInstanceSet",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              oracle.instanceSlot("constructor", 0),
            'Instance set "constructor" is unavailable.',
          ),
      ],
    ]),
    {
      distance: true,
      groundOnSlope: true,
      groundOverNothing: true,
      heroNamed: true,
      membersFollowSlope: true,
      default: true,
      tall: true,
      short: true,
      unknownFormation: true,
      inheritedFormation: true,
      unknownInstanceSet: true,
      inheritedInstanceSet: true,
    },
  );
}

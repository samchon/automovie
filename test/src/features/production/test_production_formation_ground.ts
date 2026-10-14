import {
  type IAutoMovieFormationPlacement,
  validateAutoMovieFormationGround,
} from "@automovie/engine";
import type {
  IAutoMovieDiagnostic,
  IAutoMovieFormationMotion,
  IAutoMovieSpace,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import { createFormationGroundFixtures } from "../internal/createFormationGroundFixtures";

type IUnit = IAutoMovieFormationPlacement;
const { field, unit, march, turn, carry, lance, disc, bow, wedge, slope, crossroads, diamond }: ReturnType<typeof createFormationGroundFixtures> = createFormationGroundFixtures();

const codes: (space: IAutoMovieSpace | null, formations: readonly IUnit[], formationMotions?: readonly IAutoMovieFormationMotion[]) => string[] = (
  space: IAutoMovieSpace | null,
  formations: readonly IUnit[],
  formationMotions?: readonly IAutoMovieFormationMotion[],
): string[] =>
  validateAutoMovieFormationGround(
    { id: "opening" },
    {
      scene: { space },
      formations,
      formationMotions,
    },
  ).map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code);

/**
 * The time a refusal names, as the refusal itself spells it.
 *
 * Read as text rather than as a number, so a caller can weigh both the instant
 * and the digits it was stated to. An answer that names no time at all reads as
 * the empty string, which no reading of it can mistake for a valid one.
 */
const sampledTime: (diagnostics: readonly IAutoMovieDiagnostic[]) => string = (diagnostics: readonly IAutoMovieDiagnostic[]): string =>
  /at ([0-9.]+)s/u.exec(diagnostics[0]?.message ?? "")?.[1] ?? "";

/**
 * A shot may not stage a unit on ground it did not stage under it.
 *
 * The space a shot stages is what the scene keeps and what the viewer turns into real meshes, so a unit reaching past it stands over a void. Authored terrain and staged space are separate records; correcting one does not correct the other.
 *
 * Runtime placement and ground coverage belong to the engine. The gate compares selected actual members rather than invented bounding-box corners; directional and temporal sampling leave the limits stated below.
 *
 * Scenarios:
 *
 * 1. A unit inside the staged floor is accepted.
 * 2. A unit reaching past the floor is refused once, naming the shot, unit and unsupported position.
 * 3. A unit exactly on the floor boundary is accepted.
 * 4. Null or absent staged space is skipped; this gate has no authored extent to measure.
 * 5. One contained unit beside an escaping unit reports exactly the escaping unit, so a passing sibling cannot hide or stand in for it.
 * 6. A marching unit reports an interior sampled escape and a member just past the edge, rather than only the cue endpoint; the continuous first crossing is not measured.
 * 7. A cue staying on the floor is accepted, and another unit's cue does not move this one.
 * 8. A cue starting at zero is measured at its carried positions instead of the design position it never holds.
 * 9. A quarter turn between crossed roads reports an interior escape with millisecond/millimetre presentation, while a contained turn is accepted.
 * 10. A diamond floor distinguishes carried members from a re-fitted enclosing box whose empty corners would leave it.
 * 11. The same turn over the smaller diamond is refused inside the turn although both endpoints clear, bracketing its widest member reach with scenario 10.
 * 12. A straight walk across the unsupported quadrant of nonconvex crossed roads is refused between its supported endpoints.
 * 13. A walk along the supported road is accepted.
 * 14. A scattered disc fits a diamond carrying its members while the empty enclosing-square corners do not fit.
 * 15. An arc puts members on the same supported circle rather than its enclosing square.
 * 16. A wedge fits a triangular floor despite its empty bounding corner at full width and no depth.
 * 17. A scattered member off a smaller floor still refuses, preserving the negative twin of the non-box positives.
 * 18. Repeated unchanged formation identity keeps the same accepted and refused observations; mutation invalidation is not exercised.
 * 19. An enormous turn reaching the sample cap still reports an interior escape; the cap's retained resolution is not asserted.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates staged formations against authored floors and motion, asserting contained/boundary admission, per-unit void findings, interior cue escape, stable repeated observations and diagnostic location/time formatting; endpoint-only or box-corner proxies fail the distinguishing fixtures.
 * @evidence contracts/testing.md#independent-expectations Authored square, crossed-road, diamond and triangle coverage plus line/disc/arc/wedge geometry define expected admission independently of engine placement/height helpers. The gate samples selected directional members and capped times; these cases do not certify every member or continuous-path coverage, nor cache correctness after mutation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all nineteen scenarios: contained/escaped/boundary/no-space/mixed units, marching and foreign cues, time-zero carried placement, interior turn/nonconvex travel, 13.5/12.75 diamond distinction, supported non-box layouts, repeated unchanged identity and enormous capped turn. Slot exceptions, sinking and mutable-cache invalidation are not established here.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all nineteen cases and calls the production engine validator with the original in-memory fixture constructors moved to one canonical helper; no geometry asset, renderer, native host or dynamic test is created.
 */
export function test_production_formation_ground(): void {
  TestValidator.equals(
    "a unit inside the staged floor is accepted",
    codes(field(10), [unit(4)]),
    [],
  );

  const escaped: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    { scene: { space: field(4) }, formations: [unit(10)] },
  );
  TestValidator.equals(
    "a unit reaching past the staged floor is refused, and the refusal says which and where",
    namedFacts([
      ["code", (): boolean => escaped[0]?.code === "engine-validation-failed"],
      ["one", (): boolean => escaped.length === 1],
      ["target", (): boolean => escaped[0]!.target === "shot:opening"],
      ["category", (): boolean => escaped[0]!.category === "error"],
      ["formation", (): boolean => escaped[0]!.message.startsWith("formation:army ")],
      ["corner", (): boolean => escaped[0]!.message.includes("(10, 0)")],
    ]),
    {
      code: true,
      one: true,
      target: true,
      category: true,
      formation: true,
      corner: true,
    },
  );

  TestValidator.equals(
    "a unit standing exactly on the edge is still standing on floor",
    codes(field(6), [unit(6)]),
    [],
  );

  TestValidator.equals(
    "a shot that staged no space is not measured",
    namedFacts([
      ["nullSpace", (): boolean => codes(null, [unit(1000)]).length === 0],
      [
        "absentSpace",
        (): boolean =>
          validateAutoMovieFormationGround(
            { id: "opening" },
            {
              scene: {},
              formations: [unit(1000)],
            },
          ).length === 0,
      ],
    ]),
    { nullSpace: true, absentSpace: true },
  );

  const sibling: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    { scene: { space: field(5) }, formations: [unit(2), unit(9, "cavalry")] },
  );
  TestValidator.equals(
    "one contained unit does not answer for an escaping one",
    namedFacts([
      ["one", (): boolean => sibling.length === 1],
      // Distinct ids require attribution to the actual escaping sibling.
      ["names", (): boolean => sibling[0]!.message.startsWith("formation:cavalry ")],
    ]),
    { one: true, names: true },
  );

  const marched: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    {
      scene: { space: field(10) },
      formations: [unit(4)],
      formationMotions: [march(20)],
    },
  );
  const marchedOff: number = Number(sampledTime(marched));
  TestValidator.equals(
    "a unit that marches off the floor is refused where it left, not where its cue ended",
    namedFacts([
      ["code", (): boolean => marched[0]?.code === "engine-validation-failed"],
      ["afterStart", (): boolean => marchedOff > 1],
      ["beforeEnd", (): boolean => marchedOff < 3],
      // An endpoint-only read would report the end, fourteen metres off-floor.
      ["corner", (): boolean => /\(4, 10(\.[0-9]{1,3})?\)/u.test(marched[0]!.message)],
    ]),
    { code: true, afterStart: true, beforeEnd: true, corner: true },
  );

  TestValidator.equals(
    "a unit that marches and stays on the floor is accepted",
    codes(field(20), [unit(4)], [march(10)]),
    [],
  );

  TestValidator.equals(
    "a cue belonging to another unit does not move this one",
    codes(field(10), [unit(4)], [march(20, "cavalry")]),
    [],
  );

  // At time zero the unit is already carried to z=40 on the z=30..60 floor;
  // checking its unused design bounds at the origin would falsely refuse.
  const carried: IAutoMovieFormationMotion = {
    ...march(0),
    start: 0,
    end: 2,
    from: {
      translation: { x: 0, y: 0, z: 40 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: 0, y: 0, z: 45 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
  };
  const offsetFloor: IAutoMovieSpace = {
    id: "far-field",
    surfaces: [
      {
        id: "ground",
        kind: "floor",
        polygon: [
          { x: -10, y: 0, z: 30 },
          { x: 10, y: 0, z: 30 },
          { x: 10, y: 0, z: 60 },
          { x: -10, y: 0, z: 60 },
        ],
        anchor: { x: 0, y: 0, z: 30 },
        rampTo: null,
      },
    ],
    walkable: ["ground"],
  };
  TestValidator.equals(
    "a unit whose cue starts at zero is not judged where it never stands",
    codes(offsetFloor, [unit(4)], [carried]),
    [],
  );

  // Both ends of the quarter turn lie on the crossroads; its interior leaves.
  const turned: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    {
      scene: { space: crossroads(10, 1.5) },
      formations: [lance(9, 1)],
      formationMotions: [turn(90)],
    },
  );
  const turnedOff: string = sampledTime(turned);
  TestValidator.equals(
    "a unit that leaves the ground mid-turn is refused, at a time between the cue's own ends",
    namedFacts([
      ["code", (): boolean => turned[0]?.code === "engine-validation-failed"],
      ["one", (): boolean => turned.length === 1],
      ["afterStart", (): boolean => Number(turnedOff) > 1],
      ["beforeEnd", (): boolean => Number(turnedOff) < 3],
      // Sampled time is presented to milliseconds rather than raw precision.
      ["rounded", (): boolean => /^[0-9]+(\.[0-9]{1,3})?$/u.test(turnedOff)],
      // The sampled location is likewise presented to millimetres.
      [
        "roundedCorner",
        (): boolean =>
          /\(-?[0-9]+(\.[0-9]{1,3})?, -?[0-9]+(\.[0-9]{1,3})?\) where/u.test(
            turned[0]?.message ?? "",
          ),
      ],
    ]),
    {
      code: true,
      one: true,
      afterStart: true,
      beforeEnd: true,
      rounded: true,
      roundedCorner: true,
    },
  );

  TestValidator.equals(
    "a unit that turns without leaving its ground is accepted",
    codes(field(10), [lance(9, 1)], [turn(90)]),
    [],
  );

  // The diamond bounds |x|+|z|: actual corners reach 12.81 at 38.7 degrees,
  // while a refitted enclosing box reaches 14.14. The 13.5 floor separates them.
  TestValidator.equals(
    "a unit is judged by its own corners, not the box around them",
    codes(diamond(13.5), [lance(9, 1)], [turn(45)]),
    [],
  );

  // Both endpoints clear 12.75, but interior reach exceeds it and stays below
  // 13.5, so the adjacent cases bracket the unit's widest carried position.
  TestValidator.equals(
    "a unit widest partway through its turn is refused by a floor its ends clear",
    codes(diamond(12.75), [lance(9, 1)], [turn(45)]),
    ["engine-validation-failed"],
  );

  // Supported endpoints on different roads do not support the intervening
  // straight crossing through the crossroads' empty quadrant.
  const crossed: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    {
      scene: { space: crossroads(10, 1.5) },
      formations: [unit(1)],
      formationMotions: [carry({ x: 0, z: -8 }, { x: 8, z: 0 })],
    },
  );
  const crossedOff: string = sampledTime(crossed);
  TestValidator.equals(
    "a unit carried straight across ground that is not there is refused",
    namedFacts([
      ["code", (): boolean => crossed[0]?.code === "engine-validation-failed"],
      ["afterStart", (): boolean => Number(crossedOff) > 1],
      ["beforeEnd", (): boolean => Number(crossedOff) < 3],
    ]),
    { code: true, afterStart: true, beforeEnd: true },
  );

  TestValidator.equals(
    "a unit carried along ground that does carry it is accepted",
    codes(
      crossroads(10, 1.5),
      [unit(1)],
      [carry({ x: 0, z: -8 }, { x: 0, z: 8 })],
    ),
    [],
  );

  // Disc, arc and wedge layouts leave enclosing-box corners empty; authored
  // floors carry the members while excluding those empty corners.
  TestValidator.equals(
    "a scattered unit on a floor shaped to its disc is accepted",
    codes(diamond(6 * Math.SQRT2), [disc(6, 200)]),
    [],
  );
  TestValidator.equals(
    "a unit bent along an arc on a floor shaped to its circle is accepted",
    codes(diamond(6 * Math.SQRT2), [bow(6, 41)]),
    [],
  );
  TestValidator.equals(
    "a wedge on a floor shaped to its triangle is accepted",
    codes(slope(40, 40), [wedge(9, 5)]),
    [],
  );
  TestValidator.equals(
    "a member off the floor is still refused, wherever its layout put it",
    codes(diamond(3), [disc(6, 200)]),
    ["engine-validation-failed"],
  );

  // Repeat the same unchanged formation identity on accepting/refusing floors.
  const staged: IUnit = disc(6, 200);
  const twice: IAutoMovieSpace = diamond(6 * Math.SQRT2);
  TestValidator.equals(
    "a unit staged by a second shot is measured the same as by the first",
    namedFacts([
      ["first", (): boolean => codes(twice, [staged]).length === 0],
      ["again", (): boolean => codes(twice, [staged]).length === 0],
      ["andRefused", (): boolean => codes(diamond(3), [staged]).length === 1],
      ["stillRefused", (): boolean => codes(diamond(3), [staged]).length === 1],
    ]),
    { first: true, again: true, andRefused: true, stillRefused: true },
  );

  // A thousand-revolution cue begins supported and reports an interior escape
  // under the sample cap; the retained temporal resolution is not asserted.
  const capped: IAutoMovieDiagnostic[] = validateAutoMovieFormationGround(
    { id: "opening" },
    {
      scene: { space: crossroads(10, 1.5) },
      formations: [lance(9, 1)],
      formationMotions: [turn(360_000)],
    },
  );
  const cappedOff: string = sampledTime(capped);
  TestValidator.equals(
    "a cue turning far enough to reach the sample cap is still walked to an answer",
    namedFacts([
      ["code", (): boolean => capped[0]?.code === "engine-validation-failed"],
      ["afterStart", (): boolean => Number(cappedOff) > 1],
      ["beforeEnd", (): boolean => Number(cappedOff) < 3],
    ]),
    { code: true, afterStart: true, beforeEnd: true },
  );
}

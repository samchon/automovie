import { validateShotArtifact } from "../../../../packages/engine/src/validation/validateShotArtifact";
import { IAutoMovieScene, IAutoMovieShot, IAutoMovieValidation, IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
const transform: () => { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } = (): { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/** One scene light of each kind, so the placement split has all three cases. */
const scene: () => IAutoMovieScene = (): IAutoMovieScene =>
  ({
    id: "sc",
    nodes: [],
    cameras: [
      { id: "cam", transform: transform(), fovY: 50, near: 0.1, far: 100 },
    ],
    lights: [
      {
        id: "key",
        transform: transform(),
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        type: "spot",
        range: 10,
        coneAngle: 30,
      },
      {
        id: "sun",
        transform: transform(),
        color: { r: 1, g: 1, b: 1 },
        intensity: 3,
        type: "directional",
      },
      {
        id: "bulb",
        transform: transform(),
        color: { r: 1, g: 1, b: 1 },
        intensity: 1,
        type: "point",
        range: 5,
      },
    ],
  }) as unknown as IAutoMovieScene;

/** A shot carrying exactly one light-motion track, so a case reports only it. */
const shot: (track: Record<string, unknown>) => IAutoMovieShot = (track: Record<string, unknown>): IAutoMovieShot =>
  ({
    id: "opening",
    scene: "sc",
    camera: "cam",
    duration: 4,
    // Every field the validator dereferences is present and well formed, so a
    // case that expects a CLEAN verdict is reporting on its track and nothing
    // else: an omitted `cameraMotion` or `objectMotions` is itself a violation.
    cameraMotion: null,
    objectMotions: [],
    performances: [],
    lightMotions: [
      {
        id: "placement",
        name: null,
        duration: 4,
        loop: false,
        tracks: [track],
      },
    ],
  }) as unknown as IAutoMovieShot;

const track: (pointer: string, valueType: string, times: unknown[], values: unknown[], interpolation?: string) => Record<string, unknown> = (
  pointer: string,
  valueType: string,
  times: unknown[],
  values: unknown[],
  interpolation: string = "linear",
): Record<string, unknown> => ({
  channel: { kind: "pointer", pointer, valueType },
  times,
  values,
  interpolation,
});

const verdict: (one: Record<string, unknown>) => IAutoMovieValidation = (one: Record<string, unknown>): IAutoMovieValidation =>
  validateShotArtifact(shot(one), scene(), null);

/** Whether any violation's path starts with `prefix`. */
const reportsAt: (one: Record<string, unknown>, prefix: string) => boolean = (one: Record<string, unknown>, prefix: string): boolean => {
  const validation: IAutoMovieValidation = verdict(one);
  return (
    validation.success === false &&
    validation.violations.some((entry: IAutoMovieConstraintViolation): boolean => entry.path.startsWith(prefix))
  );
};

/** Whether any violation's message mentions the joint unit-quaternion rule. */
const reportsNonUnit: (one: Record<string, unknown>) => boolean = (one: Record<string, unknown>): boolean => {
  const validation: IAutoMovieValidation = verdict(one);
  return (
    validation.success === false &&
    validation.violations.some((entry: IAutoMovieConstraintViolation): boolean =>
      entry.expected.includes("unit quaternion"),
    )
  );
};

const accepts: (one: Record<string, unknown>) => boolean = (one: Record<string, unknown>): boolean =>
  verdict(one).success === true;

/** A quarter turn about Y, the unit quaternion a swinging light is keyed with. */
const QUARTER_TURN: number[] = [0, Math.SQRT1_2, 0, Math.SQRT1_2];
const IDENTITY: number[] = [0, 0, 0, 1];

/**
 * The artifact gate holds a light's PLACEMENT to the same rules the scene gate
 * holds a staged light's transform to.
 *
 * The table that admits a light channel is the table that applies it, so
 * widening it to `position` and `rotation` widens both halves in one edit. What
 * that widening brings with it is a constraint of a shape the gate had never
 * needed: every axis until now was a scalar or a colour, and every rule about
 * them was a per-component range. A rotation is not like that. Its four
 * components are jointly constrained to unit length, and `(0, 0, 0, 0.5)` has
 * every component inside `[-1, 1]` while describing no rotation at all. A gate
 * that checked only components would let a film state through time exactly what
 * `commitScene` refuses outright, which is the one thing the light bounds exist
 * to prevent.
 *
 * The `cubicspline` asymmetry is deliberate and is the subtle half. A rotation
 * is RENORMALIZED at playback — the sampler puts an interpolated quaternion
 * back on the unit sphere before anything reads it — so a finite evaluated
 * interior is unit despite component overshoot. This witness uses finite
 * tangents; overflow before normalization remains a separate numeric limit.
 * The keys themselves get no such reprieve: the sampler returns a
 * boundary key verbatim, so a non-unit key really does reach the light.
 *
 * Scenarios:
 *
 * 1. The placement axes are admitted where the kind carries them, and refused
 *    where it does not: a spot has somewhere to stand and somewhere to look, a
 *    directional light is infinitely distant and carries no `position`, a point
 *    light radiates every way and carries no `rotation`.
 * 2. The joint rule refuses a non-unit rotation key on both payload layouts, a
 *    mis-declared value type is caught before any of it, and the per-component
 *    range still reports the component it is about — located at that number's
 *    own index, which is where the joint rule cannot report.
 * 3. A position track is unbounded and a unit rotation track is clean, so the
 *    rules refuse only what they name.
 * 4. The renormalization asymmetry: a `cubicspline` rotation whose tangents send
 *    the Hermite interior far outside `[-1, 1]` is ACCEPTED, while the same
 *    analysis still refuses a scalar axis (an intensity dipping below zero
 *    between two in-range keys), which is the case that would be lost if the
 *    exemption were written one condition too wide.
 * 5. A rotation key with a non-finite component
 *    and an uneven payload are each reported by the shared track-shape contract
 *    and NOT re-reported as a unit-length fault, and an empty payload is
 *    refused by that same contract: the joint rule judges keyframes, and a
 *    payload that states no keyframe states nothing for it to judge. These
 *    assertions distinguish shape and unit faults without counting every finding.
 * 6. Tiny nonzero dyadic scalar tangents still cross zero between valid zero
 *    keys; reversing their signs is an adjacent admitted curve.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual shot artifact gate returns light property/kind, component/unit-key and scalar-interior findings, retaining the finite quaternion normalization exemption and exposing an absolute derivative floor that lost tiny negative excursions.
 * @evidence contracts/testing.md#independent-expectations Authored light-kind and unit-quaternion laws supply placement expectations; for zero keys at span one with tangents -2^-45 and +2^-45, the Hermite midpoint is independently -2^-47, below nonnegative intensity. Reversing tangents keeps the whole quadratic nonnegative.
 * @evidence contracts/testing.md#distinguishing-cases Preserve spot/directional/point placement splits, wrong widths, nonunit/out-of-range/nonfinite/empty rotation keys, valid position, finite wild quaternion tangents and ordinary scalar dip, adding small negative/positive scalar twins without widening the rotation exemption.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_validation_light_transform_bounds; authored scene/shot records and the actual artifact gate own the cases, without installing a light playback consumer or proving browser/GPU appearance.
 */
export function test_validation_light_transform_bounds(): void {
  // 1. the kind split.
  TestValidator.equals(
    "placement is admitted where the kind carries it and refused where it does not",
    namedFacts([
      [
        "spotTakesPosition",
        (): boolean =>
          accepts(
            track("/lights/key/position", "vec3", [0, 4], [0, 0, 0, 1, 2, 3]),
          ),
      ],
      [
        "spotTakesRotation",
        (): boolean =>
          accepts(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, ...QUARTER_TURN],
            ),
          ),
      ],
      [
        "sunTakesRotation",
        (): boolean =>
          accepts(
            track(
              "/lights/sun/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, ...QUARTER_TURN],
            ),
          ),
      ],
      [
        "sunRefusesPosition",
        (): boolean =>
          reportsAt(
            track("/lights/sun/position", "vec3", [0, 4], [0, 0, 0, 1, 2, 3]),
            "$input.lightMotions[0].tracks[0].channel.pointer",
          ),
      ],
      [
        "bulbTakesPosition",
        (): boolean =>
          accepts(
            track("/lights/bulb/position", "vec3", [0, 4], [0, 0, 0, 1, 2, 3]),
          ),
      ],
      [
        "bulbRefusesRotation",
        (): boolean =>
          reportsAt(
            track(
              "/lights/bulb/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, ...QUARTER_TURN],
            ),
            "$input.lightMotions[0].tracks[0].channel.pointer",
          ),
      ],
    ]),
    {
      spotTakesPosition: true,
      spotTakesRotation: true,
      sunTakesRotation: true,
      sunRefusesPosition: true,
      bulbTakesPosition: true,
      bulbRefusesRotation: true,
    },
  );

  // 2. the joint rule, on both payload layouts, and the value type in front.
  TestValidator.equals(
    "a rotation key that is not unit length is refused on either layout",
    namedFacts([
      [
        "refusesNonUnitLinearKey",
        (): boolean =>
          reportsNonUnit(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0, 0, 0.5],
            ),
          ),
      ],
      [
        "refusesNonUnitCubicKey",
        (): boolean =>
          reportsNonUnit(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [
                // in-tangent, value, out-tangent per keyframe; only the values
                // carry the rule, and the second one is not a rotation.
                ...[0, 0, 0, 0],
                ...IDENTITY,
                ...[0, 0, 0, 0],
                ...[0, 0, 0, 0],
                ...[0, 0, 0, 0.5],
                ...[0, 0, 0, 0],
              ],
              "cubicspline",
            ),
          ),
      ],
      [
        "refusesMisdeclaredValueType",
        (): boolean =>
          reportsAt(
            track(
              "/lights/key/rotation",
              "vec4",
              [0, 4],
              [...IDENTITY, ...QUARTER_TURN],
            ),
            "$input.lightMotions[0].tracks[0].channel.valueType",
          ),
      ],
      // Located at the component, not at the keyframe. A `w` of 2 is out of
      // `[-1, 1]` AND not unit length, and the joint rule reports the whole
      // value at `.values`; only the per-component range can report the eighth
      // number, so naming its index is what says the range rule is still there
      // rather than subsumed by the rule beside it.
      [
        "refusesOutOfRangeComponent",
        (): boolean =>
          reportsAt(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0, 0, 2],
            ),
            "$input.lightMotions[0].tracks[0].values[7]",
          ),
      ],
    ]),
    {
      refusesNonUnitLinearKey: true,
      refusesNonUnitCubicKey: true,
      refusesMisdeclaredValueType: true,
      refusesOutOfRangeComponent: true,
    },
  );

  // 3. a place in the world has no ceiling.
  TestValidator.predicate(
    "a position track carries a place in the world, with no range to leave",
    accepts(
      track(
        "/lights/key/position",
        "vec3",
        [0, 4],
        [-1e6, -1e6, -1e6, 1e6, 1e6, 1e6],
      ),
    ),
  );

  // 4. renormalization exempts the rotation interior, and only it.
  TestValidator.equals(
    "the cubic interior is exempt where playback renormalizes and refused where it does not",
    namedFacts([
      [
        "acceptsWildRotationTangents",
        (): boolean =>
          accepts(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [
                ...[0, 0, 0, 0],
                ...IDENTITY,
                ...[50, 50, 50, 50],
                ...[-50, -50, -50, -50],
                ...QUARTER_TURN,
                ...[0, 0, 0, 0],
              ],
              "cubicspline",
            ),
          ),
      ],
      [
        "refusesScalarDipBelowZero",
        (): boolean =>
          reportsAt(
            // Two in-range keys whose tangents drive the Hermite to -4 halfway
            // between them: an intensity no light can hold.
            track(
              "/lights/key/intensity",
              "scalar",
              [0, 2],
              [0, 1, -10, 10, 1, 0],
              "cubicspline",
            ),
            "$input.lightMotions[0].tracks[0].values",
          ),
      ],
    ]),
    { acceptsWildRotationTangents: true, refusesScalarDipBelowZero: true },
  );

  // 5. malformed shapes are refused without an additional unit-length fault.
  TestValidator.equals(
    "malformed payloads are refused and incomplete rotation keys avoid unit faults",
    namedFacts([
      [
        "nonFiniteIsNotAlsoNonUnit",
        (): boolean =>
          !reportsNonUnit(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0, 0, Number.NaN],
            ),
          ),
      ],
      [
        "nonFiniteStillRefused",
        (): boolean =>
          reportsAt(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0, 0, Number.NaN],
            ),
            "$input.lightMotions[0].tracks[0].values",
          ),
      ],
      [
        "unevenIsNotAlsoNonUnit",
        (): boolean =>
          !reportsNonUnit(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0],
            ),
          ),
      ],
      [
        "unevenStillRefused",
        (): boolean =>
          reportsAt(
            track(
              "/lights/key/rotation",
              "quaternion",
              [0, 4],
              [...IDENTITY, 0, 0],
            ),
            "$input.lightMotions[0].tracks[0].values",
          ),
      ],
      // A payload of no numbers is not asserted to escape the joint rule: the
      // rule walks keyframes, and an empty payload states none for it to walk,
      // so no reading of it could ever produce one. The uneven payload above is
      // the case that can, since a rule reading its trailing part as a keyframe
      // would report exactly what that fact refuses.
      [
        "emptyStillRefused",
        (): boolean =>
          reportsAt(
            track("/lights/key/rotation", "quaternion", [0, 4], []),
            "$input.lightMotions[0].tracks[0].values",
          ),
      ],
    ]),
    {
      nonFiniteIsNotAlsoNonUnit: true,
      nonFiniteStillRefused: true,
      unevenIsNotAlsoNonUnit: true,
      unevenStillRefused: true,
      emptyStillRefused: true,
    },
  );
  const tiny: number = 2 ** -45;
  TestValidator.predicate("tiny nonzero cubic dip cannot be discarded by an absolute derivative floor", reportsAt(track("/lights/key/intensity", "scalar", [0, 1], [0, 0, -tiny, tiny, 0, 0], "cubicspline"), "$input.lightMotions[0].tracks[0].values"));
  TestValidator.predicate("opposite tiny tangents keep nonnegative intensity admitted", accepts(track("/lights/key/intensity", "scalar", [0, 1], [0, 0, tiny, -tiny, 0, 0], "cubicspline")));
}

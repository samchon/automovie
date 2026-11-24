import {
  type AutoMovieArchetypeEquineScramble,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieTransform,
} from "@automovie/interface";
import { type HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { equineBankStage } from "../../../features/internal/equineBankStage";
import { equineFordRider } from "../../../features/internal/equineFordRider";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The face: 31 degrees up over 3 m, steeper than its friction holds. */
const FACE: equineBankStage.IFace = { grade: 0.6, run: 3 };

/** The face's static hoof friction, authored. */
const FRICTION: number = 0.5;

/** A sole on its surface: the hoof bar's lowest surface within this of the plane, metres. */
const SURFACE: number = 0.005;

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** Seconds a rider's figure change takes. */
const TRANSFER: number = 0.4;

/** The least forward lean of an ascending rider's trunk in space, degrees: authored, a light seat over the withers. */
const FORWARD: number = 10;

/** The scramble on the face, at a friction and a bound. */
const scramble = (
  friction: number,
  bound: number,
): AutoMovieArchetypeEquineScramble.IScramble => ({
  kind: "bank-scramble",
  friction,
  source: "authored",
  bound,
  entry: 0.4,
  exit: 0.4,
});

/**
 * A horse scrambles up a steep bank in bounds, carrying its rider over the top.
 *
 * Scenarios:
 * 1. At each bound boundary inside the face the fore hooves stand higher than the hind hooves, and the hooves that stand there are on the authored surface (their lowest surface within 5 mm of the plane).
 * 2. Through the scramble a hoof on its surface at two reads 0.1 s apart stays put (within 5 mm): the standing pair never slides while the other bounds.
 * 3. The ride's placement stays continuous onto the level top, with no jump between reads 20 ms apart across the scramble's end.
 * 4. A face steeper than the technique's bound, a face its friction holds, a scramble without a run-out over the top, one without authored footing and bounds climbing beyond the fores' reach are refused on the leg's `equineFootwork`.
 * 5. A mounted rider in the ascent seat, the left hand on the mane, rides clear of the saddle (the seat socket more than 10 mm above it) with the trunk at least 10 degrees forward in space at each bound, and the take passes the shipped take verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Rides the public horse ride over authored footing and reads the emitted hooves against the face, and a mounted rider's seat against the saddle; fores landing below the hinds, a standing hoof that slides or floats, a jump at the top or an admitted face out of bounds fails.
 * @evidence contracts/development/testing.md#independent-expectations The face is the authored plane; the bounds come from the technique's own cues.
 * @evidence contracts/development/testing.md#distinguishing-cases The bounds, the standing pairs, the top edge, five refusals and the carried rider; the descent belongs to test_archetype_equine_bank_slide.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_bank_scramble(): void {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const ride: equineBankStage.Ride = equineBankStage.walk(
    horse,
    equineBankStage.course(FACE, scramble(FRICTION, 0.6)),
  );
  const read: equineBankStage.IReader = equineBankStage.read(ride, FACE);
  const start: number = read.cue("bankScrambleStart");
  const end: number = read.cue("bankScrambleEnd");
  const bounds: number[] = [];
  for (const instant of ride.instants)
    if (instant.label === "bankBound") bounds.push(instant.seconds);
  const issues: string[] = [];
  if (bounds.length < 2) issues.push(`only ${bounds.length} bounds`);

  // 1. Fores above hinds at each bound, the standing pair on the surface.
  for (const at of bounds) {
    const fore: number = Math.min(
      read.hoof(at, "leftFore").y,
      read.hoof(at, "rightFore").y,
    );
    const hind: number = Math.max(
      read.hoof(at, "leftHind").y,
      read.hoof(at, "rightHind").y,
    );
    if (!(fore > hind))
      issues.push(
        `bound ${at.toFixed(2)}: the fores stand at ${fore} m, not above the hinds at ${hind} m`,
      );
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const gap: number = read.sole(at, limb);
      if (Math.abs(gap) <= SURFACE || gap > 0.05) continue;
      issues.push(
        `bound ${at.toFixed(2)}: ${limb} sole ${gap} m against the surface`,
      );
    }
  }

  // 2. A standing hoof never slides.
  const step: number = 0.1;
  for (let at: number = start + 0.4; at + step <= end - 0.4; at += step)
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
      if (
        Math.abs(read.sole(at, limb)) <= SURFACE &&
        Math.abs(read.sole(at + step, limb)) <= SURFACE &&
        Vector3.distance(read.hoof(at, limb), read.hoof(at + step, limb)) >
          SURFACE
      )
        issues.push(`${limb} ${at.toFixed(2)}: a standing hoof slides`);

  // 3. Continuous onto the top.
  for (const at of [end - 0.02, end, end + 0.02]) {
    const jump: number = Vector3.distance(
      ride.at(at).placement.translation,
      ride.at(at + 0.02).placement.translation,
    );
    if (!(jump <= 0.06))
      issues.push(`the body jumps ${jump} m at ${at.toFixed(2)}`);
  }

  // 4. Refusals.
  const refused: readonly [
    string,
    equineBankStage.IFace,
    number,
    number,
    boolean,
    boolean,
  ][] = [
    ["an over-steep face", { ...FACE, grade: 1.2 }, FRICTION, 0.6, true, true],
    ["a face its friction holds", FACE, 0.7, 0.6, true, true],
    ["a scramble without a run-out", FACE, FRICTION, 0.6, false, true],
    ["a scramble without footing", FACE, FRICTION, 0.6, true, false],
    ["bounds beyond the fores' reach", FACE, FRICTION, 3, true, true],
  ];
  for (const [label, face, friction, bound, runOut, footing] of refused) {
    let refusal: unknown = null;
    try {
      equineBankStage.walk(
        horse,
        equineBankStage.course(
          face,
          scramble(friction, bound),
          runOut,
          footing,
        ),
      );
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "legs[1].equineFootwork"
      )
    )
      issues.push(
        `${label} must be refused on legs[1]; got ${String(refusal)}`,
      );
  }

  // 5. The carried rider.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const mounted: equineFordRider.IMount = equineFordRider.carry(
    horse,
    (seconds: number): equineFordRider.IInstant => ride.at(seconds),
    ride.duration,
    0,
  );
  const film: HumanPerformance = equineFordRider.perform(
    mounted,
    body,
    equineFordRider.mount(mounted, [
      {
        seat: "entered",
        transfer: TRANSFER,
        hold:
          equineFordRider.WAIT +
          start -
          equineFordRider.settled(mounted, body) -
          TRANSFER,
        supports: equineFordRider.WADING,
      },
      {
        seat: "ascent",
        transfer: TRANSFER,
        hold: end - start - TRANSFER,
        supports: equineFordRider.WADING,
      },
      {
        seat: "entered",
        transfer: TRANSFER,
        hold: mounted.halt - equineFordRider.WAIT - end - TRANSFER,
        supports: equineFordRider.WADING,
      },
    ]),
  );
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  for (const at of bounds.map(
    (seconds: number): number => equineFordRider.WAIT + seconds,
  )) {
    const saddle: IAutoMovieTransform = mounted.part("seat", at);
    // The light seat rides clear of the saddle, the trunk forward over the withers in space.
    const clear: number = Quaternion.rotateVector(
      Quaternion.inverse(saddle.rotation),
      Vector3.subtract(
        HumanSignature.region(reader, "seat", at),
        saddle.translation,
      ),
    ).y;
    if (!(clear > TOLERANCE))
      issues.push(
        `rider ${at.toFixed(2)}: seat only ${(clear * 1000).toFixed(1)} mm clear of the saddle`,
      );
    const lean: number = HumanSignature.trunk(reader, at);
    if (!(lean >= FORWARD))
      issues.push(
        `rider ${at.toFixed(2)}: trunk only ${lean} degrees forward in space`,
      );
  }
  TestValidator.equals(
    "the horse scrambles up the bank in bounds and carries its rider over the top",
    issues,
    [],
  );
  assertTakeClean("the bank scramble", film);
}

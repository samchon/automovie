import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import { PerspectiveCamera, Vector3 as ScreenPoint } from "three";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** The four unpartnered takes on the same stage and from the same camera. */
const FORMS = [
  "karateStanceTransfer",
  "taekwondoStanceReset",
  "muayThaiStanceReset",
  "taiChiTransfer",
] as const;

/** World tolerance in metres used by the maintained sole-pivot witness. */
const CONTACT: number = 0.005;

/** The scripted time for the second pose to read before recovery, in seconds. */
const HOLD: number = 0.24;

/**
 * Least height of a guard's wrist from its shoulder joint, metres, six times
 * the 5 mm contact tolerance, so an arm resting near shoulder height reads as
 * neither a high nor a low guard.
 */
const GUARD: number = 0.03;

/** Displayed pose changes observed for one form. */
interface IObservation {
  /** Seconds spent in the two-foot transfer before the authored hold. */
  transfer: number;

  /** Hip drop from the start in normalized screen height. */
  drop: number;

  /** Hip drop from the start in world metres. */
  worldDrop: number;

  /** Signed change in displayed hips heading between the two marks, in degrees. */
  turn: number;

  /** Largest world displacement of a nominally fixed sole, in metres. */
  slip: number;

  /** Smaller of the entry and recovery midpoint clearances of the travelling ball, in metres. */
  step: number;

  /** Largest world distance between entry and recovery at five visible landmarks, both hands included. */
  reset: number;

  /** Each hand's height above its own shoulder joint at the first marked pose, metres, lower first. */
  hands: readonly [lower: number, higher: number];
}

/**
 * The four solo forms hold floor support while changing pose and return to the
 * opening mark. One fixed camera makes the height contrast observable.
 *
 * Scenarios:
 * 1. Four forms run on the same stage marks and camera for each of two mirrored
 *    staging/body combinations.
 * 2. The taekwondo turn and the Muay Thai transfer show different screen
 *    heights and heading changes, and the Muay Thai fists hold above the
 *    shoulders while the taekwondo fists hold below them. The two inherited
 *    forms retain their timing contrast.
 * 3. Every take holds its visibly planted support and returns to the opening
 *    body, foot and hand positions without publishing a partner contact or
 *    result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the takes, displayed landmarks, stage frame and recovery.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the four takes through public HumanChain and HumanPerformance, measures world FK soles and hips at the film's editing marks, and projects the hips through one native camera.
 * @evidence contracts/development/testing.md#independent-expectations Checks fixed floor marks, the author-supplied 0.24 second hold, return to the opening pose and visible differences between styles. The 5 mm contact tolerance comes from the maintained sole-pivot witness. The marked low pose must read more than 2 cm below the high pose at the hips, with over one percent of the camera's half-height separating the respective drops. The coached Muay Thai guard holds the fists at ear height and the taekwondo sparring guard below the chest line, so both wrists must stand more than 3 cm above or below their shoulder joints. Contact is sampled at boundaries and intermediate points.
 * @evidence contracts/development/testing.md#distinguishing-cases A fixed rear ball and travelling lead ball distinguish holding from sliding during entry, while contrasting hip orientation and camera height distinguish two screen silhouettes. Two proportional bodies use opposite leads.
 * @evidence contracts/development/testing.md#execution-ownership Portable motion and camera math only. No canvas, playback host or rendering is invoked by this named test.
 */
export function test_motion_strike_martial_forms_recovery(): void {
  const camera: PerspectiveCamera = new PerspectiveCamera(40, 16 / 9, 0.1, 20);
  camera.position.set(3.4, 2.1, 5.2);
  camera.lookAt(0, 0.9, 0.24);
  camera.updateMatrixWorld();
  const defects: string[] = [];

  for (const [name, lead] of [
    ["f-small", "right"],
    ["m-average", "left"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const observations: Partial<Record<(typeof FORMS)[number], IObservation>> =
      {};
    for (const form of FORMS) {
      try {
        const observed: IObservation = observe(
          body,
          lead,
          form,
          camera,
          defects,
        );
        observations[form] = observed;
        if (
          observed.slip > CONTACT ||
          observed.step <= 2 * CONTACT ||
          observed.reset > CONTACT
        )
          defects.push(
            `${name}/${form}: expected <= ${CONTACT} m slip/reset and > ${2 * CONTACT} m visible step; got ${JSON.stringify(observed)}`,
          );
      } catch (error) {
        defects.push(`${name}/${form}: ${String(error)}`);
      }
    }

    const karate: IObservation | undefined = observations.karateStanceTransfer;
    const taiChi: IObservation | undefined = observations.taiChiTransfer;
    if (
      karate &&
      taiChi &&
      (Math.abs(karate.turn) <= 5 ||
        Math.abs(taiChi.turn) > 0.01 ||
        taiChi.transfer <= karate.transfer)
    )
      defects.push(`${name}: lost the inherited karate and tai chi contrast`);

    const high: IObservation | undefined = observations.taekwondoStanceReset;
    const low: IObservation | undefined = observations.muayThaiStanceReset;
    if (
      high &&
      low &&
      (Math.abs(high.turn) <= 10 ||
        Math.abs(low.turn) > 3 ||
        low.drop - high.drop <= 0.01 ||
        low.worldDrop - high.worldDrop <= 0.02)
    )
      defects.push(
        `${name}: staged reset contrast: ${JSON.stringify({ high, low })}`,
      );

    // The Muay Thai guard holds both fists at ear height, above the
    // shoulder joints; the taekwondo sparring guard carries both below them.
    if (high && low && (low.hands[0] <= GUARD || high.hands[1] >= -GUARD))
      defects.push(
        `${name}: expected Muay Thai fists over ${GUARD} m above and taekwondo fists over ${GUARD} m below the shoulders; got ${JSON.stringify({ muayThai: low.hands, taekwondo: high.hands })}`,
      );
  }

  TestValidator.predicate(
    `solo form recovery\n${defects.join("\n")}`,
    defects.length === 0,
  );
}

/** Sample actual posed bones, independent of the planned stance positions. */
function observe(
  body: IAutoMovieMotionHumanBody,
  lead: AutoMovieHumanSide,
  form: IAutoMovieMotionHumanMartialArt.Kind,
  camera: PerspectiveCamera,
  defects: string[],
): IObservation {
  const film: HumanPerformance = new HumanPerformance({
    seed: "same-camera-forms",
    performers: [
      {
        subject: "form",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("form").martialArt({
      kind: form,
      lead,
      hold: HOLD,
    }).node,
  });
  const track: IAutoMovieScheduleEntry = film.schedule.entries[0]!;
  const event = (name: string): number => {
    const seconds: number | undefined = track.events?.find(
      (entry) => entry.name === name,
    )?.seconds;
    if (seconds === undefined) throw new Error(`missing ${name} mark`);
    return seconds;
  };
  const ready: number = event("ready");
  const first: number = event("stroke");
  const second: number = event("strokeEnd");
  const relax: number = event("relax");
  if (
    !(
      track.start < ready &&
      ready < first &&
      first < second &&
      relax < track.end
    ) ||
    !nclose(relax - second, HOLD, 1e-9) ||
    track.contact !== undefined ||
    film.hits().length !== 0
  )
    defects.push(`${form}: unexpected phase order, hold or contact`);

  const rear: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const sole = (at: number, side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const foot = film.bones("form", at).get(`${side}Foot`)!;
    return HumanFoot.point(body, side, "ball", {
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    });
  };
  const hips = (at: number): IAutoMovieResolvedBone =>
    film.bones("form", at).get("hips")!;
  const joint = (at: number, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    film.bones("form", at).get(bone)!.worldPosition;
  const raised = (side: AutoMovieHumanSide): number =>
    joint(first, `${side}Hand`).y - joint(first, `${side}UpperArm`).y;
  const heights: readonly number[] = [raised("left"), raised("right")].sort(
    (a: number, b: number): number => a - b,
  );
  const y = (position: IAutoMovieVector3): number =>
    new ScreenPoint(position.x, position.y, position.z).project(camera).y;
  const heading = (at: number): number => {
    const side: IAutoMovieVector3 = Quaternion.rotateVector(
      hips(at).worldRotation,
      { x: 1, y: 0, z: 0 },
    );
    return (Math.atan2(-side.z, side.x) * 180) / Math.PI;
  };
  const entryRear: IAutoMovieVector3 = sole(track.start, rear);
  const readyLead: IAutoMovieVector3 = sole(ready, lead);
  let slip: number = 0;
  for (const at of [
    (track.start + ready) / 2,
    ready,
    (ready + first) / 2,
    first,
    (first + second) / 2,
    second,
    relax,
    (relax + track.end) / 2,
    track.end,
  ]) {
    slip = Math.max(slip, Vector3.distance(sole(at, rear), entryRear));
    if (at >= ready && at <= relax)
      slip = Math.max(slip, Vector3.distance(sole(at, lead), readyLead));
  }

  return {
    transfer: second - ready,
    drop: y(hips(track.start).worldPosition) - y(hips(first).worldPosition),
    worldDrop: hips(track.start).worldPosition.y - hips(first).worldPosition.y,
    turn: heading(second) - heading(first),
    slip,
    step: Math.min(
      sole((track.start + ready) / 2, lead).y -
        Math.max(sole(track.start, lead).y, readyLead.y),
      sole((relax + track.end) / 2, lead).y -
        Math.max(sole(track.end, lead).y, readyLead.y),
    ),
    reset: Math.max(
      Vector3.distance(
        hips(track.end).worldPosition,
        hips(track.start).worldPosition,
      ),
      Vector3.distance(sole(track.end, lead), sole(track.start, lead)),
      Vector3.distance(sole(track.end, rear), entryRear),
      Vector3.distance(
        joint(track.end, "leftHand"),
        joint(track.start, "leftHand"),
      ),
      Vector3.distance(
        joint(track.end, "rightHand"),
        joint(track.start, "rightHand"),
      ),
    ),
    hands: [heights[0]!, heights[1]!],
  };
}

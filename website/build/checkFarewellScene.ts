import { AutoMovieEngineKinematics, AutoMovieEngineVector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces, IAutoMovieMotionEvent, IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { AutoMovieMotionHumanAuditPartner } from "../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditPartner";
import { HumanHand } from "../../packages/motions/src/posture/internal/HumanHand";
import { strict as assert } from "node:assert";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SceneTake } from "../src/scenes/SceneTake";
import { SCENES_DAILY } from "../src/scenes/data/SCENES_DAILY";
import type { IScene } from "../src/scenes/structures/IScene";

/** The face contact allowance in metres from the kiss law. */
const FACE: number = 0.005;

/** The hand contact and partner penetration allowance in metres. */
const TOUCH: number = 0.01;

/** A tenth of a millisecond on either side distinguishes a pose jump from motion. */
const STEP: number = 0.0001;

/** The landmarks that must remain continuous into and out of a held contact. */
const LANDMARKS: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "head",
  "leftHand",
  "rightHand",
];

/** The three pairs of friends whose bodies must not pass into each other. */
const PAIRS: readonly (readonly [string, string])[] = [
  ["tia", "val"],
  ["tia", "uli"],
  ["uli", "val"],
];

/**
 * Play all four authored Farewell takes. Read the actual mouth, cheek,
 * forehead and fist frames from the displayed skeletons at their events.
 *
 * Scenarios:
 * 1. Tia's and Val's cheek kisses and Val's forehead kiss each meet their
 *    region through the hold and are apart at entry and exit, in that order.
 * 2. The fist bump and pinky promise each bring both fists together at the
 *    same instants, after the kisses, and part on the way in and out.
 * 3. No two friends pass into each other, and every segment boundary is
 *    continuous.
 * 4. Val moved 0.7 m away makes Tia's cheek kiss refuse on its region.
 */
export function checkFarewellScene(): void {
  const scene: IScene | undefined = SCENES_DAILY.find(
    (candidate: IScene): boolean => candidate.id === "farewell",
  );
  assert(scene?.composition);
  const composition: IPlaygroundComposition = scene.composition;
  assert.equal(scene.refusedUntil, undefined);
  assert.equal(scene.takes.length, 4);
  const failures: string[] = [];
  for (const take of scene.takes) {
    try {
      checkTake(
        PlaygroundPerformance.build(SceneTake.apply(composition, take))
          .performance,
        composition,
      );
    } catch (error: unknown) {
      failures.push(
        take.label +
          ": " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  const distant: IPlaygroundComposition = structuredClone(composition);
  const val: IPlaygroundComposition.IPerformer | undefined =
    distant.performers.find(
      (person: IPlaygroundComposition.IPerformer): boolean =>
        person.subject === "val",
    );
  assert(val);
  val.z += 0.7;
  assert.throws(
    () => PlaygroundPerformance.build(distant),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.performer === "tia" &&
      error.act === "cheekKiss" &&
      error.axis === "region",
  );
  assert.deepEqual(failures, []);
}

/** Check one take's kisses, hand meetings, clearances and continuity. */
function checkTake(
  film: IAutoMovieMotionHumanPerformance,
  composition: IPlaygroundComposition,
): void {
  const tia: readonly IAutoMovieMotionHumanSegment[] = film.segments("tia");
  const val: readonly IAutoMovieMotionHumanSegment[] = film.segments("val");
  const first: number = kiss(film, "tia", "val", "cheekKiss", "cheekLeft");
  const second: number = kiss(film, "val", "tia", "cheekKiss", "cheekLeft");
  const forehead: number = kiss(film, "val", "tia", "foreheadKiss", "forehead");
  assert(
    first < second && second < forehead,
    "the three kisses are distinct beats",
  );
  let lastContact: number = forehead;
  for (const name of ["fistBump", "pinkyPromise"]) {
    const a: IAutoMovieMotionHumanSegment = named(tia, name);
    const b: IAutoMovieMotionHumanSegment = named(val, name);
    const meet: number = at(a, "meet");
    const rebound: number = at(a, "rebound");
    assert(
      lastContact < meet && meet < rebound,
      name + " is a separate held contact",
    );
    lastContact = rebound;
    assert(Math.abs(meet - at(b, "meet")) < 1e-9);
    assert(Math.abs(rebound - at(b, "rebound")) < 1e-9);
    const gap: (seconds: number) => number = (seconds: number): number =>
      AutoMovieEngineVector3.distance(fist(film, "tia", seconds), fist(film, "val", seconds));
    assert(
      [meet, (meet + rebound) / 2, rebound].every(
        (seconds: number): boolean => gap(seconds) <= TOUCH,
      ),
      name + " brings both displayed fists together",
    );
    assert(
      gap(Math.min(a.start, b.start)) > TOUCH &&
        gap(Math.max(a.end, b.end)) > TOUCH,
      name + " separates on the way in and out",
    );
  }
  for (const [a, b] of PAIRS) {
    const audit: IAutoMovieMotionHumanAuditMeasure =
      AutoMovieMotionHumanAuditPartner.measure(
        film,
        { subject: a, body: body(film, a) },
        { subject: b, body: body(film, b) },
      ).worst;
    assert(
      audit.value <= TOUCH,
      audit.where + " penetrates by " + audit.value + " m",
    );
  }
  const uli: string[] = film
    .segments("uli")
    .map((segment: IAutoMovieMotionHumanSegment): string => segment.name);
  named(tia, "blownKissSend");
  assert(uli.includes("shoulderPat") && uli.includes("comfort"));
  assert.equal(tia.at(-1)?.name, "trudge");
  assert.equal(val.at(-1)?.name, "handOnHeart");
  for (const { subject } of composition.performers) {
    for (const segment of film.segments(subject))
      continuous(film, subject, segment.start, segment.end);
    assert(film.bones(subject, film.duration).has("head"));
  }
}

/**
 * Check that one performer's kiss meets the partner's region through its hold
 * and is apart from it at entry and exit.
 *
 * @returns The film second the lips part.
 */
function kiss(
  film: IAutoMovieMotionHumanPerformance,
  actor: string,
  target: string,
  name: string,
  region: AutoMovieHumanoidRegion,
): number {
  const segment: IAutoMovieMotionHumanSegment = named(
    film.segments(actor),
    name,
  );
  const contact: number = at(segment, "contact");
  const part: number = at(segment, "part");
  assert(contact < part, name + " holds");
  const gap: (seconds: number) => number = (seconds: number): number =>
    AutoMovieEngineVector3.distance(
      skin(film, actor, "mouth", seconds),
      skin(film, target, region, seconds),
    );
  assert(
    [contact, (contact + part) / 2, part].every(
      (seconds: number): boolean => gap(seconds) <= FACE,
    ),
    name + " meets " + region + " through the hold",
  );
  assert(
    gap(segment.start) > FACE && gap(segment.end) > FACE,
    name + " separates at entry and exit",
  );
  return part;
}

/** The first segment of an action. */
function named(
  segments: readonly IAutoMovieMotionHumanSegment[],
  name: string,
): IAutoMovieMotionHumanSegment {
  const segment: IAutoMovieMotionHumanSegment | undefined = segments.find(
    (candidate: IAutoMovieMotionHumanSegment): boolean =>
      candidate.name === name,
  );
  assert(segment, name + " is in the authored take");
  return segment;
}

/** The film second of a named action event. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
    (candidate: IAutoMovieMotionEvent): boolean => candidate.name === name,
  );
  assert(event, segment.name + " supplies " + name);
  return segment.start + event.share * segment.plan.duration;
}

/** A performer's body. */
function body(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
): IAutoMovieMotionHumanBody {
  return film.segments(subject)[0]!.context.body;
}

/** A named facial skin point in the displayed pose. */
function skin(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  region: AutoMovieHumanoidRegion,
  seconds: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieHumanoidSurfaces.IFrame = body(film, subject).surfaces
    .regions[region];
  return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
    frame,
    film.bones(subject, seconds).get(frame.bone)!,
  ).point;
}

/** The contact surface of the closed right hand. */
function fist(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  seconds: number,
): IAutoMovieVector3 {
  return HumanHand.frame(
    body(film, subject),
    film.bones(subject, seconds),
    "right",
    "fist",
    "fist",
  ).point;
}

/** No landmark jumps across a segment boundary inside the film. */
function continuous(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  entry: number,
  exit: number,
): void {
  for (const seconds of [entry, exit]) {
    if (seconds <= 0 || seconds >= film.duration) continue;
    const prior: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones(subject, seconds - STEP);
    const next: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
      subject,
      seconds + STEP,
    );
    for (const site of LANDMARKS) {
      const distance: number = AutoMovieEngineVector3.distance(
        prior.get(site)!.worldPosition,
        next.get(site)!.worldPosition,
      );
      assert(
        distance <= FACE,
        subject + " " + site + " jumps " + distance + " m",
      );
    }
  }
}

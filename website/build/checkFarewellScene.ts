import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  HumanHand,
  HumanRefusal,
} from "@automovie/motions";
import assert from "node:assert/strict";

import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import { SceneTake } from "../src/scenes/SceneTake";
import { SCENES_DAILY } from "../src/scenes/data/SCENES_DAILY";

/** The face contact allowance in metres from the kiss law. */
const FACE: number = 0.005;

/** The hand contact and partner penetration allowance in metres. */
const TOUCH: number = 0.01;

/** The landmarks that must remain continuous into and out of a held contact. */
const LANDMARKS = ["hips", "head", "leftHand", "rightHand"] as const;

/**
 * Play all four authored Farewell takes. Read the actual mouth, cheek,
 * forehead and fist frames from the displayed skeletons at their events.
 * A moved recipient exercises the original reach refusal.
 */
export function checkFarewellScene(): void {
  const scene = SCENES_DAILY.find((candidate) => candidate.id === "farewell");
  assert(scene?.composition);
  const composition = scene.composition;
  assert.equal(scene.refusedUntil, undefined);
  assert.equal(scene.takes.length, 4);
  const failures: string[] = [];
  for (const take of scene.takes) {
    const label: string = take.label;
    try {
      const film = PlaygroundPerformance.build(
        SceneTake.apply(composition, take),
      ).performance;
      const tia: readonly IAutoMovieMotionHumanSegment[] = film.segments("tia");
      const val: readonly IAutoMovieMotionHumanSegment[] = film.segments("val");
      const kiss = (
        actor: string,
        target: string,
        name: string,
        region: "cheekLeft" | "forehead",
      ): number => {
        const segment = film
          .segments(actor)
          .find((candidate) => candidate.name === name);
        assert(segment, name + " is in the authored take");
        const contact = at(segment, "contact");
        const part = at(segment, "part");
        assert(contact < part, name + " holds");
        const gap = (seconds: number): number =>
          Vector3.distance(
            skin(film, actor, "mouth", seconds),
            skin(film, target, region, seconds),
          );
        assert(
          [contact, (contact + part) / 2, part].every(
            (seconds) => gap(seconds) <= FACE,
          ),
          name + " meets " + region + " through the hold",
        );
        assert(
          gap(segment.start) > FACE && gap(segment.end) > FACE,
          name + " separates at entry and exit",
        );
        return part;
      };
      const first = kiss("tia", "val", "cheekKiss", "cheekLeft");
      const second = kiss("val", "tia", "cheekKiss", "cheekLeft");
      const forehead = kiss("val", "tia", "foreheadKiss", "forehead");
      assert(
        first < second && second < forehead,
        "the three kisses are distinct beats",
      );
      let lastContact = forehead;
      for (const name of ["fistBump", "pinkyPromise"] as const) {
        const a = tia.find((segment) => segment.name === name);
        const b = val.find((segment) => segment.name === name);
        assert(a && b, name + " is reciprocal");
        const meet = at(a, "meet");
        const rebound = at(a, "rebound");
        assert(
          lastContact < meet && meet < rebound,
          name + " is a separate held contact",
        );
        lastContact = rebound;
        assert(Math.abs(meet - at(b, "meet")) < 1e-9);
        assert(Math.abs(rebound - at(b, "rebound")) < 1e-9);
        const gap = (seconds: number): number =>
          Vector3.distance(
            fist(film, "tia", seconds),
            fist(film, "val", seconds),
          );
        assert(
          [meet, (meet + rebound) / 2, rebound].every(
            (seconds) => gap(seconds) <= TOUCH,
          ),
          name + " brings both displayed fists together",
        );
        assert(
          gap(Math.min(a.start, b.start)) > TOUCH &&
            gap(Math.max(a.end, b.end)) > TOUCH,
          name + " separates on the way in and out",
        );
      }
      for (const [a, b] of [
        ["tia", "val"],
        ["tia", "uli"],
        ["uli", "val"],
      ] as const) {
        const audit = AutoMovieMotionHumanAuditPartner.measure(
          film,
          { subject: a, body: film.segments(a)[0]!.context.body },
          { subject: b, body: film.segments(b)[0]!.context.body },
        ).worst;
        assert(
          audit.value <= TOUCH,
          audit.where + " penetrates by " + audit.value + " m",
        );
      }
      const uli = film.segments("uli").map((segment) => segment.name);
      assert(tia.some((segment) => segment.name === "blownKissSend"));
      assert(uli.includes("shoulderPat") && uli.includes("comfort"));
      assert.equal(tia.at(-1)?.name, "trudge");
      assert.equal(val.at(-1)?.name, "handOnHeart");
      for (const { subject } of composition.performers) {
        for (const segment of film.segments(subject))
          continuous(film, subject, segment.start, segment.end);
        assert(film.bones(subject, film.duration).has("head"));
      }
    } catch (error: unknown) {
      failures.push(
        label +
          " — " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  const distant = structuredClone(composition);
  const val = distant.performers.find((person) => person.subject === "val");
  assert(val);
  val.z += 0.7;
  assert.throws(
    () => PlaygroundPerformance.build(distant),
    (error: unknown): boolean =>
      error instanceof HumanRefusal &&
      error.performer === "tia" &&
      error.act === "cheekKiss" &&
      error.axis === "region",
  );
  assert.deepEqual(failures, []);
}

/** The film second of a named action event. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event = segment.plan.events.find(
    (candidate) => candidate.name === name,
  );
  assert(event, segment.name + " supplies " + name);
  return segment.start + event.share * segment.plan.duration;
}

/** A named facial skin point in the displayed pose. */
function skin(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  region: "mouth" | "cheekLeft" | "forehead",
  seconds: number,
): IAutoMovieVector3 {
  const body: IAutoMovieMotionHumanBody =
    film.segments(subject)[0]!.context.body;
  const frame = body.surfaces.regions[region];
  return resolveAutoMovieHumanoidSurfaces.place(
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
  const body: IAutoMovieMotionHumanBody =
    film.segments(subject)[0]!.context.body;
  return HumanHand.frame(
    body,
    film.bones(subject, seconds),
    "right",
    "fist",
    "fist",
  ).point;
}

/** A tenth of a millisecond on either side distinguishes a pose jump from motion. */
function continuous(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  entry: number,
  exit: number,
): void {
  for (const seconds of [entry, exit]) {
    if (seconds <= 0 || seconds >= film.duration) continue;
    const prior = film.bones(subject, seconds - 0.0001);
    const next = film.bones(subject, seconds + 0.0001);
    for (const site of LANDMARKS) {
      const distance = Vector3.distance(
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

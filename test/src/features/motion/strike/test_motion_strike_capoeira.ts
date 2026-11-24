import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSignature,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionCombatPair } from "../../internal/motionCombatPair";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** A held or landed contact lies within this, metres: the grapple specs' 1 cm. */
const GRIP: number = 0.01;

/** The capoeira roda's non-contact distance, a share of stature. */
const RODA: number = 1;

/**
 * Capoeira on two bodies: two gingas with alternating leads plant the back foot
 * on the same corner behind the middle of the stance, a beat apart; the
 * meia-lua de frente and the armada sweep across the line above the hip and
 * pass the partner across the roda without contact, the armada after a whole
 * turn, the partner's esquiva taking the head below the passing foot; the aú
 * bears the body on both palms. Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case and what it reads.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public rows and actions through HumanPerformance and reads the displayed feet, palms and crown at the laws' events.
 * @evidence contracts/development/testing.md#independent-expectations The roda's distance is a stature; a contact clears the partner's colliders.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair on a small and an average body; karate and tai chi stay pinned by the striking support baseline.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances, with no host or capture.
 */
export function test_motion_strike_capoeira(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [label, run] of [
      ["ginga", ginga],
      ["capoeira kicks", capoeiraKicks],
      ["au", au],
    ] as const)
      try {
        run(name, body, complaints);
      } catch (error) {
        complaints.list.push(`${name} ${label}: ${String(error)}`);
      }
  }
  complaints.assert("capoeira");
}

/**
 * Two gingas, the left then the right foot back to the same corner, a beat
 * apart.
 */
function ginga(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = motionCombatPair.pair(
    body,
    RODA * body.measure.stature,
    HumanChain.subject("a")
      .registered("martialArt", { kind: "capoeiraGinga", lead: "left" }, "left")
      .registered(
        "martialArt",
        { kind: "capoeiraGinga", lead: "right" },
        "right",
      ),
    "ginga",
  );
  assertTakeClean(`${name} ginga`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    0,
  );
  const back = (
    anchor: "left" | "right",
  ): readonly [IAutoMovieVector3, number] => {
    const step: IAutoMovieScheduleEntry = motionCombatPair.placed(film, anchor);
    const middle: number = 0.5 * (step.start + step.end);
    return [HumanSignature.joint(a, middle, `${anchor}Foot`), middle];
  };
  const [left, first] = back("left");
  const [right, second] = back("right");
  const front: IAutoMovieVector3 = Vector3.lerp(
    HumanSignature.joint(a, 0, "leftFoot"),
    HumanSignature.joint(a, 0, "rightFoot"),
    0.5,
  );
  const width: number = Vector3.distance(
    HumanSignature.joint(a, 0, "leftFoot"),
    HumanSignature.joint(a, 0, "rightFoot"),
  );
  complaints.check(
    `${name} ginga: the two back corners lie ${Vector3.distance(left, right)} m apart, ${front.z - left.z} m behind the front feet and ${Math.abs(left.x - front.x)} m off the middle`,
    Vector3.distance(left, right) <= 0.1 * width &&
      front.z - left.z > 0.1 * body.measure.stature &&
      Math.abs(left.x - front.x) <= 0.1 * width,
  );
  const beat: number =
    motionCombatPair.placed(film, "left").end -
    motionCombatPair.placed(film, "left").start;
  complaints.check(
    `${name} ginga: the back corners come ${second - first} s apart on a ${beat} s beat`,
    Math.abs(second - first - beat) <= 1 / 24,
  );
}

/**
 * The meia-lua de frente and the armada across the roda, the partner's esquiva
 * under the armada.
 */
function capoeiraKicks(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const distance: number = RODA * body.measure.stature;
  for (const row of ["meiaLuaDeFrente", "armada"] as const) {
    const kick: IAutoMovieMotionHumanChainCore = HumanChain.subject(
      "a",
    ).registered(
      row,
      { at: { kind: "person", subject: "b", region: "jawLeft" } },
      "kick",
    );
    const film: HumanPerformance = motionCombatPair.pair(
      body,
      distance,
      row === "armada"
        ? kick.with(
            HumanChain.subject("b")
              .registered("esquiva", {}, "esquiva")
              .sync({ of: "kick", align: "stroke" }),
          )
        : kick,
      row,
    );
    const cell: string = `${name} ${row}`;
    assertTakeClean(cell, film);
    const strike: IAutoMovieScheduleEntry = motionCombatPair.placed(
      film,
      "kick",
    );
    const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      film,
      "a",
      body,
      0,
    );
    const b: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      film,
      "b",
      body,
      180,
    );
    const moved = (side: AutoMovieHumanSide): number =>
      Vector3.distance(
        HumanSignature.joint(a, strike.start, `${side}Foot`),
        HumanSignature.joint(a, strike.contact ?? strike.end, `${side}Foot`),
      );
    const side: AutoMovieHumanSide =
      moved("left") > moved("right") ? "left" : "right";
    let clear: number = Number.POSITIVE_INFINITY;
    let lateral: number = 0;
    let high: number = 0;
    const from: IAutoMovieVector3 = motionCombatPair.foot(
      body,
      a,
      side,
      "ball",
      strike.start,
    );
    for (let s: number = strike.start; s <= strike.end; s += 1 / 48) {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(b, s);
      for (const point of ["heel", "ball"] as const) {
        const at: IAutoMovieVector3 = motionCombatPair.foot(
          body,
          a,
          side,
          point,
          s,
        );
        clear = Math.min(
          clear,
          HumanColliders.distance(body, bones, at).distance,
        );
        lateral = Math.max(lateral, Math.abs(at.x - from.x));
        high = Math.max(high, at.y);
      }
    }
    complaints.check(
      `${cell}: the foot sweeps ${lateral} m across, ${high} m high, ${clear} m clear of the partner`,
      lateral >= 0.2 * body.measure.stature &&
        high >= body.measure.hipHeight &&
        clear > 0,
    );
    if (row === "armada") {
      const contact: number = strike.contact ?? strike.end;
      const crown: number = HumanSignature.region(b, "crown", contact).y;
      const kickFoot: number = motionCombatPair.foot(
        body,
        a,
        side,
        "heel",
        contact,
      ).y;
      complaints.check(
        `${cell}: the esquiva takes the crown to ${crown} m under the foot at ${kickFoot} m`,
        crown < kickFoot,
      );
    }
  }
}

/** The aú bears the body on both palms. */
function au(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = motionCombatPair.pair(
    body,
    RODA * body.measure.stature,
    HumanChain.subject("a").registered("au", {}, "au"),
    "au",
  );
  assertTakeClean(`${name} au`, film);
  const turn: IAutoMovieScheduleEntry = motionCombatPair.placed(film, "au");
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    0,
  );
  const middle: number = 0.5 * (turn.start + turn.end);
  const palms: readonly number[] = (["palmLeft", "palmRight"] as const).map(
    (palm: AutoMovieHumanoidRegion): number =>
      HumanSignature.region(a, palm, middle).y,
  );
  const feet: number = Math.min(
    motionCombatPair.foot(body, a, "left", "sole", middle).y,
    motionCombatPair.foot(body, a, "right", "sole", middle).y,
  );
  complaints.check(
    `${name} au: at the middle the palms stand ${palms.join(", ")} m and the feet ${feet} m above the floor`,
    palms.every((y: number): boolean => y <= GRIP) &&
      feet > 0.2 * body.measure.stature,
  );
}

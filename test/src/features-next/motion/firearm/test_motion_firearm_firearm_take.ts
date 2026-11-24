import {
  createHandgun,
  createLongGun,
  createTable,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The counter top above the floor, metres: the website's counter band middle. */
const TOP: number = 0.914;
/** Downrange, ten metres ahead at chest height. */
const DOWNRANGE: IAutoMovieMotionTarget = {
  kind: "point",
  frame: "world",
  at: { x: 0, y: 1.4, z: 10 },
};
/** A held weapon keeps its hand frame within this, metres: the grip bound. */
const HOLD: number = 0.005;
/** A prop does not jump at a cut by more than this, metres. */
const RIGID: number = 0.001;

/**
 * Inert film firearms through a contemporary handgun take and a period long
 * arm take, each with repeated shots and an interrupted reload.
 *
 * Scenarios:
 * 1. Handgun: drawn from the counter, aimed downrange, fired twice on two
 *    cues, a reload broken off by a flinch at a third of its way, then
 *    holstered on the
 *    counter. The same prop stays in the right palm's frame from the draw
 *    to the holster, each authored shot is one recoil segment, the broken
 *    reload leaves the gun held without a jump, and the gun ends on the
 *    counter.
 * 2. Long arm: presented and fired twice; each shot is one fire segment and
 *    the musket keeps its hand frame between them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two takes, the identity, shot count, interruption and placement checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered firearm rows through HumanPerformance and reads segments, displayed hands and props.
 * @evidence contracts/development/testing.md#independent-expectations Two authored shots must be two recoil or fire segments; the counter placement is authored; the grip bound is the held-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Handgun against long arm, a whole action against one cut short, a held gun against one set down.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_firearm_firearm_take(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const checks: motionComplaints.IGatherer = motionComplaints();
  const laws = Object.values(HUMAN_LEXICON).flat();
  const play = (
    props: IAutoMovieMotionHumanProp[],
    chain: IAutoMovieMotionHumanChain,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "firearm-take",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0.12 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws,
      props,
      composition: chain.node,
    });
  const palm = (
    film: HumanPerformance,
    prop: string,
    t: number,
  ): IAutoMovieRigidTransform => {
    const hand: IAutoMovieResolvedBone = film.bones("a", t).get("rightHand")!;
    return HumanPropFrame.relative(
      HumanPropFrame.bone(hand),
      film.prop(prop, t),
    );
  };
  const named = (
    film: HumanPerformance,
    name: string,
  ): IAutoMovieMotionHumanSegment[] =>
    film
      .segments("a")
      .filter(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === name,
      );

  // The handgun take.
  try {
    const counter: IAutoMovieMotionHumanProp = HumanObject.prop(
      "counter",
      createTable({ id: "counter", kind: "counter" }),
      {
        at: { x: 0, y: 0, z: 0.65 },
        yaw: 180,
        fixed: true,
      },
    );
    const rest: IAutoMovieVector3 = { x: -0.18, y: TOP, z: 0.42 };
    const gun: IAutoMovieMotionHumanProp = HumanObject.prop(
      "gun",
      createHandgun({ id: "gun", frame: "compact" }),
      {
        at: rest,
        yaw: 0,
      },
    );
    const film: HumanPerformance = play(
      [counter, gun],
      HumanChain.subject("a")
        .registered("drawFirearm", { prop: "gun" })
        .registered("takeAim", { gun: "gun", target: DOWNRANGE })
        .registered("recoil", { gun: "gun" })
        .registered("recoil", { gun: "gun" })
        .registered("reloadFirearm", {
          target: { kind: "prop", subject: "gun", point: "magazine" },
        })
        .until({ share: 1 / 3 })
        .act("flinch", {})
        .registered("holsterFirearm", { prop: "gun", to: rest }),
    );
    const shots: IAutoMovieMotionHumanSegment[] = named(film, "recoil");
    checks.check(
      "handgun: two authored shots are two recoils",
      shots.length === 2,
    );
    const drawn: IAutoMovieMotionHumanSegment = named(film, "drawFirearm")[0]!;
    const holstered: IAutoMovieMotionHumanSegment = named(
      film,
      "holsterFirearm",
    )[0]!;
    const first: IAutoMovieRigidTransform = palm(film, "gun", drawn.end);
    for (let i: number = 0; i <= 16; ++i) {
      const t: number = drawn.end + ((holstered.start - drawn.end) * i) / 16;
      checks.check(
        `handgun: the gun stays in the palm at ${t.toFixed(2)}`,
        Vector3.distance(palm(film, "gun", t).position, first.position) <= HOLD,
      );
    }
    const reload: IAutoMovieMotionHumanSegment = named(
      film,
      "reloadFirearm",
    )[0]!;
    checks.check(
      "handgun: the broken-off reload leaves the gun without a jump",
      Vector3.distance(
        film.prop("gun", reload.end - 1e-4).position,
        film.prop("gun", reload.end + 1e-4).position,
      ) <= RIGID,
    );
    checks.check(
      "handgun: the gun ends on the counter",
      Vector3.distance(film.prop("gun", film.duration).position, rest) <= 0.015,
    );
  } catch (error: unknown) {
    checks.check("handgun refused: " + String(error), false);
  }

  // The long arm take.
  try {
    const musket: IAutoMovieMotionHumanProp = HumanObject.prop(
      "musket",
      createLongGun({ id: "musket", kind: "musket" }),
      {
        at: { x: -0.2, y: 1.0, z: 0.4 },
        yaw: 0,
      },
    );
    const film: HumanPerformance = play(
      [musket],
      HumanChain.subject("a")
        .pickUp({ prop: "musket", handle: "grip", hand: "right" })
        .registered("presentFirearm", { gun: "musket", target: DOWNRANGE })
        .registered("fireFirearm", { gun: "musket" })
        .registered("fireFirearm", { gun: "musket" }),
    );
    const shots: IAutoMovieMotionHumanSegment[] = named(film, "fireFirearm");
    checks.check(
      "long arm: two authored shots are two fires",
      shots.length === 2,
    );
    const a: IAutoMovieRigidTransform = palm(film, "musket", shots[0]!.start);
    const b: IAutoMovieRigidTransform = palm(film, "musket", shots[1]!.end);
    checks.check(
      "long arm: the musket keeps its hand frame between the shots",
      Vector3.distance(a.position, b.position) <= HOLD,
    );
  } catch (error: unknown) {
    checks.check("long arm refused: " + String(error), false);
  }
  checks.assert("firearm takes");
}

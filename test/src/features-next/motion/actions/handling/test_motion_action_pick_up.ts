import {
  createBag,
  createFingerRing,
  createNecklace,
  createServingTray,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { caneSweepScene } from "../../../internal/caneSweepScene";
import { carriageScene } from "../../../internal/carriageScene";
import { coatPartnerScene } from "../../../internal/coatPartnerScene";
import { diningScene } from "../../../internal/diningScene";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";
import { placeOverHeadScene } from "../../../internal/placeOverHeadScene";
import { slipRingScene } from "../../../internal/slipRingScene";
import { wardrobeFootwearScene } from "../../../internal/wardrobeFootwearScene";

/**
 * How far the wrist rises after the grasp when no lift is asked, metres:
 * `IAutoMovieMotionHumanPickUp.lift`'s stated default.
 */
const LIFT: number = 0.1;

/** The lift the dining, loop and ring scenes ask, metres: theirs. */
const ASKED: number = 0.05;

/** The bodies of opposite stature every group is read on. */
const BODIES: readonly motionHumanBody.Name[] = ["m-average", "f-small"];

/** One take and the pickUps it holds. */
interface ICase {
  /** The case, for failures. */
  label: string;

  /** The performer's body. */
  body: IAutoMovieMotionHumanBody;

  /** The take, built when the case runs, so a refusal is the case's own. */
  take: () => HumanPerformance;

  /** The pickUps of the take, in its chain's order. */
  grasps: readonly motionGraspUnit.IGrasp[];
}

/**
 * PickUp's own goal, once for every handle kind the scenarios take up: the
 * grasp contract's landing, the asked lift and the custody from the closure
 * (`motionGraspUnit.pickUp`). This is the one owner of that goal; no other spec
 * reads the grip on the handle point, so a scenario that takes something up
 * reads only what follows from it.
 *
 * Scenarios, on the average man and the small woman, each case gathering its
 * own result:
 *
 * 1. A precision pair (chopsticks) then a vessel by its body (a rice bowl) in the
 *    other hand, seated at a table, the dominant hand right on the man and left
 *    on the woman.
 * 2. A hand tool's shaft in the other hand (a fork) then in the dominant (a table
 *    knife), seated.
 * 3. Soft wear by its hold (a shoe, a sock) from a table top.
 * 4. A long tool standing upright (a long cane fitted to the body).
 * 5. A loop by its handle (a ribbon laid for the front, a chain for behind) and a
 *    ring by its hold, from a stand.
 * 6. A garment's edge (a jacket by its back collar) with either hand.
 * 7. A strap (a backpack's) from a counter-height place and again from the worn
 *    mount on the back.
 * 8. A handle that rides an articulation (a suitcase's pull bar, drawn out on its
 *    telescope first).
 * 9. A flat support on the open palm (a serving tray) and an end grip (a porter's
 *    tray).
 * 10. A strap in one hand, then a handle in the other while the first holds (a tote
 *     changing hands).
 *
 * Each pickUp also keeps the shipped bounds over its own span. The serving
 * scene's spoon is the knife's case (the same hand-tool shaft in the same hand)
 * and is not repeated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one goal this spec owns, every handle kind and entry, and the case it leaves out.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each entry and pickUp through the public chain and reads the displayed hand's contact surfaces, the prop's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, a prop sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The landing is the pickUp and grasp contracts': the grip on the handle point and the fingers closed on its colliders, so some contact surface lies within half the grasped width plus the touch contract's 10 mm; the lift is the asked one or the contract's default; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Ten handle kinds and entries, two statures, both hands; what each scenario does with the prop afterwards is that scenario's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_action_pick_up`.
 */
export function test_motion_action_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const stage of stages()) {
    let staged: ICase[] = [];
    try {
      staged = stage.build();
    } catch (error: unknown) {
      checks.check(`${stage.label}: ${everydayTake.describe(error)}`, false);
    }
    for (const c of staged)
      try {
        const film: HumanPerformance = c.take();
        for (const grasp of c.grasps)
          motionGraspUnit.pickUp(checks, c.label, film, c.body, grasp);
      } catch (error: unknown) {
        checks.check(`${c.label}: ${everydayTake.describe(error)}`, false);
      }
  }
  checks.assert("pickUp lands the grip on the handle, lifts and keeps it");
}

/** A scene staged when it runs, so a staging failure is its own. */
interface IStage {
  /** The scene, for failures. */
  label: string;

  /** Stage the scene's cases. */
  build: () => ICase[];
}

/** Every scene, in the order of the doc comment. */
function stages(): IStage[] {
  const per: (
    label: string,
    build: (name: motionHumanBody.Name) => ICase[],
  ) => IStage[] = (
    label: string,
    build: (name: motionHumanBody.Name) => ICase[],
  ): IStage[] =>
    BODIES.map(
      (name: motionHumanBody.Name): IStage => ({
        label: `${name} ${label}`,
        build: (): ICase[] => build(name),
      }),
    );
  return [
    ...per("chopsticks", (n: motionHumanBody.Name): ICase[] => [chopsticks(n)]),
    ...per("cutlery", (n: motionHumanBody.Name): ICase[] => [cutlery(n)]),
    ...per("cane", (n: motionHumanBody.Name): ICase[] => [cane(n)]),
    ...per("loops", loops),
    ...per("bags", bags),
    ...per("trays", trays),
    ...per("tote", (n: motionHumanBody.Name): ICase[] => [tote(n)]),
    ...wardrobeFootwearScene.CASES.map(
      (c: wardrobeFootwearScene.ICase): IStage => ({
        label: c.label,
        build: (): ICase[] => [footwear(c)],
      }),
    ),
    ...slipRingScene.CASES.map(
      (c: slipRingScene.ICase): IStage => ({
        label: `${c.dresser} ring`,
        build: (): ICase[] => [ring(c)],
      }),
    ),
    ...coatPartnerScene.CASES.map(
      (c: coatPartnerScene.ICase): IStage => ({
        label: c.label,
        build: (): ICase[] => [jacket(c)],
      }),
    ),
  ];
}

/** A grasp by the performer's hand, the pickUp's first occurrence unless named. */
function grasp(
  subject: string,
  side: AutoMovieHumanSide,
  prop: string,
  model: everydayTake.IPosable,
  handle: string,
  lift: number,
  occurrence: number = 1,
): motionGraspUnit.IGrasp {
  return { subject, side, prop, model, handle, lift, occurrence };
}

/** A standing performer `a` at the origin taking up one placed prop. */
function alone(
  seed: string,
  body: IAutoMovieMotionHumanBody,
  prop: IAutoMovieMotionHumanProp,
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed,
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [prop],
    composition: chain.node,
  });
}

/** The dining scenes' dominant hand: right on the man, left on the woman. */
function dominant(name: motionHumanBody.Name): AutoMovieHumanSide {
  return name === "m-average" ? "right" : "left";
}

/** The chopsticks, then the bowl in the other hand, seated. */
function chopsticks(name: motionHumanBody.Name): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const side: AutoMovieHumanSide = dominant(name);
  const s: diningScene.IChopsticks = diningScene.chopsticks(body, side);
  return {
    label: `${name} takes up the chopsticks and the bowl`,
    body,
    take: (): HumanPerformance =>
      diningScene.perform(
        `${name} chopsticks chopsticks`,
        body,
        s.props,
        HumanChain.subject("actor")
          .sit({ seat: s.stage.seat, hold: 1 })
          .pickUp({ prop: "sticks", handle: "grip", hand: side, lift: ASKED })
          .pickUp({ prop: "bowl", handle: "body", hand: s.other, lift: ASKED }),
      ),
    grasps: [
      grasp("actor", side, "sticks", s.models.sticks!, "grip", ASKED),
      grasp("actor", s.other, "bowl", s.models.bowl!, "body", ASKED, 2),
    ],
  };
}

/** The fork in the other hand, then the knife, seated, as the cut takes them. */
function cutlery(name: motionHumanBody.Name): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const side: AutoMovieHumanSide = dominant(name);
  const s: diningScene.ICut = diningScene.cut(side);
  return {
    label: `${name} takes up the fork and the knife`,
    body,
    take: (): HumanPerformance =>
      diningScene.perform(
        `${name} knife and fork cut`,
        body,
        s.props,
        HumanChain.subject("actor")
          .sit({ seat: s.stage.seat, hold: 1 })
          .pickUp({ prop: "fork", handle: "grip", hand: s.other, lift: ASKED })
          .pickUp({ prop: "knife", handle: "grip", hand: side, lift: ASKED }),
      ),
    grasps: [
      grasp("actor", s.other, "fork", s.models.fork!, "grip", ASKED),
      grasp("actor", side, "knife", s.models.knife!, "grip", ASKED, 2),
    ],
  };
}

/** A long cane fitted to the body, standing where the walker takes it. */
function cane(name: motionHumanBody.Name): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const model: caneSweepScene.Cane = caneSweepScene.fitted(body);
  return {
    label: `${name} takes up the cane`,
    body,
    take: (): HumanPerformance =>
      alone(
        "cane sweep",
        body,
        HumanObject.prop("cane", model, {
          position: caneSweepScene.STAND,
          rotation: Quaternion.identity(),
        }),
        HumanChain.subject("a").pickUp({
          prop: "cane",
          handle: "grip",
          hand: "right",
        }),
      ),
    grasps: [grasp("a", "right", "cane", model, "grip", LIFT)],
  };
}

/** A ribbon laid for the front and a chain laid for behind, by their handles. */
function loops(name: motionHumanBody.Name): ICase[] {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  return (["front", "behind"] as const).map(
    (pose: placeOverHeadScene.Pose): ICase => {
      const model: placeOverHeadScene.Loop = createNecklace({
        id: "loop",
        kind: pose === "front" ? "ribbon" : "chain",
      });
      const handle: string = placeOverHeadScene.handle(pose);
      return {
        label: `${name} takes up a loop laid for ${pose}`,
        body,
        take: (): HumanPerformance =>
          alone(
            "place-over-head",
            body,
            HumanObject.prop("loop", model, placeOverHeadScene.stand(pose)),
            HumanChain.subject("a").pickUp({
              prop: "loop",
              handle,
              hand: "right",
              lift: ASKED,
            }),
          ),
        grasps: [grasp("a", "right", "loop", model, handle, ASKED)],
      };
    },
  );
}

/** A backpack's strap, placed then worn, and a suitcase's drawn pull bar. */
function bags(name: motionHumanBody.Name): ICase[] {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  return [
    {
      label: `${name} takes up the backpack, then off the back`,
      body,
      take: (): HumanPerformance =>
        carriageScene.perform(
          `${name} doff`,
          body,
          a.props,
          carriageScene.doff(
            carriageScene.don(HumanChain.subject("actor").stand(), a),
            body,
          ),
        ),
      grasps: [1, 2].map(
        (n: number): motionGraspUnit.IGrasp =>
          grasp("actor", "right", "pack", a.pack, "rightStrap", 0, n),
      ),
    },
    {
      label: `${name} takes up the drawn pull bar`,
      body,
      take: (): HumanPerformance =>
        carriageScene.perform(
          `${name} pull`,
          body,
          a.props,
          carriageScene.pull(
            carriageScene.draw(HumanChain.subject("actor").stand(), a),
          ),
        ),
      grasps: [grasp("actor", "left", "case", a.case, "pull", 0)],
    },
  ];
}

/** A serving tray on the palm and a porter's tray by its end grip. */
function trays(name: motionHumanBody.Name): ICase[] {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const h: carriageScene.IHeadLoad = carriageScene.headLoad(body);
  return [
    {
      label: `${name} takes up the tray on the palm`,
      body,
      take: (): HumanPerformance =>
        carriageScene.perform(
          `${name} tray pick-up`,
          body,
          carriageScene.trayProps(),
          carriageScene.lift(HumanChain.subject("actor").stand()),
        ),
      grasps: [
        grasp(
          "actor",
          "right",
          "tray",
          createServingTray({ id: "tray" }),
          "palm",
          0,
        ),
      ],
    },
    {
      label: `${name} takes up the porter's tray by its end grip`,
      body,
      take: (): HumanPerformance =>
        carriageScene.perform(
          `${name} head load`,
          body,
          h.props,
          carriageScene.place(HumanChain.subject("actor").stand(), h),
        ),
      grasps: [grasp("actor", "right", "basket", h.basket, "rightHandle", 0)],
    },
  ];
}

/** A tote by its strap, then by its handle in the other hand. */
function tote(name: motionHumanBody.Name): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const model: everydayTake.IPosable = createBag({ id: "tote", kind: "tote" });
  return {
    label: `${name} changes the tote's hands`,
    body,
    take: (): HumanPerformance =>
      carriageScene.perform(
        `${name} change hands`,
        body,
        // Before the body, where either hand reaches its handles.
        [everydayTake.prop("tote", model, { x: 0, y: 0.7, z: 0.35 })],
        HumanChain.subject("actor")
          .stand()
          .pickUp({ prop: "tote", handle: "strap", hand: "right", lift: 0 })
          .pickUp({ prop: "tote", handle: "handle", hand: "left", lift: 0 }),
      ),
    grasps: [
      grasp("actor", "right", "tote", model, "strap", 0),
      grasp("actor", "left", "tote", model, "handle", 0, 2),
    ],
  };
}

/** A shoe or a sock by its hold from the table top. */
function footwear(c: wardrobeFootwearScene.ICase): ICase {
  const s: wardrobeFootwearScene.IScene = wardrobeFootwearScene.scene(c);
  return {
    label: `${c.label} takes up the footwear`,
    body: s.body,
    take: (): HumanPerformance =>
      wardrobeFootwearScene.perform(s, wardrobeFootwearScene.pickUp(s)),
    grasps: [
      grasp(
        "actor",
        s.hand,
        "footwear",
        s.model,
        "hold",
        wardrobeFootwearScene.LIFT,
      ),
    ],
  };
}

/** A ring by its hold from its stand. */
function ring(c: slipRingScene.ICase): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(c.dresser);
  const model: slipRingScene.Ring = createFingerRing({ id: "ring" });
  return {
    label: `${c.dresser} takes the ring in the ${c.side} hand`,
    body,
    take: (): HumanPerformance =>
      alone(
        "slip-ring",
        body,
        HumanObject.prop("ring", model, slipRingScene.stand(c.side)),
        HumanChain.subject("a").pickUp({
          prop: "ring",
          handle: "hold",
          hand: c.side,
          lift: ASKED,
        }),
      ),
    grasps: [grasp("a", c.side, "ring", model, "hold", ASKED)],
  };
}

/** A jacket by its back collar. */
function jacket(c: coatPartnerScene.ICase): ICase {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(c.dresser);
  const model: coatPartnerScene.JacketModel = coatPartnerScene.jacket();
  return {
    label: `${c.dresser} takes up the jacket (${c.hand} hand)`,
    body,
    take: (): HumanPerformance => coatPartnerScene.pickUp(body, model, c.hand),
    grasps: [
      grasp("a", c.hand, "jacket", model, "backCollar", coatPartnerScene.LIFT),
    ],
  };
}

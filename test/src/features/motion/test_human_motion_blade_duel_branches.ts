import { createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanBladeExchange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanPropFrame,
  composeHumanBladeExchange,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The stage blade model. */
type Blade = ReturnType<typeof createStageBladeProp>;

/** One declared branch of the exchange. */
interface IBranch {
  /** The branch's label. */
  name: string;

  /** Whether the defender answers with a riposte. */
  reply: boolean;
}

/** The two branches: a cut parried in a bind and answered, and the same cut authored to land unblocked. */
const BRANCHES: readonly IBranch[] = [
  { name: "bind and reply", reply: true },
  { name: "landed", reply: false },
];

/** The performers' separation, metres: a cutting distance for two sabres. */
const APART: number = 1.7;
/** A held grip holds within this, metres: the staged piste's grip bound. */
const HOLD: number = 0.005;
/** The blades meet in a bind within this of each other's axis, metres: two blade widths. */
const BIND: number = 0.06;
/** A landed cut's edge passes within this of the target shoulder's joint, metres: a shoulder's half breadth. */
const LAND: number = 0.12;
/** The block's authored lead before the opening's decisive instant, seconds. */
const LEAD: number = 0.4;

/**
 * A directed sabre duel in two declared branches: a cut parried in a bind
 * and answered with a riposte, and the same cut authored to land unblocked.
 *
 * Scenarios:
 * 1. Each performer keeps the blade's grip, the same prop subject, through
 *    the whole exchange of either branch.
 * 2. In the full branch the blades meet in a bind at the opening's decisive
 *    instant, the block starts the lead before it and the reply starts as
 *    the block ends.
 * 3. In the landing branch the blades never come within the bind's
 *    distance and the cut's edge reaches the target shoulder at contact.
 * 4. Seeks in reverse order and a rebuilt take read the same blade frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the branches, the grip, bind and cue checks and the seek check.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered blade rows through composeHumanBladeExchange and HumanPerformance and reads displayed hands, blades and the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The lead is authored; the bind bound is two blade widths and the grip bound the piste's; the cue order is the composer's contract.
 * @evidence contracts/development/testing.md#distinguishing-cases A reply against none, a whole opening against one cut before contact, forward against reversed reads.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_blade_duel_branches(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const checks: motionComplaints.IGatherer = motionComplaints();
  const blade: Blade = createStageBladeProp({ kind: "sabre", id: "blade" });
  const tip: IAutoMovieVector3 = blade.affordance("point").frame.translation;
  for (const branch of BRANCHES)
    try {
      const play = (): HumanPerformance => stage(body, blade, branch);
      const film: HumanPerformance = play();
      const again: HumanPerformance = play();
      const placed = (anchor: string): IAutoMovieScheduleEntry | undefined =>
        film.schedule.entries.find(
          (entry: IAutoMovieScheduleEntry): boolean =>
            entry.intent.anchor === anchor,
        );
      const opening: IAutoMovieScheduleEntry = placed("duel.opening")!;
      const block: IAutoMovieScheduleEntry | undefined = placed("duel.block");
      const reply: IAutoMovieScheduleEntry | undefined = placed("duel.reply");
      const contact: number =
        opening.contact ?? opening.start + (opening.end - opening.start) / 2;
      const from: number = Math.min(
        opening.start,
        block?.start ?? opening.start,
      );
      const to: number = Math.max(
        opening.end,
        block?.end ?? 0,
        reply?.end ?? 0,
      );

      // Grip: each blade keeps its hand frame through the exchange.
      for (const subject of ["a", "b"] as const) {
        const first: IAutoMovieRigidTransform = held(film, subject, from);
        for (let i: number = 1; i <= 12; ++i) {
          const t: number = from + ((to - from) * i) / 12;
          checks.check(
            `${branch.name}: ${subject} keeps its grip at ${t.toFixed(2)}`,
            Vector3.distance(held(film, subject, t).position, first.position) <=
              HOLD,
          );
        }
      }

      // The bind, or its absence once the opening is broken off.
      const gap = (t: number): number =>
        segments(film.prop("a.blade", t), film.prop("b.blade", t), tip);
      if (branch.reply) {
        checks.check(
          `${branch.name}: the blades bind at the opening's contact (${gap(contact).toFixed(3)} m)`,
          gap(contact) <= BIND,
        );
        checks.check(
          `${branch.name}: the block leads the contact by its lead and the reply follows it`,
          block !== undefined &&
            Math.abs(block.start - (contact - LEAD)) <= 1e-6 &&
            reply !== undefined &&
            Math.abs(reply.start - block.end) <= 1e-6,
        );
      } else {
        // Unblocked, the blades never bind and the edge reaches the shoulder.
        let closest: number = Infinity;
        for (let i: number = 0; i <= 24; ++i)
          closest = Math.min(closest, gap(from + ((to - from) * i) / 24));
        const shoulder: IAutoMovieVector3 = film
          .bones("b", contact)
          .get("rightUpperArm")!.worldPosition;
        const edge: number = along(
          film.prop("a.blade", contact),
          tip,
          shoulder,
        );
        checks.check(
          `${branch.name}: the cut lands unblocked (${closest.toFixed(3)} m apart, ${edge.toFixed(3)} m from the shoulder)`,
          closest > BIND && reply === undefined && edge <= LAND,
        );
      }

      // Reverse seeks and a rebuilt take read the same frames.
      const times: number[] = [from, contact, to, film.duration];
      const forward: IAutoMovieRigidTransform[] = times.map(
        (t: number): IAutoMovieRigidTransform => film.prop("a.blade", t),
      );
      checks.check(
        `${branch.name}: seeks and a rebuild read the same blade`,
        [...times.keys()].reverse().every((i: number): boolean => {
          const back: IAutoMovieRigidTransform = film.prop(
            "a.blade",
            times[i]!,
          );
          const rebuilt: IAutoMovieRigidTransform = again.prop(
            "a.blade",
            times[i]!,
          );
          return (
            Vector3.distance(back.position, forward[i]!.position) < 1e-9 &&
            Vector3.distance(rebuilt.position, forward[i]!.position) < 1e-9
          );
        }),
      );
    } catch (error: unknown) {
      checks.check(`${branch.name} refused: ${String(error)}`, false);
    }
  checks.assert("blade duel branches");
}

/** Arm both performers with sabres and compose the exchange of one branch. */
function stage(
  body: IAutoMovieMotionHumanBody,
  blade: Blade,
  branch: IBranch,
): HumanPerformance {
  const grip: IAutoMovieVector3 = blade.affordance("grip").frame.translation;
  const use: IAutoMovieMotionHumanGraspUse.IUse = {
    tip: "point",
    line: "oblique",
  };
  const held = (
    subject: string,
    root: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanProp => {
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      yaw,
    );
    const stature: number = body.measure.stature;
    return HumanObject.prop(`${subject}.blade`, blade, {
      position: Vector3.add(
        root,
        Quaternion.rotateVector(turn, {
          x: -0.1 * stature,
          y: 0.6 * stature,
          z: 0.18 * stature - grip.y,
        }),
      ),
      rotation: Quaternion.multiply(
        turn,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      ),
    });
  };
  const exchange: IAutoMovieMotionHumanBladeExchange = {
    cue: "duel",
    openingProp: "a.blade",
    respondingProp: "b.blade",
    blockLeadSeconds: LEAD,
    openingMark: { kind: "person", subject: "b", region: "shoulderRight" },
    ...(branch.reply
      ? { replyMark: { kind: "person", subject: "a", region: "crown" } }
      : {}),
  };
  const opener = HumanChain.subject("a").pickUp({
    prop: "a.blade",
    handle: "grip",
    hand: "right",
    use,
  });
  const composition: IAutoMovieChain = composeHumanBladeExchange(
    opener,
    HumanChain.subject("b").pickUp({
      prop: "b.blade",
      handle: "grip",
      hand: "right",
      use,
    }),
    exchange,
  );
  // The landing branch is the same opening authored to land, unblocked.
  const node: IAutoMovieChain["node"] = branch.reply
    ? composition.node
    : opener
        .registered(
          HumanBlade.cut.name,
          { blade: "a.blade", target: exchange.openingMark, outcome: "lands" },
          "duel.opening",
        )
        .stand({ seconds: 0.8, sway: 0 })
        .with(
          HumanChain.subject("b").pickUp({
            prop: "b.blade",
            handle: "grip",
            hand: "right",
            use,
          }),
        ).node;
  return new HumanPerformance({
    seed: "blade-duel-" + branch.name,
    laws: [...Object.values(HumanBlade)],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: APART },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      held("a", { x: 0, y: 0, z: 0 }, 0),
      held("b", { x: 0, y: 0, z: APART }, 180),
    ],
    composition: node,
  });
}

/** A performer's blade in its right hand's displayed frame. */
function held(
  film: HumanPerformance,
  subject: string,
  t: number,
): IAutoMovieRigidTransform {
  const hand: IAutoMovieResolvedBone = film.bones(subject, t).get("rightHand")!;
  return HumanPropFrame.relative(
    HumanPropFrame.bone(hand),
    film.prop(`${subject}.blade`, t),
  );
}

/** The least distance from a blade's axis, shoulder to tip, to a point, metres. */
function along(
  frame: IAutoMovieRigidTransform,
  tip: IAutoMovieVector3,
  point: IAutoMovieVector3,
): number {
  let best: number = Infinity;
  for (let i: number = 0; i <= 40; ++i) {
    const p: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, Vector3.scale(tip, i / 40)),
    );
    best = Math.min(best, Vector3.distance(p, point));
  }
  return best;
}

/** The least distance between two blades' axes, each from its shoulder to its tip, metres. */
function segments(
  a: IAutoMovieRigidTransform,
  b: IAutoMovieRigidTransform,
  tip: IAutoMovieVector3,
): number {
  const end = (frame: IAutoMovieRigidTransform): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, tip));
  const p0: IAutoMovieVector3 = a.position;
  const p1: IAutoMovieVector3 = end(a);
  const q0: IAutoMovieVector3 = b.position;
  const q1: IAutoMovieVector3 = end(b);
  let best: number = Infinity;
  for (let i: number = 0; i <= 20; ++i)
    for (let j: number = 0; j <= 20; ++j) {
      const p: IAutoMovieVector3 = Vector3.add(
        p0,
        Vector3.scale(Vector3.subtract(p1, p0), i / 20),
      );
      const q: IAutoMovieVector3 = Vector3.add(
        q0,
        Vector3.scale(Vector3.subtract(q1, q0), j / 20),
      );
      best = Math.min(best, Vector3.distance(p, q));
    }
  return best;
}

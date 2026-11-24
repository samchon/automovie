import {
  createCostumeCuirass,
  createStageBladeProp,
} from "@automovie/archetypes";
import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
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
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanStageFight,
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanPropFrame } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The stage blade model. */
type Blade = ReturnType<typeof createStageBladeProp>;
/** The costume cuirass model. */
type Cuirass = ReturnType<typeof createCostumeCuirass>;

/** An axis-aligned box in a model's frame, metres. */
interface IBox {
  /** The least corner. */
  min: IAutoMovieVector3;

  /** The greatest corner. */
  max: IAutoMovieVector3;
}

/** One declared branch of the exchange. */
interface IBranch {
  /** The branch's label. */
  name: string;

  /** Whether the defender answers with a riposte. */
  reply: boolean;

  /** Whether the defender wears a costume cuirass on the chest. */
  armour: boolean;
}

/** The two branches: a cut parried in a bind and answered, and the same cut authored to land unblocked. */
const BRANCHES: readonly IBranch[] = [
  { name: "bind and reply", reply: true, armour: false },
  { name: "armoured bind and reply", reply: true, armour: true },
  { name: "landed", reply: false, armour: false },
];

/**
 * The performers' separation, root to root, metres. They square off at the
 * fighting distance (`HumanProxemics.GAPS.fighting`, Maloney, Renshaw and
 * Farrow 2021), a gap from the front of one chest to the other's sternum.
 * Each chest's front stands half a chest depth ahead of its body's centre
 * line (the convention `HumanProxemics.reach` measures by), so the roots
 * stand the gap plus one chest depth apart. From there no cut lands, even
 * with a lunge: a bout closes the distance with footwork before it attacks,
 * so the opener advances first (`closing`).
 *
 * @param body The performers' body.
 * @returns Metres.
 */
function apart(body: IAutoMovieMotionHumanBody): number {
  return (
    AutoMovieMotionHumanGait.HumanProxemics.GAPS.fighting +
    body.measure.chestDepth
  );
}

/**
 * How far the opener's one fencing advance carries it, metres: the stance
 * step's own length, half a stance (`step.STEP_SHARE` of
 * `StrikingStance.length`), as the advance row takes it.
 *
 * @param body The opener's body.
 * @returns Metres.
 */
function closing(body: IAutoMovieMotionHumanBody): number {
  return (
    AutoMovieMotionHumanStrike.step.STEP_SHARE *
    AutoMovieMotionHumanStrike.StrikingStance.length(body)
  );
}

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
 * 4. With the defender in a costume cuirass, the same bind and reply keeps
 *    its cue; the cuirass rides the chest bone rigidly and the attacking
 *    blade stays outside its shell.
 * 5. Seeks in reverse order and a rebuilt take read the same blade frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the branches, the grip, bind and cue checks and the seek check.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered blade rows through composeHumanBladeExchange and HumanPerformance and reads displayed hands, blades and the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The lead is authored; the bind bound is two blade widths and the grip bound the piste's; the cue order is the composer's contract.
 * @evidence contracts/development/testing.md#distinguishing-cases A reply against none, a whole opening against one cut before contact, forward against reversed reads.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_blade_duel_branches(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const checks: motionComplaints.IGatherer = motionComplaints();
  const blade: Blade = createStageBladeProp({ kind: "sabre", id: "blade" });
  const cuirass: Cuirass = createCostumeCuirass({ id: "cuirass" });
  const shell: IBox = bounds(cuirass);
  const tip: IAutoMovieVector3 = blade.affordance("point").frame.translation;
  for (const branch of BRANCHES)
    try {
      const play = (): HumanPerformance =>
        stage(body, blade, branch, branch.armour ? cuirass : undefined);
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

      // A worn cuirass rides the chest bone rigidly, and the attacking blade
      // stays clear of its shell through the exchange.
      if (branch.armour) {
        const worn = (t: number): IAutoMovieRigidTransform =>
          HumanPropFrame.relative(
            HumanPropFrame.bone(film.bones("b", t).get("chest")!),
            film.prop("cuirass", t),
          );
        const rest: IAutoMovieRigidTransform = worn(from);
        let clear: number = Infinity;
        let when: number = from;
        for (let i: number = 0; i <= 24; ++i) {
          const t: number = from + ((to - from) * i) / 24;
          checks.check(
            `${branch.name}: the cuirass rides the chest at ${t.toFixed(2)}`,
            Vector3.distance(worn(t).position, rest.position) <= HOLD,
          );
          const gap: number = outside(
            film.prop("a.blade", t),
            tip,
            film.prop("cuirass", t),
            shell,
          );
          if (gap < clear) {
            clear = gap;
            when = t;
          }
        }
        // Where the blade's axis stands in the shell's frame at the closest
        // instant, grip to tip, so a failure names the part and the phase.
        const local = (share: number): IAutoMovieVector3 => {
          const blade: IAutoMovieRigidTransform = film.prop("a.blade", when);
          const frame: IAutoMovieRigidTransform = film.prop("cuirass", when);
          return Quaternion.rotateVector(
            Quaternion.inverse(frame.rotation),
            Vector3.subtract(
              Vector3.add(
                blade.position,
                Quaternion.rotateVector(
                  blade.rotation,
                  Vector3.scale(tip, share),
                ),
              ),
              frame.position,
            ),
          );
        };
        checks.check(
          `${branch.name}: the blade stays outside the cuirass (${clear.toFixed(3)} m at ${when.toFixed(3)} s; opening ${opening.start.toFixed(3)}-${opening.end.toFixed(3)}, contact ${contact.toFixed(3)}, reply ${reply?.start.toFixed(3)}-${reply?.end.toFixed(3)}; blade at 0, 0.5, 0.83, 1 of its length ${JSON.stringify([0, 0.5, 0.83, 1].map(local))}; shell ${JSON.stringify(shell)})`,
          clear > 0,
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
  cuirass?: Cuirass,
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
    // Marks are fixed points: the partner's right shoulder where it stands,
    // and the opener's crown where its advance leaves it.
    openingMark: {
      kind: "point",
      frame: "world",
      at: {
        x: -body.rest.get("rightUpperArm")!.x,
        y: body.rest.get("rightUpperArm")!.y,
        z: apart(body) - body.rest.get("rightUpperArm")!.z,
      },
    },
    ...(branch.reply
      ? {
          replyMark: {
            kind: "point",
            frame: "world",
            at: { x: 0, y: body.measure.stature, z: closing(body) },
          },
        }
      : {}),
  };
  // The opener closes from the fighting distance with one advance, then cuts.
  const opener = HumanChain.subject("a")
    .pickUp({
      prop: "a.blade",
      handle: "grip",
      hand: "right",
      use,
    })
    .registered(AutoMovieMotionHumanBlade.HumanBlade.advance.name, {});
  const composition: IAutoMovieChain =
    AutoMovieMotionHumanStageFight.bladeExchange(
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
          AutoMovieMotionHumanBlade.HumanBlade.cut.name,
          { blade: "a.blade", target: exchange.openingMark, outcome: "lands" },
          "duel.opening",
        )
        .stand({ hold: 0.8, sway: 0 })
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
    laws: [...Object.values(AutoMovieMotionHumanBlade.HumanBlade)],
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
        at: { x: 0, y: 0, z: apart(body) },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      held("a", { x: 0, y: 0, z: 0 }, 0),
      held("b", { x: 0, y: 0, z: apart(body) }, 180),
      ...(cuirass === undefined ? [] : [wear(cuirass)]),
    ],
    composition: node,
  });
}

/** The cuirass worn on the defender's chest with its `wear` socket on the chest bone. */
function wear(cuirass: Cuirass): IAutoMovieMotionHumanProp {
  const socket: IAutoMovieTransform = cuirass.affordance("wear").frame;
  return {
    ...HumanObject.prop("cuirass", cuirass, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    worn: {
      subject: "b",
      bone: "chest",
      offset: HumanPropFrame.relative(
        { position: socket.translation, rotation: socket.rotation },
        { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      ),
    },
  };
}

/** The cuirass's collider bounds in its own frame. */
function bounds(cuirass: Cuirass): IBox {
  const corners: IAutoMovieVector3[] = [];
  for (const shape of cuirass.shapes?.() ?? []) {
    const box: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
      { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      shape,
    );
    corners.push(box.min, box.max);
  }
  return {
    min: {
      x: Math.min(...corners.map((p: IAutoMovieVector3): number => p.x)),
      y: Math.min(...corners.map((p: IAutoMovieVector3): number => p.y)),
      z: Math.min(...corners.map((p: IAutoMovieVector3): number => p.z)),
    },
    max: {
      x: Math.max(...corners.map((p: IAutoMovieVector3): number => p.x)),
      y: Math.max(...corners.map((p: IAutoMovieVector3): number => p.y)),
      z: Math.max(...corners.map((p: IAutoMovieVector3): number => p.z)),
    },
  };
}

/** How far a blade's axis stays outside a box in another frame, metres; zero or less inside. */
function outside(
  blade: IAutoMovieRigidTransform,
  tip: IAutoMovieVector3,
  frame: IAutoMovieRigidTransform,
  box: IBox,
): number {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);
  let best: number = Infinity;
  for (let i: number = 0; i <= 40; ++i) {
    const p: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(
        Vector3.add(
          blade.position,
          Quaternion.rotateVector(blade.rotation, Vector3.scale(tip, i / 40)),
        ),
        frame.position,
      ),
    );
    const d: IAutoMovieVector3 = {
      x: Math.max(box.min.x - p.x, 0, p.x - box.max.x),
      y: Math.max(box.min.y - p.y, 0, p.y - box.max.y),
      z: Math.max(box.min.z - p.z, 0, p.z - box.max.z),
    };
    best = Math.min(best, Math.hypot(d.x, d.y, d.z));
  }
  return best;
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

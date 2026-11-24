import { createLongGun, createShield } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  compileFormationStageMarks,
  compiledFormationSlot,
  materializeCompiledFormation,
  placeFormationSlot,
  sampleFormationMotion,
  sampleFormationSlotMotion,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieCompiledFormation,
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlot,
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationStageMarkSet,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanFoot } from "@automovie/motions/internal";
import * as THREE from "three";

import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose, vclose } from "../../internal/predicates";

/** The shared director cue for the first step. */
const STEP_OFF: number = 2.1;
/** Director cue for the left foreground actor. */
const LEFT_CUE: number = 5.1;
/** Director cue for the right foreground actor. */
const RIGHT_CUE: number = 5.35;
/** Forward distance between the row marks, in metres. */
const ADVANCE: number = 1.5;
/** Adjacent slot spacing on the wider mark, in metres. */
const WIDER: number = 1.18;
/** Adjacent slot spacing on the starting mark, in metres. */
const NARROWER: number = 0.93;
/** Allowed sole height off the stage at a plant, in metres: the gait law's floor contact bound. */
const SOLE: number = 0.016;
/** Allowed horizontal slip of the planted ball in late stance, in metres: foot locking holds the forefoot rocker still. */
const DRIFT: number = 0.015;
/** Allowed departure from the authored row spacing while the row travels, in metres: the start mark's own reading tolerance. */
const SPACING: number = 0.13;

/** The two authored rehearsals on the same stage marks. */
type Variant = "plain row" | "display panel row" | "long arm row";
/** The inert held display model produced by the archetype. */
type Board = ReturnType<typeof createShield> | ReturnType<typeof createLongGun>;
/** One authored floor mark of an anonymous slot. */
type StageMark = IAutoMovieFormationStageMarkSet["marks"][number];
/** One named slot of the compiled population. */
type Hero = IAutoMovieCompiledFormation["heroes"][number];
/** One shot's projection camera. */
type Camera = THREE.PerspectiveCamera;

/** One stage rehearsal and its authored cast and board identities. */
interface IRehearsal {
  /** The public motion execution. */
  performance: HumanPerformance;

  /** Member records for the three played foreground actors. */
  foreground: readonly IAutoMovieMotionHumanEnsemble.IMember[];

  /** Authored inert foam panel by its wearer. */
  boards: ReadonlyMap<string, Board>;

  /** The two independently seeded background slots in the public film population. */
  population: IAutoMovieCompiledFormation;

  /** The sparse authored marks for the population slots in the projected shot. */
  marks: IAutoMovieFormationSlotMotion[];
}

/**
 * Two ground ensemble rehearsals maintain identity, space and actor-specific cues.
 *
 * Scenarios:
 * 1. Five neutral stage slots move from a narrow row to a wider forward
 *    row. The three performed members step with both feet, keep each
 *    planted ball still through late stance, stay between the two marks'
 *    spacing while travelling and arrive at their own marks; the background
 *    slots keep separate ids and phases.
 * 2. Two foreground actors carry inert display panels, and in the infantry
 *    row all three carry long arms, through the same widening, each keeping
 *    its held frame into the recovery.
 * 3. The outer foreground actors answer their own separate cue and the
 *    middle actor holds. Wide and closer cameras keep their intended
 *    subjects in frame every half second of the take. Reverse reads and a
 *    second seeded build reproduce the same world pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names stage slots, actual foot support, separately addressed cue and stable panel carriage.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the ensemble planner, registered gait, public prop custody and resolved foot bones through HumanPerformance, then projects the world head positions through native perspective cameras.
 * @evidence contracts/development/testing.md#independent-expectations Literal symmetric slot steps of 0.93 and 1.18 metres differ from the native manoeuvre output, and the written 1.5-metre advance and cue seconds determine the expected endpoints and event order. The rendered hand-local panel frame is independently observed from displayed bones and prop transforms.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts occupied and background slots, moving and grounded phases, bare and carried rehearsals, separately addressed and uncued actors, two cameras, repeated/reversed reads and a second seeded build. The ball-drift and sole bounds are the gait's floor-contact tolerances; the row spacing bound is the start mark's reading tolerance.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable native test runs two seeded performances and observes their products in memory. The cameras project actual body positions; raster inspection is recorded separately.
 */
export function test_motion_ensemble_ground_ensemble_cues(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const variant of [
    "plain row",
    "display panel row",
    "long arm row",
  ] as const)
    try {
      verify(variant, assemble(variant), assemble(variant), checks);
    } catch (error: unknown) {
      checks.check(variant + " refuses: " + String(error), false);
    }
  checks.assert("both ensemble rehearsals meet their stage marks and cues");
}

/** Build a neutral straight row from the production formation vocabulary. */
function row(space: number, z: number): IAutoMovieMotionHumanFormation {
  return AutoMovieMotionHumanEnsemble.HumanFormation({
    blocks: [
      {
        count: 5,
        seed: 21,
        layout: {
          kind: "line",
          ranks: 1,
          files: 5,
          spacing: { lateral: space, depth: 1 },
        },
      },
    ],
    frame: { kind: "fixed", at: { x: 0, y: 0, z }, heading: 0 },
  });
}

/** Use one ordered blocking pass and member-owned travel and response actions. */
function assemble(variant: Variant): IRehearsal {
  const from: IAutoMovieMotionHumanFormation = row(NARROWER, 0);
  const to: IAutoMovieMotionHumanFormation = row(WIDER, ADVANCE);
  const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble =
    AutoMovieMotionHumanEnsemble.HumanEnsemble({
      id: "cast",
      seed: "dress-rehearsal",
      count: 5,
      bodies: [motionHumanBody("m-average"), motionHumanBody("f-small")],
      attributes: { discipline: { mean: 1, spread: 0 } },
      formation: from,
      detail: (member): IAutoMovieMotionHumanEnsemble.Detail =>
        member.index === 0 || member.index === 4 ? "population" : "full",
    });
  const order: IAutoMovieMotionHumanManoeuvre = {
    from,
    to,
    rule: "extend",
    gait: "walk",
    on: { of: "director", event: "advance" },
    at: STEP_OFF,
  };
  const parts: IAutoMovieMotionHumanManoeuvre.IPart[] =
    AutoMovieMotionHumanEnsemble.HumanManoeuvre.plan(ensemble, order);
  const foreground: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
    ensemble.members.filter(
      (member: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
        member.detail === "full",
    );
  const boards: Map<string, Board> = new Map();
  const objects: IAutoMovieMotionHumanProp[] = [];
  for (const member of foreground) {
    // Panels on the outer actors; long arms on all three infantry.
    if (variant === "plain row") continue;
    if (variant === "display panel row" && member.index === 2) continue;
    const id: string = "display-" + member.index;
    const board: Board =
      variant === "long arm row"
        ? createLongGun({ id, kind: "musket" })
        : createShield({
            id,
            kind: "strapped",
            diameter: 0.72,
            mass: 0.36,
          });
    boards.set(member.subject, board);
    const grip: IAutoMovieVector3 = board.affordance("grip").frame.translation;
    objects.push(
      HumanObject.prop(id, board, {
        at: {
          x: member.place.at.x - 0.28 - grip.x,
          y: 0.58 * member.body.measure.stature - grip.y,
          z: member.place.at.z + 0.25 - grip.z,
        },
        yaw: 0,
      }),
    );
  }
  const performance: HumanPerformance = new HumanPerformance({
    seed: "dress-rehearsal",
    laws: [...HUMAN_LEXICON.gait!],
    performers: AutoMovieMotionHumanEnsemble.HumanEnsemble.performers(ensemble),
    props: objects,
    cues: {
      director: [
        { name: "advance", seconds: STEP_OFF },
        { name: "look-left", seconds: LEFT_CUE },
        { name: "look-right", seconds: RIGHT_CUE },
      ],
    },
    composition: AutoMovieMotionHumanEnsemble.HumanEnsemble.chains(
      ensemble,
      (
        member: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ): IAutoMovieMotionHumanChain => {
        const waiting: IAutoMovieMotionHumanChain = chain.stand({
          hold: 0.2,
          sway: 0,
        });
        const board: Board | undefined = boards.get(member.subject);
        const ready: IAutoMovieMotionHumanChain =
          board === undefined
            ? waiting
            : waiting.pickUp({
                prop: board.id,
                handle: "grip",
                hand: "right",
                lift: 0.02,
              });
        const moving: IAutoMovieMotionHumanChain =
          AutoMovieMotionHumanEnsemble.HumanManoeuvre.append(
            ready,
            parts[member.index]!,
            order,
          );
        if (member.index === 2) return moving.stand({ hold: 3, sway: 0 });
        const event: string = member.index === 1 ? "look-left" : "look-right";
        return moving
          .stand({ hold: 3, sway: 0 })
          .look(
            {
              target: {
                kind: "point",
                frame: "world",
                at: { x: member.index === 1 ? 2.5 : -2.5, y: 1.4, z: 4.2 },
              },
              recruit: "head",
              duration: 0.45,
            },
            event,
          )
          .sync({ of: "director", event })
          .stand({ hold: 0.25, sway: 0 });
      },
    ),
  });
  const population: IAutoMovieFormationDesign =
    AutoMovieMotionHumanEnsemble.HumanPopulation.design(ensemble, {
      id: "background",
      model: "background-figure",
    });
  const ends: number[] = foreground.map(
    ({ subject }: IAutoMovieMotionHumanEnsemble.IMember): number =>
      performance
        .segments(subject)
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.name === "walk",
        )!.end,
  );
  return {
    performance,
    foreground,
    boards,
    population: materializeCompiledFormation({ formation: population }),
    marks: compileFormationStageMarks(population, [
      {
        id: "background-widens",
        start: STEP_OFF,
        end: Math.max(...ends),
        marks: [0, 4].map(
          (slot: number): StageMark => ({
            slot,
            lateral: (slot - 2) * WIDER,
            depth: -ADVANCE,
          }),
        ),
      },
    ]),
  };
}

/** Read each member's foot support, handed cue, joint turn and held model. */
function verify(
  variant: Variant,
  take: IRehearsal,
  rerun: IRehearsal,
  checks: motionComplaints.IGatherer,
): void {
  const { performance, foreground, boards, population }: IRehearsal = take;
  const previous: IAutoMovieVector3[] = [];
  const final: IAutoMovieVector3[] = [];
  for (const member of foreground) {
    const subject: string = member.subject;
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments(subject);
    const travel: IAutoMovieMotionHumanSegment | undefined = segments.find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "walk",
    );
    if (travel === undefined) {
      checks.check(variant + " " + subject + " has a walk segment", false);
      continue;
    }

    const on: number = STEP_OFF;
    const rootAt: IAutoMovieVector3 = performance.posture(subject, on).root;
    const rootEnd: IAutoMovieVector3 = performance.posture(
      subject,
      performance.duration,
    ).root;
    previous.push(rootAt);
    final.push(rootEnd);
    const x: number = (2 - member.index) * WIDER;
    checks.check(
      variant + " " + subject + " keeps its individually widened mark",
      nclose(travel.start, on, 0.001) &&
        nclose(rootEnd.x, x, 0.1) &&
        nclose(rootEnd.z, ADVANCE, 0.14),
    );
    const plants: readonly IAutoMovieMotionHumanContactWindow[] =
      travel.plan.contacts.filter(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.kind === "plant" &&
          (contact.part === "leftFoot" || contact.part === "rightFoot"),
      );
    checks.check(
      variant + " " + subject + " actually steps with both feet",
      new Set(
        plants.map(
          (contact: IAutoMovieMotionHumanContactWindow): string => contact.part,
        ),
      ).size === 2 &&
        travel.plan.events.filter((event: IAutoMovieMotionEvent): boolean =>
          event.name.includes("HeelStrike"),
        ).length >= 2,
    );
    for (const plant of plants) {
      const seconds: number =
        travel.start + ((plant.from + plant.to) * travel.plan.duration) / 2;
      const late: number =
        travel.start +
        (plant.from + (plant.to - plant.from) * 0.85) * travel.plan.duration;
      const side: AutoMovieHumanSide =
        plant.part === "leftFoot" ? "left" : "right";
      const sole: readonly IAutoMovieMotionHumanFoot.ISocket[] =
        HumanFoot.sockets(
          member.body,
          performance.bones(subject, seconds),
          side,
        );
      const rolled: readonly IAutoMovieMotionHumanFoot.ISocket[] =
        HumanFoot.sockets(member.body, performance.bones(subject, late), side);
      const ball: IAutoMovieVector3 = sole.find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === "ball",
      )!.point;
      const rolledBall: IAutoMovieVector3 = rolled.find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === "ball",
      )!.point;
      checks.check(
        variant +
          " " +
          subject +
          " places " +
          side +
          " on the stage at " +
          seconds.toFixed(2),
        Math.abs(
          Math.min(
            ...sole.map(
              (socket: IAutoMovieMotionHumanFoot.ISocket): number =>
                socket.point.y,
            ),
          ),
        ) <= SOLE,
      );
      checks.check(
        variant +
          " " +
          subject +
          " keeps the " +
          side +
          " ball fixed on the floor through the late stance at " +
          seconds.toFixed(2),
        Math.hypot(rolledBall.x - ball.x, rolledBall.z - ball.z) <= DRIFT,
      );
    }
    for (let i: number = 1; i < 8; ++i) {
      const seconds: number =
        travel.start + (travel.end - travel.start) * (i / 8);
      const roots: readonly IAutoMovieVector3[] = foreground.map(
        (other: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 =>
          performance.posture(other.subject, seconds).root,
      );
      checks.check(
        variant +
          " " +
          subject +
          " keeps the row between its two marks' spacing at " +
          seconds.toFixed(2),
        roots
          .slice(1)
          .every((root: IAutoMovieVector3, index: number): boolean => {
            const gap: number = Math.abs(root.x - roots[index]!.x);
            return gap >= NARROWER - SPACING && gap <= WIDER + SPACING;
          }),
      );
    }
    const look: IAutoMovieMotionHumanSegment | undefined = segments.find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "look",
    );
    if (member.index === 2)
      checks.check(
        variant + " center holds without an addressed look",
        look === undefined,
      );
    else {
      const cue: number = member.index === 1 ? LEFT_CUE : RIGHT_CUE;
      const start: IAutoMovieQuaternion = performance
        .bones(subject, cue - 0.05)
        .get("head")!.worldRotation;
      const end: IAutoMovieQuaternion = performance
        .bones(subject, cue + 0.37)
        .get("head")!.worldRotation;
      checks.check(
        variant + " " + subject + " responds at its own mark",
        look !== undefined &&
          nclose(look.start, cue, 0.001) &&
          cue > travel.end &&
          Quaternion.angle(start, end) > 0.1,
      );
      const board: Board | undefined = boards.get(subject);
      if (board !== undefined) {
        const at: number = travel.start;
        const before: IAutoMovieRigidTransform = palmRelative(
          performance,
          subject,
          board.id,
          at,
        );
        for (const time of [(at + travel.end) / 2, travel.end, cue + 0.4, at]) {
          const sampled: IAutoMovieRigidTransform = palmRelative(
            performance,
            subject,
            board.id,
            time,
          );
          checks.check(
            variant +
              " " +
              subject +
              " keeps its carried panel through " +
              time.toFixed(2),
            vclose(sampled.position, before.position, 0.002) &&
              Quaternion.angle(sampled.rotation, before.rotation) < 0.002,
          );
        }
      }
    }

    const read: readonly number[] = [
      STEP_OFF,
      travel.end,
      performance.duration,
      STEP_OFF,
    ];
    const first: IAutoMovieVector3[] = read.map(
      (seconds: number): IAutoMovieVector3 =>
        performance.posture(subject, seconds).root,
    );
    const next: IAutoMovieVector3[] = [...read]
      .reverse()
      .map(
        (seconds: number): IAutoMovieVector3 =>
          performance.posture(subject, seconds).root,
      )
      .reverse();
    const again: IAutoMovieVector3[] = read.map(
      (seconds: number): IAutoMovieVector3 =>
        rerun.performance.posture(subject, seconds).root,
    );
    checks.check(
      variant + " " + subject + " repeats reverse root reads",
      first.every((value: IAutoMovieVector3, index: number): boolean =>
        vclose(value, next[index]!, 1e-9),
      ),
    );
    checks.check(
      variant + " " + subject + " replays the same seeded take",
      first.every((value: IAutoMovieVector3, index: number): boolean =>
        vclose(value, again[index]!, 1e-9),
      ),
    );
  }
  checks.check(
    variant + " foreground keeps ordered widening",
    previous.length === 3 &&
      final.length === 3 &&
      nclose(Math.abs(previous[0]!.x - previous[2]!.x), 2 * NARROWER, 0.13) &&
      nclose(Math.abs(final[0]!.x - final[2]!.x), 2 * WIDER, 0.16),
  );
  checks.check(
    variant + " background preserves the two nonperformed slots",
    population.anonymousCount === 2 &&
      population.heroes.map(({ slot }: Hero): number => slot).join(",") ===
        "1,2,3" &&
      compiledFormationSlot(population, 0).motionPhase !==
        compiledFormationSlot(population, 4).motionPhase &&
      [0, 4].every(
        (slot: number): boolean =>
          nclose(background(take, slot, 0).x, (2 - slot) * NARROWER, 0.001) &&
          vclose(
            background(take, slot, performance.duration),
            { x: (2 - slot) * WIDER, y: 0, z: ADVANCE },
            0.001,
          ),
      ),
  );
  checks.check(
    variant + " wide and closer views retain their intended heads",
    cameraSees(take, false) && cameraSees(take, true),
  );
}

/** Read the panel on its actual carrying hand, independent of its world travel. */
function palmRelative(
  performance: HumanPerformance,
  subject: string,
  prop: string,
  at: number,
): IAutoMovieRigidTransform {
  const wrist: IAutoMovieResolvedBone = performance
    .bones(subject, at)
    .get("rightHand")!;
  const held: IAutoMovieRigidTransform = performance.prop(prop, at);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(wrist.worldRotation);
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(held.position, wrist.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, held.rotation),
  };
}

/** Read one anonymous model slot by the same compact renderer placement. */
function background(
  take: IRehearsal,
  slot: number,
  time: number,
): IAutoMovieVector3 {
  const { population, marks }: IRehearsal = take;
  const member: IAutoMovieFormationSlot = compiledFormationSlot(
    population,
    slot,
  );
  return placeFormationSlot({
    position: member.position,
    anchor: population.anchor,
    facingDeg: member.facingDeg,
    baseFacingDeg: population.facingDeg,
    unit: sampleFormationMotion([], population.id, time),
    member: sampleFormationSlotMotion(marks, population.id, slot, time),
  }).position;
}

/** Check on-camera framing from the actual world heads at rehearsal boundaries. */
function cameraSees(take: IRehearsal, close: boolean): boolean {
  const camera: Camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.05, 25);
  camera.position.set(close ? 1.1 : 1.4, 2.1, close ? -4.75 : -6.6);
  camera.lookAt(0, 1, 0.8);
  camera.updateMatrixWorld(true);
  const { performance, foreground }: IRehearsal = take;
  const subjects: readonly IAutoMovieMotionHumanEnsemble.IMember[] = close
    ? [foreground[1]!]
    : foreground;

  // Every half second of the whole take, plus its last frame.
  const times: number[] = [performance.duration];
  for (let t: number = 0; t < performance.duration; t += 0.5) times.push(t);
  return times.every((seconds: number): boolean =>
    subjects.every(({ subject }: IAutoMovieMotionHumanEnsemble.IMember) => {
      const head: IAutoMovieVector3 = performance
        .bones(subject, seconds)
        .get("head")!.worldPosition;
      const projected: THREE.Vector3 = new THREE.Vector3(
        head.x,
        head.y,
        head.z,
      ).project(camera);
      return (
        Math.abs(projected.x) < 0.92 &&
        Math.abs(projected.y) < 0.92 &&
        Math.abs(projected.z) < 1
      );
    }),
  );
}

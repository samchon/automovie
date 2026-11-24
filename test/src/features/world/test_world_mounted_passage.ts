import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  createPony,
  rideQuadruped,
} from "@automovie/archetypes";
import {
  AutoMovieComposition,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieFormationLayout,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanFormation,
  IAutoMovieSchedule,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** Seconds between measured instants: one frame of 24 fps film. */
const FRAME: number = 1 / 24;

/** Authored scene margin between the two mounted pairs, metres. */
const MOUNT_MARGIN: number = 1;

/** Authored scene margin around the dais, metres. */
const DAIS_MARGIN: number = 0.75;

/** Authored scene margin the marshal keeps from a horse, metres. */
const MARSHAL_MARGIN: number = 1.5;

/**
 * Half of Fruin's 0.61 m body-ellipse breadth (Fruin 1971, Pedestrian Planning
 * and Design): a disc of this radius holds a standing walker.
 */
const MARSHAL_RADIUS: number = 0.305;

/** The horses' names in entrance order: the lead's, then the follower's. */
const ROSTER: readonly string[] = ["hazel", "indigo"];

/** Two pairs in single file, five metres from rank to rank. */
const FILE: IAutoMovieFormationLayout = {
  kind: "column",
  ranks: 2,
  files: 1,
  spacing: { lateral: 3, depth: 5 },
};

/** The dais the pairs separate around: a three-metre square centred at (0, 25). */
const DAIS: AutoMovieArchetypePassage.IObstacle = {
  id: "dais",
  footprint: {
    outline: [
      point(-1.5, 23.5),
      point(1.5, 23.5),
      point(1.5, 26.5),
      point(-1.5, 26.5),
    ],
    radius: 0,
  },
  margin: DAIS_MARGIN,
};

/**
 * How a variant stages the passage.
 *
 * The lead pair takes the lanes at negative x, the following pair the mirror
 * lanes.
 */
interface IStaging {
  /** Half the centre spacing of the paired passage, metres. */
  lane: number;

  /** Half the centre spacing of the separation around the dais, metres. */
  split: number;

  /** The film second the following pair halts on its exhibition mark. */
  arrival: number;

  /** Whether the following pair stays on its exhibition mark to the end. */
  held: boolean;
}

/** One mounted pair: the horse, its rider and the planned course. */
interface IPair {
  /** The horse's name. */
  horse: string;

  /** The assigned rider's name. */
  rider: string;

  /** The horse's footprint, from its rest geometry with its tack. */
  footprint: AutoMovieArchetypePassage.IFootprint;

  /** The course its root follows. */
  plan: AutoMovieArchetypeCourse.IPlan;

  /** The authored second and mark of each addressed stage cue. */
  stages: readonly IStage[];
}

/** One addressed stage of a pair's route. */
interface IStage {
  /** The cue's event name. */
  name: string;

  /** The route sample the stage is delivered at. */
  sample: AutoMovieArchetypeCourse.ISample;
}

/**
 * Stage two mounted pairs through a ceremonial passage and admit its
 * clearances.
 *
 * Two pairs of different sizes, a horse and a Connemara pony, enter in single
 * file from a formation's path, turn into a paired passage, halt for an
 * exhibition beat, separate around a dais, re-form in single file from a second
 * formation's path and exit. A marshal crosses on foot after they pass. Each
 * rider's stage cue is addressed by its formation slot.
 *
 * Scenarios:
 *
 * 1. Each seed rebuilds the same horse and footprint, another seed varies it, and
 *    the footprint holds the saddle, stirrups and lead rope.
 * 2. The nearest-slot assignment at the entrance and the order of march at the
 *    re-form keep each pair's slot.
 * 3. A synchronized halt, a staggered halt through the same marks and a following
 *    pair held on its mark keep every authored margin.
 * 4. Each addressed cue reaches its rider at the authored second, with the pair's
 *    horse on its mark and halted only once it has arrived.
 * 5. During the halt the measured clearance is the gap between the two rest boxes.
 * 6. Lanes too close for the pair margin, and a separation too close to the dais,
 *    name the bodies and the interval, and the admission refuses on the
 *    later-listed route.
 * 7. Forward, reversed and repeated reads of the plans and the measurement agree.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the staged passage, the variants and the seven scenarios with their expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Plans real formation path samples and authored marks through `AutoMovieArchetypeCourse.timed`, measures them with `AutoMovieArchetypePassage.conflicts` and `admit` on footprints of real horse and pony models, and resolves addressed cues through the public schedule.
 * @evidence contracts/development/testing.md#independent-expectations Entrance and re-form ranks are five metres apart by the layout. During the halt both pairs stand still facing +Z side by side, so their clearance is the lane spacing less the facing sides of the two rest boxes. The tight variants put the lanes inside the authored margin, so the conflict must span the halt and lie between the marks that bound the lane; the dais conflict must span the seconds the lane runs beside the dais. Halts are zero speed by the authored repeated marks. Cue seconds are the authored stage seconds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers admitted synchronized, staggered and held variants, a pair conflict and two obstacle conflicts, a halted versus still-moving partner at the same second, and same versus different seeds. The horses' animated limbs, rider support and gait clocks are #3905's and the equine campaign's.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec over portable plans, models and schedules, without a renderer or browser.
 */
export function test_world_mounted_passage(): void {
  // 1. Seeded members, their footprints and the tack inside them.
  const hazel: AutoMovieArchetype = createHorse({}, 1002);
  const indigo: AutoMovieArchetype = createPony({ breed: "connemara" }, 1006);
  TestValidator.equals(
    "a seed rebuilds the same horse",
    JSON.stringify(createHorse({}, 1002)),
    JSON.stringify(hazel),
  );
  TestValidator.predicate(
    "another seed varies the horse's footprint",
    JSON.stringify(
      AutoMovieArchetypePassage.footprint(createHorse({}, 1032)),
    ) !== JSON.stringify(AutoMovieArchetypePassage.footprint(hazel)),
  );
  const footprints: readonly AutoMovieArchetypePassage.IFootprint[] = [
    AutoMovieArchetypePassage.footprint(hazel),
    AutoMovieArchetypePassage.footprint(indigo),
  ];
  for (const [index, model] of [hazel, indigo].entries())
    for (const tack of ["seat", "leftStirrup", "rightStirrup", "lead"])
      TestValidator.predicate(
        `${model.id}'s footprint holds its ${tack}`,
        holds(footprints[index]!, model.affordance(tack).frame.translation),
      );

  // 2. Formation identity from the entrance to the re-form.
  const entry: IAutoMovieMotionHumanFormation =
    AutoMovieMotionHumanEnsemble.HumanFormation.of({
      blocks: [{ layout: FILE, count: 2 }],
      frame: course([sample(0, 0, 0), sample(4, 0, 6)]),
    });
  const reform: IAutoMovieMotionHumanFormation =
    AutoMovieMotionHumanEnsemble.HumanFormation.of({
      blocks: [{ layout: FILE, count: 2 }],
      frame: course([sample(23, 0, 35), sample(27, 0, 45)]),
    });
  const entered: number[] = AutoMovieMotionHumanEnsemble.HumanFormation.prepare(
    entry,
  ).assign([point(0.2, 0.3), point(-0.1, -4.8)], "nearest", 0);
  const reformed: number[] =
    AutoMovieMotionHumanEnsemble.HumanFormation.prepare(reform).assign(
      [point(-4.5, 30), point(4.5, 30)],
      "order",
      23,
    );
  TestValidator.equals("the pairs enter as lead and follower", entered, [0, 1]);
  TestValidator.equals(
    "the pairs re-form in their entrance slots",
    reformed,
    entered,
  );
  TestValidator.predicate(
    "entrance and re-form ranks stand five metres apart, the lead ahead",
    vclose(
      AutoMovieMotionHumanEnsemble.HumanFormation.prepare(entry).slot(1, 0).at,
      point(0, -5),
      1e-12,
    ) &&
      vclose(
        AutoMovieMotionHumanEnsemble.HumanFormation.prepare(reform).slot(1, 23)
          .at,
        point(0, 30),
        1e-12,
      ),
  );

  // 3. The admitted variants.
  const stage: (staging: IStaging) => IPair[] = (staging: IStaging): IPair[] =>
    [hazel, indigo].map(
      (_: AutoMovieArchetype, slot: number): IPair =>
        pair(ROSTER[slot]!, footprints[slot]!, slot, staging, entry, reform),
    );
  const synchronized: IPair[] = stage({
    lane: 2,
    split: 4.5,
    arrival: 9.5,
    held: false,
  });
  const staggered: IPair[] = stage({
    lane: 2,
    split: 4.5,
    arrival: 10.5,
    held: false,
  });
  const held: IPair[] = stage({
    lane: 2,
    split: 4.5,
    arrival: 9.5,
    held: true,
  });
  for (const [label, pairs] of [
    ["synchronized", synchronized],
    ["staggered", staggered],
    ["held", held],
  ] as const)
    TestValidator.equals(
      `the ${label} passage keeps every margin`,
      AutoMovieArchetypePassage.conflicts("passage", passage(pairs)),
      [],
    );
  TestValidator.predicate(
    "the held pair stays on its mark while the lead exits",
    [12, 20, 27].every(
      (seconds: number): boolean =>
        vclose(
          held[1]!.plan.at(seconds).placement.translation,
          point(2, 15),
          1e-12,
        ) && held[1]!.plan.at(seconds).speed === 0,
    ) && vclose(held[0]!.plan.at(27).placement.translation, point(0, 45), 1e-9),
  );

  // 4. Addressed cues and the progress each one meets.
  for (const [label, pairs] of [
    ["synchronized", synchronized],
    ["staggered", staggered],
  ] as const) {
    const schedule: IAutoMovieSchedule = cue(pairs);
    for (const member of pairs)
      for (const addressed of member.stages) {
        const delivered: IAutoMovieScheduleEntry[] = schedule.entries.filter(
          (candidate: IAutoMovieScheduleEntry): boolean =>
            candidate.intent.subject === member.rider &&
            candidate.intent.capability === addressed.name,
        );
        const start: number = delivered[0]?.start ?? NaN;
        const state: AutoMovieArchetypeCourse.IState = member.plan.at(start);
        TestValidator.predicate(
          `${label} ${addressed.name} reaches ${member.rider} on its mark`,
          delivered.length === 1 &&
            start === addressed.sample.seconds &&
            vclose(
              state.placement.translation,
              point(addressed.sample.x, addressed.sample.z),
              1e-9,
            ) &&
            (addressed.name !== "halt" || state.speed === 0),
        );
      }
  }
  TestValidator.predicate(
    "a staggered follower is still moving when the lead halts",
    staggered[0]!.plan.at(9.5).speed === 0 &&
      staggered[1]!.plan.at(9.5).speed > 0,
  );
  TestValidator.predicate(
    "a synchronized pair halts together",
    synchronized.every(
      (member: IPair): boolean => member.plan.at(9.5).speed === 0,
    ),
  );

  // 5. The halt's clearance is the gap between the rest boxes.
  const facing: number =
    x(footprints[1]!, Math.min) - x(footprints[0]!, Math.max);
  const halt: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("halt", {
      participants: passage(synchronized)
        .participants.slice(0, 2)
        .map(
          (
            participant: AutoMovieArchetypePassage.IParticipant,
          ): AutoMovieArchetypePassage.IParticipant => ({
            ...participant,
            margin: 100,
          }),
        ),
      from: 9.5,
      to: 11,
      step: FRAME,
    });
  TestValidator.predicate(
    "the halted pairs stand their lane spacing less their facing sides apart",
    halt.length === 1 &&
      halt[0]!.from === 9.5 &&
      halt[0]!.to === 11 &&
      nclose(halt[0]!.clearance, 4 + facing, 1e-9),
  );

  // 6. Tight lanes and a tight separation.
  const tight: IPair[] = stage({
    lane: 0.75,
    split: 4.5,
    arrival: 9.5,
    held: false,
  });
  const close: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts("passage", passage(tight));
  TestValidator.equals(
    "tight lanes name the two pairs once",
    close.map(
      (found: AutoMovieArchetypePassage.IConflict): string =>
        `${found.subject}/${found.other}/${found.required}`,
    ),
    [`hazel/indigo/${MOUNT_MARGIN}`],
  );
  TestValidator.predicate(
    `tight lanes put the pairs inside their margin through the halt: ${JSON.stringify(close)}`,
    close[0]!.from > 4 &&
      close[0]!.from < 9.5 &&
      close[0]!.to > 11 &&
      close[0]!.to < 16 &&
      close[0]!.clearance <= 1.5 + facing + 1e-9 &&
      close[0]!.seconds >= close[0]!.from &&
      close[0]!.seconds <= close[0]!.to,
  );
  const crowded: AutoMovieArchetypePassage.IConflict[] =
    AutoMovieArchetypePassage.conflicts(
      "passage",
      passage(stage({ lane: 2, split: 2, arrival: 9.5, held: false })),
    );
  TestValidator.equals(
    "a separation too close to the dais names each pair beside it",
    crowded
      .map(
        (found: AutoMovieArchetypePassage.IConflict): string =>
          `${found.subject}/${found.other}/${found.required}`,
      )
      .sort((a: string, b: string): number => a.localeCompare(b)),
    [
      `hazel/dais/${Math.max(MOUNT_MARGIN, DAIS_MARGIN)}`,
      `indigo/dais/${Math.max(MOUNT_MARGIN, DAIS_MARGIN)}`,
    ],
  );
  TestValidator.predicate(
    `each pair is beside the dais while its lane runs past it: ${JSON.stringify(crowded)}`,
    crowded.every(
      (found: AutoMovieArchetypePassage.IConflict): boolean =>
        found.from > 14 && found.from < 16 && found.to > 18 && found.to < 20,
    ),
  );
  refused(
    "tight lanes refuse on the follower's route",
    tight,
    "participants[1].plan",
    close[0]!,
  );
  refused(
    "a crowded dais refuses on the earlier pair's own route",
    stage({ lane: 2, split: 2, arrival: 9.5, held: false }),
    `participants[${crowded[0]!.subject === "hazel" ? 0 : 1}].plan`,
    crowded[0]!,
  );

  const gaits: string[] = [];
  // 8. The real rides: each envelope holds its rest box and every posed limb, and the passage stays admitted with them.
  const ridden: IPair[] = synchronized.map(
    (member: IPair, slot: number): IPair => {
      const ride: AutoMovieArchetypeRide.IRide<string, string> = rideQuadruped(
        slot === 0 ? hazel : indigo,
        member.plan,
      );
      const landings: string = JSON.stringify(
        ride.instants.filter(
          (
            instant: AutoMovieArchetypeRide.IRide<
              string,
              string
            >["instants"][number],
          ): boolean => instant.label.endsWith("On"),
        ),
      );
      gaits.push(landings);
      return {
        ...member,
        footprint: AutoMovieArchetypePassage.envelope(ride, 0, 27, 4 * FRAME),
      };
    },
  );
  TestValidator.predicate(
    "each ride's envelope holds its rest box",
    ridden.every((member: IPair, slot: number): boolean =>
      [Math.min, Math.max].every(
        (pick: (...values: number[]) => number): boolean =>
          pick(x(member.footprint, pick), x(footprints[slot]!, pick)) ===
          x(member.footprint, pick),
      ),
    ),
  );
  TestValidator.equals(
    "the ridden passage keeps every margin",
    AutoMovieArchetypePassage.conflicts("passage", passage(ridden)),
    [],
  );
  TestValidator.predicate(
    "the two mounts land their hooves on their own phases",
    gaits.length === 2 && gaits[0] !== gaits[1] && gaits[0]!.length > 2,
  );
  // 7. Repeated, reversed and recomputed reads.
  const times: number[] = Array.from(
    { length: 27 * 24 + 1 },
    (_: unknown, k: number): number => k * FRAME,
  );
  for (const member of synchronized)
    TestValidator.equals(
      `${member.horse}'s plan reads the same backward`,
      [...times].reverse().map(member.plan.at),
      times.map(member.plan.at).reverse(),
    );
  TestValidator.equals(
    "the measurement repeats",
    AutoMovieArchetypePassage.conflicts("passage", passage(tight)),
    close,
  );
}

/** Admit a passage expected to refuse on one route with its earliest conflict. */
function refused(
  label: string,
  pairs: readonly IPair[],
  axis: string,
  expected: AutoMovieArchetypePassage.IConflict,
): void {
  let refusal: unknown;
  try {
    AutoMovieArchetypePassage.admit("passage", passage(pairs));
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    label,
    refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.axis === axis &&
      JSON.stringify(refusal.value) === JSON.stringify(expected),
  );
}

/**
 * One pair's route: the entrance formation's path, the authored passage marks,
 * then the re-form formation's path unless held.
 */
function pair(
  horse: string,
  footprint: AutoMovieArchetypePassage.IFootprint,
  slot: number,
  staging: IStaging,
  entry: IAutoMovieMotionHumanFormation,
  reform: IAutoMovieMotionHumanFormation,
): IPair {
  const side: number = slot === 0 ? -1 : 1;
  const lane: number = side * staging.lane;
  const split: number = side * staging.split;
  const entrance: AutoMovieArchetypeCourse.ISample[] =
    AutoMovieMotionHumanEnsemble.HumanFormation.prepare(entry).path(
      slot,
      0,
      4,
      2,
    );
  const marks: AutoMovieArchetypeCourse.ISample[] =
    slot === 0
      ? [
          sample(6, lane, 10),
          sample(8, lane, 13),
          sample(9.5, lane, 15),
          sample(11, lane, 15),
        ]
      : [
          sample(6, lane, 7),
          sample(8, lane, 12.5),
          sample(staging.arrival, lane, 15),
          sample(staging.held ? 27 : 11, lane, 15),
        ];
  const separation: AutoMovieArchetypeCourse.ISample[] =
    staging.held && slot === 1
      ? []
      : [
          sample(12.5, lane, 17),
          sample(14, lane, 19),
          sample(16, split, 23),
          sample(18, split, 27),
          sample(20, split, 30),
          ...AutoMovieMotionHumanEnsemble.HumanFormation.prepare(reform).path(
            slot,
            23,
            27,
            2,
          ),
        ];
  const samples: AutoMovieArchetypeCourse.ISample[] = [
    ...entrance,
    ...marks,
    ...separation,
  ];
  const stages: IStage[] = [
    { name: "entrance", sample: entrance[0]! },
    { name: "turn", sample: marks[0]! },
    { name: "halt", sample: marks[2]! },
    ...(separation.length === 0
      ? []
      : [
          { name: "reform", sample: separation[5]! },
          { name: "exit", sample: separation[7]! },
        ]),
  ];
  return {
    horse,
    rider: `${horse}-rider`,
    footprint,
    plan: AutoMovieArchetypeCourse.timed(horse, samples),
    stages,
  };
}

/** The passage of the pairs, the dais and the marshal who crosses behind them. */
function passage(pairs: readonly IPair[]): AutoMovieArchetypePassage.IProps {
  return {
    participants: [
      ...pairs.map(
        (member: IPair): AutoMovieArchetypePassage.IParticipant => ({
          id: member.horse,
          plan: member.plan,
          footprint: member.footprint,
          margin: MOUNT_MARGIN,
        }),
      ),
      {
        id: "marshal",
        plan: AutoMovieArchetypeCourse.timed("marshal", [
          sample(0, -8, 19),
          sample(17, -8, 19),
          sample(19.5, -4, 19),
          sample(22, 0, 19),
          sample(24.5, 4, 19),
          sample(27, 8, 19),
        ]),
        footprint: { outline: [point(0, 0)], radius: MARSHAL_RADIUS },
        margin: MARSHAL_MARGIN,
      },
    ],
    obstacles: [DAIS],
    step: FRAME,
  };
}

/**
 * Resolve each rider's stage cues, addressed by its slot among the riders cued
 * at that stage.
 */
function cue(pairs: readonly IPair[]): IAutoMovieSchedule {
  const track: IAutoMovieScheduleCue[] = [];
  const parts: IAutoMovieComposition[] = [];
  for (const name of ["entrance", "turn", "halt", "reform", "exit"]) {
    const cued: IPair[] = pairs.filter((member: IPair): boolean =>
      member.stages.some((stage: IStage): boolean => stage.name === name),
    );
    cued.forEach((member: IPair, index: number): void => {
      const stage: IStage = member.stages.find(
        (candidate: IStage): boolean => candidate.name === name,
      )!;
      track.push({ name, seconds: stage.sample.seconds });
      parts.push(
        AutoMovieComposition.at(
          "ring",
          { subject: member.rider, capability: name },
          0,
          { event: name, index },
        ),
      );
    });
  }
  return resolveAutoMovieSchedule(AutoMovieComposition.parallel(...parts), {
    cues: { ring: track },
    timing: (): IAutoMovieIntentTiming => ({ duration: 0.25 }),
  });
}

/** A formation course frame through samples. */
function course(
  samples: readonly AutoMovieArchetypeCourse.ISample[],
): IAutoMovieMotionHumanFormation.Frame {
  return {
    kind: "course",
    samples: samples.map(
      (
        at: AutoMovieArchetypeCourse.ISample,
      ): IAutoMovieMotionHumanFormation.ISample => ({
        seconds: at.seconds,
        x: at.x,
        y: 0,
        z: at.z,
      }),
    ),
  };
}

/** Whether a footprint's rectangle holds a model-frame point on the floor. */
function holds(
  footprint: AutoMovieArchetypePassage.IFootprint,
  at: IAutoMovieVector3,
): boolean {
  return (
    at.x >= x(footprint, Math.min) &&
    at.x <= x(footprint, Math.max) &&
    at.z >=
      Math.min(
        ...footprint.outline.map((p: IAutoMovieVector3): number => p.z),
      ) &&
    at.z <=
      Math.max(...footprint.outline.map((p: IAutoMovieVector3): number => p.z))
  );
}

/** A footprint's least or greatest x, metres. */
function x(
  footprint: AutoMovieArchetypePassage.IFootprint,
  pick: (...values: number[]) => number,
): number {
  return pick(...footprint.outline.map((p: IAutoMovieVector3): number => p.x));
}

/** A route sample on the floor at a film second. */
function sample(
  seconds: number,
  x: number,
  z: number,
): AutoMovieArchetypeCourse.ISample {
  return { seconds, x, y: 0, z };
}

/** A floor point in world metres. */
function point(x: number, z: number): IAutoMovieVector3 {
  return { x, y: 0, z };
}

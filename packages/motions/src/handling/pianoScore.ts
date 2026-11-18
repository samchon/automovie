import {
  AffordanceArticulation,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { typeText } from "../everyday/typeText";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { fitPianoScoreContact } from "./fitPianoScoreContact";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateReach } from "./manipulateReach";
import { manipulateShape } from "./manipulateShape";

/** A note with its arm placement and fixed key endpoints resolved. */
interface INote {
  /** The authored contact and its phase boundaries. */
  score: IAutoMovieMotionHumanPianoScore.INote;
  /** The moved button's unpressed and depressed contact points. */
  points: readonly [IAutoMovieVector3, IAutoMovieVector3];
  /** The outward key normal in world coordinates. */
  normal: IAutoMovieVector3;
  /** The model's full key dip, metres. */
  dip: number;
  /** The shared manipulation planner's wrist goal at the full press. */
  arm: IAutoMovieHumanLimbGoal;
  /** The manipulation shape for the selected digit. */
  shape: IAutoMovieMotionHumanPosture["joints"];
  /** The actual contact shape with the key at rest at the attack and release. */
  ends: [
    IAutoMovieMotionHumanPosture["joints"],
    IAutoMovieMotionHumanPosture["joints"],
  ];
  /** The full canonical digit name for the posture's fingertip goal. */
  digit: AutoMovieHumanDigit;
}

/** One hand's position on its note and the preceding transport. */
interface ISample {
  note: INote;
  previous: INote | undefined;
  transport: number;
}

/** The default entry transition in HumanPerformancePlace, seconds. */
const READY: number = 0.25;

/**
 * Play named keys on a fixed upright piano from a seated base. The authored
 * score fixes each digit, hand, depression and release. The moving key and
 * its fingertip share the same travel fraction, so a note can be held
 * while the other hand plays. See Zhu et al. (2013), A system for automatic
 * animation of piano performances, doi:10.1002/cav.1477, for the distinction
 * between key timing and fingering. This law takes fingering explicitly and
 * admits one key per hand at a time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the placement, score fields, admission and synchronized outcomes.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the keyed manipulation wrist fit and the button's model frame and range. The finger and button use the same minimum-jerk fraction of the measured dip.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the score, resolve notes independently, then publish the two hand paths and key drives.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual prop articulation geometry and caller-specified fingering and timing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Plan the two wrists and resting digits at the authored contact boundaries. A posture reads the current or upcoming note from each hand's ordered timeline.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each note retains its fixed wrist, key endpoints and resting fingering for all posture samples.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only resolved notes, entry supports and base posture.
 */
export const pianoScore: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPianoScore> =
  {
    name: "pianoScore",
    interrupts: {},
    plan,
  };

/** Resolve the score over the seated entry's existing supports. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoScore>,
): IAutoMovieMotionHumanActionPlan {
  const { entry, params } = context;
  if (entry.base.kind !== "seated" || context.carrier !== undefined)
    refuse("base", entry.base.kind, "enter this score seated at the keyboard");
  const piano: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  if (
    piano.prop.fixed !== true ||
    piano.prop.motion !== undefined ||
    piano.prop.articulate === undefined
  )
    refuse(
      "prop",
      params.prop,
      "place the upright piano as a fixed articulated prop",
    );
  if (params.notes.length === 0)
    refuse("notes", 0, "provide at least one scored key");
  if (params.notes[0]!.from < READY)
    refuse(
      "notes.from",
      params.notes[0]!.from,
      "allow 0.25 s for the seated entry to settle before the first key contact",
    );

  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  const byHand: Record<AutoMovieHumanSide, INote[]> = { left: [], right: [] };
  const byKey: Map<string, number> = new Map();
  const sites: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
    piano.prop.affordances?.map(
      (site: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [
        site.id,
        site,
      ],
    ),
  );
  const state: Readonly<Record<string, number>> =
    piano.state?.(context.start) ?? {};
  const frame: IAutoMovieRigidTransform = piano.frame(context.start);
  const bends: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: AutoMovieMotionHumanBend.hang(
      context.body,
      entry.posture,
      "left",
      0.1,
    ),
    right: AutoMovieMotionHumanBend.hang(
      context.body,
      entry.posture,
      "right",
      0.1,
    ),
  };
  const notes: INote[] = [];
  const entryShape: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of entry.pose.joints)
    entryShape[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  let duration: number = 0;
  for (const score of params.notes) {
    if (score.side !== "left" && score.side !== "right")
      refuse("notes.side", score.side, "name the left or right hand");
    if (
      !(["thumb", "index", "middle", "ring", "little"] as const).includes(
        score.digit,
      )
    )
      refuse("notes.digit", score.digit, "name one of the hand's five digits");
    const previous: INote | undefined = notes.at(-1);
    if (
      ![score.from, score.at, score.release, score.to].every(Number.isFinite) ||
      !(
        0 < score.from &&
        score.from < score.at &&
        score.at <= score.release &&
        score.release < score.to
      ) ||
      (previous !== undefined && previous.score.from > score.from)
    )
      refuse(
        "notes",
        score.key,
        "use finite 0 < from < at <= release < to times, in attack order",
      );
    if ((byHand[score.side].at(-1)?.score.to ?? 0) >= score.from)
      refuse(
        "notes.side",
        score.side,
        "leave time for the hand to travel between its notes",
      );
    if ((byKey.get(score.key) ?? 0) > score.from)
      refuse(
        "notes.key",
        score.key,
        "use different keys for overlapping notes",
      );

    const key: IAutoMovieAffordance | undefined = sites.get(score.key);
    if (
      !/^key(?:[1-9]|[1-7][0-9]|8[0-8])$/.test(score.key) ||
      key?.kind !== "button" ||
      key.travel === undefined ||
      !Number.isFinite(key.travel) ||
      key.travel <= 0 ||
      key.rides !== undefined ||
      key.follows !== undefined ||
      AffordanceArticulation.travel(sites, state, score.key) !== 0
    )
      refuse(
        "notes.key",
        score.key,
        "name an upright piano button that starts at rest",
      );
    const note: INote = resolveNote(
      context,
      frame,
      key,
      score,
      bends[score.side],
    );
    notes.push(note);
    byHand[score.side].push(note);
    byKey.set(score.key, score.to);
    duration = Math.max(duration, score.to);
  }

  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  const bones: ReturnType<typeof poseBones> = poseBones(
    context.body,
    entry.pose,
  );
  const hands: AutoMovieHumanSide[] = sides.filter(
    (side): boolean => byHand[side].length !== 0,
  );
  const sample = (side: AutoMovieHumanSide, seconds: number): ISample =>
    readHand(byHand[side], seconds);
  const arm = (
    side: AutoMovieHumanSide,
    hand: ISample,
  ): IAutoMovieHumanLimbGoal =>
    movingArm(
      hand,
      bones.get(`${side}Hand`)!,
      bones.get(`${side}LowerArm`)!.worldPosition,
    );
  // Simultaneous boundaries share a single arm fit, with the same pair of
  // goals as the displayed pose. Transport uses these actual contact angles.
  const boundaries = new Map<number, Array<{ note: INote; end: 0 | 1 }>>();
  for (const note of notes)
    for (const [seconds, end] of [
      [note.score.from, 0],
      [note.score.to, 1],
    ] as const) {
      const at = boundaries.get(seconds) ?? [];
      at.push({ note, end });
      boundaries.set(seconds, at);
    }
  for (const [seconds, contacts] of boundaries) {
    const arms: IAutoMovieMotionHumanPosture["limbs"] = {
      leftArm: entry.posture.limbs.leftArm,
      rightArm: entry.posture.limbs.rightArm,
    };
    for (const side of hands)
      arms[`${side}Arm`] = arm(side, sample(side, seconds));
    const pose: IAutoMoviePose = resolveHumanPosture.refit(
      context.body,
      entry.pose,
      arms,
    ).pose;
    for (const { note, end } of contacts)
      note.ends[end] = fitPianoScoreContact(
        context.body,
        pose,
        note.shape,
        note.digit,
        goal(note.points[0], note.normal),
      );
  }
  return {
    ...base,
    events: notes
      .flatMap(({ score }: INote, i: number): IAutoMovieMotionEvent[] => [
        { name: `keyDown${i + 1}`, share: score.at / duration },
        { name: `keyUp${i + 1}`, share: score.to / duration },
      ])
      .sort(
        (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
          a.share - b.share,
      ),
    drives: notes.map(
      ({ score, dip }: INote): IAutoMovieMotionPropDrive => ({
        prop: params.prop,
        articulation: score.key,
        from: score.from / duration,
        to: score.to / duration,
        travel: (seconds: number): number => dip * depression(score, seconds),
      }),
    ),
    hands,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const held: IAutoMovieMotionHumanPosture = base.posture(seconds);
      const posture: IAutoMovieMotionHumanPosture = {
        ...held,
        limbs: { ...held.limbs },
        joints: { ...held.joints },
        digits: { ...held.digits },
      };
      if (seconds > 0)
        for (const side of hands) {
          const hand: ISample = sample(side, seconds);
          posture.limbs[`${side}Arm`] = arm(side, hand);
          sampleFingers(posture, hand, entryShape, seconds);
        }
      return posture;
    },
  };
}

/** Place the wrist with the same fit used by the keyed contact planner. */
function resolveNote(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPianoScore>,
  frame: IAutoMovieRigidTransform,
  key: IAutoMovieAffordance,
  score: IAutoMovieMotionHumanPianoScore.INote,
  bend: IAutoMovieVector3,
): INote {
  const dip: number = key.travel!;
  const site: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, key.frame.translation),
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, key.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const rotation: IAutoMovieQuaternion = manipulateFacing(
    context.entry.posture,
    [{ site, normal, side: score.side }],
    score.side,
  );
  const arm: IAutoMovieHumanLimbGoal = {
    point: manipulateReach(
      context.body,
      score.side,
      score.digit,
      site,
      normal,
      dip,
      rotation,
    ),
    bend,
    rotation,
  };
  const shape: IAutoMovieMotionHumanPosture["joints"] = manipulateShape(
    score.side,
    score.digit,
  );
  const digit: AutoMovieHumanDigit =
    `${score.side}${score.digit[0]!.toUpperCase()}${score.digit.slice(1)}` as AutoMovieHumanDigit;
  return {
    score,
    points: [site, Vector3.subtract(site, Vector3.scale(normal, dip))],
    normal,
    dip,
    arm,
    shape,
    ends: [{}, {}],
    digit,
  };
}

/** Minimum-jerk progress from the undepressed surface to the key's stop. */
function depression(
  score: IAutoMovieMotionHumanPianoScore.INote,
  seconds: number,
): number {
  if (seconds <= score.from || seconds >= score.to) return 0;
  if (seconds < score.at)
    return minimumJerk((seconds - score.from) / (score.at - score.from)).s;
  if (seconds <= score.release) return 1;
  return (
    1 - minimumJerk((seconds - score.release) / (score.to - score.release)).s
  );
}

/** Find the current note or the destination of the hand's transport. */
function readHand(timeline: readonly INote[], seconds: number): ISample {
  let first: number = 0;
  let last: number = timeline.length - 1;
  while (first < last) {
    const middle: number = Math.floor((first + last) / 2);
    if (seconds <= timeline[middle]!.score.to) last = middle;
    else first = middle + 1;
  }
  const note: INote = timeline[first]!;
  const previous: INote | undefined = timeline[first - 1];
  const start: number = previous?.score.to ?? 0;
  const transport: number = minimumJerk(
    Math.max(0, Math.min(1, (seconds - start) / (note.score.from - start))),
  ).s;
  return { note, previous, transport };
}

/** Read the wrist and elbow goals shared by planning and playback. */
function movingArm(
  { note, previous, transport }: ISample,
  entry: IAutoMovieResolvedBone,
  elbow: IAutoMovieVector3,
): IAutoMovieHumanLimbGoal {
  if (transport === 1) return note.arm;
  const point: IAutoMovieVector3 = Vector3.lerp(
    previous?.arm.point ?? entry.worldPosition,
    note.arm.point,
    transport,
  );
  return {
    ...note.arm,
    point: Vector3.add(
      point,
      Vector3.scale(
        note.normal,
        typeText.HOVER * Math.sin(Math.PI * transport),
      ),
    ),
    bend: Vector3.lerp(previous?.arm.bend ?? elbow, note.arm.bend, transport),
    rotation: Quaternion.slerp(
      previous?.arm.rotation ?? entry.worldRotation,
      note.arm.rotation!,
      transport,
    ),
  };
}

/** Place one hand's digits while preserving the other hand's goals. */
function sampleFingers(
  posture: IAutoMovieMotionHumanPosture,
  { note, previous, transport }: ISample,
  entryShape: IAutoMovieMotionHumanPosture["joints"],
  seconds: number,
): void {
  const digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> =
    posture.digits!;
  for (const digit of Object.keys(digits) as AutoMovieHumanDigit[])
    if (digit.startsWith(note.score.side)) delete digits[digit];
  if (seconds < note.score.from) {
    // The released fingering travels with the wrist into the next note's
    // first contact. Both transport ends use their fitted contact angles.
    for (const bone of Object.keys(note.ends[0]) as AutoMovieHumanoidBone[]) {
      const from = (previous?.ends[1] ?? entryShape)[bone]!;
      const to = note.ends[0][bone]!;
      posture.joints[bone] = [
        from[0] + (to[0] - from[0]) * transport,
        from[1] + (to[1] - from[1]) * transport,
        from[2] + (to[2] - from[2]) * transport,
      ];
    }
  } else {
    Object.assign(posture.joints, note.shape);
    digits[note.digit] = goal(
      Vector3.lerp(
        note.points[0],
        note.points[1],
        depression(note.score, seconds),
      ),
      note.normal,
    );
  }
}

/** The moving button's top meets the active fingertip. */
function goal(
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IAutoMovieHumanDigitGoal {
  return { point, normal, surface: "tip" };
}

/** Report the score field and its corrected authoring direction. */
function refuse(axis: string, value: string | number, fix: string): never {
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: "the input cannot be placed as a seated piano score",
    fix,
  });
}

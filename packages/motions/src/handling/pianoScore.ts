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
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMoviePose,
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
import { pianoScoreEvents } from "./pianoScoreEvents";
import { pianoScoreHand } from "./pianoScoreHand";
import { resolvePianoScoreVoicing } from "./resolvePianoScoreVoicing";

/** A hand placement shared by every key in a voicing. */
type IVoicing = resolvePianoScoreVoicing.Voicing;

/** The default entry transition in HumanPerformancePlace, seconds. */
const READY: number = 0.25;

/**
 * Play named keys on a fixed upright piano from a seated base. The authored
 * score fixes each digit, hand, depression and release. The moving key and its
 * fingertip share the same travel fraction, so a note can be held while the
 * other hand plays. Co-timed keys on a hand form one voicing on a shared wrist,
 * with each fingertip fitted to its own key. The law refuses a voicing that
 * misses any fitted boundary by more than 5 mm, a provisional contact margin
 * for the polygon rig. Zhu et al. describe a shared wrist and per-finger
 * inverse kinematics (doi:10.1002/cav.1477). Huang et al. distinguish note and
 * chord timing in MOSA (doi:10.1109/TASLP.2024.3407529).
 */
export const pianoScore: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPianoScore> =
  {
    name: "pianoScore",
    interrupts: {},
    plan,
  };
/** The record of `IPlanContactsItem`'s site. */
type IPlanContactsItem = { voicing: IVoicing; end?: ContactsEndItem };

/** The alternatives of `ContactsEndItem`'s site. */
type ContactsEndItem = 0 | 1;

/** The record of `IPlanCheckedItem`'s site. */
type IPlanCheckedItem = { seconds: number; end?: CheckedEndItem };

/** The alternatives of `CheckedEndItem`'s site. */
type CheckedEndItem = 0 | 1;

/** The record of `IBoundariesItemEntry`'s site. */
type IBoundariesItemEntry = { voicing: IVoicing; end?: EndItemEntry };

/** The alternatives of `EndItemEntry`'s site. */
type EndItemEntry = 0 | 1;

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
  const groups: Record<AutoMovieHumanSide, resolvePianoScoreVoicing.Key[][]> = {
    left: [],
    right: [],
  };
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
  const notes: resolvePianoScoreVoicing.Key[] = [];
  const entryShape: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of entry.pose.joints)
    entryShape[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  let duration: number = 0;
  for (const score of params.notes) {
    if (score.hand !== "left" && score.hand !== "right")
      refuse("notes.side", score.hand, "name the left or right hand");
    if (
      !(["thumb", "index", "middle", "ring", "little"] as const).includes(
        score.digit,
      )
    )
      refuse("notes.digit", score.digit, "name one of the hand's five digits");
    const previous: resolvePianoScoreVoicing.Key | undefined = notes.at(-1);
    if (
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
    const group: resolvePianoScoreVoicing.Key[] | undefined =
      groups[score.hand].at(-1);
    const prior: IAutoMovieMotionHumanPianoScore.INote | undefined =
      group?.[0]?.score;
    const simultaneous: boolean = prior?.from === score.from;
    if (prior !== undefined && prior.to >= score.from) {
      if (
        !simultaneous ||
        prior.at !== score.at ||
        prior.release !== score.release ||
        prior.to !== score.to
      )
        refuse(
          "notes.side",
          score.hand,
          "match all four chord times or leave time for the hand to travel",
        );
      if (
        group!.some(
          ({ score: member }): boolean => member.digit === score.digit,
        )
      )
        refuse(
          "notes.digit",
          score.digit,
          "assign a different digit to each key of the chord",
        );
    }
    if ((byKey.get(score.key) ?? 0) >= score.from)
      refuse(
        "notes.key",
        score.key,
        "use different keys for overlapping notes and leave time to transfer a key",
      );

    const key: IAutoMovieAffordance | undefined = sites.get(score.key);
    if (
      !/^key(?:[1-9]|[1-7][0-9]|8[0-8])$/.test(score.key) ||
      key?.kind !== "button" ||
      key.travel === undefined ||
      !(key.travel > 0) ||
      key.rides !== undefined ||
      key.follows !== undefined ||
      AffordanceArticulation.travel(sites, state, score.key) !== 0
    )
      refuse(
        "notes.key",
        score.key,
        "name an upright piano button that starts at rest",
      );
    const note: resolvePianoScoreVoicing.Key = { score, key };
    notes.push(note);
    if (simultaneous) group!.push(note);
    else groups[score.hand].push([note]);
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
  const byHand: Record<AutoMovieHumanSide, IVoicing[]> = {
    left: [],
    right: [],
  };
  for (const side of sides)
    byHand[side] = groups[side].map(
      (keys): IVoicing =>
        resolvePianoScoreVoicing(context, frame, keys, bends[side]),
    );
  const hands: AutoMovieHumanSide[] = sides.filter(
    (side): boolean => byHand[side].length !== 0,
  );
  // Reuse the final key return's duration for withdrawal, shortened by the
  // end of the score or a later strike on one of those keys.
  const returns: Partial<Record<AutoMovieHumanSide, number>> = {};
  for (const side of hands) {
    const last: IVoicing = byHand[side].at(-1)!;
    const { release, to } = last.score;
    let end: number = Math.min(duration, to + (to - release));
    for (const { score } of notes)
      if (
        score.from > to &&
        last.notes.some((note): boolean => note.score.key === score.key)
      )
        end = Math.min(end, score.from);
    returns[side] = end;
  }
  const sample = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): pianoScoreHand.ISample =>
    pianoScoreHand(byHand[side], returns[side]!, seconds);
  const arm = (
    side: AutoMovieHumanSide,
    hand: pianoScoreHand.ISample,
  ): IAutoMovieHumanLimbGoal =>
    movingArm(
      hand,
      bones.get(`${side}Hand`)!,
      bones.get(`${side}LowerArm`)!.worldPosition,
    );

  // Simultaneous boundaries share a single arm fit, with the same pair of
  // goals as the displayed pose. Transport uses these actual contact angles.
  const boundaries: Map<number, Array<IBoundariesItemEntry>> = new Map();
  for (const side of hands)
    for (const voicing of byHand[side]) {
      const { from, at, release, to } = voicing.score;
      const checked: Array<IPlanCheckedItem> = [
        { seconds: from, end: 0 },
        { seconds: to, end: 1 },
      ];
      if (voicing.notes.length > 1) {
        checked.push({ seconds: at });
        if (release !== at) checked.push({ seconds: release });
      }
      for (const { seconds, end } of checked) {
        const contacts: Array<IPlanContactsItem> =
          boundaries.get(seconds) ?? [];
        contacts.push(end === undefined ? { voicing } : { voicing, end });
        boundaries.set(seconds, contacts);
      }
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
    for (const { voicing, end } of contacts) {
      const joints: IAutoMovieMotionHumanPosture["joints"] =
        fitPianoScoreContact(context.body, pose, voicing, end === undefined);
      if (end !== undefined) voicing.ends[end] = joints;
    }
  }
  return {
    duration,
    contacts: base.contacts,
    events: pianoScoreEvents(
      notes.map(
        ({
          score,
        }: resolvePianoScoreVoicing.Key): IAutoMovieMotionHumanPianoScore.INote =>
          score,
      ),
      duration,
    ),
    drives: notes.map(
      ({
        score,
        key,
      }: resolvePianoScoreVoicing.Key): IAutoMovieMotionPropDrive => ({
        prop: params.prop,
        articulation: score.key,
        from: score.from / duration,
        to: score.to / duration,
        travel: (seconds: number): number =>
          key.travel! * depression(score, seconds),
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
          const hand: pianoScoreHand.ISample = sample(side, seconds);
          posture.limbs[`${side}Arm`] = arm(side, hand);
          sampleFingers(posture, hand, entryShape, seconds);
        }
      return posture;
    },
  };
}

/** Minimum-jerk progress from the undepressed surface to the key's stop. */
function depression(
  score: IAutoMovieMotionHumanPianoScore.INote,
  seconds: number,
): number {
  if (seconds <= score.from || seconds >= score.to) return 0;
  if (seconds >= score.at && seconds <= score.release) return 1;
  // The symmetric polynomial read keeps a nearly released key nonnegative.
  // Near full depression, floating-point evaluation can exceed one by an ulp.
  const share: number =
    seconds < score.at
      ? (seconds - score.from) / (score.at - score.from)
      : (score.to - seconds) / (score.to - score.release);
  return Math.min(1, minimumJerk.share(share));
}

/** Read the wrist and elbow goals shared by planning and playback. */
function movingArm(
  { note, previous, transport }: pianoScoreHand.ISample,
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
  { note, previous, transport }: pianoScoreHand.ISample,
  entryShape: IAutoMovieMotionHumanPosture["joints"],
  seconds: number,
): void {
  const digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> =
    posture.digits!;
  for (const digit of Object.keys(digits) as AutoMovieHumanDigit[])
    if (digit.startsWith(note.score.hand)) delete digits[digit];
  const retracting: boolean = seconds > note.score.to;
  if (retracting || seconds < note.score.from) {
    // Transport uses the fitted release and attack shapes. After the last
    // release the fitted fingers travel back toward the entry shape.
    for (const bone of Object.keys(note.ends[0]) as AutoMovieHumanoidBone[]) {
      const from = (previous?.ends[1] ?? entryShape)[bone]!;
      const to = note.ends[retracting ? 1 : 0][bone]!;
      posture.joints[bone] = [
        from[0] + (to[0] - from[0]) * transport,
        from[1] + (to[1] - from[1]) * transport,
        from[2] + (to[2] - from[2]) * transport,
      ];
    }
  } else {
    Object.assign(posture.joints, note.shape);
    const travel: number = depression(note.score, seconds);
    for (const contact of note.notes)
      digits[contact.digit] = goal(
        Vector3.lerp(contact.points[0], contact.points[1], travel),
        contact.normal,
      );
  }
}

/** The moving button's top meets the active fingertip. */
function goal(
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): IAutoMovieHumanDigitGoal {
  return { point, normal, surface: "tip", contact: true };
}
/** The alternatives of `RefuseValue`'s site. */
type RefuseValue = string | number;

/** Report the score field and its corrected authoring direction. */
function refuse(axis: string, value: RefuseValue, fix: string): never {
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: "the input cannot be placed as a seated piano score",
    fix,
  });
}

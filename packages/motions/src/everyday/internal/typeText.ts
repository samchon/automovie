import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTypeText,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionHumanArmChain } from "../../compose/internal/AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { typeTextPresses } from "./typeTextPresses";

/*
 * Typing a text on a keyboard from the posture the performer is in (seated at a
 * desk, or standing at a counter), pressing each key with an index fingertip.
 * The keyboard is the scene's prop: its `homeRow` contact places the keys, its
 * `keys` field must span the letter rows, and the typist faces it from its `+Z`
 * side (`AutoMovieArchetypeKeyboard.create`).
 *
 * Each key press is a goal: the index fingertip of the hand on that key's side
 * comes down onto the key's centre by the key's travel and lifts again, while
 * the other hand's fingertip hovers over its home key. Only the index
 * fingertips are contact surfaces of the body, so this is two-finger typing;
 * touch typing with every finger waits on fingertip surfaces for the other
 * fingers. The keys lie on the standard 19.05 mm pitch with the usual row
 * stagger (ISO/IEC 9995; rows offset by a quarter and three quarters of a key),
 * a QWERTY layout, the space bar two rows below the home row pressed by the
 * right hand where it lies under that hand's home key, the bar being wide
 * enough to strike anywhere; a key the layout lacks is refused.
 *
 * Time between presses comes from typing skill: skilled typists strike about
 * every 0.15 to 0.2 s and novices far slower (Salthouse 1986, Psychol Bull
 * 99:303). Everyday typists, two-finger and touch alike, type 34 to 79 words a
 * minute (Feit, Weir and Oulasvirta 2016, CHI '16, How We Type), five
 * characters a word, so the interval runs from 60 / (34 x 5) s, about 0.35 s,
 * for a novice to 60 / (79 x 5) s, about 0.15 s, for an elite on the `speed`
 * axis, with the cross-task timing variability of `HumanSkill.jitter`. Each
 * press takes the first 40 % of its interval to reach the key, moving from 15
 * mm above it, and the rest to lift; the key travels 4 mm (inside the 1.5 to 6
 * mm of ergonomic keyboard standards). The keyboard should sit near elbow
 * height with the elbows near 90 degrees (ANSI/HFES 100-2007): one whose home
 * row lies more than 0.15 m from the elbows' height, the shoulder joints' mean
 * height less the upper arm, or whose home keys lie beyond 0.95 of each arm's
 * reach from its shoulder is refused (both provisional). When the press after a
 * key on the same hand comes sooner than a whole interval, the reach and the
 * lift share that gap instead, so the fingertip moves on from the key it lifts
 * off. The body holds the posture it is entered in: each planted foot stays on
 * its floor and a seated body on its seat. No action cuts a typing. Events
 * `press1` to `pressN`, one per key.
 */
export namespace typeText {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "typeText";

  /*
   * Cancel table: none; a typing runs through its last press.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /*
   * The keyboard a prop declares, where it stands at the action's start: its
   * `homeRow` contact's place, and the heading that faces it from its `+Z`
   * side, where `AutoMovieArchetypeKeyboard.create` puts the typist.
   * Parameter context: The action's context.
   * Parameter subject: The keyboard's prop subject.
   * Returns: The home row's middle and the typist's heading.
   * When the prop declares no `homeRow` or `keys`, or
   * its key field is narrower than the letter rows.
   */
  export function board(
    context: Pick<IAutoMovieMotionHumanActionContext, BoardContext>,
    subject: string,
  ): IAutoMovieMotionHumanTypeText.IBoard {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const declared: (id: string) => IAutoMovieAffordance = (
      id: string,
    ): IAutoMovieAffordance => {
      const found: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
      if (found === undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "affordance",
          axis: "keyboard",
          value: subject,
          feasible: {
            kind: "alternatives",
            values: affordances.map((a: IAutoMovieAffordance): string => a.id),
          },
          reason: `${subject} declares no ${id}`,
          fix: `give the keyboard a ${id} contact, as AutoMovieArchetypeKeyboard.create does`,
        });
      return found;
    };
    const found: IAutoMovieAffordance = declared("homeRow");
    const keys: IAutoMovieAffordance = declared("keys");
    if (!((keys.width ?? 0) >= WIDTH))
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "keyboard",
        value: keys.width ?? null,
        feasible: { kind: "range", minimum: WIDTH, maximum: null, unit: "m" },
        reason: `${subject}'s key field is ${(keys.width ?? 0).toFixed(3)} m wide, narrower than the ${WIDTH.toFixed(3)} m its letter rows span`,
        fix: "type on a keyboard whose key field spans the letter rows",
      });
    const frame: IAutoMovieRigidTransform = read.frame(context.start);
    const away: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 0,
      z: -1,
    });
    return {
      at: AutoMovieEngineVector3.add(
        frame.position,
        AutoMovieEngineQuaternion.rotateVector(frame.rotation, found.frame.translation),
      ),
      yaw: (Math.atan2(away.x, away.z) * 180) / Math.PI,
    };
  }

  /*
   * Key pitch, metres (ISO/IEC 9995).
   */
  export const PITCH: number = 0.01905;

  /*
   * The width the letter rows span, metres: the top row's ten keys, staggered a
   * quarter key left of the home row's middle, kept symmetric about it.
   */
  export const WIDTH: number = 2 * 5.25 * 0.01905;

  /*
   * Key travel, metres (provisional).
   */
  export const TRAVEL: number = 0.004;

  /*
   * Hover height above a key between presses, metres (provisional).
   */
  export const HOVER: number = 0.015;

  /*
   * The QWERTY letter rows from the top, each with its stagger in keys.
   */
  export const ROWS: readonly IROWSItem[] = [
    { keys: "qwertyuiop", stagger: -0.25 },
    { keys: "asdfghjkl", stagger: 0 },
    { keys: "zxcvbnm", stagger: 0.5 },
  ];

  /*
   * A key's centre in the keyboard's frame, metres: `x` toward the user's left,
   * `z` away from the user, the home row's middle at the origin.
   * Parameter key: A letter or a space.
   * Returns: The centre and the hand that presses it.
   * When the layout has no such key.
   */
  export function key(key: string): IAutoMovieMotionHumanTypeText.IKeyResult {
    const k: string = key.toLowerCase();
    if (k === " ")
      return { at: { x: -1.5 * PITCH, y: 0, z: -2 * PITCH }, side: "right" };
    for (let row: number = 0; row < ROWS.length; row++) {
      const col: number = ROWS[row]!.keys.indexOf(k);
      if (col < 0) continue;

      // The home row's ten keys, `a` to `;`, centre between columns 4 and 5.
      const x: number = -((col + ROWS[row]!.stagger - 4.5) * PITCH);
      return {
        at: { x, y: 0, z: (1 - row) * PITCH },
        side: x > 0 ? "left" : "right",
      };
    }
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "text",
      value: key,
      reason: `The keyboard has no key "${key}"; it types letters and spaces`,
      fix: "type letters and spaces only",
    });
  }

  /*
   * Plan typing.
   * Parameter context: The action's context.
   * Returns: The plan.
   * On an unknown key, an empty text, or a keyboard too
   * high, low or far for the body.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTypeText.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const text: string = context.params.text;
    const keyboard: IAutoMovieMotionHumanTypeText.IBoard = board(
      context,
      context.params.keyboard,
    );
    if (text.length === 0)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "text",
        value: text,
        reason: "Typing needs a text",
        fix: "give a text of at least one letter",
      });
    const keys: IAutoMovieMotionHumanTypeText.IKeyResult[] = [...text].map(
      (letter: string): IAutoMovieMotionHumanTypeText.IKeyResult =>
        typeText.key(letter),
    );
    const hold: IAutoMovieMotionHumanPosture = context.entry.posture;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: keyboard.at,
      yaw: keyboard.yaw,
    };

    // Fit: the home row near elbow height and within the arms' reach of the
    // shoulders, both read on the entry pose's own shoulder joints.
    const joints: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose, undefined, HumanBoneGroups.SHOULDERS);
    const shoulders: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: joints.get("leftUpperArm")!.worldPosition,
      right: joints.get("rightUpperArm")!.worldPosition,
    };
    const elbow: number =
      (shoulders.left.y + shoulders.right.y) / 2 - m.upperArm;
    if (Math.abs(keyboard.at.y - elbow) > HEIGHT)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "keyboard",
        value: keyboard.at.y,
        feasible: {
          kind: "range",
          minimum: elbow - HEIGHT,
          maximum: elbow + HEIGHT,
          unit: "m",
        },
        reason: `the keyboard stands ${(keyboard.at.y - elbow).toFixed(3)} m from the elbows' height; place it within ${HEIGHT} m of ${elbow.toFixed(3)} m`,
        fix: `place the keyboard within ${HEIGHT} m of the elbows' height`,
      });
    if (
      (["left", "right"] as const).some(
        (side: AutoMovieHumanSide): boolean =>
          AutoMovieEngineVector3.distance(
            HumanFrame.point(
              frame,
              typeText.key(side === "left" ? "f" : "j").at,
            ),
            shoulders[side],
          ) >
          REACH * (m.upperArm + m.forearm + m.hand),
      )
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "keyboard",
        value: null,
        reason: `the keyboard is beyond the arms' reach`,
        fix: "place the keyboard nearer, or approach it first",
      });

    // Presses on the skill's interval with timing variability.
    const interval: number = HumanSkill.quantity(
      context.skill,
      "speed",
      60 / (WPM.slowest * CHARACTERS),
      60 / (WPM.fastest * CHARACTERS),
    );
    const times: number[] = [];
    let clock: number = LEAD;
    for (let i: number = 0; i < keys.length; i++) {
      times.push(clock);
      clock += HumanSkill.jitter(
        context.skill,
        context.random(`key${i}`),
        interval,
      );
    }
    const duration: number = clock;
    const home: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: typeText.key("f").at,
      right: typeText.key("j").at,
    };

    // Where each fingertip is at a second: on its current key, travelling
    // between keys in the hover plane, or pressing.
    const tipAt: (side: AutoMovieHumanSide, t: number) => IAutoMovieVector3 =
      typeTextPresses(keys, times, interval, home, frame, HOVER, TRAVEL);

    // Each forearm approaches its home key from its shoulder. Align the
    // fingers with that approach so the wrist stays behind the index tip.
    function handRotation(side: AutoMovieHumanSide): IAutoMovieQuaternion {
      const homePoint: IAutoMovieVector3 = HumanFrame.point(frame, home[side]);
      const approach: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        homePoint,
        shoulders[side],
      );
      const planar: IAutoMovieVector3 =
        approach.x === 0 && approach.z === 0
          ? HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: keyboard.yaw },
              { x: 0, y: 0, z: 1 },
            )
          : AutoMovieEngineVector3.normalize({ ...approach, y: 0 });
      const fingers: IAutoMovieVector3 = { ...planar, y: FINGER_SLOPE };
      return HumanHand.rotation(side, { fingers, palm: { x: 0, y: -1, z: 0 } });
    }
    const hands: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
      left: handRotation("left"),
      right: handRotation("right"),
    };
    const shaped: readonly [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][] = Object.entries({
      ...HumanHand.shape("left", "point"),
      ...HumanHand.shape("right", "point"),
    }) as [AutoMovieHumanoidBone, readonly [number, number, number]][];
    const goalAt: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSurfaceGoal>
    > = {
      left: AutoMovieMotionHumanArmTarget.prepareSurfaceGoal(
        body,
        "left",
        "indexTip",
        "point",
      ),
      right: AutoMovieMotionHumanArmTarget.prepareSurfaceGoal(
        body,
        "right",
        "indexTip",
        "point",
      ),
    };

    // The body holds the posture it is entered in: a planted foot stays on
    // the floor it stands on, and a seated body stays on its seat.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const)
      if (context.entry.feet[side].planted)
        contacts.push({
          part: `${side}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, `${side}Foot`),
        });
    if (context.entry.base.kind === "seated")
      contacts.push({
        part: "seat",
        kind: "seat",
        from: 0,
        to: 1,
        support: HumanSupportFrame.contact(context, "seat"),
      });
    // Each fingertip's goal at a second is fitted along the typing's course,
    // each second continuing the swivel the course chose before it, so an
    // elbow does not change its side between two key presses.
    const typing: (seconds: number) => IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanArmChain.continued(
        body,
        duration,
        (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const joints: IAutoMovieMotionHumanPosture["joints"] = {
            ...hold.joints,
          };
          for (const [bone, angles] of shaped)
            joints[bone] = [angles[0], angles[1], angles[2]];
          return {
            ...hold,
            joints,
            limbs: {
              ...hold.limbs,
              leftArm: goalAt.left({
                point: tipAt("left", t),
                rotation: { ...hands.left },
                bend: AutoMovieMotionHumanBend.hang(body, hold, "left", OUT),
              }),
              rightArm: goalAt.right({
                point: tipAt("right", t),
                rotation: { ...hands.right },
                bend: AutoMovieMotionHumanBend.hang(body, hold, "right", OUT),
              }),
            },
          };
        },
      );
    return {
      duration,
      events: times.map(
        (t: number, i: number): IPlanResult => ({
          name: `press${i + 1}`,
          share: t / duration,
        }),
      ),
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        typing(seconds),
    };
  }

  /*
   * The farthest a home key may lie from its shoulder, as a share of the arm
   * and hand's length (provisional: short of a fully straight arm).
   */
  const REACH: number = 0.95;

  /*
   * How far the home row may lie above or below the elbows' height, metres
   * (provisional).
   */
  const HEIGHT: number = 0.15;

  /*
   * Seconds before the first press, the time to reach the first key from where
   * the hands are (provisional).
   */
  const LEAD: number = 0.3;

  /*
   * Vertical drop per horizontal metre along the typing fingers (provisional).
   */
  const FINGER_SLOPE: number = -0.5;

  /*
   * How far out a typing elbow hangs, as `AutoMovieMotionHumanBend.hang`'s
   * share (provisional).
   */
  const OUT: number = 0.1;

  /*
   * The slowest and fastest everyday typists' words a minute (Feit, Weir and
   * Oulasvirta 2016, CHI '16, How We Type, figure 3).
   */
  const WPM: Readonly<Record<WPMEntryItem, number>> = {
    slowest: 34,
    fastest: 79,
  };

  /*
   * Characters a word in a words-a-minute rate, the typing-test convention Feit
   * et al. 2016 count by.
   */
  const CHARACTERS: number = 5;
}

/*
 * The record of `IPlanResult`'s site.
 */
type IPlanResult = { name: string; share: number };

/*
 * The record of `IROWSItem`'s site.
 */
type IROWSItem = { keys: string; stagger: number };

/*
 * The alternatives of `WPMEntryItem`'s site.
 */
type WPMEntryItem = "slowest" | "fastest";

/*
 * The alternatives of `BoardContext`'s site.
 */
type BoardContext = "prop" | "start";

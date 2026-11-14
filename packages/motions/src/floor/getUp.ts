import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { HumanBase } from "../law/HumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { floorEntry } from "./floorEntry";
import { lieDown } from "./lieDown";

/**
 * Getting up from the floor to standing: from lying on the back or the
 * front, from the hands and knees or crouched, as a crawl ends.
 *
 * Rising from the floor is described by the movement of three body regions
 * (VanSant 1988, Phys Ther 68:185, "Rising from a supine position to erect
 * stance"): the arms, the head and trunk (the axial region) and the legs.
 * The one combination VanSant found most often among adults, though in only
 * a quarter of them, is symmetrical throughout: the trunk flexes forward out
 * of supine with both hands pushing, the body comes through sitting to a
 * squat and stands. That is the `symmetric` pattern, the default from the
 * back. The other end of VanSant's axial scale is a full rotation: the body
 * rolls over to face the floor, comes up onto the hands and knees, through a
 * half kneel to standing; that is the `rotation` pattern, the only way up
 * from the front and from the hands and knees, whose first postures it has
 * already passed.
 *
 * Each posture of the route is a set of joint angles and a heading
 * (`POSES`, provisional angles, with `lieDown`'s own floor postures where
 * they are the same), passed through in joint space while the heading turns
 * on the sphere, so a roll from the back to the front turns about the
 * body's long axis. In each phase the body pivots about what bears on the
 * floor (`PINS`: the pelvis while it sits up or rolls, the knees on the
 * hands and knees, the feet or the leading foot once they stand), and at
 * every instant it rests on the floor with no collider under it
 * (`knockdown.rest`). The first phase leaves from the posture the entry
 * displays, so the rise continues from where the body lies.
 *
 * Young adults rise from supine to standing in 2.6 s on average at their
 * own pace (Ulbrich et al. 2000, J Am Geriatr Soc 48:1626); the route's
 * phases share that time equally (provisional split), scaled by the
 * manner's tempo. Events: one per posture reached, then `standing`.
 *
 * Not yet: a partial rotation (one hand pushing from the side) and the
 * half kneel out of the symmetric squat, VanSant's other adult variants; a
 * hand bearing on the floor is shown by its angles, not solved onto it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement's regions and patterns with their source, the method, the timing with its source and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body route of keyed floor postures on one clock, chosen by the entry's base and a closed pattern.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters, the postures, the routes, the pins and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor height is read from the body's own colliders; the route starts from the displayed entry.
 */
export namespace getUp {
  /** The action's name. */
  export const name: HumanActionName = "getUp";

  /** Cancel table: once standing, into anything a stand can become. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["standing", 1], kind: "inertialize", entry: 0 }],
  };

  /** How the body gets up (VanSant 1988's axial region). */
  export type Pattern = (typeof PATTERNS)[number];

  /** The patterns of {@link Pattern}, as data. */
  export const PATTERNS = ["symmetric", "rotation"] as const;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A closed pattern, a side and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No angle is typed by the author.
   */
  export interface IParams {
    /** The pattern; `symmetric` from the back when absent, and always `rotation` from the front or the hands and knees. */
    pattern?: Pattern;

    /** The foot set forward in the half kneel of the rotation; `right` when absent. */
    lead?: "left" | "right";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** A floor posture: the whole body's tilt and its joints. */
  export type IPose = lieDown.IPose;

  /** The share of the trained young adult's supine-to-stand time a body takes, seconds (Ulbrich et al. 2000: 2.6 s). */
  export const SECONDS: number = 2.6;

  /**
   * The postures of the routes, after `lieDown`'s floor postures (provisional
   * angles): the deep squat with the trunk forward and the arms reaching
   * ahead, the shanks leaning to the ankle's dorsiflexion range; the half
   * kneel on the trailing knee with the leading foot flat ahead; standing.
   */
  export const POSES: Readonly<
    Record<"sit" | "squat" | "prone" | "quadruped" | "halfKneel" | "stood", IPose>
  > = {
    sit: lieDown.POSES.sit,
    squat: keyed(40, { hip: 120, knee: 100, ankle: 20, shoulder: 60 }),
    prone: lieDown.POSES.prone,
    quadruped: lieDown.POSES.quadruped,
    halfKneel: {
      pitch: 5,
      roll: 0,
      joints: {
        ...stand.RELAXED,
        rightUpperLeg: [90, 5, 0],
        rightLowerLeg: [90, 0, 0],
        rightFoot: [0, 0, 0],
        leftUpperLeg: [0, 5, 0],
        leftLowerLeg: [95, 0, 0],
        leftFoot: [-30, 0, 0],
        leftUpperArm: [20, 10, 0],
        rightUpperArm: [20, 10, 0],
      },
    },
    stood: { pitch: 0, roll: 0, joints: stand.RELAXED },
  };

  /** What the body pivots about in a phase that ends at a posture: what bears on the floor through it. */
  export const PINS: Readonly<
    Record<keyof typeof POSES, "hips" | "knees" | "feet" | "lead">
  > = {
    sit: "hips",
    prone: "hips",
    squat: "feet",
    quadruped: "knees",
    halfKneel: "knees",
    stood: "feet",
  };

  /** The routes, each a list of postures with the event of its arrival. */
  export const ROUTES: Readonly<
    Record<Pattern, readonly (readonly [keyof typeof POSES, string])[]>
  > = {
    symmetric: [
      ["sit", "seated"],
      ["squat", "squatting"],
      ["stood", "standing"],
    ],
    rotation: [
      ["prone", "prone"],
      ["quadruped", "handsAndKnees"],
      ["halfKneel", "halfKneeling"],
      ["stood", "standing"],
    ],
  };

  /**
   * Plan a rise from the floor.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} `base` when the body already stands, sits on a seat or hangs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The route is the pattern's from the lying side the entry displays, cut to the postures after the entry's own; each phase blends joints linearly and the heading on the sphere, pivots about its pin and rests on the floor by the body's colliders, so the rise starts at the displayed entry and stands where its feet are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The route, the phase starts solved once, one posture function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Angles and the time split are named provisional; the floor height is the body's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward kinematics per evaluated second, one for the pin and one for the floor; the phase starts are solved once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; the phase starts are kept for the plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its route and the phase starts.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const kind: HumanBase.Kind = context.entry.base.kind;
    if (kind === "standing" || kind === "seated" || kind === "hanging" || kind === "leaning")
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: kind,
        feasible: {
          kind: "alternatives",
          values: ["lying", "kneeling", "crouched"],
        },
        reason: `getUp rises from the floor, and the body is ${kind} where it starts`,
        fix:
          kind === "seated"
            ? "rise from a seat with rise"
            : "lie down, kneel or crawl before it, or leave it out",
      });
    const entered: IHumanPosture = floorEntry.displayed(context);
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(entered);

    // On the back the chest faces up; anything else rises by the rotation.
    const up: number = Quaternion.rotateVector(heading, { x: 0, y: 0, z: 1 }).y;
    const supine: boolean = kind === "lying" && up > 0;
    const pattern: Pattern = supine
      ? (context.params.pattern ?? "symmetric")
      : "rotation";
    // From the back the whole route; from the front it starts past the roll,
    // and from the hands and knees past the hands and knees as well.
    const route: readonly (readonly [keyof typeof POSES, string])[] =
      kind !== "lying"
        ? ROUTES.rotation.slice(2)
        : supine
          ? ROUTES[pattern]
          : ROUTES.rotation.slice(1);
    const lead: "left" | "right" = context.params.lead ?? "right";
    const keyOf = (key: keyof typeof POSES): IPose =>
      key === "halfKneel" && lead === "left"
        ? mirrored(POSES.halfKneel)
        : POSES[key];

    // The heading the body rises on: the entry's, or turned half about the
    // vertical after a roll from the back, so the head stays where it lay.
    const yaw: number =
      supine && pattern === "rotation" ? entered.yaw + 180 : entered.yaw;

    // The clock: each phase takes its share of a whole rise from lying.
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const phase: number =
      (SECONDS / ROUTES[supine ? pattern : "rotation"].length) *
      modifiers.tempo;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.sequence(
      [
        { name: "getUp", seconds: phase },
        ...route.slice(0, -1).map(([, event]) => ({ name: event, seconds: phase })),
        { name: "standing", seconds: 0 },
      ],
    );
    const duration: number = clock.duration;

    // The posture of a phase at a share of it, before it is placed: joints
    // blended, the heading turned on the sphere, the root at the origin.
    const shapes: IHumanPosture[] = [
      { ...entered, root: { x: 0, y: 0, z: 0 } },
      ...route.map(
        ([key]): IHumanPosture => ({
          root: { x: 0, y: 0, z: 0 },
          yaw,
          pitch: keyOf(key).pitch,
          roll: keyOf(key).roll,
          joints: keyOf(key).joints,
          limbs: {},
        }),
      ),
    ];
    const between = (i: number, u: number): IHumanPosture => {
      const a: IHumanPosture = shapes[i]!;
      const b: IHumanPosture = shapes[i + 1]!;
      const joints: IHumanPosture["joints"] = {};
      for (const bone of new Set([
        ...Object.keys(a.joints),
        ...Object.keys(b.joints),
      ]) as Set<AutoMovieHumanoidBone>) {
        const p: readonly [number, number, number] = a.joints[bone] ?? [0, 0, 0];
        const q: readonly [number, number, number] = b.joints[bone] ?? [0, 0, 0];
        joints[bone] = [
          p[0] + (q[0] - p[0]) * u,
          p[1] + (q[1] - p[1]) * u,
          p[2] + (q[2] - p[2]) * u,
        ];
      }
      return {
        root: { x: 0, y: 0, z: 0 },
        ...resolveHumanPosture.angles(
          Quaternion.slerp(
            resolveHumanPosture.heading(a),
            resolveHumanPosture.heading(b),
            u,
          ),
        ),
        joints,
        limbs: {},
      };
    };

    // The pin's floor place at the start of each phase, solved in order: the
    // first is where the entry has it, each next one where the phase before
    // left it.
    // Out of a half kneel the body stands up over its leading foot, the
    // trailing one coming up beside it.
    const pins: ("hips" | "knees" | "feet" | "lead")[] = route.map(
      ([key], i: number): "hips" | "knees" | "feet" | "lead" =>
        key === "stood" && route[i - 1]?.[0] === "halfKneel"
          ? "lead"
          : PINS[key],
    );
    const pinOf = (posture: IHumanPosture, i: number): IAutoMovieVector3 =>
      pin(body, posture, pins[i]!, lead);
    const starts: IAutoMovieVector3[] = [];
    const placed = (i: number, u: number): IHumanPosture => {
      const shaped: IHumanPosture = between(i, u);
      const at: IAutoMovieVector3 = Vector3.subtract(starts[i]!, pinOf(shaped, i));
      return {
        ...shaped,
        root: { x: at.x, y: knockdown.rest(body, shaped), z: at.z },
      };
    };
    for (let i: number = 0; i < route.length; i++)
      starts.push(
        i === 0
          ? pinOf(entered, 0)
          : pinOf(placed(i - 1, 1), i),
      );

    const posture = (seconds: number): IHumanPosture => {
      let index: number = 0;
      for (let i: number = 0; i < route.length; i++)
        if (seconds >= clock.at(i === 0 ? "getUp" : route[i - 1]![1])) index = i;
      const from: number = clock.at(index === 0 ? "getUp" : route[index - 1]![1]);
      const u: number = clock.progress(
        index === 0 ? "getUp" : route[index - 1]![1],
        route[index]![1],
        Math.max(from, seconds),
      );
      return placed(index, u);
    };

    // The feet bear from the phase that pivots on them, or the leading foot
    // alone out of a half kneel, the other only arriving as the body
    // stands; the plan ends standing.
    const feet: number = pins.findIndex(
      (p): boolean => p === "feet" || p === "lead",
    );
    const standing: number =
      clock.at(feet <= 0 ? "getUp" : route[feet - 1]![1]) / duration;
    const contacts: IHumanContactWindow[] = (
      pins[feet] === "lead"
        ? ([`${lead}Foot`] as const)
        : (["leftFoot", "rightFoot"] as const)
    ).map(
      (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
        part,
        kind: "plant",
        from: standing,
        to: 1,
        support: { kind: "ground" },
      }),
    );
    if (kind === "lying")
      contacts.push({
        part: "back",
        kind: "lie",
        from: 0,
        to: clock.at(route[0]![1]) / duration,
        support: { kind: "ground" },
      });
    return {
      duration,
      events: clock.events(),
      contacts,
      base: { kind: "standing" },
      posture,
    };
  }

  /** A floor posture from its tilt and symmetric limb angles. */
  function keyed(
    pitch: number,
    a: { hip: number; knee: number; ankle: number; shoulder: number },
  ): IPose {
    const joints: AutoMovieMotionHumanJoints.Angles = { ...stand.RELAXED };
    for (const side of ["left", "right"] as const) {
      joints[`${side}UpperLeg`] = [a.hip, 8, 0];
      joints[`${side}LowerLeg`] = [a.knee, 0, 0];
      joints[`${side}Foot`] = [a.ankle, 0, 0];
      joints[`${side}UpperArm`] = [a.shoulder, 10, 0];
      joints[`${side}LowerArm`] = [10, 0, 0];
    }
    return { pitch, roll: 0, joints };
  }

  /** A posture with its left and right sides exchanged. */
  function mirrored(pose: IPose): IPose {
    const joints: AutoMovieMotionHumanJoints.Angles = {};
    for (const [bone, angles] of Object.entries(pose.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      joints[
        (bone.startsWith("left")
          ? bone.replace(/^left/, "right")
          : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone
      ] = angles;
    return { ...pose, joints };
  }

  /** Where a posture's pin is on the floor: the hip joints', the knees', the ankles' middle or the leading ankle, height dropped. */
  function pin(
    body: IHumanBody,
    posture: IHumanPosture,
    kind: "hips" | "knees" | "feet" | "lead",
    lead: "left" | "right",
  ): IAutoMovieVector3 {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)!.worldPosition;
    const point: IAutoMovieVector3 =
      kind === "hips"
        ? at("hips")
        : kind === "lead"
          ? at(`${lead}Foot`)
          : Vector3.lerp(
              at(kind === "knees" ? "leftLowerLeg" : "leftFoot"),
              at(kind === "knees" ? "rightLowerLeg" : "rightFoot"),
              0.5,
            );
    return { x: point.x, y: 0, z: point.z };
  }
}

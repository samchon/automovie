import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { support } from "../actions/support";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { HumanBase } from "../law/HumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
 * The rise is a support sequence (`support`): each posture of the route is
 * a stance resting on what that posture bears on (`BEARS`), its key solved
 * by the whole-body fit nearest the route's posture (`POSES`, provisional
 * angles, with `lieDown`'s own floor postures where they are the same) with
 * those parts on the floor and the centre of mass over them, a new support
 * placed before an old one lets go, the body carried between keys about a
 * support both hold and resting on the floor by its colliders at every
 * instant. The first stance leaves from the posture the entry displays, so
 * the rise continues from where the body lies.
 *
 * Young adults rise from supine to standing in 2.6 s on average at their
 * own pace (Ulbrich et al. 2000, J Am Geriatr Soc 48:1626); the route's
 * phases share that time equally (provisional split), scaled by the
 * manner's tempo. Events: one per posture reached, then `standing`.
 *
 * Not yet: a partial rotation (one hand pushing from the side) and the
 * half kneel out of the symmetric squat, VanSant's other adult variants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement's regions and patterns with their source, the method, the timing with its source and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record whose plan is a support sequence of the route's stances, chosen by the entry's base and a closed pattern.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters, the postures, what each bears on, the routes and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The keys, the course and the windows are the support planner's; the route starts from the displayed entry.
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
    Record<
      "sit" | "squat" | "prone" | "quadruped" | "halfKneel" | "stood",
      IPose
    >
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

  /**
   * What each posture of the routes bears on (VanSant 1988's regions): the
   * seat, the heels and both hands pushing while sitting up, the feet in the
   * squat and standing, the front lying prone, the hands, knees and toes on
   * the hands and knees, and the trailing knee with both feet in the half
   * kneel (`lead`, the leading foot; `trail`, the trailing knee).
   */
  export const BEARS: Readonly<
    Record<
      keyof typeof POSES,
      readonly (HumanSupport.Part | "lead" | "trail")[]
    >
  > = {
    sit: ["seat", "leftFoot", "rightFoot", "leftHand", "rightHand"],
    squat: ["leftFoot", "rightFoot"],
    prone: ["front"],
    quadruped: [
      "leftHand",
      "rightHand",
      "leftKnee",
      "rightKnee",
      "leftFoot",
      "rightFoot",
    ],
    halfKneel: ["trail", "leftFoot", "rightFoot"],
    stood: ["leftFoot", "rightFoot"],
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
   * Plan a rise from the floor: the route's postures as stances of the
   * support planner (`support`), each resting on the parts its posture bears
   * on (`BEARS`), keyed by its posture (`POSES`) and lasting its share of the
   * rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} `base` when the body already stands, sits on a seat or hangs, and what the support planner refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The route is the pattern's from the lying side the entry displays, cut to the postures after the entry's own; each is a stance of the support planner, which solves its key posture on what bears, places a stance's new supports before it releases the old and carries the body between keys about a held support, resting on the floor by its colliders.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The route, then one support plan of its stances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Angles and the time split are named provisional; no posture is placed by this law.
   * @evidence contracts/development/implementation.md#efficient-algorithms The support planner's keys, two fits per stance after the first.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The support planner owns the keys, the course and the windows.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan is the support planner's.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const kind: HumanBase.Kind = context.entry.base.kind;
    if (
      kind === "standing" ||
      kind === "seated" ||
      kind === "hanging" ||
      kind === "leaning"
    )
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
    const trail: "left" | "right" = lead === "right" ? "left" : "right";

    // Each phase takes its share of a whole rise from lying.
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const phase: number =
      (SECONDS / ROUTES[supine ? pattern : "rotation"].length) *
      modifiers.tempo;

    // Standing is the stand law's quiet stance (`quiet`).
    const stood: IPose = quiet(context.body);


    // The stances: each posture of the route on what it bears on, turned half
    // about the vertical after a roll from the back, so the head stays where
    // it lay.
    const stances: HumanSupport.IStance[] = route.map(
      ([key, event]): HumanSupport.IStance => ({
        contacts: BEARS[key].map(
          (
            part: HumanSupport.Part | "lead" | "trail",
          ): HumanSupport.IContact => ({
            part:
              part === "lead"
                ? `${lead}Foot`
                : part === "trail"
                  ? `${trail}Knee`
                  : part,
            kind: "bear",
          }),
        ),
        seconds: phase,
        prefer:
          key === "stood"
            ? stood
            : key === "halfKneel" && lead === "left"
              ? mirrored(POSES.halfKneel)
              : POSES[key],
        turn: supine && pattern === "rotation" ? 180 : 0,
        event,
      }),
    );
    const planned: IHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });
    return { ...planned, base: { kind: "standing" } };
  }
  /**
   * Standing as the stand law's quiet stance, the posture every performer
   * starts from, by its resolved joints: the stated posture a support
   * sequence ends standing in.
   *
   * @param body The body.
   * @returns The tilt, none, and the joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the posture is and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The stand law's own posture, its leg goals resolved to joints, so a rise ends where a performer starts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint is typed here.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolve per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `stand.posture` and `resolveHumanPosture`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function quiet(body: IHumanBody): IPose {
    return {
      pitch: 0,
      roll: 0,
      joints: Object.fromEntries(
        resolveHumanPosture(
          body,
          stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
        ).joints.map(
          (j): [string, readonly [number, number, number]] => [
            j.bone,
            [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
          ],
        ),
      ) as AutoMovieMotionHumanJoints.Angles,
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
}

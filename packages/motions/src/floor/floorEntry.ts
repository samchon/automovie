import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { HumanBase } from "../law/HumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";

/**
 * How a law that gets the body down onto the floor (a crawl, an inchworm,
 * a lie down) starts from the base it is entered on.
 *
 * Each such law has its own way down from standing. Entered off its feet,
 * on the knees or crouched over the hands (where a crawl ends), the body is
 * already low, so the law's first floor posture is reached by a blend from
 * the posture the entry displays, the hips carried straight between the two,
 * instead of from a standing body put back at the entry's root. A base with
 * no way down planned from it (lying, seated, hanging, leaning) is refused,
 * so a composition never jumps from one base to another.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the problem, the two answers and which bases get which.
 * @evidence contracts/development/design.md#principled-representation The base axis decides the start (`HumanBase`): the laws plan from the entry state (the motion skill's laws rule), and the bases they have no route from are refused, as the transitions rule asks of an impossible change of plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The accepted bases, the gate, the standing reference, the displayed entry and the blend, read by `crawl`, `crawlInchworm` and `lieDown`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is named here; each passes its own name to the gate.
 */
export namespace floorEntry {
  /** The bases a floor law starts from: standing by its own way down, kneeling and crouched by a blend from the displayed entry. */
  export const BASES: readonly HumanBase.Kind[] = [
    "standing",
    "kneeling",
    "crouched",
  ];

  /**
   * Whether a floor law is entered standing, refusing a base it has no way
   * down from.
   *
   * @param context The action's context.
   * @param action The law's name, for the refusal.
   * @returns `true` standing, `false` kneeling or crouched.
   * @throws {HumanRefusal} `base` on `base` for any other base, naming it and the accepted ones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the two answers and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The entry's base is the one the performance passes on from the act before (`HumanBase.after`), so the gate reads what carries the body, not a guess from its pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusal names the base found and the accepted ones; nothing is clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the entry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function standing(
    context: Pick<IHumanActionContext, "entry">,
    action: string,
  ): boolean {
    const kind: HumanBase.Kind = context.entry.base.kind;
    if (kind === "standing") return true;
    if (BASES.includes(kind)) return false;
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: kind,
      feasible: { kind: "alternatives", values: [...BASES] },
      reason: `${action} gets down onto the floor from standing, kneeling or crouched, and the body is ${kind} where it starts`,
      fix: "end the act before it on the feet or on the hands and knees; getting up from lying, sitting or hanging is not in the vocabulary yet",
    });
  }

  /**
   * Where a floor law starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member is and when the blend source is absent.
   * @evidence contracts/development/design.md#principled-representation The law's standing measure and, off the feet, the displayed entry it blends from; standing, there is none, so the two cases cannot be mixed up.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the three floor laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture type.
   */
  export interface IStart {
    /** The standing posture the law measures from: the stance it stands in, or one over the entry when it does not stand. */
    standing: IHumanPosture;

    /** The displayed entry the way down blends from; null when the body enters standing, since the law's own way down starts there. */
    entered: IHumanPosture | null;
  }

  /**
   * Where a floor law starts: entered standing, the stance it stands in;
   * entered kneeling or crouched, an upright stance over the entry for its
   * geometry and the displayed entry for its way down.
   *
   * @param context The action's context.
   * @param action The law's name, for the refusal.
   * @param over What the stance off the feet stands over.
   * @param stood The stance a standing entry stands in.
   * @returns The start.
   * @throws {HumanRefusal} `base` for a base the law has no way down from (`standing`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two starts and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The gate, then the law's own stance or `reference` and `displayed`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the gate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond one resolution off the feet.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function start(
    context: Pick<IHumanActionContext, "body" | "entry">,
    action: string,
    over: "hips" | "feet",
    stood: () => IHumanPosture,
  ): IStart {
    return standing(context, action)
      ? { standing: stood(), entered: null }
      : {
          standing: reference(context, over),
          entered: displayed(context),
        };
  }

  /**
   * A floor law's posture with its way down taken from the entry: the law's
   * own posture once its way down is done or when it was entered standing,
   * and before that the blend from the displayed entry to the law's posture
   * at the end of its way down, which is read once.
   *
   * @param body The body.
   * @param entered The displayed entry; null when the law was entered standing.
   * @param at The law's second at the end of its way down.
   * @param weight How far down the body is at a second, in [0, 1].
   * @param posture The law's posture at a second over a base posture.
   * @returns The posture at a second over a base posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases, what is read once and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The law's posture at the end of its way down is written by its solved joint angles (`GymnasticsFlight.frozen`), so the blend arrives on the pose the law shows from there on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch and one blend.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolution for the whole way down, then one blend per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arrival is computed once and kept; the law's base posture is a constant of its plan, so the first read stands for every second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one posture for the plan's life.
   */
  export function down(
    body: IHumanBody,
    entered: IHumanPosture | null,
    at: number,
    weight: (seconds: number) => number,
    posture: (base: IHumanPosture, seconds: number) => IHumanPosture,
  ): (base: IHumanPosture, seconds: number) => IHumanPosture {
    let arrived: IHumanPosture | undefined;
    return (base: IHumanPosture, seconds: number): IHumanPosture => {
      const w: number = weight(seconds);
      if (entered === null || w >= 1) return posture(base, seconds);
      arrived ??= GymnasticsFlight.frozen(body, posture(base, at));
      return blend(body, entered, arrived, w);
    };
  }

  /**
   * An upright stance at the entry, the reference a floor law measures its
   * geometry from when the body is not standing: over the floor under the
   * entry's hips, or under the middle of its ankles, heading the entry's
   * way.
   *
   * @param context The action's context.
   * @param over What the stance stands over.
   * @returns The standing posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the stance is for, where it stands and its heading.
   * @evidence contracts/development/implementation.md#principled-implementation `stand.posture`, the owner of a quiet stance, placed at a floor point read off the entry's displayed bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One floor point and one stance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stance is only the law's measure; it is never shown, since the law blends from the displayed entry.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolution of the entry for its bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs, called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reference(
    context: Pick<IHumanActionContext, "body" | "entry">,
    over: "hips" | "feet",
  ): IHumanPosture {
    const at: IAutoMovieVector3 =
      over === "hips"
        ? hips(context.body, displayed(context))
        : Vector3.scale(
            Vector3.add(
              context.entry.feet.left.ankle,
              context.entry.feet.right.ankle,
            ),
            0.5,
          );
    return stand.posture(
      context.body,
      { x: at.x, y: 0, z: at.z },
      context.entry.posture.yaw,
    );
  }

  /**
   * The posture the entry displays, written by its joint angles alone: its
   * root, its heading read off the root's rotation and every joint's
   * clinical angles, so it resolves to the displayed pose itself.
   *
   * @param context The action's context.
   * @returns The posture, with no limb goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and what the result resolves to.
   * @evidence contracts/development/implementation.md#principled-implementation The displayed pose holds each joint's clinical triple and the root's frame, and `resolveHumanPosture.angles` inverts the heading the resolver composes, so nothing is re-derived from bone directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pose with no root frame reads the entry posture's root and heading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the entry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function displayed(
    context: Pick<IHumanActionContext, "entry">,
  ): IHumanPosture {
    const pose: IAutoMoviePose = context.entry.pose;
    const joints: IHumanPosture["joints"] = {};
    for (const joint of pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    const posture: IHumanPosture = context.entry.posture;
    return {
      ...(pose.root === undefined || pose.root === null
        ? {
            root: posture.root,
            yaw: posture.yaw,
            pitch: posture.pitch,
            roll: posture.roll,
          }
        : {
            root: pose.root.translation,
            ...resolveHumanPosture.angles(pose.root.rotation),
          }),
      joints,
      limbs: {},
    };
  }

  /**
   * A blend between two postures written by joint angles alone: every
   * joint's angles, the heading the short way round and the tips go by the
   * weight, and the hips joint travels on the straight line between its two
   * places, the root following from it. Carrying the root instead would
   * swing the hips through the air between two tilted bodies, whose roots
   * lie far from their hips. Where the blended angles would put a limb
   * deeper under the floor than the two ends have it, the body is raised by
   * the difference (`knockdown.rest`).
   *
   * @param body The body.
   * @param from The posture at weight 0, with no limb goal.
   * @param to The posture at weight 1, with no limb goal.
   * @param weight The weight in [0, 1].
   * @returns The blended posture; `from` at 0 and `to` at 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves how, why the hips carry the root and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Joint-space interpolation of two whole postures, with the root placed under the interpolated hips by the posture's own heading, the relation the resolver places the hips by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints, one root and one floor reading of the blend and of each end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ends return the given postures unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints the two postures hold, plus three forward kinematics over the body's shapes for the floor reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(
    body: IHumanBody,
    from: IHumanPosture,
    to: IHumanPosture,
    weight: number,
  ): IHumanPosture {
    if (weight <= 0) return from;
    if (weight >= 1) return to;
    const lerp = (a: number, b: number): number => a + (b - a) * weight;
    const joints: IHumanPosture["joints"] = {};
    for (const bone of new Set([
      ...Object.keys(from.joints),
      ...Object.keys(to.joints),
    ]) as Set<AutoMovieHumanoidBone>) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = to.joints[bone] ?? [0, 0, 0];
      joints[bone] = [lerp(a[0], b[0]), lerp(a[1], b[1]), lerp(a[2], b[2])];
    }
    const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
    const heading: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> = {
      yaw: from.yaw + turn * weight,
      pitch: lerp(from.pitch, to.pitch),
      roll: lerp(from.roll, to.roll),
    };
    const carried: IHumanPosture = {
      ...heading,
      root: Vector3.subtract(
        Vector3.lerp(hips(body, from), hips(body, to), weight),
        Quaternion.rotateVector(
          resolveHumanPosture.heading(heading),
          body.rest.get("hips")!,
        ),
      ),
      joints,
      limbs: {},
    };

    // The floor is a constraint on the way: angles blended between two
    // postures that rest on the floor can dip a limb under it, so the body
    // is raised by whatever sinks deeper than the two ends themselves do.
    const sunk = (posture: IHumanPosture): number =>
      Math.max(0, knockdown.rest(body, posture) - posture.root.y);
    const rise: number = Math.max(
      0,
      sunk(carried) - lerp(sunk(from), sunk(to)),
    );
    return rise === 0
      ? carried
      : { ...carried, root: { ...carried.root, y: carried.root.y + rise } };
  }

  /** Where a posture's hips joint is: its root plus the hips' rest place turned by its heading. */
  function hips(body: IHumanBody, posture: IHumanPosture): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
        body.rest.get("hips")!,
      ),
    );
  }
}

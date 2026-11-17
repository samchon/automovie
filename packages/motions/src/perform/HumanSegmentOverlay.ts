import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentPose } from "./HumanSegmentPose";

/**
 * A carrier's pose with its overlays written over it: which overlays run at
 * a second, and how each one's channels are faded in and out against the
 * body without it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentOverlay {
  /**
   * A faded pose and the limb contacts its declared windows still hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which goals survive fading and their coordinate convention.
   * @evidence contracts/development/design.md#principled-representation The displayed pose and its active constraints, kept together through final resolution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only active contact goals to the existing seeded pose record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the posture's own goal type, preserving all constraint data.
   */
  export interface IOverlaid extends HumanSegmentPose.ISeeded {
    /** World goals have received the root turn; attached goals retain `on`. */
    contacts: IAutoMovieMotionHumanPosture["limbs"];
  }

  /**
   * A carrier's posture resolved with every overlay active at a second
   * written over it: each overlay's claimed channels come from its own plan,
   * which was composed on this carrier, and an overlay coming in or going
   * out is blended joint by joint against the body without it over `HumanSegment.FADE`,
   * so neither end steps.
   *
   * A hand that carries a held prop rides the chest wherever no overlay of
   * the pose being built drives it, so the body without an overlay, which an
   * overlay fades from and back to, still carries what the hand holds.
   *
   * Each limb fit made here is named by the overlays written over the leaf
   * it is fitted in and whether it is the leaf's own fit or a carried
   * hand's (`HumanSegmentPose.IFits`), and continues the fit `near` holds
   * under that name.
   *
   * A contact is resolved after fading, using its complete original goal
   * where present. A planned joint path supplies its displayed end frame
   * and middle joint instead. Contacting fingers keep their planned shape
   * until the window closes. The goals travel to the final transition
   * resolver too, so a later offset or clamp cannot move the contact.
   *
   * @param person The person.
   * @param posture The carrier's posture at the second, layers applied.
   * @param seconds Film seconds.
   * @param carried The holds the carrier carries at the second.
   * @param near The fits of a nearby second to continue, if any.
   * @returns The pose, the seeds of its fits and its open contact goals.
   */
  export function overlaid(
    person: IAutoMovieMotionHumanSegment.IPerson,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    carried: readonly IAutoMovieMotionHumanSegment.IHeld[] = [],
    near?: HumanSegmentPose.INear,
  ): IOverlaid {
    const body = person.performer.body;
    const active: IAutoMovieMotionHumanSegment.IOverlay[] = running(
      person,
      seconds,
    );
    const seeds: HumanSegmentPose.IFits = new Map();
    const build = (
      k: number,
      under: IAutoMovieMotionHumanPosture,
      used: readonly IAutoMovieMotionHumanSegment.IOverlay[],
    ): {
      pose: IAutoMoviePose;
      contacts: IAutoMovieMotionHumanPosture["limbs"];
    } => {
      const overlay: IAutoMovieMotionHumanSegment.IOverlay | undefined =
        active[k];
      if (overlay === undefined) {
        // The leaf is named by the overlays written over it.
        const tag: string = used
          .map((o: IAutoMovieMotionHumanSegment.IOverlay): number =>
            person.overlays.indexOf(o),
          )
          .join(",");
        const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
          resolveHumanPosture.seeded(
            body,
            under,
            undefined,
            Object.fromEntries(
              resolveHumanPosture
                .order(under.limbs)
                .flatMap(
                  (
                    limb: IAutoMovieMotionHumanPosture.Limb,
                  ): [
                    IAutoMovieMotionHumanPosture.Limb,
                    IAutoMovieSwivelNear,
                  ][] => {
                    const continued: IAutoMovieSwivelNear | undefined =
                      HumanSegmentPose.nearby(near, `leaf:${tag}:${limb}`);
                    return continued === undefined ? [] : [[limb, continued]];
                  },
                ),
            ),
          );
        for (const [limb, seed] of Object.entries(fitted.seeds))
          seeds.set(`leaf:${tag}:${limb}`, seed ?? null);
        let leaf: IAutoMoviePose = fitted.pose;
        for (const [limb, goal] of HumanSegmentCarry.carries(
          person,
          leaf,
          carried.filter(
            (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
              !used.some((o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
                HumanSegment.drives(o.plan, h.side),
              ),
          ),
        )) {
          const name: string = `carry:${tag}:${limb}`;
          const carry: IAutoMovieSeededChainFit =
            resolveHumanPosture.limbSeeded(
              body,
              leaf,
              limb,
              goal,
              HumanSegmentPose.nearby(near, name),
            );
          seeds.set(name, carry.seed);
          leaf = carry.pose;
        }
        return { pose: leaf, contacts: {} };
      }
      const written: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanChannel.merge(
          under,
          overlay.plan.posture(
            Math.min(
              overlay.plan.duration,
              Math.max(0, seconds - overlay.start),
            ),
          ),
          overlay.channels,
        );
      const weight: number = Math.min(
        minimumJerk(
          Math.min(
            1,
            Math.max(0, (seconds - overlay.entryTime) / HumanSegment.FADE),
          ),
        ).s,
        minimumJerk(
          Math.min(1, Math.max(0, (overlay.end - seconds) / HumanSegment.FADE)),
        ).s,
      );
      const over = build(k + 1, written, [...used, overlay]);
      const contacts: IAutoMovieMotionHumanPosture["limbs"] = {
        ...contactGoals(overlay, written, over.pose, seconds, person),
        ...over.contacts,
      };
      if (weight >= 1) return { pose: over.pose, contacts };
      const without: IAutoMoviePose = build(k + 1, under, used).pose;
      const angles = (
        pose: IAutoMoviePose,
        bone: AutoMovieHumanoidBone,
      ): readonly [number, number, number] => {
        const joint = pose.joints.find((j): boolean => j.bone === bone);
        return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
      };
      const owned: AutoMovieHumanoidBone[] = [
        ...new Set(
          [...without.joints, ...over.pose.joints].map(
            (j): AutoMovieHumanoidBone => j.bone,
          ),
        ),
      ].filter((bone: AutoMovieHumanoidBone): boolean =>
        AutoMovieMotionHumanChannel.covers(overlay.channels, bone),
      );
      const pose: IAutoMoviePose = {
        ...without,
        joints: [
          ...without.joints.filter((j): boolean => !owned.includes(j.bone)),
          ...owned.map((bone: AutoMovieHumanoidBone) => {
            const [flexion, abduction, twist] = blendHumanJoint(
              body,
              bone,
              angles(without, bone),
              angles(over.pose, bone),
              ((bone.startsWith("left") && contacts.leftArm !== undefined) ||
                (bone.startsWith("right") &&
                  contacts.rightArm !== undefined)) &&
                AutoMovieMotionHumanChannel.of(bone).endsWith("Hand")
                ? 1
                : weight,
            );
            return { bone, flexion, abduction, twist };
          }),
        ],
      };
      return { pose, contacts };
    };
    const built = build(0, posture, []);
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.refit(
        body,
        built.pose,
        built.contacts,
        Object.fromEntries(
          resolveHumanPosture.order(built.contacts).flatMap((limb) => {
            const continued = HumanSegmentPose.nearby(near, `contact:${limb}`);
            return continued === undefined ? [] : [[limb, continued]];
          }),
        ),
      );
    for (const [limb, seed] of Object.entries(fitted.seeds))
      seeds.set(`contact:${limb}`, seed ?? null);
    return { pose: fitted.pose, seeds, contacts: built.contacts };
  }

  /**
   * The active limb contacts of one overlay, before fading moves them.
   * A joint-only path contributes its complete displayed limb frame; an
   * authored goal keeps every member, including its attached frame and
   * contact pivot. The root turn is applied only to world goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both representations and the coordinate convention.
   * @evidence contracts/development/implementation.md#principled-implementation Retains a contact constraint over its declared time window; without an explicit goal, its already planned rigid end frame and bend define the same limb constraint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan of the contact windows and one lazily posed bone map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Copies an authored goal intact rather than replacing its contact pivot or attachment with a wrist point.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the plan's contact windows; poses the bones only for a joint-only contact.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses turnHumanPosture, HumanLimbFit.chain and the resolver's reference convention.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no state after the evaluation.
   */
  function contactGoals(
    overlay: IAutoMovieMotionHumanSegment.IOverlay,
    written: IAutoMovieMotionHumanPosture,
    over: IAutoMoviePose,
    seconds: number,
    person: IAutoMovieMotionHumanSegment.IPerson,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const share: number = (seconds - overlay.start) / overlay.plan.duration;
    const contacts: IAutoMovieMotionHumanPosture["limbs"] = {};
    const turned: IAutoMovieMotionHumanPosture["limbs"] =
      turnHumanPosture(written).limbs;
    let placed: ReturnType<typeof poseBones> | undefined;
    for (const window of overlay.plan.contacts) {
      if (share < window.from || share > window.to) continue;
      const limb: IAutoMovieMotionHumanPosture.Limb | undefined = limbOf(
        window.part,
      );
      if (limb === undefined || !overlay.channels.includes(limb)) continue;
      const goal: IAutoMovieMotionHumanPosture.IGoal | undefined = turned[limb];
      if (goal !== undefined) {
        contacts[limb] = { ...goal, planted: true };
        continue;
      }
      placed ??= poseBones(person.performer.body, over);
      const chain = HumanLimbFit.chain(limb);
      const end = placed.get(chain.effector)!;
      contacts[limb] = {
        point: end.worldPosition,
        rotation: end.worldRotation,
        bend: placed.get(chain.lower)!.worldPosition,
        reference: resolveHumanPosture.reference(over, limb),
        planted: true,
      };
    }
    return contacts;
  }

  /** The limb carrying a contact part, if the part belongs to a limb. */
  function limbOf(
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): IAutoMovieMotionHumanPosture.Limb | undefined {
    if (part === "seat" || part === "back") return undefined;
    const side: "left" | "right" = part.startsWith("left") ? "left" : "right";
    return `${side}${/(Hand|Arm)$/.test(part) ? "Arm" : "Leg"}`;
  }

  /**
   * The overlays that run at a second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The overlays, in placement order.
   */
  export function running(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
  ): IAutoMovieMotionHumanSegment.IOverlay[] {
    return person.overlays.filter(
      (o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
        seconds >= o.entryTime - 1e-12 && seconds <= o.end + 1e-12,
    );
  }
}

import {
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
   * @param person The person.
   * @param posture The carrier's posture at the second, layers applied.
   * @param seconds Film seconds.
   * @param carried The holds the carrier carries at the second.
   * @param near The fits of a nearby second to continue, if any.
   * @returns The pose and the seeds of its fits.
   */
  export function overlaid(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
    carried: readonly HumanSegment.IHeld[] = [],
    near?: HumanSegmentPose.INear,
  ): HumanSegmentPose.ISeeded {
    const body = person.performer.body;
    const active: HumanSegment.IOverlay[] = running(person, seconds);
    const seeds: HumanSegmentPose.IFits = new Map();
    const build = (
      k: number,
      under: IHumanPosture,
      used: readonly HumanSegment.IOverlay[],
    ): IAutoMoviePose => {
      const overlay: HumanSegment.IOverlay | undefined = active[k];
      if (overlay === undefined) {
        // The leaf is named by the overlays written over it.
        const tag: string = used
          .map((o: HumanSegment.IOverlay): number => person.overlays.indexOf(o))
          .join(",");
        const fitted: resolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
          body,
          under,
          undefined,
          Object.fromEntries(
            resolveHumanPosture
              .order(under.limbs)
              .flatMap(
                (
                  limb: IHumanPosture.Limb,
                ): [IHumanPosture.Limb, IAutoMovieSwivelNear][] => {
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
            (h: HumanSegment.IHeld): boolean =>
              !used.some((o: HumanSegment.IOverlay): boolean =>
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
        return leaf;
      }
      const written: IHumanPosture = AutoMovieMotionHumanChannel.merge(
        under,
        overlay.plan.posture(
          Math.min(overlay.plan.duration, Math.max(0, seconds - overlay.start)),
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
      const over: IAutoMoviePose = build(k + 1, written, [...used, overlay]);
      if (weight >= 1) return over;
      const without: IAutoMoviePose = build(k + 1, under, used);
      const angles = (
        pose: IAutoMoviePose,
        bone: AutoMovieHumanoidBone,
      ): readonly [number, number, number] => {
        const joint = pose.joints.find((j): boolean => j.bone === bone);
        return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
      };
      const owned: AutoMovieHumanoidBone[] = [
        ...new Set(
          [...without.joints, ...over.joints].map(
            (j): AutoMovieHumanoidBone => j.bone,
          ),
        ),
      ].filter((bone: AutoMovieHumanoidBone): boolean =>
        AutoMovieMotionHumanChannel.covers(overlay.channels, bone),
      );
      return {
        ...without,
        joints: [
          ...without.joints.filter((j): boolean => !owned.includes(j.bone)),
          ...owned.map((bone: AutoMovieHumanoidBone) => {
            const [flexion, abduction, twist] = blendHumanJoint(
              body,
              bone,
              angles(without, bone),
              angles(over, bone),
              weight,
            );
            return { bone, flexion, abduction, twist };
          }),
        ],
      };
    };
    return { pose: build(0, posture, []), seeds };
  }

  /**
   * The overlays that run at a second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The overlays, in placement order.
   */
  export function running(
    person: HumanSegment.IPerson,
    seconds: number,
  ): HumanSegment.IOverlay[] {
    return person.overlays.filter(
      (o: HumanSegment.IOverlay): boolean =>
        seconds >= o.entryTime - 1e-12 && seconds <= o.end + 1e-12,
    );
  }
}

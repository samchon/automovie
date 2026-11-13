import { minimumJerk } from "@automovie/engine";
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
   * @param person The person.
   * @param posture The carrier's posture at the second, layers applied.
   * @param seconds Film seconds.
   * @param carried The holds the carrier carries at the second.
   * @returns The pose.
   */
  export function overlaid(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
    carried: readonly HumanSegment.IHeld[] = [],
  ): IAutoMoviePose {
    const body = person.performer.body;
    const active: HumanSegment.IOverlay[] = running(person, seconds);
    const build = (
      k: number,
      under: IHumanPosture,
      used: readonly HumanSegment.IOverlay[],
    ): IAutoMoviePose => {
      const overlay: HumanSegment.IOverlay | undefined = active[k];
      if (overlay === undefined) {
        let leaf: IAutoMoviePose = resolveHumanPosture(body, under);
        for (const [limb, goal] of HumanSegmentCarry.carries(
          person,
          leaf,
          carried.filter(
            (h: HumanSegment.IHeld): boolean =>
              !used.some((o: HumanSegment.IOverlay): boolean => HumanSegment.drives(o.plan, h.side)),
          ),
        ))
          leaf = resolveHumanPosture.limb(body, leaf, limb, goal);
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
          Math.min(1, Math.max(0, (seconds - overlay.entryTime) / HumanSegment.FADE)),
        ).s,
        minimumJerk(Math.min(1, Math.max(0, (overlay.end - seconds) / HumanSegment.FADE))).s,
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
        overlay.channels.includes(AutoMovieMotionHumanChannel.of(bone)),
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
    return build(0, posture, []);
  }

  /**
   * The overlays that run at a second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The overlays, in placement order.
   */
  export function running(person: HumanSegment.IPerson, seconds: number): HumanSegment.IOverlay[] {
    return person.overlays.filter(
      (o: HumanSegment.IOverlay): boolean =>
        seconds >= o.entryTime - 1e-12 && seconds <= o.end + 1e-12,
    );
  }
}

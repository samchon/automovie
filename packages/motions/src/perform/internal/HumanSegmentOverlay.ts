import { AutoMovieEngineMotionSampling, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel } from "../../compose/internal/AutoMovieMotionHumanChannel";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { refitHumanPosture } from "../../posture/internal/refitHumanPosture";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLegs } from "./HumanSegmentLegs";
import { HumanSegmentOverlayRun } from "./HumanSegmentOverlayRun";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";
import { overlayContactGoals } from "./overlayContactGoals";
import { overlayContinuations } from "./overlayContinuations";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/**
 * A carrier's pose with its overlays written over it: which overlays run at a
 * second, and how each one's channels are faded in and out against the body
 * without it.
 */
export namespace HumanSegmentOverlay {
  /** A faded pose and the limb contacts its declared windows still hold. */
  export interface IOverlaid extends HumanSegmentPose.ISeeded {
    /** World goals have received the root turn; attached goals retain `on`. */
    contacts: IAutoMovieMotionHumanPosture["limbs"];
  }

  /**
   * A carrier's posture resolved with every overlay active at a second written
   * over it: each overlay's claimed channels come from its own plan, which was
   * composed on this carrier, and an overlay coming in or going out is blended
   * joint by joint against the body without it over `HumanSegment.FADE`, so
   * neither end steps.
   *
   * A hand that carries a held prop rides the chest wherever no overlay of the
   * pose being built drives it, so the body without an overlay, which an
   * overlay fades from and back to, still carries what the hand holds.
   *
   * Each limb fit made here is named by the overlays written over the leaf it
   * is fitted in and whether it is the leaf's own fit or a carried hand's
   * (`HumanSegmentPose.IFits`), and continues the fit `near` holds under that
   * name.
   *
   * A contact is resolved after fading, using its complete original goal where
   * present. A planned joint path supplies its displayed end frame and middle
   * joint instead while its overlay fades; at full weight the path is displayed
   * on its own joints and is not fitted again. Contacting fingers keep their
   * planned shape until the window closes. The goals travel to the final
   * transition resolver too, so a later offset or clamp cannot move the
   * contact. Every branch reads one overlay's raw posture and fade weight at
   * the same local second, so each is evaluated once, before the branches.
   * Branches still resolve their own under-postures and named limb fits
   * independently. Leaf, carry and contact fits keep their own poses and seeds
   * while exact FK dependency arithmetic may be shared within this evaluation.
   * Every joint still performs its own interpolation on its actual ends.
   *
   * @param person The person.
   * @param posture The carrier's posture at the second, layers applied.
   * @param seconds Film seconds.
   * @param carried The holds the carrier carries at the second.
   * @param near The fits of a nearby second to continue, if any.
   * @param source Optional same-body synchronous parent FK source; never
   *   retained by a result.
   * @param requested Optional bone observation, forwarded only with no
   *   holds/near/current contact window and no base or leaf plant, so no later
   *   IK consumes omitted digit geometry.
   * @param prepared Optional same-body evaluation preparation, lending genuine
   *   direct ROM metadata to leaves and complete source evaluation to first
   *   held-frame capture.
   * @param carrier The action the overlays ride, whose prepared legs-still fit
   *   the leaf keeps (`HumanSegmentLegs`); absent, the leaf fits its legs.
   * @returns The pose, the seeds of its fits and its open contact goals.
   */
  export function overlaid(
    person: IAutoMovieMotionHumanSegment.IPerson,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    carried: readonly IAutoMovieMotionHumanSegment.IHeld[] = [],
    near?: HumanSegmentPose.INear,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
    carrier?: IAutoMovieMotionHumanSegment,
    direct?: resolveHumanPostureSource.IAssembled,
    sample?: IAutoMovieMotionHumanPlayback.ISample,
  ): IOverlaid {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const projection: Parameters<typeof resolveHumanPosture.seeded>[6] =
      prepared?.clamp;
    const active: IAutoMovieMotionHumanSegment.IOverlay[] | undefined =
      person.overlays.length === 0 ? undefined : running(person, seconds);
    const seeds: HumanSegmentPose.IFits = new Map();
    const observed: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      requested !== undefined &&
      !HumanSegmentPoseSeeds.continues(near) &&
      carried.length === 0 &&
      !active?.some((overlay: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
        overlay.plan.contacts.some(
          (window: IAutoMovieMotionHumanContactWindow): boolean => {
            const share: number =
              (seconds - overlay.start) / overlay.plan.duration;
            return share >= window.from && share <= window.to;
          },
        ),
      )
        ? requested
        : undefined;

    // A bare leaf already owns its refit's FK. Additional stages may borrow
    // one reader here, but memory hits and no-FK paths never create it.
    const resolution:
      | (() => ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>)
      | undefined =
      source === undefined &&
      (active?.length ?? 0) === 0 &&
      carried.length === 0
        ? undefined
        : prepareHumanPoseResolution(source);

    // Fade branches have different under-postures and fit seeds, but read
    // each overlay's raw plan, fade weight and ordinal at the same local
    // second: each is read once, before the branches.
    const live: readonly IAutoMovieMotionHumanSegment.IOverlay[] = active ?? [];
    const postures: IAutoMovieMotionHumanPosture[] = live.map(
      (
        overlay: IAutoMovieMotionHumanSegment.IOverlay,
      ): IAutoMovieMotionHumanPosture => postureAt(overlay),
    );
    const weights: number[] = live.map(
      (overlay: IAutoMovieMotionHumanSegment.IOverlay): number =>
        // An overlay handing its channels on to the act after it in its
        // chain keeps them to its end (`handsOn`), so the act after it
        // enters from where it ended and blends in from it, not from the
        // carrier.
        Math.min(
          AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.min(
              1,
              Math.max(0, (seconds - overlay.entryTime) / HumanSegment.FADE),
            ),
          ),
          HumanSegmentOverlayRun.released(person, overlay, seconds),
        ),
    );
    const ordinals: number[] = live.map(
      (overlay: IAutoMovieMotionHumanSegment.IOverlay): number =>
        person.overlays.indexOf(overlay),
    );
    const mergers: ReturnType<
      typeof AutoMovieMotionHumanChannel.prepareMerge
    >[] = live.map(
      (
        overlay: IAutoMovieMotionHumanSegment.IOverlay,
      ): ReturnType<typeof AutoMovieMotionHumanChannel.prepareMerge> =>
        AutoMovieMotionHumanChannel.prepareMerge(overlay.channels),
    );
    const blender: ReturnType<typeof blendHumanJoint.prepare> | undefined =
      live.length === 0 ? undefined : blendHumanJoint.prepare(body);
    function postureAt(
      overlay: IAutoMovieMotionHumanSegment.IOverlay,
    ): IAutoMovieMotionHumanPosture {
      const plan: IAutoMovieMotionHumanSegment.IOverlay["plan"] = overlay.plan;
      const reader: typeof plan.posture = plan.posture;
      const local: number = Math.min(
        plan.duration,
        Math.max(0, seconds - overlay.start),
      );
      const sample: IAutoMovieMotionHumanPlayback.ISample | undefined =
        HumanPreparedPlayback.read(
          plan,
          body,
          reader,
          false,
          false,
          local,
          undefined,
          resolution,
          projection,
        );
      return (
        sample?.posture ??
        Reflect.apply(reader, plan, [local, undefined, resolution, projection])
      );
    }
    function build(
      k: number,
      under: IAutoMovieMotionHumanPosture,
      used: readonly IAutoMovieMotionHumanSegment.IOverlay[],
      tag: string,
      repeated: boolean,
    ): IBuildResult {
      const overlay: IAutoMovieMotionHumanSegment.IOverlay | undefined =
        active?.[k];
      if (overlay === undefined) {
        // Kept legs in a legs-still window (`HumanSegmentLegs`).
        const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
          HumanSegmentLegs.resolved(
            person,
            carrier,
            seconds,
            under,
            !HumanSegmentPoseSeeds.continues(near) && observed === undefined,
            (
              posture: IAutoMovieMotionHumanPosture,
            ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded => {
              const seedsForLeaf: ReturnType<typeof overlayContinuations> =
                overlayContinuations(posture.limbs, near, tag);
              const demand: ReturnType<typeof unplantedHumanObservation> =
                unplantedHumanObservation(posture.limbs, observed);
              const taken:
                | IAutoMovieMotionHumanResolveHumanPosture.ISeeded
                | undefined =
                sample?.posture === posture &&
                demand === undefined &&
                (seedsForLeaf === undefined ||
                  Object.keys(seedsForLeaf).length === 0)
                  ? sample.takeFit?.()
                  : undefined;
              if (taken !== undefined) return taken;
              if (direct?.posture === posture) {
                const assembly: resolveHumanPostureSource.IAssembled = direct;
                direct = undefined;
                return resolveHumanPostureSource.fit(
                  body,
                  assembly,
                  undefined,
                  seedsForLeaf,
                  resolution,
                  demand,
                );
              }
              return resolveHumanPosture.seeded(
                body,
                posture,
                undefined,
                seedsForLeaf,
                resolution,
                demand,
                projection,
              );
            },
          );
        for (const [limb, seed] of Object.entries(fitted.seeds))
          seeds.set(`leaf:${tag}:${limb}`, seed ?? null);
        let leaf: IAutoMoviePose = fitted.pose;
        for (const [limb, goal] of HumanSegmentCarry.carries(
          person,
          carried.filter(
            (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
              !used.some((o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
                HumanSegment.drives(o.plan, h.side),
              ),
          ),
          resolution,
          prepared,
        )) {
          const name: string = `carry:${tag}:${limb}`;
          // The leaf is this evaluation's own pose, so the fit's result is
          // used as solved, without the public entry's complete clone.
          const carry: IAutoMovieSeededChainFit = HumanLimbFit.fit(
            body,
            leaf,
            limb,
            goal,
            ["left", "right"],
            undefined,
            HumanSegmentPose.nearby(near, name),
            resolution,
          );
          seeds.set(name, carry.seed);
          HumanSegmentCarry.decide(
            person,
            limb === "leftArm" ? "left" : "right",
            goal,
            carry.pose,
            resolution,
          );
          leaf = carry.pose;
        }
        return { pose: leaf, contacts: {} };
      }
      const written: IAutoMovieMotionHumanPosture = mergers[k]!(
        under,
        postures[k]!,
      );
      const weight: number = weights[k]!;

      // The prefix names exactly the included overlays, in their original
      // first-index order; each leaf keeps its previous fit names.
      const ordinal: number = ordinals[k]!;
      const revisited: boolean = repeated || !(weight >= 1);
      const over: ReturnType<typeof build> = build(
        k + 1,
        written,
        [...used, overlay],
        tag === "" ? `${ordinal}` : `${tag},${ordinal}`,
        revisited,
      );
      const contacts: IAutoMovieMotionHumanPosture["limbs"] = {
        ...overlayContactGoals(
          overlay,
          written,
          over.pose,
          seconds,
          person,
          weight,
          resolution,
        ),
        ...over.contacts,
      };
      if (weight >= 1) return { pose: over.pose, contacts };
      const without: IAutoMoviePose = build(
        k + 1,
        under,
        used,
        tag,
        revisited,
      ).pose;

      // Array.find used the first occurrence on each side. Keep that
      // convention and the union's lower-then-upper insertion order.
      const joints: Map<
        AutoMovieHumanoidBone,
        [IAutoMovieJointPose | undefined, IAutoMovieJointPose | undefined]
      > = new Map();
      for (const joint of without.joints)
        if (!joints.has(joint.bone)) joints.set(joint.bone, [joint, undefined]);
      for (const joint of over.pose.joints) {
        const pair:
          | [IAutoMovieJointPose | undefined, IAutoMovieJointPose | undefined]
          | undefined = joints.get(joint.bone);
        if (pair === undefined) joints.set(joint.bone, [undefined, joint]);
        else if (pair[1] === undefined) pair[1] = joint;
      }
      const owned: Set<AutoMovieHumanoidBone> = new Set();
      for (const bone of joints.keys())
        if (AutoMovieMotionHumanChannel.covers(overlay.channels, bone))
          owned.add(bone);

      // Keep unowned records borrowed and ordered; owned joints are fresh.
      const pose: IAutoMoviePose = {
        ...without,
        joints: [],
      };
      for (const joint of without.joints)
        if (!owned.has(joint.bone)) pose.joints.push(joint);
      // A channel acquired by the action from the actual displayed carrier already
      // owns its entry curve. It still releases to the carrier at the overlay end.
      const entered: IAutoMovieMotionHumanActionPlan["enteredChannels"] =
        overlay.plan.enteredChannels;
      const release: number =
        entered === undefined
          ? weight
          : HumanSegmentOverlayRun.released(person, overlay, seconds);
      // A hand that holds a prop on past the overlay's end hands its arm and
      // fingers on whole at the end to what carries the hold next (the
      // carrier's carry of it, `HumanSegmentCarry`), captured where the
      // overlay leaves them: they come in with the overlay but are not
      // released to the carrier's own arm over the fade, which would carry
      // the held prop away and back.
      const coming: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(
          1,
          Math.max(0, (seconds - overlay.entryTime) / HumanSegment.FADE),
        ),
      );
      // Whether each hand of this overlay holds a prop on past its end
      // (`HumanSegmentOverlayRun.holdsOn`), read once for the overlay.
      const holding: Record<AutoMovieHumanSide, boolean> = {
        left: HumanSegmentOverlayRun.holdsOn(person, overlay, "left"),
        right: HumanSegmentOverlayRun.holdsOn(person, overlay, "right"),
      };
      for (const bone of owned) {
        const pair: [
          IAutoMovieJointPose | undefined,
          IAutoMovieJointPose | undefined,
        ] = joints.get(bone)!;
        const from: readonly [number, number, number] = angles(pair[0]);
        const to: readonly [number, number, number] = angles(pair[1]);
        const channel: ReturnType<typeof AutoMovieMotionHumanChannel> =
          AutoMovieMotionHumanChannel(bone);
        const side: AutoMovieHumanSide | undefined = bone.startsWith("left")
          ? "left"
          : bone.startsWith("right")
            ? "right"
            : undefined;
        const share: number =
          ((side === "left" && contacts.leftArm !== undefined) ||
            (side === "right" && contacts.rightArm !== undefined)) &&
          channel.endsWith("Hand")
            ? 1
            : side !== undefined &&
                (channel.endsWith("Arm") || channel.endsWith("Hand")) &&
                holding[side]
              ? coming
              : entered?.includes(channel)
                ? release
                : weight;
        const [flexion, abduction, twist]: readonly [number, number, number] =
          blender === undefined
            ? blendHumanJoint(body, bone, from, to, share)
            : blender(bone, from, to, share);
        pose.joints.push({ bone, flexion, abduction, twist });
      }
      return { pose, contacts };
    }
    const built: ReturnType<typeof build> = build(0, posture, [], "", false);

    // Every pose `build` returns is assembled or fitted in this evaluation,
    // so the private refit may share its untouched records.
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      refitHumanPosture(
        body,
        built.pose,
        built.contacts,
        overlayContinuations(built.contacts, near) ?? {},
        resolution,
      );
    for (const [limb, seed] of Object.entries(fitted.seeds))
      seeds.set(`contact:${limb}`, seed ?? null);
    return { pose: fitted.pose, seeds, contacts: built.contacts };
  }

  /** The overlays that run at a second (`HumanSegmentOverlayRun.running`). */
  export const running: typeof HumanSegmentOverlayRun.running =
    HumanSegmentOverlayRun.running;

  /**
   * Read a state with the overlays that end at a second handing their channels
   * on there (`HumanSegmentOverlayRun.handing`).
   */
  export const handing: typeof HumanSegmentOverlayRun.handing =
    HumanSegmentOverlayRun.handing;

  /** A fresh clinical tuple, without a closure for each interior fade branch. */
  function angles(
    joint: IAutoMovieJointPose | undefined,
  ): readonly [number, number, number] {
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  }
}

/** The record of `IBuildResult`'s site. */
type IBuildResult = {
  pose: IAutoMoviePose;
  contacts: IAutoMovieMotionHumanPosture["limbs"];
};

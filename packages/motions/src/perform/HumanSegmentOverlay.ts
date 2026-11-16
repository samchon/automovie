import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  minimumJerk,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

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
    contacts: IHumanPosture["limbs"];
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
   * Every branch reads one overlay's raw posture and fade weight at the
   * same local second, so each is evaluated once per call. Branches still
   * resolve their own under-postures and named limb fits independently.
   * Leaf, carry and contact fits keep their own poses and seeds while exact
   * FK dependency arithmetic may be shared within this evaluation.
   * Multi-joint fades prepare the unchanged rig's blend metadata lazily;
   * every joint still performs its own interpolation on its actual ends.
   *
   * @param person The person.
   * @param posture The carrier's posture at the second, layers applied.
   * @param seconds Film seconds.
   * @param carried The holds the carrier carries at the second.
   * @param near The fits of a nearby second to continue, if any.
   * @param source Optional same-body synchronous parent FK source; never retained by a result.
   * @param requested Optional bone observation, forwarded only with no holds/near/current contact window and no base or leaf plant, so no later IK consumes omitted digit geometry.
   * @param projection Optional genuine same-body ROM projection borrowed by each actual leaf's direct-joint assembly.
   * @returns The pose, the seeds of its fits and its open contact goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fade, carry, contact and seed behavior and which raw posture and weight evaluations are shared.
   * @evidence contracts/development/implementation.md#principled-implementation Each branch merges the same overlay's pure posture at the same local second onto its own under-posture; fade and final contact fits retain their original order. Plan contacts, hands and channel claims stay unchanged within the call, so metadata decisions are shared. Exact contact FK needs the body's unchanged skeleton topology; prepared blending additionally requires its constraints and clinical axes unchanged throughout this synchronous evaluation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lazy posture/weight slots and prepared fixed-claim mergers feed the recursive branch builder, then ordinary contact refitting. Exact-name continuation and attachment admission retain their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All active overlay branches, fade weights, seed names and contact windows remain. rebased transfers only existing issued-source provenance; the resolver still admits/clamps current joints and accepts an unchanged free-leg solution only after its exact raw/root/ancestor/body checks. Every changed or unsupported fit remains native.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each demanded overlay samples raw posture, weight and ordinal once per query. Fixed claims classify encountered bone names once per merger; no-digit merges omit digit-goal traversal. Contact windows are scanned once and missing explicit goals demand only their effector/lower FK ancestry. Up to 2^N fade leaves remain for N simultaneous partial overlays; checked source-leg reuse or bare observational selection may avoid only their proven independent fits. Runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw posture, scalar fade weight, original ordinal, fixed claims, hand-drive metadata and unchanged-rig blend preparation share within this query. The same synchronous FK source reaches each actual overlay plan's raw producer and canonical leaf/contact consumers. Source provenance survives a raw merge only so the resolver can revalidate actual current free-leg dependencies; distinct goals, near contexts and all other fits remain separate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Query-owned slots, mergers and their bone booleans, branch indexes, optional blender and local lazy FK supplier release on return or throw. A borrowed parent reader stays with its synchronous parent. Raw merge provenance follows only the raw candidate's weak lifetime at the resolver; returned canonical poses, seed maps and contact goals retain no query context or reader.
   */
  export function overlaid(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
    carried: readonly HumanSegment.IHeld[] = [],
    near?: HumanSegmentPose.INear,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IOverlaid {
    const body: IHumanBody = person.performer.body;
    const active: HumanSegment.IOverlay[] | undefined =
      person.overlays.length === 0 ? undefined : running(person, seconds);
    const seeds: HumanSegmentPose.IFits = new Map();
    const observed: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      requested !== undefined && near === undefined && carried.length === 0 && !active?.some(
        (overlay: HumanSegment.IOverlay): boolean => overlay.plan.contacts.some(
          (window: IHumanContactWindow): boolean => {
            const share: number = (seconds - overlay.start) / overlay.plan.duration;
            return share >= window.from && share <= window.to;
          },
        ),
      ) ? requested : undefined;

    // A bare leaf already owns its refit's FK. Additional stages may borrow
    // one reader here, but memory hits and no-FK paths never create it.
    const resolution: (() => ReturnType<typeof preparePoseResolution>) | undefined =
      source === undefined && (active?.length ?? 0) === 0 && carried.length === 0
        ? undefined
        : prepareHumanPoseResolution(source);

    // Fade branches have different under-postures and fit seeds, but read
    // each overlay's raw plan and fade weight at the same local second.
    let postures: (IHumanPosture | undefined)[] | undefined;
    let weights: (number | undefined)[] | undefined;
    let ordinals: (number | undefined)[] | undefined;
    let ownership: (Map<AutoMovieHumanoidBone, boolean> | undefined)[] | undefined;
    let blender: ReturnType<typeof blendHumanJoint.prepare> | undefined;
    let driving:
      | Map<HumanSegment.IOverlay, Partial<Record<"left" | "right", boolean>>>
      | undefined;
    const mergers: (ReturnType<typeof AutoMovieMotionHumanChannel.prepareMerge> | undefined)[] = [];
    function drives(
      overlay: HumanSegment.IOverlay,
      side: "left" | "right",
    ): boolean {
      let sides: Partial<Record<"left" | "right", boolean>> | undefined =
        driving?.get(overlay);
      if (sides === undefined) {
        sides = {};
        (driving ??= new Map()).set(overlay, sides);
      }
      return (sides[side] ??= HumanSegment.drives(overlay.plan, side));
    }
    function build(
      k: number,
      under: IHumanPosture,
      used: readonly HumanSegment.IOverlay[],
      tag: string,
      repeated: boolean,
    ): { pose: IAutoMoviePose; contacts: IHumanPosture["limbs"] } {
      const overlay: HumanSegment.IOverlay | undefined = active?.[k];
      if (overlay === undefined) {
        const fitted: resolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
          body,
          under,
          undefined,
          continuations(under.limbs, near, tag),
          resolution,
          unplantedHumanObservation(under.limbs, observed),
          projection,
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
                drives(o, h.side),
              ),
          ),
          resolution,
        )) {
          const name: string = `carry:${tag}:${limb}`;
          const carry: IAutoMovieSeededChainFit =
            resolveHumanPosture.limbSeeded(
              body,
              leaf,
              limb,
              goal,
              HumanSegmentPose.nearby(near, name),
              resolution,
            );
          seeds.set(name, carry.seed);
          leaf = carry.pose;
        }
        return { pose: leaf, contacts: {} };
      }
      const written: IHumanPosture = resolveHumanPosture.rebased(under, (mergers[k] ??=
        AutoMovieMotionHumanChannel.prepareMerge(overlay.channels))(
        under,
        ((postures ??= [])[k] ??= overlay.plan.posture(
          Math.min(overlay.plan.duration, Math.max(0, seconds - overlay.start)),
          undefined,
          resolution,
          projection,
        )),
      ));
      const weight: number = ((weights ??= [])[k] ??= Math.min(
        minimumJerk.share(
          Math.min(
            1,
            Math.max(0, (seconds - overlay.entryTime) / HumanSegment.FADE),
          ),
        ),
        minimumJerk.share(
          Math.min(1, Math.max(0, (overlay.end - seconds) / HumanSegment.FADE)),
        ),
      ));

      // The prefix names exactly the included overlays, in their original
      // first-index order; each leaf keeps its previous fit names.
      const ordinal: number = ((ordinals ??= [])[k] ??=
        person.overlays.indexOf(overlay));
      const revisited: boolean = repeated || !(weight >= 1);
      const over: ReturnType<typeof build> = build(
        k + 1,
        written,
        [...used, overlay],
        tag === "" ? `${ordinal}` : `${tag},${ordinal}`,
        revisited,
      );
      const contacts: IHumanPosture["limbs"] = {
        ...contactGoals(
          overlay,
          written,
          over.pose,
          seconds,
          person,
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
      for (const bone of joints.keys()) {
        let covered: boolean | undefined = repeated
          ? ownership?.[k]?.get(bone)
          : undefined;
        if (covered === undefined) {
          covered = AutoMovieMotionHumanChannel.covers(overlay.channels, bone);
          if (repeated)
            ((ownership ??= [])[k] ??= new Map()).set(bone, covered);
        }
        if (covered) owned.add(bone);
      }

      // Keep unowned records borrowed and ordered; owned joints are fresh.
      const pose: IAutoMoviePose = {
        ...without,
        joints: [],
      };
      for (const joint of without.joints)
        if (!owned.has(joint.bone)) pose.joints.push(joint);
      for (const bone of owned) {
        const pair: [
          IAutoMovieJointPose | undefined,
          IAutoMovieJointPose | undefined,
        ] = joints.get(bone)!;
        const from: readonly [number, number, number] = angles(pair[0]);
        const to: readonly [number, number, number] = angles(pair[1]);
        const share: number =
          ((bone.startsWith("left") && contacts.leftArm !== undefined) ||
            (bone.startsWith("right") && contacts.rightArm !== undefined)) &&
          AutoMovieMotionHumanChannel.of(bone).endsWith("Hand")
            ? 1
            : weight;
        if (
          blender === undefined &&
          owned.size > 1 &&
          share > 0 &&
          share < 1
        )
          blender = blendHumanJoint.prepare(body);
        const [flexion, abduction, twist]: readonly [number, number, number] =
          blender === undefined
            ? blendHumanJoint(body, bone, from, to, share)
            : blender(bone, from, to, share);
        pose.joints.push({ bone, flexion, abduction, twist });
      }
      return { pose, contacts };
    }
    const built: ReturnType<typeof build> = build(0, posture, [], "", false);
    const fitted: resolveHumanPosture.ISeeded = resolveHumanPosture.refit(
      body,
      built.pose,
      built.contacts,
      continuations(built.contacts, near),
      resolution,
    );
    for (const [limb, seed] of Object.entries(fitted.seeds))
      seeds.set(`contact:${limb}`, seed ?? null);
    return { pose: fitted.pose, seeds, contacts: built.contacts };
  }

  /** A fresh clinical tuple, without a closure for each interior fade branch. */
  function angles(
    joint: IAutoMovieJointPose | undefined,
  ): readonly [number, number, number] {
    return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
  }

  /**
   * Matching nearby fits for a leaf tag, or the final contacts without one.
   * Keep attachment-cycle validation before pose resolution even when no
   * nearby fit exists; undefined then uses the resolver's empty-near default
   * without constructing four unused lookup keys and intermediate arrays.
   */
  function continuations(
    limbs: IHumanPosture["limbs"],
    near: HumanSegmentPose.INear | undefined,
    tag?: string,
  ): resolveHumanPosture.INear | undefined {
    const ordered: IHumanPosture.Limb[] = resolveHumanPosture.order(limbs);
    if (near === undefined) return undefined;
    const prefix: string = tag === undefined ? "contact" : `leaf:${tag}`;
    return Object.fromEntries(
      ordered.flatMap(
        (
          limb: IHumanPosture.Limb,
        ): [IHumanPosture.Limb, IAutoMovieSwivelNear][] => {
          const continued: IAutoMovieSwivelNear | undefined =
            HumanSegmentPose.nearby(near, `${prefix}:${limb}`);
          return continued === undefined ? [] : [[limb, continued]];
        },
      ),
    );
  }

  /**
   * The active limb contacts of one overlay, before fading moves them.
   * A joint-only path contributes its complete displayed limb frame; an
   * authored goal keeps every member, including its attached frame and
   * contact pivot. The root turn is applied only to world goals.
   *
   * States both representations and the coordinate convention.
   * Retains a contact constraint over its declared time window; without an explicit goal, its already planned rigid end frame and bend define the same limb constraint.
   * One scan of the contact windows and one fresh, lazily posed bone map; the enclosing evaluation may lend the same exact FK reader to leaf, carried-frame and contact fits.
   * Copies an authored goal intact rather than replacing its contact pivot or attachment with a wrist point. Without a whole-body rotation, the turn owner returns the same limbs unchanged, so no unused root heading is constructed here; a rotation still runs its complete plant refusal and turning policy.
   * Linear in the plan's contact windows; poses the bones only for a joint-only contact.
   * Uses turnHumanPosture, HumanLimbFit.chain and the resolver's reference convention.
   * The enclosing synchronous evaluation owns the FK context; returned goals contain fresh transform values and retain no context or reader.
   */
  function contactGoals(
    overlay: HumanSegment.IOverlay,
    written: IHumanPosture,
    over: IAutoMoviePose,
    seconds: number,
    person: HumanSegment.IPerson,
    resolution?: () => ReturnType<typeof preparePoseResolution>,
  ): IHumanPosture["limbs"] {
    const share: number = (seconds - overlay.start) / overlay.plan.duration;
    const contacts: IHumanPosture["limbs"] = {};
    const turned: IHumanPosture["limbs"] =
      written.rotation === undefined
        ? written.limbs
        : turnHumanPosture(written).limbs;
    let requested: Set<AutoMovieHumanoidBone> | undefined;
    let selected: Map<IHumanPosture.Limb, IHumanPosture.IGoal | undefined> | undefined;
    for (const window of overlay.plan.contacts) {
      if (share < window.from || share > window.to) continue;
      const limb: IHumanPosture.Limb | undefined = limbOf(window.part);
      if (limb === undefined || !overlay.channels.includes(limb)) continue;
      const goal: IHumanPosture.IGoal | undefined = turned[limb];
      (selected ??= new Map()).set(limb, goal);
      if (goal !== undefined) continue;
      const chain: ReturnType<typeof HumanLimbFit.chain> =
        HumanLimbFit.chain(limb);
      (requested ??= new Set()).add(chain.effector);
      requested.add(chain.lower);
    }
    if (selected === undefined) return contacts;
    const placed: ReturnType<typeof poseBones> | undefined =
      requested === undefined
        ? undefined
        : poseBones(person.performer.body, over, resolution?.(), requested);
    for (const [limb, goal] of selected) {
      if (goal !== undefined) {
        contacts[limb] = { ...goal, planted: true };
        continue;
      }
      const chain: ReturnType<typeof HumanLimbFit.chain> = HumanLimbFit.chain(limb);
      const end: IAutoMovieResolvedBone = placed!.get(chain.effector)!;
      contacts[limb] = {
        point: end.worldPosition,
        rotation: end.worldRotation,
        bend: placed!.get(chain.lower)!.worldPosition,
        reference: resolveHumanPosture.reference(over, limb),
        planted: true,
      };
    }
    return contacts;
  }

  /** The limb carrying a contact part, if the part belongs to a limb. */
  function limbOf(
    part: IHumanContactWindow["part"],
  ): IHumanPosture.Limb | undefined {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film-second input, placement-order output and inclusive comparisons with the existing endpoint allowance.
   * @evidence contracts/development/implementation.md#principled-implementation Filters the person's placed overlays by their active entry and end instants, retaining the existing 1e-12-second comparison allowance at both endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered filter owns active-overlay selection; posture composition remains with the overlay evaluator.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads every overlay's actual interval without changing contact windows, ordering or physical tolerances.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans N placed overlays in O(N) time and allocates an array of the K active references, O(K) space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each query reads current overlay intervals and seconds; no persistent selection cache assumes unchanged placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned array of borrowed overlays and retains no query, person or external handle.
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

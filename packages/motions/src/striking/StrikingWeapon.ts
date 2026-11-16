import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickForm } from "./KickForm";

/**
 * A striking limb as the capsule weapons the performance's joint contact
 * resolution sweeps: the limb's joints read from the striking action's own
 * free course, its posture fitted at the asked second, which is what the
 * figure shows until the performance commits a stop, so the resolution meets
 * the limb as it moves, wherever along it a body is first met. The
 * performer's displayed bones cannot serve: a performer reading their own
 * body is read as they entered the action (`IHumanActionContext.performer`),
 * which left the capsules on the entry's resting limb. A limb that narrows
 * from one joint to the next is a tapered capsule between the two girths, so
 * a capsule never carries the widest girth of its segment to the joint where
 * the shown limb has narrowed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States free-course ownership, capsule coverage, world-frame sampling and tapered girths.
 * @evidence contracts/development/design.md#principled-representation Uses the existing plan weapons, canonical body and vector types; weak constructor metadata records only chain/index correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Provides actual fitted limb axes, capsule construction, girths, first-contact selection and synchronous complete-axis sampling to the performance consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose/time answer is stored; chain metadata preserves the existing body/course owner and all physical fits remain with resolveHumanPosture.
 */
export namespace StrikingWeapon {
  /**
   * The striking action's free course: its posture at a film second before
   * any committed stop moves it.
   *
   * @param seconds Film seconds.
   * @param channels Optional observational channels whose values must equal the complete course; unsupported producers may return the complete posture.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the absolute film-time input and free-course posture output.
   * @evidence contracts/development/design.md#principled-representation Reuses the authored posture representation with a numeric film-second argument.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One pure time reader is sufficient for fitting the actual limb.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A callback leaves the actual action law responsible for its free course.
   */
  export type Course = (seconds: number, channels?: readonly AutoMovieMotionHumanChannel[]) => IHumanPosture;

  /**
   * A striking arm at a film second, fitted on its action's free course:
   * the shoulder, the elbow, the wrist, and the fist's axis end one forearm
   * radius behind the knuckles, so a capsule of that radius from the wrist
   * ends on the knuckles.
   *
   * @param body The performer's body.
   * @param course The action's free course.
   * @param side The arm's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States side, film time, fitted course and axis order including the fist-radius offset.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the actual authored posture before placing its canonical shoulder, elbow, wrist and fist socket.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared fitted reader owns pose/FK and posed owns arm endpoint geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every limb fit, ROM clamp and canonical socket; FK computes only the three requested arm outputs and their ancestors.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays the actual whole-posture fit plus admitted-joint scan and requested-arm FK ancestry, with four returned vectors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the pose/FK and socket owners; operation-local grouped sampling shares this actual read only within one chain/time/context.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each call owns its pose/map until return or throw; only endpoint vectors escape, with no query history.
   */
  export function arm(
    body: IHumanBody,
    course: Course,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3[] {
    return posed(body, fitted(body, course, seconds, ENDS[`${side}Arm`]), side);
  }

  /**
   * An arm's axis ends on posed bones: the shoulder, the elbow, the wrist,
   * and the fist's axis end one forearm radius behind the knuckles.
   *
   * @param body The arm's body.
   * @param bones Its posed bones, world frame.
   * @param side The arm's side.
   * @returns The four axis ends, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the already-fitted world map, side and fist-axis offset.
   * @evidence contracts/development/implementation.md#principled-implementation Places the canonical knuckles then retreats one forearm radius along the wrist-to-knuckle axis, bounded at the wrist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One socket placement and four ordered endpoints expose the capsule joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses body-measured radius and actual world frames; the original 1e-9 divisor guard is unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant map lookups and rigid/vector work, without a fit or full scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the caller's already-fitted bone frames; creates only the fist-axis end.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned array borrows existing bone positions and owns its new fist end.
   */
  export function posed(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): IAutoMovieVector3[] {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const knuckles: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"],
      hand,
    ).point;
    const reach: IAutoMovieVector3 = Vector3.subtract(
      knuckles,
      hand.worldPosition,
    );
    const length: number = Vector3.length(reach);
    const r: number = body.measure.forearmRadius;
    return [
      bones.get(`${side}UpperArm`)!.worldPosition,
      bones.get(`${side}LowerArm`)!.worldPosition,
      hand.worldPosition,
      Vector3.add(
        hand.worldPosition,
        Vector3.scale(reach, Math.max(0, length - r) / Math.max(1e-9, length)),
      ),
    ];
  }

  /**
   * A striking leg at a film second, fitted on its action's free course: the
   * hip, the knee, the ankle and the ball of the foot.
   *
   * @param body The performer's body.
   * @param course The action's free course.
   * @param side The leg's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States side, film time and ordered hip/knee/ankle/ball outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Fits the actual course then reads canonical leg joints and places the ball socket with the fitted foot frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fit/FK followed by four endpoint reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every fit affecting the requested leg and all authored ROM admission; the posture owner's conservative dependency rule may omit only proven unrelated free goals, with full fallback for unsupported context.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays the requested leg's dependent physical fits, admitted-joint scan and FK ancestry plus constant socket work; unsupported coupling retains the original complete resolution cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses canonical fit/FK/socket owners; grouped sampling may share the resulting chain only in one exact synchronous read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary pose and map end at return or throw; only four endpoint vectors escape.
   */
  export function leg(
    body: IHumanBody,
    course: Course,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fitted(
      body,
      course,
      seconds,
      ENDS[`${side}Leg`],
      LEG_CHANNELS[side],
    );
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return [
      bones.get(`${side}UpperLeg`)!.worldPosition,
      bones.get(`${side}LowerLeg`)!.worldPosition,
      foot.worldPosition,
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"],
        foot,
      ).point,
    ];
  }

  /** The bones of a course's posture at a film second, its limbs fitted to their goals. */
  function fitted(
    body: IHumanBody,
    course: Course,
    seconds: number,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    channels?: readonly AutoMovieMotionHumanChannel[],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const pose: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture.seeded(
      body, course(seconds, channels), undefined, {}, undefined, requested,
    ).pose;
    return poseBones(body, pose, undefined, requested);
  }

  /**
   * A limb's capsules.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its order, seconds, world metres and tapered-radius convention.
   * @evidence contracts/development/design.md#principled-representation A chain owns one fitted course and adjacent endpoints for its existing plan weapons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only ids, limb, radii, live span and actual axis ends are required to construct and sample capsules.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses plan limb and vector types without storing a pose, approximation or contact outcome.
   */
  export interface IChain {
    /** One id per capsule, from the trunk outward. */
    ids: readonly string[];

    /** The limb that carries them. */
    limb: IHumanActionPlan.IWeapon["limb"];

    /**
     * One radius per capsule, metres: one number for a capsule of one
     * radius, or the radii at its two axis ends for a tapered capsule, as a
     * limb narrows from one joint's girth to the next.
     */
    radii: readonly (number | readonly [number, number])[];

    /** Film second they become live. */
    from: number;

    /** Film second they stop being live. */
    to: number;

    /**
     * The capsules' axis ends at a film second, one more than the capsules:
     * capsule `i` runs from end `i` to end `i + 1`.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    ends(seconds: number): readonly IAutoMovieVector3[];
  }

  /**
   * A limb's capsules as weapons.
   *
   * @param chain The capsules.
   * @returns One weapon per id.
   * @throws {Error} When the radii do not match the ids.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one-id/one-radius constraint and original plan-weapon result.
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent actual chain ends define each sphere-swept or tapered capsule with its authored radius and live interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered map constructs weapons and records their chain/index correspondence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Radius-count mismatch throws; existing individual path/tail callbacks and physical dimensions remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(W) setup and weak metadata for W capsules; actual course work is deferred to requested samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Weak metadata proves which endpoints belong to one chain and permits explicit same-operation grouped reads.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weak weapon key keeps only its chain/index while that weapon remains live; no sampled vectors, time history or handles are retained.
   */
  export function capsules(chain: IChain): IHumanActionPlan.IWeapon[] {
    if (chain.radii.length !== chain.ids.length)
      throw new Error("A weapon chain has one radius per capsule");
    return chain.ids.map(
      (id: string, i: number): IHumanActionPlan.IWeapon => {
        const weapon: IHumanActionPlan.IWeapon = {
          id,
          limb: chain.limb,
          ...radius(chain.radii[i]!),
          from: chain.from,
          to: chain.to,
          path: (seconds: number): IAutoMovieVector3 => chain.ends(seconds)[i]!,
          tail: (seconds: number): IAutoMovieVector3 =>
            chain.ends(seconds)[i + 1]!,
        };
        CHAINS.set(weapon, { chain, index: i });
        return weapon;
      },
    );
  }

  /**
   * A weapon's actual centre and optional other capsule end, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint order, world units and the sphere's absent end.
   * @evidence contracts/development/design.md#principled-representation A readonly pair keeps the centre and other end from one synchronous course evaluation together.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both complete-axis and grouped-weapon consumers need these two values only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and the existing sphere/capsule distinction without duplicating a pose or body representation.
   */
  export type IAxis = readonly [IAutoMovieVector3, IAutoMovieVector3 | undefined];

  /**
   * Read both ends of one weapon in one synchronous sample.
   *
   * @param weapon The original plan weapon, before consumer adapters wrap it.
   * @param seconds The exact film second requested by the consumer.
   * @returns Its centre and optional capsule end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States original weapon identity, absolute time, world units and the optional sphere end.
   * @evidence contracts/development/implementation.md#principled-implementation A registered capsule's two ends belong to one chain posture at one second; unregistered weapons retain their original path then tail callbacks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak metadata lookup selects a combined chain read or the existing independent callbacks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Evaluates the actual course and fit for every invocation; no sampled posture, endpoint or time survives the call.
   * @evidence contracts/development/implementation.md#efficient-algorithms Registered weapons evaluate their chain once for two adjacent ends, replacing two identical full fits/FK reads; unregistered work is unchanged and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The capsule constructor proves the two indexed ends share the same chain/body/course/second. Mutable stop-dependent work is rerun for each invocation and no result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak weapon keys retain only their owning chain/index while the plan owns the weapons; each read retains only its returned endpoint vectors, with no query history.
   */
  export function read(weapon: IHumanActionPlan.IWeapon, seconds: number): IAxis {
    const binding: IBinding | undefined = CHAINS.get(weapon);
    if (binding === undefined) return [weapon.path(seconds), weapon.tail?.(seconds)];
    const ends: readonly IAutoMovieVector3[] = binding.chain.ends(seconds);
    return [ends[binding.index]!, ends[binding.index + 1]!];
  }

  /**
   * Read requested weapons together at one exact second and context state.
   *
   * @param weapons Original plan weapons in the consumer's existing order.
   * @param seconds The exact film second of this synchronous sample.
   * @returns One axis per requested weapon, keyed by its original identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States original identities, ordered demand, exact time and operation scope.
   * @evidence contracts/development/implementation.md#principled-implementation Several capsules constructed from one chain share that chain's actual course/fit in this synchronous sample; distinct chains and unregistered weapons remain independent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A local chain-to-ends map serves one ordered weapon traversal and is discarded on return or failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every demanded chain still executes its full course and fit; no other second, actor, stop state, invocation or callback result is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms W weapons perform at most C chain evaluations for their C distinct registered chains plus each unregistered path/tail; metadata and returned axes use O(W+C) operation-local space. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only capsule-constructor metadata proves shared body/course/chain identity; one explicit invocation fixes time and caller state. The consumer releases the result before any state-changing stop application.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local chain map ends with return or throw; returned axes contain only endpoint vectors and weapon keys, and no cache enters any body or plan.
   */
  export function sample(
    weapons: readonly IHumanActionPlan.IWeapon[],
    seconds: number,
  ): ReadonlyMap<IHumanActionPlan.IWeapon, IAxis> {
    const chains: Map<IChain, readonly IAutoMovieVector3[]> = new Map();
    const axes: Map<IHumanActionPlan.IWeapon, IAxis> = new Map();
    for (const weapon of weapons) {
      const binding: IBinding | undefined = CHAINS.get(weapon);
      if (binding === undefined) {
        axes.set(weapon, read(weapon, seconds));
        continue;
      }
      let ends: readonly IAutoMovieVector3[] | undefined = chains.get(binding.chain);
      if (ends === undefined) {
        ends = binding.chain.ends(seconds);
        chains.set(binding.chain, ends);
      }
      axes.set(weapon, [ends[binding.index]!, ends[binding.index + 1]!]);
    }
    return axes;
  }

  /** Immutable metadata associating a capsule with its constructor-owned chain. */
  interface IBinding {
    /** The body/course/ends owner shared by this chain's capsules. */
    chain: IChain;

    /** The first of its adjacent ends. */
    index: number;
  }

  /** Weak metadata only; sampled poses and endpoints are never retained here. */
  const CHAINS: WeakMap<IHumanActionPlan.IWeapon, IBinding> = new WeakMap();

  /**
   * A shown leg's girths at its joints, metres, as its tapered capsules'
   * radii: the thigh narrows from its own radius at the hip to the shank's
   * at the knee, where the shown thigh meets the shank, and the shank from
   * there to the foot capsule's radius at the ankle (half the foot's depth,
   * `KickForm.FOOT_RADIUS_SHARE`), which the foot keeps to the ball.
   *
   * @param body The leg's body.
   * @returns The thigh's, the shank's and the foot's radii.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States joint order, tapered interfaces and metre units.
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent segment girths share the measured knee/ankle radii; the foot uses the existing FOOT_RADIUS_SHARE of ankle height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measure read builds the three declared capsule radii.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the named anatomical measurements and foot-radius share.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and three output radius records.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar construction with no repeated expensive work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function legRadii(
    body: IHumanBody,
  ): [readonly [number, number], readonly [number, number], number] {
    const m: IHumanBody["measure"] = body.measure;
    const foot: number = KickForm.FOOT_RADIUS_SHARE * m.ankleHeight;
    return [[m.thighRadius, m.shankRadius], [m.shankRadius, foot], foot];
  }

  /**
   * A shown arm's girths at its joints, metres, as its capsules' radii: the
   * upper arm narrows from its own radius at the shoulder to the forearm's
   * at the elbow, where the shown upper arm meets the forearm; the forearm
   * and the fist keep the forearm's radius, which places the fist's axis end
   * one radius behind the knuckles ({@link posed}).
   *
   * @param body The arm's body.
   * @returns The upper arm's, the forearm's and the fist's radii.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States capsule order, metre units and the shared elbow/fist girth.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the body's measured upper-arm and forearm radii at their existing shared segment interfaces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measure lookup builds three radius entries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual body's girths without an actor-specific constant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and output space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function armRadii(
    body: IHumanBody,
  ): [readonly [number, number], number, number] {
    const m: IHumanBody["measure"] = body.measure;
    return [
      [m.upperArmRadius, m.forearmRadius],
      m.forearmRadius,
      m.forearmRadius,
    ];
  }

  /**
   * A chain capsule's radius at a share of its axis from its first end.
   *
   * @param radii The capsule's radius or its two end radii.
   * @param share 0 at the first end, 1 at the other.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint shares, constant/tapered forms and metre units.
   * @evidence contracts/development/implementation.md#principled-implementation A tapered capsule linearly interpolates its two declared end radii.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar-or-pair branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the caller's exact share and declared radii.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function girth(
    radii: number | readonly [number, number],
    share: number,
  ): number {
    return typeof radii === "number"
      ? radii
      : radii[0] + (radii[1] - radii[0]) * share;
  }

  /** A capsule's radius members as a weapon carries them. */
  function radius(
    radii: number | readonly [number, number],
  ): Pick<IHumanActionPlan.IWeapon, "radius" | "tailRadius"> {
    return typeof radii === "number"
      ? { radius: radii }
      : { radius: radii[0], tailRadius: radii[1] };
  }

  /**
   * The first of an action's resolved contacts.
   *
   * @param events The action's weapons' contacts.
   * @returns The earliest, or null when the weapons met nothing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States earliest-event selection and the empty result.
   * @evidence contracts/development/implementation.md#principled-implementation A strict minimum retains the original first event on equal seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered pass and one retained minimum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves supplied event identities and tie order.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(E) time and constant extra space for E events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One ordered selection with no repeated work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond return.
   */
  export function first(
    events: readonly IHumanActionPlan.IContactEvent[],
  ): IHumanActionPlan.IContactEvent | null {
    let best: IHumanActionPlan.IContactEvent | null = null;
    for (const e of events)
      if (best === null || e.seconds < best.seconds) best = e;
    return best;
  }

  /**
   * The axis of one capsule of a chain.
   *
   * @param chain The capsules.
   * @param id The capsule's id.
   * @param seconds Film seconds.
   * @returns Its two axis ends, world metres.
   * @throws {Error} When the chain has no such capsule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the capsule id, exact film time, world endpoints and missing-id refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The id's chain index selects its two adjacent actual axis ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One id lookup, refusal and combined chain read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing ids throw and no nearest capsule is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(W) id lookup plus one actual chain evaluation for W capsules.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads both adjacent ends from the same actual chain evaluation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no query state.
   */
  export function axis(
    chain: Pick<IChain, "ids" | "ends">,
    id: string,
    seconds: number,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    const i: number = chain.ids.indexOf(id);
    if (i < 0) throw new Error(`A weapon chain has no capsule "${id}"`);
    const ends: readonly IAutoMovieVector3[] = chain.ends(seconds);
    return [ends[i]!, ends[i + 1]!];
  }
}

/** Fixed demanded limb outputs; FK still admits all joints and computes every required ancestor. */
const ENDS: Readonly<Record<IHumanPosture.Limb, ReadonlySet<AutoMovieHumanoidBone>>> = {
  leftArm: new Set<AutoMovieHumanoidBone>(["leftUpperArm", "leftLowerArm", "leftHand"]),
  rightArm: new Set<AutoMovieHumanoidBone>(["rightUpperArm", "rightLowerArm", "rightHand"]),
  leftLeg: new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "leftLowerLeg", "leftFoot"]),
  rightLeg: new Set<AutoMovieHumanoidBone>(["rightUpperLeg", "rightLowerLeg", "rightFoot"]),
};

/** A striking leg depends on its base and trunk, while arms are fitted later and cannot move it. */
const LEG_CHANNELS: Readonly<Record<"left" | "right", readonly AutoMovieMotionHumanChannel[]>> = {
  left: ["root", "trunk", "leftLeg"],
  right: ["root", "trunk", "rightLeg"],
};

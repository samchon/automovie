import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPostureRigSignature } from "./HumanPostureRigSignature";
import type { IHumanPosture } from "./IHumanPosture";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * Checked transport of one cold canonical free-leg solve. Only the explicit
 * producer's private evidence can lend that solve to a translated raw posture;
 * ordinary postures and copied/changed context retain ordinary resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source provenance, free-leg scope, explicit transport and ordinary fallback.
 * @evidence contracts/development/design.md#principled-representation A private actual solution plus exact raw/rig prerequisites proves translation equivariance; raw authoring demands remain separate from achieved joint output.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare, translated, carried and read serve the resolver and its jump COM/display producer without a general pose cache or caller-set resolved flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Evidence is held in private weak maps keyed by exact issued objects; a spread, forged wrapper, changed body, scalar mutation, base or continued seed cannot certify a prepared solution.
 */
export namespace HumanPosturePreparation {
  /**
   * One explicit preparation's independently owned public pose. The private
   * source and solution never alias this mutable observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual cold-solve provenance and independent public ownership.
   * @evidence contracts/development/design.md#principled-representation Exposes only the canonical pose needed for COM while opaque private evidence retains raw demands and fit metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The jump producer reads pose; translated/carried accept the issued wrapper as the ownership capability.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A structurally matching object cannot forge private weak-map membership, and mutating pose cannot alter the private source result.
   */
  export interface IPrepared {
    /** Fresh canonical output from the actual source resolution. */
    pose: IAutoMoviePose;
  }

  /**
   * Record one actual cold solve and snapshot its raw translation source.
   * The producer calls the resolver's ordinary cold seeded path itself.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines cold producer provenance, raw snapshot, public/private copies and eligibility scope.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the ordinary resolver once before recording its exact solution; only finite free world-leg demands with no extra context are eligible for translation equivalence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolver owns numerical admission/solving; this owner records raw/rig evidence and transfers fresh output observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No prior time, quantized key, fitted target or manually asserted resolved state supplies the solution; unsupported source contexts remain ineligible and resolve normally after translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds linear source/result copying and one rig scalar signature to the cold solve; an eligible same-query consumer can remove its duplicate IK, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The private source is copied after its ordinary solve and the same body, static FK snapshot, topology and live rig/table signature must still match at consumption.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each issued preparation owns one raw snapshot, one private seeded result and one signature; weak ownership releases them with its wrapper and transported postures, without a global time/result population.
   */
  export function prepare(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IPrepared {
    const solved: resolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
      body,
      { ...posture },
    );
    const raw: IHumanPosture = structuredClone(posture);
    const prepared: IPrepared = { pose: structuredClone(solved.pose) };
    SOURCES.set(prepared, {
      body,
      rig: body.poseResolution,
      topology: body.topology,
      signature: eligible(raw) ? HumanPostureRigSignature(body) : null,
      raw,
      solved: structuredClone(solved),
      legs: legInputs(body, raw),
    });
    return prepared;
  }

  /**
   * Translate the original raw root and world demands by one world-metre
   * displacement. Attached goals and external colliders keep their own frames.
   * Unsupported contexts still receive raw translation and ordinary resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States authoritative raw translation, attached/external frames and unsupported-context fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the new-minus-source root displacement to original world goal points/bends, digit points and whole-body turn centre, without substituting achieved endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private source lookup, one owned raw copy and one fixed-size world-demand pass feed carried's evidence check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves clinical angles, rotations, plants, contacts, limits and external shapes; only eligible free-leg context receives evidence, and an unissued wrapper is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies the source posture and its nested authoring data, then performs constant limb/digit translation work; no FK, clamping or numerical fit is performed here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The issued preparation supplies only its own raw source; carried validates its exact translated candidate and the consumer rechecks raw/rig prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns an independently owned raw posture whose weak private evidence borrows its preparation data; no input vector, callback, reader or prior-query history is retained.
   */
  export function translated(prepared: IPrepared, root: IAutoMovieVector3): IHumanPosture {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined) throw new Error("Unissued canonical posture preparation");
    const raw: IHumanPosture = translation(source.raw, root);
    if (source.signature !== null && eligible(raw))
      CARRIED.set(raw, { source, signature: rawSignature(raw) });
    return raw;
  }

  /**
   * Attach private evidence only to an exact translation of this preparation's
   * original raw source. A changed or unsupported posture is returned normally.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact source matching, raw preservation and silent ordinary fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Translation leaves clinical articulations and free-leg root-relative goals unchanged; strict ordered raw signatures verify the supplied candidate against the authoritative source-plus-displacement construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private issued-source lookup and exact supported-raw comparison establish candidate evidence; read owns final body/context validation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, target substitution, public resolved marker or source-goal removal is used; unrelated/modified context receives no evidence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes linear work in directly authored joints plus fixed goal count, without FK or a solver; each transported object stores one bounded raw signature.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact raw translation from the same issued source can share its cold solution; source body and current rig prerequisites are still checked at read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak candidate entry keeps its source and raw signature only while that candidate remains live; copied postures have no entry and no history collection grows by timestamp.
   */
  export function carried(prepared: IPrepared, posture: IHumanPosture): IHumanPosture {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source?.signature === null || source === undefined || !eligible(posture)) return posture;
    const expected: IHumanPosture = translation(source.raw, posture.root);
    const signature: string | undefined = rawSignature(posture);
    if (signature !== undefined && signature === rawSignature(expected)) CARRIED.set(posture, { source, signature });
    return posture;
  }

  /**
   * Carry only an already issued source capability across an explicit raw
   * composition. The new context receives no whole-pose proof; each free
   * leg must independently match its current prerequisites after clamping.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States explicit issued-source transfer, no whole-pose certification and per-leg consumer checks.
   * @evidence contracts/development/implementation.md#principled-implementation Composition can change an arm without changing a free leg's chain/ancestor inputs; transferring provenance allows the numerical consumer to check those dependencies rather than assume equivalence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This method transfers private source provenance only; reuseLegs owns exact current-dependency checks and original fitting owns all remaining goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An ordinary or forged source transfers nothing, and no public resolved flag or unchecked output is introduced; changed legs, roots, parents, goals, body/ROM or solve context still decline reuse.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes constant weak-map work and adds no FK or solve; the per-leg consumer separately pays current scalar checks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact issued source identity preserves provenance alone, never dependency equality; the new raw candidate is verified when consumed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One weak candidate entry borrows the original bounded source while that candidate lives, without retaining intermediate compositions or a time history.
   */
  export function rebased(from: IHumanPosture, to: IHumanPosture): IHumanPosture {
    const evidence: IEvidence | undefined = CARRIED.get(from);
    if (evidence !== undefined) CARRIED.set(to, { source: evidence.source });
    return to;
  }

  /**
   * Reuse only actual prepared free-leg results whose complete mutable
   * numerical prerequisites still match the current admitted direct pose.
   * The resolver calls this only without a base or continuation seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines post-clamp admission, cold context, per-leg proof and remaining-goal output.
   * @evidence contracts/development/implementation.md#principled-implementation A free-leg fit reads its source chain/ancestor articulations, root orientation, free goal and fixed rig; unchanged scalar inputs under one translation preserve its actual clinical output. Ancestors changed by another limb conservatively disable this proof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Private source provenance, one live rig signature and independent leg-input checks precede copied actual source joints/seeds/values; the original refit loop receives every remaining complete goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All current direct joints have already entered ordinary clamping; changed leg/goal/parent, rotation, digit or body/ROM context declines reuse. Raw goals remain untouched for audits, and current arm coupling/clearance and nonmatching legs still solve normally.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds a current rig scalar scan, at most two short ancestor/chain comparisons and O(B) result patching, removing only proven duplicate free-leg fits without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only an issued same-body cold source supplies data; exact raw goal translation, orientation and every chain/ancestor clinical scalar plus live rig/table signatures establish per-leg equivalence independently of changed unrelated arm inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Patching creates owned joints and metadata for this caller, borrows unchanged current pose data, and retains no result or candidate history; private source lifetime remains weakly owned by its preparation/transported postures.
   */
  export function reuseLegs(
    body: IHumanBody,
    posture: IHumanPosture,
    pose: IAutoMoviePose,
  ): { fitted: resolveHumanPosture.ISeeded; limbs: IHumanPosture["limbs"] } | undefined {
    const source: ISource | undefined = CARRIED.get(posture)?.source;
    if (
      source === undefined || source.body !== body || source.rig !== body.poseResolution ||
      source.topology !== body.topology || posture.rotation !== undefined || posture.digits !== undefined ||
      !Object.is(source.raw.yaw, posture.yaw) || !Object.is(source.raw.pitch, posture.pitch) ||
      !Object.is(source.raw.roll, posture.roll) || !finiteVector(posture.root) ||
      source.signature === null || source.signature !== HumanPostureRigSignature(body)
    ) return undefined;
    const kept: Leg[] = [];
    const delta: IAutoMovieVector3 = Vector3.subtract(posture.root, source.raw.root);
    for (const limb of LEGS) {
      const bones: readonly AutoMovieHumanoidBone[] | undefined = source.legs[limb];
      const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
      const original: IHumanPosture.IGoal | undefined = source.raw.limbs[limb];
      if (bones === undefined || goal === undefined || original === undefined) continue;
      if (!bones.every((bone: AutoMovieHumanoidBone): boolean => sameJoint(source.raw, posture, bone))) continue;
      if (!sameGoal(original, goal, delta)) continue;
      kept.push(limb);
    }
    if (kept.length === 0) return undefined;
    const written: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map();
    for (const joint of source.solved.pose.joints) written.set(joint.bone, joint);
    const changed: Set<AutoMovieHumanoidBone> = new Set();
    const seeds: resolveHumanPosture.ISeeded["seeds"] = {};
    const values: resolveHumanPosture.ISeeded["values"] = {};
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const limb of kept) {
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
      changed.add(chain.upper).add(chain.lower).add(chain.effector);
      seeds[limb] = structuredClone(source.solved.seeds[limb]);
      values[limb] = structuredClone(source.solved.values[limb]);
      delete limbs[limb];
    }
    return {
      fitted: {
        pose: { ...pose, joints: pose.joints.map((joint: IAutoMovieJointPose): IAutoMovieJointPose =>
          changed.has(joint.bone) ? { ...written.get(joint.bone)! } : joint,
        ) },
        seeds,
        values,
      },
      limbs,
    };
  }

  /**
   * Read a fresh independent copy of a proven translated cold solve, otherwise
   * decline so the ordinary resolver admits and solves the current request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact current context checks, fresh complete metadata and ordinary admission fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A free-leg pose is equivariant under world translation; unchanged clinical/raw goal scalars, body/rig/table inputs and cold context prove that the source's actual joint/seed/value solution applies at the translated root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolver checks base/near eligibility before this call; this owner checks issued evidence, exact current raw signature and live rig prerequisites before cloning the actual source solution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Added or changed contacts, goals, joints, orientation, digits, layers/copies, topology, ROM, axes or rest frames decline reuse; original raw goals remain for audits and no acceptance bound or numerical result is invented.
   * @evidence contracts/development/implementation.md#efficient-algorithms Checks raw joints/goals and rig scalar signatures, then copies the source pose/metadata in linear space; it removes the eligible duplicate fit without a measured runtime claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Private evidence belongs to the exact candidate object and source body; its source numerical output is reused only after every supported mutable scalar dependency matches, with fresh nested output ownership.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Clones result records for the current caller and retains no returned output; source evidence remains weakly owned by its issued preparation/transported candidate and contains no FK reader, callback or external handle.
   */
  export function read(body: IHumanBody, posture: IHumanPosture): resolveHumanPosture.ISeeded | undefined {
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (evidence === undefined || evidence.signature === undefined) return undefined;
    const source: ISource = evidence.source;
    if (
      source.body !== body ||
      source.rig !== body.poseResolution ||
      source.topology !== body.topology ||
      !eligible(posture) ||
      evidence.signature !== rawSignature(posture) ||
      source.signature !== HumanPostureRigSignature(body)
    ) return undefined;
    const out: resolveHumanPosture.ISeeded = structuredClone(source.solved);
    if (out.pose.root === null) return undefined;
    out.pose.root.translation = { ...posture.root };
    return out;
  }
}

/** One producer's private unchanged raw context and actual numerical result. */
interface ISource {
  body: IHumanBody;
  rig: IHumanBody["poseResolution"];
  topology: IHumanBody["topology"];
  signature: string | null;
  raw: IHumanPosture;
  solved: resolveHumanPosture.ISeeded;
  legs: Partial<Record<Leg, readonly AutoMovieHumanoidBone[]>>;
}

/** Exact issued candidate signature; mutable public records never supply proof. */
interface IEvidence { source: ISource; signature?: string; }

/** Only the source's original free legs are eligible for independent transport. */
type Leg = "leftLeg" | "rightLeg";

/** Fixed two-leg order; native refit still owns all requested solve ordering. */
const LEGS: readonly Leg[] = ["leftLeg", "rightLeg"];

/** Only explicit preparations own source results; no arbitrary input/time cache. */
const SOURCES: WeakMap<HumanPosturePreparation.IPrepared, ISource> = new WeakMap();

/** A candidate's evidence disappears when that exact raw object is released. */
const CARRIED: WeakMap<IHumanPosture, IEvidence> = new WeakMap();

/** Exact chain/parent raw input dependencies, excluding another solved limb's subtree. */
function legInputs(body: IHumanBody, posture: IHumanPosture): ISource["legs"] {
  const byName: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const bone of body.skeleton.bones) byName.set(bone.bone, bone);
  const out: ISource["legs"] = {};
  for (const limb of LEGS) {
    if (posture.limbs[limb] === undefined) continue;
    const own: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
    const dependencies: Set<AutoMovieHumanoidBone> = new Set([own.upper, own.lower, own.effector]);
    for (const bone of [own.upper, own.lower, own.effector]) {
      let parent: AutoMovieHumanoidBone | null | undefined = byName.get(bone)?.parent;
      while (parent !== undefined && parent !== null && !dependencies.has(parent)) {
        dependencies.add(parent);
        parent = byName.get(parent)?.parent;
      }
    }
    let coupled: boolean = false;
    for (const other of ["leftLeg", "rightLeg", "leftArm", "rightArm"] as const) {
      if (other === limb) continue;
      const chain: HumanLimbFit.IChain = HumanLimbFit.chain(other);
      coupled ||= [chain.upper, chain.lower, chain.effector].some(
        (bone: AutoMovieHumanoidBone): boolean => dependencies.has(bone),
      );
    }
    if (!coupled) out[limb] = [...dependencies];
  }
  return out;
}

/** Clinical presence and all three raw degrees must match before using a leg's source solve. */
function sameJoint(from: IHumanPosture, to: IHumanPosture, bone: AutoMovieHumanoidBone): boolean {
  const a: readonly [number, number, number] | undefined = from.joints[bone];
  const b: readonly [number, number, number] | undefined = to.joints[bone];
  return a === undefined || b === undefined ? a === b :
    a.length === b.length && Object.is(a[0], b[0]) && Object.is(a[1], b[1]) && Object.is(a[2], b[2]);
}

/** Every supported raw goal scalar must equal authoritative source-plus-displacement arithmetic. */
function sameGoal(from: IHumanPosture.IGoal, to: IHumanPosture.IGoal, delta: IAutoMovieVector3): boolean {
  try {
    if (!Object.keys(to).every((key: string): boolean => GOAL_KEYS.has(key)) ||
      !finiteVector(to.point) || !finiteVector(to.bend)) return false;
    for (const axis of ["x", "y", "z"] as const)
      if (!Object.is(from.point[axis] + delta[axis], to.point[axis]) ||
        !Object.is(from.bend[axis] + delta[axis], to.bend[axis])) return false;
    if (from.rotation === undefined || to.rotation === undefined) return from.rotation === to.rotation;
    return (["x", "y", "z", "w"] as const).every(
      (axis: "x" | "y" | "z" | "w"): boolean => Object.is(from.rotation![axis], to.rotation![axis]),
    );
  } catch {
    return false;
  }
}

/** Conservative initial domain: finite raw joints, free world legs and no other context. */
function eligible(posture: IHumanPosture): boolean {
  try {
    return eligibleRaw(posture);
  } catch {
    return false;
  }
}

/** Supported typed scalar checks; the outer guard declines malformed runtime records. */
function eligibleRaw(posture: IHumanPosture): boolean {
  const allowed: ReadonlySet<string> = POSTURE_KEYS;
  if (
    Object.keys(posture).some((key: string): boolean => !allowed.has(key)) ||
    !finiteVector(posture.root) ||
    ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite)
  ) return false;
  for (const joint of Object.values(posture.joints))
    if (joint === undefined || joint.length !== 3 || !joint.every(Number.isFinite)) return false;
  for (const [limb, goal] of Object.entries(posture.limbs)) {
    if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined) return false;
    if (
      Object.keys(goal).some((key: string): boolean => !GOAL_KEYS.has(key)) ||
      !finiteVector(goal.point) || !finiteVector(goal.bend) ||
      (goal.rotation !== undefined && ![
        goal.rotation.x, goal.rotation.y, goal.rotation.z, goal.rotation.w,
      ].every(Number.isFinite))
    ) return false;
  }
  return true;
}

/** Keep signed zero and primitive field presence in the exact supported raw signature. */
function rawSignature(posture: IHumanPosture): string | undefined {
  try {
    return JSON.stringify(posture, (_key: string, value: unknown): unknown =>
      typeof value === "number" && Object.is(value, -0) ? "number:-0" : value,
    );
  } catch {
    return undefined;
  }
}

/** Translate original demands on an owned copy; never translate external world colliders. */
function translation(source: IHumanPosture, root: IAutoMovieVector3): IHumanPosture {
  const out: IHumanPosture = structuredClone(source);
  const delta: IAutoMovieVector3 = Vector3.subtract(root, source.root);
  out.root = { ...root };
  for (const goal of Object.values(out.limbs)) {
    if (goal === undefined || goal.on !== undefined) continue;
    goal.point = Vector3.add(goal.point, delta);
    goal.bend = Vector3.add(goal.bend, delta);
  }
  for (const goal of Object.values(out.digits ?? {}))
    if (goal !== undefined && goal.on === undefined) goal.point = Vector3.add(goal.point, delta);
  if (out.rotation !== undefined) out.rotation.about = Vector3.add(out.rotation.about, delta);
  return out;
}

/** Finite world coordinates are required before translation can carry evidence. */
function finiteVector(value: IAutoMovieVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

/** Every other posture field denotes context that the initial transport does not prove. */
const POSTURE_KEYS: ReadonlySet<string> = new Set(["root", "yaw", "pitch", "roll", "joints", "limbs"]);

/** Contact, planting, references and external colliders require an ordinary solve. */
const GOAL_KEYS: ReadonlySet<string> = new Set(["point", "bend", "rotation"]);

import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPostureRaw as Raw } from "./HumanPostureRaw";
import { createHumanPostureRotation } from "./createHumanPostureRotation";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import { prepareIssuedHumanPosture } from "./prepareIssuedHumanPosture";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Checked transport of one actual canonical free-leg solve or direct-joint projection. Only the explicit
 * producer's private evidence can lend that solve to a translated raw posture;
 * ordinary postures and copied/changed context retain ordinary resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source provenance, free-leg scope, public cold versus owned continuous construction, actual rigid covariance, explicit transport and ordinary fallback.
 * @evidence contracts/development/design.md#principled-representation An actual solve of an owned raw snapshot plus complete constructed-graph/current-rig checks proves free-leg translation, a native numeric whole-body turn or joint-only rigid placement. Raw demands remain distinct from achieved output; JSON observes input but never establishes numerical equality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare/continued construct actual source solves, bones/seeds expose independent observations, placed/translated/turned/rigid construct owned raw consumers and read lends a proven solve to the resolver. No partial-leg or general result/time cache is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only actual owned constructors mint complete graph and leg capabilities. Forged/copied wrappers, arbitrary same-string raw objects, changed shape/body/metadata, base/near or unknown FK suppliers cannot certify cached numerical output.
 */
export namespace HumanPosturePreparation {
  /**
   * One explicit preparation's public pose: a value, as the authoring it was
   * solved from is. Neither is changed once issued.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual cold-solve provenance and the value contract of the public pose.
   * @evidence contracts/development/design.md#principled-representation Exposes only the canonical pose needed for COM while opaque private evidence retains raw demands and fit metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Jump observes preparedBones without demanding pose copying; pose is the solve's own value, and translated/rigid accept the actual issued source wrapper.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A structurally matching object cannot forge private weak-map membership; the pose is a value no caller changes, so it is lent, not copied.
   */
  export interface IPrepared {
    /** The canonical output of the actual source resolution, a value the caller does not change. */
    pose: IAutoMoviePose;
  }

  /**
   * Solve authoring at this explicit preparation boundary. The authoring is a
   * value: the caller does not change it once it is prepared, so the
   * preparation keeps it as given, and its public pose is the solve's own,
   * equally a value. Ordinary seeded resolution retains its existing
   * live-input/getter admission behavior.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the value contract of prepared authoring and its pose, actual cold-solve provenance, genuine FK-source scope and ordinary live-input alternative.
   * @evidence contracts/development/implementation.md#principled-implementation Solves exactly the authoring given, which stays as it was solved under the value contract, so no later observation pairs different demands with this solution. Finite free world-leg goals admit translation equivalence, including shared goals shifted once; joint-only projection is rigid-placement independent. Unknown FK suppliers retain actual solving but issue no reuse proof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolver owns numerical admission/solving; this owner records raw/rig evidence and lends its output.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No prior time, quantized key, fitted target or manually asserted resolved state supplies the solution; unsupported source contexts remain ineligible and resolve normally after translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms No copy of the authoring, the solved root or the public pose: values are kept and lent as they are. Current rig metadata still compares fully and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual private-reader assembly/native fitting or the incoming-reader independent route supplies the cold result. Genuine source-chain checks run before/after solving without invoking suppliers. Bones separately checks current rig/loan proof and copies before exposing a pose to any incoming reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each preparation holds the given authoring, one private seeded result and a rig checker; synchronous reader/projector loans are not retained. Weak source/candidate ownership adds no result history.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPrepared {
    return prepareCurrent(body, posture, {}, resolution, projection, coldSource);
  }

  /**
   * Prepare an actual owned curve's current target from deterministic seeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines a private current-target snapshot, degree-valued continuation seeds and independent prepared output; the curve must check the actual result before reuse.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing near-basin IK on the actual cloned current demands, not a cached prior pose. The owned free-curve producer supplies deterministic phase seeds and independently checks endpoint/orientation/ROM/pole before issuing an accepted curve result.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares prepareCurrent's snapshot, native ownership, solving and private evidence; public prepare continues to supply an empty near set.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No approximation key certifies the answer and no public cold/tie policy changes; unsupported curve inputs retain ordinary cold construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains actual current-target admission and near refinement while avoiding a complete cold swivel sweep only inside the explicit continuous-curve policy; runtime gains are unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only actual phase seed scalars propose a basin. Each current pose is solved, and private raw/rig proof still governs later exact translated reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One preparation owns its snapshot/result and weak evidence; neither the seed input nor a reader is retained by its result.
   */
  export function continued(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture, near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IPrepared {
    return prepareCurrent(body, posture, near, resolution, projection, resolveHumanPostureSource.continued);
  }

  /** Solve the given authoring, a value, with the one source solver under its actual ownership boundary. */
  function prepareCurrent(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture, near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    solve: typeof coldSource): IPrepared {
    const raw: IAutoMovieMotionHumanPosture = posture;
    const native: boolean = prepareHumanPoseResolution.isNativeSource(resolution);
    const rigUnchanged: (() => boolean) | undefined = native
      ? prepareHumanPostureRigCheck(body) : undefined;
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = native
      ? solve(body, raw, near, resolution, projection)
      : resolveHumanPosture.seeded(body, { ...raw }, undefined, near, resolution, undefined, projection);
    let shown: IAutoMoviePose | undefined;
    const prepared: IPrepared = {
      get pose(): IAutoMoviePose { return shown ?? solved.pose; },
      set pose(value: IAutoMoviePose) { shown = value; },
    };
    SOURCES.set(prepared, {
      body,
      rig: body.poseResolution,
      topology: body.topology,
      rigUnchanged: native && prepareHumanPoseResolution.isNativeSource(resolution) && Raw.eligible(raw) && rigUnchanged !== undefined && rigUnchanged() ? rigUnchanged : undefined,
      raw,
      solved,
    });
    return prepared;
  }

  /** Public cold preparation runs the ordinary owned source solve. */
  function coldSource(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture, near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return resolveHumanPostureSource.owned(body, posture, near, resolution, undefined, projection);
  }

  /**
   * Copy only actual per-limb branch/swivel data from an issued preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines current actual solve seeds and independent scalar-record ownership, rejecting forged wrappers.
   * @evidence contracts/development/implementation.md#principled-implementation The private source's actual solver output supplies branch/swivel scalars; these propose later fits and never certify a current physical answer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak source lookup and small independent clone serve the deterministic curve's anchor owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fabricated seed, pose-identity proof, approximate answer or reader capability is exposed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies at most four small seed records without materializing the complete public pose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads this issued source's actual completed result independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns caller-owned primitive records and retains no output, pose, callback or reader.
   */
  export function seeds(prepared: IPrepared): IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined) throw new Error("Unissued canonical posture preparation");
    return structuredClone(source.solved.seeds);
  }

  /**
   * Snapshot an issued native preparation's original canonical source facts.
   * This observes the source epoch, like pose, rather than current-body
   * fallback; the owned curve separately maintains its live epoch proof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines original source-time canonical FK, flat nullable clinical-degree order, fresh demanded frames, genuine source requirement and explicit distinction from bones' live-body fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The genuine issued source owns its solved pose and original immutable FK rig. Observing that actual pose through that rig and copying its exact clinical scalars produces the same source facts as a complete pose copy without B temporary joint objects; this establishes no new-time or current-body validity claim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source/rig ownership remains private, while the curve receives only independent primitive arrays and fresh demanded FK records. Existing public pose and live bones observation retain their original behavior.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unissued/foreign sources decline; no private pose, rig, reader or borrowed output escapes, and no prior pose answer or numeric readiness flag certifies current constraints. The curve still verifies current goals/ROM/continuity under its separate live metadata gate.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) primitive-copy pass and native demanded-ancestor FK replace full-pose/B-joint-object copying used only for validation. Actual numerical FK admission and every changed-joint ROM check remain, with unmeasured gains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the actual preparation's private solved pose/original rig are shared; exact named scalar values are copied on every observation, and the caller's current source/epoch proof remains separate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two flat primitive arrays and the fresh K-bone map transfer to this observation's caller and end with its query. No source pose, private joint, reader, output history or handle is retained by this method.
   */
  export function source(prepared: IPrepared, requested: ReadonlySet<AutoMovieHumanoidBone>, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IObservation | undefined {
    const fixed: ISource | undefined = SOURCES.get(prepared);
    if (fixed?.rigUnchanged === undefined) return undefined;
    const names: AutoMovieHumanoidBone[] = new Array<AutoMovieHumanoidBone>(fixed.solved.pose.joints.length);
    const values: (number | null)[] = new Array<number | null>(3 * names.length);
    for (let i: number = 0; i < names.length; ++i) {
      const joint: IAutoMoviePose["joints"][number] = fixed.solved.pose.joints[i]!;
      names[i] = joint.bone;
      values[3 * i] = joint.flexion;
      values[3 * i + 1] = joint.abduction;
      values[3 * i + 2] = joint.twist;
    }
    return { names, values, bones: fixed.rig.resolveMap(fixed.solved.pose, resolution !== undefined && prepareHumanPoseResolution.isNativeSource(resolution) ? prepareHumanPoseResolution.read(resolution) : undefined, requested) };
  }

  /**
   * Independent observations of one actual canonical preparation source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation names fixes ordered clinical slots, values stores F/A/T degree-or-null triples, and bones contains fresh canonical source-world FK for exactly the demanded names.
   * @evidence contracts/development/design.md#principled-representation Flat primitive clinical data and ordinary fresh FK records expose source observations without lending the private pose, joint objects, rig or numerical admission authority.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The free-curve validator consumes these three fields and separately owns actual goal/ROM/phase checks; current-body fallback remains bones' responsibility.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no resolved flag, source/body override, time key, guessed derivative or success verdict; original source-time semantics remain explicit.
   */
  export interface IObservation {
    /** Canonical bone at each flat clinical slot, in the actual source joint order. */
    names: readonly AutoMovieHumanoidBone[];
    /** Three exact nullable clinical-degree coordinates per ordered bone. */
    values: readonly (number | null)[];
    /** Fresh demanded FK under this preparation's original canonical rig/pose. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * Observe an issued cold source through actual FK without exposing its pose.
   * Changed/unsupported rig context takes ordinary current cold resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines issued-source membership, requested frames, current-rig fallback, fresh map ownership and synchronous FK lending.
   * @evidence contracts/development/implementation.md#principled-implementation A genuine cold source owns solved articulation; identical body/rig/topology and every live rig/table scalar permit its observation. An actual private reader may consume the private pose; a current native incoming reader receives an independent pose copy. Unknown incoming callbacks or changed context first resolve fresh query data. Incoming callback lookups remain live and never receive the retained canonical pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private membership lookup and checked source selection feed the existing poseBones owner; no private pose or raw data is returned or passed to a caller callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unissued wrappers are refused, the public pose is a value no caller changes, changed context retains native solving, and all actual ordered joint admission and requested-ancestor FK still execute with original raw goals and ranges.
   * @evidence contracts/development/implementation.md#efficient-algorithms Current rig comparison and requested FK remain. A private-reader observation avoids a pose clone; a native incoming reader pays one O(B) pose copy while avoiding duplicate IK. Changed/unknown context retains full cold solving. No unused public pose observation is allocated and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The issued source/body and freshly checked scalar prerequisites establish exact articulation reuse. The explicit FK reader is borrowed only by the current observation; it shares exact same-valued dependencies while poseBones produces fresh output records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The method retains no reader, requested set or returned bones. Private source ownership remains with its weak preparation/candidates, and only fresh public FK output escapes; no borrowed cache pose or callback result can escape this seam.
   */
  export function bones(prepared: IPrepared, requested?: ReadonlySet<AutoMovieHumanoidBone>,
    source?: Parameters<typeof prepareHumanPoseResolution>[0]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const fixed: ISource | undefined = SOURCES.get(prepared);
    if (fixed === undefined) throw new Error("Unissued canonical posture preparation");
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
    const unchanged: boolean = prepareHumanPoseResolution.isNativeSource(source) && fixed.rig === fixed.body.poseResolution &&
      fixed.topology === fixed.body.topology && fixed.rigUnchanged !== undefined && fixed.rigUnchanged();
    const pose: IAutoMoviePose = unchanged
      ? source === undefined ? fixed.solved.pose : structuredClone(fixed.solved.pose)
      : resolveHumanPosture.seeded(fixed.body, fixed.raw, undefined, undefined, resolution).pose;
    return poseBones(fixed.body, pose, resolution(), requested);
  }

  /**
   * Place a previously prepared current solve at a world-metre COM.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines independently translated original demands, actual mass-bone membership, world COM and current rig revalidation for a preparation that has already crossed its producer boundary.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid root displacement moves every mass point equally, while bones rechecks the escaped preparation's current rig and falls back to actual ordinary solving when changed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The existing bones owner admits current source/FK and placeCurrent owns the original displacement formula before authoritative raw translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stale source, forged wrapper, reader identity, prior pose, altered goal or placement approximation is accepted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demanded FK/COM reduction and original-demand translation follow the current solve; required live-rig checking remains at this actual escaped-source boundary, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only the issued source's current actual canonical solve under bones' complete source/native proof; changed prerequisites receive ordinary current solving.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary bone map and COM end on return; the output owns its translated raw graph and bounded weak source evidence without any reader loan or new history.
   */
  export function placed(prepared: IPrepared, model: IAutoMovieResolveCenterOfMass.IModel,
    requested: ReadonlySet<AutoMovieHumanoidBone>, centre: IAutoMovieVector3, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieMotionHumanPosture {
    return placeCurrent(prepared, model, bones(prepared, requested, prepareHumanPoseResolution.isNativeSource(resolution) ? resolution : undefined), centre);
  }

  /** Apply exactly the original COM subtract/add grouping to actual source geometry. */
  function placeCurrent(prepared: IPrepared, model: IAutoMovieResolveCenterOfMass.IModel,
    placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, centre: IAutoMovieVector3): IAutoMovieMotionHumanPosture {
    const source: ISource = SOURCES.get(prepared)!;
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, placed);
    return translated(prepared, {
      x: centre.x - (com.x - source.raw.root.x),
      y: centre.y - (com.y - source.raw.root.y),
      z: centre.z - (com.z - source.raw.root.z),
    });
  }

  /**
   * Translate the original raw root and world demands by one world-metre
   * displacement. Attached goals and external colliders keep their own frames.
   * Unsupported contexts still receive raw translation and ordinary resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States authoritative raw translation, attached/external frames and unsupported-context fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Adds new-minus-source root displacement to original world points/bends, digits and turn centre, once per aliased goal object, without substituting achieved endpoints. The actual owned raw result supplies graph provenance before JSON observations execute.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Raw.translated owns copying/arithmetic; issued records original native nodes and preserves JSON observations. read alone checks the current complete graph before reusing the actual source solution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves clinical angles, rotations, plants, contacts, limits and external shapes; only eligible free-leg context receives evidence, and an unissued wrapper is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies the source posture and its nested authoring data, then performs constant limb/digit translation work; no FK, clamping or numerical fit is performed here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual preparation supplies only its owned raw demands. A graph captured before serialization proves those emitted objects and all scalars remain unchanged; the consumer separately rechecks current rig/native-loan/cold context. A matching JSON string alone supplies no authority.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns an independently owned raw posture whose weak private evidence borrows its preparation data; no input vector, callback, reader or prior-query history is retained.
   */
  export function translated(prepared: IPrepared, root: IAutoMovieVector3): IAutoMovieMotionHumanPosture {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined) throw new Error("Unissued canonical posture preparation");
    return issued(source, Raw.translated(source.raw, root));
  }

  /**
   * Carry a proven free-goal solve through an actual numeric rigid turn.
   * Foreign rotations and ordinary/changed raw postures retain the original
   * attached-rotation construction and ordinary canonical resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual solved-source and native numeric rotation provenance, unchanged authoring demands, root-transform ownership and ordinary unsupported fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A common rigid transform of root and every free goal preserves clinical articulation. The actual current source proof supplies those joints, while turnHumanPosture computes the ordinary normalized root transform about the actual COM; the resulting complete raw graph is constructed and checked independently.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Numeric rotation provenance is owned by its constructor, raw/current-rig proof by read, and rigid root arithmetic by the existing turn owner. A new private source records the same original demands plus the actual turn without another IK solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No generic rotation callback is probed, no JSON collision certifies source equality and no achieved endpoint replaces a goal. Unknown/proxied/edited rotations miss without metadata checks and use the original ordinary path; source/body/goal mutation declines reuse.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exact linear raw/source checking and copying plus constant-goal rigid root work replace the otherwise repeated cold chain sweep on displayed turned free curves. Every physical trajectory and original goal remains actual; runtime gains are unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The current constructor-owned full raw graph, current complete rig and native rotation graph prove rigid covariance; copied wrappers, callbacks, contacts and altered context grant no authority. Public cold solver policy itself is unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The independently constructed raw output weakly owns one private actual solution and bounded original-node evidence. No trajectory, body evaluator, history, FK reader or returned pose is captured by the numeric rotation.
   */
  export function turned(posture: IAutoMovieMotionHumanPosture, rotation: IAutoMovieHumanPostureRotation): IAutoMovieMotionHumanPosture {
    const attached: IAutoMovieMotionHumanPosture = { ...posture, rotation };
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (evidence === undefined || !createHumanPostureRotation.unchanged(rotation)) return attached;
    const previous: ISource = evidence.source;
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined = read(previous.body, posture);
    if (solved === undefined || solved.pose.root === null || !createHumanPostureRotation.unchanged(rotation)) return attached;
    const raw: IAutoMovieMotionHumanPosture = structuredClone(attached);
    const turn: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(raw);
    solved.pose.root.translation = turn.position;
    solved.pose.root.rotation = turn.rotation;
    const source: ISource = { ...previous, raw: structuredClone(raw), solved };
    return issued(source, raw);
  }

  /**
   * Construct a fresh rigid placement of an actual prepared joint-only shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines authoritative private clinical shape, current metre/degree placement, goal refusal and constructor-owned whole proof.
   * @evidence contracts/development/implementation.md#principled-implementation Direct clinical projection is independent of rigid root placement. A genuine preparation owns that projection and its original raw joints; this constructor copies those demands, writes current root/Eulers and issues an exact owned graph for the read consumer's current rig check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure tryRigid owns private-source admission, Raw.translated owns fresh copying, issued owns native graph provenance and read owns live prerequisites/fresh solved output. Fixed Gym and crawl placement are actual shape-only consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses unissued or non-joint-only sources; no external posture's joints/goals are discarded or certified by JSON. Changed output metadata, clinical values or rig/ROM still fall back to ordinary resolution, and current heading uses its original owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies O(J) original clinical authoring and checks O(J) issued graph data, removing only repeated fixed clinical projection; no FK, solve, sample or result-history cache is introduced. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit constructor takes only placement scalars and the actual private preparation, so unchanged clinical source is authoritative rather than inferred from an arbitrary caller's JSON. The source solve, owned graph and live rig checker establish the consumer proof.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh raw output and one weakly owned graph/source capability; no current root, reader/projector loan, previous output or sample history is retained by the preparation.
   */
  export function rigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IAutoMovieMotionHumanPosture {
    const raw: IAutoMovieMotionHumanPosture | undefined = tryRigid(prepared, root, yaw, pitch, roll);
    if (raw === undefined) throw new Error("Rigid posture placement requires an issued joint-only source");
    return raw;
  }

  /**
   * Construct the same authoritative rigid shape, declining unsupported sources.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines optional issued joint-only construction and caller-owned ordinary fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The private source's supported empty-goal domain permits rigid placement of its actual direct projection. Unsupported/unissued source returns undefined before reading current placement data; the caller keeps its original raw posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This guarded constructor owns domain admission for rigid and optional roll consumers; Raw.translated and issued own fresh raw construction and genuine graph evidence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No external raw joints/goals are dropped or compared by JSON. Current root/angles remain actual authoring values, source/live rig proof stays required for reuse, and unsupported contexts retain native solving.
   * @evidence contracts/development/implementation.md#efficient-algorithms Private source eligibility takes O(J+G); supported construction copies O(J) raw data and issues its O(J) graph, while unsupported sources allocate no candidate. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the actual private preparation supplies the fixed clinical shape; immutable source ownership and joint-only domain, not caller identity or a flag, authorize construction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh raw candidate and its weak evidence or undefined, retaining no root, caller fallback, reader, sample or history.
   */
  export function tryRigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IAutoMovieMotionHumanPosture | undefined {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined || !Raw.eligible(source.raw) || Object.keys(source.raw.limbs).length !== 0)
      return undefined;
    const raw: IAutoMovieMotionHumanPosture = Raw.translated(source.raw, root);
    raw.yaw = yaw; raw.pitch = pitch; raw.roll = roll;
    return issued(source, raw);
  }

  /**
   * Read a fresh independent copy of a proven translated cold solve, otherwise
   * decline so the ordinary resolver admits and solves the current request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact current context checks, fresh complete metadata and ordinary admission fallback.
   * @evidence contracts/development/implementation.md#principled-implementation An actual free-leg solution is equivariant under common rigid placement. Exact complete raw graph/current rig/native context prove its copied clinical solution; translated root and optional native numeric whole-body turn use the ordinary turn owner. A joint-only source is additionally independent of Euler placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure After original raw serialization/live-rig observations, the actual owned graph checker inspects only its original native nodes; replacement Proxy children are not followed. The resolver admits base/near and current native FK-source context before lending the copied source result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A JSON collision cannot satisfy the required constructor graph. Changed metadata/prototype/descriptor/order/scalars, unsupported contacts/digits/body context or foreign FK sources retain ordinary resolution. A native numeric rigid turn has separately constructed graph/current-source proof; arbitrary rotation callbacks gain none. No physical bound or demand changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original raw/live-rig checks and O(J) owned graph verification remain, followed by O(B) fresh result copying. Graph checks add no observations to replacement Proxy nodes; eligible duplicate solves alone are removed, without measured runtime claims.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact candidate identity links an actual typed raw constructor to the source's actual owned cold solve. Its complete original-node scalar/shape snapshot and current rig/native-loan proof establish equivalence independently of JSON transformation, while every returned nested record is fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Clones result records for the current caller and retains no returned output; source evidence weakly owns bounded original-node checker data and the issued preparation's source. It contains no FK loan, foreign callback or external handle.
   */
  export function read(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined {
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (evidence === undefined || evidence.signature === undefined) return undefined;
    const source: ISource = evidence.source;
    if (
      source.body !== body ||
      source.rig !== body.poseResolution ||
      source.topology !== body.topology ||
      !Raw.eligible(posture) ||
      evidence.signature !== Raw.signature(posture) ||
      source.rigUnchanged === undefined || !source.rigUnchanged()
    ) return undefined;
    if (evidence.unchanged === undefined) return undefined;
    if (!evidence.unchanged()) { CARRIED.delete(posture); return undefined; }
    const out: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = structuredClone(source.solved);
    if (out.pose.root === null) return undefined;
    if (posture.rotation === undefined) {
      out.pose.root.translation = { ...posture.root };
      if (Object.keys(source.raw.limbs).length === 0)
        out.pose.root.rotation = resolveHumanPosture.heading(posture);
    } else {
      const turn: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(posture);
      out.pose.root.translation = turn.position;
      if (Object.keys(source.raw.limbs).length === 0) out.pose.root.rotation = turn.rotation;
    }
    return out;
  }
}

/** One producer's private unchanged raw context and actual numerical result. */
interface ISource {
  body: IAutoMovieMotionHumanBody;
  rig: IAutoMovieMotionHumanBody["poseResolution"];
  topology: IAutoMovieMotionHumanBody["topology"];
  rigUnchanged: (() => boolean) | undefined;
  raw: IAutoMovieMotionHumanPosture;
  solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
}

/** Observed JSON and actual constructor authority are distinct, explicitly owned fields. */
interface IEvidence {
  /** Actual preparation source; a JSON-only association cannot authorize reuse. */
  source: ISource;
  /** Original observed prefilter, never an injective physical-data certificate. */
  signature: string | undefined;
  /** Present only for actual constructor-owned original native graph verification. */
  unchanged: (() => boolean) | undefined;
}

/** Only explicit preparations own source results; no arbitrary input/time cache. */
const SOURCES: WeakMap<HumanPosturePreparation.IPrepared, ISource> = new WeakMap();

/** A candidate's evidence disappears when that exact raw object is released. */
const CARRIED: WeakMap<IAutoMovieMotionHumanPosture, IEvidence> = new WeakMap();

/** Only actual owned constructors can mint complete graph provenance; JSON stays an observed prefilter. */
function issued(source: ISource, raw: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture {
  if (source.rigUnchanged !== undefined && Raw.eligible(raw)) {
    const unchanged: (() => boolean) | undefined = prepareIssuedHumanPosture(raw);
    const signature: string | undefined = Raw.signature(raw);
    CARRIED.set(raw, { source, signature, unchanged });
  }
  return raw;
}



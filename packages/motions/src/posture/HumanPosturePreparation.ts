import { type IAutoMovieResolvedBone, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanPostureRaw as Raw } from "./HumanPostureRaw";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import { prepareHumanPostureTranslation } from "./prepareHumanPostureTranslation";
import { prepareIssuedHumanPosture } from "./prepareIssuedHumanPosture";
import type { IHumanPosture } from "./IHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { poseBones } from "./poseBones";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { createHumanPostureRotation } from "./createHumanPostureRotation";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Checked transport of one actual canonical free-leg solve or direct-joint projection. Only the explicit
 * producer's private evidence can lend that solve to a translated raw posture;
 * ordinary postures and copied/changed context retain ordinary resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source provenance, free-leg scope, public cold versus owned continuous construction, actual rigid covariance, explicit transport and ordinary fallback.
 * @evidence contracts/development/design.md#principled-representation An actual solve of an owned raw snapshot plus complete constructed-graph/current-rig checks proves free-leg translation, a native numeric whole-body turn or joint-only rigid placement. Raw demands remain distinct from achieved output; JSON observes input but never establishes numerical equality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare/continued construct actual source solves, bones/seeds expose independent observations, placed/translated/turned/rigid construct owned raw consumers, and carried preserves comparisons without minting unowned authority. No partial-leg or general result/time cache is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only actual owned constructors mint complete graph and leg capabilities. Forged/copied wrappers, arbitrary same-string raw objects, changed shape/body/metadata, base/near or unknown FK suppliers cannot certify cached numerical output.
 */
export namespace HumanPosturePreparation {
  /**
   * One explicit preparation's independently owned public pose. The private
   * source and solution never alias this mutable observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual cold-solve provenance and independent public ownership.
   * @evidence contracts/development/design.md#principled-representation Exposes only the canonical pose needed for COM while opaque private evidence retains raw demands and fit metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Jump observes preparedBones without demanding pose copying; pose remains a public independent observation, and translated/rigid accept the actual issued source wrapper.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A structurally matching object cannot forge private weak-map membership, and mutating pose cannot alter the private source result.
   */
  export interface IPrepared {
    /** Fresh canonical output from the actual source resolution. */
    pose: IAutoMoviePose;
  }

  /**
   * Snapshot cloneable enumerable own-data authoring with structuredClone at
   * this explicit preparation boundary, then solve that exact owned snapshot.
   * Callable/noncloneable authoring fails at this boundary. Ordinary seeded
   * resolution retains its existing live-input/getter admission behavior.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the explicit snapshot-first own-data API, actual cold-solve provenance, public/private copies, genuine FK-source scope and ordinary live-input alternative.
   * @evidence contracts/development/implementation.md#principled-implementation Solves exactly the preparation-owned snapshot, so later getter observations cannot pair different demands with an earlier solution. Finite free world-leg goals admit translation equivalence, including shared goals shifted once; joint-only projection is rigid-placement independent. Unknown FK suppliers retain actual solving but issue no reuse proof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolver owns numerical admission/solving; this owner records raw/rig evidence and transfers fresh output observations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No prior time, quantized key, fitted target or manually asserted resolved state supplies the solution; unsupported source contexts remain ineligible and resolve normally after translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms The cold result transfers into private ownership after its possibly borrowed root is detached; raw authoring is copied once and public pose copying occurs only on first access. Expected translation prepares lazily only on an actual carried read, adding no scan to public translated-only consumers. Current rig metadata still compares fully and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual private-reader assembly/native fitting or the incoming-reader independent route supplies the cold result; its private snapshot and detached root cannot alias caller data. Genuine source-chain checks run before/after solving without invoking suppliers. Public pose observation copies once; bones separately checks current rig/loan proof and copies before exposing a pose to any incoming reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each preparation owns raw data, one private seeded result, a rig checker and at most one lazily prepared expected-translation closure borrowing that raw snapshot. Public observations allocate only on demand and never touch private evidence; synchronous reader/projector loans are not retained. Weak source/candidate ownership adds no result history.
   */
  export function prepare(
    body: IHumanBody,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPrepared {
    return prepareCurrent(body, posture, {}, resolution, projection);
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
  export function continued(body: IHumanBody, posture: IHumanPosture, near: resolveHumanPosture.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IPrepared {
    return prepareCurrent(body, posture, near, resolution, projection);
  }

  /** Snapshot first, then use the one source solver under its actual ownership boundary. */
  function prepareCurrent(body: IHumanBody, posture: IHumanPosture, near: resolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], projection: ReturnType<typeof prepareHumanPostureProjection> | undefined): IPrepared {
    const raw: IHumanPosture = structuredClone(posture);
    const native: boolean = prepareHumanPoseResolution.isNativeSource(resolution);
    const rigUnchanged: (() => boolean) | undefined = native
      ? prepareHumanPostureRigCheck(body) : undefined;
    const solved: resolveHumanPosture.ISeeded = native
      ? Object.keys(near).length === 0
        ? resolveHumanPostureSource.owned(body, raw, near, resolution, undefined, projection)
        : resolveHumanPostureSource.continued(body, raw, near, resolution, projection)
      : resolveHumanPosture.seeded(body, { ...raw }, undefined, near, resolution, undefined, projection);
    // The cold solve owns its joints; isolate only a possibly borrowed raw root.
    solved.pose = { ...solved.pose, root: structuredClone(solved.pose.root) };
    let shown: IAutoMoviePose | undefined;
    const prepared: IPrepared = {
      get pose(): IAutoMoviePose { return (shown ??= structuredClone(solved.pose)); },
      set pose(value: IAutoMoviePose) { shown = value; },
    };
    SOURCES.set(prepared, {
      body,
      rig: body.poseResolution,
      topology: body.topology,
      rigUnchanged: native && prepareHumanPoseResolution.isNativeSource(resolution) && Raw.eligible(raw) && rigUnchanged !== undefined && rigUnchanged() ? rigUnchanged : undefined,
      raw,
      expected: undefined,
      solved,
    });
    return prepared;
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
  export function seeds(prepared: IPrepared): resolveHumanPosture.ISeeded["seeds"] {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined) throw new Error("Unissued canonical posture preparation");
    return structuredClone(source.solved.seeds);
  }

  /**
   * Observe an issued cold source through actual FK without exposing its pose.
   * Changed/unsupported rig context takes ordinary current cold resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines issued-source membership, requested frames, current-rig fallback, fresh map ownership and synchronous FK lending.
   * @evidence contracts/development/implementation.md#principled-implementation A genuine cold source owns solved articulation; identical body/rig/topology and every live rig/table scalar permit its observation. An actual private reader may consume the private pose; a current native incoming reader receives an independent pose copy. Unknown incoming callbacks or changed context first resolve fresh query data. Incoming callback lookups remain live and never receive the retained canonical pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private membership lookup and checked source selection feed the existing poseBones owner; no private pose or raw data is returned or passed to a caller callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unissued wrappers are refused, public pose edits cannot affect the private source, changed context retains native solving, and all actual ordered joint admission and requested-ancestor FK still execute with original raw goals and ranges.
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
  export function placed(prepared: IPrepared, model: resolveAutoMovieCenterOfMass.IModel,
    requested: ReadonlySet<AutoMovieHumanoidBone>, centre: IAutoMovieVector3): IHumanPosture {
    return placeCurrent(prepared, model, bones(prepared, requested), centre);
  }

  /** Apply exactly the original COM subtract/add grouping to actual source geometry. */
  function placeCurrent(prepared: IPrepared, model: resolveAutoMovieCenterOfMass.IModel,
    placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, centre: IAutoMovieVector3): IHumanPosture {
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
  export function translated(prepared: IPrepared, root: IAutoMovieVector3): IHumanPosture {
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
  export function turned(posture: IHumanPosture, rotation: IHumanPosture.IRotation): IHumanPosture {
    const attached: IHumanPosture = { ...posture, rotation };
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (evidence === undefined || !createHumanPostureRotation.unchanged(rotation)) return attached;
    const previous: ISource = evidence.source;
    const solved: resolveHumanPosture.ISeeded | undefined = read(previous.body, posture);
    if (solved === undefined || solved.pose.root === null || !createHumanPostureRotation.unchanged(rotation)) return attached;
    const raw: IHumanPosture = structuredClone(attached);
    const turn: turnHumanPosture.ITurned = turnHumanPosture(raw);
    solved.pose.root.translation = turn.position;
    solved.pose.root.rotation = turn.rotation;
    const source: ISource = { ...previous, raw: structuredClone(raw), solved, expected: undefined };
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
  export function rigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IHumanPosture {
    const raw: IHumanPosture | undefined = tryRigid(prepared, root, yaw, pitch, roll);
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
  export function tryRigid(prepared: IPrepared, root: IAutoMovieVector3, yaw: number, pitch: number, roll: number): IHumanPosture | undefined {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined || !Raw.eligible(source.raw) || Object.keys(source.raw.limbs).length !== 0)
      return undefined;
    const raw: IHumanPosture = Raw.translated(source.raw, root);
    raw.yaw = yaw; raw.pitch = pitch; raw.roll = roll;
    return issued(source, raw);
  }

  /**
   * Preserve the existing raw comparison/JSON observations for a caller's
   * posture. Whole reuse retains only an already constructor-issued graph
   * from this source; an arbitrary same-string candidate resolves normally.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged raw/JSON observation order, no arbitrary whole certification, existing owned-graph retention and ordinary fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Original actual/expected JSON observations remain, including empty-goal Euler replacement, but strings cannot prove physical equality in the presence of toJSON. Only an already issued same-source owned graph can survive this comparison; rigid is the authoritative constructor for a new joint-only placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The expected-only builder avoids unnecessary private-prefix copies without changing external root reads. A source/signature record preserves subsequent original observations; read additionally requires actual constructor graph authority, and arbitrary composition transfers no partial-leg authority.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No same-string raw candidate obtains a new solved/leg capability. Own/inherited toJSON, a Proxy or modified clinical values therefore cannot substitute source output for different demands; no target, tolerance, goal or continuation rule is weakened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains linear exact raw signature walks and no FK/solver. The first carried call prepares a private plain alias-free source once; supported repeats allocate only changed point/root records. Other sources keep full translation; possible JSON callbacks detach the borrowed prefix. Public translated-only consumers pay no preparation, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Expected construction borrows only the immutable private raw prefix. Actual candidate serialization still precedes expected serialization; potential callbacks receive a detached prefix. Numerical reuse additionally requires preexisting same-source constructor graph and live rig/native-loan proof, with no mutable-input verdict cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak candidate entry keeps source/signature only while that candidate lives. The temporary expected record never enters output or evidence maps; inherited JSON hooks or nonnumeric replaced Euler fields trigger prefix detachment before serialization. One source owns one builder or unsupported marker, with no timestamp history.
   */
  export function carried(prepared: IPrepared, posture: IHumanPosture): IHumanPosture {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined || source.rigUnchanged === undefined || !Raw.eligible(posture)) return posture;
    if (source.expected === undefined) source.expected = prepareHumanPostureTranslation(source.raw) ?? null;
    const root: IAutoMovieVector3 = posture.root;
    const borrowed: IHumanPosture | undefined = source.expected?.(root);
    const expected: IHumanPosture = borrowed ?? Raw.translated(source.raw, root);
    if (Object.keys(source.raw.limbs).length === 0 && Object.keys(posture.limbs).length === 0) {
      expected.yaw = posture.yaw;
      expected.pitch = posture.pitch;
      expected.roll = posture.roll;
    }
    const signature: string | undefined = Raw.signature(posture);
    const jsonCallbacks: boolean = borrowed !== undefined && signature !== undefined &&
      (Object.getOwnPropertyDescriptor(Object.prototype, "toJSON") !== undefined ||
      Object.getOwnPropertyDescriptor(Array.prototype, "toJSON") !== undefined || Object.getPrototypeOf(Array.prototype) !== Object.prototype ||
      Reflect.ownKeys(expected.root).length !== 3 || ![expected.root.x, expected.root.y, expected.root.z].every(Number.isFinite) ||
      ![expected.yaw, expected.pitch, expected.roll].every(Number.isFinite));
    const compared: IHumanPosture = jsonCallbacks ? { ...expected,
      ...structuredClone({ joints: expected.joints, limbs: expected.limbs }) } : expected;
    if (signature !== undefined && signature === Raw.signature(compared)) {
      const previous: IEvidence | undefined = CARRIED.get(posture);
      CARRIED.set(posture, { source, signature, unchanged: previous?.source === source ? previous.unchanged : undefined });
    }
    return posture;
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
  export function read(body: IHumanBody, posture: IHumanPosture): resolveHumanPosture.ISeeded | undefined {
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
    const out: resolveHumanPosture.ISeeded = structuredClone(source.solved);
    if (out.pose.root === null) return undefined;
    if (posture.rotation === undefined) {
      out.pose.root.translation = { ...posture.root };
      if (Object.keys(source.raw.limbs).length === 0)
        out.pose.root.rotation = resolveHumanPosture.heading(posture);
    } else {
      const turn: turnHumanPosture.ITurned = turnHumanPosture(posture);
      out.pose.root.translation = turn.position;
      if (Object.keys(source.raw.limbs).length === 0) out.pose.root.rotation = turn.rotation;
    }
    return out;
  }
}

/** One producer's private unchanged raw context and actual numerical result. */
interface ISource {
  body: IHumanBody;
  rig: IHumanBody["poseResolution"];
  topology: IHumanBody["topology"];
  rigUnchanged: (() => boolean) | undefined;
  raw: IHumanPosture;
  /** Optional nonescaping expected-only builder over the same immutable private raw clone. */
  expected: ReturnType<typeof prepareHumanPostureTranslation> | null;
  solved: resolveHumanPosture.ISeeded;
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
const CARRIED: WeakMap<IHumanPosture, IEvidence> = new WeakMap();

/** Only actual owned constructors can mint complete graph provenance; JSON stays an observed prefilter. */
function issued(source: ISource, raw: IHumanPosture): IHumanPosture {
  if (source.rigUnchanged !== undefined && Raw.eligible(raw)) {
    const unchanged: (() => boolean) | undefined = prepareIssuedHumanPosture(raw);
    const signature: string | undefined = Raw.signature(raw);
    CARRIED.set(raw, { source, signature, unchanged });
  }
  return raw;
}



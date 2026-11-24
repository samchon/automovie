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
import { humanPostureHeading } from "./humanPostureHeading";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { prepareHumanPostureRigCheck } from "./prepareHumanPostureRigCheck";
import { prepareIssuedHumanPosture } from "./prepareIssuedHumanPosture";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * Checked transport of one actual canonical free-leg solve or direct-joint
 * projection. Only the explicit producer's private evidence can lend that solve
 * to a translated raw posture; ordinary postures and copied/changed context
 * retain ordinary resolution.
 */
export namespace HumanPosturePreparation {
  /**
   * One explicit preparation's public pose: a value, as the authoring it was
   * solved from is. Neither is changed once issued.
   */
  export interface IPrepared {
    /**
     * The canonical output of the actual source resolution, a value the caller
     * does not change.
     */
    pose: IAutoMoviePose;
  }

  /**
   * Solve authoring at this explicit preparation boundary. The authoring is a
   * value: the caller does not change it once it is prepared, so the
   * preparation keeps it as given, and its public pose is the solve's own,
   * equally a value. Ordinary seeded resolution retains its existing
   * live-input/getter admission behavior.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPrepared {
    return prepareCurrent(
      body,
      posture,
      {},
      resolution,
      projection,
      coldSource,
    );
  }

  /** Prepare an actual owned curve's current target from deterministic seeds. */
  export function continued(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IPrepared {
    return prepareCurrent(
      body,
      posture,
      near,
      resolution,
      projection,
      resolveHumanPostureSource.continued,
    );
  }

  /**
   * Solve the given authoring, a value, with the one source solver under its
   * actual ownership boundary.
   */
  function prepareCurrent(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    solve: typeof coldSource,
  ): IPrepared {
    const raw: IAutoMovieMotionHumanPosture = posture;
    const native: boolean =
      prepareHumanPoseResolution.isNativeSource(resolution);
    const rigUnchanged: (() => boolean) | undefined = native
      ? prepareHumanPostureRigCheck(body)
      : undefined;
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = native
      ? solve(body, raw, near, resolution, projection)
      : resolveHumanPosture.seeded(
          body,
          { ...raw },
          undefined,
          near,
          resolution,
          undefined,
          projection,
        );
    let shown: IAutoMoviePose | undefined;
    const prepared: IPrepared = {
      get pose(): IAutoMoviePose {
        return shown ?? solved.pose;
      },
      set pose(value: IAutoMoviePose) {
        shown = value;
      },
    };
    SOURCES.set(prepared, {
      body,
      rig: body.poseResolution,
      topology: body.topology,
      rigUnchanged:
        native &&
        prepareHumanPoseResolution.isNativeSource(resolution) &&
        Raw.eligible(raw) &&
        rigUnchanged !== undefined &&
        rigUnchanged()
          ? rigUnchanged
          : undefined,
      raw,
      solved,
    });
    return prepared;
  }

  /** Public cold preparation runs the ordinary owned source solve. */
  function coldSource(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    return resolveHumanPostureSource.owned(
      body,
      posture,
      near,
      resolution,
      undefined,
      projection,
    );
  }

  /** Copy only actual per-limb branch/swivel data from an issued preparation. */
  export function seeds(
    prepared: IPrepared,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined)
      throw new Error("Unissued canonical posture preparation");
    return structuredClone(source.solved.seeds);
  }

  /**
   * Snapshot an issued native preparation's original canonical source facts.
   * This observes the source epoch, like pose, rather than current-body
   * fallback; the owned curve separately maintains its live epoch proof.
   */
  export function source(
    prepared: IPrepared,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IObservation | undefined {
    const fixed: ISource | undefined = SOURCES.get(prepared);
    if (fixed?.rigUnchanged === undefined) return undefined;
    const names: AutoMovieHumanoidBone[] = new Array<AutoMovieHumanoidBone>(
      fixed.solved.pose.joints.length,
    );
    const values: (number | null)[] = new Array<number | null>(
      3 * names.length,
    );
    for (let i: number = 0; i < names.length; ++i) {
      const joint: IAutoMoviePose["joints"][number] =
        fixed.solved.pose.joints[i]!;
      names[i] = joint.bone;
      values[3 * i] = joint.flexion;
      values[3 * i + 1] = joint.abduction;
      values[3 * i + 2] = joint.twist;
    }
    return {
      names,
      values,
      bones: fixed.rig.resolveMap(
        fixed.solved.pose,
        resolution !== undefined &&
          prepareHumanPoseResolution.isNativeSource(resolution)
          ? prepareHumanPoseResolution.read(resolution)
          : undefined,
        requested,
      ),
    };
  }

  /** Independent observations of one actual canonical preparation source. */
  export interface IObservation {
    /**
     * Canonical bone at each flat clinical slot, in the actual source joint
     * order.
     */
    names: readonly AutoMovieHumanoidBone[];
    /** Three exact nullable clinical-degree coordinates per ordered bone. */
    values: readonly (number | null)[];
    /** Fresh demanded FK under this preparation's original canonical rig/pose. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * Observe an issued cold source through actual FK without exposing its pose.
   * Changed/unsupported rig context takes ordinary current cold resolution.
   */
  export function bones(
    prepared: IPrepared,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const fixed: ISource | undefined = SOURCES.get(prepared);
    if (fixed === undefined)
      throw new Error("Unissued canonical posture preparation");
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const unchanged: boolean =
      prepareHumanPoseResolution.isNativeSource(source) &&
      fixed.rig === fixed.body.poseResolution &&
      fixed.topology === fixed.body.topology &&
      fixed.rigUnchanged !== undefined &&
      fixed.rigUnchanged();
    const pose: IAutoMoviePose = unchanged
      ? source === undefined
        ? fixed.solved.pose
        : structuredClone(fixed.solved.pose)
      : resolveHumanPosture.seeded(
          fixed.body,
          fixed.raw,
          undefined,
          undefined,
          resolution,
        ).pose;
    return poseBones(fixed.body, pose, resolution(), requested);
  }

  /** Place a previously prepared current solve at a world-metre COM. */
  export function placed(
    prepared: IPrepared,
    model: IAutoMovieResolveCenterOfMass.IModel,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    centre: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture {
    return placeCurrent(
      prepared,
      model,
      bones(
        prepared,
        requested,
        prepareHumanPoseResolution.isNativeSource(resolution)
          ? resolution
          : undefined,
      ),
      centre,
    );
  }

  /**
   * Apply exactly the original COM subtract/add grouping to actual source
   * geometry.
   */
  function placeCurrent(
    prepared: IPrepared,
    model: IAutoMovieResolveCenterOfMass.IModel,
    placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    centre: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const source: ISource = SOURCES.get(prepared)!;
    const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      placed,
    );
    return translated(prepared, {
      x: centre.x - (com.x - source.raw.root.x),
      y: centre.y - (com.y - source.raw.root.y),
      z: centre.z - (com.z - source.raw.root.z),
    });
  }

  /**
   * Translate the original raw root and world demands by one world-metre
   * displacement. Attached goals and external colliders keep their own frames.
   * Unsupported contexts still receive raw translation and ordinary
   * resolution.
   */
  export function translated(
    prepared: IPrepared,
    root: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (source === undefined)
      throw new Error("Unissued canonical posture preparation");
    return issued(source, Raw.translated(source.raw, root));
  }

  /**
   * Carry a proven free-goal solve through an actual numeric rigid turn.
   * Foreign rotations and ordinary/changed raw postures retain the original
   * attached-rotation construction and ordinary canonical resolution.
   */
  export function turned(
    posture: IAutoMovieMotionHumanPosture,
    rotation: IAutoMovieHumanPostureRotation,
  ): IAutoMovieMotionHumanPosture {
    const attached: IAutoMovieMotionHumanPosture = { ...posture, rotation };
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (
      evidence === undefined ||
      !createHumanPostureRotation.unchanged(rotation)
    )
      return attached;
    const previous: ISource = evidence.source;
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined =
      read(previous.body, posture);
    if (
      solved === undefined ||
      solved.pose.root === null ||
      !createHumanPostureRotation.unchanged(rotation)
    )
      return attached;
    const raw: IAutoMovieMotionHumanPosture = structuredClone(attached);
    const turn: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
      turnHumanPosture(raw);
    solved.pose.root.translation = turn.position;
    solved.pose.root.rotation = turn.rotation;
    const source: ISource = { ...previous, raw: structuredClone(raw), solved };
    return issued(source, raw);
  }

  /** Construct a fresh rigid placement of an actual prepared joint-only shape. */
  export function rigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IAutoMovieMotionHumanPosture {
    const raw: IAutoMovieMotionHumanPosture | undefined = tryRigid(
      prepared,
      root,
      yaw,
      pitch,
      roll,
    );
    if (raw === undefined)
      throw new Error(
        "Rigid posture placement requires an issued joint-only source",
      );
    return raw;
  }

  /**
   * Construct the same authoritative rigid shape, declining unsupported
   * sources.
   */
  export function tryRigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IAutoMovieMotionHumanPosture | undefined {
    const source: ISource | undefined = SOURCES.get(prepared);
    if (
      source === undefined ||
      !Raw.eligible(source.raw) ||
      Object.keys(source.raw.limbs).length !== 0
    )
      return undefined;
    const raw: IAutoMovieMotionHumanPosture = Raw.translated(source.raw, root);
    raw.yaw = yaw;
    raw.pitch = pitch;
    raw.roll = roll;
    return issued(source, raw);
  }

  /**
   * Read a fresh independent copy of a proven translated cold solve, otherwise
   * decline so the ordinary resolver admits and solves the current request.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined {
    const evidence: IEvidence | undefined = CARRIED.get(posture);
    if (evidence === undefined || evidence.signature === undefined)
      return undefined;
    const source: ISource = evidence.source;
    if (
      source.body !== body ||
      source.rig !== body.poseResolution ||
      source.topology !== body.topology ||
      !Raw.eligible(posture) ||
      evidence.signature !== Raw.signature(posture) ||
      source.rigUnchanged === undefined ||
      !source.rigUnchanged()
    )
      return undefined;
    if (evidence.unchanged === undefined) return undefined;
    if (!evidence.unchanged()) {
      CARRIED.delete(posture);
      return undefined;
    }
    const out: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      structuredClone(source.solved);
    if (out.pose.root === null) return undefined;
    if (posture.rotation === undefined) {
      out.pose.root.translation = { ...posture.root };
      if (Object.keys(source.raw.limbs).length === 0)
        out.pose.root.rotation = humanPostureHeading(posture);
    } else {
      const turn: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture(posture);
      out.pose.root.translation = turn.position;
      if (Object.keys(source.raw.limbs).length === 0)
        out.pose.root.rotation = turn.rotation;
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

/**
 * Observed JSON and actual constructor authority are distinct, explicitly owned
 * fields.
 */
interface IEvidence {
  /** Actual preparation source; a JSON-only association cannot authorize reuse. */
  source: ISource;
  /** Original observed prefilter, never an injective physical-data certificate. */
  signature: string | undefined;
  /**
   * Present only for actual constructor-owned original native graph
   * verification.
   */
  unchanged: (() => boolean) | undefined;
}

/** Only explicit preparations own source results; no arbitrary input/time cache. */
const SOURCES: WeakMap<HumanPosturePreparation.IPrepared, ISource> =
  new WeakMap();

/** A candidate's evidence disappears when that exact raw object is released. */
const CARRIED: WeakMap<IAutoMovieMotionHumanPosture, IEvidence> = new WeakMap();

/**
 * Only actual owned constructors can mint complete graph provenance; JSON stays
 * an observed prefilter.
 */
function issued(
  source: ISource,
  raw: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  if (source.rigUnchanged !== undefined && Raw.eligible(raw)) {
    const unchanged: (() => boolean) | undefined =
      prepareIssuedHumanPosture(raw);
    const signature: string | undefined = Raw.signature(raw);
    CARRIED.set(raw, { source, signature, unchanged });
  }
  return raw;
}

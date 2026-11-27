
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieHumanPostureRotation, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanResolveHumanPosture, IAutoMovieMotionHumanTurnHumanPosture, IAutoMoviePose, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanPostureRaw as Raw } from "./HumanPostureRaw";
import { humanPostureHeading } from "./humanPostureHeading";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { turnHumanPosture } from "./turnHumanPosture";

/*
 * One canonical free-leg solve or direct-joint projection, prepared once and
 * read as placed: a translated, rigidly placed or turned posture is handed on
 * with the solve placed with it (`IPlaced.fit`), so a reader takes that solve
 * instead of solving the posture again.
 */
export namespace HumanPosturePreparation {
  /*
   * One preparation's public pose and the source it was solved from: values, as
   * the authoring is. Neither is changed once prepared.
   */
  export interface IPrepared {
    /*
     * The canonical output of the source resolution, a value the caller does
     * not change.
     */
    pose: IAutoMoviePose;

    /*
     * The authoring and its solve.
     */
    readonly source: ISource;
  }

  /*
   * The authoring a preparation solved and the solve itself.
   */
  export interface ISource {
    /*
     * The body solved on.
     */
    readonly body: IAutoMovieMotionHumanBody;

    /*
     * The authoring, a value.
     */
    readonly raw: IAutoMovieMotionHumanPosture;

    /*
     * Its solve.
     */
    readonly solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded;

    /*
     * Whether the solve may be placed with a rigid motion of the authoring:
     * solved by a native reader, on free leg goals and direct joints alone
     * (`HumanPostureRaw.eligible`).
     */
    readonly placeable: boolean;
  }

  /*
   * A posture placed from a preparation, and its solve placed with it.
   */
  export interface IPlaced {
    /*
     * The placed authoring.
     */
    posture: IAutoMovieMotionHumanPosture;

    /*
     * The preparation's source.
     */
    source: ISource;

    /*
     * The placed posture's solve: the source's solve moved with the posture
     * where the source is placeable, the posture's own solve otherwise.
     * Returns: A fresh solve.
     */
    fit(): IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
  }

  /*
   * Solve authoring at this explicit preparation boundary. The authoring is a
   * value: the caller does not change it once it is prepared, so the
   * preparation keeps it as given, and its public pose is the solve's own,
   * equally a value.
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

  /*
   * Prepare an owned curve's current target from deterministic seeds.
   */
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

  /*
   * Copy only the per-limb branch/swivel data of a preparation.
   */
  export function seeds(
    prepared: IPrepared,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] {
    return structuredClone(prepared.source.solved.seeds);
  }

  /*
   * Snapshot a placeable preparation's canonical source facts: its joints'
   * clinical values in order and its demanded bones.
   */
  export function source(
    prepared: IPrepared,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IObservation | undefined {
    const fixed: ISource = prepared.source;
    if (!fixed.placeable) return undefined;
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
      bones: fixed.body.poseResolution.resolveMap(
        fixed.solved.pose,
        resolution === undefined
          ? undefined
          : prepareHumanPoseResolution.read(resolution),
        requested,
      ),
    };
  }

  /*
   * Independent observations of one canonical preparation source.
   */
  export interface IObservation {
    /*
     * Canonical bone at each flat clinical slot, in the source joint order.
     */
    names: readonly AutoMovieHumanoidBone[];
    /*
     * Three exact nullable clinical-degree coordinates per ordered bone.
     */
    values: readonly (number | null)[];
    /*
     * Fresh demanded FK under this preparation's canonical rig and pose.
     */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /*
   * Observe a preparation's solve through FK without exposing its pose; a
   * foreign reader or an unplaceable source reads the authoring's ordinary cold
   * resolution.
   */
  export function bones(
    prepared: IPrepared,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const fixed: ISource = prepared.source;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const pose: IAutoMoviePose = fixed.placeable
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

  /*
   * Place a prepared solve at a world-metre centre of mass.
   */
  export function placed(
    prepared: IPrepared,
    model: IAutoMovieResolveCenterOfMass.IModel,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    centre: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IPlaced {
    const com: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
      model,
      bones(prepared, requested, resolution),
    );
    const raw: IAutoMovieMotionHumanPosture = prepared.source.raw;
    return translated(prepared, {
      x: centre.x - (com.x - raw.root.x),
      y: centre.y - (com.y - raw.root.y),
      z: centre.z - (com.z - raw.root.z),
    });
  }

  /*
   * Translate the raw root and world demands by one world-metre displacement.
   * Attached goals and external colliders keep their own frames.
   */
  export function translated(
    prepared: IPrepared,
    root: IAutoMovieVector3,
  ): IPlaced {
    return placedAt(prepared.source, Raw.translated(prepared.source.raw, root));
  }

  /*
   * Carry a placed solve through a numeric rigid turn: the posture takes the
   * rotation, and its solve the turned root.
   */
  export function turned(
    placed: IPlaced,
    rotation: IAutoMovieHumanPostureRotation,
  ): IPlaced {
    const posture: IAutoMovieMotionHumanPosture = {
      ...placed.posture,
      rotation,
    };
    const source: ISource = placed.source;
    return {
      posture,
      source,
      fit: (): IAutoMovieMotionHumanResolveHumanPosture.ISeeded => {
        if (!source.placeable) return ordinary(source.body, posture);
        const out: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
          placed.fit();
        if (out.pose.root === null) return ordinary(source.body, posture);
        const turn: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
          turnHumanPosture(structuredClone(posture));
        out.pose.root.translation = turn.position;
        out.pose.root.rotation = turn.rotation;
        return out;
      },
    };
  }

  /*
   * A placed posture as the articulation its solve reached: the placed root,
   * heading and turn, every bone at the solve's clinical angles and no goal, so
   * a reader evaluates it by forward kinematics alone instead of solving the
   * placed goals again. A neutral (null) coordinate reads as zero.
   * Parameter placed: The placed posture and its solve.
   * Returns: A fresh joints-only posture.
   */
  export function articulated(placed: IPlaced): IAutoMovieMotionHumanPosture {
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      placed.fit();
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of solved.pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    const posture: IAutoMovieMotionHumanPosture = placed.posture;
    return {
      root: { ...posture.root },
      yaw: posture.yaw,
      pitch: posture.pitch,
      roll: posture.roll,
      joints,
      limbs: {},
      ...(posture.rotation === undefined ? {} : { rotation: posture.rotation }),
    };
  }

  /*
   * Construct a fresh rigid placement of a prepared joint-only shape.
   */
  export function rigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IPlaced {
    const placed: IPlaced | undefined = tryRigid(
      prepared,
      root,
      yaw,
      pitch,
      roll,
    );
    if (placed === undefined)
      throw new Error(
        "Rigid posture placement requires a placeable joint-only source",
      );
    return placed;
  }

  /*
   * Construct the same rigid shape, declining a source that is not placeable or
   * has limb goals.
   */
  export function tryRigid(
    prepared: IPrepared,
    root: IAutoMovieVector3,
    yaw: number,
    pitch: number,
    roll: number,
  ): IPlaced | undefined {
    const source: ISource = prepared.source;
    if (!source.placeable || Object.keys(source.raw.limbs).length !== 0)
      return undefined;
    const raw: IAutoMovieMotionHumanPosture = Raw.translated(source.raw, root);
    raw.yaw = yaw;
    raw.pitch = pitch;
    raw.roll = roll;
    return placedAt(source, raw);
  }

  /*
   * Solve the given authoring, a value, with the one source solver.
   */
  function prepareCurrent(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    solve: typeof coldSource,
  ): IPrepared {
    const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = solve(
      body,
      posture,
      near,
      resolution,
      projection,
    );
    const source: ISource = {
      body,
      raw: posture,
      solved,
      placeable: Raw.eligible(posture),
    };
    let shown: IAutoMoviePose | undefined;
    return {
      get pose(): IAutoMoviePose {
        return shown ?? solved.pose;
      },
      set pose(value: IAutoMoviePose) {
        shown = value;
      },
      source,
    };
  }

  /*
   * Public cold preparation runs the ordinary owned source solve.
   */
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
}

/*
 * A posture placed from a source, and its solve: the source's solve with the
 * placed root, read when asked, or the posture's ordinary solve where the
 * source is not placeable.
 */
function placedAt(
  source: HumanPosturePreparation.ISource,
  posture: IAutoMovieMotionHumanPosture,
): HumanPosturePreparation.IPlaced {
  return {
    posture,
    source,
    fit: (): IAutoMovieMotionHumanResolveHumanPosture.ISeeded => {
      if (!source.placeable) return ordinary(source.body, posture);
      const out: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        structuredClone(source.solved);
      if (out.pose.root === null) return ordinary(source.body, posture);
      out.pose.root.translation = { ...posture.root };
      if (Object.keys(source.raw.limbs).length === 0)
        out.pose.root.rotation = humanPostureHeading(posture);
      return out;
    },
  };
}

/*
 * A posture's ordinary cold solve.
 */
function ordinary(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
  return resolveHumanPosture.seeded(body, posture);
}

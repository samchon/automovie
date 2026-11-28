import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanJointCentres,
  IAutoMovieHumanNeutral,
  IAutoMovieHumanPose,
  IAutoMovieHumanPoseClamp,
  IAutoMovieHumanPoseProjection,
  IAutoMovieHumanPreparedKinematics,
  IAutoMovieHumanSkeletonMath,
} from "@automovie/interface";

import { AutoMovieHumanNeutral as Neutral } from "./AutoMovieHumanNeutral";
import { AutoMovieHumanPelvicShare } from "./AutoMovieHumanPelvicShare";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";

/** One body's clinical FK law, shared by complete snapshots and fixed-bone projections. */
export namespace AutoMovieHumanPreparedKinematics {
  /**
   * Prepare forward kinematics for fixed neutral joints and their body scale.
   * Supply the fixed neutral frame data, calibration-to-metre scale and
   * dimensionless body scale. The returned evaluator can project selected
   * bones and their ancestors. Pose evaluations return placements and clamp
   * records with owned arrays.
   */
  export function prepare(
    joints: IAutoMovieHumanJointCentres.IJoint[],
    neutral: IAutoMovieHumanNeutral.IOutput,
    scale: number,
    mmScale: number,
  ): IAutoMovieHumanPreparedKinematics.IPrepared {
    const byBone: Map<string, IAutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          joint: IAutoMovieHumanJointCentres.IJoint,
        ): [string, IAutoMovieHumanJointCentres.IJoint] => [joint.bone, joint],
      ),
    );
    const indices: Map<string, number> = new Map(
      joints.map(
        (
          joint: IAutoMovieHumanJointCentres.IJoint,
          index: number,
        ): [string, number] => [joint.bone, index],
      ),
    );
    const directions: Map<string, AutoMovieVector3Tuple> = new Map(
      joints.map(
        (
          joint: IAutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieVector3Tuple] => [
          joint.bone,
          M.unit(M.sub(joint.toward, joint.position)),
        ],
      ),
    );
    const bones: IBone[] = joints.map(
      (joint: IAutoMovieHumanJointCentres.IJoint): IBone => ({
        joint,
        parent: joint.parent === null ? undefined : indices.get(joint.parent)!,
        offset:
          joint.parent === null
            ? [0, 0, 0]
            : M.sub(joint.position, byBone.get(joint.parent)!.position),
        axes: M.boneAxes(joint.bone, directions.get(joint.bone)!, byBone),
        lowerArm: joint.bone.endsWith("LowerArm"),
        hand: joint.bone.endsWith("Hand"),
        scapula: joint.bone.endsWith("Scapula"),
      }),
    );
    const channels: IChannel[] = AutoMovieHumanPoseChannels.flatMap(
      (row: (typeof AutoMovieHumanPoseChannels)[number]): IChannel[] =>
        (row[0].includes("<side>") ? ["left", "right"] : [""]).map(
          (side: string): IChannel => {
            const path: string = row[0].replace("<side>", side);
            return {
              row,
              path,
              bone: row[1].replace("<side>", side),
              parts: path.split("."),
              sign: row[6] === true && side === "right" ? -row[3] : row[3],
            };
          },
        ),
    );
    const all: number[] = bones.map((_: IBone, index: number): number => index);
    const locals: (ILocal | undefined)[] = new Array<ILocal | undefined>(
      bones.length,
    );
    const worlds: (IWorld | undefined)[] = new Array<IWorld | undefined>(
      bones.length,
    );

    return {
      select: (
        names: readonly string[],
      ): IAutoMovieHumanPreparedKinematics.ISelection => {
        if (names.length === 0)
          throw new Error("Human FK projection requires existing bones");
        const output: Set<string> = new Set(names);
        const work: Set<number> = new Set();
        for (const name of output) {
          let index: number | undefined = indices.get(name);
          if (index === undefined)
            throw new Error(`Human FK projection bone absent: ${name}`);
          while (index !== undefined && !work.has(index)) {
            work.add(index);
            index = bones[index]!.parent;
          }
        }
        return {
          work: all.filter((index: number): boolean => work.has(index)),
          output,
        };
      },
      evaluate: (
        input: IAutoMovieHumanPose,
        clamp: boolean,
        selection?: IAutoMovieHumanPreparedKinematics.ISelection,
      ): IAutoMovieHumanPoseProjection => {
        const rig: Map<string, Record<string, number>> = new Map();
        const clamped: IAutoMovieHumanPoseClamp[] = [];
        for (const { row, path, bone, parts, sign } of channels) {
          const requested: number | undefined = read(input, parts);
          if (requested === undefined) continue;
          let min: number = row[4];
          let max: number = row[5];
          if (clamp && path.endsWith("knee.rotation")) {
            const interval: { minimum: number; maximum: number } =
              Controls.bounds(Controls.channel(path), input);
            min = interval.minimum;
            max = interval.maximum;
          }
          const applied: number = clamp
            ? Math.min(max, Math.max(min, requested))
            : requested;
          if (applied !== requested) clamped.push({ path, requested, applied });
          const axis: string = row[2];
          const degrees: number =
            axis === "forward" || axis === "lateral"
              ? applied
              : path === "head.jaw.opening"
                ? (applied /
                    Math.hypot(
                      ...M.sub(
                        byBone.get(bone)!.tip!,
                        byBone.get(bone)!.position,
                      ),
                    )) *
                  (180 / Math.PI)
                : applied;
          const resting: number =
            axis === "abduction" ? (neutral.resting.get(bone) ?? 0) : 0;
          const value: number =
            axis === "forward" || axis === "lateral"
              ? sign * applied
              : sign * degrees * (1 - resting / 180);
          const record: Record<string, number> = rig.get(bone) ?? {};
          record[axis] = value;
          rig.set(bone, record);
        }

        // Arm elevation drives its ancestor girdle even when only the hand is requested.
        const lifts: Map<string, number> = new Map();
        for (const side of ["left", "right"]) {
          const arm: string = `${side}UpperArm`;
          const r: Record<string, number> | undefined = rig.get(arm);
          if (r === undefined) continue;
          const a: IAutoMovieHumanSkeletonMath.IAxes =
            bones[indices.get(arm)!]!.axes;
          const direction: AutoMovieVector3Tuple = directions.get(arm)!;
          const raised: AutoMovieVector3Tuple = M.rotate(
            M.multiply(
              M.multiply(
                M.fromAxisAngle(a.twist, r.twist ?? 0),
                M.fromAxisAngle(a.abduction, r.abduction ?? 0),
              ),
              M.fromAxisAngle(a.flexion, r.flexion ?? 0),
            ),
            direction,
          );
          const over: number =
            fromVertical(raised) - Math.max(SETTING, fromVertical(direction));
          if (over > 0)
            lifts.set(
              `${side}Shoulder`,
              (RHYTHM * over * over) / (over + EASE),
            );
        }

        // Both clinical hips drive the root even in a fixed-branch projection.
        // Its immediate children return that turn, retaining requested directions.
        const pelvicTilt: number = AutoMovieHumanPelvicShare.tilt(
          rig.get("leftUpperLeg")?.flexion ?? 0,
          rig.get("rightUpperLeg")?.flexion ?? 0,
        );
        const posed: IAutoMovieHumanBonePlacement[] = [];
        for (const index of selection?.work ?? all) {
          const compiled: IBone = bones[index]!;
          const j: IAutoMovieHumanJointCentres.IJoint = compiled.joint;
          const a: IAutoMovieHumanSkeletonMath.IAxes = compiled.axes;
          const r: Record<string, number> | undefined = rig.get(j.bone);
          const flexion: number = r?.flexion ?? 0;
          const abduction: number = r?.abduction ?? 0;
          const twist: number = r?.twist ?? 0;
          const forward: number = r?.forward ?? 0;
          const lateral: number = r?.lateral ?? 0;
          const lift: number | undefined = lifts.get(j.bone);
          const handTwist: number = compiled.hand
            ? (rig.get(j.parent!)?.twist ?? 0)
            : 0;
          const tilt: number = compiled.parent === undefined ? pelvicTilt : 0;
          const back: AutoMovieQuaternionTuple | undefined =
            compiled.parent === undefined
              ? undefined
              : locals[compiled.parent]?.back;
          const cached: ILocal | undefined = locals[index];
          let local: AutoMovieQuaternionTuple;
          if (
            cached &&
            cached.flexion === flexion &&
            cached.abduction === abduction &&
            cached.twist === twist &&
            cached.forward === forward &&
            cached.lateral === lateral &&
            cached.lift === (lift ?? 0) &&
            cached.handTwist === handTwist &&
            cached.tilt === tilt &&
            sameBack(cached.incoming, back)
          )
            local = cached.rotation;
          else {
            const qf: AutoMovieQuaternionTuple = M.fromAxisAngle(
              a.flexion,
              flexion,
            );
            const qa: AutoMovieQuaternionTuple = M.fromAxisAngle(
              a.abduction,
              abduction,
            );
            const qt: AutoMovieQuaternionTuple = M.fromAxisAngle(
              a.twist,
              twist * (compiled.lowerArm ? 1 - Neutral.WRIST_TWIST : 1),
            );
            const own: AutoMovieQuaternionTuple = compiled.lowerArm
              ? M.multiply(M.multiply(qa, qf), qt)
              : M.multiply(M.multiply(qt, qa), qf);
            local = compiled.hand
              ? M.multiply(
                  M.fromAxisAngle(
                    bones[compiled.parent!]!.axes.twist,
                    handTwist * Neutral.WRIST_TWIST,
                  ),
                  own,
                )
              : own;
            let returned: AutoMovieQuaternionTuple | undefined;
            if (lift !== undefined) {
              const raised: AutoMovieQuaternionTuple = M.multiply(
                M.multiply(qt, M.fromAxisAngle(a.abduction, abduction + lift)),
                qf,
              );
              returned = M.multiply(
                [-raised[0], -raised[1], -raised[2], raised[3]],
                local,
              );
              local = raised;
            }
            if (
              back !== undefined &&
              (compiled.scapula ||
                bones[compiled.parent!]!.parent === undefined)
            )
              local = M.multiply(back, local);
            if (tilt > 0) {
              const turned: AutoMovieQuaternionTuple = M.multiply(
                M.fromAxisAngle(a.flexion, -tilt),
                local,
              );
              returned = M.multiply(
                [-turned[0], -turned[1], -turned[2], turned[3]],
                local,
              );
              local = turned;
            }
            locals[index] = {
              flexion,
              abduction,
              twist,
              forward,
              lateral,
              lift: lift ?? 0,
              handTwist,
              tilt,
              incoming: back,
              rotation: local,
              back: returned,
            };
          }
          const parent: IAutoMovieHumanBonePlacement | undefined =
            compiled.parent === undefined
              ? undefined
              : worlds[compiled.parent]!.placement;
          let previous: IWorld | undefined = worlds[index];
          if (
            previous === undefined ||
            previous.local !== local ||
            previous.parent !== parent
          ) {
            const shifted: AutoMovieVector3Tuple = [
              compiled.offset[0] + forward * mmScale,
              compiled.offset[1],
              compiled.offset[2] + lateral * mmScale,
            ];
            const placement: IAutoMovieHumanBonePlacement =
              parent === undefined
                ? {
                    bone: j.bone,
                    position: M.times(j.position, scale),
                    rotation: local,
                  }
                : {
                    bone: j.bone,
                    position: M.add(
                      parent.position,
                      M.times(M.rotate(parent.rotation, shifted), scale),
                    ),
                    rotation: M.multiply(parent.rotation, local),
                  };
            previous = {
              local,
              parent,
              placement,
              bound: M.multiply(placement.rotation, neutral.turns.get(j.bone)!),
            };
            worlds[index] = previous;
          }
          if (selection === undefined || selection.output.has(j.bone))
            posed.push({
              bone: j.bone,
              position: [...previous.placement.position],
              rotation: [...previous.bound],
            });
        }
        return { posed, clamped };
      },
    };
  }
}

/*
 * One canonical clinical leaf, expanded and traversed without splitting per trial.
 */
interface IChannel {
  /*
   * Single canonical row, retaining units, sign and limits.
   */
  row: (typeof AutoMovieHumanPoseChannels)[number];

  /*
   * Expanded public path, also the observable clamp identity.
   */
  path: string;

  /*
   * Expanded driven joint.
   */
  bone: string;

  /*
   * Fixed object traversal; caller pose objects are never cached.
   */
  parts: readonly string[];

  /*
   * Axis sign after reflecting world-direction channels on the right.
   */
  sign: number;
}

/*
 * Compiled fixed anatomical metadata for a parent-before-child joint.
 */
interface IBone {
  /*
   * Neutral anatomical centre and direction.
   */
  joint: IAutoMovieHumanJointCentres.IJoint;

  /*
   * Parent index; undefined identifies the root.
   */
  parent: number | undefined;

  /*
   * Neutral parent-relative offset in source millimetres.
   */
  offset: AutoMovieVector3Tuple;

  /*
   * Existing registered clinical axes.
   */
  axes: IAutoMovieHumanSkeletonMath.IAxes;

  /*
   * Forearm twist is shared with its hand.
   */
  lowerArm: boolean;

  /*
   * Hand receives the distal fraction of forearm twist.
   */
  hand: boolean;

  /*
   * Scapula returns its girdle's elevation turn.
   */
  scapula: boolean;
}

/*
 * One bounded private cache record, keyed by every applied local dependency.
 */
interface ILocal {
  /*
   * Applied flexion after sign and resting-arm scaling.
   */
  flexion: number;

  /*
   * Applied abduction after sign and resting-arm scaling.
   */
  abduction: number;

  /*
   * Applied twist.
   */
  twist: number;

  /*
   * Applied jaw forward translation.
   */
  forward: number;

  /*
   * Applied jaw lateral translation.
   */
  lateral: number;

  /*
   * Applied shoulder lift, or zero.
   */
  lift: number;

  /*
   * Parent forearm's applied twist, or zero.
   */
  handTwist: number;

  /*
   * Clinical hip share carried by the root, zero on other joints.
   */
  tilt: number;

  /*
   * Parent girdle's return quaternion, compared component by component.
   */
  incoming: AutoMovieQuaternionTuple | undefined;

  /*
   * Local neutral-relative rotation.
   */
  rotation: AutoMovieQuaternionTuple;

  /*
   * This girdle's own return rotation for its child.
   */
  back: AutoMovieQuaternionTuple | undefined;
}

/*
 * Exact local/parent identity reuses both world and bind-composed arithmetic.
 */
interface IWorld {
  /*
   * Private immutable local quaternion identity.
   */
  local: AutoMovieQuaternionTuple;

  /*
   * Private immutable parent placement identity.
   */
  parent: IAutoMovieHumanBonePlacement | undefined;

  /*
   * Private world position and neutral-relative rotation.
   */
  placement: IAutoMovieHumanBonePlacement;

  /*
   * Same placement rotation composed with the fixed bind-to-neutral turn.
   */
  bound: AutoMovieQuaternionTuple;
}

/*
 * Clavicle share of Inman's scapulohumeral rhythm, degrees per elevated arm degree.
 */
const RHYTHM: number = 0.2;

/*
 * Arm elevation below which the girdle stays still, degrees from downward vertical.
 */
const SETTING: number = 30;

/*
 * Elevation interval over which the preserved rhythm takes up smoothly, degrees.
 */
const EASE: number = 10;

/*
 * Match the old scalar key's zero equivalence without allocating a joined string.
 */
function sameBack(
  a: AutoMovieQuaternionTuple | undefined,
  b: AutoMovieQuaternionTuple | undefined,
): boolean {
  return (
    a === b ||
    (a !== undefined &&
      b !== undefined &&
      a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3])
  );
}

/*
 * Arm elevation from the downward plumb line, preserving the original rhythm law.
 */
function fromVertical(direction: AutoMovieVector3Tuple): number {
  return (Math.acos(Math.max(-1, Math.min(1, -direction[1]))) * 180) / Math.PI;
}

/*
 * Read the current scalar value; no pose identity or previous input is trusted.
 */
function read(pose: unknown, parts: readonly string[]): number | undefined {
  let node: unknown = pose;
  for (const key of parts) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : undefined;
}

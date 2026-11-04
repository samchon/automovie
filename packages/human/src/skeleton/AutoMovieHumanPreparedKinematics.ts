import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import type { AutoMovieHumanJointCentres as Centres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanNeutral as Neutral } from "./AutoMovieHumanNeutral";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as M } from "./AutoMovieHumanSkeletonMath";

/** One body's clinical FK law, shared by complete snapshots and fixed-bone projections. */
export namespace AutoMovieHumanPreparedKinematics {
  /** A body-local selection retains requested outputs and every required ancestor. */
  export interface ISelection {
    /** Parent-before-child calculation population, including girdle dependencies. */
    work: readonly number[];

    /** Requested placement identities; ancestors need not escape the kernel. */
    output: ReadonlySet<string>;
  }

  /** Explicit body lifetime; no input poses or public output arrays are retained. */
  export interface IPrepared {
    /** Read every clinical channel and return independent placements and clamp rows. */
    evaluate: (pose: IAutoMovieHumanPose, clamp: boolean, selection?: ISelection) => Skeleton.IProjection;

    /** Compile and admit a nonempty fixed set of existing bone identities once. */
    select: (bones: readonly string[]) => ISelection;
  }

  /**
   * Compile neutral anatomy once. Projections only omit unused output and branch
   * work: the channel/clamp law and quaternion operation order are identical.
   * Private local/world records are bounded by this body's joint count. Every
   * escaping placement and clamp owns its arrays; neither accepted solver state
   * nor earlier public snapshots can be overwritten by subsequent trials.
   */
  export function prepare(joints: Centres.IJoint[], neutral: Neutral.IOutput, scale: number, mmScale: number): IPrepared {
    const byBone: Map<string, Centres.IJoint> = new Map(joints.map((joint: Centres.IJoint): [string, Centres.IJoint] => [joint.bone, joint]));
    const indices: Map<string, number> = new Map(joints.map((joint: Centres.IJoint, index: number): [string, number] => [joint.bone, index]));
    const directions: Map<string, M.Vector> = new Map(joints.map((joint: Centres.IJoint): [string, M.Vector] => [joint.bone, M.unit(M.sub(joint.toward, joint.position))]));
    const bones: IBone[] = joints.map((joint: Centres.IJoint): IBone => ({
      joint,
      parent: joint.parent === null ? undefined : indices.get(joint.parent)!,
      offset: joint.parent === null ? [0, 0, 0] : M.sub(joint.position, byBone.get(joint.parent)!.position),
      axes: M.boneAxes(joint.bone, directions.get(joint.bone)!, byBone),
      lowerArm: joint.bone.endsWith("LowerArm"),
      hand: joint.bone.endsWith("Hand"),
      scapula: joint.bone.endsWith("Scapula"),
    }));
    const channels: IChannel[] = AutoMovieHumanPoseChannels.flatMap((row: (typeof AutoMovieHumanPoseChannels)[number]): IChannel[] =>
      (row[0].includes("<side>") ? ["left", "right"] : [""]).map((side: string): IChannel => {
        const path: string = row[0].replace("<side>", side);
        return {row, path, bone: row[1].replace("<side>", side), parts: path.split(".")};
      }),
    );
    const all: number[] = bones.map((_: IBone, index: number): number => index);
    const locals: (ILocal | undefined)[] = new Array<ILocal | undefined>(bones.length);
    const worlds: (IWorld | undefined)[] = new Array<IWorld | undefined>(bones.length);

    return {
      select: (names: readonly string[]): ISelection => {
        if (names.length === 0) throw new Error("Human FK projection requires existing bones");
        const output: Set<string> = new Set(names);
        const work: Set<number> = new Set();
        for (const name of output) {
          let index: number | undefined = indices.get(name);
          if (index === undefined) throw new Error(`Human FK projection bone absent: ${name}`);
          while (index !== undefined && !work.has(index)) {
            work.add(index);
            index = bones[index]!.parent;
          }
        }
        return {work: all.filter((index: number): boolean => work.has(index)), output};
      },
      evaluate: (input: IAutoMovieHumanPose, clamp: boolean, selection?: ISelection): Skeleton.IProjection => {
        const rig: Map<string, Record<string, number>> = new Map();
        const clamped: Skeleton.IClamp[] = [];
        for (const {row, path, bone, parts} of channels) {
          const requested: number | undefined = read(input, parts);
          if (requested === undefined) continue;
          let min: number = row[4];
          let max: number = row[5];
          if (clamp && path.endsWith("knee.rotation")) {
            const interval: {minimum: number; maximum: number} = Controls.bounds(Controls.channel(path), input);
            min = interval.minimum;
            max = interval.maximum;
          }
          const applied: number = clamp ? Math.min(max, Math.max(min, requested)) : requested;
          if (applied !== requested) clamped.push({path, requested, applied});
          const axis: string = row[2];
          const degrees: number = axis === "forward" || axis === "lateral" ? applied : path === "head.jaw.opening"
            ? (applied / Math.hypot(...M.sub(byBone.get(bone)!.tip!, byBone.get(bone)!.position))) * (180 / Math.PI)
            : applied;
          const resting: number = axis === "abduction" ? (neutral.resting.get(bone) ?? 0) : 0;
          const value: number = axis === "forward" || axis === "lateral" ? row[3] * applied : row[3] * degrees * (1 - resting / 180);
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
          const a: M.IAxes = bones[indices.get(arm)!]!.axes;
          const direction: M.Vector = directions.get(arm)!;
          const raised: M.Vector = M.rotate(M.multiply(M.multiply(M.fromAxisAngle(a.twist, r.twist ?? 0), M.fromAxisAngle(a.abduction, r.abduction ?? 0)), M.fromAxisAngle(a.flexion, r.flexion ?? 0)), direction);
          const over: number = fromVertical(raised) - Math.max(SETTING, fromVertical(direction));
          if (over > 0) lifts.set(`${side}Shoulder`, (RHYTHM * over * over) / (over + EASE));
        }

        const posed: Skeleton.IPlacement[] = [];
        for (const index of selection?.work ?? all) {
          const compiled: IBone = bones[index]!;
          const j: Centres.IJoint = compiled.joint;
          const a: M.IAxes = compiled.axes;
          const r: Record<string, number> | undefined = rig.get(j.bone);
          const flexion: number = r?.flexion ?? 0;
          const abduction: number = r?.abduction ?? 0;
          const twist: number = r?.twist ?? 0;
          const forward: number = r?.forward ?? 0;
          const lateral: number = r?.lateral ?? 0;
          const lift: number | undefined = lifts.get(j.bone);
          const handTwist: number = compiled.hand ? (rig.get(j.parent!)?.twist ?? 0) : 0;
          const back: M.Quaternion | undefined = compiled.parent === undefined ? undefined : locals[compiled.parent]?.back;
          const cached: ILocal | undefined = locals[index];
          let local: M.Quaternion;
          if (cached && cached.flexion === flexion && cached.abduction === abduction && cached.twist === twist && cached.forward === forward && cached.lateral === lateral && cached.lift === (lift ?? 0) && cached.handTwist === handTwist && sameBack(cached.incoming, back)) local = cached.rotation;
          else {
            const qf: M.Quaternion = M.fromAxisAngle(a.flexion, flexion);
            const qa: M.Quaternion = M.fromAxisAngle(a.abduction, abduction);
            const qt: M.Quaternion = M.fromAxisAngle(a.twist, twist * (compiled.lowerArm ? 1 - Neutral.WRIST_TWIST : 1));
            const own: M.Quaternion = compiled.lowerArm ? M.multiply(M.multiply(qa, qf), qt) : M.multiply(M.multiply(qt, qa), qf);
            local = compiled.hand ? M.multiply(M.fromAxisAngle(bones[compiled.parent!]!.axes.twist, handTwist * Neutral.WRIST_TWIST), own) : own;
            let returned: M.Quaternion | undefined;
            if (lift !== undefined) {
              const raised: M.Quaternion = M.multiply(M.multiply(qt, M.fromAxisAngle(a.abduction, abduction + lift)), qf);
              returned = M.multiply([-raised[0], -raised[1], -raised[2], raised[3]], local);
              local = raised;
            }
            if (back !== undefined && compiled.scapula) local = M.multiply(back, local);
            locals[index] = {flexion, abduction, twist, forward, lateral, lift: lift ?? 0, handTwist, incoming: back, rotation: local, back: returned};
          }
          const parent: Skeleton.IPlacement | undefined = compiled.parent === undefined ? undefined : worlds[compiled.parent]!.placement;
          let previous: IWorld | undefined = worlds[index];
          if (previous === undefined || previous.local !== local || previous.parent !== parent) {
            const shifted: M.Vector = [compiled.offset[0] + forward * mmScale, compiled.offset[1], compiled.offset[2] + lateral * mmScale];
            const placement: Skeleton.IPlacement = parent === undefined
              ? {bone: j.bone, position: M.times(j.position, scale), rotation: local}
              : {bone: j.bone, position: M.add(parent.position, M.times(M.rotate(parent.rotation, shifted), scale)), rotation: M.multiply(parent.rotation, local)};
            previous = {local, parent, placement, bound: M.multiply(placement.rotation, neutral.turns.get(j.bone)!)};
            worlds[index] = previous;
          }
          if (selection === undefined || selection.output.has(j.bone)) posed.push({bone: j.bone, position: [...previous.placement.position], rotation: [...previous.bound]});
        }
        return {posed, clamped};
      },
    };
  }
}

/** One canonical clinical leaf, expanded and traversed without splitting per trial. */
interface IChannel {
  /** Single canonical row, retaining units, sign and limits. */
  row: (typeof AutoMovieHumanPoseChannels)[number];

  /** Expanded public path, also the observable clamp identity. */
  path: string;

  /** Expanded driven joint. */
  bone: string;

  /** Fixed object traversal; caller pose objects are never cached. */
  parts: readonly string[];
}

/** Compiled fixed anatomical metadata for a parent-before-child joint. */
interface IBone {
  /** Neutral anatomical centre and direction. */
  joint: Centres.IJoint;

  /** Parent index; undefined identifies the root. */
  parent: number | undefined;

  /** Neutral parent-relative offset in source millimetres. */
  offset: M.Vector;

  /** Existing registered clinical axes. */
  axes: M.IAxes;

  /** Forearm twist is shared with its hand. */
  lowerArm: boolean;

  /** Hand receives the distal fraction of forearm twist. */
  hand: boolean;

  /** Scapula returns its girdle's elevation turn. */
  scapula: boolean;
}

/** One bounded private cache record, keyed by every applied local dependency. */
interface ILocal {
  /** Applied flexion after sign and resting-arm scaling. */
  flexion: number;

  /** Applied abduction after sign and resting-arm scaling. */
  abduction: number;

  /** Applied twist. */
  twist: number;

  /** Applied jaw forward translation. */
  forward: number;

  /** Applied jaw lateral translation. */
  lateral: number;

  /** Applied shoulder lift, or zero. */
  lift: number;

  /** Parent forearm's applied twist, or zero. */
  handTwist: number;

  /** Parent girdle's return quaternion, compared component by component. */
  incoming: M.Quaternion | undefined;

  /** Local neutral-relative rotation. */
  rotation: M.Quaternion;

  /** This girdle's own return rotation for its child. */
  back: M.Quaternion | undefined;
}

/** Exact local/parent identity reuses both world and bind-composed arithmetic. */
interface IWorld {
  /** Private immutable local quaternion identity. */
  local: M.Quaternion;

  /** Private immutable parent placement identity. */
  parent: Skeleton.IPlacement | undefined;

  /** Private world position and neutral-relative rotation. */
  placement: Skeleton.IPlacement;

  /** Same placement rotation composed with the fixed bind-to-neutral turn. */
  bound: M.Quaternion;
}

/** Clavicle share of Inman's scapulohumeral rhythm, degrees per elevated arm degree. */
const RHYTHM: number = 0.2;

/** Arm elevation below which the girdle stays still, degrees from downward vertical. */
const SETTING: number = 30;

/** Elevation interval over which the preserved rhythm takes up smoothly, degrees. */
const EASE: number = 10;

/** Match the old scalar key's zero equivalence without allocating a joined string. */
function sameBack(a: M.Quaternion | undefined, b: M.Quaternion | undefined): boolean {
  return a === b || (a !== undefined && b !== undefined && a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]);
}

/** Arm elevation from the downward plumb line, preserving the original rhythm law. */
function fromVertical(direction: M.Vector): number {
  return (Math.acos(Math.max(-1, Math.min(1, -direction[1]))) * 180) / Math.PI;
}

/** Read the current scalar value; no pose identity or previous input is trusted. */
function read(pose: unknown, parts: readonly string[]): number | undefined {
  let node: unknown = pose;
  for (const key of parts) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : undefined;
}

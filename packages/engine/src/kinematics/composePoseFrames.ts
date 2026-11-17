import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Compose every bone's frame of one rooted rig from its articulations, in
 * place, on numeric tables: one parent-first pass with no name lookup and no
 * record made.
 *
 * A bone's local rotation is its rest rotation times its articulation; its
 * world rotation is its parent's world rotation times that; and its world
 * position is its parent's world position plus the parent-rotated rest
 * offset. A bone with no parent stands under the given root. The rows are
 * parent first, so a parent's frame is complete when its child reads it.
 * Scale is not read. Nothing is admitted or normalized: the articulations
 * and the root are what an admission wrote, and a component that is not a
 * number propagates as arithmetic gives it.
 *
 * The expressions are those of `Quaternion.multiply`, `Quaternion.rotateVector`
 * and `Vector3.add`, in their grouping, so a frame has the components the
 * record forms of the same operands give.
 *
 * @param tables The rig's rows (`composePoseFrames.tables`).
 * @param articulations Each bone's rest-relative articulation, four numbers a bone (x, y, z, w) in the rig's row order.
 * @param rootRotation The rotation the rootless bones stand under.
 * @param rootTranslation Their origin, model metres.
 * @param frames The workspace the frames are written to (`composePoseFrames.frames`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the recurrence, the row order it relies on, the root, what is not read or admitted, the units and where the result goes.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of a rooted tree in parent-first order: local = rest x articulation, world = parent x local, position = parent position + parent-rotated offset, each by the Hamilton product and the `v + w t + q x t` rotation with `t = 2 (q x v)` the record forms use, expression for expression.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the rows. Admission, the choice of articulations and the making of public records belong to the callers; the companion builds the tables, the workspace and one bone's record.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone, side or rig is named; no component is normalized, clamped or repaired; a rig the tables were not built from is not detected, which is the caller's premise.
 * @evidence contracts/development/implementation.md#efficient-algorithms B bones cost B iterations of two quaternion products and one vector rotation on typed arrays: no name lookup, recursion, revision bookkeeping or allocation. A whole humanoid is composed in less time than the dependency rows of a few of its bones were compared in.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A parent's frame is read from the same workspace by all its children. The rig's tables are built once per node list and kept weakly.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only the caller's workspace and retains nothing; the tables live in a weak map keyed by the rig's node list and go with it.
 */
export function composePoseFrames(
  tables: composePoseFrames.ITables,
  articulations: Float64Array,
  rootRotation: IAutoMovieQuaternion,
  rootTranslation: IAutoMovieVector3,
  frames: composePoseFrames.IFrames,
): void {
  const parents: Int32Array = tables.parents;
  const rests: Float64Array = tables.rests;
  const offsets: Float64Array = tables.offsets;
  const local: Float64Array = frames.local;
  const world: Float64Array = frames.rotation;
  const place: Float64Array = frames.position;
  const rootX: number = rootRotation.x;
  const rootY: number = rootRotation.y;
  const rootZ: number = rootRotation.z;
  const rootW: number = rootRotation.w;
  const originX: number = rootTranslation.x;
  const originY: number = rootTranslation.y;
  const originZ: number = rootTranslation.z;
  for (let index: number = 0; index < tables.count; ++index) {
    const q: number = 4 * index;
    const v: number = 3 * index;

    // local = rest x articulation
    const ax: number = rests[q]!;
    const ay: number = rests[q + 1]!;
    const az: number = rests[q + 2]!;
    const aw: number = rests[q + 3]!;
    const bx: number = articulations[q]!;
    const by: number = articulations[q + 1]!;
    const bz: number = articulations[q + 2]!;
    const bw: number = articulations[q + 3]!;
    const lx: number = aw * bx + ax * bw + ay * bz - az * by;
    const ly: number = aw * by - ax * bz + ay * bw + az * bx;
    const lz: number = aw * bz + ax * by - ay * bx + az * bw;
    const lw: number = aw * bw - ax * bx - ay * by - az * bz;
    local[q] = lx;
    local[q + 1] = ly;
    local[q + 2] = lz;
    local[q + 3] = lw;

    // The parent's frame, or the root for a bone without one.
    const parent: number = parents[index]!;
    let px: number = rootX;
    let py: number = rootY;
    let pz: number = rootZ;
    let pw: number = rootW;
    let ox: number = originX;
    let oy: number = originY;
    let oz: number = originZ;
    if (parent >= 0) {
      const pq: number = 4 * parent;
      const pv: number = 3 * parent;
      px = world[pq]!;
      py = world[pq + 1]!;
      pz = world[pq + 2]!;
      pw = world[pq + 3]!;
      ox = place[pv]!;
      oy = place[pv + 1]!;
      oz = place[pv + 2]!;
    }

    // world = parent x local
    world[q] = pw * lx + px * lw + py * lz - pz * ly;
    world[q + 1] = pw * ly - px * lz + py * lw + pz * lx;
    world[q + 2] = pw * lz + px * ly - py * lx + pz * lw;
    world[q + 3] = pw * lw - px * lx - py * ly - pz * lz;

    // position = parent position + parent-rotated rest offset
    const vx: number = offsets[v]!;
    const vy: number = offsets[v + 1]!;
    const vz: number = offsets[v + 2]!;
    const tx: number = 2 * (py * vz - pz * vy);
    const ty: number = 2 * (pz * vx - px * vz);
    const tz: number = 2 * (px * vy - py * vx);
    const rx: number = vx + pw * tx + (py * tz - pz * ty);
    const ry: number = vy + pw * ty + (pz * tx - px * tz);
    const rz: number = vz + pw * tz + (px * ty - py * tx);
    place[v] = ox + rx;
    place[v + 1] = oy + ry;
    place[v + 2] = oz + rz;
  }
}

/**
 * The tables, the workspace and the record view of {@link composePoseFrames}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member's content, row order and unit, and who owns what it returns.
 * @evidence contracts/development/design.md#principled-representation A rig as parallel numeric rows in parent-first order (parent index, rest rotation, rest offset, name) and a pose's frames as three numeric rows beside them, the form a single pass reads and writes; a public bone record is made from one row only where a reader asks for it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two types and three makers, read by the prepared FK state and its readings alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tables hold no pose, the workspace no rig and neither a validity flag; no bone or rig is named.
 */
export namespace composePoseFrames {
  /** One rooted rig as numeric rows, parent first. */
  export interface ITables {
    /** The count of rooted bones. */
    count: number;

    /** Each bone's name, as its public record carries it. */
    names: readonly AutoMovieHumanoidBone[];

    /** Each bone's parent row, -1 for a bone without one. */
    parents: Int32Array;

    /** Each bone's rest rotation in its parent's frame, four numbers a bone (x, y, z, w). */
    rests: Float64Array;

    /** Each bone's rest offset in its parent's frame, metres, three numbers a bone. */
    offsets: Float64Array;
  }

  /** The frames of one composed pose, in the rig's row order. */
  export interface IFrames {
    /** Each bone's local rotation, rest times articulation, four numbers a bone. */
    local: Float64Array;

    /** Each bone's world rotation, four numbers a bone. */
    rotation: Float64Array;

    /** Each bone's world position, model metres, three numbers a bone. */
    position: Float64Array;
  }

  /** What a rig's node gives its row: the name, the parent's row and the rest transform's rotation and translation. */
  export interface INode {
    /** The bone's name. */
    name: AutoMovieHumanoidBone;

    /** The parent's row, -1 for none. */
    parent: number;

    /** The rest translation in the parent's frame, metres. */
    translation: IAutoMovieVector3;

    /** The rest rotation in the parent's frame. */
    rotation: IAutoMovieQuaternion;
  }

  /** A rig's tables, built from its parent-first nodes on first use and kept with the node list. */
  export function tables(nodes: readonly INode[]): ITables {
    const known: ITables | undefined = TABLES.get(nodes);
    if (known !== undefined) return known;
    const count: number = nodes.length;
    const built: ITables = {
      count,
      names: nodes.map((node: INode): AutoMovieHumanoidBone => node.name),
      parents: new Int32Array(count),
      rests: new Float64Array(4 * count),
      offsets: new Float64Array(3 * count),
    };
    for (let index: number = 0; index < count; ++index) {
      const node: INode = nodes[index]!;
      built.parents[index] = node.parent;
      built.rests[4 * index] = node.rotation.x;
      built.rests[4 * index + 1] = node.rotation.y;
      built.rests[4 * index + 2] = node.rotation.z;
      built.rests[4 * index + 3] = node.rotation.w;
      built.offsets[3 * index] = node.translation.x;
      built.offsets[3 * index + 1] = node.translation.y;
      built.offsets[3 * index + 2] = node.translation.z;
    }
    TABLES.set(nodes, built);
    return built;
  }

  /** A fresh workspace for a rig of `count` bones. */
  export function frames(count: number): IFrames {
    return {
      local: new Float64Array(4 * count),
      rotation: new Float64Array(4 * count),
      position: new Float64Array(3 * count),
    };
  }

  /** The articulations of a rig at rest: the identity for every bone. */
  export function identities(count: number): Float64Array {
    const rows: Float64Array = new Float64Array(4 * count);
    for (let index: number = 0; index < count; ++index) rows[4 * index + 3] = 1;
    return rows;
  }

  /** One composed bone as a fresh public record, no value of which aliases the workspace or another record. */
  export function bone(
    names: readonly AutoMovieHumanoidBone[],
    frames: IFrames,
    index: number,
  ): IAutoMovieResolvedBone {
    const q: number = 4 * index;
    const v: number = 3 * index;
    return {
      bone: names[index]!,
      localRotation: {
        x: frames.local[q]!,
        y: frames.local[q + 1]!,
        z: frames.local[q + 2]!,
        w: frames.local[q + 3]!,
      },
      worldRotation: {
        x: frames.rotation[q]!,
        y: frames.rotation[q + 1]!,
        z: frames.rotation[q + 2]!,
        w: frames.rotation[q + 3]!,
      },
      worldPosition: {
        x: frames.position[v]!,
        y: frames.position[v + 1]!,
        z: frames.position[v + 2]!,
      },
    };
  }
}

/** Each rig's tables by its node list. */
const TABLES: WeakMap<readonly composePoseFrames.INode[], composePoseFrames.ITables> = new WeakMap();

import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Compose every bone's frame of one rooted rig from its articulations, in
 * place, on numeric tables: one parent-first pass with no name lookup and no
 * record made.
 *
 * A bone's local rotation is its rest rotation times its articulation; its
 * world rotation is its parent's world rotation times that; and its world
 * position is its parent's world position plus the parent-rotated rest offset.
 * A bone with no parent stands under the given root. The rows are parent first,
 * so a parent's frame is complete when its child reads it. Scale is not read.
 * Nothing is admitted or normalized: the articulations and the root are what an
 * admission wrote, and a component that is not a number propagates as
 * arithmetic gives it.
 *
 * The expressions are those of `Quaternion.multiply`, `Quaternion.rotateVector`
 * and `Vector3.add`, in their grouping, so a frame has the components the
 * record forms of the same operands give.
 * Parameter tables: The rig's rows (`composePoseFrames.tables`).
 * Parameter articulations: Each bone's rest-relative articulation, four numbers a
 * bone (x, y, z, w) in the rig's row order.
 * Parameter rootRotation: The rotation the rootless bones stand under.
 * Parameter rootTranslation: Their origin, model metres.
 * Parameter frames: The workspace the frames are written to
 * (`composePoseFrames.frames`).
 * Parameter from: The first row composed; 0 when absent. The rows before it must
 * already hold this pose's frames.
 * Parameter indices: Optional parent-first row selection. When supplied, from and
 * to index this selection, and each selected parent must already be composed
 * or precede its child.
 * Parameter to: The row after the last composed; every row when absent. A prefix of
 * the rows is complete in itself, since every row's ancestors come before
 * it.
 */
export function composePoseFrames(
  tables: composePoseFrames.ITables,
  articulations: Float64Array,
  rootRotation: IAutoMovieQuaternion,
  rootTranslation: IAutoMovieVector3,
  frames: composePoseFrames.IFrames,
  from: number = 0,
  to: number = tables.count,
  indices?: readonly number[],
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
  for (let ordinal: number = from; ordinal < to; ++ordinal) {
    const index: number = indices === undefined ? ordinal : indices[ordinal]!;
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

/*
 * The tables, the workspace and the record view of composePoseFrames.
 */
export namespace composePoseFrames {
  /*
   * One rooted rig as numeric rows, parent first.
   */
  export interface ITables {
    /*
     * The count of rooted bones.
     */
    count: number;

    /*
     * Each bone's name, as its public record carries it.
     */
    names: readonly AutoMovieHumanoidBone[];

    /*
     * Each bone's parent row, -1 for a bone without one.
     */
    parents: Int32Array;

    /*
     * Each bone's rest rotation in its parent's frame, four numbers a bone (x,
     * y, z, w).
     */
    rests: Float64Array;

    /*
     * Each bone's rest offset in its parent's frame, metres, three numbers a
     * bone.
     */
    offsets: Float64Array;
  }

  /*
   * The frames of one composed pose, in the rig's row order.
   */
  export interface IFrames {
    /*
     * Each bone's local rotation, rest times articulation, four numbers a bone.
     */
    local: Float64Array;

    /*
     * Each bone's world rotation, four numbers a bone.
     */
    rotation: Float64Array;

    /*
     * Each bone's world position, model metres, three numbers a bone.
     */
    position: Float64Array;
  }

  /*
   * What a rig's node gives its row: the name, the parent's row and the rest
   * transform's rotation and translation.
   */
  export interface INode {
    /*
     * The bone's name.
     */
    name: AutoMovieHumanoidBone;

    /*
     * The parent's row, -1 for none.
     */
    parent: number;

    /*
     * The rest translation in the parent's frame, metres.
     */
    translation: IAutoMovieVector3;

    /*
     * The rest rotation in the parent's frame.
     */
    rotation: IAutoMovieQuaternion;
  }

  /*
   * A rig's tables, built from its parent-first nodes.
   */
  export function tables(nodes: readonly INode[]): ITables {
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
    return built;
  }

  /*
   * A fresh workspace for a rig of `count` bones.
   */
  export function frames(count: number): IFrames {
    return {
      local: new Float64Array(4 * count),
      rotation: new Float64Array(4 * count),
      position: new Float64Array(3 * count),
    };
  }

  /*
   * The articulations of a rig at rest: the identity for every bone.
   */
  export function identities(count: number): Float64Array {
    const rows: Float64Array = new Float64Array(4 * count);
    for (let index: number = 0; index < count; ++index) rows[4 * index + 3] = 1;
    return rows;
  }

  /*
   * One composed bone as a fresh public record, no value of which aliases the
   * workspace or another record.
   */
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

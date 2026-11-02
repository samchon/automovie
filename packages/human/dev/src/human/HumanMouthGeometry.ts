import {
  invalidateAutoMovieSkinnedPose,
  reportAutoMovieResourceRetirement,
} from "@automovie/viewer";
import * as THREE from "three";

import type { AutoMovieHumanInstance } from "../../../src/instance/AutoMovieHumanInstance";

/**
 * Bind-buffer mouth writes owned by one displayed Human instance.
 *
 * The pure instance supplies the field and evaluated jaw opening used by CPU
 * checks. Plans read original bind buffers and prepare owned geometry before
 * any swap; rollback restores each previous geometry. GPU skinning carries
 * the displaced bind. Shared asset geometry is never written or disposed.
 *
 * @evidence contracts/common.md#principled-implementation Calls AutoMovieHumanInstance.deformMouth with original positions and normals before the mesh's declared GPU skinning.
 * @evidence contracts/common.md#clear-and-simple-design Owns per-instance geometry transactions; runtime code owns admission, expressions and deformation math.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clones touched geometry before writing, restores shared bind on neutral and refuses interleaved mouth attributes rather than silently dropping expression.
 * @evidence contracts/common.md#meaningful-documentation States field authority, immutable bind ownership and rollback.
 * @evidence contracts/performance.md#efficient-algorithms Scans eligible parts and evaluates their bounded field; clones only displaced parts, outside the animation-frame loop.
 * @evidence contracts/performance.md#reuse-equivalent-work Plans read the same bind; unchanged updates skip preparation and bind restoration evaluates no field.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps one committed owned geometry per displaced mesh; a transaction temporarily holds its replacement and retires the preceding copy on commit or the new copy on rollback.
 */
export class HumanMouthGeometry {
  /** Eligible meshes and shared bind references. */
  private readonly entries: { id: string; mesh: THREE.Mesh; bind: THREE.BufferGeometry }[] = [];

  /** Committed geometry owned by this instance. */
  private readonly owned: Set<THREE.BufferGeometry> = new Set();

  /** Record original bind references without copying geometry. */
  public constructor(parts: ReadonlyMap<string, THREE.Object3D>, private readonly human: AutoMovieHumanInstance) {
    for (const [id, object] of parts) {
      if (!MOVED.test(id)) continue;
      object.traverse((node: THREE.Object3D): void => {
        if (node instanceof THREE.Mesh) this.entries.push({ id, mesh: node, bind: node.geometry });
      });
    }
  }

  /** Prepare new buffers before the first displayed geometry changes. */
  public prepare(plan?: AutoMovieHumanInstance.IPlan, bind: boolean = false): HumanMouthGeometry.IWrite {
    const changes: { mesh: THREE.Mesh; before: THREE.BufferGeometry; after: THREE.BufferGeometry }[] = [];
    const made: THREE.BufferGeometry[] = [];
    try {
      for (const entry of this.entries) {
        let after: THREE.BufferGeometry = entry.bind;
        if (!bind) {
          const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined = entry.bind.getAttribute("position");
          const normals: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined = entry.bind.getAttribute("normal");
          if (!(positions instanceof THREE.BufferAttribute) || (normals !== undefined && !(normals instanceof THREE.BufferAttribute)))
            throw new Error("Human mouth requires ordinary bind buffer attributes: " + entry.id);
          const moved: ReturnType<AutoMovieHumanInstance["deformMouth"]> = this.human.deformMouth(entry.id, positions.array, normals?.array ?? null, plan);
          if (moved !== null) {
            after = entry.bind.clone();
            made.push(after);
            const position: THREE.BufferAttribute = after.getAttribute("position") as THREE.BufferAttribute;
            position.array.set(moved.positions);
            position.needsUpdate = true;
            if (moved.normals !== null) {
              const normal: THREE.BufferAttribute = after.getAttribute("normal") as THREE.BufferAttribute;
              normal.array.set(moved.normals);
              normal.needsUpdate = true;
            }
            after.computeBoundingSphere();
            after.computeBoundingBox();
          }
        }
        if (after !== entry.mesh.geometry) changes.push({ mesh: entry.mesh, before: entry.mesh.geometry, after });
      }
    } catch (error) {
      reportAutoMovieResourceRetirement(made.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()), { error });
      throw error;
    }
    let finished: boolean = false;
    return {
      write: (): void => {
        if (finished) throw new Error("Human mouth transaction is already retired");
        for (const change of changes) {
          change.mesh.geometry = change.after;
          invalidateAutoMovieSkinnedPose(change.mesh);
        }
      },
      rollback: (): void => {
        if (finished) return;
        finished = true;
        for (const change of changes) {
          change.mesh.geometry = change.before;
          invalidateAutoMovieSkinnedPose(change.mesh);
        }
        reportAutoMovieResourceRetirement(made.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()));
      },
      retire: (): void => {
        if (finished) return;
        finished = true;
        for (const geometry of made) this.owned.add(geometry);
        const old: THREE.BufferGeometry[] = changes.flatMap((change): THREE.BufferGeometry[] => this.owned.delete(change.before) ? [change.before] : []);
        reportAutoMovieResourceRetirement(old.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()));
      },
    };
  }

  /** Restore shared binds before releasing committed geometry copies. */
  public dispose(): void {
    for (const entry of this.entries) {
      entry.mesh.geometry = entry.bind;
      invalidateAutoMovieSkinnedPose(entry.mesh);
    }
    const owned: THREE.BufferGeometry[] = [...this.owned];
    this.owned.clear();
    reportAutoMovieResourceRetirement(owned.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()));
  }
}

/** Transactions prepared by an instance's mouth geometry owner. */
export namespace HumanMouthGeometry {
  /** Geometry remains reversible until the pure instance commits. */
  export interface IWrite {
    /** Swap all prepared geometry into its meshes. */
    write(): void;
    /** Restore previous geometry and retire uncommitted copies. */
    rollback(): void;
    /** Retire replaced owned copies after the pure state commits. */
    retire(): void;
  }
}

/** Runtime-deformable families; teeth and gums keep rigid shapes. */
const MOVED: RegExp = /^human\.(skin|cavity)\.|^human\.mouth\.(lining|tongue)$/;

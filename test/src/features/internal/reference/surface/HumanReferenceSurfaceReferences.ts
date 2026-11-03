
import type { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceSurfacePair } from "./HumanReferenceSurfacePair";

/**
 * The reference side of a pairing, built by each call for each welded
 * reference mesh and shared by every comparison that reads it.
 *
 * Building it costs seconds: the outward normals, the hierarchy over every
 * triangle and the outer-skin test of 64,000 vertices. A reference never
 * changes within a run, and `HumanReference.mesh` hands back the same mesh
 * object for one alias, so each mesh object has one value. The key is
 * the object, not the alias, because a red proof compares a displaced copy of
 * a reference, which must get its own side; the entries are weakly held, so a
 * dropped copy frees its side. The result is read-only to its consumers, which
 * only query the hierarchy.
 */
export namespace HumanReferenceSurfaceReferences {
  /**
   * The shared reference side of a mesh, built on first use.
   *
   * @param mesh The welded reference mesh; its identity is the key.
   */
  export function side(mesh: HumanReference.IMesh): HumanReferenceSurfacePair.IReferenceSide {
    let found: HumanReferenceSurfacePair.IReferenceSide | undefined = sides.get(mesh);

    if (found === undefined) {
      found = HumanReferenceSurfacePair.ofReference(mesh);
      sides.set(mesh, found);
    }
    return found;
  }

  /** Values by mesh object, released with the mesh. */
  const sides: WeakMap<HumanReference.IMesh, HumanReferenceSurfacePair.IReferenceSide> = new WeakMap();
}

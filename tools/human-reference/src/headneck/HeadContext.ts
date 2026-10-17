import type { Skin } from "../geometry/Skin.ts";
import type { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { V3 } from "../geometry/V3.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import type { loadGate } from "../io/loadGate.ts";
import type { AuxiliarySurface } from "./AuxiliarySurface.ts";

/**
 * Shared immutable native source geometry and derived head observation indexes.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps admitted source identity, skin, auxiliary components and distinct derived indexes in the same native frame.
 * @evidence contracts/common.md#clear-and-simple-design Each producer receives one context instead of independently reconstructing registration and component ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The context contains private inputs only; it makes no product mesh or unsupported clinical-landmark promise.
 * @evidence contracts/common.md#meaningful-documentation Members state units, source lifetimes, normal construction, auxiliary classification and missing-rig-marker behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased context declaration executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime context reuse belongs to the loading operation and its caller.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased interface allocates no handles; loadHeadContext owns the per-operation arrays and indexes.
 * @author Samchon
 */
export interface HeadContext {
  /** Caller-supplied private reference identifier. */
  gate: string;
  /** Admitted byte identities, native frame and source-specific observations. */
  manifest: ReferenceManifest;
  /** Loaded private meshes retained for this observation operation. */
  g: ReturnType<typeof loadGate>;
  /** Combined body and largest connected head skin, with auxiliary eyes excluded. */
  s: Skin;
  /** Closest-surface index over the combined source skin. */
  idx: SurfaceIndex;
  /** Outward unit normals, area-weighted and accumulated across canonical seam vertices. */
  vn: V3[];
  /** Separate closed auxiliary components classified by source size, location and topology. */
  eyes: { l: AuxiliarySurface; r: AuxiliarySurface };
  /**
   * Reads a declared rig-marker position in native world millimetres; missing markers throw.
   *
   * @evidence contracts/common.md#principled-implementation The context producer resolves named body and head rig maps rather than treating marker positions as clinical surface landmarks.
   * @evidence contracts/common.md#clear-and-simple-design One accessor defines shared missing-marker behavior for head observation consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing markers fail instead of receiving invented coordinates or identity-specific fallback values.
   * @evidence contracts/common.md#meaningful-documentation States the native physical frame and exception on absent markers.
   * @evidence contracts/performance.md#efficient-algorithms The supplied implementation performs at most two map lookups for a named marker.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The accessor coordinates no requests or effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The accessor borrows context-owned maps and returns an existing position without allocating external resources.
   */
  bone: (name: string) => V3;
}

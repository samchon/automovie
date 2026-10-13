import type { IAutoMovieRenderBundleManifest } from "./IAutoMovieRenderBundleManifest";

/**
 * One discovered render bundle with separate freshness and current-design ownership status.
 *
 * @evidence contracts/common.md#principled-implementation Inspection reads the verified bundle target and compares its target-local fingerprint with current compiled inputs; separate graph membership determines whether the target still exists even when a bundle is stale.
 * @evidence contracts/common.md#clear-and-simple-design Current answers freshness and owned answers continued target membership, so old iterations and deleted-shot output remain distinguishable without parsing ids from directory names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable or unresolvable targets conservatively retain owned true rather than asserting unownership from failed inspection; this status never deletes a bundle or authorizes automatic cleanup.
 * @evidence contracts/common.md#meaningful-documentation Defines project-relative bundle path, target-local freshness, nullable verified target and conservative ownership meaning.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderStatus {
  /** Project-relative bundle manifest. */
  path: string;

  /** Whether the bundle matches current target-local inputs. */
  current: boolean;

  /**
   * What this bundle was rendered for, verbatim from its own manifest, or `null` when that manifest cannot be read.
   *
   * Consumers can compare this declared target with the current design without parsing ownership from the bundle directory name.
   */
  target: IAutoMovieRenderBundleManifest["target"] | null;

  /**
   * Whether the design still carries the target this bundle was rendered for.
   *
   * A stale bundle can belong to a current target or a target removed from the design; this field distinguishes those cases independently of freshness.
   *
   * An unreadable manifest or unresolvable target conservatively reports `true`; only resolved absence from the current design reports `false`. The status does not delete a bundle.
   */
  owned: boolean;
}

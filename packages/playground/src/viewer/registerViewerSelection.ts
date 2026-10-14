import type { AutoMovieGuidePass } from "@automovie/interface";
import { isGuidePass } from "@automovie/render";

import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";

/**
 * Restore a product's supported named selection through its original setter, then restore an optional admitted guide pass and check actual selection equality. Unsupported choices refuse the candidate. Setter/equality failure can leave that candidate changed; this adapter supplies no atomic rollback and the host still retains the prior completed page.
 *
 * @evidence contracts/common.md#principled-implementation Owner-supplied names define supported selections and canonical render pass validation guards optional pass restoration before any setters run; a final original-owner read checks the requested selection.
 * @evidence contracts/common.md#clear-and-simple-design One application registration composes existing selection/pass setters while scene resources, clock and completed frames remain producer-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing choices/pass values refuse rather than substituting a default, and selection equality does not prove an unchanged guide pass, atomic rollback, model health or completed hardware draw.
 * @evidence contracts/common.md#meaningful-documentation The comment states setter order, optional pass and the distinction between retained prior page and mutable failed candidate.
 * @evidence contracts/performance.md#efficient-algorithms Name membership is O(n) for n supported names and fixed pass validation is constant-size; actual setter redraw/build work remains the product owner's cost. The current supplied catalogues are small and their order remains owner-authored.
 * @evidence contracts/performance.md#reuse-equivalent-work Original read/set/pass callbacks and the existing canonical guide-pass predicate are reused; effectful restorations are not cached or merged by equal choice names.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registration borrows names and callbacks until the bridge/page ends; the original product owns its scene/player/GPU resources. No timer, worker, new renderer or local restoration queue is acquired here.
 *
 * @author Samchon
 */
export function registerViewerSelection(props: {
  /** Product-owned selectable names admitted during transfer. */
  names: readonly string[];

  /** Read the current product selection after the original setter completes. */
  read: () => string;

  /** Apply a supported name through the original product selection owner. */
  select: (name: string) => void;

  /** Optional guide-pass transfer; omission captures no pass and ignores an incoming pass. */
  pass?: {
    /** Read the guide pass the original product currently displays. */
    read: () => AutoMovieGuidePass;

    /** Apply an admitted guide pass through its original product owner. */
    restore: (pass: AutoMovieGuidePass) => void;
  };
}): void {
  registerPlaygroundViewerApplication({
    ready: Promise.resolve(),
    capture: (): {
      selection: string;
      pass: AutoMovieGuidePass | undefined;
    } => ({ selection: props.read(), pass: props.pass?.read() }),
    restore: async (state: unknown): Promise<void> => {
      if (state === null || typeof state !== "object")
        throw new Error("The product selection has no state.");
      const value: unknown = Reflect.get(state, "selection");
      if (typeof value !== "string" || !props.names.includes(value))
        throw new Error("The product selection is unavailable.");
      const pass: unknown = Reflect.get(state, "pass");
      if (
        props.pass !== undefined &&
        (typeof pass !== "string" || !isGuidePass(pass))
      )
        throw new Error("The product guide pass is unavailable.");
      props.select(value);
      if (
        props.pass !== undefined &&
        typeof pass === "string" &&
        isGuidePass(pass)
      )
        props.pass.restore(pass);
      if (props.read() !== value)
        throw new Error("The product did not restore its selection.");
    },
  });
}

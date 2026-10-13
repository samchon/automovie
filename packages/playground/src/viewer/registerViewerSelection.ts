import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";
import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Preserve a product's actual named selection through its original setter.
 * A missing choice refuses the source candidate; it cannot retire the live page.
 * Selection is applied before the optional guide pass and final selection read.
 * A setter or equality failure may leave the candidate changed; this adapter
 * supplies no atomic rollback of the original product setters.
 * The mounted producer owns scene resources, playback and completed frames;
 * the page bridge retains the prior page when this restoration refuses.
 *
 * @evidence contracts/common.md#principled-implementation Validates membership before invoking the product-owned selection setter and verifies its result.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the same page application transfer owner for both selectable clip products.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No widget replay, inferred choice or named default substitutes for current state.
 * @evidence contracts/common.md#meaningful-documentation Defines ownership and the candidate refusal boundary.
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
    restore: (pass: AutoMovieGuidePass) => void
  };
}): void {
  registerPlaygroundViewerApplication({
    ready: Promise.resolve(), capture: () => ({ selection: props.read(), pass: props.pass?.read() }),
    restore: async (state) => {
      if (state === null || typeof state !== "object") throw new Error("The product selection has no state.");
      const value: unknown = Reflect.get(state, "selection");
      if (typeof value !== "string" || !props.names.includes(value)) throw new Error("The product selection is unavailable.");
      const pass: unknown = Reflect.get(state, "pass");
      if (props.pass !== undefined && pass !== "beauty" && pass !== "mask" && pass !== "normal" && pass !== "depth" && pass !== "outline" && pass !== "pose")
        throw new Error("The product guide pass is unavailable.");
      props.select(value);
      if (props.pass !== undefined && (pass === "beauty" || pass === "mask" || pass === "normal" || pass === "depth" || pass === "outline" || pass === "pose"))
        props.pass.restore(pass);
      if (props.read() !== value) throw new Error("The product did not restore its selection.");
    },
  });
}

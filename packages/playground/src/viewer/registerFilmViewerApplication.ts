import type { AutoMovieGuidePass } from "@automovie/interface";
import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";

/**
 * Transfer the film owner's completed shot/blend sample and actual guide pass.
 * Known shot identity, finite local time and blend weight are checked before
 * the original film draw is called. A refused state leaves the retained page.
 * Shot-local time is not bounded by shot duration here. Draw failures propagate
 * and refuse candidate admission; this adapter does not roll back a draw.
 * The film producer owns scene evaluation, the playback clock and completed
 * frames. This adapter restores a captured sample through that producer; the
 * page bridge owns candidate replacement and retains the prior completed page
 * when restoration fails.
 *
 * @evidence contracts/common.md#principled-implementation Restores validated actual film samples and pass through the original draw owner.
 * @evidence contracts/common.md#clear-and-simple-design One application adapter uses existing page handoff and film rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No synthetic composite, guessed shot or fake camera supplies completion.
 * @evidence contracts/common.md#meaningful-documentation Defines sample validation and retained-page failure effects.
 * @evidence requirements/product/prototype-quality.md#product-prototype-motion-time Preserves the captured known shot identities, finite shot-local seconds and transition weight when restoring through the original film draw.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-structural-output-invariant Contributes the captured sample's shot-local timing and transition state to reproducible prototype output by replaying the original film owner's draw; schedule evaluation and completed-frame ownership remain with that producer.
 */
export function registerFilmViewerApplication(props: {
  /** The original film owner's last completed frame and guide pass, captured together. */
  capture: () => unknown;

  /** Known shot identities accepted by this film owner. */
  shots: ReadonlySet<string>;

  /** Draw the admitted shot/blend and guide pass through the original film owner; null draws the current scene without a sequence sample. */
  restore: (frame: {
    /** The incoming shot's known identity. */
    shot: string;

    /** Finite nonnegative local time in the incoming shot, in seconds. */
    shotTimeSeconds: number;

    /** Optional outgoing shot sample; null means no transition layer. */
    blend: {
      /** The outgoing shot's known identity. */
      shot: string;

      /** Finite nonnegative local time in the outgoing shot, in seconds. */
      shotTimeSeconds: number;

      /** Outgoing-layer weight in [0,1], as consumed by the film compositor. */
      alpha: number
    } | null
  } | null,
    pass: AutoMovieGuidePass) => void;
}): void {
  const shot = (state: unknown): { shot: string; shotTimeSeconds: number } => {
    if (state === null || typeof state !== "object") throw new Error("Film transfer has no shot sample.");
    const id: unknown = Reflect.get(state, "shot"), time: unknown = Reflect.get(state, "shotTimeSeconds");
    if (typeof id !== "string" || !props.shots.has(id) || typeof time !== "number" || !Number.isFinite(time) || time < 0)
      throw new Error("Film transfer has no known finite shot sample.");
    return { shot: id, shotTimeSeconds: time };
  };
  registerPlaygroundViewerApplication({
    ready: Promise.resolve(), capture: props.capture,
    restore: async (state) => {
      if (state === null || typeof state !== "object") throw new Error("Film transfer has no sample.");
      const frame: unknown = Reflect.get(state, "frame"), pass: unknown = Reflect.get(state, "pass");
      if (pass !== "beauty" && pass !== "mask" && pass !== "normal" && pass !== "depth" && pass !== "outline" && pass !== "pose")
        throw new Error("Film transfer has an unsupported guide pass.");
      if (frame === null) { props.restore(null, pass); return; }
      if (typeof frame !== "object") throw new Error("Film transfer has no shot sample.");
      const sample = shot(frame);
      const blend: unknown = Reflect.get(frame, "blend");
      if (blend === null) { props.restore({ ...sample, blend: null }, pass); return; }
      if (typeof blend !== "object") throw new Error("Film transfer has no shot sample.");
      const outgoing = shot(blend);
      const alpha: unknown = Reflect.get(blend, "alpha");
      if (typeof alpha !== "number" || !Number.isFinite(alpha) || alpha < 0 || alpha > 1)
        throw new Error("Film transfer has no valid blend alpha.");
      props.restore({ ...sample, blend: { ...outgoing, alpha } }, pass);
    },
  });
}

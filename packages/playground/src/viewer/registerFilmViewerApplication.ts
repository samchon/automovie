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

import type { AutoMovieGuidePass } from "@automovie/interface";
import { isGuidePass } from "@automovie/render";

import { registerPlaygroundViewerApplication } from "./registerPlaygroundViewerApplication";

/**
 * Restore a film owner's captured completed shot/blend sample and actual guide pass through its original draw. Shot identities must be known, local seconds finite/nonnegative and incoming-layer blend alpha within [0,1]. Null frame requests the owner's current scene. Local time is not bounded by shot duration here, and failed draws can leave the candidate changed without rolling back the retained prior page.
 *
 * @evidence contracts/common.md#principled-implementation Known-shot membership, finite sample quantities and canonical runtime guide-pass validation precede the original restoration call; optional blend data identifies the outgoing sample and carries the incoming layer's weight rather than inferring a transition.
 * @evidence contracts/common.md#clear-and-simple-design One application registration validates only transfer shape/quantities and delegates scene evaluation, clock and completed-frame production to the film owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot-time duration bounds and atomic draw rollback are absent rather than assumed, and restored sample readiness does not certify hardware completion or film appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment defines second/alpha units, known identities, null scene meaning and retained-page versus candidate-mutation failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms A fixed guide-pass membership check and at most two expected constant-time shot-Set lookups validate the sample; actual restored drawing/scene evaluation and bitmap work remain producer/bridge costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing film capture/draw callbacks and canonical guide-pass predicate are reused; restoration is an effect and no scene result is cached by this adapter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registration borrows shot membership and capture/restore callbacks until bridge/page teardown; the film owner retains player/scene/GPU resources, while this adapter starts no worker or timer.
 *
 * @author Samchon
 */
export function registerFilmViewerApplication(props: {
  /** The original film owner's last completed frame and guide pass, captured together. */
  capture: () => unknown;

  /** Known shot identities accepted by this film owner. */
  shots: ReadonlySet<string>;

  /** Draw the admitted shot/blend and guide pass through the original film owner; null draws the current scene without a sequence sample. */
  restore: (
    frame: {
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

        /** Incoming-layer weight in [0,1]; the outgoing layer receives one minus this value. */
        alpha: number;
      } | null;
    } | null,
    pass: AutoMovieGuidePass,
  ) => void;
}): void {
  const shot: (state: unknown) => { shot: string; shotTimeSeconds: number } = (
    state: unknown,
  ): { shot: string; shotTimeSeconds: number } => {
    if (state === null || typeof state !== "object")
      throw new Error("Film transfer has no shot sample.");
    const id: unknown = Reflect.get(state, "shot"),
      time: unknown = Reflect.get(state, "shotTimeSeconds");
    if (
      typeof id !== "string" ||
      !props.shots.has(id) ||
      typeof time !== "number" ||
      !Number.isFinite(time) ||
      time < 0
    )
      throw new Error("Film transfer has no known finite shot sample.");
    return { shot: id, shotTimeSeconds: time };
  };
  registerPlaygroundViewerApplication({
    ready: Promise.resolve(),
    capture: props.capture,
    restore: async (state: unknown): Promise<void> => {
      if (state === null || typeof state !== "object")
        throw new Error("Film transfer has no sample.");
      const frame: unknown = Reflect.get(state, "frame"),
        pass: unknown = Reflect.get(state, "pass");
      if (typeof pass !== "string" || !isGuidePass(pass))
        throw new Error("Film transfer has an unsupported guide pass.");
      if (frame === null) {
        props.restore(null, pass);
        return;
      }
      if (typeof frame !== "object")
        throw new Error("Film transfer has no shot sample.");
      const sample: ReturnType<typeof shot> = shot(frame);
      const blend: unknown = Reflect.get(frame, "blend");
      if (blend === null) {
        props.restore({ ...sample, blend: null }, pass);
        return;
      }
      if (typeof blend !== "object")
        throw new Error("Film transfer has no shot sample.");
      const outgoing: ReturnType<typeof shot> = shot(blend);
      const alpha: unknown = Reflect.get(blend, "alpha");
      if (
        typeof alpha !== "number" ||
        !Number.isFinite(alpha) ||
        alpha < 0 ||
        alpha > 1
      )
        throw new Error("Film transfer has no valid blend alpha.");
      props.restore({ ...sample, blend: { ...outgoing, alpha } }, pass);
    },
  });
}

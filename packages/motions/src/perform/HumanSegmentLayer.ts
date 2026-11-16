import { type IAutoMovieRandom, minimumJerk, preparePoseResolution } from "@automovie/engine";
import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * The ordered additive layers of one person's posture at a film second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns layer windows, weights and query contexts; the displayed-pose owner retains contacts, transitions and final fitting.
 * @evidence contracts/development/design.md#principled-representation Reads the existing placed-layer and person records and returns the existing posture representation, in world metres and clinical degrees at film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One apply operation serves HumanSegmentPose.layered and its displayed-pose and entry-state consumers; no new authored layer or fit representation is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Window ramps, random-stream keys and layer mixing retain their original owners and constants; no layer, action or scene receives a special path.
 */
export namespace HumanSegmentLayer {
  /**
   * Add the person's active layers in order, fading each contribution by
   * its window's minimum-jerk ramp. Without layers, return the given posture.
   * A retained action reader still reads current placed actions. When an
   * action is present, each query returns fresh records and borrowed contacts.
   *
   * @param person The person whose layer windows and draw keys are read.
   * @param posture The posture before the layers.
   * @param seconds Film seconds.
   * @param resolution Optional same-body exact FK getter borrowed for this call; each layer receives a revocable synchronous loan.
   * @returns The mixed posture, preserving the existing endpoint identities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered windows, film seconds, the no-layer identity and the ownership and freshness of action-query results.
   * @evidence contracts/development/implementation.md#principled-implementation Each active window scales its layer's additive contribution by the same minimum-jerk edge ramp and mixHumanPosture; a layer's draw streams remain keyed by performer, layer name and channel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Return immediately for an empty layer list; otherwise one action reader and one ordered reduction keep context construction with the layer that consumes it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies every active layer with its actual preceding posture and original window weight; random streams, action records and event arrays are not memoized or shared between queries.
   * @evidence contracts/development/implementation.md#efficient-algorithms An empty list costs a length read and no context closure. For L layers, scan L windows and pay each active apply and posture mix; each action query reads R entries backward to its last match, at most S placed segments, and maps its E events in O(R+E) time and O(E) output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual posture/time, original layer draws and every apply remain current. A same-body parent may lend exact FK metadata through a lazy context getter during apply; rebased transfers only issued source provenance for downstream exact free-leg checks. No layer, random stream or action answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every layer loan clears its original getter in finally, and the outer source parameter clears on return/throw. A retained context getter then creates fresh independent readers; the layer contract forbids retaining a reader obtained during apply. No result map or parent workspace enters output postures. Existing raw provenance remains weak and retained action callbacks keep only their original person/second state.
   */
  export function apply(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
    resolution?: Resolution,
  ): IHumanPosture {
    if (person.layers.length === 0) return posture;

    // Action results remain fresh: a layer may retain this reader and ask
    // after placement has changed, or mutate its own returned event list.
    const action: () => IHumanLayer.IAction | undefined = ():
      | IHumanLayer.IAction
      | undefined => {
      const active: HumanSegment.ISegment | undefined =
        HumanSegmentSelection.last(person.segments, seconds);
      return active === undefined
        ? undefined
        : {
            name: active.name,
            family: active.law.family ?? active.name,
            from: active.entryTime,
            to: active.end,
            events: active.plan.events.map(
              (
                event: IAutoMovieMotionEvent,
              ): IHumanLayer.IAction["events"][number] => ({
                name: event.name,
                seconds: active.start + event.share * active.plan.duration,
              }),
            ),
            contacts: active.plan.contacts,
          };
    };
    try {
      return person.layers.reduce(
        (
          current: IHumanPosture,
          { layer, from, to, fade }: HumanSegment.ILayered,
        ): IHumanPosture => {
          const edge: number = Math.min(seconds - from, to - seconds);
          if (!(edge > 0)) return current;
          const weight: number = edge >= fade ? 1 : minimumJerk.share(edge / fade);
          const borrowed: ReturnType<typeof borrowResolution> | undefined =
            resolution === undefined ? undefined : borrowResolution(resolution);
          try {
            const written: IHumanPosture = layer.apply(current, seconds, {
              ...person.layer,
              action,
              ...(borrowed === undefined ? {} : { resolution: borrowed.read }),
              random: (channel: string): IAutoMovieRandom =>
                HumanSkill.stream(person.skill, person.performer.subject,
                  `layer:${layer.name}`, 0, channel),
            });
            return resolveHumanPosture.rebased(current, mixHumanPosture(current, written, weight));
          } finally {
            borrowed?.release();
          }
        },
        posture,
      );
    } finally {
      resolution = undefined;
    }
  }
}

/** A layer may borrow only a same-body exact FK getter during its current apply. */
type Resolution = NonNullable<IHumanLayer.IContext["resolution"]>;

/** Revoke a synchronous loan even if a layer retains its context or getter. */
function borrowResolution(source: Resolution | undefined): { read: Resolution; release: () => void } {
  let borrowed: Resolution | undefined = source;
  source = undefined;
  return {
    read: (): ReturnType<typeof preparePoseResolution> => {
      const current: Resolution | undefined = borrowed;
      return current === undefined ? preparePoseResolution() : current();
    },
    release: (): void => { borrowed = undefined; },
  };
}

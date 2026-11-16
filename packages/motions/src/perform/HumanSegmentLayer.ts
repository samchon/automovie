import { type IAutoMovieRandom, minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import type { HumanSegment } from "./HumanSegment";

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
   * @returns The mixed posture, preserving the existing endpoint identities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered windows, film seconds, the no-layer identity and the ownership and freshness of action-query results.
   * @evidence contracts/development/implementation.md#principled-implementation Each active window scales its layer's additive contribution by the same minimum-jerk edge ramp and mixHumanPosture; a layer's draw streams remain keyed by performer, layer name and channel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Return immediately for an empty layer list; otherwise one action reader and one ordered reduction keep context construction with the layer that consumes it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies every active layer with its actual preceding posture and original window weight; random streams, action records and event arrays are not memoized or shared between queries.
   * @evidence contracts/development/implementation.md#efficient-algorithms An empty list costs a length read and no context closure. For L layers, scan L windows and pay each active apply and posture mix; each action query separately scans S placed segments and maps its E events in O(S+E) time and O(E) output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses mixHumanPosture and HumanSkill.stream without caching mutable streams or action-query results; distinct under-postures and times pass through their own layer applications.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only reduction-local contexts and postures; no cache survives the call. An empty layer list returns the borrowed input posture unchanged. A caller-retained context callback retains its existing person/second references and reads current state, without a retained evaluation map or external handle.
   */
  export function apply(
    person: HumanSegment.IPerson,
    posture: IHumanPosture,
    seconds: number,
  ): IHumanPosture {
    if (person.layers.length === 0) return posture;

    // Action results remain fresh: a layer may retain this reader and ask
    // after placement has changed, or mutate its own returned event list.
    const action: () => IHumanLayer.IAction | undefined = ():
      | IHumanLayer.IAction
      | undefined => {
      let active: HumanSegment.ISegment | undefined;
      for (const segment of person.segments)
        if (segment.entryTime <= seconds + 1e-12) active = segment;
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
    return person.layers.reduce(
      (
        current: IHumanPosture,
        { layer, from, to, fade }: HumanSegment.ILayered,
      ): IHumanPosture => {
        const edge: number = Math.min(seconds - from, to - seconds);
        if (!(edge > 0)) return current;
        const weight: number = edge >= fade ? 1 : minimumJerk(edge / fade).s;
        return mixHumanPosture(
          current,
          layer.apply(current, seconds, {
            ...person.layer,
            action,
            random: (channel: string): IAutoMovieRandom =>
              HumanSkill.stream(
                person.skill,
                person.performer.subject,
                `layer:${layer.name}`,
                0,
                channel,
              ),
          }),
          weight,
        );
      },
      posture,
    );
  }
}

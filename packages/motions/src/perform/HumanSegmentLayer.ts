import { minimumJerk, preparePoseResolution } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanBreath } from "../everyday/HumanBreath";
import { HumanAirborneShape } from "../lexicon/HumanAirborneShape";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanSegmentSelection } from "./HumanSegmentSelection";

/** The alternatives of `ApplyPhase`'s site. */
type ApplyPhase = "display" | "entry";

/** The ordered additive layers of one person's posture at a film second. */
export namespace HumanSegmentLayer {
  /**
   * Add the person's active layers in order, fading each contribution by its
   * window's minimum-jerk ramp. Without layers, return the given posture. A
   * retained action reader still reads current placed actions. When an action
   * is present, each query returns fresh records and borrowed contacts.
   *
   * @param person The person whose layer windows and draw keys are read.
   * @param posture The posture before the layers.
   * @param seconds Film seconds.
   * @param resolution Optional same-body exact FK getter borrowed for this
   *   call; each layer receives a revocable synchronous loan.
   * @param projection Optional genuine same-body ROM projection, lent only
   *   through a revocable lazy layer getter.
   * @param phase Display evaluates all active layers. Entry leaves native
   *   breath for that display evaluation.
   * @returns The mixed posture, preserving the existing endpoint identities.
   */
  export function apply(
    person: IAutoMovieMotionHumanSegment.IPerson,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    resolution?: Resolution,
    projection?: Projection,
    assembly?: HumanAirborneShape.Assembly,
    phase: ApplyPhase = "display",
  ): IAutoMovieMotionHumanPosture {
    if (person.layers.length === 0) return posture;

    // Action results remain fresh: a layer may retain this reader and ask
    // after placement has changed, or mutate its own returned event list.
    const action: () => IAutoMovieMotionHumanLayer.IAction | undefined = ():
      | IAutoMovieMotionHumanLayer.IAction
      | undefined => {
      const active: IAutoMovieMotionHumanSegment | undefined =
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
              ): IAutoMovieMotionHumanLayer.IAction["events"][number] => ({
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
          current: IAutoMovieMotionHumanPosture,
          { layer, from, to, fade }: IAutoMovieMotionHumanSegment.ILayered,
        ): IAutoMovieMotionHumanPosture => {
          const edge: number = Math.min(seconds - from, to - seconds);
          if (!(edge > 0) || (phase === "entry" && HumanBreath.isNative(layer)))
            return current;
          const weight: number =
            edge >= fade ? 1 : minimumJerk.share(edge / fade);
          const borrowed: ReturnType<typeof borrowResolution> | undefined =
            resolution === undefined ? undefined : borrowResolution(resolution);
          const projected: ReturnType<typeof borrowProjection> | undefined =
            projection === undefined
              ? undefined
              : borrowProjection(person.performer.body, projection);
          try {
            const context: IAutoMovieMotionHumanLayer.IContext = {
              ...person.layer,
              action,
              ...(borrowed === undefined ? {} : { resolution: borrowed.read }),
              ...(projected === undefined
                ? {}
                : { projection: projected.read }),
              random: (channel: string): IAutoMovieRandom =>
                HumanSkill.stream(
                  person.skill,
                  person.performer.subject,
                  `layer:${layer.name}`,
                  0,
                  channel,
                ),
            };
            if (assembly !== undefined && layer.lend !== undefined)
              return layer.lend(current, seconds, context, weight, assembly);
            if (layer.blend !== undefined)
              return layer.blend(current, seconds, context, weight);
            return mixHumanPosture(
              current,
              layer.apply(current, seconds, context),
              weight,
            );
          } finally {
            borrowed?.release();
            projected?.release();
          }
        },
        posture,
      );
    } finally {
      resolution = undefined;
      projection = undefined;
    }
  }
}

/** A layer may borrow only a same-body exact FK getter during its current apply. */
type Resolution = NonNullable<
  IAutoMovieMotionHumanLayer.IContext["resolution"]
>;

/** A genuine direct-joint projector borrowed within this layer application. */
type Projection = ReturnType<typeof prepareHumanPostureProjection>;
/** The record of `IBorrowProjectionResult`'s site. */
type IBorrowProjectionResult = {
  read: NonNullable<IAutoMovieMotionHumanLayer.IContext["projection"]>;
  release: () => void;
};

/** A retained getter cannot retain the parent operation's ROM preparation. */
function borrowProjection(
  body: IAutoMovieMotionHumanBody,
  source: Projection | undefined,
): IBorrowProjectionResult {
  let borrowed: Projection | undefined = source;
  source = undefined;
  return {
    read: (): Projection => borrowed ?? prepareHumanPostureProjection(body),
    release: (): void => {
      borrowed = undefined;
    },
  };
}
/** The record of `IBorrowResolutionResult`'s site. */
type IBorrowResolutionResult = {
  read: Resolution;
  release: () => void;
};

/** Revoke a synchronous loan even if a layer retains its context or getter. */
function borrowResolution(
  source: Resolution | undefined,
): IBorrowResolutionResult {
  let borrowed: Resolution | undefined = source;
  source = undefined;
  return {
    read: (): ReturnType<typeof preparePoseResolution> => {
      const current: Resolution | undefined = borrowed;
      return current === undefined ? preparePoseResolution() : current();
    },
    release: (): void => {
      borrowed = undefined;
    },
  };
}

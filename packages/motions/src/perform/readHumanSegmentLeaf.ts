import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
} from "@automovie/interface";

import type { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/** Read the action before its entering offset, including current holds and overlays. */
export function readHumanSegmentLeaf(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  t: number,
  fits: HumanSegmentPose.INear | undefined,
  observed: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  prepared: prepareHumanSegmentPose.IPrepared,
): readHumanSegmentLeaf.IReading {
  const reader: typeof segment.plan.posture = segment.plan.posture;
  const localSeconds: number = Math.min(
    segment.plan.duration,
    Math.max(0, t - segment.start),
  );
  const bare: boolean =
    person.layers.length === 0 &&
    person.overlays.length === 0 &&
    person.holds.length === 0 &&
    person.stops.size === 0;
  const sample: IAutoMovieMotionHumanPlayback.ISample | undefined =
    HumanPreparedPlayback.read(
      segment.plan,
      person.performer.body,
      reader,
      bare,
      fits === undefined && observed === undefined,
      segment.incumbents,
      localSeconds,
      undefined,
      prepared.resolution,
      prepared.clamp,
    );
  const raw: IAutoMovieMotionHumanPosture =
    sample?.posture ??
    Reflect.apply(reader, segment.plan, [
      localSeconds,
      undefined,
      prepared.resolution,
      prepared.clamp,
    ]);
  let direct: resolveHumanPostureSource.IAssembled | undefined;
  let written: IAutoMovieMotionHumanPosture = HumanSegmentLayer.apply(
    person,
    raw,
    t,
    prepared.resolution,
    prepared.clamp,
    fits === undefined &&
      person.layers.length === 1 &&
      person.overlays.length === 0 &&
      person.holds.length === 0 &&
      person.stops.size === 0
      ? (assembly: resolveHumanPostureSource.IAssembled): void => {
          direct = assembly;
        }
      : undefined,
  );

  const borne: IAutoMovieMotionHumanSegment.IHeld[] = HumanSegmentCarry.borne(
    person,
    segment,
    t,
  );
  if (borne.length !== 0) {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...written.joints,
    };
    for (const h of borne) Object.assign(joints, h.fingers);
    written = { ...written, joints };
  }
  const overlaid: HumanSegmentOverlay.IOverlaid = HumanSegmentOverlay.overlaid(
    person,
    written,
    t,
    borne,
    fits,
    prepared.resolution,
    unplantedHumanObservation(written.limbs, observed),
    prepared,
    segment,
    direct,
    bare && fits === undefined && observed === undefined ? sample : undefined,
  );
  return {
    posture: {
      ...written,
      limbs: { ...written.limbs, ...overlaid.contacts },
    },
    carried: borne,
    pose: overlaid.pose,
    seeds: overlaid.seeds,
  };
}

/** Records produced by one pre-transition leaf evaluation. */
export namespace readHumanSegmentLeaf {
  /** The composed posture and the fits produced on this read. */
  export interface IReading {
    /** Authored posture with the overlay contacts. */
    posture: IAutoMovieMotionHumanPosture;
    /** Objects still borne by this action. */
    carried: IAutoMovieMotionHumanSegment.IHeld[];
    /** The resolved displayed pose. */
    pose: IAutoMoviePose;
    /** Continuation seeds for the fitted limbs. */
    seeds: HumanSegmentPose.IFits;
  }
}

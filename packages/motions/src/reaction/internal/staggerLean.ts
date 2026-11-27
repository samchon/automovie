import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkReach } from "../../actions/internal/walkReach";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { staggerBounds } from "./staggerBounds";

/*
 * A stagger's trunk and the root that carries it, as prepared curves of the
 * recovery's courses (`staggerRecover`).
 *
 * The trunk bends about the hips against the fall, the hip strategy (Horak and
 * Nashner 1986, J Neurophysiol 55:1369), which counter-rotates the upper body
 * against the centre of mass's motion (Hof 2007, J Biomech 40:451, the
 * counter-rotation mechanism). Its angle is the inclination of the extrapolated
 * centre of mass's lead over the centre of mass, `v / omega0` (Hof, Gazendam
 * and Sinke 2005), seen from the pendulum's length `l`: `atan(|v| / (omega0
 * l))`, which grows with the push and vanishes as the body comes to rest. The
 * relation is the model's (provisional: neither source gives a trunk angle as a
 * function of the lead); it carries no fitted coefficient. Koolen et al.'s
 * reaction-mass relation (`dtheta = delta m z / J`) does not apply here: it is
 * the 0-step lunge that pulls a capture point just outside a base the body will
 * not step from, with a gain near 11 rad per metre, while a stepping recovery's
 * lead is beyond the base by design and is absorbed by the steps; applied to
 * it, the trunk saturates at the hip's range and drags the feet (measured on
 * both stagger specs). A measured trunk excursion in stepping responses is
 * sought to source this law. Its direction is opposite the lead, along and
 * across the heading, the roll's sign the one whose measured mass shift
 * (`staggerKnots.bending`) points across. It is bounded by the hip's extension
 * (`walkReach.EXTENSION`), the tighter of the hip's two sagittal limits, and
 * eased in on a minimum-jerk share from the measured reaction over the weight
 * shift that follows it (`staggerBounds.REACTION`, `staggerBounds.TRANSFER`),
 * so it starts from the entry's upright trunk.
 *
 * The root carries the centre of mass on its course less the shift the trunk's
 * tilt makes of it, the measured shift per sine of pitch and roll
 * (`staggerKnots.bending`), so the displayed centre of mass keeps the
 * pendulum's course whatever the trunk does.
 * Parameter body: The body.
 * Parameter entry: The posture the push meets.
 * Parameter walk: The centre of mass's travel, the extrapolated centre of mass on
 * the floor and the entry's centre of mass, world metres, at seconds since
 * the action's start.
 * Parameter bend: The centre of mass's shift per sine of the trunk's pitch and
 * roll, metres.
 * Returns: The trunk's tilt, degrees, the upright root before any lowering,
 * world metres, and the reaction's eased share from the entry (0 until the
 * measured reaction, 1 once the weight shift is done), at a second.
 */
export function staggerLean(
  body: IAutoMovieMotionHumanActionContext["body"],
  entry: IAutoMovieMotionHumanActionContext["entry"],
  walk: IStaggerLeanWalk,
  bend: Record<StaggerLeanBendEntry, IAutoMovieVector3>,
): (seconds: number) => IStaggerLeanResult {
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const length: number = staggerBounds.PENDULUM * body.measure.hipHeight;
  const onset: number = AutoMovieMotionHumanTiming.seconds(
    staggerBounds.REACTION,
  );
  const rise: number = AutoMovieMotionHumanTiming.seconds(
    staggerBounds.TRANSFER,
  );
  const rolling: number = AutoMovieEngineVector3.dot(bend.roll, across) < 0 ? -1 : 1;
  const root: IAutoMovieVector3 = entry.posture.root;
  return (seconds: number): IStaggerLeanResult2 => {
    const travel: IAutoMovieVector3 = walk.course(seconds);
    const xi: IAutoMovieVector3 = walk.extrapolated(seconds);

    // The lead v / omega0 of the extrapolated centre of mass over the centre.
    const lead: IAutoMovieVector3 = {
      x: xi.x - (walk.centre.x + travel.x),
      y: 0,
      z: xi.z - (walk.centre.z + travel.z),
    };
    const size: number = AutoMovieEngineVector3.length(lead);
    const ease: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (seconds - onset) / rise)),
    );
    const angle: number =
      size > 0
        ? ease *
          Math.min(
            walkReach.EXTENSION,
            (Math.atan(size / length) * 180) / Math.PI,
          )
        : 0;
    const against: (axis: IAutoMovieVector3) => number = (
      axis: IAutoMovieVector3,
    ): number => (size > 0 ? -AutoMovieEngineVector3.dot(lead, axis) / size : 0);
    const trunk: IStaggerLeanTrunk = {
      pitch: angle * against(forward),
      roll: rolling * angle * against(across),
    };

    // The root carries the centre on its course less the trunk's shift.
    const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
    const r: number = Math.sin((trunk.roll * Math.PI) / 180);
    return {
      trunk,
      ease,
      root: {
        x: root.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
        y: root.y,
        z: root.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
      },
    };
  };
}

/*
 * The record of `IStaggerLeanTrunk`'s site.
 */
type IStaggerLeanTrunk = { pitch: number; roll: number };

/*
 * The record of `IStaggerLeanResult2`'s site.
 */
type IStaggerLeanResult2 = {
  trunk: IStaggerLeanTrunkResult2;
  root: IAutoMovieVector3;
  ease: number;
};

/*
 * The record of `IStaggerLeanTrunkResult2`'s site.
 */
type IStaggerLeanTrunkResult2 = { pitch: number; roll: number };

/*
 * The record of `IStaggerLeanResult`'s site.
 */
type IStaggerLeanResult = {
  trunk: IStaggerLeanTrunkResult;
  root: IAutoMovieVector3;
  ease: number;
};

/*
 * The record of `IStaggerLeanTrunkResult`'s site.
 */
type IStaggerLeanTrunkResult = { pitch: number; roll: number };

/*
 * The alternatives of `StaggerLeanBendEntry`'s site.
 */
type StaggerLeanBendEntry = "pitch" | "roll";

/*
 * The record of `IStaggerLeanWalk`'s site.
 */
type IStaggerLeanWalk = {
  course: (seconds: number) => IAutoMovieVector3;
  extrapolated: (seconds: number) => IAutoMovieVector3;
  centre: IAutoMovieVector3;
};

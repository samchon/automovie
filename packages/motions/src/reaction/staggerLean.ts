import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkReach } from "../actions/walkReach";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFrame } from "../posture/HumanFrame";
import { staggerBounds } from "./staggerBounds";

/**
 * A stagger's trunk and the root that carries it, as prepared curves of the
 * recovery's courses (`staggerRecover`).
 *
 * The trunk bends about the hips against the fall, the hip strategy (Horak
 * and Nashner 1986, J Neurophysiol 55:1369), which counter-rotates the upper
 * body against the centre of mass's motion (Hof 2007, J Biomech 40:451, the
 * counter-rotation mechanism). Its angle is the inclination of the
 * extrapolated centre of mass's lead over the centre of mass, `v / omega0`
 * (Hof, Gazendam and Sinke 2005), seen from the pendulum's length `l`:
 * `atan(|v| / (omega0 l))`, which grows with the push and vanishes as the
 * body comes to rest. The relation is the model's (provisional: neither
 * source gives a trunk angle as a function of the lead); it carries no
 * fitted coefficient. Its direction is opposite the lead, along and across
 * the heading, the roll's sign the one whose measured mass shift
 * (`staggerKnots.bending`) points across. It is bounded by the hip's
 * extension (`walkReach.EXTENSION`), the tighter of the hip's two sagittal
 * limits, and eased in on a minimum-jerk share from the measured reaction
 * over the weight shift that follows it (`staggerBounds.REACTION`,
 * `staggerBounds.TRANSFER`), so it starts from the entry's upright trunk.
 *
 * The root carries the centre of mass on its course less the shift the
 * trunk's tilt makes of it, the measured shift per sine of pitch and roll
 * (`staggerKnots.bending`), so the displayed centre of mass keeps the
 * pendulum's course whatever the trunk does.
 *
 * @param body The body.
 * @param entry The posture the push meets.
 * @param walk The centre of mass's travel, the extrapolated centre of mass on the floor and the entry's centre of mass, world metres, at seconds since the action's start.
 * @param bend The centre of mass's shift per sine of the trunk's pitch and roll, metres.
 * @returns The trunk's tilt, degrees, and the upright root before any lowering, world metres, at a second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the trunk's law, its provisional status, its direction, bound and onset, and the root's compensation, with sources.
 * @evidence contracts/development/implementation.md#principled-implementation The hip strategy's counter-rotation against the extrapolated centre of mass's lead, read in closed form from Hof's pendulum; the root's compensation is the measured linear mass shift per sine of tilt.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed heading axes, length, onset and roll sign prepared once, then one reader of lead, angle, direction, ease and root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coefficient is fitted: the angle is a geometric ratio of the body's own pendulum, bounded by the hip's range, and its provisional status is stated.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per read: two course reads and a few trigonometric terms.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admission and the displayed feet read the same law, so the legs admitted are the legs shown.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the courses, the shift vectors and its constants for its plan's lifetime.
 */
export function staggerLean(
  body: IHumanActionContext["body"],
  entry: IHumanActionContext["entry"],
  walk: {
    course: (seconds: number) => IAutoMovieVector3;
    extrapolated: (seconds: number) => IAutoMovieVector3;
    centre: IAutoMovieVector3;
  },
  bend: Record<"pitch" | "roll", IAutoMovieVector3>,
): (seconds: number) => {
  trunk: { pitch: number; roll: number };
  root: IAutoMovieVector3;
} {
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
  const length: number = staggerBounds.PENDULUM * body.measure.hipHeight;
  const onset: number = AutoMovieMotionHumanTiming.seconds(staggerBounds.REACTION);
  const rise: number = AutoMovieMotionHumanTiming.seconds(staggerBounds.TRANSFER);
  const rolling: number = Vector3.dot(bend.roll, across) < 0 ? -1 : 1;
  const root: IAutoMovieVector3 = entry.posture.root;
  return (seconds: number): { trunk: { pitch: number; roll: number }; root: IAutoMovieVector3 } => {
    const travel: IAutoMovieVector3 = walk.course(seconds);
    const xi: IAutoMovieVector3 = walk.extrapolated(seconds);

    // The lead v / omega0 of the extrapolated centre of mass over the centre.
    const lead: IAutoMovieVector3 = {
      x: xi.x - (walk.centre.x + travel.x),
      y: 0,
      z: xi.z - (walk.centre.z + travel.z),
    };
    const size: number = Vector3.length(lead);
    const ease: number = minimumJerk.share(
      Math.min(1, Math.max(0, (seconds - onset) / rise)),
    );
    const angle: number =
      size > 0
        ? ease * Math.min(walkReach.EXTENSION, (Math.atan(size / length) * 180) / Math.PI)
        : 0;
    const against: (axis: IAutoMovieVector3) => number = (axis: IAutoMovieVector3): number =>
      size > 0 ? -Vector3.dot(lead, axis) / size : 0;
    const trunk: { pitch: number; roll: number } = {
      pitch: angle * against(forward),
      roll: rolling * angle * against(across),
    };

    // The root carries the centre on its course less the trunk's shift.
    const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
    const r: number = Math.sin((trunk.roll * Math.PI) / 180);
    return {
      trunk,
      root: {
        x: root.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
        y: root.y,
        z: root.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
      },
    };
  };
}

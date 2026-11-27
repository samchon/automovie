import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanTether,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectileFirstContact,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPropSweep } from "./HumanPropSweep";

/**
 * The hands a prop's flight sweep reads (`HumanPropSweep`): a collider read
 * only until a handback, the sides a handback names, a prop held still, the
 * carriers that bear a prop over a span, and whether any action launches a
 * prop.
 */
export namespace HumanPropSweepHands {
  /** Whether any action launches a prop. */
  export function launched(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): boolean {
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        if (
          (segment.plan.launches ?? []).some(
            (l: IAutoMovieMotionPropLaunch): boolean => l.prop === subject,
          )
        )
          return true;
    return false;
  }

  /**
   * A collider present only before a flight second: from it on, the handback's
   * fitted approach owns the meeting, so the collider is absent.
   */
  export function until(
    collider: IAutoMovieProjectileFirstContact.ICollider,
    from: number,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return {
      id: collider.id,
      ...(collider.departure === undefined
        ? {}
        : { departure: collider.departure }),
      distance: (a, b, t): number =>
        t >= from
          ? Infinity
          : collider.distance === undefined
            ? collider.nearest(a, b, t).distance
            : collider.distance(a, b, t),
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): IAutoMovieProjectileFirstContact.INearest =>
        t >= from
          ? { distance: Infinity, point: a, normal: { x: 0, y: 1, z: 0 } }
          : collider.nearest(a, b, t),
    };
  }

  /**
   * The handback launcher's hands its fit owns at the launch: the hands that
   * touch the prop and the hands that hold a prop then (the instrument that
   * strikes), each side once.
   */
  export function handbackSides(
    self: IAutoMovieMotionHumanPerformanceState,
    handback: HumanPropSweep.IHandback,
  ): AutoMovieHumanSide[] {
    const sides: Set<AutoMovieHumanSide> = new Set(handback.hands);
    for (const other of self.props.values())
      for (const grip of HumanPerformanceRead.grips(self, other.subject))
        if (
          grip.subject === handback.subject &&
          grip.bone === undefined &&
          grip.mount === undefined &&
          grip.from <= handback.at &&
          grip.to >= handback.at - 1e-6
        )
          sides.add(grip.side);
    return [...sides];
  }

  /**
   * A prop's frame when it stands still over a sweep: nothing moves it by
   * itself, wears it, mounts it, pulls it on a line, and no grip holds it in
   * the span (a fixture's grips bear on it and never carry it). Undefined when
   * it may move.
   */
  export function still(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    from: number,
    to: number,
  ): IAutoMovieRigidTransform | undefined {
    if (
      prop.motion !== undefined ||
      prop.worn !== undefined ||
      prop.mounted !== undefined ||
      prop.soft !== undefined
    )
      return undefined;
    for (const other of self.props.values())
      if (
        other.tethers?.some(
          (line: IAutoMovieMotionHumanTether): boolean =>
            line.to.prop === prop.subject,
        )
      )
        return undefined;
    if (
      prop.fixed !== true &&
      grips.some(
        (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
          grip.from < to && grip.to > from,
      )
    )
      return undefined;
    return HumanPerformanceRead.prop(self, prop.subject, from);
  }

  /**
   * The people's grips that carry a prop over a sweep, when people's grips are
   * all that move it: none when it moves by itself, rides another prop or a
   * line pulls it.
   */
  export function carriers(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[],
    from: number,
    to: number,
  ): IAutoMovieMotionHumanPerformanceState.IGrip[] {
    if (
      prop.motion !== undefined ||
      prop.mounted !== undefined ||
      prop.soft !== undefined ||
      [...self.props.values()].some(
        (other: IAutoMovieMotionHumanProp): boolean =>
          other.tethers?.some(
            (line: IAutoMovieMotionHumanTether): boolean =>
              line.to.prop === prop.subject,
          ) === true,
      )
    )
      return [];
    const spanned: IAutoMovieMotionHumanPerformanceState.IGrip[] = grips.filter(
      (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
        grip.from < to && grip.to > from,
    );
    return spanned.some(
      (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
        grip.mount !== undefined,
    )
      ? []
      : spanned;
  }
}

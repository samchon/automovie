import type { KickboxingAction } from "./KickboxingAction";

/**
 * Where a ring movement takes a fighter's stance origin, relative to his
 * opponent and the ropes, on the floor plane (x, z in metres, y up).
 * Directions come from the pair, never from ring coordinates: circling is
 * toward the mover's lead (left) side about the opponent, giving ground is a
 * 45-degree diagonal back toward the lead side, the presser cuts across at
 * half the receiver's lateral speed, and a fighter in the rope zone escapes
 * toward the side with more room.
 *
 * ```ts
 * RingFootwork.move({ movement: "circle", steps: 4 }, a, b, ring); // a's new origin
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#movements Circle, press, give, escape, pivot, centre, approach and separation laws.
 * @evidence docs/research/kickboxing/ring-generalship.md#step A step is at most half the stance length; the rope zone is the margin plus two steps.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and each movement's rule.
 * @evidence contracts/development/design.md#principled-representation Points are floor coordinates in metres; the ring is described by its half size, margin and step so laws stay pure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The point and ring records the stance law and the tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fighter, scene or corner is named; corners come as points from the set.
 */
export namespace RingFootwork {
  /** A floor point, metres. */
  export interface IPoint {
    /** World x, metres. */
    readonly x: number;

    /** World z, metres. */
    readonly z: number;
  }

  /** The ring and the mover's step, measured from the set and the body. */
  export interface IRing {
    /** Half the side of the fighting square, metres. */
    readonly half: number;

    /** Distance a stance origin keeps from the rope line, metres. */
    readonly margin: number;

    /** The mover's step length, metres. */
    readonly step: number;
  }

  /** The 45-degree diagonal of giving ground, radians. */
  const GIVE_ANGLE: number = Math.PI / 4;

  /** The presser's share of the receiver's lateral speed. */
  const CUT_SHARE: number = 0.5;

  /** A quarter circle, the pivot's arc, radians. */
  const PIVOT_ARC: number = Math.PI / 2;

  /** Steps of the rope zone beyond the margin. */
  const ROPE_ZONE_STEPS: number = 2;

  /**
   * The mover's stance origin after a movement.
   *
   * @param action The movement record.
   * @param mover The mover's origin at the movement's start.
   * @param opponent The opponent's origin at the movement's start.
   * @param ring The ring and step.
   * @param target For `corner` and `celebrate`, the floor point the set resolves.
   * @returns The new origin, clamped inside the ropes by the margin.
   * @evidence docs/research/kickboxing/ring-generalship.md#movements Each movement's law.
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, frame and the clamp.
   * @evidence contracts/development/implementation.md#principled-implementation Planar rotation about the opponent for circling and pivots, straight steps otherwise; the step count bounds every displacement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over movements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is tuned; directions come from the pair and the ring.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied movements.
   * @evidence contracts/development/behaviors.md#relational-goals Movements are relative to the opponent and the ropes.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function move(
    action: { movement: KickboxingAction.Movement; steps: number; range?: number },
    mover: IPoint,
    opponent: IPoint,
    ring: IRing,
    target?: IPoint,
  ): IPoint {
    const length: number = action.steps * ring.step;
    const toward: IPoint = unit(sub(opponent, mover));
    // Own left of a fighter facing `toward` with y up: forward x up.
    const left: IPoint = { x: -toward.z, z: toward.x };
    switch (action.movement) {
      case "circle":
        return clamp(orbit(mover, opponent, length, 1), ring);
      case "pivot":
        return clamp(
          orbit(mover, opponent, Math.min(length, PIVOT_ARC * dist(mover, opponent)), 1),
          ring,
        );
      case "escape":
        return clamp(orbit(mover, opponent, length, roomier(mover, opponent, ring)), ring);
      case "give":
        return clamp(
          add(mover, scale(add(scale(toward, -Math.cos(GIVE_ANGLE)), scale(left, Math.sin(GIVE_ANGLE))), length)),
          ring,
        );
      case "press": {
        // Mirror the receiver's diagonal escape: his lateral speed is
        // length sin(45), the presser takes half of it across, the rest forward.
        const across: number = CUT_SHARE * length * Math.sin(GIVE_ANGLE);
        const forward: number = Math.sqrt(Math.max(0, length * length - across * across));
        const receiverLeft: IPoint = scale(left, -1);
        return clamp(add(mover, add(scale(toward, forward), scale(receiverLeft, across))), ring);
      }
      case "centre":
        return clamp(add(mover, scale(unit(scale(mover, -1)), Math.min(length, Math.hypot(mover.x, mover.z)))), ring);
      case "approach":
      case "separate":
        return clamp(sub(opponent, scale(toward, action.range ?? dist(mover, opponent))), ring);
      case "corner":
      case "celebrate":
        if (!target) throw new Error(`${action.movement} needs a target point`);
        return clamp(
          add(mover, scale(unit(sub(target, mover)), Math.min(length, dist(mover, target)))),
          ring,
        );
    }
  }

  /**
   * Whether a stance origin lies in the rope zone.
   *
   * @param point A stance origin.
   * @param ring The ring and step.
   * @returns True within the margin plus two steps of a rope line.
   * @evidence docs/research/kickboxing/ring-generalship.md#step The rope zone is the margin plus two steps.
   * @evidence contracts/development/common.md#meaningful-documentation States the zone.
   * @evidence contracts/development/implementation.md#principled-implementation Distance to the nearest of four rope lines.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied zone.
   * @evidence contracts/development/behaviors.md#relational-goals Measured against the ropes.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function onRopes(point: IPoint, ring: IRing): boolean {
    return ring.half - Math.max(Math.abs(point.x), Math.abs(point.z)) <=
      ring.margin + ROPE_ZONE_STEPS * ring.step;
  }

  /**
   * A point on the arc of a movement at a share of its progress: rotation
   * about the opponent for circling movements, a straight line otherwise.
   *
   * @param movement The movement.
   * @param from The origin at its start.
   * @param to The origin at its end.
   * @param about The opponent's origin at its start.
   * @param share Progress in [0, 1].
   * @returns The interpolated origin.
   * @evidence docs/research/kickboxing/ring-generalship.md#movements Circling and pivots rotate about the opponent; other movements walk straight.
   * @evidence contracts/development/common.md#meaningful-documentation States both paths.
   * @evidence contracts/development/implementation.md#principled-implementation Interpolates the polar angle and radius about the opponent for arcs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied paths.
   * @evidence contracts/development/behaviors.md#relational-goals Arcs are about the opponent.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function along(
    movement: KickboxingAction.Movement,
    from: IPoint,
    to: IPoint,
    about: IPoint,
    share: number,
  ): IPoint {
    const s: number = Math.max(0, Math.min(1, share));
    if (movement !== "circle" && movement !== "pivot" && movement !== "escape")
      return add(from, scale(sub(to, from), s));
    const a: IPoint = sub(from, about);
    const b: IPoint = sub(to, about);
    const start: number = Math.atan2(a.z, a.x);
    let turn: number = Math.atan2(b.z, b.x) - start;
    if (turn > Math.PI) turn -= 2 * Math.PI;
    if (turn < -Math.PI) turn += 2 * Math.PI;
    const radius: number = Math.hypot(a.x, a.z) + (Math.hypot(b.x, b.z) - Math.hypot(a.x, a.z)) * s;
    return {
      x: about.x + radius * Math.cos(start + turn * s),
      z: about.z + radius * Math.sin(start + turn * s),
    };
  }

  /** Move along a circle about the opponent by an arc length, toward the mover's left (+1) or right (-1). */
  function orbit(mover: IPoint, opponent: IPoint, arc: number, side: 1 | -1): IPoint {
    const r: IPoint = sub(mover, opponent);
    const radius: number = Math.hypot(r.x, r.z);
    if (radius === 0) return mover;
    // The mover's left, seen facing the opponent, is a clockwise turn of his
    // offset seen from above (y up), so the angle decreases for side +1.
    const angle: number = Math.atan2(r.z, r.x) - (side * arc) / radius;
    return { x: opponent.x + radius * Math.cos(angle), z: opponent.z + radius * Math.sin(angle) };
  }

  /** The circling side with more room: +1 for the mover's left, -1 for his right. */
  function roomier(mover: IPoint, opponent: IPoint, ring: IRing): 1 | -1 {
    const room = (p: IPoint): number => ring.half - Math.max(Math.abs(p.x), Math.abs(p.z));
    return room(orbit(mover, opponent, ring.step, 1)) >= room(orbit(mover, opponent, ring.step, -1)) ? 1 : -1;
  }

  function clamp(p: IPoint, ring: IRing): IPoint {
    const limit: number = ring.half - ring.margin;
    return { x: Math.max(-limit, Math.min(limit, p.x)), z: Math.max(-limit, Math.min(limit, p.z)) };
  }

  function add(a: IPoint, b: IPoint): IPoint {
    return { x: a.x + b.x, z: a.z + b.z };
  }

  function sub(a: IPoint, b: IPoint): IPoint {
    return { x: a.x - b.x, z: a.z - b.z };
  }

  function scale(a: IPoint, s: number): IPoint {
    return { x: a.x * s, z: a.z * s };
  }

  function dist(a: IPoint, b: IPoint): number {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  function unit(a: IPoint): IPoint {
    const length: number = Math.hypot(a.x, a.z);
    return length === 0 ? { x: 1, z: 0 } : { x: a.x / length, z: a.z / length };
  }
}

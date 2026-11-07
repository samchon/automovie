import { createInspectionRing } from "../../assets/ring/createInspectionRing";
import { BoutChoreography } from "../choreography/BoutChoreography";
import { BoutTechnique } from "../choreography/BoutTechnique";
import { FilmVector as V } from "../rig/FilmVector";

/**
 * Ring generalship: where the pair stands and which way it faces, derived
 * from the composed exchanges by relational footwork laws instead of
 * authored positions. Each exchange carries a screenplay ring beat (circle,
 * press, pivot, center) for one fighter; between and during exchanges that
 * fighter's law moves him relative to his opponent and to the ring's zones,
 * and the opponent turns to keep facing him:
 *
 * - circling steps laterally toward the circler's lead side, away from the
 *   opponent's rear hand, so the pair rotates about the opponent;
 * - pressure walks the opponent back; he gives ground on a diagonal toward
 *   his lead side, never straight back, while the presser follows and cuts
 *   across; once his back reaches the rope zone he circles off along the
 *   ropes and the presser cuts across at half his lateral speed;
 * - a pivot swings the pivoting fighter a quarter of a circle around his
 *   opponent on his lead side;
 * - retaking the centre walks the pair toward the ring's middle.
 *
 * Both stances hold their ground while any strike is in flight. Every
 * fighter stays inside the ropes by his body margin: a step that would
 * leave the ring turns into a step along the ropes. Coaching sources and the
 * adopted rates are recorded in `docs/research/ring-craft.md`.
 */
export namespace BoutRing {
  /** Pair state: centre of the two stance origins (world X/Z) and the heading from A toward B. */
  export interface IState {
    /** World X/Z metres. */ readonly centre: readonly [number, number];
    /** World heading from A toward B, radians; 0 faces +X. */ readonly axis: number;
  }

  /** One exchange's ring beat over the reset into it and the exchange itself. */
  export interface ISpan {
    /** Exchange name. */ readonly name: string;
    /** First second of the law: the end of the previous exchange. */ readonly start: number;
    /** Last own window of the exchange. */ readonly end: number;
    /** Movement law and the fighter who moves. */ readonly ring: BoutChoreography.IRing;
  }

  /** Length of one supported footwork step, metres: under half the orthodox stance length. */
  export const STRIDE: number = 0.25;

  /** Footwork cadence during low-intensity movement, steps per second. */
  export const CADENCE: number = 2;

  /** Footwork speed, metres per second. */
  export const SPEED: number = STRIDE * CADENCE;

  /** Rope zone: a fighter whose stance origin is within this distance of the ropes is on the ropes. */
  export const ROPES: number = 0.45 + 2 * STRIDE;

  /** Body margin a stance origin keeps from the rope line, metres. */
  export const MARGIN: number = 0.45;

  /** Share of a retreating step taken straight back; the rest of a diagonal retreat is lateral (cos 45°). */
  export const RETREAT: number = Math.SQRT1_2;

  /** Lateral share the presser mirrors to cut off the ring. */
  export const CUT: number = 0.5;

  /** Net turn of a pivot around the opponent, radians. */
  export const PIVOT: number = Math.PI / 4;

  /** Circling direction of an orthodox fighter facing an orthodox opponent: toward his own left, away from the opponent's rear hand (positive turns toward the mover's left). */
  export const LEAD: number = 1;

  /** Simulation step, seconds. */
  export const STEP: number = 1 / 60;

  /** Half the rope span: the rope line's distance from ring centre. */
  export const HALF: number = createInspectionRing.layout().ropeSpan / 2;

  /** Spans of the composed exchanges in film order. */
  export function spans(
    actions: readonly BoutChoreography.IAction[],
    groups: readonly BoutChoreography.IGroup[],
    origin: number,
  ): ISpan[] {
    const exchanges: BoutChoreography.IExchange[] = groups.flatMap((group: BoutChoreography.IGroup): BoutChoreography.IExchange[] => [...group.exchanges]);
    let previous: number = origin;
    return exchanges.map((exchange: BoutChoreography.IExchange): ISpan => {
      const rows: BoutChoreography.IAction[] = actions.filter((row: BoutChoreography.IAction): boolean => row.exchange === exchange.name);
      const opener: BoutChoreography.Fighter = exchange.phrases[0]!.actor;
      const end: number = Math.max(
        ...rows.map((row: BoutChoreography.IAction): number => row.at + BoutTechnique.HOLD + row.parameters.recovery),
      );
      const span: ISpan = {
        name: exchange.name,
        start: previous,
        end,
        ring: exchange.ring ?? { beat: "circle", actor: opener === "a" ? "b" : "a" },
      };
      previous = end;
      return span;
    });
  }

  /** Simulate the laws from `origin` to `end` at {@link STEP}; returns one state per step. */
  export function simulate(input: {
    spans: readonly ISpan[];
    /** Strike windows during which both stances hold their ground. */
    busy: readonly (readonly [number, number])[];
    origin: number;
    end: number;
    range: number;
    initial: IState;
  }): IState[] {
    const states: IState[] = [input.initial];
    let a: V.Value = place(input.initial, input.range, "a");
    let b: V.Value = place(input.initial, input.range, "b");
    const pivoted: Map<string, number> = new Map();
    const count: number = Math.ceil((input.end - input.origin) / STEP);
    for (let index: number = 1; index <= count; index++) {
      const t: number = input.origin + index * STEP;
      const span: ISpan | undefined = input.spans.find((value: ISpan): boolean => t > value.start && t <= value.end);
      const striking: boolean = input.busy.some((window: readonly [number, number]): boolean => t > window[0] && t < window[1]);
      if (span && !striking) {
        const mover: BoutChoreography.Fighter = span.ring.actor;
        const self: V.Value = mover === "a" ? a : b;
        const other: V.Value = mover === "a" ? b : a;
        const step: number = SPEED * STEP;
        let moved: { self: V.Value; other: V.Value } = { self, other };
        switch (span.ring.beat) {
          case "circle":
            moved = { self: around(self, other, LEAD * step), other };
            break;
          case "press": {
            const back: V.Value = V.normalize(V.sub(other, self));
            if (room(other) > ROPES) {
              // He gives ground on a diagonal, never straight back, and the
              // presser follows straight in while cutting across half as far.
              const retreat: V.Value = around(V.add(other, V.scale(back, step * RETREAT)), self, LEAD * step * RETREAT);
              const cut: V.Value = V.scale(V.sub(around(self, other, -LEAD * step), self), CUT);
              moved = { self: V.add(V.add(self, V.scale(back, step * RETREAT)), cut), other: retreat };
            } else {
              // On the ropes he circles off toward the side with more room,
              // and the presser cuts across at half his lateral speed.
              const side: number = escape(other, self);
              const circled: V.Value = around(other, self, side * step);
              moved = { self: V.add(self, V.scale(V.sub(circled, other), CUT)), other: circled };
            }
            break;
          }
          case "pivot": {
            // A quarter-circle around the opponent at footwork speed, once per span.
            const total: number = pivoted.get(span.name) ?? 0;
            const turn: number = Math.min(PIVOT - total, step / V.distance(self, other));
            pivoted.set(span.name, total + turn);
            moved = { self: around(self, other, LEAD * turn * V.distance(self, other)), other };
            break;
          }
          case "center": {
            const centre: V.Value = V.lerp(self, other, 0.5);
            const home: number = V.length([centre[0], 0, centre[2]]);
            const toward: V.Value = home > step ? V.scale([-centre[0], 0, -centre[2]], step / home) : [0, 0, 0];
            moved = { self: V.add(self, toward), other: V.add(other, toward) };
            break;
          }
        }
        const kept: { self: V.Value; other: V.Value } = { self: inside(moved.self), other: inside(moved.other) };
        if (mover === "a") [a, b] = [kept.self, kept.other];
        else [a, b] = [kept.other, kept.self];
      }
      states.push(state(a, b));
    }
    return states;
  }

  /** Interpolated state of a simulated track at a second. */
  export function sample(track: readonly IState[], origin: number, t: number): IState {
    const position: number = Math.max(0, Math.min(track.length - 1, (t - origin) / STEP));
    const index: number = Math.min(track.length - 2, Math.floor(position));
    if (index < 0) return track[0]!;
    const u: number = position - index;
    const x: IState = track[index]!;
    const y: IState = track[index + 1]!;
    let turn: number = y.axis - x.axis;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    return {
      centre: [x.centre[0] + (y.centre[0] - x.centre[0]) * u, x.centre[1] + (y.centre[1] - x.centre[1]) * u],
      axis: x.axis + turn * u,
    };
  }

  /** Stance origin of one fighter for a pair state, as a world point at canvas height. */
  export function place(pair: IState, range: number, fighter: BoutChoreography.Fighter): V.Value {
    const sign: number = fighter === "a" ? -1 : 1;
    return [pair.centre[0] + (sign * Math.cos(pair.axis) * range) / 2, 0, pair.centre[1] - (sign * Math.sin(pair.axis) * range) / 2];
  }

  /** Distance from a stance origin to the nearest rope line. */
  export function room(point: V.Value): number {
    return HALF - Math.max(Math.abs(point[0]), Math.abs(point[2]));
  }

  /** Pair state of two stance origins. */
  function state(a: V.Value, b: V.Value): IState {
    const centre: V.Value = V.lerp(a, b, 0.5);
    return { centre: [centre[0], centre[2]], axis: Math.atan2(-(b[2] - a[2]), b[0] - a[0]) };
  }

  /** Lateral step of `self` around `other`, keeping their distance; positive is toward self's left. */
  function around(self: V.Value, other: V.Value, distance: number): V.Value {
    const radius: number = V.distance(self, other);
    if (radius === 0) return self;
    const angle: number = distance / radius;
    const offset: V.Value = V.sub(self, other);
    // Facing the opponent, the left is a positive turn about +Y in this frame.
    return V.add(other, V.rotateY(offset, angle));
  }

  /** Lateral direction along the ropes with more room for the fighter at `self`. */
  function escape(self: V.Value, other: V.Value): number {
    const left: V.Value = around(self, other, STRIDE);
    const right: V.Value = around(self, other, -STRIDE);
    return room(left) >= room(right) ? 1 : -1;
  }

  /** Keep a stance origin inside the ropes by the body margin. */
  function inside(point: V.Value): V.Value {
    const limit: number = HALF - MARGIN;
    return [Math.max(-limit, Math.min(limit, point[0])), point[1], Math.max(-limit, Math.min(limit, point[2]))];
  }
}

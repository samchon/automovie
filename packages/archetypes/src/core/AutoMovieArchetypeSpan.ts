import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { poseArchetypeSpanGrips } from "./poseArchetypeSpanGrips";
import { resolveArchetypeSpanParts } from "./resolveArchetypeSpanParts";

/**
 * A taut line between two frames of a model that move apart: a bowstring from a
 * limb tip to the nock, a sling's cord from the hand to the pouch, a trace from
 * a collar to a cart.
 *
 * A span is a round part, a cylinder of its radius, attached to two part-local
 * points or affordance origins. An explicit held overhang extends the line
 * beyond an affordance and keeps that grip's line axis on the span. After every
 * pose its ends and held frames are resolved together. Mass counts at rest
 * only, as `AutoMovieArchetype.body` documents. A stated rest length reports
 * slack when the drawn length is shorter; it does not simulate a hanging cord.
 */
export namespace AutoMovieArchetypeSpan {
  /** Where one end of a span is attached. */
  export type End =
    | {
        /** The part the end is fixed to. */
        part: string;

        /** The point in the part's own coordinates, metres. */
        at: IAutoMovieVector3;

        /** A part end names no affordance. */
        affordance?: never;

        /** Held overhang belongs only to an affordance anchor. */
        overhang?: never;
      }
    | {
        /** The affordance whose origin the end follows. */
        affordance: string;

        /** An affordance end names no part. */
        part?: never;

        /** An affordance end takes the affordance's origin. */
        at?: never;

        /**
         * Metres beyond the grip away from the opposite anchor; when present,
         * the grip's +X follows the span's unoriented line.
         */
        overhang?: number;
      };

  /** A span as an archetype records it. */
  export interface ISpan {
    /** The id of the part that draws the line. */
    id: string;

    /** One end. */
    from: End;

    /** The other end. */
    to: End;

    /** The line's radius, metres. */
    radius: number;

    /**
     * The line's rest length, metres, or null when it states none and is never
     * slack.
     */
    length: number | null;
  }

  /** A span at one pose. */
  export interface IState {
    /** Where the first end is, in the model's space, metres. */
    from: IAutoMovieVector3;

    /** Where the second end is, metres. */
    to: IAutoMovieVector3;

    /** The distance between the ends, the line's drawn length, metres. */
    length: number;

    /**
     * Whether the ends are closer than the rest length; false for a line that
     * states none.
     */
    slack: boolean;
  }

  /** Span geometry and held contact frames resolved from the same pose. */
  export interface IPose {
    /** Posed parts with each declared line rebuilt at its endpoints. */
    parts: IAutoMovieModelPart[];
    /** Original contact semantics with explicitly held axes aligned to the line. */
    affordances: IAutoMovieAffordance[];
  }

  /**
   * The point an end is at, in a pose.
   *
   * @param archetype The name a refusal carries.
   * @param end The end.
   * @param parts The posed parts.
   * @param affordances The posed affordances.
   * @returns The point in the model's space.
   * @throws {AutoMovieArchetypeRefusal} When the end names a part or affordance
   *   the model lacks, listing those it has.
   */
  export function locate(
    archetype: string,
    end: End,
    parts: readonly IAutoMovieModelPart[],
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieVector3 {
    if (end.affordance !== undefined) {
      const found: IAutoMovieAffordance | undefined = affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === end.affordance,
      );
      if (found === undefined)
        throw new AutoMovieArchetypeRefusal({
          kind: "affordance",
          archetype,
          axis: "span",
          value: end.affordance,
          feasible: {
            kind: "alternatives",
            values: affordances.map((a: IAutoMovieAffordance): string => a.id),
          },
          reason: `a span ends at "${end.affordance}", which the model does not declare`,
          fix: "end the span at an affordance the model declares",
        });
      return { ...found.frame.translation };
    }
    const part: IAutoMovieModelPart | undefined = parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === end.part,
    );
    if (part === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "span",
        value: end.part,
        feasible: {
          kind: "alternatives",
          values: parts.map((p: IAutoMovieModelPart): string => p.id),
        },
        reason: `a span ends on the part "${end.part}", which the model does not have`,
        fix: "end the span on a part the model has",
      });
    return AutoMovieArchetypeFrame.point(
      part.transform ?? AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      end.at,
    );
  }

  /**
   * A span's ends and slack in a pose.
   *
   * @param archetype The name a refusal carries.
   * @param span The span.
   * @param parts The posed parts.
   * @param affordances The posed affordances.
   * @returns Its state.
   * @throws {AutoMovieArchetypeRefusal} For a missing anchor,
   *   coincident/nonfinite geometry or invalid physical radius, rest length or
   *   held extension.
   */
  export function state(
    archetype: string,
    span: ISpan,
    parts: readonly IAutoMovieModelPart[],
    affordances: readonly IAutoMovieAffordance[],
  ): IState {
    const start: IAutoMovieVector3 = locate(
      archetype,
      span.from,
      parts,
      affordances,
    );
    const end: IAutoMovieVector3 = locate(
      archetype,
      span.to,
      parts,
      affordances,
    );
    const fromOverhang: number = overhang(archetype, span.id, span.from);
    const toOverhang: number = overhang(archetype, span.id, span.to);
    const offset: IAutoMovieVector3 = Vector3.subtract(end, start);
    const distance: number = Math.hypot(offset.x, offset.y, offset.z);
    if (
      !(span.radius > 0) ||
      (span.length !== null && !(span.length >= 0)) ||
      !(distance > 0)
    )
      refuse(
        archetype,
        span.id,
        distance,
        "span geometry and held overhang must be finite, with distinct anchors for an extension",
      );
    const direction: IAutoMovieVector3 =
      distance === 0
        ? { x: 0, y: 0, z: 0 }
        : {
            x: offset.x / distance,
            y: offset.y / distance,
            z: offset.z / distance,
          };
    const from: IAutoMovieVector3 =
      fromOverhang === 0
        ? start
        : Vector3.subtract(start, Vector3.scale(direction, fromOverhang));
    const to: IAutoMovieVector3 =
      toOverhang === 0
        ? end
        : Vector3.add(end, Vector3.scale(direction, toOverhang));
    const length: number = Math.hypot(
      to.x - from.x,
      to.y - from.y,
      to.z - from.z,
    );
    if (!(length > 0))
      refuse(
        archetype,
        span.id,
        length,
        "the extended span cannot be represented as finite geometry",
      );
    return {
      from,
      to,
      length,
      slack: span.length !== null && length < span.length,
    };
  }

  /**
   * The parts with every span laid straight between its ends in a pose.
   *
   * @param archetype The name a refusal carries.
   * @param spans The model's spans.
   * @param parts The posed parts, the spans' among them.
   * @param affordances The posed affordances.
   * @returns New parts, each span's part replaced; the others as given, the
   *   list itself when there is no span.
   * @throws {AutoMovieArchetypeRefusal} As `locate` does, or when a span's ends
   *   meet, which leaves no line to draw.
   */
  export function lay(
    archetype: string,
    spans: readonly ISpan[],
    parts: IAutoMovieModelPart[],
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieModelPart[] {
    if (spans.length === 0) return parts;
    return resolve(archetype, spans, parts, affordances).parts;
  }

  /**
   * Resolve drawn lines and their explicitly held grip axes together.
   *
   * @param archetype The identity used in actionable refusals.
   * @param spans Declared lines with part-local or affordance anchors.
   * @param parts Current parts before the lines are rebuilt.
   * @param affordances Current contact frames, with held origins already
   *   placed.
   * @returns Line parts and matching grip frames without mutating inputs.
   * @throws {AutoMovieArchetypeRefusal} For invalid geometry, missing anchors
   *   or incompatible line directions sharing one grip.
   */
  export function pose(
    archetype: string,
    spans: readonly ISpan[],
    parts: IAutoMovieModelPart[],
    affordances: IAutoMovieAffordance[],
  ): IPose {
    if (spans.length === 0) return { parts, affordances };
    const resolved: ReturnType<typeof resolveArchetypeSpanParts> = resolve(
      archetype,
      spans,
      parts,
      affordances,
    );
    return {
      parts: resolved.parts,
      affordances: poseArchetypeSpanGrips(
        archetype,
        spans,
        resolved.states,
        affordances,
      ),
    };
  }

  /**
   * Endpoint semantics stay with this namespace while graph/geometry work has
   * one shared owner.
   */
  function resolve(
    archetype: string,
    spans: readonly ISpan[],
    parts: IAutoMovieModelPart[],
    affordances: readonly IAutoMovieAffordance[],
  ): ReturnType<typeof resolveArchetypeSpanParts> {
    return resolveArchetypeSpanParts(
      archetype,
      spans,
      parts,
      (span: ISpan, current: readonly IAutoMovieModelPart[]): IState =>
        state(archetype, span, current, affordances),
    );
  }

  /** A held extension is a physical length, never a missing or negative anchor. */
  function overhang(archetype: string, id: string, end: End): number {
    const value: number = end.overhang === undefined ? 0 : end.overhang;
    if (
      !(value >= 0) ||
      (end.affordance === undefined && end.overhang !== undefined)
    )
      refuse(
        archetype,
        id,
        value,
        "held overhang must be a finite nonnegative affordance-end length",
      );
    return value;
  }

  /** One existing refusal type carries the original physical request. */
  function refuse(
    archetype: string,
    id: string,
    value: unknown,
    reason: string,
  ): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: id,
      value,
      feasible: null,
      reason,
      fix: "supply finite distinct anchors and compatible explicitly held line directions",
    });
  }
}

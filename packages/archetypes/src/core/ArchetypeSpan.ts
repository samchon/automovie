import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { poseArchetypeSpanGrips } from "./poseArchetypeSpanGrips";
import { resolveArchetypeSpanParts } from "./resolveArchetypeSpanParts";

/**
 * A taut line between two frames of a model that move apart: a bowstring from a limb tip to the nock, a sling's cord from the hand to the pouch, a trace from a collar to a cart.
 *
 * A span is a round part, a cylinder of its radius, attached to two part-local points or affordance origins. An explicit held overhang extends the line beyond an affordance and keeps that grip's line axis on the actual span. After every pose its ends and held frames are resolved together. Mass counts at rest only, as `Archetype.body` documents. A stated rest length reports slack when the drawn length is shorter; it does not simulate a hanging cord.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a span is, what its ends may be, when it is laid, how its mass counts and what slack means.
 * @evidence contracts/development/design.md#principled-representation A line segment between two attachment points, each a part-local point or an affordance's origin, drawn as a cylinder of fixed radius whose length and orientation follow its ends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns span endpoints, current state, geometry-only lay and complete pose emission. The constructor consumes geometry plus held frames; body-floor preview uses geometry only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An end is a discriminated union, so it names a part with a point or an affordance, never both.
 */
export namespace ArchetypeSpan {
  /**
   * Where one end of a span is attached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both anchor forms and the optional held-line extension in metres.
   * @evidence contracts/development/design.md#principled-representation A part-local point or affordance origin anchors the span. An affordance's explicit nonnegative overhang extends away from the opposite anchor and aligns its grip axis with the line; numeric admission remains runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the two ends of `ISpan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members mark the other form's keys `never`, so an end cannot name both.
   */
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

        /** Metres beyond the grip away from the opposite anchor; when present, the grip's +X follows the span's unoriented line. */
        overhang?: number;
      };

  /**
   * A span as an archetype records it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   * @evidence contracts/development/design.md#principled-representation The part's id, its two ends, its radius in metres and the line's rest length in metres or null.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by `ArchetypeBuilder.span`, carried by `Archetype.IProps` and read by `lay` and `state`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rest length is null, not a sentinel, when the line has none.
   */
  export interface ISpan {
    /** The id of the part that draws the line. */
    id: string;

    /** One end. */
    from: End;

    /** The other end. */
    to: End;

    /** The line's radius, metres. */
    radius: number;

    /** The line's rest length, metres, or null when it states none and is never slack. */
    length: number | null;
  }

  /**
   * A span at one pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   * @evidence contracts/development/design.md#principled-representation The two end points in the model's space, their distance and whether that is short of the rest length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `state` and `Archetype.span`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IState {
    /** Where the first end is, in the model's space, metres. */
    from: IAutoMovieVector3;

    /** Where the second end is, metres. */
    to: IAutoMovieVector3;

    /** The distance between the ends, the line's drawn length, metres. */
    length: number;

    /** Whether the ends are closer than the rest length; false for a line that states none. */
    slack: boolean;
  }

  /**
   * Span geometry and held contact frames resolved from the same pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two actual model lists updated together without changing contact origins or identities.
   * @evidence contracts/development/design.md#principled-representation One result keeps drawn spans and their held-frame axes consistent with the same endpoint calculation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The Archetype constructor consumes both lists; geometry-only callers retain lay's existing surface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No replacement contact vocabulary, hidden anchor or fitted frame is introduced.
   */
  export interface IPose {
    /** Posed parts with each declared line rebuilt at its actual endpoints. */
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
   * @throws {ArchetypeRefusal} When the end names a part or affordance the model lacks, listing those it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the space and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A part point is the part's transform applied to it, unit scale by the builder's premise; an affordance end is its frame's origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing reference is refused, never placed at the origin.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts or affordances, tens at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        throw new ArchetypeRefusal({
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
      throw new ArchetypeRefusal({
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
    return ArchetypeFrame.point(
      part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
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
   * @throws {ArchetypeRefusal} For a missing anchor, coincident/nonfinite geometry or invalid physical radius, rest length or held extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Locate both anchors, extend a held endpoint away from the opposite anchor by its declared overhang, then compare the finite drawn length with the rest length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two locations and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Slack is exact: equal to the rest length is taut. Invalid lengths and coincident anchors refuse instead of producing an invented direction.
   * @evidence contracts/development/implementation.md#efficient-algorithms As `locate`, twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `locate`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
      ![
        start.x,
        start.y,
        start.z,
        end.x,
        end.y,
        end.z,
        distance,
        span.radius,
      ].every(Number.isFinite) ||
      !(span.radius > 0) ||
      (span.length !== null &&
        !(Number.isFinite(span.length) && span.length >= 0)) ||
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
    if (!(Number.isFinite(length) && length > 0))
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
   * @returns New parts, each span's part replaced; the others as given, the list itself when there is no span.
   * @throws {ArchetypeRefusal} As `locate` does, or when a span's ends meet, which leaves no line to draw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is replaced and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The shared dependency resolver places each actual cylinder between its current anchors. A span attached to another span reads its predecessor's current frame in topological order; cycles refuse.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One state and one part per span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coincident ends are refused rather than drawn as a part of no length, which the model validator refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in spans times parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared current-state reader and the same dependency/geometry owner as complete pose emission.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @param parts Current actual parts before the lines are rebuilt.
   * @param affordances Current contact frames, with held origins already placed.
   * @returns Actual line parts and matching grip frames without mutating inputs.
   * @throws {ArchetypeRefusal} For invalid geometry, missing anchors or incompatible line directions sharing one grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States same-pose line/grip ownership, preserved held origins, explicit overhang semantics and conflict refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve each span once, draw its finite cylinder and minimally rotate each explicit held contact's +X onto that line. An opposite axis represents the same round grip, chosen closest to its current orientation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One state list serves shared geometry placement and held-axis alignment before the two model lists are returned.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip origin never moves, no hidden anchor is added and incompatible simultaneous line directions refuse rather than letting the last span win.
   * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint lookup costs O(S(P+A)); geometry and contact maps cost O(S+P+A) for spans, parts and contacts, without repeated state calculation in this operation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same computed endpoints drive both emitted cylinder axes and grip rotations; lay reuses the same placement owner for geometry-only consumers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources State and alignment maps are call-local; new changed frames and parts escape, no pose cache or external resource is retained.
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

  /** Endpoint semantics stay with this namespace while graph/geometry work has one shared owner. */
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
      !(Number.isFinite(value) && value >= 0) ||
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
    throw new ArchetypeRefusal({
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

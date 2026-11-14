import { Vector3, rotationBetween } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * A taut line between two frames of a model that move apart: a bowstring from a limb tip to the nock, a sling's cord from the hand to the pouch, a trace from a collar to a cart.
 *
 * A span is a round part, a cylinder of its radius, whose two ends are attached to two places of the model, each a point fixed in one of its parts or the origin of one of its affordances. After every pose the part is laid again straight between where its ends then are, so it stays attached at both whatever the articulations do. Its mass is counted at rest only, as `Archetype.body` documents for every articulated part. A span may state the line's rest length; it is then slack whenever its ends come closer than that length, and is still drawn straight here: a production that needs it to hang builds a cord on the same two ends (#3448), so a line is declared once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a span is, what its ends may be, when it is laid, how its mass counts and what slack means.
 * @evidence contracts/development/design.md#principled-representation A line segment between two attachment points, each a part-local point or an affordance's origin, drawn as a cylinder of fixed radius whose length and orientation follow its ends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The span record, its end union, its state, and the two operations the archetype calls: `lay` after every pose and `state` for a span's ends and slack (#3475).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An end is a discriminated union, so it names a part with a point or an affordance, never both.
 */
export namespace ArchetypeSpan {
  /**
   * Where one end of a span is attached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both forms.
   * @evidence contracts/development/design.md#principled-representation A part with a point in its own coordinates, or an affordance whose origin the end follows; discriminated by which key is present, each forbidding the other's.
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
      }
    | {
        /** The affordance whose origin the end follows. */
        affordance: string;

        /** An affordance end names no part. */
        part?: never;

        /** An affordance end takes the affordance's origin. */
        at?: never;
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
   * @throws {ArchetypeRefusal} As `locate` does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Both ends located, their distance compared with the rest length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two locations and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Slack is exact: equal to the rest length is taut.
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
    const from: IAutoMovieVector3 = locate(archetype, span.from, parts, affordances);
    const to: IAutoMovieVector3 = locate(archetype, span.to, parts, affordances);
    const length: number = Vector3.length(Vector3.subtract(to, from));
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
   * @evidence contracts/development/implementation.md#principled-implementation The builder's rod: a cylinder of the span's radius and the ends' distance, centred between them, its axis `+Y` turned onto the line by the shortest rotation. Ends are read from the pose, never from a span laid before, so a span is never laid on a span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One state and one part per span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coincident ends are refused rather than drawn as a part of no length, which the model validator refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in spans times parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `state` and the engine's `rotationBetween`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay(
    archetype: string,
    spans: readonly ISpan[],
    parts: IAutoMovieModelPart[],
    affordances: readonly IAutoMovieAffordance[],
  ): IAutoMovieModelPart[] {
    if (spans.length === 0) return parts;
    const laid: Map<string, IAutoMovieTransform> = new Map();
    const heights: Map<string, number> = new Map();
    for (const span of spans) {
      const now: IState = state(archetype, span, parts, affordances);
      if (!(now.length > 0))
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: span.id,
          value: now.length,
          feasible: null,
          reason: `the span "${span.id}" has both ends at one point`,
          fix: "articulate the model so the span's ends stay apart",
        });
      heights.set(span.id, now.length);
      laid.set(span.id, {
        translation: Vector3.scale(Vector3.add(now.from, now.to), 0.5),
        rotation: rotationBetween(
          { x: 0, y: 1, z: 0 },
          Vector3.subtract(now.to, now.from),
        ),
        scale: { ...ArchetypeFrame.UNIT },
      });
    }
    return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      const transform: IAutoMovieTransform | undefined = laid.get(part.id);
      if (transform === undefined || part.geometry.type !== "primitive")
        return part;
      const shape: AutoMoviePrimitiveShape = part.geometry.shape;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          shape:
            shape.type === "cylinder"
              ? { ...shape, height: heights.get(part.id)! }
              : shape,
        },
        transform,
      };
    });
  }
}

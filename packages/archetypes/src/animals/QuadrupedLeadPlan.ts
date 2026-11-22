import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";

/**
 * One admitted collar/lead assembly, prepared without changing a model builder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States neck admission, authored metre inputs, bounded private geometry and the separate emission boundary.
 * @evidence contracts/development/design.md#principled-representation Neck landmarks and four complete physical lengths determine two real rods and their midpoint grasp frame before any builder mutation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieArchetypeQuadrupedLead and the whole-cohort factory share this current non-emitting planning owner; emit retains their existing contact vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No guessed body, probability, geometry substitution, patched builder or contact-only fitting proxy admits an assembly.
 */
export class QuadrupedLeadPlan {
  /** Collar ends, metres in the model frame. */
  readonly #from: IAutoMovieVector3;
  readonly #to: IAutoMovieVector3;
  /** Outer collar radius, metres. */
  readonly #collarRadius: number;
  /** Straight lead endpoints, metres. */
  readonly #attached: IAutoMovieVector3;
  readonly #end: IAutoMovieVector3;
  /** Authored lead radius and length, metres. */
  readonly #radius: number;
  readonly #length: number;
  /** Midpoint grasp of that same real lead. */
  readonly #frame: IAutoMovieTransform;

  /** Admit one neck and retain its independent fixed-size assembly plan. */
  public constructor(
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    tack: AutoMovieArchetypeQuadrupedLead.IParams,
    archetype: string,
  ) {
    const axis: IAutoMovieVector3 = Vector3.subtract(rig.poll, rig.neck);
    const length: number = Vector3.length(axis);
    if (
      !(
        Number.isFinite(length) &&
        length > 0 &&
        Number.isFinite(rig.neckRadius) &&
        rig.neckRadius > 0
      )
    )
      throw new RangeError(
        "A collar plan requires an actual positive finite neck",
      );
    for (const key of [
      "width",
      "thickness",
      "leadLength",
      "leadRadius",
    ] as const)
      if (
        !(
          Number.isFinite(tack[key]) &&
          tack[key] > 0 &&
          (key !== "width" || tack[key] <= length)
        )
      )
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: `collar.${key}`,
          value: tack[key],
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: key === "width" ? length : null,
            unit: "m",
          },
          reason:
            "authored tack lengths must be positive and the collar must fit the actual neck",
          fix: "supply positive lengths and shorten the collar to fit its neck",
        });
    const centre: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(rig.neck, rig.poll),
      0.5,
    );
    const half: IAutoMovieVector3 = Vector3.scale(
      axis,
      tack.width / (2 * length),
    );
    this.#from = Vector3.subtract(centre, half);
    this.#to = Vector3.add(centre, half);
    this.#collarRadius = rig.neckRadius + tack.thickness;
    this.#attached = { ...centre, x: rig.neckRadius + tack.thickness };
    this.#end = { ...this.#attached, x: this.#attached.x + tack.leadLength };
    this.#radius = tack.leadRadius;
    this.#length = tack.leadLength;
    this.#frame = AutoMovieArchetypeFrame.facing(
      Vector3.scale(Vector3.add(this.#attached, this.#end), 0.5),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    );
    if (
      ![
        this.#collarRadius,
        this.#radius,
        this.#length,
        ...[
          this.#from,
          this.#to,
          this.#attached,
          this.#end,
          this.#frame.translation,
        ].flatMap((point: IAutoMovieVector3): number[] => [
          point.x,
          point.y,
          point.z,
        ]),
      ].every(Number.isFinite)
    )
      throw new RangeError(
        "The actual collar/lead plan is not finitely representable",
      );
  }

  /**
   * Emit the same admitted rods and contact into a builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the model mutation boundary, preserved contact identity and independent contact-frame output.
   * @evidence contracts/development/implementation.md#principled-implementation The collar spans its admitted neck endpoints; the outward straight lead and its midpoint frame share the same planned geometry and authored radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ordinary rod calls precede one contact with copied scalar TRS.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Emission neither fits nor guesses dimensions and introduces no marker-only part, floating grip or alternate physical coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size emission delegates the builder's existing part-id checks; geometry planning is not repeated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the preflight plan selected by the factory, also serving the legacy dog/shared-lead wrapper.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns emitted data; each contact gets a fresh frame and the plan retains only its bounded private scalar/vector records without a builder or external handle.
   */
  public emit<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    id: Id,
  ): void {
    builder.rod("collar", this.#collarRadius, this.#from, this.#to, {
      color: "#645139",
    });
    builder.rod("lead", this.#radius, this.#attached, this.#end, {
      color: "#645139",
    });
    builder.affordance({
      id,
      kind: "rein",
      symmetry: "round",
      grip: "power",
      frame: {
        translation: { ...this.#frame.translation },
        rotation: { ...this.#frame.rotation },
        scale: { ...this.#frame.scale },
      },
      extent: null,
      aperture: 2 * this.#radius,
      length: this.#length,
    });
  }
}

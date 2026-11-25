import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AnnularFitting } from "./AnnularFitting";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";

/** One admitted collar/lead assembly, prepared without changing a model builder. */
export class QuadrupedLeadPlan {
  /** Collar ends, metres in the model frame. */
  readonly #from: IAutoMovieVector3;
  readonly #to: IAutoMovieVector3;
  /** The collar's fixed local material surrounding the open neck passage. */
  readonly #collar: readonly AutoMovieArchetypeConvexCell.ICell[];
  /** Straight lead endpoints, metres. */
  readonly #attached: IAutoMovieVector3;
  readonly #end: IAutoMovieVector3;
  /** Authored lead radius and length, metres. */
  readonly #radius: number;
  readonly #length: number;
  /** Lead diameter, metres, read as grip width from the rein affordance. */
  readonly #aperture: number;
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
    if (!(length > 0 && rig.neckRadius > 0))
      throw new RangeError(
        "A collar plan requires an actual positive finite neck",
      );
    for (const key of [
      "width",
      "thickness",
      "leadLength",
      "leadRadius",
    ] as const)
      if (!(tack[key] > 0 && (key !== "width" || tack[key] <= length)))
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

    // Doubling the radius shifts the binary exponent of the grip diameter.
    // IEEE Std 754-2019 §§3.6, 7.4 give the finite range and overflow rule.
    const maximumLeadRadius: number = Number.MAX_VALUE / 2;
    if (tack.leadRadius > maximumLeadRadius)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "collar.leadRadius",
        value: tack.leadRadius,
        feasible: null,
        reason: "the lead diameter exceeds the representable grip aperture",
        fix: "reduce the lead radius",
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
    this.#collar = AnnularFitting.prepare(
      rig.neckRadius,
      rig.neckRadius + tack.thickness,
      tack.width,
    );
    this.#attached = { ...centre, x: rig.neckRadius + tack.thickness };
    this.#end = { ...this.#attached, x: this.#attached.x + tack.leadLength };
    this.#radius = tack.leadRadius;
    this.#length = tack.leadLength;
    this.#aperture = 2 * tack.leadRadius;
    this.#frame = AutoMovieArchetypeFrame.facing(
      Vector3.scale(Vector3.add(this.#attached, this.#end), 0.5),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    );
  }

  /** Emit the admitted collar shell, lead and its grasp into a builder. */
  public emit<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    id: Id,
  ): void {
    AnnularFitting.emit(
      builder,
      "collar",
      this.#collar,
      this.#from,
      this.#to,
      "#645139",
    );
    builder.rod("lead", this.#radius, this.#attached, this.#end, {
      color: "#645139",
    });
    builder.affordance({
      id,
      kind: "rein",
      materialPart: "lead",
      symmetry: "round",
      grip: "power",
      frame: {
        translation: { ...this.#frame.translation },
        rotation: { ...this.#frame.rotation },
        scale: { ...this.#frame.scale },
      },
      extent: null,
      aperture: this.#aperture,
      length: this.#length,
    });
  }
}

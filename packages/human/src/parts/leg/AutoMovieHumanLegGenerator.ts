import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Leg placeholder: a round tube from mid thigh to the ankle, reducing from twelve spans to eight below the knee.
 *
 * Sections are circles: mid thigh a conventional 85% of the measured thigh circumference, which is taken higher at the gluteal furrow; the knee and calf at the measured calf circumference; the ankle at the measured ankle circumference. Two three-to-one sectors behind the knee, where the popliteal fossa hides them, take the twelve spans down to eight. The chart runs `u` from mid thigh to the ankle and `v` counterclockwise about the distal axis from the anterior mark. The real leg generator replaces this one.
 *
 * Rings, in order: `thigh`, `ankle`.
 *
 * @author Samchon
 */
export class AutoMovieHumanLegGenerator implements IAutoMovieHumanPartGenerator<"leg"> {
  public readonly part = "leg" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"leg">,
  ): IAutoMovieHumanCage {
    const leg: IAutoMovieHumanIdentity.ILeg =
      props.side === "left"
        ? props.measurements.identity.body.leftLeg
        : props.measurements.identity.body.rightLeg;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "leg",
      props.side,
    );
    const thigh: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "thigh",
      side: props.side,
      part: "leg",
    });
    const ankle: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "ankle",
      side: props.side,
      part: "leg",
    });
    const radius = (circumference: number): number =>
      circumference / (2 * Math.PI);
    const span: IAutoMovieVector3 = AutoMovieHumanVector.offset(
      ankle.frame.origin,
      [thigh.frame.origin, -1],
    );
    const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(span);
    const station = (
      t: number,
      count: number,
      r: number,
    ): AutoMovieHumanCageBuilder.IStation =>
      builder.station(
        AutoMovieHumanCageBuilder.around(
          AutoMovieHumanVector.offset(thigh.frame.origin, [span, t]),
          AutoMovieHumanCageBuilder.turn(
            axis,
            AutoMovieHumanCageBuilder.buildDirections(thigh)[0]!,
            count,
          ),
          (): number => r,
        ),
        t,
      );
    const top: AutoMovieHumanCageBuilder.IStation = builder.open(
      thigh,
      (): number => 0.85 * radius(leg.thighCircumference),
      0,
    );
    const lower: AutoMovieHumanCageBuilder.IStation = station(
      0.25,
      thigh.count,
      0.5 *
        (0.85 * radius(leg.thighCircumference) + radius(leg.calfCircumference)),
    );
    const knee: AutoMovieHumanCageBuilder.IStation = station(
      0.47,
      thigh.count,
      radius(leg.calfCircumference) * 0.95,
    );
    const below: AutoMovieHumanCageBuilder.IStation = station(
      0.56,
      ankle.count,
      radius(leg.calfCircumference) * 0.95,
    );
    const calf: AutoMovieHumanCageBuilder.IStation = station(
      0.7,
      ankle.count,
      radius(leg.calfCircumference),
    );
    const bottom: AutoMovieHumanCageBuilder.IStation = builder.open(
      ankle,
      (): number => radius(leg.ankleCircumference),
      1,
    );
    builder.bridge(top, lower);
    builder.bridge(lower, knee);
    builder.taper(knee, below, [1, 1, 1, 3, 3, 1, 1, 1]);
    builder.bridge(below, calf);
    builder.bridge(calf, bottom);
    return builder.build();
  }
}

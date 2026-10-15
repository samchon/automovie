import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Ear placeholder: a short knob standing out from the attachment ring, closed by a quad cap.
 *
 * The attachment is a circle of a conventional radius, a fifth of the head circumference's radius, and the knob stands out laterally by the same. The chart runs `u` from the attachment to the tip and `v` counterclockwise about the lateral axis from the superior mark. The real ear generator replaces this one.
 *
 * Rings, in order: `ear`.
 *
 * @author Samchon
 */
export class AutoMovieHumanEarGenerator implements IAutoMovieHumanPartGenerator<"ear"> {
  public readonly part = "ear" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"ear">,
  ): IAutoMovieHumanCage {
    const radius: number =
      (0.2 * props.measurements.identity.head.headCircumference) /
      (2 * Math.PI);
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "ear",
      props.side,
    );
    const ring: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "ear",
      side: props.side,
      part: "ear",
    });
    const out: IAutoMovieVector3 = AutoMovieHumanVector.of(
      -ring.frame.normal.x,
      -ring.frame.normal.y,
      -ring.frame.normal.z,
    );
    const directions: IAutoMovieVector3[] =
      AutoMovieHumanCageBuilder.buildDirections(ring);
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      builder.open(ring, (): number => radius, 0),
    ];
    for (const [t, scale] of [
      [0.4, 1.1],
      [0.8, 0.9],
    ] as const)
      stations.push(
        builder.station(
          AutoMovieHumanCageBuilder.around(
            AutoMovieHumanVector.offset(ring.frame.origin, [out, t * radius]),
            directions,
            (): number => scale * radius,
          ),
          t,
        ),
      );
    for (let i: number = 1; i < stations.length; ++i)
      builder.bridge(stations[i - 1]!, stations[i]!);
    builder.cap(stations[stations.length - 1]!, out, 0.3 * radius);
    return builder.build();
  }
}

import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Hand placeholder: a flattened mitten from the wrist ring along the hand's length, closed by a quad cap.
 *
 * Sections are ellipses whose width follows the measured hand breadth and whose thickness is a conventional fraction of it; the mitten ends at the measured hand length. The chart runs `u` from the wrist to the tip and `v` counterclockwise about the distal axis from the palmar mark. The real hand generator replaces this one.
 *
 * Rings, in order: `wrist`.
 *
 * @author Samchon
 */
export class AutoMovieHumanHandGenerator implements IAutoMovieHumanPartGenerator<"hand"> {
  public readonly part = "hand" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"hand">,
  ): IAutoMovieHumanCage {
    const arm: IAutoMovieHumanIdentity.IArm =
      props.side === "left"
        ? props.measurements.identity.body.leftArm
        : props.measurements.identity.body.rightArm;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "hand",
      props.side,
    );
    const wrist: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "wrist",
      side: props.side,
      part: "hand",
    });
    const axis: IAutoMovieVector3 = AutoMovieHumanVector.of(
      -wrist.frame.normal.x,
      -wrist.frame.normal.y,
      -wrist.frame.normal.z,
    );
    const directions: IAutoMovieVector3[] =
      AutoMovieHumanCageBuilder.buildDirections(wrist);
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      builder.open(
        wrist,
        (): number => arm.wristCircumference / (2 * Math.PI),
        0,
      ),
    ];
    const breadth: number = arm.handBreadth;
    for (const [t, thick, wide] of [
      [0.2, 0.17, 0.42],
      [0.45, 0.16, 0.5],
      [0.7, 0.12, 0.46],
      [0.88, 0.09, 0.38],
    ] as const)
      stations.push(
        builder.station(
          AutoMovieHumanCageBuilder.around(
            AutoMovieHumanVector.offset(wrist.frame.origin, [
              axis,
              t * arm.handLength,
            ]),
            directions,
            (k: number): number =>
              AutoMovieHumanCageBuilder.ellipse(
                thick * breadth,
                wide * breadth,
                (2 * Math.PI * k) / directions.length,
              ),
          ),
          t,
        ),
      );
    for (let i: number = 1; i < stations.length; ++i)
      builder.bridge(stations[i - 1]!, stations[i]!);
    builder.cap(stations[stations.length - 1]!, axis, 0.1 * arm.handLength);
    return builder.build();
  }
}

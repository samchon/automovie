import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Arm placeholder: a round tube from mid upper arm to the wrist through the elbow and the forearm's widest section.
 *
 * Sections are circles of the measured upper arm, forearm and wrist circumferences, with the elbow a conventional 90% of the upper arm. The start mark turns a quarter turn along the arm, from the anterior upper arm to the palmar wrist, so the quad lines spiral as the mid-prone forearm does. The chart runs `u` from mid upper arm to the wrist and `v` counterclockwise about the distal axis from the anterior mark. The real arm generator replaces this one.
 *
 * Rings, in order: `upperArm`, `wrist`.
 *
 * @author Samchon
 */
export class AutoMovieHumanArmGenerator implements IAutoMovieHumanPartGenerator<"arm"> {
  public readonly part = "arm" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"arm">,
  ): IAutoMovieHumanCage {
    const arm: IAutoMovieHumanIdentity.IArm =
      props.side === "left"
        ? props.measurements.identity.body.leftArm
        : props.measurements.identity.body.rightArm;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "arm",
      props.side,
    );
    const upper: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "upperArm",
      side: props.side,
      part: "arm",
    });
    const wrist: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "wrist",
      side: props.side,
      part: "arm",
    });
    const radius = (circumference: number): number =>
      circumference / (2 * Math.PI);
    const first: AutoMovieHumanCageBuilder.IStation = builder.open(
      upper,
      (): number => radius(arm.upperArmCircumference),
      0,
    );
    const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.offset(wrist.frame.origin, [upper.frame.origin, -1]),
    );
    const start: IAutoMovieVector3 =
      AutoMovieHumanCageBuilder.buildDirections(upper)[0]!;
    const twist: number = AutoMovieHumanCageBuilder.angle(
      start,
      AutoMovieHumanCageBuilder.buildDirections(wrist)[0]!,
      axis,
    );
    const stations: AutoMovieHumanCageBuilder.IStation[] = [first];
    for (const [t, r] of [
      [0.3, radius(arm.upperArmCircumference) * 0.95],
      [0.5, radius(arm.upperArmCircumference) * 0.9],
      [0.68, radius(arm.forearmCircumference)],
      [
        0.85,
        (radius(arm.forearmCircumference) + radius(arm.wristCircumference)) / 2,
      ],
    ] as const)
      stations.push(
        builder.station(
          AutoMovieHumanCageBuilder.around(
            AutoMovieHumanVector.offset(upper.frame.origin, [
              AutoMovieHumanVector.offset(wrist.frame.origin, [
                upper.frame.origin,
                -1,
              ]),
              t,
            ]),
            AutoMovieHumanCageBuilder.turn(
              axis,
              AutoMovieHumanCageBuilder.rotate(start, axis, twist * t),
              upper.count,
            ),
            (): number => r,
          ),
          t,
        ),
      );
    stations.push(
      builder.open(wrist, (): number => radius(arm.wristCircumference), 1),
    );
    for (let i: number = 1; i < stations.length; ++i)
      builder.bridge(stations[i - 1]!, stations[i]!);
    return builder.build();
  }
}

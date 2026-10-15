import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Foot placeholder: a boot that runs down from the ankle ring, turns forward over the heel and ends in a quad cap at the toes.
 *
 * Sections turn a quarter turn about the transverse axis on the way, so the anterior mark at the ankle becomes the dorsum; their width follows the measured foot breadth and their height the ankle joint's, both by conventional fractions, and the boot reaches a conventional 80% of the measured foot length ahead of the ankle. The chart runs `u` from the ankle to the toes and `v` counterclockwise about the distal axis from the anterior mark. The real foot generator replaces this one.
 *
 * Rings, in order: `ankle`.
 *
 * @author Samchon
 */
export class AutoMovieHumanFootGenerator implements IAutoMovieHumanPartGenerator<"foot"> {
  public readonly part = "foot" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"foot">,
  ): IAutoMovieHumanCage {
    const leg: IAutoMovieHumanIdentity.ILeg =
      props.side === "left"
        ? props.measurements.identity.body.leftLeg
        : props.measurements.identity.body.rightLeg;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "foot",
      props.side,
    );
    const ankle: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "ankle",
      side: props.side,
      part: "foot",
    });
    const joint: IAutoMovieHumanSkeleton.IJoint = props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
        j.bone === (props.side === "left" ? "leftFoot" : "rightFoot"),
    )!;
    const down: IAutoMovieVector3 = AutoMovieHumanVector.of(
      -ankle.frame.normal.x,
      -ankle.frame.normal.y,
      -ankle.frame.normal.z,
    );
    const transverse: IAutoMovieVector3 = AutoMovieHumanVector.of(1, 0, 0);
    const start: IAutoMovieVector3 =
      AutoMovieHumanCageBuilder.buildDirections(ankle)[0]!;
    const o: IAutoMovieVector3 = ankle.frame.origin;
    const h: number = joint.position.y;
    const L: number = leg.footLength;
    const B: number = leg.footBreadth;
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      builder.open(
        ankle,
        (): number => leg.ankleCircumference / (2 * Math.PI),
        0,
      ),
    ];
    for (const [t, bend, y, z, height, width] of [
      [0.3, 0.3, 0.95 * h, 0.02 * L, 0.6 * h, 0.4 * B],
      [0.55, 0.9, 0.55 * h, 0.3 * L, 0.45 * h, 0.47 * B],
      [0.85, 1, 0.4 * h, 0.62 * L, 0.32 * h, 0.5 * B],
    ] as const) {
      const angle: number = (-Math.PI / 2) * bend;
      const axis: IAutoMovieVector3 = AutoMovieHumanCageBuilder.rotate(
        down,
        transverse,
        angle,
      );
      const reference: IAutoMovieVector3 = AutoMovieHumanCageBuilder.rotate(
        start,
        transverse,
        angle,
      );
      stations.push(
        builder.station(
          AutoMovieHumanCageBuilder.around(
            AutoMovieHumanVector.of(o.x, y, o.z + z),
            AutoMovieHumanCageBuilder.turn(axis, reference, ankle.count),
            (k: number): number =>
              AutoMovieHumanCageBuilder.ellipse(
                height,
                width,
                (2 * Math.PI * k) / ankle.count,
              ),
          ),
          t,
        ),
      );
    }
    for (let i: number = 1; i < stations.length; ++i)
      builder.bridge(stations[i - 1]!, stations[i]!);
    builder.cap(
      stations[stations.length - 1]!,
      AutoMovieHumanVector.of(0, 0, 1),
      0.15 * L,
    );
    return builder.build();
  }
}

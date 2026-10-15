import {
  AutoMovieHumanCageBuilder,
  IAutoMovieHumanCage,
  IAutoMovieHumanIdentity,
  IAutoMovieHumanPartGenerator,
  IAutoMovieHumanRingShape,
  shapeAutoMovieHumanRing,
} from "@automovie/human";

/**
 * A deliberately different hand, a square paddle, that the Human page swaps in to show that a part opening the same ring joins without any other part changing.
 *
 * It opens the wrist ring on the shared boundary of `shapeAutoMovieHumanRing`, then runs a square section, wider and longer than the placeholder mitten, to a flat cap. The arm, the junction and every other part are untouched by the swap.
 *
 * @author Samchon
 */
export class HumanViewerPaddleHandGenerator implements IAutoMovieHumanPartGenerator<"hand"> {
  /** The part it replaces. */
  public readonly part = "hand" as const;

  /**
   * Generate the paddle's cage.
   *
   * @param props Measurements, skeleton and side
   * @returns Cage opening the shared wrist ring
   */
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
    const wrist: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
      skeleton: props.skeleton,
      measurements: props.measurements,
      site: "wrist",
      side: props.side,
      part: "hand",
    });
    const axis = {
      x: -wrist.frame.normal.x,
      y: -wrist.frame.normal.y,
      z: -wrist.frame.normal.z,
    };
    const directions = AutoMovieHumanCageBuilder.buildDirections(wrist);
    const n: number = directions.length;
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      builder.place(wrist, 0),
    ];
    const square =
      (a: number, b: number) =>
      (k: number): number => {
        const angle: number = (2 * Math.PI * k) / n;
        return Math.min(
          a / Math.max(1e-9, Math.abs(Math.cos(angle))),
          b / Math.max(1e-9, Math.abs(Math.sin(angle))),
        );
      };
    for (const [t, a, b] of [
      [0.25, 0.14, 0.55],
      [0.6, 0.12, 0.6],
      [1.0, 0.1, 0.6],
    ] as const)
      stations.push(
        builder.station(
          AutoMovieHumanCageBuilder.around(
            {
              x: wrist.frame.origin.x + axis.x * t * arm.handLength,
              y: wrist.frame.origin.y + axis.y * t * arm.handLength,
              z: wrist.frame.origin.z + axis.z * t * arm.handLength,
            },
            directions,
            square(a * arm.handBreadth, b * arm.handBreadth),
          ),
          t * 0.9,
        ),
      );
    for (let i: number = 1; i < stations.length; ++i)
      builder.bridge(stations[i - 1]!, stations[i]!);
    builder.cap(stations[stations.length - 1]!, axis, 0.03 * arm.handLength);
    return builder.build();
  }
}

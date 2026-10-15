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
 * It opens the wrist ring on the shared boundary of `shapeAutoMovieHumanRing`, then runs three flat stations, with no digits, along the hand's distal axis to the hand length and closes the last with a domed cap. Each station's vertices lie on a rectangle about the axis, thin across the palmar mark and broad across the hand, so with the wrist ring's eight directions the section is a flattened octagon rather than a square with corners. The arm, the junction and every other part are untouched by the swap.
 *
 * @evidence contracts/common.md#principled-implementation The ring is opened with `place` on the site's shared boundary so the junction welds it point for point, and every later station reuses the ring's build-order directions, which run evenly counterclockwise about the distal axis from the palmar mark, so direction `k` lies at angle `2πk/n` and the rectangle's polar radius `min(a/|cos|, b/|sin|)` puts its vertex on the rectangle; the 1e-9 floor only keeps the term for an axis-parallel direction finite. Bridging needs equal counts and the cap a multiple of four of at least eight, which the wrist ring's eight vertices satisfy.
 * @evidence contracts/common.md#clear-and-simple-design One class implementing the part generator interface for the hand only, built entirely from the human package's cage builder and ring shape, so the demonstration adds no hook to the package and the page swaps it in through the `parts` option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The station fractions of hand length and breadth are fixed demonstration choices, not measured anatomy, and no side, person or test is special-cased; both sides use the same ring directions.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the class exists, how it joins the shared wrist ring, the true shape of its section, and that no other part changes.
 * @evidence contracts/performance.md#efficient-algorithms A fixed eight-vertex ring, four stations and one cap make about thirty quads per hand, independent of the person's measurements.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one side's cage from that side's measurements and skeleton; the person that holds the generator decides when to generate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The instance holds only its constant `part`; every cage it returns belongs to the caller.
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
   * @returns Cage in the skeleton's model frame and millimetres, opening the shared wrist ring
   *
   * @evidence contracts/common.md#principled-implementation Places the wrist ring on the shared boundary, then rectangle-bounded stations at 0.25, 0.6 and 1 of the hand length along the reversed ring normal, which points distally for the hand, and closes the last with the builder's cap; the wrist ring's eight evenly spaced directions meet the bridge and cap preconditions.
   * @evidence contracts/common.md#clear-and-simple-design The station table and the rectangle radius are local to the one method that uses them; every topology step is the cage builder's.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The side only selects which arm's measurements to read; no other input is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The documentation states the inputs, and the frame, units and junction ring of the returned cage.
   * @evidence contracts/performance.md#efficient-algorithms Constant work: eight directions over four stations, three bridges and one two-by-two cap grid.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work One cage per call for one side; nothing is shared across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The builder is local and dropped on return; the returned cage belongs to the caller.
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

import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { shapeAutoMovieHumanEar } from "./shapeAutoMovieHumanEar";

/**
 * Inclination of the auricle's long axis behind the vertical, degrees: the angle of the superaurale-subaurale line, 19.40 in men and 17.95 in women among 200 Turkish adults aged 18 to 25 on standardized photographs (Bahşi et al. 2023, J Craniofac Surg 34(8):e799-e803), the sexes averaged. Grade: measured.
 */
const INCLINATION: number = (18.7 * Math.PI) / 180;

/**
 * Generates the auricle: one cartilage plate rolled at its free margin and folded inside it, open at its attachment to the head.
 *
 * The ear reads its side's length, breadth and protrusion and the skeleton's tragion, and nothing of the head, so a profile can replace it by another ear that opens the same ring. `shapeAutoMovieHumanEar` draws its loops in the auricle's own frame; this generator stands that frame at tragion, its long axis inclined behind the vertical by {@link INCLINATION} in the parasagittal plane and its lateral axis out of the head, and builds the cage:
 *
 * - The `ear` ring opens at the attachment, its eight vertices on the layout's directions from tragion at the distances the drawing gives. The first loop off it keeps eight vertices, so the junction meets a regular row.
 * - Each span of that loop then faces three spans of the next, as two quads, which brings the count to 24 on the cranial surface, where a valence 3 vertex and a valence 5 vertex per span stay out of sight against the head.
 * - The 24-station loops run over the helix into the concha, and a 6 by 6 grid closes the concha floor, its four valence 3 corners at the bottom of the bowl.
 * - Semi-sharp edges keep the antihelix rim of the concha, the free edge of the tragus and the lip of the helix defined after subdivision without extra loops.
 *
 * The chart runs `u` from the attachment (0) over the helix to the concha floor (1) and `v` counterclockwise about the lateral axis from the superior mark. Every identity has the same 353 vertices and 348 faces.
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
    const ear: IAutoMovieHumanIdentity.IEar =
      props.side === "left"
        ? props.measurements.identity.head.leftEar
        : props.measurements.identity.head.rightEar;
    const shape: shapeAutoMovieHumanEar.IOutput = shapeAutoMovieHumanEar({
      length: ear.earLength,
      breadth: ear.earBreadth,
      protrusion: ear.earProtrusion,
    });
    const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "ear",
      side: props.side,
      part: "ear",
    });

    // the auricle's frame: origin at tragion, lateral out of the head, the long axis leaning back
    const origin: IAutoMovieVector3 = layout.frame.origin;
    const lateral: IAutoMovieVector3 = AutoMovieHumanVector.of(
      -layout.frame.normal.x,
      -layout.frame.normal.y,
      -layout.frame.normal.z,
    );
    const up: IAutoMovieVector3 = AutoMovieHumanVector.of(
      0,
      Math.cos(INCLINATION),
      -Math.sin(INCLINATION),
    );
    const back: IAutoMovieVector3 = AutoMovieHumanVector.of(
      0,
      -Math.sin(INCLINATION),
      -Math.cos(INCLINATION),
    );
    const place = (p: shapeAutoMovieHumanEar.IPoint): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(origin, [back, p.x], [up, p.y], [lateral, p.h]);

    // build order runs counterclockwise about the lateral axis: toward the front on the left ear, toward the back on the right
    const directions: IAutoMovieVector3[] =
      AutoMovieHumanCageBuilder.buildDirections(layout);
    const forward: boolean = directions[2]!.z > 0;
    const station = (k: number, count: number): number =>
      forward ? k % count : (count - (k % count)) % count;

    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "ear",
      props.side,
    );
    const u = (i: number): number => i / (shape.loops.length + 1);
    const ring: AutoMovieHumanCageBuilder.IStation = builder.station(
      directions.map((d: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
        const design: IAutoMovieVector3 = place(shape.ring[station(k, 8)]!);
        return AutoMovieHumanVector.offset(origin, [
          d,
          AutoMovieHumanVector.dot(
            AutoMovieHumanVector.offset(design, [origin, -1]),
            d,
          ),
        ]);
      }),
      0,
    );
    builder.record(layout, ring);
    const neck: AutoMovieHumanCageBuilder.IStation = builder.station(
      Array.from({ length: 8 }, (_: unknown, k: number): IAutoMovieVector3 =>
        place(shape.neck[station(k, 8)]!),
      ),
      u(1),
    );
    builder.bridge(ring, neck);
    const loops: AutoMovieHumanCageBuilder.IStation[] = shape.loops.map(
      (
        loop: shapeAutoMovieHumanEar.IPoint[],
        i: number,
      ): AutoMovieHumanCageBuilder.IStation =>
        builder.station(
          Array.from(
            { length: 24 },
            (_: unknown, j: number): IAutoMovieVector3 =>
              place(loop[station(j, 24)]!),
          ),
          u(i + 2),
        ),
    );

    // each neck span faces three spans of the first loop
    const first: AutoMovieHumanCageBuilder.IStation = loops[0]!;
    for (let k: number = 0; k < 8; ++k) {
      const n = (i: number): number => (k + i) % 8;
      const f = (i: number): number => (3 * k + i) % 24;
      builder.face(
        [
          neck.vertices[n(0)]!,
          first.vertices[f(2)]!,
          first.vertices[f(1)]!,
          first.vertices[f(0)]!,
        ],
        [
          neck.coordinates[n(0)]!,
          first.coordinates[f(2)]!,
          first.coordinates[f(1)]!,
          first.coordinates[f(0)]!,
        ],
      );
      builder.face(
        [
          neck.vertices[n(0)]!,
          neck.vertices[n(1)]!,
          first.vertices[f(3)]!,
          first.vertices[f(2)]!,
        ],
        [
          neck.coordinates[n(0)]!,
          neck.coordinates[n(1)]!,
          first.coordinates[f(3)]!,
          first.coordinates[f(2)]!,
        ],
      );
    }
    for (let i: number = 1; i < loops.length; ++i)
      builder.bridge(loops[i - 1]!, loops[i]!);
    builder.cap(loops[loops.length - 1]!, lateral, 0);

    for (const crease of shape.creases) {
      const loop: AutoMovieHumanCageBuilder.IStation = loops[crease.loop]!;
      const at = (j: number): number =>
        loop.vertices[forward ? j % 24 : (24 - (j % 24)) % 24]!;
      builder.crease([at(crease.station), at(crease.station + 1)], crease.sharpness);
    }
    return builder.build();
  }
}

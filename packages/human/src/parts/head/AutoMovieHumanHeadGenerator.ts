import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Head placeholder: an ellipsoidal tube from the neck top ring up to a quad cap at the vertex, with an attachment hole for each ear.
 *
 * Sections are ellipses of the measured head length and breadth centred between glabella and opisthocranion, narrowed by conventional fractions toward the jaw and the crown. Each ear hole is the boundary of a two-by-two block of faces left open around tragion, its eight vertices placed on the ear ring's directions at the placeholder ear's conventional radius, a fifth of the head circumference's radius. The chart runs `u` from the neck to the vertex and `v` counterclockwise about the vertical from the anterior midline. The real head generator replaces this one.
 *
 * Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  public readonly part = "head" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"head">,
  ): IAutoMovieHumanCage {
    const head = props.measurements.identity.head;
    const landmarks: IAutoMovieHumanLandmarks = props.skeleton.landmarks;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "head",
      null,
    );
    const neck: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "neckTop",
      side: null,
      part: "head",
    });
    const n: number = neck.count;
    const directions: IAutoMovieVector3[] = AutoMovieHumanCageBuilder.turn(
      AutoMovieHumanVector.of(0, 1, 0),
      AutoMovieHumanVector.of(0, 0, 1),
      n,
    );
    const centreZ: number =
      (landmarks.glabella.position.z + landmarks.opisthocranion.position.z) / 2;
    const ear: number = landmarks.left.tragion.position.y;
    const top: number = landmarks.vertex.position.y;
    const length: number = head.headLength / 2;
    const breadth: number = props.measurements.headBreadth / 2;
    const rows: IAutoMovieVector3[][] = (
      [
        [ear - 0.15 * head.headHeight, 0.8, 0.85],
        [ear, 1, 1],
        [ear + 0.15 * head.headHeight, 1, 1],
        [ear + 0.55 * (top - ear), 0.85, 0.85],
      ] as const
    ).map(([y, a, b]: readonly [number, number, number]): IAutoMovieVector3[] =>
      AutoMovieHumanCageBuilder.around(
        AutoMovieHumanVector.of(0, y, centreZ),
        directions,
        (k: number): number =>
          AutoMovieHumanCageBuilder.ellipse(
            a * length,
            b * breadth,
            (2 * Math.PI * k) / n,
          ),
      ),
    );
    const earRadius: number = (0.2 * head.headCircumference) / (2 * Math.PI);
    const holes: Array<[AutoMovieHumanSide, Array<[number, number]>]> = [
      [
        "left",
        [
          [2, 3],
          [2, 2],
          [1, 2],
          [0, 2],
          [0, 3],
          [0, 4],
          [1, 4],
          [2, 4],
        ],
      ],
      [
        "right",
        [
          [2, 9],
          [2, 8],
          [1, 8],
          [0, 8],
          [0, 9],
          [0, 10],
          [1, 10],
          [2, 10],
        ],
      ],
    ];
    const layouts: IAutoMovieHumanRingLayout[] = holes.map(
      ([side, cells]: [
        AutoMovieHumanSide,
        Array<[number, number]>,
      ]): IAutoMovieHumanRingLayout => {
        const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
          skeleton: props.skeleton,
          site: "ear",
          side,
          part: "head",
        });
        cells.forEach(([r, c]: [number, number], k: number): void => {
          rows[r]![c] = AutoMovieHumanVector.offset(layout.frame.origin, [
            layout.directions[k]!,
            earRadius,
          ]);
        });
        return layout;
      },
    );
    const first: AutoMovieHumanCageBuilder.IStation = builder.open(
      neck,
      (): number =>
        props.measurements.identity.body.neckCircumference / (2 * Math.PI),
      0,
    );
    const stations: AutoMovieHumanCageBuilder.IStation[] = [
      first,
      ...rows.map(
        (
          row: IAutoMovieVector3[],
          i: number,
        ): AutoMovieHumanCageBuilder.IStation =>
          builder.station(row, 0.2 * (i + 1)),
      ),
    ];
    const skip: Set<number> = new Set([2, 3, 8, 9]);
    builder.bridge(stations[0]!, stations[1]!);
    builder.bridge(stations[1]!, stations[2]!, skip);
    builder.bridge(stations[2]!, stations[3]!, skip);
    builder.bridge(stations[3]!, stations[4]!);
    holes.forEach(
      (
        [, cells]: [AutoMovieHumanSide, Array<[number, number]>],
        h: number,
      ): void => {
        builder.record(layouts[h]!, {
          vertices: cells.map(
            ([r, c]: [number, number]): number => stations[r + 1]!.vertices[c]!,
          ),
          coordinates: cells.map(
            ([r, c]: [number, number]) => stations[r + 1]!.coordinates[c]!,
          ),
        });
      },
    );
    builder.cap(
      stations[4]!,
      AutoMovieHumanVector.of(0, 1, 0),
      0.8 * (top - (ear + 0.55 * (top - ear))),
    );
    return builder.build();
  }
}

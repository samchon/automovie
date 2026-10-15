import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHandSketch } from "./AutoMovieHumanHandSketch";

/**
 * Extrude one finger or the thumb from its socket in the palm: a tube of eight-vertex loops along its joints, closed at the tip.
 *
 * Each loop has a vertex on the digit's palmar, ulnar, dorsal and radial sides and one between each pair, so the pad, the nail and both flanks each lie on a vertex line. A loop's section is two half-ellipses squared toward a rounded box, the dorsal one over the bone and the palmar one under it of their own depths, because a digit carries its pads below and only skin and tendon above. Loops sit on the joints and between them, so every joint bends across a loop of its own, and the tip closes on four quads around the apex.
 *
 * @param sketch The hand being drawn
 * @param props The socket and the digit's form
 * @returns The digit's loops from the socket outward, the socket first, and its apex
 */
export function shapeAutoMovieHumanDigit(
  sketch: AutoMovieHumanHandSketch,
  props: shapeAutoMovieHumanDigit.IProps,
): shapeAutoMovieHumanDigit.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const loops: number[][] = [props.socket];
  const lengths: number[] = props.points
    .slice(1)
    .map((p: IAutoMovieVector3, i: number): number => V.distance(props.points[i]!, p));
  const at = (s: number): { centre: IAutoMovieVector3; tangent: IAutoMovieVector3 } => {
    let rest: number = s;
    for (let i: number = 0; i < lengths.length; ++i) {
      const a: IAutoMovieVector3 = props.points[i]!;
      const b: IAutoMovieVector3 = props.points[i + 1]!;
      if (rest <= lengths[i]! || i === lengths.length - 1)
        return {
          centre: V.offset(a, [V.offset(b, [a, -1]), rest / lengths[i]!]),
          tangent: V.normalize(V.offset(b, [a, -1])),
        };
      rest -= lengths[i]!;
    }
    throw new Error("digit has no segments");
  };
  for (const section of props.sections) {
    const { centre, tangent } = at(section.at);
    const palmar: IAutoMovieVector3 = V.normalize(
      V.offset(props.palmar, [tangent, -V.dot(props.palmar, tangent)]),
    );
    const ulnar: IAutoMovieVector3 = V.normalize(
      V.offset(props.ulnar, [tangent, -V.dot(props.ulnar, tangent)], [palmar, -V.dot(props.ulnar, palmar)]),
    );
    const w: number = section.breadth / 2;
    const q: number = section.square;
    const side: number = section.side * (section.palmar + section.dorsal);
    const offsets: Array<[number, number]> = [
      [section.palmar, 0],
      [section.palmar * q, w * q],
      [side, w],
      [-section.dorsal * q, w * q],
      [-section.dorsal, 0],
      [-section.dorsal * q, -w * q],
      [side, -w],
      [section.palmar * q, -w * q],
    ];
    const loop: number[] = sketch.loop(
      offsets.map(([y, z]: [number, number], k: number): IAutoMovieVector3 =>
        V.offset(centre, [palmar, y * (section.swell?.[k] ?? 1)], [ulnar, z * (section.swell?.[k] ?? 1)], [tangent, section.advance?.[k] ?? 0]),
      ),
    );
    sketch.bridge(loops[loops.length - 1]!, loop);
    loops.push(loop);
  }
  const apex: number = sketch.cap(loops[loops.length - 1]!, props.apex);
  return { loops, apex };
}
/** Props, section and output types of {@link shapeAutoMovieHumanDigit}. */
export namespace shapeAutoMovieHumanDigit {
  /**
   * The vertices one digit added.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Loops from the socket outward, the socket first. */
    loops: number[][];

    /** The tip's apex. */
    apex: number;
  }

  /**
   * What one digit is drawn from, in the hand frame.
   *
   * @author Samchon
   */
  export interface IProps {
    /** The socket loop in the palm, palmar vertex first, counterclockwise about the digit on the left hand. */
    socket: number[];

    /** Joint centres from the digit's root to its tip; sections are placed by arc length along them. */
    points: IAutoMovieVector3[];

    /** Unit direction of the pad. */
    palmar: IAutoMovieVector3;

    /** Unit direction of the loop's third vertex, a quarter turn from the pad: ulnar on a finger, toward the index on the thumb. */
    ulnar: IAutoMovieVector3;

    /** Loops after the socket, from the root outward. */
    sections: ISection[];

    /** Skin point at the tip. */
    apex: IAutoMovieVector3;
  }

  /**
   * One loop's section.
   *
   * @author Samchon
   */
  export interface ISection {
    /** Arc length along the joints from the first point, millimetres. */
    at: number;

    /** Breadth across the flanks, millimetres. */
    breadth: number;

    /** Height of the dorsal surface above the joint axis, millimetres. */
    dorsal: number;

    /** Depth of the palmar surface below the joint axis, millimetres. */
    palmar: number;

    /** Where the flank vertices sit between dorsal and palmar, as a share of the depth toward the palm. */
    side: number;

    /** How far the diagonal vertices reach toward the box corner: 0.71 for an ellipse, 1 for a box. */
    square: number;

    /** Distance each vertex is carried along the digit beyond the section's plane, millimetres, by loop index; none when omitted. */
    advance?: number[];

    /** Factor on each vertex's distance from the section's centre, by loop index: above 1 a crest or pad, below 1 a crease; 1 when omitted. */
    swell?: number[];
  }
}

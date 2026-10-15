import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSubdivisionSurface, subdivideAutoMovieSurface } from "@automovie/engine";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { drawAutoMovieHumanHand } from "./drawAutoMovieHumanHand";
import { placeAutoMovieHumanNails } from "./placeAutoMovieHumanNails";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * The hand from the wrist ring: palm, back of the hand, thenar and hypothenar eminences, four fingers and the thumb, as one control cage of fixed connectivity.
 *
 `drawAutoMovieHumanHand` draws and solves the cage in the hand's own frame; this class places it in the model frame, winds the right hand's quads as the mirror image of the left's, and addresses every corner on the hand's chart. The nail plates are separate meshes (`nails`), placed on the solved skin.
 *
 * The chart runs `u` along the hand from the wrist ring to the middle fingertip, as the share of its distance in the hand's distal direction, and `v` counterclockwise about that direction from the palmar mark, as the angle about the line from the wrist ring's centre to the middle of the knuckles. Digits project onto that cylinder, so facing flanks of neighbouring fingers can share an address.
 *
 * Rings, in order: `wrist`.
 *
 * @author Samchon
 */
export class AutoMovieHumanHandGenerator implements IAutoMovieHumanPartGenerator<"hand"> {
  /** The part this generator produces. */
  public readonly part = "hand" as const;

  /**
   * Generate one hand's cage.
   *
   * @param props Measurements, skeleton and the side of the hand
   * @returns Cage in the skeleton's model frame and millimetres, with the `wrist` ring
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"hand">): IAutoMovieHumanCage {
    const drawn: drawAutoMovieHumanHand.IOutput = drawAutoMovieHumanHand(props);
    const hand: readAutoMovieHumanHand.IHand = drawn.hand;
    const toModel = (p: IAutoMovieVector3): IAutoMovieVector3 => model(hand, p);
    const reach: number = hand.fingers.Middle.points[3]!.x;
    const centre = (x: number): number =>
      (Math.min(1, Math.max(0, x / hand.metacarpaleII.x)) * (hand.metacarpaleII.z + hand.metacarpaleV.z)) / 2;
    const chart = (t: IAutoMovieVector3): { u: number; v: number } => {
      const turn: number = (Math.atan2(-(t.z - centre(t.x)), t.y) / (2 * Math.PI) + 1) % 1;
      return {
        u: Math.min(1, Math.max(0, t.x / reach)),
        v: hand.mirrored ? (1 - turn) % 1 : turn,
      };
    };
    const faces: IAutoMovieHumanCage.IFace[] = drawn.quads.map(
      (quad: readonly [number, number, number, number]): IAutoMovieHumanCage.IFace => {
        const corners: [number, number, number, number] = hand.mirrored
          ? [quad[0], quad[3], quad[2], quad[1]]
          : [quad[0], quad[1], quad[2], quad[3]];
        const charts: Array<{ u: number; v: number }> = corners.map(
          (v: number): { u: number; v: number } => chart(drawn.targets[v]!),
        );
        const vs: number[] = charts.map((c: { u: number; v: number }): number => c.v);
        const wrap: boolean = Math.max(...vs) - Math.min(...vs) > 0.5;
        return {
          vertices: corners,
          coordinates: charts.map(
            (c: { u: number; v: number }): IAutoMovieHumanSurfaceCoordinate => ({
              part: "hand",
              side: props.side,
              u: c.u,
              v: wrap && c.v < 0.5 ? c.v + 1 : c.v,
            }),
          ) as IAutoMovieHumanCage.IFace["coordinates"],
        };
      },
    );
    return {
      vertices: drawn.positions.map((p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
        position: toModel(p),
      })),
      faces,
      creases: [],
      rings: [
        {
          site: "wrist",
          side: props.side,
          vertices: drawn.ring,
          start: drawn.layout.start,
          frame: drawn.layout.frame,
        },
      ],
    };
  }

  /**
   * Generate the hand's nail plates, separate meshes resting on its skin.
   *
   * @param props Measurements, skeleton and side, as for `generate`
   * @returns One closed cage per digit, thumb first, model frame and millimetres, without rings
   */
  public nails(props: IAutoMovieHumanPartGenerator.IProps<"hand">): IAutoMovieHumanCage[] {
    const drawn: drawAutoMovieHumanHand.IOutput = drawAutoMovieHumanHand(props);
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: drawn.positions.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
        faces: drawn.quads.map((q: [number, number, number, number]): number[] => [...q]),
      },
      levels: 3,
    });
    const triangles: number[] = [];
    for (let q: number = 0; q < surface.faces.length; q += 4)
      triangles.push(
        surface.faces[q]!, surface.faces[q + 1]!, surface.faces[q + 2]!,
        surface.faces[q]!, surface.faces[q + 2]!, surface.faces[q + 3]!,
      );
    return placeAutoMovieHumanNails({
      hand: drawn.hand,
      breadth: drawn.arm.handBreadth,
      skin: { positions: surface.limitPositions, triangles },
    }).map(({ positions, quads }): IAutoMovieHumanCage => ({
      vertices: positions.map((p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
        position: model(drawn.hand, p),
      })),
      // the hand frame is the left hand's mirror in the model, so the plate's outward winding there reverses
      faces: quads.map(([a, b, c, d]: [number, number, number, number]): IAutoMovieHumanCage.IFace => ({
        vertices: drawn.hand.mirrored ? [a, b, c, d] : [a, d, c, b],
        coordinates: [a, b, c, d].map(
          (): IAutoMovieHumanSurfaceCoordinate => nailAddress(props.side),
        ) as IAutoMovieHumanCage.IFace["coordinates"],
      })),
      creases: [],
      rings: [],
    }));
  }
}

/** Model point of a hand-frame point. */
const model = (hand: readAutoMovieHumanHand.IHand, p: IAutoMovieVector3): IAutoMovieVector3 =>
  AutoMovieHumanVector.offset(hand.origin, [hand.distal, p.x], [hand.palmar, p.y], [hand.radial, p.z]);

/** A nail plate lies off the skin's chart; its corners carry the fingertip's address. */
const nailAddress = (side: AutoMovieHumanSide): IAutoMovieHumanSurfaceCoordinate => ({
  part: "hand",
  side,
  u: 1,
  v: 0.5,
});

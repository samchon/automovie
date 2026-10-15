import {
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { loftAutoMovieHumanHand } from "./loftAutoMovieHumanHand";
import { placeAutoMovieHumanNails } from "./placeAutoMovieHumanNails";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * The hand from the wrist ring: the palm with its thenar and hypothenar eminences, four fingers and the thumb, lofted as one surface network of fixed connectivity.
 *
 * `loftAutoMovieHumanHand` lofts the hand in its own frame; this class places it in the model frame, where the left hand's frame is a mirror image, so the left hand's quads and chart turns are reversed and the right hand's kept. The nail plates are separate meshes riding each digit's distal phalanx, placed on the lofted skin.
 *
 * The palm and the back of the hand lie on the main chart: `u` along the palm sweep from the wrist ring (0) to the fingers' roots, scaled so the middle fingertip would be 1 and the roots lie short of 0.5, and `v` counterclockwise about the distal axis from the palmar mark. Each digit, with its bridge from the palm, lies on its own branch chart: `u` from the palm (0) through the bridge to the digit's root (0.1) and along the digit to its tip (1), `v` counterclockwise about its distal axis from its pad.
 *
 * Rings, in order: `wrist`. Attachments, in order: `nail.thumb`, `nail.index`, `nail.middle`, `nail.ring`, `nail.little`.
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
    const lofted: loftAutoMovieHumanHand.IOutput = loftAutoMovieHumanHand(props);
    const hand: readAutoMovieHumanHand.IHand = lofted.hand;
    // the hand frame is right-handed in the model only on the right hand
    const keep: boolean = hand.mirrored;
    return {
      vertices: lofted.positions.map((p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position: model(hand, p) })),
      faces: lofted.faces.map((face: loftAutoMovieHumanHand.IFace): IAutoMovieHumanCage.IFace => {
        const order: [number, number, number, number] = keep ? [0, 1, 2, 3] : [0, 3, 2, 1];
        return {
          vertices: order.map((k: number): number => face.vertices[k]!) as IAutoMovieHumanCage.IFace["vertices"],
          coordinates: order.map((k: number): IAutoMovieHumanSurfaceCoordinate => {
            const c: loftAutoMovieHumanHand.ICorner = face.corners[k]!;
            return { part: "hand", side: props.side, branch: c.branch, u: c.u, v: keep ? c.v : 1 - c.v };
          }) as IAutoMovieHumanCage.IFace["coordinates"],
        };
      }),
      creases: [],
      rings: [{ site: "wrist", side: props.side, vertices: lofted.wrist, start: lofted.ring.start, frame: lofted.ring.frame }],
      construction: {
        network: lofted.network,
        origin: hand.origin,
        x: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [hand.distal, 1000]),
        y: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [hand.palmar, 1000]),
        z: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [hand.radial, 1000]),
      },
    };
  }

  /**
   * Generate the hand's nail plates, separate meshes resting on its skin.
   *
   * @param props Measurements, skeleton and side, as for `generate`
   * @returns One closed cage per digit, thumb first, each riding its distal phalanx
   */
  public attachments(props: IAutoMovieHumanPartGenerator.IProps<"hand">): IAutoMovieHumanPartGenerator.IAttachment[] {
    const lofted: loftAutoMovieHumanHand.IOutput = loftAutoMovieHumanHand(props);
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: lofted.positions.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
        faces: lofted.faces.map((f: loftAutoMovieHumanHand.IFace): number[] => [...f.vertices]),
      },
      levels: 3,
    });
    const triangles: number[] = [];
    for (let q: number = 0; q < surface.faces.length; q += 4)
      triangles.push(
        surface.faces[q]!, surface.faces[q + 1]!, surface.faces[q + 2]!,
        surface.faces[q]!, surface.faces[q + 2]!, surface.faces[q + 3]!,
      );
    const keep: boolean = lofted.hand.mirrored;
    return placeAutoMovieHumanNails({
      hand: lofted.hand,
      breadth: lofted.arm.handBreadth,
      skin: { positions: surface.limitPositions, triangles },
    }).map(({ positions, quads }, digit: number): IAutoMovieHumanPartGenerator.IAttachment => {
      const branch: AutoMovieHumanBranch<"hand"> = DIGITS[digit]!;
      const address: IAutoMovieHumanSurfaceCoordinate = { part: "hand", side: props.side, branch, u: 1, v: 0.5 };
      return {
        name: `nail.${branch}`,
        bone: `${props.side}${BONES[digit]!}Distal` as AutoMovieHumanoidBone,
        tissue: "nail",
        cage: {
          vertices: positions.map((p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position: model(lofted.hand, p) })),
          // the plates wind outward in the hand frame taken as right-handed, as the skin does
          faces: quads.map(([a, b, c, d]: [number, number, number, number]): IAutoMovieHumanCage.IFace => ({
            vertices: keep ? [a, b, c, d] : [a, d, c, b],
            coordinates: [address, address, address, address],
          })),
          creases: [],
          rings: [],
        },
      };
    });
  }
}

/** Model point of a hand-frame point. */
const model = (hand: readAutoMovieHumanHand.IHand, p: IAutoMovieVector3): IAutoMovieVector3 =>
  AutoMovieHumanVector.offset(hand.origin, [hand.distal, p.x], [hand.palmar, p.y], [hand.radial, p.z]);

/** The digit each nail plate rests on, in the order `placeAutoMovieHumanNails` returns them. */
const DIGITS: AutoMovieHumanBranch<"hand">[] = ["thumb", "index", "middle", "ring", "little"];

/** Bone name stems of the digits, in the same order. */
const BONES: string[] = ["Thumb", "Index", "Middle", "Ring", "Little"];

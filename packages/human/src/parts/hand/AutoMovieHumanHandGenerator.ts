import { IAutoMovieMeshRayCaster } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHandChart } from "./AutoMovieHumanHandChart";
import { loftAutoMovieHumanHand } from "./loftAutoMovieHumanHand";
import { placeAutoMovieHumanNails } from "./placeAutoMovieHumanNails";
import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * The hand from the wrist ring: the palm with its thenar and hypothenar eminences, four fingers and the thumb, lofted as one surface network of fixed connectivity.
 *
 * `loftAutoMovieHumanHand` lofts the hand in its own frame; this class places it in the model frame, where the left hand's frame is a mirror image, so the left hand's quads and chart turns are reversed and the right hand's kept. The nail plates are separate meshes riding each digit's distal phalanx, projected on the already emitted assembled skin after joined fitting and relief.
 *
 * The palm and the back of the hand lie on the main chart: `u` along the palm sweep from the wrist ring (0) to the fingers' roots, scaled so the middle fingertip would be 1 and the roots lie short of 0.5, and `v` counterclockwise about the distal axis from the palmar mark. Each digit, with its bridge from the palm, lies on its own branch chart: `u` from the palm (0) through the bridge to the digit's root (0.1) and along the digit to its tip (1), `v` counterclockwise about its distal axis from its pad.
 *
 * Texture coordinates are separate face-varying data: version 4 uses named logical stations and columns, with a separate rectangle for each web and tip cap. Those coordinates stay fixed as the person changes while the evaluation addresses above retain their physical sweep parameter. The chart cut follows the first palmar column; the ring transitions do not all have a quarter-turn column.
 *
 * Rings, in order: `wrist`. Attachments, in order: `nail.thumb`, `nail.index`, `nail.middle`, `nail.ring`, `nail.little`.
 *
 * @author Samchon
 */
export class AutoMovieHumanHandGenerator implements IAutoMovieHumanPartGenerator<"hand"> {
  /** The part this generator produces. */
  public readonly part: IAutoMovieHumanPartGenerator<"hand">["part"] =
    "hand" as const;
  /**
   * Generate one hand's cage.
   *
   * @param props Measurements, skeleton and the side of the hand
   * @returns Cage in the skeleton's model frame and millimetres, with the `wrist` ring
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"hand">,
  ): IAutoMovieHumanCage {
    const lofted: loftAutoMovieHumanHand.IOutput =
      loftAutoMovieHumanHand(props);
    const hand: readAutoMovieHumanHand.IHand = lofted.hand;
    // the hand frame is right-handed in the model only on the right hand
    const keep: boolean = hand.mirrored;
    // The engine buffer is metres in the hand frame; make this boundary
    // conversion once, then share the result between sample and active target.
    function modelSample(i: number): IAutoMovieVector3 {
      return model(hand, {
        x: lofted.sampled.targets[3 * i]! * 1000,
        y: lofted.sampled.targets[3 * i + 1]! * 1000,
        z: lofted.sampled.targets[3 * i + 2]! * 1000,
      });
    }
    return {
      vertices: lofted.positions.map(
        (p: IAutoMovieVector3, i: number): IAutoMovieHumanCage.IVertex => {
          const sample: IAutoMovieVector3 = modelSample(i);
          return {
            position: model(hand, p),
            fitting: {
              sample,
              target: lofted.sampled.limitTargetMask[i] ? { ...sample } : null,
              anchor: lofted.sampled.pinned[i]!,
            },
          };
        },
      ),
      faces: lofted.faces.map(
        (face: loftAutoMovieHumanHand.IFace): IAutoMovieHumanCage.IFace => {
          const order: [number, number, number, number] = keep
            ? [0, 1, 2, 3]
            : [0, 3, 2, 1];
          return {
            fitting: `hand.${props.side}`,
            skin: face.skin,
            uvs: AutoMovieHumanHandChart.pack(
              props.side,
              keep,
              order.map(
                (k: number): AutoMovieHumanHandChart.IPoint => face.atlas[k]!,
              ),
            ) as IAutoMovieHumanCage.IFace["uvs"],
            vertices: order.map(
              (k: number): number => face.vertices[k]!,
            ) as IAutoMovieHumanCage.IFace["vertices"],
            coordinates: order.map(
              (k: number): IAutoMovieHumanSurfaceCoordinate => {
                const c: loftAutoMovieHumanHand.ICorner = face.corners[k]!;
                return {
                  part: "hand",
                  side: props.side,
                  branch: c.branch,
                  u: c.u,
                  v: keep ? c.v : 1 - c.v,
                };
              },
            ) as IAutoMovieHumanCage.IFace["coordinates"],
          };
        },
      ),
      creases: [],
      rings: [
        {
          site: "wrist",
          side: props.side,
          vertices: lofted.wrist,
          start: lofted.ring.start,
          frame: lofted.ring.frame,
        },
      ],
      construction: {
        network: lofted.network,
        origin: hand.origin,
        x: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [
          hand.distal,
          1000,
        ]),
        y: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [
          hand.palmar,
          1000,
        ]),
        z: AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 0), [
          hand.radial,
          1000,
        ]),
      },
    };
  }
  /**
   * Generate the hand's nail plates, separate meshes resting on its skin.
   *
   * @param props Measurements, skeleton, side and actual emitted rest skin
   * @returns One closed cage per digit, thumb first, each riding its distal phalanx
   * @throws {Error} When the emitted skin is missing or a nail ray misses it
   */
  public attachments(
    props: IAutoMovieHumanPartGenerator.IAttachmentProps<"hand">,
  ): IAutoMovieHumanPartGenerator.IAttachment[] {
    const hand: readAutoMovieHumanHand.IHand = readAutoMovieHumanHand(
      props.skeleton,
      props.side,
      shapeAutoMovieHumanRing({ ...props, site: "wrist", part: "hand" }),
    );
    const host: IAutoMovieModelPart | undefined = props.skin.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === "skin" || part.id === `skin.hand.${props.side}`,
    );
    if (host === undefined || host.geometry.type !== "mesh")
      throw new Error("Hand nail placement needs its emitted skin mesh");
    const caster: IAutoMovieMeshRayCaster = props.skinRayCaster(
      host.geometry.mesh,
    );
    const keep: boolean = hand.mirrored;
    const breadth: number = (
      props.side === "left"
        ? props.measurements.identity.body.leftArm
        : props.measurements.identity.body.rightArm
    ).handBreadth;
    return placeAutoMovieHumanNails({
      hand,
      breadth,
      skin: {
        project: (
          origin: IAutoMovieVector3,
          ray: IAutoMovieVector3,
        ): number | null => {
          const start: IAutoMovieVector3 = model(hand, origin);
          const direction: IAutoMovieVector3 = AutoMovieHumanVector.offset(
            AutoMovieHumanVector.of(0, 0, 0),
            [hand.distal, ray.x],
            [hand.palmar, ray.y],
            [hand.radial, ray.z],
          );
          // Reverse the existing 40 mm ray interval: nearest from its far end
          // is the farthest outgoing crossing from the digit axis.
          const maximum: number = 0.04;
          const hit: number | null = caster.nearest(
            [
              start.x / 1000 + maximum * direction.x,
              start.y / 1000 + maximum * direction.y,
              start.z / 1000 + maximum * direction.z,
            ],
            [-direction.x, -direction.y, -direction.z],
            maximum,
          );
          return hit === null || hit === 0 || hit === maximum
            ? null
            : (maximum - hit) * 1000;
        },
      },
    }).map(
      (
        {
          positions,
          quads,
        }: {
          positions: IAutoMovieVector3[];
          quads: Array<[number, number, number, number]>;
        },
        digit: number,
      ): IAutoMovieHumanPartGenerator.IAttachment => {
        const branch: AutoMovieHumanBranch<"hand"> = DIGITS[digit]!;
        const address: IAutoMovieHumanSurfaceCoordinate = {
          part: "hand",
          side: props.side,
          branch,
          u: 1,
          v: 0.5,
        };
        return {
          name: `nail.${branch}`,
          bone: `${props.side}${BONES[digit]!}Distal` as AutoMovieHumanoidBone,
          tissue: "nail",
          cage: {
            vertices: positions.map(
              (p: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
                position: model(hand, p),
              }),
            ),
            // the plates wind outward in the hand frame taken as right-handed, as the skin does
            faces: quads.map(
              ([a, b, c, d]: [
                number,
                number,
                number,
                number,
              ]): IAutoMovieHumanCage.IFace => ({
                vertices: keep ? [a, b, c, d] : [a, d, c, b],
                coordinates: [address, address, address, address],
              }),
            ),
            creases: [],
            rings: [],
          },
        };
      },
    );
  }
}
/** Model point of a hand-frame point. */
const model: (
  hand: readAutoMovieHumanHand.IHand,
  p: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  hand: readAutoMovieHumanHand.IHand,
  p: IAutoMovieVector3,
): IAutoMovieVector3 =>
  AutoMovieHumanVector.offset(
    hand.origin,
    [hand.distal, p.x],
    [hand.palmar, p.y],
    [hand.radial, p.z],
  );
/** The digit each nail plate rests on, in the order `placeAutoMovieHumanNails` returns them. */
const DIGITS: AutoMovieHumanBranch<"hand">[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "little",
];
/** Bone name stems of the digits, in the same order. */
const BONES: string[] = ["Thumb", "Index", "Middle", "Ring", "Little"];

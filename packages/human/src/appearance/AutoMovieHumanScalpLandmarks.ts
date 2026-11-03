import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpAuricle } from "./AutoMovieHumanScalpAuricle";
import { AutoMovieHumanScalpExocanthion } from "./AutoMovieHumanScalpExocanthion";
import { AutoMovieHumanScalpFrame } from "./AutoMovieHumanScalpFrame";
import { AutoMovieHumanScalpMidline } from "./AutoMovieHumanScalpMidline";
import { AutoMovieHumanScalpNasion } from "./AutoMovieHumanScalpNasion";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * The Farkas landmarks scalp hair is placed from, read from what the head
 * publishes: its solved landmarks (`IAutoMovieHumanBodyCalibration.head`),
 * its skin (through the head chart), its eye frames and the public head
 * inputs, never from fixed coordinates; each landmark is its own piece:
 *
 * - vertex (v): the chart's highest head-skin point;
 * - menton (me): the vertex less `head.height` (v-gn), the head's own
 *   definition, which its identity tests hold on the skin;
 * - nasion (n): `AutoMovieHumanScalpNasion`;
 * - lower face (sn-me): `head.faceHeight` less `head.face.nose.height`
 *   (n-sn), the head's inputs;
 * - exocanthion (ex): `AutoMovieHumanScalpExocanthion`;
 * - superaurale (sa): `AutoMovieHumanScalpAuricle`;
 * - the midline: `AutoMovieHumanScalpMidline`, the frame change
 *   `AutoMovieHumanScalpFrame`.
 *
 * Heights are model millimetres; the chart's frame is head-local (see
 * `AutoMovieHumanHeadField`). Every landmark follows a head change, since
 * each is read from the generated head itself or from the inputs it is built
 * to.
 */
export namespace AutoMovieHumanScalpLandmarks {
  /** The landmarks of one generated head. */
  export interface ILandmarks {
    /** Height of the eyes' centres, model millimetres. */
    eyeLevel: number;

    /** Vertex height, model millimetres. */
    vertex: number;

    /** Menton height, model millimetres. */
    menton: number;

    /** Nasion on the front midline skin, head-local millimetres. */
    nasion: AutoMovieHumanSkinVector.Vec3;

    /** Lower face height sn-me, millimetres. */
    lowerFace: number;

    /** Lateral distance of the canonical exocanthion from the midline, mm. */
    exocanthion: number;

    /** Head-local lateral coordinate of the midline, millimetres. */
    midline: number;

    /** Height of the canonical auricle's top, model mm; null without ears. */
    superaurale: number | null;
  }

  /**
   * Measure the landmarks of one head.
   *
   * @param params Public input; `head` is read
   * @param body Generated body: eye frames and parts
   * @param field Head chart of that body
   * @returns The landmarks
   * @throws {Error} When the front midline skin does not reach the nasion's height
   */
  export function measure(
    params: IAutoMovieHumanParameters,
    body: IAutoMovieHumanAppearanceBody,
    field: AutoMovieHumanHeadField.IField,
  ): ILandmarks {
    const head: IAutoMovieHumanParameters["head"] = params.head;
    const menton: number = field.top - head.height;
    const midline: number = AutoMovieHumanScalpMidline.plane(body, field);

    // The head's solved landmarks, in calibration millimetres, scaled with
    // the body into model millimetres and moved into the chart's frame.
    const solved: IAutoMovieHumanBodyCalibration.IHeadLandmarks | undefined =
      body.calibration.head;
    const k: number = AutoMovieHumanScalpFrame.scale(params, body.calibration);
    const nasion: AutoMovieHumanSkinVector.Vec3 | null =
      AutoMovieHumanScalpNasion.nasion(
        solved,
        solved === undefined
          ? null
          : AutoMovieHumanScalpFrame.local(solved.nasion, k, field),
        field,
        menton,
        head.faceHeight,
      );
    if (nasion === null)
      throw new Error(
        "Human scalp landmarks: no front midline skin at the nasion",
      );

    return {
      eyeLevel: field.eyeLevel,
      vertex: field.top,
      menton,
      nasion,
      lowerFace: head.faceHeight - head.face.nose.height,
      exocanthion: AutoMovieHumanScalpExocanthion.distance(
        solved === undefined
          ? null
          : AutoMovieHumanScalpFrame.local(
              solved.exocanthion.left,
              k,
              field,
            )[2],
        midline,
        head,
      ),
      midline,
      superaurale: AutoMovieHumanScalpAuricle.top(body.parts),
    };
  }
}

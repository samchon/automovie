import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanHeadGenerate } from "./AutoMovieHumanHeadGenerate";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadGenerated } from "./IAutoMovieHumanHeadGenerated";

/**
 * The head and ears generated from the neck ring and the public head inputs.
 *
 * Centres first. The vertex is the stature and the menton lies the head height
 * under it. The Farkas landmarks of the midline follow by their definitions
 * and the published relations between them: the nasion the face height from
 * the gnathion, the fissures half their height under it, the subnasale the
 * nasal height under the nasion and ahead of the glabella's vertical, the
 * pronasale the protrusion from it, the stomion a third of the way from the
 * subnasale to the menton, the lips and the chin about the subnasale-pogonion
 * line. Beside the midline the tragion stands the upper facial depth behind the
 * nasion, the zygion on the arch in front of it, the frontotemporale on the
 * forehead and the gonion on the mandibular plane.
 *
 * Curves next. The midline profile runs through the landmarks as the vault's
 * ellipse plus a natural spline of their departures from it. The cranium is a
 * super-ellipsoid of the head's length and breadth whose exponent closes the
 * head circumference; under the brow its front falls back behind the face to
 * the arch. The face is a super-ellipse in each section from the profile at its
 * front to its widest place, as wide as the frontal width at the brow, the face
 * width at the zygion and the mandibular width at the gonion. The two join
 * along each ray by a smooth maximum of absolute width. A third body, the
 * mandible's skin, joins them along each ray by a smooth minimum, wider where
 * the skin under the jaw meets the neck: an arch in plan from the chin to the
 * gonions over the mandibular plane, whose side leans in from the cheek to the
 * angle and whose border turns under into skin falling inward to the neck. Below
 * the nose the planes tilt forward, so that they pass under the chin.
 *
 * Named features are reliefs written as radial heights over that surface, each
 * in its own measures at its landmarks: the orbit's hollow, the nose's dorsum,
 * tip, alae and sill, the philtrum, the lips and the oral fissure between them.
 * The nose stands on a base edge, so it ends on a shelf facing down, and the
 * nostrils lie in that shelf and face as it does. The sockets fall to seat the
 * eyes a fixed depth behind the nasion. The lid margins, globes, nostrils and
 * the lips' colour boundary are placed from the same dimensions, so they stay on
 * the features they belong to. Each measure an input names is then solved on
 * the construction's own skin at its landmark, by a few secant passes.
 *
 * The neck ring's difference from the law, and its slope's, fade in over the
 * jaw, so the bottom ring is the neck's own and leaves it as the neck does; the
 * lower chain's bottom layer is the neck's top layer with its slopes and
 * curvatures. Every chain's layers are spaced by the curvature of its guides
 * along the height, so the nose's base, the lips, the chin and the crown crowd
 * their own layers. Auricles are spliced into the sections of the middle chain by
 * `AutoMovieHumanEarConstruction`, and their free ends are the ear chains. Rings
 * are parametrized by each chain's own phase rule.
 */
export namespace AutoMovieHumanHeadConstruction {
  /** What the head reads, world millimetres. */
  export interface IInputs {
    /** The public head identity. */
    head: IAutoMovieHumanHeadIdentity;

    /** Stature. */
    height: number;

    /** Neck length. */
    neckLength: number;

    /** Neck tape. */
    neck: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Fat control. */
    fat: number;
  }

  /** Head and lip boundary. */
  export interface IOutput {
    /** Calibration with the head, ears, eyes and openings replaced. */
    body: IAutoMovieHumanBodyCalibration;

    /** Lip colour boundary. */
    vermilion: IAutoMovieHumanHermiteCurve;
  }

  /**
   * Calibration whose head and ears are generated from its own neck ring.
   *
   * @param calibration Calibration holding the `head` chain and the head and
   *   ear chains, whose rows are replaced; not modified.
   * @param vermilion Template of the lip boundary, whose name and chain are kept.
   * @param inputs Public inputs.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    vermilion: IAutoMovieHumanHermiteCurve,
    inputs: IInputs,
  ): IOutput {
    const head: IAutoMovieHumanHeadGenerated = AutoMovieHumanHeadGenerate.generate(calibration, inputs);
    const generated: Map<string, IAutoMovieLoftChain> = new Map(
      head.chains.map(
        (c: IAutoMovieLoftChain): [string, IAutoMovieLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    return {
      body: {
        ...calibration,
        stature: head.stature,
        chains: [
          ...calibration.chains
            .filter((c: IAutoMovieLoftChain): boolean => !owns(c.name)),
          ...head.chains,
        ].map(
          (c: IAutoMovieLoftChain): IAutoMovieLoftChain =>
            generated.get(c.name) ?? c,
        ),
        events: [
          ...calibration.events.filter(
            (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
              e.parent !== "head.middle" && !e.parent.startsWith("ear."),
          ),
          ...head.events,
        ],
        poles: [
          ...calibration.poles.filter(
            (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
              !owns(p.chain),
          ),
          ...head.poles,
        ],
        apertures: head.apertures,
        eyes: head.eyes,
        mouth: head.mouth,
        head: head.landmarks,
      },
      vermilion: { ...vermilion, spans: head.lips },
    };
  }

  /**
   * World height of the ring the head stands on, under the head's rise.
   *
   * @param inputs The person's head inputs.
   * @returns Millimetres above the floor.
   */
  export function seat(inputs: IInputs): number {
    const r: AutoMovieHumanHeadPrior.IRatios =
      AutoMovieHumanHeadPrior.PRIOR.ratios;
    return inputs.height - r.neck * inputs.neckLength - inputs.head.height;
  }

  /** Whether a chain belongs to the head above the neck. */
  export function owns(name: string): boolean {
    return /^(head\.|ear\.)/.test(name);
  }
}

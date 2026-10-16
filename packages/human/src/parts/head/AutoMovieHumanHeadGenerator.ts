import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { planAutoMovieHumanNeckCut } from "../../junction/planAutoMovieHumanNeckCut";
import { measureAutoMovieHumanNeckGirth } from "../../junction/measureAutoMovieHumanNeckGirth";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { loftAutoMovieHumanHead } from "./loftAutoMovieHumanHead";

/**
 * Generates the head: the cranial vault and the one continuous face surface, open at the neck top and at both ear attachments.
 *
 * The head is lofted ({@link loftAutoMovieHumanHead}): sections from under the vertex to the neck-top ring through guide curves the landmarks and measurements fix, and the face laid out over them as a network of quads whose concentric loops round the eyes and the mouth are the lines along which expressions fold. Every person gets the same connectivity; only positions follow the measurements.
 *
 * The three existing ratio rounds use the complete physical plane envelope.
 * A cut also meeting an infant mandibular overhang remains an unresolved
 * correspondence; a finite fit is not proof of a simple neck tape site or
 * infrathyroid registration.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  /** The part this generator produces. */
  public readonly part = "head" as const;

  /**
   * Generate the head's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its three rings
   */
  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"head">,
  ): IAutoMovieHumanCage {
    const plan: ReturnType<typeof planAutoMovieHumanNeckCut> = planAutoMovieHumanNeckCut(props.skeleton, shapeAutoMovieHumanRing({skeleton: props.skeleton, measurements: props.measurements, site: "neckBase", part: "neck", side: null}));
    let scale: number = 1;
    let cage: IAutoMovieHumanCage = loftAutoMovieHumanHead(props.measurements, props.skeleton, undefined, scale);
    for (let i: number = 0; plan.fit.owner === "head" && i < GIRTH_FITS; ++i) {
      const measured: number = measureAutoMovieHumanNeckGirth(cage, plan.fit.origin, plan.fit.normal);
      if (!(measured > 0) || !Number.isFinite(measured))
        throw new Error("The owned neck fit plane has no positive finite head section");
      scale *= props.measurements.identity.body.neckCircumference / measured;
      cage = loftAutoMovieHumanHead(props.measurements, props.skeleton, undefined, scale);
    }
    return cage;
  }
}

/** Existing neck-section ratio iterations, applied only by the physical owner. */
const GIRTH_FITS: number = 3;

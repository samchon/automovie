import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { loftAutoMovieHumanNeck } from "./loftAutoMovieHumanNeck";
import { measureAutoMovieHumanNeckGirth } from "./measureAutoMovieHumanNeckGirth";
import { sectionAutoMovieHumanNeck } from "./sectionAutoMovieHumanNeck";

/** Rounds of widening the mid section to the measured girth; each leaves under a tenth of the previous error. */
const GIRTH_FITS: number = 3;

/**
 * Generates the neck: a lofted tube from the neck base ring on the trunk to the neck top ring under the jaw and the skull.
 *
 * The loft ({@link loftAutoMovieHumanNeck}) runs through the base ring, the mid section perpendicular to the neck bone where the neck circumference is measured, the throat just under the jaw and the top ring in the mandibular plane. The mid section is widened until the subdivided neck measures the identity's neck circumference there, so the neck's thickness is the measured one, not the rings'.
 *
 * The chart runs `u` from 0 at the base to 1 at the top and `v` counterclockwise about the neck seen from above, from the anterior midline. Rings, in order: `neckBase`, `neckTop`.
 *
 * @author Samchon
 */
export class AutoMovieHumanNeckGenerator implements IAutoMovieHumanPartGenerator<"neck"> {
  /** The part this generator produces. */
  public readonly part = "neck" as const;

  /**
   * Generate the neck's cage for one person.
   *
   * @param props Measurements and skeleton; the side is null
   * @returns The cage with its two rings
   */
  public generate(props: IAutoMovieHumanPartGenerator.IProps<"neck">): IAutoMovieHumanCage {
    const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
    const shape = (site: "neckBase" | "neckTop"): IAutoMovieHumanRingShape =>
      shapeAutoMovieHumanRing({
        skeleton: props.skeleton,
        measurements: props.measurements,
        site,
        side: null,
        part: "neck",
      });
    const base: IAutoMovieHumanRingShape = shape("neckBase");
    const top: IAutoMovieHumanRingShape = shape("neckTop");
    const sections: sectionAutoMovieHumanNeck.IOutput = sectionAutoMovieHumanNeck({
      skeleton: props.skeleton,
      body,
      base,
      top,
    });
    const mean: number = body.neckCircumference / (2 * Math.PI);
    // the limit surface lies inside its cage, so the mid section is widened until the subdivided neck has the measured girth
    let scale: number = 1;
    let cage: IAutoMovieHumanCage = loftAutoMovieHumanNeck({ sections, base, top, scale, mean });
    for (let i: number = 0; i < GIRTH_FITS; ++i) {
      scale *= body.neckCircumference / measureAutoMovieHumanNeckGirth(cage, sections.centre, sections.axis);
      cage = loftAutoMovieHumanNeck({ sections, base, top, scale, mean });
    }
    return cage;
  }
}

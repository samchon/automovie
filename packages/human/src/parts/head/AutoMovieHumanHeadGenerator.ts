import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanEyeHairHost } from "../../junction/IAutoMovieHumanEyeHairHost";
import { boundAutoMovieHumanEye } from "../../junction/boundAutoMovieHumanEye";
import { frameAutoMovieHumanHead } from "../../junction/frameAutoMovieHumanHead";
import { planAutoMovieHumanEye } from "../../junction/planAutoMovieHumanEye";
import { IAutoMovieHumanPartGenerator } from "../../parts/IAutoMovieHumanPartGenerator";
import { AUTOMOVIE_HUMAN_HEAD_FORM } from "./AUTOMOVIE_HUMAN_HEAD_FORM";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { curveAutoMovieHumanOrbit } from "./curveAutoMovieHumanOrbit";
import { loftAutoMovieHumanHead } from "./loftAutoMovieHumanHead";

/**
 * Generates the head: the cranial vault and the one continuous face surface, open at the neck top and at both ear attachments.
 *
 * The head is lofted ({@link loftAutoMovieHumanHead}): sections from under the vertex to the neck-top ring through guide curves the landmarks and measurements fix, and the face laid out over them as a network of quads whose concentric loops round the eyes and the mouth are the lines along which expressions fold. Every person gets the same connectivity; only positions follow the measurements.
 *
 * The chart runs `u` from the bottom of the head's canonical sphere to the vertex and `v` counterclockwise about the vertical from the anterior midline. Rings, in order: `neckTop`, `ear` left, `ear` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadGenerator implements IAutoMovieHumanPartGenerator<"head"> {
  private readonly form_: IAutoMovieHumanHeadForm = AUTOMOVIE_HUMAN_HEAD_FORM;
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
    return loftAutoMovieHumanHead(
      props.measurements,
      props.skeleton,
      this.form_,
    );
  }

  /**
   * Supply this head's actual anterior eye course to the appearance composition.
   *
   * Both cage and host consume this same form and orbital operator. A custom
   * head using another form must supply its corresponding host, not inherit
   * an unrelated attachment definition. The inputs are borrowed, not mutated.
   *
   * @param props The same person inputs as generate; side is null
   * @returns Local lid operator, physical dimensions, frame and person ownership
   */
  public eyeHairHost(
    props: IAutoMovieHumanPartGenerator.IProps<"head">,
  ): IAutoMovieHumanEyeHairHost {
    const frame: frameAutoMovieHumanHead.IFrame = frameAutoMovieHumanHead(
      props.skeleton,
    );
    const form: IAutoMovieHumanHeadForm.IEyelids = this.form_.eyelids;
    const features: typeof props.measurements.identity.head.features =
      props.measurements.identity.head.features;
    const radius: number = boundAutoMovieHumanEye(
      planAutoMovieHumanEye({
        measurements: props.measurements,
        skeleton: props.skeleton,
        side: "left",
      }),
    );
    const course: ReturnType<typeof curveAutoMovieHumanOrbit> =
      curveAutoMovieHumanOrbit({ frame, features, form, eyeRadius: radius });
    return {
      context: { measurements: props.measurements, skeleton: props.skeleton },
      frame,
      eyeDepthMm: frame.eye.z,
      lengthMm: features.palpebralFissureLength,
      heightMm: features.palpebralFissureHeight,
      marginThicknessMm: form.marginThickness,
      lidLocal: (s: number, upper: boolean): IAutoMovieVector3 =>
        course.lid(s, upper, 1, 0, form.marginThickness),
    };
  }
}

import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";
import type { IAutoMovieHumanBodyCoccyxMeasurements } from "./IAutoMovieHumanBodyCoccyxMeasurements";
import type { IAutoMovieHumanBodyCoxalBoneMeasurements } from "./IAutoMovieHumanBodyCoxalBoneMeasurements";
import type { IAutoMovieHumanBodyHipMeasurements } from "./IAutoMovieHumanBodyHipMeasurements";
import type { IAutoMovieHumanBodySacrotuberousLigamentMeasurements } from "./IAutoMovieHumanBodySacrotuberousLigamentMeasurements";
import type { IAutoMovieHumanBodySacrumMeasurements } from "./IAutoMovieHumanBodySacrumMeasurements";

/**
 * Target or observed pelvic-girdle dimensions, with one shared sacrum.
 *
 * The sacrum and two coxal bones form the bony group; each pelvic hip region
 * owns gluteal muscles. Its femur belongs to the same-side lower limb. A
 * gluteal origin can refer across this ownership tree to sacrum or coxal
 * bone, and an insertion to femur or fascia. The groups
 * express component identity rather than an instruction to duplicate their
 * geometry. The bilateral femoral-head distance is an internal dimension,
 * not a tape hip girth or the distance between skin landmarks.
 * Optional values remain absent if no target or imaging exists;
 * the generated model must declare whether it has a supported population
 * estimate or cannot resolve that part.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyPelvisMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /**
     * Bony left-to-right ASIS distance, not the width of skin markers.
     * Harrington et al., J Biomech 40 (2007), doi:10.1016/j.jbiomech.2006.02.003,
     * use pelvic width to estimate the hip joint centre from MRI landmarks.
     * A target is an anatomical dimension; an observation requires CT/MRI.
     */
    interAnteriorSuperiorIliacSpineDistance?: IAutoMovieHumanBodyTomographicLength;

    /**
     * Anterior-to-posterior distance between mid-ASIS and mid-PSIS landmarks.
     * This is bony pelvic depth in the same pelvic frame, not abdominal depth
     * or a skin-marker separation. Harrington et al. 2007 use it for the
     * anteroposterior hip-centre estimate; the regression still has population
     * error and does not locate an individual's articular surface exactly.
     */
    anteriorPosteriorIliacSpineMidpointDepth?: IAutoMovieHumanBodyTomographicLength;

    /** Three-dimensional centre-to-centre distance of both fitted heads. */
    interFemoralHeadDistance?: IAutoMovieHumanBodyTomographicLength;

    /** The one midline sacrum shared by both pelvic sides. */
    sacrum?: IAutoMovieHumanBodySacrumMeasurements;

    /** One midline coccyx inferior to sacrum. */
    coccyx?: IAutoMovieHumanBodyCoccyxMeasurements;

    /** Left os coxae: ilium, ischium and pubis. */
    leftCoxalBone?: IAutoMovieHumanBodyCoxalBoneMeasurements;

    /** Right os coxae, independent of the left. */
    rightCoxalBone?: IAutoMovieHumanBodyCoxalBoneMeasurements;

    /** Left sacrum-to-ischium fibrous origin of gluteus maximus. */
    leftSacrotuberousLigament?: IAutoMovieHumanBodySacrotuberousLigamentMeasurements;

    /** Independent right sacrotuberous ligament. */
    rightSacrotuberousLigament?: IAutoMovieHumanBodySacrotuberousLigamentMeasurements;

    /** Left hip region: the gluteal muscles and the iliopsoas of that side. */
    leftHip?: IAutoMovieHumanBodyHipMeasurements;

    /** Right hip region, independent of the left. */
    rightHip?: IAutoMovieHumanBodyHipMeasurements;
  }>;

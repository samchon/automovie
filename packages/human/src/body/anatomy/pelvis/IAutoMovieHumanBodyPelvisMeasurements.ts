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
 * @evidence contracts/common.md#principled-implementation `AutoMovieHumanBodyNonemptyMeasurements` over a closed set of named optional quantities makes at least one of them mandatory, so `{}` cannot claim the part was specified and an absent quantity is never read as zero. Each member is its own record, so the pelvic girdle composes the sacrum, the coccyx, two coxal bones, two sacrotuberous ligaments, two hip regions and three bony distances without copying any of their quantities.
 * @evidence contracts/common.md#clear-and-simple-design One nonempty record of named optional members and nothing else: no option, layer or derived value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that one sacrum is shared, that gluteal origins refer across the ownership tree, that the femoral-head distance is internal and not a tape girth, and that absent values stay absent; each property has a comment stating its landmarks.
 * @evidence contracts/modeling.md#part-identity-and-grouping A group: it composes the sacrum, the coccyx, two coxal bones, two sacrotuberous ligaments, two hip regions and three bony distances for the pelvic girdle, each declared once in its own file. The group owns the composition and copies no member's shape or values, so a change to one member reaches its neighbours only through their named relations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names measurement slots, not shape channels: each value is an absolute anatomical quantity with no neutral zero, and the body basis owns the channels that vary a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The three bony distances are millimetres through `IAutoMovieHumanBodyTomographicLength`, with the ASIS, PSIS and femoral-head landmark definitions stated on their properties. The composed bones, ligaments and hip regions keep the units of their own measurement records; this group performs no conversion and introduces no second coordinate frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume, so it has no boundary to share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is an internal anatomical measurement that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits or bounds nothing: `admitHumanBodyAnatomicalMeasurements` rejects non-finite, non-positive and out-of-interval values, and population ranges belong to the component resolver.
 * @evidence contracts/anatomy.md#parametric-authority The members are named parts and every quantity below them is a named measurement, target or observation; `admitHumanBodyAnatomicalMeasurements` asserts a closed schema, so no member can address a vertex, curve or surface patch.
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

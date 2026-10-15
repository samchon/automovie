import { tags } from "typia";

import { AutoMovieHumanIrisColor } from "./AutoMovieHumanIrisColor";

/**
 * Who a person is, as detailed parameters: named anthropometric and craniofacial measurements, joint mobility, body composition and pigmentation.
 *
 * Modeling reads this document and nothing else about the person. It holds no sex, age, ancestry or vague trait such as slimness: those are beginner inputs ({@link IAutoMovieHumanTraits}) that a converter expands into these measurements, so any ancestry, age or look is reachable by measurements alone and every assumption a converter makes is visible in its output. A saved person stores this resolved document, so a later converter revision never changes a saved person.
 *
 * Lengths are millimetres, the unit every survey Human draws on publishes, measured on the living body in the standard anthropometric posture: standing erect, heels together, arms hanging with palms toward the thighs, head in the Frankfurt plane. Landmark names follow the 2012 US Army Anthropometric Survey (ANSUR II, Gordon et al. 2014, NATICK/TR-15/007) for the body and the Farkas nomenclature used by the 3D Facial Norms database (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197) for the head. Each limb carries explicit left and right values, so bilateral symmetry is a choice of equal values rather than a rule of the generator.
 *
 * Static bounds in the tags are envelopes wider than any surveyed person, from a newborn to the tallest adults; they refuse unit mistakes and typos, not unusual people. Bounds that depend on other measurements, such as a hand broader than it is long or a head circumference no head of the given length and breadth can have, are checked at admission and refused with their cause. Admission never changes the caller's values.
 *
 * Groups grow as the generators that read them land; a new measurement joins the group of the region it measures.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanIdentity {
  /** Document version. Saved documents of another version are not migrated. */
  version: 1;

  /** Trunk, limbs and body landmarks. */
  body: IAutoMovieHumanIdentity.IBody;

  /** Cranial vault and face frame. */
  head: IAutoMovieHumanIdentity.IHead;

  /** Fat and lean mass, which decide surface relief and where volume sits. */
  composition: IAutoMovieHumanIdentity.IComposition;

  /** Skin and iris pigmentation. */
  pigmentation: IAutoMovieHumanIdentity.IPigmentation;
}
export namespace IAutoMovieHumanIdentity {
  /**
   * Body heights, breadths and circumferences, with one record per limb.
   *
   * Heights are measured from the standing surface. Segment proportions are parameters of their own rather than functions of stature: in ANSUR II, joint-centre heights regressed on stature leave residual standard deviations of 13 to 26 mm, so two people of equal stature differ that much in each segment.
   *
   * @author Samchon
   */
  export interface IBody {
    /** Stature: vertex of the head to the standing surface, millimetres. */
    stature: number & tags.Minimum<400> & tags.Maximum<2500>;

    /**
     * Sitting height: vertex to the sitting surface, sitting erect, millimetres. Together with stature it fixes the trunk-to-leg proportion; its ratio to stature is checked at admission.
     */
    sittingHeight: number & tags.Minimum<200> & tags.Maximum<1400>;

    /**
     * Cervicale height: the most prominent spinous process of the seventh cervical vertebra to the standing surface, millimetres. It places the root of the neck.
     */
    cervicaleHeight: number & tags.Minimum<250> & tags.Maximum<2200>;

    /**
     * Suprasternale height: the jugular notch, the midline notch at the top of the sternum between the clavicles, to the standing surface, millimetres. It places the sternoclavicular joints where the clavicles start, so with acromial height it sets how the clavicles slope.
     */
    suprasternaleHeight: number & tags.Minimum<200> & tags.Maximum<2150>;

    /**
     * Acromial height: the right acromion, the point of the shoulder, to the standing surface, millimetres. It places the shoulder joints.
     */
    acromialHeight: number & tags.Minimum<200> & tags.Maximum<2150>;

    /**
     * Biacromial breadth: between the two acromia, a bony breadth, millimetres. Shoulder breadth carries most of the sex difference in the shoulder-to-hip ratio.
     */
    biacromialBreadth: number & tags.Minimum<80> & tags.Maximum<600>;

    /**
     * Bicristal breadth: between the highest points of the two iliac crests with tissue firmly compressed, the bony pelvis, millimetres.
     */
    bicristalBreadth: number & tags.Minimum<50> & tags.Maximum<500>;

    /**
     * Hip breadth: between the most lateral points of the buttocks standing, including soft tissue, millimetres.
     */
    hipBreadth: number & tags.Minimum<80> & tags.Maximum<800>;

    /**
     * Neck circumference: just below the thyroid cartilage, perpendicular to the neck axis, millimetres.
     */
    neckCircumference: number & tags.Minimum<100> & tags.Maximum<700>;

    /**
     * Chest circumference at the most anterior point of the chest, the bust in women, at the maximum of quiet respiration, millimetres.
     */
    chestCircumference: number & tags.Minimum<180> & tags.Maximum<2000>;

    /**
     * Waist circumference at the natural waist, the narrowest level between the ribs and the iliac crests, millimetres. This is the waist of attractiveness studies; ANSUR II measures its waist at the navel instead, which is not comparable.
     */
    waistCircumference: number & tags.Minimum<180> & tags.Maximum<2200>;

    /**
     * Buttock circumference at the maximum posterior protrusion of the buttocks, standing, millimetres.
     */
    buttockCircumference: number & tags.Minimum<200> & tags.Maximum<2200>;

    /** The left arm, from the shoulder to the fingertips. */
    leftArm: IArm;

    /** The right arm, from the shoulder to the fingertips. */
    rightArm: IArm;

    /** The left leg, from the hip to the toes. */
    leftLeg: ILeg;

    /** The right leg, from the hip to the toes. */
    rightLeg: ILeg;
  }

  /**
   * One arm, measured hanging at the side.
   *
   * @author Samchon
   */
  export interface IArm {
    /**
     * Acromion-radiale length: the acromion to the upper palpable edge of the radial head, millimetres. It is markedly shorter with the arm abducted, because the acromion moves toward the radiale, so it is taken hanging.
     */
    upperArmLength: number & tags.Minimum<50> & tags.Maximum<600>;

    /**
     * Radiale-stylion length: the radial head to the tip of the radial styloid process, millimetres.
     */
    forearmLength: number & tags.Minimum<40> & tags.Maximum<500>;

    /**
     * Hand length: the wrist crease at stylion to the tip of the middle finger, millimetres.
     */
    handLength: number & tags.Minimum<40> & tags.Maximum<300>;

    /**
     * Hand breadth across the heads of the second to fifth metacarpals, millimetres.
     */
    handBreadth: number & tags.Minimum<20> & tags.Maximum<160>;

    /**
     * Relaxed upper arm circumference midway between acromion and olecranon, arm hanging, millimetres.
     */
    upperArmCircumference: number & tags.Minimum<80> & tags.Maximum<800>;

    /** Relaxed maximum forearm circumference, below the elbow, millimetres. */
    forearmCircumference: number & tags.Minimum<70> & tags.Maximum<600>;

    /** Wrist circumference over the radial styloid, millimetres. */
    wristCircumference: number & tags.Minimum<50> & tags.Maximum<300>;

    /**
     * Shoulder flexion, the arm raised forward from hanging, degrees. Goniometric, as in the CDC normal joint range of motion study (Soucie et al. 2011, Haemophilia 17(3)): means of 164 to 179 degrees by age and sex.
     */
    shoulderFlexion: number & tags.Minimum<0> & tags.Maximum<200>;

    /** Elbow flexion from full extension, degrees; 143 to 153 in the same study. */
    elbowFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

    /**
     * Elbow extension beyond straight, degrees; negative when the elbow does not straighten fully. Means run from -0.7 (men 45 to 69) to 6.8 (girls 2 to 8) in the same study.
     */
    elbowHyperextension: number & tags.Minimum<-30> & tags.Maximum<30>;

    /** Forearm pronation from the thumb-up neutral, degrees. */
    forearmPronation: number & tags.Minimum<0> & tags.Maximum<120>;

    /** Forearm supination from the thumb-up neutral, degrees. */
    forearmSupination: number & tags.Minimum<0> & tags.Maximum<140>;
  }

  /**
   * One leg, measured standing.
   *
   * The three lengths stack: their sum is the trochanterion height of that leg, the top of the greater trochanter above the standing surface, which lies within a few millimetres of the hip joint centre height.
   *
   * @author Samchon
   */
  export interface ILeg {
    /**
     * Thigh length: trochanterion height minus tibiale height, the top of the greater trochanter to the upper edge of the medial tibial condyle, millimetres.
     */
    thighLength: number & tags.Minimum<60> & tags.Maximum<800>;

    /**
     * Shank length: tibiale height minus lateral malleolus height, millimetres.
     */
    shankLength: number & tags.Minimum<60> & tags.Maximum<700>;

    /**
     * Lateral malleolus height: the lowest point of the lateral malleolus to the standing surface, millimetres.
     */
    ankleHeight: number & tags.Minimum<15> & tags.Maximum<150>;

    /** Foot length: the back of the heel to the tip of the longest toe, millimetres. */
    footLength: number & tags.Minimum<50> & tags.Maximum<400>;

    /**
     * Foot breadth: the maximum breadth across the metatarsal heads, millimetres.
     */
    footBreadth: number & tags.Minimum<20> & tags.Maximum<180>;

    /**
     * Thigh circumference at the gluteal furrow, perpendicular to the thigh axis, millimetres.
     */
    thighCircumference: number & tags.Minimum<120> & tags.Maximum<1300>;

    /** Maximum horizontal calf circumference, millimetres. */
    calfCircumference: number & tags.Minimum<90> & tags.Maximum<800>;

    /** Minimum horizontal ankle circumference above the malleoli, millimetres. */
    ankleCircumference: number & tags.Minimum<60> & tags.Maximum<450>;

    /**
     * Hip flexion, the thigh raised forward, degrees. Goniometric, as in the CDC normal joint range of motion study (Soucie et al. 2011, Haemophilia 17(3)): means of 127 to 141 degrees by age and sex.
     */
    hipFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

    /** Hip extension, the thigh carried backward, degrees; 13.5 to 28.3 in the same study. */
    hipExtension: number & tags.Minimum<0> & tags.Maximum<90>;

    /**
     * Knee flexion from full extension, degrees, before the thigh and calf meet; the skeleton lowers it further when the person's own calf girth closes the joint earlier.
     */
    kneeFlexion: number & tags.Minimum<0> & tags.Maximum<180>;

    /** Knee extension beyond straight, degrees; negative when the knee does not straighten fully. */
    kneeHyperextension: number & tags.Minimum<-30> & tags.Maximum<30>;

    /** Ankle dorsiflexion, the foot raised, degrees. */
    ankleDorsiflexion: number & tags.Minimum<0> & tags.Maximum<60>;

    /** Ankle plantar flexion, the foot pointed, degrees. */
    anklePlantarFlexion: number & tags.Minimum<0> & tags.Maximum<100>;
  }

  /**
   * The cranial vault and the frame of the face.
   *
   * Vault shape is a parameter of its own, the cephalic index, because it is not implied by sex or face size: means derived from published lengths and breadths differ by population (about 77 in US adults of European ancestry, Weinberg et al. 2016; about 85 in Chinese workers, Du et al. 2008, Ann Occup Hyg 52(8):773-782) and Chinese children measured on CT range from 73.5 to 105.7 (Liang et al. 2024, BMC Pediatr 24:685). Head breadth follows from length and index, so the document cannot state a breadth that contradicts them.
   *
   * @author Samchon
   */
  export interface IHead {
    /**
     * Head length: glabella to opisthocranion, the longest midline length of the vault, millimetres.
     */
    headLength: number & tags.Minimum<80> & tags.Maximum<260>;

    /**
     * Cephalic index: maximum head breadth (eurion to eurion) over head length, times 100, dimensionless.
     */
    cephalicIndex: number & tags.Minimum<60> & tags.Maximum<110>;

    /**
     * Head circumference: maximum circumference just above the brow ridges and around the back of the vault, millimetres. Admission checks it against the length and breadth it must enclose.
     */
    headCircumference: number & tags.Minimum<300> & tags.Maximum<700>;

    /**
     * Head height: vertex to menton, the lowest point of the chin, head in the Frankfurt plane, millimetres. Stature over head height is about 5.3 at age 2 and 8.0 in late adolescence (Snyder et al. 1977, UM-HSRI-77-17).
     */
    headHeight: number & tags.Minimum<80> & tags.Maximum<320>;

    /**
     * Morphological face height: nasion to gnathion, millimetres.
     */
    faceHeight: number & tags.Minimum<40> & tags.Maximum<180>;

    /**
     * Face width: zygion to zygion, between the most lateral points of the zygomatic arches, millimetres.
     */
    faceWidth: number & tags.Minimum<50> & tags.Maximum<200>;

    /**
     * Mandibular width: gonion to gonion, between the angles of the mandible, millimetres.
     */
    mandibularWidth: number & tags.Minimum<40> & tags.Maximum<180>;

    /**
     * Minimum frontal width: frontotemporale to frontotemporale, the narrowest forehead between the temporal crests, millimetres.
     */
    minimumFrontalWidth: number & tags.Minimum<50> & tags.Maximum<160>;

    /**
     * Active maximum mouth opening between the upper and lower incisal edges, millimetres, as measured with a ruler in children by Verkouteren et al. (2022, Eur J Oral Sci 130(3):e12869): 42.8 to 55.3 mm from 6 to 18 years. The skeleton turns it into the jaw's opening angle through the person's own jaw geometry.
     */
    mouthOpening: number & tags.Minimum<5> & tags.Maximum<90>;

    /**
     * Lateral excursion of the lower incisors to one side, millimetres, from the dental midline; 9.1 to 10.4 mm in the same study.
     */
    mandibularLaterotrusion: number & tags.Minimum<0> & tags.Maximum<25>;
  }

  /**
   * Fat and lean mass as two quantities.
   *
   * Body mass index mixes fat and lean, so a muscular person and a fat person of equal index must not be built alike; fat decides where volume sits and how soft the surface reads, lean mass decides muscle relief. Both are dual-energy X-ray absorptiometry quantities, as in the NHANES reference values (Kelly et al. 2009, PLoS ONE 4(9):e7038).
   *
   * @author Samchon
   */
  export interface IComposition {
    /** Whole-body fat mass over body mass, percent. */
    bodyFatPercentage: number & tags.Minimum<2> & tags.Maximum<75>;

    /**
     * Appendicular lean mass index: lean mass of the arms and legs over stature squared, kilograms per square metre. NHANES means are 6.81 for women and 8.87 for men at age 20 (Kelly et al. 2009).
     */
    appendicularLeanMassIndex: number & tags.Minimum<2> & tags.Maximum<16>;
  }

  /**
   * Constitutive skin pigmentation and iris colour.
   *
   * Skin colour is the layered absorption of melanin in the epidermis and haemoglobin in the dermis, parameterised as volume fractions after the spectral skin model of Donner and Jensen (2006, Eurographics Symposium on Rendering, pp. 409-417). Regional variation such as lips, palms and soles is the skin material's work, not a parameter.
   *
   * @author Samchon
   */
  export interface IPigmentation {
    /**
     * Epidermal melanin volume fraction, dimensionless. Measured melanosome fractions are 0.013 to 0.063 in lightly, 0.11 to 0.16 in moderately and 0.18 to 0.43 in darkly pigmented adults (Jacques 1998, "Skin Optics", Oregon Medical Laser Center News).
     */
    melanin: number & tags.Minimum<0> & tags.Maximum<0.5>;

    /**
     * Share of eumelanin in the epidermal melanin, the rest being pheomelanin, dimensionless. Donner and Jensen illustrate 0.7.
     */
    eumelaninShare: number & tags.Minimum<0> & tags.Maximum<1>;

    /**
     * Dermal haemoglobin volume fraction, dimensionless; the model range of Donner and Jensen is about 0.001 to 0.1 and site maxima reach about 0.3.
     */
    haemoglobin: number & tags.Minimum<0.001> & tags.Maximum<0.32>;

    /** Iris colour, the same for both eyes. */
    iris: AutoMovieHumanIrisColor;
  }
}

import { tags } from "typia";

import { AutoMovieHumanIrisColor } from "./AutoMovieHumanIrisColor";
import { IAutoMovieHumanSubcutaneousFat } from "./IAutoMovieHumanSubcutaneousFat";

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
     * Bideltoid breadth: the maximum horizontal breadth across the deltoid muscles, arms hanging, seated, a soft-tissue breadth, millimetres, as ANSUR II measures it. It is the shoulder width the outline shows, and with the natural waist it carries the male V-taper: bideltoid over hip breadth is 1.28 in ANSUR II women and 1.48 in men. Admission keeps it wider than the biacromial breadth beneath it.
     */
    bideltoidBreadth: number & tags.Minimum<90> & tags.Maximum<900>;

    /**
     * Span: the horizontal distance between the tips of the middle fingers with both arms outstretched sideways at shoulder level, millimetres, as ANSUR II measures it. It sets how far the T-pose arms reach: an abducted arm reaches less far from the trunk than it hangs, because the acromion comes closer to the radiale, so span is shorter than shoulder breadth plus both hanging arms.
     */
    span: number & tags.Minimum<300> & tags.Maximum<2800>;

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
     * Thyroid angle: the internal angle between the two laminae of the thyroid cartilage at the level of the vocal folds, degrees. The narrower the angle, the further the laryngeal prominence, the Adam's apple, projects in front of the neck. On computed tomography of 283 people aged 8 to 20 the female mean stayed between 91 and 97 degrees at every age while the male mean fell from 92 to 67, most steeply at 14 to 15 years (Glikson et al. 2017, Laryngoscope 127(10):E354-E358); adult cadaver larynges measure 74.4 in men and 92.4 in women (Rawal et al. 2014, Natl J Integr Res Med 5(3)).
     */
    thyroidAngle: number & tags.Minimum<40> & tags.Maximum<140>;

    /**
     * Chest circumference at the most anterior point of the chest, the bust in women, at the maximum of quiet respiration, millimetres.
     */
    chestCircumference: number & tags.Minimum<180> & tags.Maximum<2000>;

    /**
     * Chest breadth at the level of the chest circumference, across the rib cage under the arms with tissue compressed, at maximum inspiration, millimetres, as ANSUR II measures it.
     */
    chestBreadth: number & tags.Minimum<40> & tags.Maximum<700>;

    /**
     * Chest depth at the level of the chest circumference, from the most anterior point of the chest, the bust in women, to the back, millimetres. With breadth and circumference it fixes how round or square the section is.
     */
    chestDepth: number & tags.Minimum<30> & tags.Maximum<700>;

    /**
     * Underbust circumference, horizontal just below the breasts at the inframammary fold, millimetres. Its difference from the chest circumference is the girth the breasts add; equal values mean no breast volume.
     */
    underbustCircumference: number & tags.Minimum<150> & tags.Maximum<2000>;

    /**
     * Waist circumference at the natural waist, millimetres: horizontal, at the level of the torso's greatest lateral indentation, or midway between the tenth rib and iliocristale where no single indentation is clear, at quiet respiration, as the 1988 US Army survey measures it (Gordon et al. 1989, NATICK/TR-89/044). This is the narrowest waist of attractiveness studies and the waist of the waist-to-hip ratio; ANSUR II measures its waist at the navel instead, about 70 mm lower and 20 to 70 mm larger on average, which is not comparable.
     */
    waistCircumference: number & tags.Minimum<180> & tags.Maximum<2200>;

    /**
     * Natural waist height: the level of the waist circumference above the standing surface, millimetres. In the 1988 Army survey it averaged 1056 mm in women and 1127 mm in men, at or just above the tenth rib (1044 and 1121 mm) rather than midway down to the iliac crest (989 and 1073 mm), and 74 and 68 mm above the navel. The waist breadth and depth are taken at this level. Admission keeps it between the greater trochanter and the jugular notch.
     */
    waistHeight: number & tags.Minimum<150> & tags.Maximum<1600>;

    /** Waist breadth at the natural waist, millimetres. */
    waistBreadth: number & tags.Minimum<40> & tags.Maximum<800>;

    /** Waist depth at the natural waist, from the abdomen to the back, millimetres. */
    waistDepth: number & tags.Minimum<30> & tags.Maximum<800>;

    /**
     * Buttock circumference at the maximum posterior protrusion of the buttocks, standing, millimetres.
     */
    buttockCircumference: number & tags.Minimum<200> & tags.Maximum<2200>;

    /**
     * Buttock depth at the level of the buttock circumference, from the abdomen to the maximum posterior protrusion of the buttocks, standing, millimetres. With hip breadth and the circumference it fixes the section's shape.
     */
    buttockDepth: number & tags.Minimum<30> & tags.Maximum<800>;

    /** How the spine, pelvis and head stand in the side view. */
    posture: IPosture;

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
   * The standing sagittal posture: the radiographic angles and distances that shape the spine's curves in the side view, and the head's carriage.
   *
   * Every value is taken standing at ease with hips and knees extended, as the clinical surveys measure it. The skeleton curves the spine through them and solves lumbar lordosis as the curve that stands the neck at the sagittal vertical axis, so lordosis is a consequence rather than a parameter. Pelvic incidence, a fixed shape of the pelvis, is the sum of pelvic tilt and sacral slope.
   *
   * @author Samchon
   */
  export interface IPosture {
    /**
     * Pelvic tilt: the angle from the vertical of the line from the axis of the femoral heads to the midpoint of the sacral plate, degrees, positive when the sacral plate lies behind the hips. It rises with age as the pelvis tilts back, about 12 to 15 degrees under 50 and 20 to 25 at 80 (Asai et al. 2017, PLoS ONE 12(6):e0178697).
     */
    pelvicTilt: number & tags.Minimum<-30> & tags.Maximum<60>;

    /**
     * Sacral slope: the angle of the sacral plate, the top of the first sacral vertebra, from the horizontal, degrees, its front edge lower. The lumbar spine leaves the sacrum perpendicular to the plate, leaning forward by this angle.
     */
    sacralSlope: number & tags.Minimum<0> & tags.Maximum<80>;

    /**
     * Thoracic kyphosis: the Cobb angle of the thoracic curve from the second to the twelfth thoracic vertebra, degrees, positive for the normal backward convexity. About 33 under 50 and 40 to 44 at 80 (Asai et al. 2017).
     */
    thoracicKyphosis: number & tags.Minimum<-20> & tags.Maximum<100>;

    /**
     * Sagittal vertical axis: the horizontal distance from the plumb line through the centre of the seventh cervical vertebral body to the posterior superior corner of the sacral plate, millimetres, positive in front. Under 50 the neck stands 10 to 20 mm behind the sacrum; at 80 and over 40 to 50 mm in front (Asai et al. 2017).
     */
    sagittalVerticalAxis: number & tags.Minimum<-200> & tags.Maximum<400>;

    /**
     * Craniovertebral angle: the angle above the horizontal of the line from the seventh cervical spinous process to the tragus, degrees; smaller is a head carried further forward. About 48 to 50 in adults, falling 1.6 degrees a decade (Zárate-Tejero et al. 2024, Appl Sci 14:8639).
     */
    craniovertebralAngle: number & tags.Minimum<10> & tags.Maximum<90>;
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
     * Palm length: stylion to the palmar crease at the base of the middle finger, millimetres, as ANSUR II measures it. Hand length less palm length is the middle finger from its crease, which grows faster than the palm through childhood (0.42 of hand length at 2 to 4 years against 0.44 at 16 to 18; Snyder et al. 1977, UM-HSRI-77-17), so it places the knuckles.
     */
    palmLength: number & tags.Minimum<20> & tags.Maximum<200>;

    /**
     * Thumb length: the crease at the base of the thumb, over its metacarpophalangeal joint, to the tip, millimetres, as the 1977 US child survey measures it.
     */
    thumbLength: number & tags.Minimum<10> & tags.Maximum<150>;

    /**
     * Relaxed upper arm circumference midway between acromion and olecranon, arm hanging, millimetres.
     */
    upperArmCircumference: number & tags.Minimum<80> & tags.Maximum<800>;

    /** Relaxed maximum forearm circumference, below the elbow, millimetres. */
    forearmCircumference: number & tags.Minimum<70> & tags.Maximum<600>;

    /** Wrist circumference over the radial styloid, millimetres. */
    wristCircumference: number & tags.Minimum<50> & tags.Maximum<300>;

    /**
     * Carrying angle: the angle in the frontal plane between the long axes of the arm and the forearm with the elbow fully extended and the forearm supinated, degrees, positive for valgus, the forearm turned away from the body. Slightly varus at birth (-1.5), 6 degrees at 2 to 6 years and 11 from 15 on, in 921 Thai children measured with a goniometer, and larger in girls (8.5 against 6.9 over all ages; Kaewpornsawan et al. 2018, Siriraj Med J 70(4):284-288). The angle shows only with the forearm supinated, so the rest skeleton keeps the forearm straight on the arm and carries the angle in the forearm's pronation-supination axis: turning the palm forward opens it, turning it back closes it.
     */
    carryingAngle: number & tags.Minimum<-30> & tags.Maximum<40>;

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

    /**
     * Fat over the back of the hand, millimetres: the dorsal superficial, intermediate and deep fatty laminae over the metacarpals, measured by ultrasound. It thins with age, about 4.3 mm in the 20s and 2.4 mm over 60, which is why old hands show their knuckles, tendons and veins (Hung et al. 2022, Aesthet Surg J 42(10):1119-1126).
     */
    dorsalHandFat: number & tags.Minimum<0> & tags.Maximum<30>;
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
     * Navicular height: the navicular tuberosity, the bony prominence in front of and below the medial malleolus, above the standing surface with full weight on the foot, millimetres. It sets the height of the medial longitudinal arch: about 0.20 of foot length in Dutch adults and 0.17 in Malawian adults (Stolwijk et al. 2013, PLoS ONE 8(2):e57209), and lower in young children, 15.8 mm at 2 years and 27.0 mm at 6 (Chang et al. 2012, Biomed Eng Online 11:76). Admission keeps it below the lateral malleolus.
     */
    navicularHeight: number & tags.Minimum<5> & tags.Maximum<100>;

    /**
     * Thigh circumference at the gluteal furrow, perpendicular to the thigh axis, millimetres.
     */
    thighCircumference: number & tags.Minimum<120> & tags.Maximum<1300>;

    /**
     * Lower thigh circumference at suprapatella, the upper border of the patella, perpendicular to the thigh axis, millimetres, as ANSUR II measures it. With the thigh circumference it fixes how the thigh tapers to the knee; admission keeps it smaller than the thigh circumference.
     */
    lowerThighCircumference: number & tags.Minimum<80> & tags.Maximum<900>;

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

    /** The eyes', nose's and mouth's measurements, which their modules shape the face surface from. */
    features: IFeatures;

    /** The left auricle. */
    leftEar: IEar;

    /** The right auricle. */
    rightEar: IEar;
  }

  /**
   * The eyes, nose and mouth, measured between the Farkas landmarks of the 3D Facial Norms on the living face at rest, eyes open and lips closed.
   *
   * Nose width and vermilion height vary most between populations while mouth width varies little (Farkas et al. 2005, J Craniofac Surg 16(4):615-646), which is why they are parameters of their own rather than fractions of the face.
   *
   * @author Samchon
   */
  export interface IFeatures {
    /** Intercanthal width: endocanthion to endocanthion, the inner corners of the eyes, millimetres. */
    intercanthalWidth: number & tags.Minimum<10> & tags.Maximum<60>;

    /** Palpebral fissure length: endocanthion to exocanthion of one eye, millimetres; the same for both eyes. */
    palpebralFissureLength: number & tags.Minimum<10> & tags.Maximum<50>;

    /** Palpebral fissure height: upper to lower lid margin at the pupil, eye open at rest, millimetres. */
    palpebralFissureHeight: number & tags.Minimum<3> & tags.Maximum<20>;

    /** Nose width: alare to alare, the most lateral points of the alae, millimetres. */
    noseWidth: number & tags.Minimum<10> & tags.Maximum<70>;

    /** Nose height: nasion to subnasale, millimetres. */
    noseHeight: number & tags.Minimum<15> & tags.Maximum<90>;

    /** Nasal tip protrusion: subnasale to pronasale, millimetres. */
    noseProtrusion: number & tags.Minimum<4> & tags.Maximum<45>;

    /** Mouth width: cheilion to cheilion, the corners of the closed mouth, millimetres. */
    mouthWidth: number & tags.Minimum<15> & tags.Maximum<90>;

    /** Upper vermilion height: labiale superius to stomion, millimetres. */
    upperVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;

    /** Lower vermilion height: stomion to labiale inferius, millimetres. */
    lowerVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;
  }

  /**
   * One auricle, measured on the living head held in the Frankfort plane.
   *
   * The definitions are those of the Korean multicentre survey of the external ear (Cho et al. 2025, J Korean Med Sci 40(22):e107), whose means the converter reads: adult ears average 67 mm long and 29 mm broad in men and 64.5 and 27.4 mm in women. Ears keep lengthening through adulthood, from 63.9 mm in men in their twenties to 69.5 mm at 70 and over, while breadth and protrusion stay nearly constant.
   *
   * @author Samchon
   */
  export interface IEar {
    /**
     * Ear length: superaurale, the highest point of the helix, to subaurale, the lowest point of the lobule, millimetres. This line is the auricle's long axis.
     */
    earLength: number & tags.Minimum<15> & tags.Maximum<110>;

    /**
     * Ear breadth: otobasion superius, where the helix leaves the scalp, to the most posterior point of the helix, perpendicular to the long axis, millimetres. Admission keeps it shorter than the ear length.
     */
    earBreadth: number & tags.Minimum<10> & tags.Maximum<70>;

    /**
     * Protrusion: distance of the helix rim from the scalp behind it at the level of the tragus, millimetres. Admission keeps it shorter than the ear breadth, the plate that carries the rim away from the head.
     */
    earProtrusion: number & tags.Minimum<0> & tags.Maximum<50>;
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

    /** Subcutaneous fat thickness over each region, the fat that decides how sharply muscle shows. */
    subcutaneousFat: IAutoMovieHumanSubcutaneousFat;
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

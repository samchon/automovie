/** Additional measured dimensions of the unloaded neutral rest body. Lengths are millimetres, angles degrees except fields ending Rad, and ratios dimensionless. Standing heights share the admitted identity datum. Values do not define world placement: the existing resolved skeleton supplies internal frames. Each field requires a measurement or an explicitly qualified caller convention; this schema does not establish clinical accuracy or provide source-calibration defaults.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanCurveSupplement {
  /** Measurement-document schema version; currently exactly 1. */
  version: 1;

  /** Additional head, neck and facial dimensions absent from the admitted identity. */
  face: {
    /** Unloaded neck section measurements; the generator derives its internal cut from the actual rest skeleton. */
    neck: {
      /** Convex tape perimeter of the simple neck cut, mm; the jaw outline is not this boundary. */
      circumferenceAtMidTubeMm: number;

      /** Fore-aft depth divided by transverse breadth at the neck cut; dimensionless. */
      depthToBreadthRatio: number;

      /** Tape perimeter at the upper neck end, mm; its ratio to the mid-cut controls the longitudinal change. */
      upperNeckCircumferenceMm: number;
    };

    /** Relative chin and sublabial dimensions in the head measurement chart, not world landmarks. */
    jaw: {
      /** Distance below menton to the under-chin neck transition, mm; must leave a positive simple-tube domain. */
      submentalDropMm: number;

      /** Transverse breadth of the chin mass, mm. */
      chinBreadthMm: number;

      /** Height of the chin prominence above the chin baseline, mm. */
      prominenceHeightMm: number;

      /** Anterior reach of the chin prominence relative to its baseline, mm. */
      prominenceForwardMm: number;

      /** Height of the sublabial observation above the chin baseline, mm. */
      sublabialHeightMm: number;

      /** Posterior offset of the sublabial observation from the facial baseline, mm. */
      sublabialRecessionMm: number;

      /** Posterior cheek offset relative to the enclosing head profile, mm. */
      cheekRecessionMm: number;
    };

    /** Independent nasal section dimensions; controls are derived by the nasal family. */
    nasal: {
      /** Posterior nasal-root offset relative to the facial profile, mm. */
      rootRecessionMm: number;

      /** Anterior tip rise above the nasal section baseline, mm. */
      tipRiseMm: number;

      /** Transverse diameter of the emitted analytic nostril oval, mm. */
      nostrilBreadthMm: number;

      /** Second diameter of the nostril oval in its own tilted plane, mm. */
      nostrilHeightMm: number;

      /** Orientation of the nostril plane in the nasal measurement chart, degrees. */
      nostrilPlaneDegrees: number;

      /** Recession angle of the nostril axis in that chart, degrees. */
      nostrilRecessionDegrees: number;
    };

    /** Relative lip and philtrum dimensions used by the continuous oral family. */
    oral: {
      /** Anterior upper-lip border projection from the oral baseline, mm. */
      upperBorderProjectionMm: number;

      /** Anterior lower-lip border projection from the oral baseline, mm. */
      lowerBorderProjectionMm: number;

      /** Posterior lip-corner offset relative to the central oral profile, mm. */
      cornerRecessionMm: number;

      /** Transverse separation of the philtral border courses, mm. */
      philtrumBreadthMm: number;
    };

    /** Independent eyelid support dimensions for the left and right sides. */
    eyes: {
      /** Subject-left measurements; not mirrored from the right side. */
      left: IAutoMovieHumanCurveSupplement.Eye;

      /** Subject-right measurements; not mirrored from the left side. */
      right: IAutoMovieHumanCurveSupplement.Eye;
    };

    /** Anterior radius used by the medial eye-support anchor, mm; this epoch does not emit an ocular envelope. */
    eyeSupportAnteriorRadiusMm: number;

    /** Independent auricular dimensions; rotations use the head measurement chart. */
    ears: {
      /** Subject-left measurements; not mirrored from the right side. */
      left: IAutoMovieHumanCurveSupplement.Ear;

      /** Subject-right measurements; not mirrored from the left side. */
      right: IAutoMovieHumanCurveSupplement.Ear;
    };
  };

  /** Relaxed trunk dimensions and explicit T-rest shoulder conventions, independent of generated skin. */
  torso: {
    /** Uncompressed chest breadth used for the relaxed envelope, mm; it is distinct from a compressed caliper breadth. */
    relaxedChestBreadthMm: number;

    /** Standing height of the chest section, mm, in the admitted identity datum. */
    chestHeightMm: number;

    /** Standing height of the underfold section, mm; a section-design anchor rather than a guaranteed skin crease. */
    underfoldHeightMm: number;

    /** Fore-aft depth of the underfold section, mm. */
    underbustDepthMm: number;

    /** Fraction of chest depth anterior to the trunk axis; dimensionless. */
    chestAnteriorFraction: number;

    /** Fraction of waist depth anterior to the trunk axis; dimensionless. */
    waistAnteriorFraction: number;

    /** Transverse separation between the paired anterior chest peaks, mm. */
    chestPeakSeparationMm: number;

    /** Left and right anterior mass projection beyond the trunk core, mm. */
    pairedMassProjectionMm: {
      /** Subject-left measurements; not mirrored from the right side. */
      left: number;

      /** Subject-right measurements; not mirrored from the left side. */
      right: number;
    };

    /** Posterior median recess relative to the posterior trunk envelope, mm. */
    spinalGrooveDepthMm: number;

    /** Soft-tissue offset above the raised-arm shoulder support, mm. */
    deltoidSuperiorThicknessMm: number;

    /** Clavicular recess relative to the upper trunk envelope, mm. */
    clavicularHollowDepthMm: number;

    /** Posterior soft-tissue offset around the shoulder support, mm. */
    posteriorShoulderThicknessMm: number;

    /** Drop from the raised-arm support to the axillary floor, mm; a rest-conversion input, not a bone translation. */
    axillaryFloorDropMm: number;

    /** Left and right transverse breadth divided by depth at the owned upper-arm cut; dimensionless. */
    upperArmBreadthDepthRatio: {
      /** Subject-left measurements; not mirrored from the right side. */
      left: number;

      /** Subject-right measurements; not mirrored from the left side. */
      right: number;
    };

    /** Left and right tape girths at the trunk-owned simple upper-arm cut, mm. */
    proximalUpperArmCircumferenceMm: {
      /** Subject-left measurements; not mirrored from the right side. */
      left: number;

      /** Subject-right measurements; not mirrored from the left side. */
      right: number;
    };
  };

  /** Left and right palm thickness; finger placement comes from the existing 55-bone rest. */
  hands: {
    /** Subject-left measurements; not mirrored from the right side. */
    left: {
      /** Unloaded palm dorsal-to-palmar thickness, mm. */
      palmThicknessMm: number;
    };

    /** Subject-right measurements; not mirrored from the left side. */
    right: {
      /** Unloaded palm dorsal-to-palmar thickness, mm. */
      palmThicknessMm: number;
    };
  };

  /** Left and right transverse dimensions supplementing the actual mechanical segment lengths. */
  arms: {
    /** Subject-left measurements; not mirrored from the right side. */
    left: IAutoMovieHumanCurveSupplement.Arm;

    /** Subject-right measurements; not mirrored from the left side. */
    right: IAutoMovieHumanCurveSupplement.Arm;
  };

  /** Additional dimensions for the explicitly selected pelvis representation; unsupported combinations remain design findings. */
  pelvis: {
    /** Standing height of the maximum buttock section, mm, in the admitted identity datum. */
    buttockMaximumHeightMm: number;

    /** Anterior partition of the buttock section depth, mm. */
    buttockAnteriorReachMm: number;

    /** Posterior median recess relative to the buttock envelope, mm. */
    posteriorMedianRecessMm: number;

    /** Skin-envelope breadth at the iliac section, mm; distinct from compressed bicristal breadth. */
    iliacSkinBreadthMm: number;

    /** Standing height of the internal roof crown, mm; an internal construction dimension, not a clinical event claim. */
    perinealCrownHeightMm: number;

    /** Left thigh transverse breadth divided by fore-aft depth; dimensionless. */
    leftThighBreadthOverDepth: number;

    /** Right thigh transverse breadth divided by fore-aft depth; dimensionless. */
    rightThighBreadthOverDepth: number;
  };

  /** Independent left and right section dimensions; mechanical lengths stay owned by the skeleton. */
  legs: {
    /** Subject-left measurements; not mirrored from the right side. */
    left: IAutoMovieHumanCurveSupplement.Leg;

    /** Subject-right measurements; not mirrored from the left side. */
    right: IAutoMovieHumanCurveSupplement.Leg;
  };

  /** Independent left and right heel, arch, pad and toe measurements in each foot chart. */
  feet: {
    /** Subject-left measurements; not mirrored from the right side. */
    left: IAutoMovieHumanCurveSupplement.Foot;

    /** Subject-right measurements; not mirrored from the left side. */
    right: IAutoMovieHumanCurveSupplement.Foot;
  };
}

/** Physical measurement records used by the supplemental document. */
export namespace IAutoMovieHumanCurveSupplement {
  /** Independent eyelid support dimensions in the facial measurement chart.
   *
   * @author Samchon
   */
  export interface Eye {
    /** Vertical canthal slant in the facial chart, degrees. */
    canthalSlantDegrees: number;

    /** Fore-aft canthal difference in the facial chart, mm. */
    canthalRecessionMm: number;

    /** Anterior eyelid-margin bulge relative to the canthal chord, mm. */
    marginDepthBulgeMm: number;

    /** Offset from the lid margin to the fold course in the local section, mm. */
    foldOffsetMm: number;

    /** Offset of the lid roll relative to the margin course, mm. */
    rollOffsetMm: number;
  }

  /** Independent auricular dimensions in its local measurement chart.
   *
   * @author Samchon
   */
  export interface Ear {
    /** Auricular rotation about its chart axis, degrees. */
    rotationDegrees: number;

    /** Transverse helix scale in the auricular chart, mm. */
    helixBreadthScaleMm: number;

    /** Longitudinal concha extent, mm. */
    conchaLengthMm: number;

    /** Transverse concha extent, mm. */
    conchaBreadthMm: number;

    /** Concha recess depth in the auricular chart, mm. */
    conchaDepthMm: number;

    /** Inferior lobule extent, mm. */
    lobuleLengthMm: number;
  }

  /** Transverse support dimensions and section twist of one arm.
   *
   * @author Samchon
   */
  export interface Arm {
    /** Fore-aft depth of the internal upper-arm support section, mm. */
    upperArmDepthMm: number;

    /** Fore-aft depth of the internal forearm support section, mm. */
    forearmDepthMm: number;

    /** Transverse elbow support breadth, mm. */
    elbowBreadthMm: number;

    /** Fore-aft elbow support depth, mm. */
    elbowDepthMm: number;

    /** Forearm section rotation relative to its proximal chart, degrees. */
    forearmTwistDegrees: number;
  }

  /** Transverse sections and vertical mass positions of one leg.
   *
   * @author Samchon
   */
  export interface Leg {
    /** Thigh transverse breadth divided by fore-aft depth; the upstream owned cut remains authoritative. */
    thighBreadthOverDepth: number;

    /** Calf transverse breadth divided by fore-aft depth; dimensionless. */
    calfBreadthOverDepth: number;

    /** Transverse breadth at the emitted ankle cut, mm. */
    ankleBreadthMm: number;

    /** Vertical extent of the anterior patellar mass, mm. */
    patellaHeightMm: number;

    /** Tape girth at the knee support section, mm. */
    kneeCircumferenceMm: number;

    /** Tape girth of the proximal calf section below the knee, mm. */
    belowKneeCircumferenceMm: number;

    /** Height of the maximum calf section above the actual ankle joint, mm. */
    calfMaximumHeightAboveAnkleMm: number;

    /** Height of the minimum ankle section above its actual joint, mm. */
    ankleMinimumHeightAboveJointMm: number;

    /** Anterior partition of the maximum calf depth relative to the leg axis, mm. */
    calfAnteriorReachMm: number;

    /** Anterior partition of the ankle depth relative to its axis, mm. */
    ankleAnteriorReachMm: number;
  }

  /** Unloaded dimensions of one digit in the foot chart.
   *
   * @author Samchon
   */
  export interface Toe {
    /** Toe length along its local longitudinal chart, mm. */
    lengthMm: number;

    /** Toe transverse breadth, mm. */
    breadthMm: number;

    /** Toe dorsal-to-plantar thickness, mm. */
    thicknessMm: number;

    /** Posterior root offset relative to the forefoot support, mm. */
    rootRetractionMm: number;

    /** Toe direction relative to the foot longitudinal axis, radians. */
    splayRad: number;
  }

  /** Unloaded support dimensions referenced to the foot plantar datum.
   *
   * @author Samchon
   */
  export interface Foot {
    /** Transverse heel support breadth, mm. */
    heelBreadthMm: number;

    /** Posterior heel reach from the ankle chart, mm. */
    heelBehindAnkleMm: number;

    /** Unloaded heel-pad height above the plantar datum, mm. */
    heelPadHeightMm: number;

    /** Metatarsal ball height above the plantar datum, mm. */
    ballHeightMm: number;

    /** Dorsal instep height above the plantar datum, mm. */
    instepHeightMm: number;

    /** Medial plantar arch clearance above the plantar datum, mm. */
    plantarArchHeightMm: number;

    /** Toe-pad thickness above the plantar datum, mm. */
    toePadHeightMm: number;

    /** Separation used to construct the interdigital web, mm. */
    webGapMm: number;

    /** Independent dimensions of all five digits; no missing toe measurement is borrowed from a source catalogue. */
    toes: {
      /** Hallux measurements in the foot chart. */
      hallux: Toe;

      /** Second-toe measurements in the foot chart. */
      second: Toe;

      /** Third-toe measurements in the foot chart. */
      third: Toe;

      /** Fourth-toe measurements in the foot chart. */
      fourth: Toe;

      /** Fifth-toe measurements in the foot chart. */
      fifth: Toe;
    };
  }
}

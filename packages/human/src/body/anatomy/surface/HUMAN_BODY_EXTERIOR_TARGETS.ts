import type { IAutoMovieHumanBodyExteriorTarget } from "./IAutoMovieHumanBodyExteriorTarget";

/**
 * Surface targets of the numerical body request that the source-conditioned
 * exterior generator answers, in solve order.
 *
 * Each region owner appends its own bindings. Document admission requires a
 * supplied target to have a reachable consumer. Named gaps refuse with their
 * missing dependency, and other unbound paths refuse before a candidate can
 * be reported. A named gap is never approximated by another instrument.
 *
 * @author Samchon
 */
export const HUMAN_BODY_EXTERIOR_TARGETS: readonly IAutoMovieHumanBodyExteriorTarget[] = [
  // trunk (#2717); the midline rules have no side
  {
    path: "surface.trunk.bustGirth",
    rule: "measureBustCirc",
    channel: "measureBustCirc",
    protocol:
      "Read on bare rest A-pose skin in the horizontal plane through the left nipple-areola fill's centre; ANSUR II 6.4.25 tapes the chest at the chest point anterior in standing at quiet respiration, women's landmark on a bra.",
  },
  {
    path: "surface.trunk.waistGirth",
    rule: "measureWaistCirc",
    channel: "measureWaistCirc",
    protocol:
      "The smallest horizontal rest-skin girth between the lumbar and mid-chest joint landmarks stands in for the minimum girth between ribs and iliac crest; the ribs and crest are not registered on the source skin.",
  },
  {
    path: "surface.trunk.biacromialBreadth",
    rule: "measureShoulderDist",
    channel: "measureShoulderDist",
    protocol:
      "The straight distance between the two shoulder joint landmarks stands in for the acromion-to-acromion breadth; the acromia are not registered on the source skin, so the reading is a joint-centre breadth, not a palpated skeletal breadth.",
  },
  // upper arm (#2718); one authored left rule, read on each side
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorTarget[] => {
    const suffix = side === "left" ? "Left" : "Right";
    return [
      {
        path: `surface.${side}UpperLimb.upperArm.midUpperArmGirth`,
        rule: "measureUpperarmCirc",
        side,
        channel: "upperarmFat" + suffix,
        protocol:
          "The largest perpendicular rest-skin girth between 50% and 75% of the shoulder-to-elbow joint segment, read on the A-pose arm, stands in for the girth halfway from acromion to olecranon with the arm relaxed at the side. The one-sided source fat response is the solving channel; it does not decompose the girth into muscle and fat.",
      },
      {
        path: `surface.${side}UpperLimb.upperArm.shoulderToElbowLength`,
        rule: "measureUpperarmLength",
        side,
        channel: "upperarmScaleHoriz" + suffix,
        protocol:
          "The straight shoulder-to-elbow joint-centre distance stands in for the palpated acromion to lateral humeral epicondyle length; neither landmark is registered on the source skin.",
      },
    ];
  }),
  // hand (#2719); one authored left rule, read on each side
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorTarget[] => {
    const suffix = side === "left" ? "Left" : "Right";
    return [
      {
        path: `surface.${side}UpperLimb.hand.length`,
        rule: "handLength",
        side,
        channel: "handFingersLength" + suffix,
        protocol:
          "From the registered stylion skin point on the wrist joint's plane, the farthest middle-finger skin point along the wrist-to-middle-MCP joint axis stands in for stylion to dactylion III with the caliper beam along the arm; the rest hand keeps its source finger flexion instead of lying flat. The one-sided source finger-length response is the solving channel; it moves hand breadth by about 1 mm on the standard body.",
      },
      {
        path: `surface.${side}UpperLimb.hand.breadth`,
        rule: "handBreadth",
        side,
        channel: "handFingersDistance" + suffix,
        protocol:
          "The straight distance between the registered metacarpale II and V skin points stands in for the caliper breadth of the hand pressed flat. The one-sided source finger-spacing response is the solving channel; its reach is narrow (about 77 to 86 mm on the standard body) and it leaves hand length unchanged.",
      },
    ];
  }),
  // forearm (#2710); one authored left rule, read on each side
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorTarget[] => {
    const suffix = side === "left" ? "Left" : "Right";
    return [
      {
        path: `surface.${side}UpperLimb.forearm.wristGirth`,
        rule: "measureWristCirc",
        side,
        channel: "lowerarmFat" + suffix,
        protocol:
          "The smallest perpendicular rest-skin girth between 85% of the elbow-to-wrist joint segment and the wrist joint stands in for the girth just proximal to the styloid processes. The one-sided source fat response is the solving channel; it barely thins the wrist, so on the standard body the reach is about 131 to 176 mm and a smaller target is refused.",
      },
      {
        path: `surface.${side}UpperLimb.forearm.maximumGirth`,
        rule: "forearmMaximumGirth",
        side,
        channel: "lowerarmMuscle" + suffix,
        protocol:
          "The largest perpendicular rest-skin girth between 5% and 50% of the elbow-to-wrist joint segment, on the A-pose forearm, stands in for the maximum girth of the relaxed hanging forearm. The one-sided source muscle response is the solving channel; it does not decompose the girth into muscle and fat.",
      },
      {
        path: `surface.${side}UpperLimb.forearm.elbowToWristLength`,
        rule: "measureLowerarmLength",
        side,
        channel: "lowerarmScaleHoriz" + suffix,
        protocol:
          "The straight elbow-to-wrist joint-centre distance stands in for the lateral humeral epicondyle to radial styloid length; neither landmark is registered on the source skin.",
      },
    ];
  }),
  // foot (#2711); one authored left rule, read on each side
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorTarget[] => {
    const suffix = side === "left" ? "Left" : "Right";
    return [
      {
        path: `surface.${side}LowerLimb.foot.length`,
        rule: "footLength",
        side,
        channel: "footScaleDepth" + suffix,
        protocol:
          "The extent of the unloaded rest-skin foot region along the horizontal ankle-to-second-toe-tip joint axis stands in for pternion to acropodion on a weight-bearing Brannock device (ANSUR II 6.4.37). The one-sided source depth response is the solving channel; on the standard body it moves the breadth by under 0.2 mm and leaves the other foot unchanged.",
      },
      {
        path: `surface.${side}LowerLimb.foot.breadth`,
        rule: "footBreadth",
        side,
        channel: "footScaleHoriz" + suffix,
        protocol:
          "The largest extent of the unloaded rest-skin foot region across the foot length axis stands in for the Brannock horizontal slide set at the first metatarsophalangeal protrusion (ANSUR II 6.4.36), which the source does not register. The one-sided source breadth response is the solving channel.",
      },
    ];
  }),
  // pelvis (#2713); the hip girth is midline
  {
    path: "surface.trunk.buttockGirth",
    rule: "measureHipsCirc",
    channel: "measureHipsCirc",
    protocol:
      "The horizontal rest-skin tape girth where the buttocks stand furthest back, searched between the pelvis and lumbar joint landmarks, stands in for ANSUR II buttock circumference at the maximum posterior protrusion in standing; the bilateral source response is the solving channel.",
  },
  {
    path: "surface.trunk.hipBreadth",
    rule: "hipBreadth",
    channel: "hipScaleHoriz",
    protocol:
      "The extent along the hip-joint line of the rest skin dominantly weighted to the pelvis bone stands in for ANSUR II hip breadth between the lateral buttock points; thigh-weighted skin is left out, so the reading can fall short of the survey's. The bilateral source breadth response is the solving channel (about 241-376 mm on the standard body).",
  },
  {
    path: "surface.trunk.buttockDepth",
    rule: "buttockDepth",
    channel: "hipScaleDepth",
    protocol:
      "The front-to-back extent of the rest skin dominantly weighted to the pelvis bone stands in for ANSUR II buttock depth at the maximum buttock protrusion; abdominal skin weighted to the spine is left out of the front blade. The bilateral source depth response is the solving channel (about 157-293 mm on the standard body).",
  },
  // thigh, knee and shank (#2716, #2712, #2714); one authored left rule, read on each side
  ...(["left", "right"] as const).flatMap((side): IAutoMovieHumanBodyExteriorTarget[] => {
    const suffix = side === "left" ? "Left" : "Right";
    return [
      {
        path: `surface.${side}LowerLimb.thigh.midThighGirth`,
        rule: "measureThighCirc",
        side,
        channel: "upperlegScaleHoriz" + suffix,
        protocol:
          "Convention: the largest perpendicular rest-skin girth between 25% and 60% of the hip-to-knee joint segment, on the A-pose leg, stands in for a mid-thigh girth; it is neither ANSUR II thigh circumference (at the gluteal furrow) nor a palpated midpoint. The one-sided source breadth response is the solving channel (about 521-566 mm on the standard body).",
      },
      {
        path: `surface.${side}LowerLimb.leg.kneeGirth`,
        rule: "measureKneeCirc",
        side,
        channel: "lowerlegScaleDepth" + suffix,
        protocol:
          "The smallest perpendicular rest-skin girth in the last 10% of the hip-to-knee joint segment stands in for a knee girth at the patella, which the source does not register. The one-sided source depth response is the solving channel; it also moves the calf and ankle, which their own channels then correct.",
      },
      {
        path: `surface.${side}LowerLimb.leg.kneeHeight`,
        rule: "kneeHeightMidpatella",
        side,
        channel: "upperlegScaleVert" + suffix,
        protocol:
          "The registered midpatella skin point's height above the source ground plane on the unloaded rest skin stands in for ANSUR II knee height, midpatella, measured standing with the weight on both feet; the point carries about +-10 mm vertical ambiguity. The one-sided source thigh-height response is the solving channel: it moves the knee between a fixed hip and foot (about 437-531 mm on the standard body) and leaves the other leg unchanged.",
      },
      {
        path: `surface.${side}LowerLimb.leg.maximumCalfGirth`,
        rule: "measureCalfCirc",
        side,
        channel: "lowerlegMuscle" + suffix,
        protocol:
          "The largest perpendicular rest-skin girth between 15% and 50% of the knee-to-ankle joint segment stands in for ANSUR II calf circumference at the maximum protrusion in standing. The one-sided source muscle response is the solving channel; it does not decompose the girth into muscle and fat.",
      },
      {
        path: `surface.${side}LowerLimb.leg.ankleGirth`,
        rule: "measureAnkleCirc",
        side,
        channel: "lowerlegScaleHoriz" + suffix,
        protocol:
          "The smallest perpendicular rest-skin girth between 85% and 97% of the knee-to-ankle joint segment stands in for the minimum girth above the malleoli. The one-sided source breadth response is the solving channel (about 184-206 mm on the standard body); it also moves the calf.",
      },
    ];
  }),
];

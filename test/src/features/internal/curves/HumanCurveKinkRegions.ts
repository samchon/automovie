import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import type { HumanCurveKinks } from "./HumanCurveKinks";

type V3 = HumanAnatomy.V3;
type IRegion = HumanCurveKinks.IRegion;
const A: typeof HumanAnatomy = HumanAnatomy;

/** Every azimuth from `from` to `to` degrees, `step` apart, both ends included. */
function sweep(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let a: number = from; a <= to + 1e-9; a += step) out.push(a);
  return out;
}

/**
 * The regions the kink rules read, each with its axis from the skin's own
 * joints and the sectors where anatomy carries no crease of a 7 mm radius.
 *
 * Azimuths are measured about the region's axis from the body's forward
 * direction (+X); for a vertical axis pointing up, 90 degrees is the body's
 * right (-Z) and 270 its left (+Z).
 */
export namespace HumanCurveKinkRegions {
  /**
   * STEP-NK-1, the neck's base: half-planes through the neck's axis (the
   * neck joint to the head joint), from 0.04 S below the neck's base to 0.4
   * of the way to the head joint, and up to 0.09 S from the axis, so the
   * trapezius' slope onto the shoulder is read. The front third is left out:
   * the jugular notch, the clavicles' heads and the sternocleidomastoid
   * tendons are real turns of small radius there (Gray 1918).
   */
  export const NECK_BASE: IRegion = {
    name: "neck base, lateral and posterior meridians",
    rule: "STEP-NK-1",
    chains: /^(trunk|upper|head|head\.lower)$/,
    frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
      const neck: V3 = A.joint(skin, "neck");
      const head: V3 = A.joint(skin, "head");
      return { origin: neck, axis: A.unit(A.sub(head, neck)), forward: [1, 0, 0], from: -0.04 * S, to: 0.4 * A.dist(head, neck), reach: 0.09 * S };
    },
    azimuths: sweep(60, 300, 15),
  };

  /**
   * STEP-SH-1 and STEP-SH-2, each shoulder's cap and arm root: half-planes
   * through the humerus' axis (shoulder joint to elbow joint), from 0.03 S
   * above the shoulder joint to a quarter of the humerus below it. The
   * medial third, facing the trunk, is left out: the axilla and its folds
   * are real creases.
   */
  export function shoulder(side: "left" | "right"): IRegion {
    return {
      name: `${side} shoulder cap and arm root, lateral meridians`,
      rule: side === "left" ? "STEP-SH-1" : "STEP-SH-2",
      chains: new RegExp(`^(upper|arm\\.${side})$`),
      frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
        const top: V3 = A.joint(skin, `${side}UpperArm`);
        const elbow: V3 = A.joint(skin, `${side}LowerArm`);
        return { origin: top, axis: A.unit(A.sub(elbow, top)), forward: [1, 0, 0], from: -0.03 * S, to: 0.25 * A.dist(elbow, top), reach: 0.07 * S };
      },

      // The axis runs down and outward, so the side direction `axis x forward`
      // points toward +Z: lateral for the left arm (90 degrees), medial for the right.
      azimuths: side === "left" ? sweep(-30, 210, 15) : sweep(150, 390, 15),
    };
  }

  /**
   * DENT-HD-1, the temples and the side of the face from the zygomatic arch
   * to the temporal line: vertical half-planes through an axis 15 mm behind
   * the exocanthion's depth, at the eye centres' height, from 25 mm below to
   * 45 mm above, at the lateral azimuths only (80 to 120 and 240 to 280
   * degrees), which pass behind the lids and in front of the ear's root.
   */
  export const TEMPLE: IRegion = {
    name: "temples and the side of the face, vertical meridians",
    rule: "DENT-HD-1",
    chains: /^head\.(lower|middle|upper)$/,
    frame: (skin: HumanAnatomy.ISkin): HumanCurveKinks.IFrame => {
      const left: V3 = A.joint(skin, "leftEye");
      const right: V3 = A.joint(skin, "rightEye");
      const eye: V3 = A.lerp(left, right, 0.5);
      return { origin: [eye[0] - 15, eye[1], 0], axis: [0, 1, 0], forward: [1, 0, 0], from: -25, to: 45, reach: 150 };
    },
    azimuths: [...sweep(80, 120, 10), ...sweep(240, 280, 10)],
  };

  /**
   * DENT-HD-2, the forehead from 30 mm above the eyes to 80 mm above them:
   * vertical half-planes through the head's vertical axis at the eyes'
   * height, in the front sector, above the brow ridge and the glabella.
   */
  export const FOREHEAD: IRegion = {
    name: "forehead, frontal meridians",
    rule: "DENT-HD-2",
    chains: /^head\.(middle|upper)$/,
    frame: (skin: HumanAnatomy.ISkin): HumanCurveKinks.IFrame => {
      const eye: V3 = A.lerp(A.joint(skin, "leftEye"), A.joint(skin, "rightEye"), 0.5);
      const head: V3 = A.joint(skin, "head");
      return { origin: [head[0], eye[1], 0], axis: [0, 1, 0], forward: [1, 0, 0], from: 30, to: 80, reach: 160 };
    },
    azimuths: sweep(-30, 30, 10),
  };

  /**
   * DENT-LG-1 and DENT-LG-2, each shank from a tenth to 0.85 of the way from
   * the knee joint to the ankle joint, at every azimuth: the calf, the shin
   * and the leg above the malleoli carry no crease standing.
   */
  export function shank(side: "left" | "right"): IRegion {
    return {
      name: `${side} shank, meridians round the tibia`,
      rule: side === "left" ? "DENT-LG-1" : "DENT-LG-2",
      chains: new RegExp(`^leg\\.${side}$`),
      frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
        const knee: V3 = A.joint(skin, `${side}LowerLeg`);
        const ankle: V3 = A.joint(skin, `${side}Foot`);
        const L: number = A.dist(knee, ankle);
        return { origin: knee, axis: A.unit(A.sub(ankle, knee)), forward: [1, 0, 0], from: 0.1 * L, to: 0.85 * L, reach: 0.05 * S };
      },
      azimuths: sweep(0, 345, 15),
    };
  }

  /**
   * RIB-NK-1, the front of the neck between the jugular notch and the
   * chin's underside: half-planes through the neck's axis at the front
   * azimuths (-40 to 40 degrees), from 25 mm above the neck's base, clear of
   * the notch, to half the way to the head joint, below the cervicomental
   * angle. The thyroid prominence is a broad convexity there; waves and
   * steps are the defects.
   */
  export const NECK_FRONT: IRegion = {
    name: "front of the neck, notch to chin, anterior meridians",
    rule: "RIB-NK-1",
    chains: /^(upper|head|head\.lower)$/,
    frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
      const neck: V3 = A.joint(skin, "neck");
      const head: V3 = A.joint(skin, "head");
      return { origin: neck, axis: A.unit(A.sub(head, neck)), forward: [1, 0, 0], from: 25, to: 0.5 * A.dist(head, neck), reach: 0.06 * S };
    },
    azimuths: sweep(-40, 40, 10),
  };

  /**
   * RIB-FT-1-L and RIB-FT-1-R, each heel's back and sides from 5 mm above
   * the floor to 40 mm: vertical half-planes through the ankle joint's
   * vertical, at the posterior azimuths (120 to 240 degrees), below the
   * Achilles tendon's hollows beside the malleoli. The calcaneus' tuberosity
   * under its fat pad makes one convex dome there.
   */
  export function heel(side: "left" | "right"): IRegion {
    return {
      name: `${side} heel's back and sides, vertical meridians`,
      rule: side === "left" ? "RIB-FT-1-L" : "RIB-FT-1-R",
      chains: new RegExp(`^foot\\.${side}$`),
      frame: (skin: HumanAnatomy.ISkin): HumanCurveKinks.IFrame => {
        const ankle: V3 = A.joint(skin, `${side}Foot`);
        return { origin: [ankle[0], 0, ankle[2]], axis: [0, 1, 0], forward: [1, 0, 0], from: 5, to: 40, reach: 120 };
      },
      azimuths: sweep(120, 240, 10),
    };
  }

  /**
   * Whether a person is lean by their own inputs: waist over stature under
   * 0.5, the boundary of central adiposity in adults of both sexes (Ashwell
   * 2012, Browning 2010; source notes owed), and the `fat` control at or
   * below zero. A lean person carries no adiposity fold (FLD-2).
   */
  export function lean(subject: HumanAnatomyAudit.ISubject): boolean {
    const c: HumanAnatomyAudit.ISubject["params"]["body"]["controls"] = subject.params.body.controls;
    return c.waist.value !== null && c.height.value !== null && c.waist.value / c.height.value < 0.5 && (c.fat.value ?? 0) <= 0;
  }

  /**
   * FLD-2-AB, a lean person's abdomen and flanks: vertical half-planes
   * through the spine's joint at the lumbar level, from 0.50 S to 0.62 S of
   * height, at the front flanks (15 to 70 degrees either side of forward),
   * leaving out the umbilicus on the midline.
   */
  export const ABDOMEN: IRegion = {
    name: "lean abdomen and flanks, vertical meridians",
    rule: "FLD-2-AB",
    chains: /^trunk$/,
    frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
      const spine: V3 = A.joint(skin, "spine");
      return { origin: [spine[0], 0, 0], axis: [0, 1, 0], forward: [1, 0, 0], from: 0.5 * S, to: 0.62 * S, reach: 0.25 * S };
    },
    azimuths: [...sweep(15, 70, 11), ...sweep(290, 345, 11)],
    applies: lean,
  };

  /**
   * FLD-2-BK, a lean person's back from the waist to the shoulder blades'
   * lower angles: vertical half-planes through the spine's joint, from
   * 0.55 S to 0.72 S, at the back's sides (110 to 165 degrees either side),
   * leaving out the spinal furrow on the midline.
   */
  export const BACK: IRegion = {
    name: "lean back, vertical meridians",
    rule: "FLD-2-BK",
    chains: /^(trunk|upper)$/,
    frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
      const spine: V3 = A.joint(skin, "spine");
      return { origin: [spine[0], 0, 0], axis: [0, 1, 0], forward: [1, 0, 0], from: 0.55 * S, to: 0.72 * S, reach: 0.25 * S };
    },
    azimuths: [...sweep(110, 165, 11), ...sweep(195, 250, 11)],
    applies: lean,
  };

  /**
   * STEP-LG-1 and STEP-LG-2, each thigh's root where the leg leaves the
   * trunk: half-planes through the femur's axis (hip joint to knee joint),
   * from 0.05 to 0.35 of the femur below the hip joint, over the lateral 120
   * degrees. The medial side is left out: the inguinal crease in front and
   * the gluteal sulcus behind are real creases there (Gray 1918); the
   * thigh's lateral root over the greater trochanter carries none.
   */
  export function groin(side: "left" | "right"): IRegion {
    return {
      name: `${side} thigh root, lateral meridians`,
      rule: side === "left" ? "STEP-LG-1" : "STEP-LG-2",
      chains: new RegExp(`^(trunk|leg\\.${side})$`),
      frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
        const hip: V3 = A.joint(skin, `${side}UpperLeg`);
        const knee: V3 = A.joint(skin, `${side}LowerLeg`);
        const L: number = A.dist(hip, knee);
        return { origin: hip, axis: A.unit(A.sub(knee, hip)), forward: [1, 0, 0], from: 0.05 * L, to: 0.35 * L, reach: 0.12 * S };
      },

      // The axis runs down, so `axis x forward` points to the body's left (+Z):
      // lateral for the left thigh (90 degrees), medial for the right.
      azimuths: side === "left" ? sweep(30, 150, 15) : sweep(210, 330, 15),
    };
  }

  /**
   * DENT-TR-1, the sides of the hips from the trochanters' level to below
   * the iliac crests, 0.50 S to 0.60 S: vertical half-planes through the
   * spine's joint, at the lateral azimuths (70 to 110 degrees either side).
   * Gluteus medius covers the iliac wing there in one convex run (Gray
   * 1918); the iliac crest's lateral fold of adiposity lies above 0.60 S and
   * is the lean-fold rule's.
   */
  export const HIP: IRegion = {
    name: "sides of the hips, vertical meridians",
    rule: "DENT-TR-1",
    chains: /^(trunk|leg\.(left|right))$/,
    frame: (skin: HumanAnatomy.ISkin, S: number): HumanCurveKinks.IFrame => {
      const spine: V3 = A.joint(skin, "spine");
      return { origin: [spine[0], 0, 0], axis: [0, 1, 0], forward: [1, 0, 0], from: 0.5 * S, to: 0.6 * S, reach: 0.3 * S };
    },
    azimuths: [...sweep(70, 110, 10), ...sweep(250, 290, 10)],
  };

  /** Every region, in the order the defect tests read them. */
  export const ALL: readonly IRegion[] = [NECK_BASE, shoulder("left"), shoulder("right"), TEMPLE, FOREHEAD, shank("left"), shank("right"), ABDOMEN, BACK, NECK_FRONT, groin("left"), groin("right"), HIP];
}

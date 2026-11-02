import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HUMAN_STICKMAN_POSES } from "../../../../packages/human/dev/src/human-stickman/HUMAN_STICKMAN_POSES";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanPlanePath } from "./HumanPlanePath";
import { HumanEyelidMeasurements } from "./HumanEyelidMeasurements";
import { HumanMeasurementSite } from "./HumanMeasurementSite";
import { HumanVermilionMeasurements } from "./HumanVermilionMeasurements";
import { HumanAnatomyAuthority as Authority } from "./HumanAnatomyAuthority";
import { HumanObservedGirthMinimum } from "./HumanObservedGirthMinimum";
import type { AutoMovieHumanMeasurementProtocol as Measurement } from "../../../../packages/human/src/generation/AutoMovieHumanMeasurementProtocol";
import type { AutoMovieHumanEyelid } from "../../../../packages/human/src/generation/AutoMovieHumanEyelid";
import { HumanPeople } from "./HumanPeople";

type V3 = HumanAnatomy.V3;
const A = HumanAnatomy;

/**
 * Anatomical measurements of a generated person, each taken on the skin at a
 * explicit model site or observed surface feature, against the public inputs
 * and published population relations. Owned addresses locate final-skin cuts
 * without exposing a target radius or solved coefficient. Clinical-equivalence
 * limitations are recorded in the measurement protocol.
 */
export namespace HumanAnatomyAudit {
  /** Acceptance row with explicit evidence authority and availability. */
  export type IRow = Authority.IRow;

  /** Clinical, anatomical and model goals remain distinct even when numeric values agree. */
  export function passes(row: IRow): boolean {
    return Authority.passes(row);
  }

  /** Every region's audit by name. */
  export const REGIONS: Record<string, (name: string) => IRow[]> = {
    trunk: (name: string): IRow[] => trunk(name),
    arm: (name: string): IRow[] => arm(name),
    hand: (name: string): IRow[] => hand(name),
    leg: (name: string): IRow[] => leg(name),
    foot: (name: string): IRow[] => foot(name),
    head: (name: string): IRow[] => head(name),
    pose: (name: string): IRow[] => pose(name),
  };

  /**
   * The trunk and neck: tapes at their canonical model addresses, the
   * trunk's sections against ANSUR II shape ratios, the neck's girth profile
   * and the body's mirror symmetry.
   */
  export function trunk(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const p: IAutoMovieHumanParameters = HumanPeople.person(name).params;
    const c = p.body.controls;
    const skin: HumanAnatomy.ISkin = A.bind(name);
    const S: number = c.height.value!;
    const t: ITrunk = trunkSites(skin, S);
    const tape = (site: string, value: number, input: number | null, tol: number): void => {
      if (input !== null) rows.push(modelIdentity(name, site, value, input, tol));
    };
    tape("chest girth at the model bust-apex address, mm", t.chest.girth, c.chest.value, LARGE);
    tape("underbust girth at the model lower-bust address, mm", t.underbust.girth, c.underbust.value, LARGE);
    tape("waist girth at the owned model waist, mm", t.waist.girth, c.waist.value, LARGE);
    tape("high hip girth, midway waist to hip, mm", t.highHip.girth, c.highHip.value, LARGE);
    tape("hip girth at the buttock prominence, mm", t.hip.girth, c.hip.value, LARGE);
    const neck: INeck = neckSites(skin, S);
    tape("neck girth at the owned model neck section, mm", neck.neck, c.neck.value, SMALL);
    tape("neck base girth along the owned model contact course, mm", neck.base, c.neckBase.value, SMALL);

    rows.push(...observedMinimumChecks(name, skin, t));

    // ANSUR II shape ratios: mean +- 2.33 SD over both sexes.
    rows.push(ratio(name, "chest depth / breadth at the bust point", extent(t.chest.points, 0) / extent(t.chest.points, 2), 0.702, 1.095));
    rows.push(ratio(name, "waist depth / breadth", extent(t.waist.points, 0) / extent(t.waist.points, 2), 0.576, 0.853));
    rows.push(ratio(name, "buttock depth / hip breadth", extent(t.hip.points, 0) / extent(t.hip.points, 2), 0.548, 0.827));
    rows.push(ratio(name, "crotch height / stature", t.crotch / S, 0.445, 0.515));

    // The neck's girth falls from its base to one least girth and rises to the
    // jaw: one turn, no step.
    rows.push({
      person: name,
      site: "neck girth profile, base to jaw: extra turns deeper than a small-girth error",
      value: extraTurns(neck.profile, SMALL),
      low: 0,
      high: 0,
      unit: "turns",
    });
    rows.push({
      person: name,
      site: "neck skin: deepest crease across the neck, sagitta over a 10 mm chord past a 12.5 mm radius, mm",
      value: neck.crease,
      low: 0,
      high: CREASE,
      unit: "mm",
    });
    rows.push(...symmetry(name, skin, /^(trunk|upper|head\.lower|leg)/, "trunk, neck and legs"));
    return Authority.finish([...rows, ...Authority.requirements("trunk", name, HumanPeople.person(name).params)]);
  }

  /** The arms: owned model tapes, the complete forearm/wrist profile and radial bulge. */
  export function arm(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const c = HumanPeople.person(name).params.body.controls;
    const skin: HumanAnatomy.ISkin = A.bind(name);
    for (const side of SIDES) {
      const s: IArm = armSites(skin, side);
      const tape = (site: string, value: number, input: number | null): void => {
        if (input !== null) rows.push(modelIdentity(name, `${side} ${site}`, value, input, SMALL));
      };
      tape("upper arm girth midway owned attachment to elbow centre, mm", s.bicep, c.bicep.value);
      tape("elbow girth at the owned joint section, mm", s.elbow, c.elbow.value);
      tape("forearm girth, maximum of the owned muscle region, mm", s.forearm, c.forearm.value);
      tape("wrist girth at the owned crease section, mm", s.wrist, c.wrist.value);
      rows.push({
        person: name,
        site: `${side} forearm girth, elbow to wrist: maxima past the first deeper than a small-girth error`,
        value: extraTurns(s.forearmProfile.map((g: number): number => -g), SMALL),
        low: 0,
        high: 0,
        unit: "turns",
      });
      rows.push({
        person: name,
        site: `${side} least girth from the forearm's belly to the knuckles, mm from wrist crease (negative proximal)`,
        value: s.narrowest,
        low: -WRIST_PROXIMAL,
        high: WRIST_DISTAL,
        unit: "mm",
      });
      rows.push({
        person: name,
        site: `${side} wrist crease girth above that least girth, mm`,
        value: s.wrist - s.least,
        low: 0,
        high: SMALL,
        unit: "mm",
      });
      rows.push({
        person: name,
        site: `${side} owned wrist tape versus the exact crease in its plane family, mm`,
        value: s.creaseMetricError,
        low: 0,
        high: 1e-6,
        unit: "mm",
        reason: "Both final-skin observations must use the same owned crease plane before their profile is compared.",
      });
      for (const [joint, off] of Object.entries(s.outside))
        rows.push({
          person: name,
          site: `${side} arm's bone axis at the ${joint} outside its own section of skin, mm`,
          value: off,
          low: 0,
          high: 0,
          unit: "mm",
        });
      rows.push({
        person: name,
        site: `${side} wrist's thumb side: 10 mm chord bulge in its owned plane family, crease -40 to +10 mm, mm`,
        value: s.radialBulge,
        low: 0,
        high: BULGE,
        unit: "mm",
      });
    }
    rows.push(...symmetry(name, skin, /^arm/, "arms"));
    return Authority.finish([...rows, ...Authority.requirements("arm", name, HumanPeople.person(name).params)]);
  }

  /** The hands, straightened at the neutral pose: ANSUR II and ISO 7250-1 lengths, breadth and circumference. */
  export function hand(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const p: IAutoMovieHumanParameters = HumanPeople.person(name).params;
    const skin: HumanAnatomy.ISkin = A.posed(name, {});
    for (const side of SIDES) {
      const h: IHand = handSites(skin, side);
      const own = p.extremities?.hands?.[side];
      if (own !== undefined) {
        rows.push(modelIdentity(name, `${side} hand length, model wrist crease to digit III tip, mm`, h.length, own.handLength, HAND));
        rows.push(modelIdentity(name, `${side} hand breadth across metacarpals II to V, mm`, h.breadth, own.handBreadth, HAND));
        rows.push(modelIdentity(name, `${side} palm length, model wrist crease to the middle finger's base, mm`, h.palm, own.palmLength, HAND));
        rows.push(modelIdentity(name, `${side} thumb length, MCP crease to tip, mm`, h.thumb, own.thumbLength, HAND));
        rows.push(
          ratio(name, `${side} hand breadth / length`, h.breadth / h.length, 0.383, 0.506),
        );
      }
      const circumference: number | null = p.body.controls.handCircumference.value;
      if (circumference !== null)
        rows.push(modelIdentity(name, `${side} hand circumference over metacarpals II to V, mm`, h.circumference, circumference, SMALL));
    }
    return Authority.finish([...rows, ...Authority.requirements("hand", name, HumanPeople.person(name).params)]);
  }

  /**
   * Measure one supplied hand skin without generating or posing it. Campaign
   * diagnostics can compare cached bind and neutral output through the same
   * independent reader, separating a construction endpoint from rig movement.
   */
  export function handAt(skin: HumanAnatomy.ISkin, side: "left" | "right"): IHand {
    return handSites(skin, side);
  }

  /** The legs: tapes at ANSUR II and ISO sites and the shank's girth profile. */
  export function leg(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const c = HumanPeople.person(name).params.body.controls;
    const skin: HumanAnatomy.ISkin = A.bind(name);
    const S: number = c.height.value!;
    for (const side of SIDES) {
      const l: ILeg = legSites(skin, side);
      if (c.thigh.value !== null)
        rows.push(modelIdentity(name, `${side} thigh girth, horizontal maximum just below the crotch, mm`, l.thigh, c.thigh.value, LARGE));
      if (c.knee.value !== null)
        rows.push(modelIdentity(name, `${side} knee girth at the owned joint section, mm`, l.knee, c.knee.value, SMALL));
      if (c.calf.value !== null)
        rows.push(modelIdentity(name, `${side} calf girth, horizontal maximum of the owned muscle region, mm`, l.calf, c.calf.value, SMALL));
      rows.push({
        person: name,
        site: `${side} shank girth, knee to ankle: maxima past the first deeper than a small-girth error`,
        value: extraTurns(l.shankProfile.map((g: number): number => -g), SMALL),
        low: 0,
        high: 0,
        unit: "turns",
      });
      for (const [where, off] of Object.entries(l.outside))
        rows.push({
          person: name,
          site: `${side} leg's bone axis at the ${where} outside its own section of skin, mm`,
          value: off,
          low: 0,
          high: 0,
          unit: "mm",
        });
    }
    // Bideltoid over hip breadth, standing with the arms hanging.
    const neutral: HumanAnatomy.ISkin = A.posed(name, {});
    // Neutral changes the arms and legs, while the unrotated torso retains
    // the bind's owned hip landmark. Measure that plane on the posed skin.
    const neutralHip: HumanMeasurementSite.IReading = HumanMeasurementSite.read(neutral, skin.measurementSites?.hip);
    const shoulder: number = (A.joint(neutral, "leftUpperArm")[1] + A.joint(neutral, "rightUpperArm")[1]) / 2;
    const bideltoid: number = breadth(neutral, shoulder - 0.08 * S, shoulder + 0.02 * S);
    rows.push(ratio(name, "bideltoid / hip breadth, arms hanging", bideltoid / extent(neutralHip.points, 2), 1.111, 1.647));
    return Authority.finish([...rows, ...Authority.requirements("leg", name, HumanPeople.person(name).params)]);
  }

  /** The feet, flat at the neutral pose: ISO 7250-1 length and breadth. */
  export function foot(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const p: IAutoMovieHumanParameters = HumanPeople.person(name).params;
    const skin: HumanAnatomy.ISkin = A.posed(name, {});
    for (const side of SIDES) {
      const own = p.extremities?.feet?.[side];
      const f: { length: number; breadth: number } = footSites(skin, side);
      if (own !== undefined) {
        rows.push(identity(name, `${side} foot length, heel to the longest toe along the foot axis, mm`, f.length, own.footLength, FOOT));
        rows.push(identity(name, `${side} foot breadth, maximum across the foot axis, mm`, f.breadth, own.footBreadth, FOOT));
      }
      // ANSUR II: breadth over length 0.377 (women) and 0.376 (men), its spread
      // bounded by the women's coefficients of variation of breadth (0.052) and
      // length (0.050) taken as uncorrelated: SD 0.027, 2.326 SD either side.
      rows.push(ratio(name, `${side} foot breadth / length`, f.breadth / f.length, 0.314, 0.440));
    }
    rows.push(...symmetry(name, A.bind(name), /^(foot|forefoot|toe)/, "feet"));
    return Authority.finish(rows);
  }

  /**
   * The head and face: head and face dimensions at their Farkas, FaceBase and
   * ISO 7250-1 landmarks, the closed mouth, and population proportions.
   */
  export function head(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const p: IAutoMovieHumanParameters = HumanPeople.person(name).params;
    const skin: HumanAnatomy.ISkin = A.bind(name);
    const S: number = p.body.controls.height.value!;
    const f: IFace = faceSites(skin, S);
    const h = p.head;
    const id = (site: string, value: number, input: number, authority: Authority.Authority = "clinical-identity"): void => {
      rows.push(identity(name, authority === "model-identity" ? "model proxy: " + site : site, value, input, HEAD, authority));
    };
    id("head length, glabella to opisthocranion, mm", f.length, h.length);
    id("head breadth, eurion to eurion, mm", f.breadth, (h.length * h.cephalicIndex) / 100);
    id("head height, menton to vertex, mm", f.height, h.height);
    id("face height, nasion to gnathion, mm", f.faceHeight, h.faceHeight, "model-identity");
    id("face width, zygion to zygion, mm", f.faceWidth, h.faceWidth, "model-identity");
    id("mandibular width, gonion to gonion, mm", f.mandibular, h.mandibularWidth, "model-identity");
    rows.push(identity(name, "head circumference over glabella and opisthocranion, mm", f.circumference, h.circumference, SMALL));
    id("intercanthal width, en to en, mm", f.intercanthal, h.face.intercanthalWidth);
    for (const side of SIDES) {
      id(`${side} palpebral fissure length, en to ex, mm`, f.fissure[side].length, h.face.eyePair[side].palpebralFissureLength);
      id(`${side} palpebral fissure height at the pupil, mm`, f.fissure[side].height, h.face.eyePair[side].palpebralFissureHeight);
    }
    id("nasal width, al to al, mm", f.noseWidth, h.face.nose.width, "model-identity");
    id("nasal height, n to sn, mm", f.noseHeight, h.face.nose.height, "model-identity");
    id("nasal protrusion, sn to prn, mm", f.noseProtrusion, h.face.nose.protrusion);
    id("mouth width, ch to ch, mm", f.mouthWidth, h.face.mouth.width);
    id("upper vermilion height, ls to sto, mm", f.upperVermilion, h.face.mouth.upperVermilionHeight);
    id("lower vermilion height, sto to li, mm", f.lowerVermilion, h.face.mouth.lowerVermilionHeight);
    rows.push({ person: name, site: "lips at rest: gap between the lips at the midline, mm", value: f.lipGap, low: 0, high: HEAD, unit: "mm" });
    rows.push({ person: name, site: "lips at rest: widest gap along the middle half of the mouth, mm", value: f.mouthGap, low: 0, high: HEAD, unit: "mm" });
    rows.push({ person: name, site: "teeth at rest: tooth points seen from the front", value: f.teethSeen, low: 0, high: 0, unit: "points" });
    rows.push(ratio(name, "nasolabial angle, deg", f.nasolabial, 83.4, 120.6));
    rows.push(ratio(name, "lower face height sn-gn / n-gn", f.lowerFace, 0.441, 0.694));
    rows.push(ratio(name, "upper lip height sn-sto / n-gn", f.upperLip, 0.12, 0.232));
    return Authority.finish([...rows, ...Authority.requirements("head", name, HumanPeople.person(name).params)]);
  }

  /**
   * Posed skin through the public pose evaluator and rig: no skin through skin
   * at the axillae, elbows, groin and knees beyond a stated depth, no skin
   * stretched past its failure strain or folded over, the arms clear of the
   * trunk at neutral, and a flexed limb keeping its volume.
   */
  export function pose(name: string): IRow[] {
    const rows: Authority.IInput[] = [];
    const rest: HumanAnatomy.ISkin = A.bind(name);
    const S: number = HumanPeople.person(name).params.body.controls.height.value!;
    const regions: [string, string, number][] = [];
    for (const side of SIDES) {
      regions.push([`${side} axilla`, `${side}UpperArm`, 0.07 * S]);
      regions.push([`${side} elbow`, `${side}LowerArm`, 0.045 * S]);
      regions.push([`${side} groin`, `${side}UpperLeg`, 0.07 * S]);
      regions.push([`${side} knee`, `${side}LowerLeg`, 0.05 * S]);
    }
    const tris: Map<string, Uint32Array> = new Map(
      regions.map(([label, bone, radius]): [string, Uint32Array] => {
        const at: V3 = A.joint(rest, bone);
        return [label, A.near(rest, at, at, radius)];
      }),
    );
    for (const [label, request] of Object.entries(POSES)) {
      const skin: HumanAnatomy.ISkin = A.posed(name, request);
      for (const [region] of regions) {
        const t: Uint32Array = tris.get(region)!;
        const deep = A.penetration(skin, t);
        rows.push({
          person: name,
          site: `${label} pose, ${region}: deepest skin inside skin, mm`,
          value: deep.deepest,
          low: 0,
          high: label === "neutral" ? CONTACT : COMPRESSION,
          unit: "mm",
        });
        const tear = strain(rest, skin, t);
        rows.push({ person: name, site: `${label} pose, ${region}: largest principal stretch`, value: tear.stretch, low: 0, high: STRETCH, unit: "x" });
        rows.push({ person: name, site: `${label} pose, ${region}: triangles folded over their neighbours`, value: tear.folded, low: 0, high: 0, unit: "triangles" });
      }
    }
    // Volume of the limbs under full flexion against their volume at neutral.
    const neutral: number = A.volume(A.posed(name, {}));
    for (const [label, request, limbs] of FLEXION) {
      const change: number = A.volume(A.posed(name, request)) - neutral;
      const own: number = limbs.reduce((sum: number, limb: string): number => sum + limbVolume(rest, limb), 0);
      rows.push({
        person: name,
        site: `${label}: body volume change over the flexed limbs' volume`,
        value: Math.abs(change) / own,
        low: 0,
        high: VOLUME,
        unit: "share",
      });
    }
    return Authority.finish(rows);
  }

  /** The poses the pose audit reads. */
  export const POSES: Record<string, IAutoMovieHumanPose> = {
    neutral: {},
    demo: HUMAN_STICKMAN_POSES.demo!,
    limit: HUMAN_STICKMAN_POSES.limit!,
    raised: { arms: { left: { shoulder: { abduction: 179 } }, right: { shoulder: { abduction: 179 } } } },
    flexed: {
      arms: { left: { elbow: { flexion: 147.3 } }, right: { elbow: { flexion: 147.3 } } },
      legs: {
        left: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
        right: { hip: { flexion: 132.1 }, knee: { flexion: 139.8 } },
      },
    },
  };
}

/** Sides of the paired parts. */
const SIDES = ["left", "right"] as const;

/** ISO 20685-1:2018 Table 4 maximum allowable error, large circumferences, mm. */
const LARGE: number = 9;

/** ISO 20685-1:2018 Table 4, small circumferences, mm. */
const SMALL: number = 4;

/** ISO 20685-1:2018 Table 4, head dimensions without hair, mm. */
const HEAD: number = 1;

/** ISO 20685-1:2018 Table 4, hand dimensions, mm. */
const HAND: number = 1;

/** ISO 20685-1:2018 Table 4, foot dimensions, mm. */
const FOOT: number = 2;

/** Sagitta over a 10 mm chord past a 12.5 mm radius that reads as a crease, mm. */
const CREASE: number = 1;

/** Retained engineering proximal bound from the owned crease; no stylion claim, mm. */
const WRIST_PROXIMAL: number = 30;

/** Retained engineering distal bound from the owned crease; clinical identity is separate, mm. */
const WRIST_DISTAL: number = 10;

/** Bulge of the wrist's thumb side over its chord, mm. */
const BULGE: number = 1;

/** Depth two skins may overlap where the joint's flexion presses them, mm. */
const COMPRESSION: number = 10;

/** Depth skin may pass into skin at rest, where nothing presses, mm. */
const CONTACT: number = 1;

/** Principal stretch past the failure strain of skin (0.54 +- 0.17, Annaidh et al. 2012). */
const STRETCH: number = 2;

/** Share of a flexed limb's volume the body may gain or lose. */
const VOLUME: number = 0.05;

/** Poses that flex whole limbs, with the limbs they flex. */
const FLEXION: [string, IAutoMovieHumanPose, string[]][] = [
  ["elbows at full flexion", { arms: { left: { elbow: { flexion: 147.3 } }, right: { elbow: { flexion: 147.3 } } } }, ["leftArm", "rightArm"]],
  [
    "knees at full flexion",
    { legs: { left: { knee: { flexion: 139.8 } }, right: { knee: { flexion: 139.8 } } } },
    ["leftLeg", "rightLeg"],
  ],
];

/** Trunk sites. */
interface ITrunk {
  /** Stature as the skin's highest point, mm. */
  vertex: number;

  /** Crotch height: the lowest point of the midline between the legs, mm. */
  crotch: number;

  /** Section at the bust point. */
  chest: HumanMeasurementSite.IReading;

  /** Section at the inframammary fold. */
  underbust: HumanMeasurementSite.IReading;

  /** Section at the natural waist. */
  waist: HumanMeasurementSite.IReading;

  /** Section midway between waist and hip. */
  highHip: HumanMeasurementSite.IReading;

  /** Section at the buttock prominence. */
  hip: HumanMeasurementSite.IReading;
}

/** Neck sites. */
interface INeck {
  /** Least girth across the neck axis, mm. */
  neck: number;

  /** Girth over cervicale and suprasternale, mm. */
  base: number;

  /** Girth from the base station to the jaw, every 2 mm. */
  profile: number[];

  /** Deepest crease sagitta on the neck's meridians, mm. */
  crease: number;
}

/** Arm sites, one side. */
interface IArm {
  /** Upper arm girth, mm. */
  bicep: number;

  /** Elbow girth, mm. */
  elbow: number;

  /** Forearm maximum girth, mm. */
  forearm: number;

  /** Wrist girth over stylion, mm. */
  wrist: number;

  /** Forearm girth from the elbow to stylion, every 2 mm. */
  forearmProfile: number[];

  /** Where the least girth from the forearm's belly to the knuckles lies, mm from stylion. */
  narrowest: number;

  /** That least girth, mm. */
  least: number;

  /** How far each joint centre lies outside the section through it, mm. */
  outside: Record<string, number>;

  /** Largest bulge of the wrist's thumb side over its chord, mm. */
  radialBulge: number;

  /** Disagreement between two actual readings of the same owned crease plane. */
  creaseMetricError: number;
}

/** Hand sites, one side. */
interface IHand {
  /** Stylion to the middle fingertip, mm. */
  length: number;

  /** Breadth across metacarpals II to V, mm. */
  breadth: number;

  /** Circumference over metacarpals II to V, thumb excluded, mm. */
  circumference: number;

  /** Stylion to the middle finger's base, mm. */
  palm: number;

  /** Thumb's MCP crease to tip, mm. */
  thumb: number;
}

/** Leg sites, one side. */
interface ILeg {
  /** Thigh girth at the gluteal furrow, mm. */
  thigh: number;

  /** Knee girth at mid-patella, mm. */
  knee: number;

  /** Maximum calf girth, mm. */
  calf: number;

  /** Shank girth from the knee down to the ankle's least girth, every 2 mm. */
  shankProfile: number[];

  /** How far the leg's bone axis lies outside the section through it, mm. */
  outside: Record<string, number>;
}

/** Face sites. */
interface IFace {
  /** Head length, mm. */
  length: number;

  /** Head breadth, mm. */
  breadth: number;

  /** Head height, mm. */
  height: number;

  /** Head circumference, mm. */
  circumference: number;

  /** Face height n-gn, mm. */
  faceHeight: number;

  /** Face width zy-zy, mm. */
  faceWidth: number;

  /** Mandibular width go-go, mm. */
  mandibular: number;

  /** Intercanthal width, mm. */
  intercanthal: number;

  /** Palpebral fissures by side. */
  fissure: Record<"left" | "right", { length: number; height: number }>;

  /** Nasal width, mm. */
  noseWidth: number;

  /** Nasal height, mm. */
  noseHeight: number;

  /** Nasal protrusion, mm. */
  noseProtrusion: number;

  /** Mouth width, mm. */
  mouthWidth: number;

  /** Upper vermilion height, mm. */
  upperVermilion: number;

  /** Lower vermilion height, mm. */
  lowerVermilion: number;

  /** Gap between the lips at the midline, mm. */
  lipGap: number;

  /** Widest gap along the mouth's middle half, mm. */
  mouthGap: number;

  /** Tooth points visible from the front. */
  teethSeen: number;

  /** Nasolabial angle, degrees. */
  nasolabial: number;

  /** sn-gn over n-gn. */
  lowerFace: number;

  /** sn-sto over n-gn. */
  upperLip: number;
}

/** An identity row: the measured value equals the input within a tolerance. */
function identity(person: string, site: string, value: number, input: number, tol: number, authority: Authority.Authority = "clinical-identity"): HumanAnatomyAudit.IRow {
  return { person, site, value, low: input - tol, high: input + tol, unit: "mm", authority, status: Number.isFinite(value) ? "measured" : "unavailable", reason: Number.isFinite(value) ? undefined : "The final skin did not yield a finite independent reading at this declared landmark or course." };
}

/** A model goal retains its numeric result without claiming a clinical identity. */
function modelIdentity(person: string, site: string, value: number, input: number, tolerance: number): HumanAnatomyAudit.IRow {
  return identity(person, site, value, input, tolerance, "model-identity");
}

/** A ratio row against a population range. */
function ratio(person: string, site: string, value: number, low: number, high: number): HumanAnatomyAudit.IRow {
  return { person, site, value, low, high, unit: "", authority: "observed-anatomy", status: Number.isFinite(value) ? "measured" : "unavailable" };
}

/** Extent of points along an axis. */
function extent(points: V3[], axis: number): number {
  let lo: number = Infinity;
  let hi: number = -Infinity;
  for (const p of points) {
    lo = Math.min(lo, p[axis]!);
    hi = Math.max(hi, p[axis]!);
  }
  return hi - lo;
}

/** Extent of points along a direction. */
function extentAlong(points: V3[], d: V3): number {
  let lo: number = Infinity;
  let hi: number = -Infinity;
  for (const p of points) {
    const s: number = A.dot(p, d);
    lo = Math.min(lo, s);
    hi = Math.max(hi, s);
  }
  return hi - lo;
}

/**
 * Turns of a profile past its single least value: local minima other than the
 * global one, each counted when it lies deeper than a noise floor below both
 * neighbouring maxima.
 */
function extraTurns(profile: number[], floor: number): number {
  const v: number[] = profile.filter((x: number): boolean => Number.isFinite(x));
  let count: number = 0;
  const minima: number[] = [];
  for (let i: number = 1; i + 1 < v.length; i++) if (v[i]! < v[i - 1]! && v[i]! <= v[i + 1]!) minima.push(i);
  if (minima.length <= 1) return 0;
  let global: number = minima[0]!;
  for (const m of minima) if (v[m]! < v[global]!) global = m;
  for (const m of minima) {
    if (m === global) continue;
    let left: number = v[m]!;
    for (let i: number = m; i >= 0; i--) left = Math.max(left, v[i]!);
    let right: number = v[m]!;
    for (let i: number = m; i < v.length; i++) right = Math.max(right, v[i]!);
    // The rise toward the global minimum is the barrier on that side.
    const toward: number = m < global ? Math.max(...v.slice(m, global + 1)) : Math.max(...v.slice(global, m + 1));
    const other: number = m < global ? left : right;
    if (Math.min(toward, other) - v[m]! > floor) count++;
  }
  return count;
}

/**
 * Deepest crease sagitta inside a chord spanning 5 mm of arc on either side,
 * less the 1 mm sagitta of a 12.5 mm reference radius. Inside faces the axis.
 */
function curveCrease(curve: V3[], origin: V3, axis: V3): number {
  const line: V3[] = resample(curve, 1);
  const depth = (p: V3): number => A.dist(p, A.add(origin, A.scale(axis, A.dot(A.sub(p, origin), axis))));
  let deepest: number = 0;
  for (let i: number = 5; i + 5 < line.length; i++) {
    const a: V3 = line[i - 5]!;
    const b: V3 = line[i + 5]!;
    const m: V3 = line[i]!;
    const chord: V3 = A.lerp(a, b, 0.5);
    const sag: number = A.dist(m, chord) * (depth(m) < depth(chord) ? 1 : -1);
    deepest = Math.max(deepest, sag - 1);
  }
  return deepest;
}

/** Triangles whose height range meets a band, cached per skin and band. */
function band(skin: HumanAnatomy.ISkin, lo: number, hi: number): Uint32Array {
  let sorted: { order: Uint32Array; low: Float64Array } | undefined = bands.get(skin);
  if (sorted === undefined) {
    const n: number = skin.I.length / 3;
    const low: Float64Array = new Float64Array(n);
    const high: Float64Array = new Float64Array(n);
    for (let t: number = 0; t < n; t++) {
      const ys: number[] = [0, 1, 2].map((k: number): number => skin.P[3 * skin.I[3 * t + k]! + 1]!);
      low[t] = Math.min(...ys);
      high[t] = Math.max(...ys);
    }
    const order: Uint32Array = Uint32Array.from({ length: n }, (_: unknown, i: number): number => i).sort(
      (a: number, b: number): number => low[a]! - low[b]!,
    );
    sorted = { order, low };
    bands.set(skin, sorted);
    highs.set(skin, high);
  }
  const high: Float64Array = highs.get(skin)!;
  const out: number[] = [];
  // Triangles are at most a few centimetres tall; start the scan 60 mm low.
  let a: number = 0;
  let b: number = sorted.order.length;
  while (a < b) {
    const m: number = (a + b) >> 1;
    if (sorted.low[sorted.order[m]!]! < lo - 60) a = m + 1;
    else b = m;
  }
  for (let i: number = a; i < sorted.order.length; i++) {
    const t: number = sorted.order[i]!;
    if (sorted.low[t]! > hi) break;
    if (high[t]! >= lo) out.push(t);
  }
  return Uint32Array.from(out);
}

const bands: WeakMap<HumanAnatomy.ISkin, { order: Uint32Array; low: Float64Array }> = new WeakMap();
const highs: WeakMap<HumanAnatomy.ISkin, Float64Array> = new WeakMap();
const trunks: WeakMap<HumanAnatomy.ISkin, ITrunk> = new WeakMap();

/** Read owned trunk addresses on the independently assembled skin. */
function trunkSites(skin: HumanAnatomy.ISkin, S: number): ITrunk {
  const found: ITrunk | undefined = trunks.get(skin);
  if (found !== undefined) return found;
  let vertex: number = -Infinity;
  for (let v: number = 1; v < skin.P.length; v += 3) vertex = Math.max(vertex, skin.P[v]!);

  // Crotch and stature remain independent observations of the complete skin.
  const hip: V3 = A.joint(skin, "hips");
  let crotch: number = Infinity;
  for (const line of A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.3 * S, hip[1])))
    for (const point of line.points)
      if (point[1] > 0.3 * S && point[1] < hip[1]) crotch = Math.min(crotch, point[1]);
  const out: ITrunk = {
    vertex,
    crotch,
    chest: HumanMeasurementSite.named(skin, "chest"),
    underbust: HumanMeasurementSite.named(skin, "underbust"),
    waist: HumanMeasurementSite.named(skin, "waist"),
    highHip: HumanMeasurementSite.named(skin, "highHip"),
    hip: HumanMeasurementSite.named(skin, "hip"),
  };
  trunks.set(skin, out);
  return out;
}

/** Named neck tapes plus a complete independent surface-health survey. */
function neckSites(skin: HumanAnatomy.ISkin, S: number): INeck {
  const neckRead: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, "neck");
  const baseRead: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, "neckBase");
  const base: V3 = Number.isFinite(baseRead.origin[1]) ? baseRead.origin : A.joint(skin, "neck");
  const top: V3 = A.joint(skin, "head");
  const axis: V3 = A.unit(A.sub(top, base));
  const length: number = A.dist(base, top);
  const region: Uint32Array = A.near(skin, A.sub(base, A.scale(axis, 0.05 * S)), top, 0.12 * S);
  const profile: number[] = [];
  let least: number = Infinity;
  let middle: number = length / 2;
  for (let station: number = 0; station <= length; station += 2) {
    const origin: V3 = A.add(base, A.scale(axis, station));
    const section: HumanAnatomy.ICut | null = A.cut(skin, origin, axis, origin, region);
    const girth: number = section === null ? NaN : section.girth;
    profile.push(girth);
    if (girth < least) { least = girth; middle = station; }
  }
  // Creases across the neck: meridians every 15 degrees about the axis.
  // Creases across the neck: the skin's curve in twelve planes through the
  // neck's axis (24 meridians), from the shoulders to 20 mm past the least
  // girth, short of the turn under the jaw.
  const [u, w] = A.basis(axis);
  let crease: number = 0;
  for (let k: number = 0; k < 12; k++) {
    const dir: V3 = A.add(A.scale(u, Math.cos((k * Math.PI) / 12)), A.scale(w, Math.sin((k * Math.PI) / 12)));
    const plane: V3 = A.unit(A.cross(axis, dir));
    for (const line of A.polylines(skin, A.add(base, A.scale(plane, 1e-3)), plane, region))
      for (const sign of [1, -1]) {
        // The meridian on one side of the axis, between the neck's base station
        // and the head joint, split where it leaves that span.
        let run: V3[] = [];
        const flush = (): void => {
          if (run.length > 10) crease = Math.max(crease, curveCrease(run, base, axis));
          run = [];
        };
        for (const p of line.points) {
          const q: V3 = A.sub(p, base);
          const s: number = A.dot(q, axis);
          if (sign * A.dot(q, dir) > 0 && s > -0.04 * S && s < middle + 20) run.push(p);
          else flush();
        }
        flush();
      }
  }
  return { neck: neckRead.girth, base: baseRead.girth, profile, crease };
}

/** Locate an arm's sites at the bind. */
function armSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): IArm {
  const shoulder: V3 = A.joint(skin, `${side}UpperArm`);
  const elbow: V3 = A.joint(skin, `${side}LowerArm`);
  const wrist: V3 = A.joint(skin, `${side}Hand`);
  const upper: V3 = A.unit(A.sub(elbow, shoulder));
  const fore: V3 = A.unit(A.sub(wrist, elbow));
  const lf: number = A.dist(elbow, wrist);
  const region: Uint32Array = A.armRegion(skin, side);
  const planes: Map<V3, (origin: V3, pick?: V3) => HumanAnatomy.ICut | null> = new Map();
  const cut: (o: V3, n: V3) => HumanAnatomy.ICut | null = (o: V3, n: V3): HumanAnatomy.ICut | null => {
    let plane: ((origin: V3, pick?: V3) => HumanAnatomy.ICut | null) | undefined = planes.get(n);
    if (plane === undefined) {
      plane = A.parallel(skin, n, region);
      planes.set(n, plane);
    }
    return plane(o);
  };
  const girth = (o: V3, n: V3): number => {
    const c: HumanAnatomy.ICut | null = cut(o, n);
    return c === null ? NaN : c.girth;
  };
  // The owner names model attachment, joint and crease sections. Animation
  // origins are not relabelled clinical acromion, olecranon or stylion.
  const bicep: number = HumanMeasurementSite.named(skin, `${side}.upperArm`, region).girth;
  const elbowGirth: number = HumanMeasurementSite.named(skin, `${side}.elbow`, region).girth;
  const wristRead: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, `${side}.wrist`, region);
  const forearmProfile: number[] = [];
  const muscle: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, `${side}.forearm`, region);
  const forearm: number = muscle.girth;
  for (let s: number = 0; s <= lf; s += 2) {
    const g: number = girth(A.add(elbow, A.scale(fore, s)), fore);
    forearmProfile.push(g);
  }
  const wristGirth: number = wristRead.girth;

  // Minimum and thumb-side health use one complete physically owned family.
  // Changing plane obliquity halfway through a profile can create a false bulge.
  const transition: Measurement.ISite["geometry"] | undefined = skin.measurementSites?.[`${side}.wristTransition`]?.geometry;
  const family: HumanPlanePath.IResult = transition?.kind === "plane-path" ? HumanPlanePath.read(skin, transition, region) : { samples: [], reason: "No physical wrist plane family is published." };
  const least: { station: number; girth: number } = family.least ?? { station: NaN, girth: NaN };
  const radialBulge: number = HumanPlanePath.bulge(family.samples);
  const off = (o: V3, n: V3): number => cut(o, n)?.outside ?? NaN;
  return {
    bicep,
    elbow: elbowGirth,
    forearm,
    wrist: wristGirth,
    forearmProfile,
    narrowest: least.station,
    least: least.girth,
    radialBulge,
    creaseMetricError: family.crease === undefined ? NaN : Math.abs(wristGirth - family.crease.girth),
    outside: {
      elbow: off(elbow, A.unit(A.add(upper, fore))),
      wrist: off(wrist, fore),
      "mid-forearm": off(A.lerp(elbow, wrist, 0.5), fore),
      "mid-upper-arm": off(A.lerp(shoulder, elbow, 0.5), upper),
    },
  };
}

/** Locate a hand's sites at the neutral pose. */
function handSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): IHand {
  const wrist: V3 = A.joint(skin, `${side}Hand`);
  const mcp3: V3 = A.joint(skin, `${side}MiddleProximal`);
  const mcp2: V3 = A.joint(skin, `${side}IndexProximal`);
  const mcp5: V3 = A.joint(skin, `${side}LittleProximal`);
  const thumbMcp: V3 = A.joint(skin, `${side}ThumbProximal`);
  const thumbIp: V3 = A.joint(skin, `${side}ThumbDistal`);
  const axis: V3 = A.unit(A.sub(mcp3, wrist));
  // The model's Hand origin is its owned crease centre, not WJC minus a
  // population-mean offset to an unobserved bony crease.
  const crease: V3 = wrist;
  const middle: V3[] = A.vertices(skin, new RegExp(`^finger\\.${side}\\.middle`));
  const length: number = Math.max(...middle.map((p: V3): number => A.dot(A.sub(p, crease), axis)));
  const across: V3 = A.unit(A.sub(mcp5, mcp2));
  const normal: V3 = A.unit(A.reject(axis, across));
  const palmTris: Uint32Array = A.triangles(skin, new RegExp(`^(hand|finger)\\.${side}`));
  const knuckles: HumanAnatomy.ICut | null = A.cut(skin, A.lerp(mcp2, mcp5, 0.5), normal, mcp3, palmTris);
  // Palm length: crease to the station where the middle finger parts from both
  // neighbours, the web level its base crease lies on.
  const tip = (finger: string): V3 => A.joint(skin, `${side}${finger}Distal`);
  const base = (finger: string): V3 => A.joint(skin, `${side}${finger}Proximal`);
  const along = (finger: string, s: number): V3 => {
    const a: V3 = base(finger);
    const b: V3 = tip(finger);
    const d: V3 = A.unit(A.sub(b, a));
    const k: number = (s - A.dot(A.sub(a, crease), axis)) / A.dot(d, axis);
    return A.add(a, A.scale(d, k));
  };
  let palm: number = NaN;
  for (let s: number = A.dot(A.sub(mcp3, crease), axis); s < length; s += 0.5) {
    const o: V3 = A.add(crease, A.scale(axis, s));
    const parts = A.polylines(skin, o, axis, palmTris);
    const owner = (q: V3): number => {
      let best: number = -1;
      let d: number = Infinity;
      parts.forEach((part, k: number): void => {
        for (const p of part.points) {
          const e: number = A.dist(p, q);
          if (e < d) {
            d = e;
            best = k;
          }
        }
      });
      return best;
    };
    const m: number = owner(along("Middle", s));
    if (m !== owner(along("Index", s)) && m !== owner(along("Ring", s))) {
      palm = s;
      break;
    }
  }
  const thumbAxis: V3 = A.unit(A.sub(thumbIp, thumbMcp));
  const thumbs: V3[] = A.vertices(skin, new RegExp(`^thumb\\.${side}`));
  const thumb: number = Math.max(...thumbs.map((p: V3): number => A.dot(A.sub(p, thumbMcp), thumbAxis)));
  return {
    length,
    breadth: knuckles === null ? NaN : extentAlong(knuckles.points, across),
    circumference: knuckles === null ? NaN : knuckles.girth,
    palm,
    thumb,
  };
}

/** Locate a leg's sites at the bind. */
function legSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): ILeg {
  const hip: V3 = A.joint(skin, `${side}UpperLeg`);
  const knee: V3 = A.joint(skin, `${side}LowerLeg`);
  const ankle: V3 = A.joint(skin, `${side}Foot`);
  const thighAxis: V3 = A.unit(A.sub(knee, hip));
  const axisAt = (y: number): V3 =>
    y >= knee[1] ? A.lerp(hip, knee, (hip[1] - y) / (hip[1] - knee[1])) : A.lerp(knee, ankle, (knee[1] - y) / (knee[1] - ankle[1]));
  const horizontal = (y: number): HumanAnatomy.ICut | null => A.cut(skin, [0, y, 0], [0, 1, 0], axisAt(y), band(skin, y - 1, y + 1));
  const region: Uint32Array = A.triangles(skin, new RegExp(`^(leg\\.${side}(?:\\.|$)|trunk$)`));
  const thigh: number = HumanMeasurementSite.named(skin, `${side}.thigh`, region).girth;
  const kneeGirth: number = HumanMeasurementSite.named(skin, `${side}.knee`, region).girth;
  const calf: number = HumanMeasurementSite.named(skin, `${side}.calf`, region).girth;

  // The whole shank profile remains visible to the health check, including
  // both joint transitions excluded from the muscle-only maximum domain.
  const shankProfile: number[] = [];
  for (let y: number = knee[1]; y >= ankle[1] + 20; y -= 2) {
    const section: HumanAnatomy.ICut | null = horizontal(y);
    shankProfile.push(section === null ? NaN : section.girth);
  }
  let lowest: number = shankProfile.length - 1;
  for (let i: number = 0; i < shankProfile.length; i++) if (shankProfile[i]! < shankProfile[lowest]!) lowest = i;
  const off = (o: V3, n: V3): number => A.cut(skin, o, n, o, A.near(skin, hip, ankle, 150))?.outside ?? NaN;
  return {
    thigh,
    knee: kneeGirth,
    calf,
    shankProfile: shankProfile.slice(0, lowest + 1),
    outside: {
      knee: off(knee, A.unit(A.add(thighAxis, A.unit(A.sub(ankle, knee))))),
      "mid-thigh": off(A.lerp(hip, knee, 0.5), thighAxis),
      "mid-shank": off(A.lerp(knee, ankle, 0.5), A.unit(A.sub(ankle, knee))),
    },
  };
}

/** Foot length and breadth along the footprint's principal axis, at the neutral pose. */
function footSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): { length: number; breadth: number } {
  const points: V3[] = A.vertices(skin, new RegExp(`^(foot|forefoot|toe)\\.${side}`));
  const print: V3[] = points.filter((p: V3): boolean => p[1] < 15);
  const mx: number = print.reduce((s: number, p: V3): number => s + p[0], 0) / print.length;
  const mz: number = print.reduce((s: number, p: V3): number => s + p[2], 0) / print.length;
  let xx: number = 0;
  let xz: number = 0;
  let zz: number = 0;
  for (const p of print) {
    xx += (p[0] - mx) ** 2;
    xz += (p[0] - mx) * (p[2] - mz);
    zz += (p[2] - mz) ** 2;
  }
  const angle: number = 0.5 * Math.atan2(2 * xz, xx - zz);
  const along: V3 = [Math.cos(angle), 0, Math.sin(angle)];
  const across: V3 = [-Math.sin(angle), 0, Math.cos(angle)];
  return { length: extentAlong(points, along), breadth: extentAlong(points, across) };
}

/** Breadth of all skin in a height band. */
function breadth(skin: HumanAnatomy.ISkin, lo: number, hi: number): number {
  let a: number = Infinity;
  let b: number = -Infinity;
  for (let v: number = 0; v < skin.P.length; v += 3) {
    const y: number = skin.P[v + 1]!;
    if (y < lo || y > hi) continue;
    a = Math.min(a, skin.P[v + 2]!);
    b = Math.max(b, skin.P[v + 2]!);
  }
  return b - a;
}

/** Locate the face's landmarks by their Farkas and FaceBase definitions. */
function faceSites(skin: HumanAnatomy.ISkin, S: number): IFace {
  // Openings: the mouth spans the midline lowest, the eyes are the two highest
  // off it.
  const loops: V3[][] = A.openings(skin);
  const centre = (l: V3[]): V3 => A.scale(l.reduce((s: V3, p: V3): V3 => A.add(s, p), [0, 0, 0]), 1 / l.length);
  const mouthLoop: V3[] | undefined = loops
    .filter((l: V3[]): boolean => Math.min(...l.map((p: V3): number => p[2])) < 0 && Math.max(...l.map((p: V3): number => p[2])) > 0)
    .sort((a: V3[], b: V3[]): number => centre(a)[1] - centre(b)[1])[0];
  const eyes: V3[][] = (skin.eyelids ?? []).map((lid: AutoMovieHumanEyelid.ILid): V3[] => lid.samples.map((sample: AutoMovieHumanEyelid.ISample): V3 => sample.contact));
  const diameter: (points: V3[]) => [V3, V3] = (points: V3[]): [V3, V3] => {
    let best: [V3, V3] = [points[0]!, points[0]!];
    for (const a of points) for (const b of points)
      if (A.dist(a, b) > A.dist(best[0], best[1])) best = [a, b];
    return best;
  };
  const lines = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.78 * S, S + 10));
  // Walk the median profile from the vertex forward and down the face. An
  // opening of the mouth across the midline ends that walk at the upper lip;
  // the walk then resumes from the lower lip's end of the nearest other curve.
  let top: V3 = [0, -Infinity, 0];
  let topLine: { points: V3[]; closed: boolean } = lines[0]!;
  let topIdx: number = 0;
  for (const l of lines)
    l.points.forEach((p: V3, i: number): void => {
      if (p[1] > top[1]) {
        top = p;
        topLine = l;
        topIdx = i;
      }
    });
  const floor: number = top[1] - 0.2 * S;
  const walk = (line: { points: V3[]; closed: boolean }, start: number, dir: 1 | -1): { points: V3[]; open: boolean } => {
    const n: number = line.points.length;
    const out: V3[] = [];
    for (let k: number = 0; k < n; k++) {
      const i: number = start + dir * k;
      if (!line.closed && (i < 0 || i >= n)) return { points: out, open: true };
      const p: V3 = line.points[((i % n) + n) % n]!;
      out.push(p);
      if (p[1] < floor) break;
    }
    return { points: out, open: false };
  };
  const tp: V3[] = topLine.points;
  const forward: 1 | -1 =
    tp[(topIdx + 1) % tp.length]![0] > tp[(topIdx - 1 + tp.length) % tp.length]![0] ? 1 : -1;
  const down = walk(topLine, topIdx, forward);
  let up: V3[];
  let lo: V3[];
  let eUp: V3;
  let eLo: V3;
  const last: V3 = down.points[down.points.length - 1]!;
  if (down.open && last[1] > floor) {
    let lowerLine: V3[] = [];
    let gap: number = Infinity;
    for (const l of lines) {
      if (l === topLine) continue;
      for (const [k, p] of [l.points[0]!, l.points[l.points.length - 1]!].entries()) {
        const d: number = A.dist(p, last);
        if (d < gap) {
          gap = d;
          lowerLine = k === 0 ? l.points : [...l.points].reverse();
        }
      }
    }
    const upper: V3[] = resample(down.points, 0.5);
    up = [...upper].reverse();
    lo = resample(lowerLine.filter((p: V3): boolean => p[1] > floor), 0.5);
    eUp = upper[upper.length - 1]!;
    eLo = lo[0] ?? eUp;
  } else {
    // The lips meet on the midline: stomion is the labial fissure's crease,
    // the sharpest notch (the profile behind the chord of its neighbours 2 mm
    // of arc either side) from 4 to 35 mm below subnasale. The labiomental
    // fold is broad, so it never out-notches the fissure.
    const d: V3[] = resample(down.points, 0.5);
    let p0: number = 0;
    for (let i: number = 0; i < d.length; i++) if (d[i]![0] > d[p0]![0]) p0 = i;
    const s0: number = subnasale(d, p0, 1);
    const notch = (i: number): number => (d[i - 4]![0] + d[i + 4]![0]) / 2 - d[i]![0];
    let st: number = s0 + 8;
    for (let i: number = s0 + 8; i < Math.min(d.length - 4, s0 + 70); i++) if (notch(i) > notch(st)) st = i;
    up = d.slice(0, st + 1).reverse();
    lo = d.slice(st);
    eUp = d[st]!;
    eLo = d[st]!;
  }
  // Upward from the lip: pronasale the most anterior point before the vertex.
  let vertexIdx: number = 0;
  for (let i: number = 0; i < up.length; i++) if (up[i]![1] > up[vertexIdx]![1]) vertexIdx = i;
  let prn: number = 0;
  for (let i: number = 0; i < vertexIdx; i++) if (up[i]![0] > up[prn]![0]) prn = i;
  // Walking up from the lip the body lies behind, on the walker's left, so a
  // concave corner turns right (negative).
  const sn: number = subnasale(up, prn, -1);
  // Labrale superius: the upper lip's most prominent point between stomion
  // and subnasale.
  let ls: number = 0;
  for (let i: number = 0; i < sn; i++) if (up[i]![0] > up[ls]![0]) ls = i;
  // Glabella: the forehead's most prominent point within 45 mm above the eye
  // openings' centre; nasion: the deepest point between it and pronasale.
  const eyeLevel: number = eyes.length === 0 ? up[prn]![1] + 40 : eyes.reduce((s: number, e: V3[]): number => s + centre(e)[1], 0) / eyes.length;
  let g: number = vertexIdx;
  for (let i: number = prn; i < vertexIdx; i++)
    if (up[i]![1] >= eyeLevel && up[i]![1] <= eyeLevel + 45 && (g === vertexIdx || up[i]![0] > up[g]![0])) g = i;
  let n: number = prn;
  for (let i: number = prn; i < g; i++) if (up[i]![0] < up[n]![0]) n = i;
  const glabella: V3 = up[g]!;
  let op: V3 = glabella;
  for (const p of topLine.points) if (p[1] > glabella[1] - 60 && A.dist(p, glabella) > A.dist(op, glabella)) op = p;
  // Downward from the lower lip: labrale inferius the lip's most prominent
  // point in its first 12 mm; gnathion the chin's support point toward the
  // front and down within 60 mm; menton the lowest point within 40 mm past
  // gnathion.
  let li: number = 0;
  for (let i: number = 0; i < Math.min(lo.length, 24); i++) if (lo[i]![0] > lo[li]![0]) li = i;
  let gn: number = li;
  for (let i: number = li; i < Math.min(lo.length, li + 120); i++) if (lo[i]![0] - lo[i]![1] > lo[gn]![0] - lo[gn]![1]) gn = i;
  let me: number = gn;
  for (let i: number = gn; i < Math.min(lo.length, gn + 80); i++) if (lo[i]![1] < lo[me]![1]) me = i;
  const sto: V3 = A.lerp(eUp, eLo, 0.5);

  // Colour borders locate ls/li; the independent final median skin supplies depth.
  const vermilion: HumanVermilionMeasurements.IReading = HumanVermilionMeasurements.read(skin.vermilion ?? [], lines.map((line): V3[] => line.points), sto);
  const fissure: Record<"left" | "right", { length: number; height: number }> = {
    left: { length: NaN, height: NaN },
    right: { length: NaN, height: NaN },
  };
  const canthi: Record<"left" | "right", V3> = { left: [NaN, NaN, NaN], right: [NaN, NaN, NaN] };
  // The recessed trim loop is a skin assembly boundary. Farkas en/ex belong
  // to the visible lid contact margin, owned by the actual eyelid consumer.
  for (const lid of skin.eyelids ?? []) {
    const side: "left" | "right" = lid.name === "eye.left" ? "left" : "right";
    fissure[side] = HumanEyelidMeasurements(lid);
    canthi[side] = lid.samples[lid.medial]!.contact;
  }
  let mouthWidth: number = NaN;
  let mouthGap: number = 0;
  if (mouthLoop === undefined) {
    // Closed lips: the corners are where the labial fissure's crease ends.
    // Sagittal planes outward from the midline cut the lips; the fissure is
    // the deepest notch within 8 mm of stomion's height, and the crease has
    // ended where that notch sits less than 0.3 mm inside its 4 mm chord.
    let width: number = 0;
    for (const side of [1, -1]) {
      let reach: number = NaN;
      for (let c: number = 0.5; c <= 45; c += 0.5) {
        const near: Uint32Array = band(skin, eUp[1] - 10, eUp[1] + 10);
        let notch: number = 0;
        for (const line of A.polylines(skin, [0, 0, side * c], [0, 0, 1], near)) {
          const pts: V3[] = resample(line.points, 0.5);
          for (let i: number = 4; i + 4 < pts.length; i++) {
            const p: V3 = pts[i]!;
            if (Math.abs(p[1] - eUp[1]) > 8 || p[0] < eUp[0] - 20) continue;
            notch = Math.max(notch, (pts[i - 4]![0] + pts[i + 4]![0]) / 2 - p[0]);
          }
        }
        if (notch < 0.3) break;
        reach = c;
      }
      width += reach;
    }
    mouthWidth = width;
  } else {
    mouthGap = NaN;
    const [a, b] = diameter(mouthLoop);
    mouthWidth = A.dist(a, b);
    mouthGap = 0;
    for (let z: number = -mouthWidth / 4; z <= mouthWidth / 4; z += 0.5) {
      const ys: number[] = mouthLoop.filter((p: V3): boolean => Math.abs(p[2] - z) < 0.5).map((p: V3): number => p[1]);
      if (ys.length >= 2) mouthGap = Math.max(mouthGap, Math.max(...ys) - Math.min(...ys));
    }
  }
  // Ears: the auricle's chains; tragion at the auricle's front, at its middle
  // height, where the tragus stands.
  const ears: V3[] = A.vertices(skin, /^ear\./);
  let earLow: number = Infinity;
  let earTop: number = -Infinity;
  let earFront: number = -Infinity;
  for (const p of ears) {
    earLow = Math.min(earLow, p[1]);
    earTop = Math.max(earTop, p[1]);
    earFront = Math.max(earFront, p[0]);
  }
  const tragion: V3 = [earFront, (earLow + earTop) / 2, 0];
  const headPoints: V3[] = A.vertices(skin, /^head/);
  const widest = (keep: (p: V3) => boolean): number => {
    const rows: Map<number, [number, number]> = new Map();
    for (const p of headPoints) {
      if (!keep(p)) continue;
      const k: number = Math.round(p[1]);
      const r: [number, number] = rows.get(k) ?? [Infinity, -Infinity];
      rows.set(k, [Math.min(r[0], p[2]), Math.max(r[1], p[2])]);
    }
    let best: number = 0;
    for (const [lo2, hi2] of rows.values()) best = Math.max(best, hi2 - lo2);
    return best;
  };
  const eyeLow: number = Math.min(...eyes.flatMap((e: V3[]): number[] => e.map((p: V3): number => p[1])));
  // Zygion: the widest face over the arches, in front of the tragion and
  // between its height and the lower lids. Gonion: the widest lower face from
  // menton to stomion within 40 mm in front of the tragion. Eurion: the widest
  // vault above the auricles, clear of their roots.
  const faceWidth: number = widest((p: V3): boolean => p[0] > tragion[0] + 10 && p[1] < eyeLow && p[1] > tragion[1] - 5);
  const mandibular: number = widest(
    (p: V3): boolean => p[0] > tragion[0] - 10 && p[0] < tragion[0] + 40 && p[1] < sto[1] && p[1] > lo[me]![1],
  );
  const breadthHead: number = widest((p: V3): boolean => p[1] > earTop + 3);
  // Head circumference: the plane through glabella and opisthocranion, across.
  const across: V3 = A.unit(A.cross(A.sub(op, glabella), [0, 0, 1]));
  const ring: HumanAnatomy.ICut | null = A.cut(skin, glabella, across, A.lerp(glabella, op, 0.5), A.triangles(skin, /^head/));
  // Nose width: on horizontal cuts from subnasale up, the last point of each
  // side before the contour's concave turn onto the cheek.
  const snP: V3 = up[sn]!;
  const prnP: V3 = up[prn]!;
  let noseWidth: number = 0;
  for (let y: number = snP[1] - 1; y <= snP[1] + 0.4 * (prnP[1] - snP[1] + 15); y += 0.5) {
    const tris: Uint32Array = band(skin, y - 1, y + 1);
    const parts = A.polylines(skin, [0, y, 0], [0, 1, 0], tris);
    let left: number = NaN;
    let right: number = NaN;
    for (const part of parts) {
      const pts: V3[] = part.points.filter((p: V3): boolean => p[0] > snP[0] - 25 && Math.abs(p[2]) < 35);
      if (pts.length < 10) continue;
      for (const sign of [1, -1]) {
        const half: V3[] = pts.filter((p: V3): boolean => p[2] * sign > 0).sort((a: V3, b: V3): number => sign * (a[2] - b[2]));
        const line: V3[] = resample(half, 0.25);
        let groove: number = -1;
        let deepest: number = 0;
        for (let i: number = 4; i + 4 < line.length; i++) {
          if (Math.abs(line[i]![2]) < 5) continue;
          // Concave corner of the frontal contour: the point sits behind the
          // chord of its neighbours.
          const sag: number = (line[i - 4]![0] + line[i + 4]![0]) / 2 - line[i]![0];
          if (sag > deepest) {
            deepest = sag;
            groove = i;
          }
        }
        if (groove >= 0) {
          const z: number = line[groove]![2];
          if (sign > 0) left = Number.isNaN(left) ? z : Math.max(left, z);
          else right = Number.isNaN(right) ? z : Math.min(right, z);
        }
      }
    }
    if (!Number.isNaN(left) && !Number.isNaN(right)) noseWidth = Math.max(noseWidth, left - right);
  }
  // Teeth seen from the front through the mouth's opening.
  // Skin closed over the mouth hides whatever lies behind it.
  const teethSeen: number = mouthLoop === undefined ? 0 : teeth(skin, sto[1] - 40, sto[1] + 40);
  // Nasolabial angle at subnasale: columella tangent against the upper lip's.
  const colum: V3 = A.unit(A.sub(up[Math.min(prn, sn + 10)]!, snP));
  const lip: V3 = A.unit(A.sub(up[Math.max(0, ls)]!, snP));
  const nasolabial: number = (Math.acos(Math.max(-1, Math.min(1, A.dot(colum, lip)))) * 180) / Math.PI;
  const nasion: V3 = up[n]!;
  const gnathion: V3 = lo[gn]!;
  return {
    length: A.dist(glabella, op),
    breadth: breadthHead,
    height: top[1] - lo[me]![1],
    circumference: ring === null ? NaN : ring.girth,
    faceHeight: A.dist(nasion, gnathion),
    faceWidth,
    mandibular,
    intercanthal: A.dist(canthi.left, canthi.right),
    fissure,
    noseWidth,
    noseHeight: A.dist(nasion, snP),
    noseProtrusion: A.dist(snP, prnP),
    mouthWidth,
    upperVermilion: vermilion.upper,
    lowerVermilion: vermilion.lower,
    lipGap: A.dist(eUp, eLo),
    mouthGap,
    teethSeen,
    nasolabial,
    lowerFace: A.dist(snP, gnathion) / A.dist(nasion, gnathion),
    upperLip: A.dist(snP, sto) / A.dist(nasion, gnathion),
  };
}

/**
 * Subnasale on a median profile sampled every 0.5 mm, the apex of the
 * nasolabial angle: walking from pronasale toward the lips, the sharpest
 * concave turn over 2 mm of arc before the deepest point the walk reaches ere
 * the profile comes forward again by 1.5 mm onto the upper lip. That hollow
 * bounds the search, so the labial fissure beyond it never competes.
 *
 * @param step +1 or -1, the index direction from pronasale toward the lips.
 */
function subnasale(line: V3[], prn: number, step: 1 | -1): number {
  let deepest: number = prn;
  for (let i: number = prn; i >= 0 && i < line.length; i += step) {
    if (line[i]![0] < line[deepest]![0]) deepest = i;
    else if (line[i]![0] > line[deepest]![0] + 1.5) break;
  }
  // Walking toward the lips (down), the body lies on the walker's right, so a
  // concave corner turns left: a positive cross product.
  const turn = (i: number): number => {
    const a: V3 = line[i - 4 * step]!;
    const b: V3 = line[i]!;
    const c: V3 = line[i + 4 * step]!;
    const t1: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const t2: [number, number] = [c[0] - b[0], c[1] - b[1]];
    return Math.atan2(t1[0] * t2[1] - t1[1] * t2[0], t1[0] * t2[0] + t1[1] * t2[1]);
  };
  let best: number = deepest;
  let sharpest: number = -Infinity;
  for (let i: number = prn + 4 * step; step * (i - deepest) <= 0; i += step) {
    if (i - 4 < 0 || i + 4 >= line.length) continue;
    const t: number = turn(i);
    if (t > sharpest) {
      sharpest = t;
      best = i;
    }
  }
  return best;
}

/** Resample a polyline at an even step. */
function resample(line: V3[], step: number): V3[] {
  if (line.length < 2) return [...line];
  const out: V3[] = [line[0]!];
  let carry: number = 0;
  for (let i: number = 0; i + 1 < line.length; i++) {
    const a: V3 = line[i]!;
    const b: V3 = line[i + 1]!;
    const len: number = A.dist(a, b);
    let s: number = step - carry;
    while (s <= len) {
      out.push(A.lerp(a, b, s / len));
      s += step;
    }
    carry = len - (s - step);
  }
  return out;
}

/** Tooth points no skin hides from the front: rays forward from each meet no skin. */
function teeth(skin: HumanAnatomy.ISkin, lo: number, hi: number): number {
  const person: HumanPeople.IRigged = HumanPeople.rigged(skin.name);
  const mouth = person.body.mouth;
  const aperture = person.body.apertures.find((a): boolean => a.name === "mouth");
  if (mouth === undefined || aperture === undefined) return NaN;
  const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(person.body, []);
  let interior: AutoMovieHumanOralCavity.IOutput;
  try {
    interior = AutoMovieHumanOralCavity.generate(surface.mesh, mouth, aperture, 1);
  } catch {
    // A mouth whose interior cannot be built shows nothing to count; the row
    // then fails as unmeasured instead of hiding the head's other rows.
    return NaN;
  }
  let seen: number = 0;
  for (const part of interior.parts) {
    if (part.geometry.type !== "mesh" || !/tooth|teeth|incisor|molar/i.test(part.id)) continue;
    const P: number[] = part.geometry.mesh.positions;
    for (let v: number = 0; v < P.length; v += 3) {
      const p: V3 = [P[v]!, P[v + 1]!, P[v + 2]!];
      if (p[1] < lo || p[1] > hi) continue;
      if (A.ray(skin, p, 0, 1).crossings === 0) seen++;
    }
  }
  return seen;
}

/**
 * Mirror symmetry of skin built from inputs the two sides share: each vertex of
 * the chains, reflected across the median plane, against the nearest skin.
 */
function symmetry(name: string, skin: HumanAnatomy.ISkin, chains: RegExp, label: string): HumanAnatomyAudit.IRow[] {
  const points: V3[] = A.vertices(skin, chains)
    .filter((_: V3, i: number): boolean => i % 4 === 0)
    .map((p: V3): V3 => [p[0], p[1], -p[2]]);
  const d: number[] = A.distances(skin, points, 6);
  let worst: number = 0;
  for (const x of d) if (Number.isFinite(x)) worst = Math.max(worst, x);
  return [{ person: name, site: `${label}: mirror image off the other side's skin, mm`, value: worst, low: 0, high: MIRROR, unit: "mm", authority: "observed-anatomy", status: Number.isFinite(worst) ? "measured" : "unavailable" }];
}

/** Mirror distance that reads as an asymmetry, mm. */
const MIRROR: number = 0.5;

/**
 * Principal stretch and fold of a region's triangles between the bind and a
 * pose: the larger singular value of each triangle's in-plane map, and
 * triangles whose posed normal turns more than 120 degrees from its edge
 * neighbours' while it lay within 60 at the bind.
 */
function strain(rest: HumanAnatomy.ISkin, posed: HumanAnatomy.ISkin, region: Uint32Array): { stretch: number; folded: number } {
  let stretch: number = 0;
  const normal = (skin: HumanAnatomy.ISkin, t: number): V3 => {
    const a: V3 = A.point(skin, skin.I[3 * t]!);
    return A.unit(A.cross(A.sub(A.point(skin, skin.I[3 * t + 1]!), a), A.sub(A.point(skin, skin.I[3 * t + 2]!), a)));
  };
  const inRegion: Set<number> = new Set(region);
  const edgeOwner: Map<number, number[]> = new Map();
  const n: number = rest.P.length / 3;
  for (const t of region)
    for (let e: number = 0; e < 3; e++) {
      const a: number = rest.I[3 * t + e]!;
      const b: number = rest.I[3 * t + ((e + 1) % 3)]!;
      const k: number = Math.min(a, b) * n + Math.max(a, b);
      const list: number[] = edgeOwner.get(k) ?? [];
      list.push(t);
      edgeOwner.set(k, list);
    }
  for (const t of region) {
    const r: V3[] = [0, 1, 2].map((k: number): V3 => A.point(rest, rest.I[3 * t + k]!));
    const q: V3[] = [0, 1, 2].map((k: number): V3 => A.point(posed, posed.I[3 * t + k]!));
    const e1: V3 = A.sub(r[1]!, r[0]!);
    const e2: V3 = A.sub(r[2]!, r[0]!);
    const f1: V3 = A.sub(q[1]!, q[0]!);
    const f2: V3 = A.sub(q[2]!, q[0]!);
    // Rest frame in the triangle's plane.
    const u: V3 = A.unit(e1);
    const w: V3 = A.unit(A.reject(e2, u));
    const R: number[] = [A.dot(e1, u), A.dot(e2, u), A.dot(e1, w), A.dot(e2, w)];
    const det: number = R[0]! * R[3]! - R[1]! * R[2]!;
    if (Math.abs(det) < 1e-9) continue;
    const inv: number[] = [R[3]! / det, -R[1]! / det, -R[2]! / det, R[0]! / det];
    // Deformation F = [f1 f2] inv(R), a 3x2 map; its Gram matrix gives the stretches.
    const c1: V3 = A.add(A.scale(f1, inv[0]!), A.scale(f2, inv[2]!));
    const c2: V3 = A.add(A.scale(f1, inv[1]!), A.scale(f2, inv[3]!));
    const a11: number = A.dot(c1, c1);
    const a12: number = A.dot(c1, c2);
    const a22: number = A.dot(c2, c2);
    const tr: number = a11 + a22;
    const disc: number = Math.sqrt(Math.max(0, (a11 - a22) ** 2 / 4 + a12 * a12));
    stretch = Math.max(stretch, Math.sqrt(tr / 2 + disc));
  }
  let folded: number = 0;
  for (const t of region) {
    const neighbours: number[] = [];
    for (let e: number = 0; e < 3; e++) {
      const a: number = rest.I[3 * t + e]!;
      const b: number = rest.I[3 * t + ((e + 1) % 3)]!;
      for (const o of edgeOwner.get(Math.min(a, b) * n + Math.max(a, b)) ?? []) if (o !== t && inRegion.has(o)) neighbours.push(o);
    }
    if (neighbours.length === 0) continue;
    const mean = (skin: HumanAnatomy.ISkin): V3 => A.unit(neighbours.reduce((s: V3, o: number): V3 => A.add(s, normal(skin, o)), [0, 0, 0]));
    const was: number = A.dot(normal(rest, t), mean(rest));
    const now: number = A.dot(normal(posed, t), mean(posed));
    if (was > 0.5 && now < -0.5) folded++;
  }
  return { stretch, folded };
}

/** Volume of a whole limb at the bind: its sections' areas along its bones. */
function limbVolume(skin: HumanAnatomy.ISkin, limb: string): number {
  const side: string = limb.startsWith("left") ? "left" : "right";
  const chain: string[] = limb.endsWith("Arm")
    ? [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`]
    : [`${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`];
  const joints: V3[] = chain.map((b: string): V3 => A.joint(skin, b));
  let sum: number = 0;
  for (let i: number = 0; i + 1 < joints.length; i++) {
    const a: V3 = joints[i]!;
    const b: V3 = joints[i + 1]!;
    const d: V3 = A.unit(A.sub(b, a));
    const L: number = A.dist(a, b);
    const region: Uint32Array = A.near(skin, a, b, 0.2 * L + 80);
    // Start a fifth down the first bone, clear of the trunk.
    for (let s: number = i === 0 ? 0.2 * L : 0; s < L; s += 5) {
      const o: V3 = A.add(a, A.scale(d, s));
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, d, o, region);
      if (c !== null && c.contained) sum += c.area * 5;
    }
  }
  return sum;
}

/** Keep physically observable least-section acceptance distinct from site identity. */
function observedMinimumChecks(name: string, skin: HumanAnatomy.ISkin, trunk: ITrunk): HumanAnatomyAudit.IRow[] {
  const waist: HumanObservedGirthMinimum.IReading = HumanObservedGirthMinimum.read(skin, trunk.hip.origin, trunk.underbust.origin, [0, 1, 0], trunk.waist);
  const neck: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, "neck");
  const base: HumanMeasurementSite.IReading = HumanMeasurementSite.named(skin, "neckBase");
  const geometry: Measurement.ISite["geometry"] | undefined = skin.measurementSites?.neck?.geometry;
  const leastNeck: number = geometry?.kind === "section"
    ? HumanObservedGirthMinimum.read(skin, base.origin, A.joint(skin, "head"), geometry.normal, neck).girth
    : NaN;
  return Authority.finish([
    { person: name, site: "owned waist above the final minimum between the owned hip and underbust, mm", value: trunk.waist.girth - waist.girth, low: 0, high: LARGE, unit: "mm", authority: "observed-anatomy", reason: "Same horizontal sections over the complete declared trunk domain; this observation does not establish clinical input-course correspondence." },
    { person: name, site: "owned neck above the final whole-domain minimum under its declared section normal, mm", value: neck.girth - leastNeck, low: 0, high: SMALL, unit: "mm", authority: "observed-anatomy", reason: "All compared cuts share the neck course's declared normal; the base-to-head domain remains a model premise, not a palpable infrathyroid registration." },
  ]);
}

import type { shapeAutoMovieHumanEar } from "./shapeAutoMovieHumanEar";

type IPoint = shapeAutoMovieHumanEar.IPoint;
type IOutlineKey = shapeAutoMovieHumanEar.IOutlineKey;

/**
 * Catmull-Clark subdivision draws the limit surface inside its cage, so the drawing is enlarged by the ratio of each measurement to the same measurement taken on the limit surface of this cage, the same for every identity because the cage is linear in the three measurements. Grade: derived, measured on the subdivided surface.
 */
const LIMIT: Record<keyof shapeAutoMovieHumanEar.ISize, number> = {
  length: 1.038,
  breadth: 0.904,
  protrusion: 0.642,
};

/** Otobasion superius in front of tragion across the auricle, over ear breadth: 3.5 mm in men, which sets where the auricle stands over the shared attachment. Fitted in the block-out ({@link AUTOMOVIE_HUMAN_EAR_FORM}). */
const ATTACHMENT: number = 0.12;

/** Centre of the concha floor between the cymba and the cavum, at the end of the crus of the helix: across in breadths from otobasion superius, along in lengths from tragion. */
const CONCHA: { x: number; y: number } = { x: 0.35, y: -0.02 };

/** How far the anterior and intertragic notches cut into the margin either side of the tragus, over breadth, and how far they sink, over protrusion. */
const NOTCH: { depth: number; drop: number } = { depth: 0, drop: 0.25 };

/** Depth of the concha floor below the attachment plane, over protrusion; the floor sinks toward the meatus. */
const FLOOR: number = 0.25;

/**
 * The free margin at the even stations: across in breadths from otobasion superius, along in lengths from tragion, off the head in protrusions before the calibration `LIMIT` takes the tragal-level protrusion to the measured one.
 */
const OUTLINE: IOutlineKey[] = [
  { x: 0.276, y: 0.431, h: 0.792, helix: 1 }, // superaurale
  { x: -0.132, y: 0.42, h: 0.32, helix: 1 },
  { x: -0.232, y: 0.2, h: 0.26, helix: 0.9 }, // ascending helix, preaurale
  { x: -0.154, y: 0.04, h: 0.22, helix: 0.5 }, // helix root over the anterior notch
  { x: 0.149, y: -0.08, h: 0.48, helix: 0 }, // free edge of the tragus
  { x: -0.128, y: -0.355, h: 0.192, helix: 0 }, // lobule, front
  { x: 0.189, y: -0.55, h: 0.334, helix: 0 }, // subaurale
  { x: 0.576, y: -0.456, h: 1.054, helix: 0.45 },
  { x: 1.019, y: -0.197, h: 1.267, helix: 0.8 }, // tail of the helix
  { x: 1.133, y: 0.092, h: 1.382, helix: 1 }, // posterior point
  { x: 0.97, y: 0.28, h: 1.526, helix: 1 },
  { x: 0.7, y: 0.415, h: 1.219, helix: 1 },
];

/** The concha rim at the even stations, in the units of `OUTLINE`: the inferior crus, the crus of the helix, the meatus under the tragus, the intertragic notch, the antitragus and the antihelix. */
const RIM: IPoint[] = [
  { x: 0.34, y: 0.21, h: 1.029 }, // under the inferior crus
  { x: 0.118, y: 0.18, h: 0.4 }, // the inferior crus diving under the helix
  { x: -0.027, y: 0.12, h: 0.366 },
  { x: 0.046, y: 0.027, h: 0.343 }, // crus of the helix
  { x: 0.27, y: -0.07, h: 0.069 }, // under the tragus, over the meatus
  { x: 0.198, y: -0.16, h: 0.343 }, // intertragic notch
  { x: 0.365, y: -0.14, h: 0.5 }, // floor of the cavum's lower wall
  { x: 0.571, y: -0.14, h: 1.15 }, // antitragus
  { x: 0.597, y: -0.069, h: 1.058 },
  { x: 0.597, y: 0.036, h: 1.13 }, // antihelix
  { x: 0.541, y: 0.15, h: 1.187 },
  { x: 0.462, y: 0.2, h: 1.201 },
];

/** Least thickness of the auricle between its cranial and lateral surfaces, over protrusion: the cartilage plate with its skin, about 2 mm at the 19.5 mm protrusion of men. Fitted in the block-out ({@link AUTOMOVIE_HUMAN_EAR_FORM}). */
const THICKNESS: number = 0.1;

/**
 * The drawing's coefficients, calibrated offline against the left auricle of the reference base mesh (`base.obj`, released CC0 in September 2020; its code was not read and nothing of it is shipped). Both ears were reduced to their lateral height fields: the auricle cut from the head by its height above the head's own surface (a quadratic fitted to the skin around it), set upright on its superaurale-subaurale line, and scaled to unit length, breadth and height, so only form is compared and the measurements stay the identity's. A coordinate descent over the margin's keys behind and below the front, the margin and rim heights and the concha floor, regularised toward Gray's drawing, lowered the mean squared height difference over the auricle's footprint from 0.063 to 0.010. The front of the margin keeps Gray's drawing because the reference's flattened cheek hides its height there.
 *
 * Across, the fitted drawing was then stretched about the posterior point until the ear's whole breadth, preaurale to postaurale, is 0.55 of its length, the auricular index of 57.9 in men and 58.7 in women among 200 Turkish adults (Bahşi et al. 2023, J Craniofac Surg 34(8):e799-e803): the survey's breadth is taken from otobasion superius, behind the front of the helix, so the reference's narrower 0.48 is not the measured proportion. Grade: population-fitted form, measured proportion.
 *
 * Block-out: the gross form was then fitted to the same reference body on our own skeleton with the shared calibration harness (sections parallel to the attachment 4 to 16 mm out and eight silhouettes, the reference CC0 macro blend at the adult male), with every fold switched off and the identity's length, breadth and protrusion held on the limit surface. A Nelder-Mead search over the fullness of the helix top, the posterior bulge, the lobule, the protrusion of top, back and lobule, the plate's height, the thickness, the cranial surface's lift and the attachment's place, each bounded to an anatomical range, lowered the adult male's mean radial error from 11.9 to 8.8 mm (silhouette IoU 0.45 to 0.51) and the adult female's from 9.7 to 6.8 mm (0.54 to 0.62). The rest of the gap is measured size: the reference ear stands 13 mm off the attachment plane at the tragal level and is 30 mm across, against the survey's 19.5 mm (Cho et al. 2025) and an auricular index of 0.58 (Bahşi et al. 2023), which the identity keeps. Refinement then switched the folds back on and fitted only their heights, each bounded between half and 1.6 times Gray's drawing, with the block-out held: the adult male's mean radial error is 8.9 mm with the folds, against 8.8 without them, the price of the antihelix, crura, fossa, crus of the helix, cymba, meatus, tragus and lobule the reference's coarse ear lacks. Closing the cymba and cavum into cups at the measured conchal depth, the crisp Y of the antihelix and the rolled lip of the helix then cost a little more: 9.5 mm for the adult male and 7.3 for the adult female, against the reference mesh's shallow, open concha.
 */
export const AUTOMOVIE_HUMAN_EAR_FORM: shapeAutoMovieHumanEar.IForm = {
  limit: LIMIT,
  attachment: ATTACHMENT,
  thickness: THICKNESS,
  lift: 0.8,
  outline: OUTLINE,
  rim: RIM,
  concha: CONCHA,
  floor: FLOOR,
  notch: NOTCH,
  relief: {
    antihelix: 0.28,
    superiorCrus: 0.35,
    fossa: 0.2,
    lobule: 0.09,
    notch: 0.05,
    crus: 0.282,
    cymba: 0.303,
    meatus: 0.27,
    tragus: 0.2,
    wall: 2.6,
  },
};

import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The input-identity audit of #3057: every public geometric input of a
 * person, read back on the finished skin at its published site after every
 * merge and diff, within its ISO 20685-1 allowance.
 *
 * Data-driven both ways. The inputs are every numeric leaf of the person's
 * `body.anatomy`, `head` and `extremities` ({@link leaves}), so an input added
 * to the public interface needs a catalogue entry before the audit passes.
 * The readings are the identity rows the region observers measure on the
 * skin (`HumanAnatomyAudit.REGIONS`), each centred on the input it reads
 * (`HumanAnatomyShared.identity`: `low` and `high` the input less and plus
 * its allowance). An input is read back when a row whose site names its
 * measure ({@link CATALOGUE}), on its side for a paired input, is centred on
 * the input's own value; it holds when that row passes. An input that is no
 * reading of the skin (a body composition, a caliper reading with tissue
 * compressed, a bony breadth, a range of motion) carries its reason instead.
 */
export namespace HumanInputIdentity {
  /** A catalogue entry: the measure's name in the identity rows' sites, or why the input is no skin reading. */
  export type IEntry = { site: RegExp } | { reason: string };

  /**
   * Every public geometric input by its path, sides written `*`. Site
   * patterns name the measure as the region observers' identity rows do.
   */
  export const CATALOGUE: Readonly<Record<string, IEntry>> = {
    "body.anatomy.stature": { site: /^stature\b/ },
    "body.anatomy.chestCircumference": { site: /^chest girth/ },
    "body.anatomy.underbustCircumference": { site: /^underbust girth/ },
    "body.anatomy.waistCircumference": { site: /^waist girth/ },
    "body.anatomy.highHipCircumference": { site: /^high hip girth/ },
    "body.anatomy.hipCircumference": { site: /^hip girth/ },
    "body.anatomy.neckBaseCircumference": { site: /^neck base girth/ },
    "body.anatomy.neckCircumference": { site: /^neck girth/ },
    "body.anatomy.bustPointWidth": { site: /bust point width|bust span/ },
    "body.anatomy.backNeckToWaist": { site: /back neck to waist/ },
    "body.anatomy.acrossBackShoulderWidth": { site: /across back/ },
    "body.anatomy.sideNeckToBustPoint": { site: /side neck point to (the )?bust point/ },
    "body.anatomy.upperArmLength": { site: /upper arm length|acromion to (the )?olecranon|acromion-radiale/ },
    "body.anatomy.forearmLength": { site: /forearm length|radiale to stylion/ },
    "body.anatomy.upperArmCircumference": { site: /upper arm girth|biceps girth/ },
    "body.anatomy.elbowCircumference": { site: /elbow girth/ },
    "body.anatomy.forearmCircumference": { site: /forearm girth/ },
    "body.anatomy.wristCircumference": { site: /wrist girth/ },
    "body.anatomy.handCircumference": { site: /hand circumference/ },
    "body.anatomy.inseam": { site: /inseam|crotch height/ },
    "body.anatomy.thighCircumference": { site: /thigh girth/ },
    "body.anatomy.kneeCircumference": { site: /knee girth/ },
    "body.anatomy.calfCircumference": { site: /calf girth/ },
    "body.anatomy.biacromialBreadth": { site: /biacromial breadth/ },
    "body.anatomy.acromialHeight": { site: /acromial height|acromion height/ },
    "body.anatomy.cervicaleHeight": { site: /cervicale height/ },
    "body.anatomy.sideNeckPointHeight": { site: /side neck point height/ },
    "body.anatomy.suprasternaleHeight": { site: /suprasternale height/ },
    "body.anatomy.axillaHeight": { site: /axilla height/ },
    "body.anatomy.chestBreadth": { reason: "a caliper breadth with the tissue compressed (ANSUR II), not a reading of the uncompressed skin" },
    "body.anatomy.chestDepth": { site: /chest depth/ },
    "body.anatomy.waistBreadth": { site: /waist breadth/ },
    "body.anatomy.waistDepth": { site: /waist depth/ },
    "body.anatomy.hipBreadth": { site: /hip breadth/ },
    "body.anatomy.buttockDepth": { site: /buttock depth/ },
    "body.anatomy.bideltoidBreadth": { site: /bideltoid breadth/ },
    "body.anatomy.bicristalBreadth": { reason: "a bony breadth between the iliac crests (ANSUR II), which places the skeleton, not the skin" },
    "body.anatomy.elbowBreadth": { reason: "a bony breadth across the humeral epicondyles (ANSUR II), which places the skeleton, not the skin" },
    "body.anatomy.wristBreadth": { reason: "a bony breadth across the styloid processes (ANSUR II), which places the skeleton, not the skin" },
    "body.anatomy.kneeBreadth": { reason: "a bony breadth across the femoral epicondyles (ANSUR II), which places the skeleton, not the skin" },
    "body.anatomy.bimalleolarBreadth": { reason: "a bony breadth across the malleoli (ANSUR II), which places the skeleton, not the skin" },
    "body.anatomy.ankleCircumference": { site: /ankle girth/ },
    "body.anatomy.heelBreadth": { site: /heel breadth/ },
    "body.anatomy.ballOfFootLength": { site: /ball of (the )?foot length|heel to the first metatarsal/ },
    "body.anatomy.glutealFurrowHeight": { site: /gluteal furrow height/ },
    "body.anatomy.thumbBreadth": { site: /thumb breadth/ },
    "body.anatomy.bodyFatPercentage": { reason: "a body composition, which shapes the laws and has no site on the skin" },
    "head.length": { site: /head length|glabella to opisthocranion/ },
    "head.cephalicIndex": { site: /cephalic index|head breadth/ },
    "head.circumference": { site: /head circumference|head girth/ },
    "head.height": { site: /head height/ },
    "head.faceHeight": { site: /face height|nasion to menton/ },
    "head.faceWidth": { site: /^face width/ },
    "head.mandibularWidth": { site: /^mandibular width/ },
    "head.minimumFrontalWidth": { site: /minimum frontal width|frontotemporale/ },
    "head.mouthOpening": { reason: "a range of motion of the jaw, read on the posed skin by the pose and mouth tests" },
    "head.mandibularLaterotrusion": { reason: "a range of motion of the jaw, read on the posed skin by the pose and mouth tests" },
    "head.earPair.*.length": { site: /ear length/ },
    "head.earPair.*.breadth": { site: /ear breadth/ },
    "head.earPair.*.protrusion": { site: /ear protrusion/ },
    "head.face.eyePair.*.palpebralFissureLength": { site: /palpebral fissure length|fissure length/ },
    "head.face.eyePair.*.palpebralFissureHeight": { site: /palpebral fissure height|fissure height/ },
    "head.face.intercanthalWidth": { site: /intercanthal width/ },
    "head.face.nose.width": { site: /nose width|alar width/ },
    "head.face.nose.height": { site: /nose height|nasion to subnasale/ },
    "head.face.nose.protrusion": { site: /nose protrusion|nasal tip protrusion/ },
    "head.face.mouth.width": { site: /mouth width|cheilion to cheilion/ },
    "head.face.mouth.upperVermilionHeight": { site: /upper vermilion height/ },
    "head.face.mouth.lowerVermilionHeight": { site: /lower vermilion height/ },
    "extremities.hands.*.handLength": { site: /hand length/ },
    "extremities.hands.*.handBreadth": { site: /hand breadth/ },
    "extremities.hands.*.palmLength": { site: /palm length/ },
    "extremities.hands.*.thumbLength": { site: /thumb length/ },
    "extremities.feet.*.footLength": { site: /foot length/ },
    "extremities.feet.*.footBreadth": { site: /foot breadth/ },
  };

  /** One numeric input of a person. */
  export interface ILeaf {
    /** Its path, such as `head.earPair.left.length`. */
    path: string;

    /** The path with its side written `*`, the catalogue's key. */
    key: string;

    /** Its side, for a paired input. */
    side: "left" | "right" | null;

    /** Its value. */
    value: number;
  }

  /** Every numeric leaf of a person's `body.anatomy`, `head` and `extremities`. */
  export function leaves(params: IAutoMovieHumanParameters): ILeaf[] {
    const out: ILeaf[] = [];
    const walk: (node: unknown, path: string) => void = (node: unknown, path: string): void => {
      if (typeof node === "number") {
        const side: RegExpMatchArray | null = path.match(/\.(left|right)(\.|$)/);
        out.push({ path, key: path.replace(/\.(left|right)(?=\.|$)/, ".*"), side: side === null ? null : (side[1] as "left" | "right"), value: node });
      } else if (node !== null && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    };
    walk(params.body.anatomy, "body.anatomy");
    walk(params.head, "head");
    walk(params.extremities, "extremities");
    return out;
  }

  /**
   * One row per input: passing when an identity row reads it back and holds,
   * failing with the reason when no catalogue entry names it, no row reads it
   * back, or its row misses its allowance. An input that is no skin reading
   * gives no row.
   *
   * @param person Name in rows.
   * @param params The person's inputs.
   * @param readings Every row the region observers measured on the person's skin.
   */
  export function rows(person: string, params: IAutoMovieHumanParameters, readings: readonly IRow[]): IRow[] {
    const out: IRow[] = [];
    for (const leaf of leaves(params)) {
      const entry: IEntry | undefined = CATALOGUE[leaf.key];
      if (entry === undefined) {
        out.push({ person, site: `${leaf.path}: no catalogue entry, so no reading is known for it`, value: NaN, low: 0, high: 0, unit: "" });
        continue;
      }
      if ("reason" in entry) continue;
      const found: IRow[] = readings.filter(
        (r: IRow): boolean => entry.site.test(leaf.side === null ? r.site : r.site.replace(new RegExp(`^${leaf.side} `), "")) && (leaf.side === null || r.site.startsWith(`${leaf.side} `)) && Math.abs((r.low + r.high) / 2 - leaf.value) <= 1e-9 * Math.max(1, Math.abs(leaf.value)),
      );
      if (found.length === 0) {
        out.push({ person, site: `${leaf.path} = ${leaf.value}: not read back on the skin (no identity row matching ${entry.site})`, value: NaN, low: 0, high: 0, unit: "" });
        continue;
      }
      for (const r of found) out.push({ ...r, person, site: `${leaf.path} read back as "${r.site}"` });
    }
    return out;
  }
}

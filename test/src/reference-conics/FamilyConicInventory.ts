import fs from "node:fs/promises";
import path from "node:path";
import type { AutoMovieViewAxis, IAutoMovieLoftRelief } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicRelief, AutoMovieHumanConicSection as S, AutoMovieHumanF1, AutoMovieHumanF1Placement, AutoMovieHumanF1Placing as T } from "@automovie/human";

/**
 * The inventory of what f1 is stored as, by control group (issue #3151, step 1; #3172 and #3173, their first halves): one row per stored
 * group of numbers, never per number, each with its meaning in the layout, its unit, its frame, the segment it lies on, its stations, its
 * count and its anatomical role in plain words. It reads the stored figure only; no reference data, no fit, no law.
 *
 * - A wall field is split by the segment each of its knots lies on (`AutoMovieHumanF1Placement.runs`: the bone that ends a straight run of
 *   the family's course; the trunk's one run is split where the course passes the thorax's and the head's origins). A field's meaning comes
 *   from its anchor in the layout (`AutoMovieHumanConicSection`): an extreme's reach and offset, a median's fullness share, an arc's
 *   shoulder, an inflection's share and turn, a feature's share, offset and heading. Each anchor is named by where it points on the body:
 *   its chart point at the group's middle station, carried into the figure's frame, read as anterior, posterior, superior, inferior,
 *   medial or lateral (a stored limb stands on the +Z side, so +Z is lateral there; on the trunk +Z is the left).
 * - A net is one row: its window, its segment (the frame its axis is placed in), its stored count (`AutoMovieHumanConicRelief.stored`),
 *   and whether it carries volume or a named feature, from the record and the measurements of phase 2.5 (`NETS`).
 * - The placing table is grouped by segment: its chain entry, joint centres, landmarks, course centres and directions.
 * - The constants are read by block from the count tool's `count.json` (`--count=<directory>`, `FamilyConicCount`).
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicInventory.cjs --count=<count directory>`. It writes
 * `inventory.txt` and `inventory.json` under `test/.shots/family-conic-inventory/<time>/`.
 */
namespace FamilyConicInventory {
  type V3 = [number, number, number];

  /** What a row's numbers are, for the totals by role. */
  type Role = "placing" | "reach" | "offset" | "fullness" | "shoulder" | "groove" | "course" | "net volume" | "net feature" | "constant";

  /** One inventory row. */
  interface IRow {
    group: string;
    family: string;
    field: string;
    unit: string;
    frame: string;
    segment: string;
    stations: string;
    count: number;
    role: Role;
    anatomy: string;
  }

  /**
   * What each net carries, by the record (`packages/human/docs/work/f1-conic-families.md`), stage B2's survey (#3197) and phase 2.5's runs
   * (`FamilyConicLowerTrunk`): "volume" where it fills smooth form the wall's tape bridges, "feature" where it draws a named local form.
   * A net that does both is "volume" with its features named, since a law would split it.
   */
  const NETS: Record<string, { kind: "volume" | "feature"; feature: string; carries: string }> = {
    "trunk.low": { kind: "volume", feature: "natal cleft; perineal notch between the thighs", carries: "the hips, abdomen and lower back inside the tape; 60 to 80 mm at 808 to 848 mm high between the thigh roots front and back (run 1), 22 to 35 mm up to 928 mm on the back median" },
    "trunk.crotch": { kind: "feature", feature: "inguinal fold", carries: "the groin's fold, -0.28 to 0.53 mm" },
    "trunk.crotch.twin": { kind: "feature", feature: "inguinal fold (other side)", carries: "the twin of trunk.crotch" },
    "trunk.chest.back": { kind: "volume", feature: "thoracic spinal furrow; scapulae's medial borders", carries: "the upper back, -6.5 to 16.7 mm" },
    "trunk.chest.front": { kind: "volume", feature: "sternal groove; suprasternal notch; clavicles' line", carries: "the chest front and the collarbones, -3.7 to 16.1 mm" },
    "trunk.chest.side": { kind: "volume", feature: "lateral chest pocket under the arm; anterior axillary fold", carries: "the chest's side and shoulder slope, -39 to 28 mm" },
    "trunk.chest.side.twin": { kind: "volume", feature: "the same, other side", carries: "the twin of trunk.chest.side" },
    "trunk.fold": { kind: "feature", feature: "inframammary fold", carries: "the crease under the breast, -1.35 to 0.49 mm" },
    "trunk.fold.twin": { kind: "feature", feature: "inframammary fold (other side)", carries: "the twin of trunk.fold" },
    "trunk.head": { kind: "volume", feature: "temples; zygomatic arches; cheeks", carries: "the skull and face round the front and sides, -10.5 to 17.3 mm" },
    "trunk.head.back": { kind: "volume", feature: "occiput; nape", carries: "the back of the head and neck, -2.8 to 1.4 mm" },
    "trunk.crown": { kind: "volume", feature: "vertex", carries: "the crown's dome, -2.9 to 10.9 mm" },
    "trunk.collar": { kind: "volume", feature: "jaw's lower border; sternocleidomastoids", carries: "the neck under the jaw, -6.2 to 5.9 mm" },
    "trunk.face": { kind: "volume", feature: "brows; cheeks; nasolabial folds", carries: "the face over the wall without the nose, -3.8 to 3.8 mm" },
    "trunk.mouth": { kind: "feature", feature: "lips; oral slit; commissures", carries: "the mouth, -1.2 to 2.4 mm" },
    "trunk.navel": { kind: "feature", feature: "navel (umbilicus)", carries: "the umbilicus's pit and rim, -0.9 to 2.8 mm" },
    "trunk.eyes": { kind: "feature", feature: "eye sockets; lids", carries: "the orbits and lids, down to -12.5 mm" },
    "trunk.chin": { kind: "feature", feature: "chin; submental hollow", carries: "the chin and under it, down to -18.8 mm" },
    "trunk.shoulder": { kind: "feature", feature: "shoulder top; supraclavicular hollow", carries: "the shoulder's top over the trapezius, -2.7 to 4.6 mm" },
    "trunk.shoulder.twin": { kind: "feature", feature: "the same, other side", carries: "the twin of trunk.shoulder" },
    "arm.hollow.0": { kind: "feature", feature: "axillary hollow; deltopectoral groove", carries: "the arm's root, -1.1 to 10.0 mm" },
    "arm.hollow.1": { kind: "feature", feature: "cubital fossa; olecranon's hollows", carries: "the elbow, -1.7 to 2.8 mm" },
    "arm.fore": { kind: "volume", feature: "forearm's muscle bellies", carries: "the forearm inside its tape, -1.0 to 2.9 mm" },
    "arm.hand": { kind: "volume", feature: "wrist; hand's breadth", carries: "the wrist and hand on the arm's family, -5.6 to 30.5 mm" },
    "hand.hollow.0": { kind: "feature", feature: "palm's hollow; dorsal metacarpal valleys", carries: "the hand's hollows, -1.1 to 10.1 mm" },
    "hand.hand": { kind: "volume", feature: "hand's dorsum and palm", carries: "the hand round its family, -6.3 to 23.8 mm" },
    "hand.palm": { kind: "feature", feature: "palm's cup; finger bases", carries: "the palm to the finger roots, -9.0 to 16.6 mm" },
    "leg.hollow.0": { kind: "feature", feature: "upper thigh's hollow (not named in the record)", carries: "the thigh's top, -2.0 to 2.1 mm" },
    "leg.hollow.1": { kind: "feature", feature: "popliteal fossa; patella's borders", carries: "the knee, -1.1 to 2.6 mm" },
    "leg.hollow.2": { kind: "feature", feature: "Achilles tendon's hollows; malleoli's surround", carries: "the heel and ankle, -5.6 to 15.4 mm (the wall stands up to 11 mm off round the heel)" },
    "leg.sole": { kind: "feature", feature: "sole's arch", carries: "the sole, -1.0 to 1.7 mm" },
    "nose.floor": { kind: "feature", feature: "nostril sill", carries: "the nose's floor, -1.6 to 3.4 mm" },
    "nose.under": { kind: "feature", feature: "columella's base", carries: "under the tip, -0.2 to 0.4 mm" },
    "nose.side": { kind: "feature", feature: "alar crease; supra-alar crease", carries: "the nose's sides, -1.3 to 1.7 mm" },
  };

  /**
   * The curvature-map facts each family carries, the owner's acceptance line on #3151 (an error may change how much and how far, never
   * what is there): its named features and its concave runs along sections and along the stations, from the record
   * (`packages/human/docs/work/f1-conic-families.md`), the nets' classes above and phase 2.5's runs. A later law is checked against them.
   * Written by hand from those sources; the measured baseline (sign changes of curvature per section and per longitudinal line on the faired
   * stored skin) is a later step's.
   */
  const FACTS: Record<string, { features: string; concave: string }> = {
    trunk: { features: "navel; natal cleft; perineal notch; inguinal folds; sternal groove; suprasternal notch; clavicles' line; supraclavicular hollows; inframammary folds; thoracic spinal furrow; scapular borders; shoulder tops; eye sockets and lids; lips and oral slit; chin and submental hollow; jaw's lower border; temples; nasolabial folds", concave: "front median (perineum, linea alba, navel, sternum, suprasternal notch); back median (natal cleft, lumbar and thoracic furrow); the off-axis line each side (inguinal fold, abdomen's side, chest's side pocket, supraclavicular hollow); the waist's indentation in the front and side silhouettes; the neck's under the jaw; the orbits; the oral slit" },
    arm: { features: "axillary hollow; deltopectoral groove; cubital fossa; olecranon's hollows; wrist", concave: "the front line from the armpit to the cubital fossa; the elbow's posterior hollows; the forearm's flexor-extensor groove; the wrist's narrowing in the silhouettes" },
    hand: { features: "palm's hollow; thenar and hypothenar eminences; dorsal metacarpal valleys; knuckles; finger bases", concave: "the palm's cup; the dorsal valleys between the metacarpals up to the fingers' split" },
    leg: { features: "upper thigh's hollow; popliteal fossa; patella's borders; Achilles tendon's hollows; malleoli; sole's arch", concave: "the knee's back; the tendon's hollows either side of the heel; the ankle's narrowing; the sole's arch; the calf's single belly in the side silhouette" },
    plate: { features: "scapha; triangular fossa", concave: "the plate's floor between the helix and the antihelix" },
    helix: { features: "helix rim", concave: "the rim's curl" },
    antihelix: { features: "antihelix and its crura", concave: "beside the ridge" },
    nose: { features: "alar creases; supra-alar creases; nostril sills; columella; tip", concave: "the supra-alar crease; the alar-facial groove at the root" },
    breast: { features: "breast's mound; its fold below", concave: "the inframammary fold at the join" },
    axilla: { features: "the axillary slit", concave: "the slit itself" },
    concha: { features: "concha", concave: "the bowl" },
    nostril: { features: "nostrils", concave: "the nostril cavities" },
  };

  /** The part a family is, in plain words, for the anatomy column. */
  const PART: Record<string, string> = {
    trunk: "trunk (pelvis, abdomen, thorax, neck and head on one course)",
    arm: "arm (upper arm, forearm, wrist)",
    hand: "hand",
    leg: "leg (thigh, shank, foot)",
    plate: "ear's plate (scapha and fossa floor)",
    helix: "ear's helix rim",
    antihelix: "ear's antihelix ridge",
    nose: "nose",
    breast: "breast",
    axilla: "armpit's cutter (the axillary slit)",
    concha: "ear's concha (cutter)",
    nostril: "nostril (cutter)",
  };

  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

  /** A world direction as body words: its largest components, anterior or posterior, superior or inferior, lateral or medial. */
  function words(d: readonly number[], median: boolean): string {
    const n: number = Math.hypot(d[0]!, d[1]!, d[2]!) || 1;
    const parts: [number, string][] = [
      [Math.abs(d[0]!) / n, d[0]! > 0 ? "anterior" : "posterior"],
      [Math.abs(d[1]!) / n, d[1]! > 0 ? "superior" : "inferior"],
      [Math.abs(d[2]!) / n, median ? (d[2]! > 0 ? "left" : "right") : d[2]! > 0 ? "lateral" : "medial"],
    ];
    parts.sort((a, b): number => b[0] - a[0]);
    return parts[1]![0] > 0.45 ? parts[0]![1] + "-" + parts[1]![1] : parts[0]![1];
  }

  /** The segment each station of a family lies on: its course's runs, and the trunk's one run split at the thorax's and the head's origins. */
  function segmentOf(family: H.IFamily): (s: number) => string {
    const centres: V3[] = family.centres.map((c): V3 => [c[0], c[1], c[2]]);
    const runs: string[] = T.COURSES[family.name] === undefined ? centres.slice(1).map((): string => "?") : AutoMovieHumanF1Placement.runs(family.name);
    const ends: number[] = [0];
    for (let k: number = 1; k < centres.length; ++k) ends.push(ends[k - 1]! + Math.hypot(centres[k]![0] - centres[k - 1]![0], centres[k]![1] - centres[k - 1]![1], centres[k]![2] - centres[k - 1]![2]));
    if (family.name === "trunk") {
      const axis: AutoMovieViewAxis.IAxis = H.axis(family);
      const o: number[] = axis.at(0).origin as number[];
      const t: number[] = (axis.at(1).origin as number[]).map((x: number, i: number): number => x - o[i]!);
      const at = (name: string): number => dot((AutoMovieHumanF1Placement.frame(name).origin as number[]).map((x: number, i: number): number => x - o[i]!), t) / Math.hypot(t[0]!, t[1]!, t[2]!) ** 2;
      const [thorax, head]: number[] = [at("thorax"), at("head")];
      return (s: number): string => (s < thorax! ? "pelvis" : s < head! ? "thorax" : "head");
    }
    return (s: number): string => {
      for (let k: number = 1; k < ends.length; ++k) if (s <= ends[k]! || k === ends.length - 1) return runs[k - 1] ?? "?";
      return runs.at(-1) ?? "?";
    };
  }

  /** Every field of a layout: its anchor, what the number is, its unit and its role. */
  function fieldsOf(layout: S.ILayout): { anchor: number; what: string; unit: S.Unit; role: Role; arc?: [number, number] }[] {
    const out: { anchor: number; what: string; unit: S.Unit; role: Role; arc?: [number, number] }[] = [];
    const units: S.Unit[] = S.units(layout);
    layout.anchors.forEach((a: S.IAnchor, k: number): void => {
      if (a.kind === "u" || a.kind === "v") {
        const name: string = a.kind === "u" ? (a.mid === true ? "median extreme" : "u extreme") : "v extreme";
        if (a.mid === true) out.push({ anchor: k, what: name + ": reach u", unit: "mm", role: "reach" });
        else if (a.kind === "u") out.push({ anchor: k, what: name + ": reach u", unit: "mm", role: "reach" }, { anchor: k, what: name + ": offset v", unit: "mm", role: "offset" });
        else out.push({ anchor: k, what: name + ": offset u", unit: "mm", role: "offset" }, { anchor: k, what: name + ": reach v", unit: "mm", role: "reach" });
      } else if (a.kind === "m") out.push({ anchor: k, what: "median fullness share (level " + (a.level ?? 1) + ")", unit: "share", role: "fullness" });
      else if (a.kind === "i") out.push({ anchor: k, what: "inflection share", unit: "share", role: "groove" }, { anchor: k, what: "inflection turn", unit: "angle", role: "groove" });
      else out.push({ anchor: k, what: "feature (" + (a.feature ?? "") + ") share along its chord", unit: "share", role: "groove" }, { anchor: k, what: "feature (" + (a.feature ?? "") + ") offset", unit: "mm", role: "groove" }, { anchor: k, what: "feature (" + (a.feature ?? "") + ") heading", unit: "angle", role: "groove" });
    });
    const K: number = layout.anchors.length;
    const arcs: number = layout.mirror ? K - 1 : K;
    for (let j: number = 0; j < arcs; ++j) out.push({ anchor: j, what: "shoulder of the arc " + j, unit: "share", role: "shoulder", arc: [j, (j + 1) % K] });
    if (out.length !== units.length) throw new Error("fieldsOf: " + out.length + " fields named for a layout of " + units.length);
    return out;
  }

  /** The plain-words anatomy of one field at a station: where its anchor points on the body, and what the number measures there. */
  function anatomy(family: H.IFamily, field: { anchor: number; what: string; role: Role; arc?: [number, number] }, s: number, median: boolean): string {
    const values: number[] = H.reader(family)(s);
    const chain: S.IChain = S.resolve(values, family.layout);
    const frame = H.axis(family).at(s);
    const toward = (k: number): string => {
      const p: S.P = chain.input.points[k]!;
      return words([0, 1, 2].map((i: number): number => p[0] * frame.u[i]! + p[1] * frame.v[i]!), median);
    };
    const part: string = PART[family.name] ?? family.name;
    if (field.role === "reach") return `${part}: how far the section reaches ${toward(field.anchor)} of the course (bone + muscle + fat that way)`;
    if (field.role === "offset") return `${part}: where the ${toward(field.anchor)} extreme stands across its reach (the section's asymmetry)`;
    if (field.role === "fullness") return `${part}: fullness of the section's ${toward(field.anchor)} quadrant between its extremes`;
    if (field.role === "shoulder") return `${part}: how full the arc from ${toward(field.arc![0])} to ${toward(field.arc![1])} bulges (conic shoulder)`;
    return `${part}: a groove's line at ${toward(field.anchor)}: ${field.what}`;
  }

  /**
   * The landmarks a skeleton course of the trunk needs (the supervisor's survey for #3151, step 3), each with its published definition as
   * the repo's source notes give it (the note and a pattern its line matches), the name it would hold in f1's placing table, and how it is
   * read on the reference source by that definition, or why it cannot be.
   */
  const TRUNK_LANDMARKS: { name: string; definition: string; notes: [string, RegExp][]; table: string | null; reading: string }[] = [
    { name: "cervicale (C7)", definition: "the spinous process of the seventh cervical vertebra on the mid-sagittal plane, projected posteriorly to the skin (ISO 8559-1 back neck point)", notes: [["iso-8559-1-2017-landmarks.md", /3\.1\.6/], ["ansur-ii-trunk-ratios.md", /Cervicale height/], ["de-leva-1996.md", /CERV to MIDH/]], table: null, reading: "readable as a skin proxy: the back median line's posterior prominence at the neck's base, where the neck base line's rearmost point lies (ISO 8559-1 5.3.3); the spinous process itself is under the skin" },
    { name: "suprasternale (jugular notch)", definition: "the jugular notch's lowest point (de Leva SUPR; ISO 8559-1 front neck point: the line of the clavicles' medial superior borders crossing the front median line)", notes: [["iso-8559-1-2017-landmarks.md", /3\.1\.8/], ["ansur-ii-trunk-ratios.md", /Suprasternale height/], ["de-leva-1996.md", /SUPR to XYPH/]], table: "suprasternale", reading: "in the table; on the skin the suprasternal notch is a concavity of the front median line, read by the trunk.chest.front net" },
    { name: "xiphoid (XYPH)", definition: "the xiphoid process's tip, the sternum's lower end (de Leva's upper and middle trunk boundary)", notes: [["de-leva-1996.md", /Upper trunk \| SUPR to XYPH/]], table: null, reading: "not readable by its definition: a bony point under the skin; the apex of the infrasternal angle on the front median is a proxy with no published skin definition in the notes" },
    { name: "omphalion (OMPH)", definition: "the navel's centre (de Leva's middle and lower trunk boundary; ANSUR II omphalion height)", notes: [["de-leva-1996.md", /Middle trunk \| XYPH to OMPH/], ["ansur-ii-trunk-ratios.md", /Omphalion height/]], table: null, reading: "readable: the umbilicus's pit, drawn by the trunk.navel net, its deepest point on the front median" },
    { name: "hip joint centres' midpoint (MIDH)", definition: "the midpoint of the two femoral heads' centres (de Leva's trunk end; Hara 2016's regressions locate each head from leg length, pelvic depth or the inter-ASIS distance)", notes: [["de-leva-1996.md", /Trunk \| SUPR to MIDH/], ["hara-2016.md", /\| X \|/]], table: "the pelvis frame's origin (the femur joints at ±z)", reading: "in the chain; not on the skin: a joint centre, placed by regression from external measures" },
    { name: "T8 or the scapula's inferior angle", definition: "the scapula's inferior angle aligns with the T8 spinous process upright on average, range T4 to T11 (Cooperstein 2015)", notes: [["cooperstein-2015.md", /T8 spinous process/]], table: null, reading: "partly readable: the scapula's lower tip shows as a back prominence the trunk.chest.back net carries (the scapulae's medial borders); its vertebral level is not on the skin" },
    { name: "iliac crest level (iliocristale, L4-5)", definition: "imaged iliac crests lie nearest the L4-5 interspace in women, palpated ones 0.7 to 1.0 levels higher (Cooperstein 2017); ANSUR II iliocristale height", notes: [["cooperstein-2015.md", /iliac crests lie nearest/], ["ansur-ii-trunk-ratios.md", /Iliocristale height/]], table: null, reading: "not readable by its definition: the crest is palpated under the soft tissue above the hip; the waist's side silhouette above it is no published proxy" },
    { name: "ASIS and PSIS", definition: "the anterior and posterior superior iliac spines; Hara 2016's pelvic frame and its inter-ASIS predictor", notes: [["hara-2016.md", /Pelvic frame/]], table: null, reading: "not readable by definition (palpated bony points); the PSIS often shows as the sacral dimples on the back, a skin proxy with no definition in the notes" },
    { name: "acromion", definition: "the most lateral point of the lateral edge of the acromial process, projected vertically to the skin (ISO 8559-1 shoulder point, identical to ISO 7250-1's acromion)", notes: [["iso-8559-1-2017-landmarks.md", /3\.1\.1 \| shoulder point/], ["iso-7250-1-2017.md", /5\.2 acromion/]], table: null, reading: "readable and read: the accepted reading [-16.33, 1382.48, 187.16] (FamilyConicArmscyeLoop, used by FamilyConicArmscyeRule); not in the placing table" },
    { name: "pubic symphysis", definition: "no definition in the repo's notes", notes: [], table: null, reading: "not readable: a bony joint under the mons pubis; needs a web source for its definition and a skin proxy" },
  ];

  /**
   * The survey of every element coupled at the trunk's skeleton courses and segments and its tissue law (the supervisor's order for #3151,
   * step 3), measurement and reading only: (1) the skeleton today, the chain's trunk joints, the trunk family's course and axis, and where
   * the pelvis and thorax segments split along it; (2) the landmarks a skeleton course needs (`TRUNK_LANDMARKS`) with the notes' lines and
   * the population statistics the notes hold; (3) what hangs on the trunk's frames and course: its nets, every construction node that takes
   * the trunk as host, the cutters and the placing table's trunk-framed entries, and what each would follow; (4) the engine's axes and the
   * admissions a changed trunk course touches; (5) the practice the repo's notes record. Written to `trunk-survey.txt`.
   */
  async function trunkSurvey(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-inventory", "trunk-survey-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const P = AutoMovieHumanF1Placement;
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const lines: string[] = ["The trunk's skeleton courses and segments and its tissue law: every coupled element (issue #3151, step 3); measurement and reading only", ""];
    const fixed = (p: readonly number[]): string => "[" + p.map((x: number): string => x.toFixed(1)).join(", ") + "]";
    const notes: Map<string, string[]> = new Map();
    const cite = async (note: string, pattern: RegExp): Promise<string> => {
      if (!notes.has(note)) notes.set(note, (await fs.readFile(path.join(root, "packages/human/docs/sources", note), "utf8").catch((): string => "")).split(/\r?\n/));
      const text: string[] = notes.get(note)!;
      const i: number = text.findIndex((l: string): boolean => pattern.test(l));
      return i < 0 ? `${note}: no line matches ${pattern.source}` : `${note}:${i + 1}: ${text[i]!.trim().slice(0, 240)}`;
    };

    // (1) The skeleton today.
    const axis: AutoMovieViewAxis.IAxis = H.axis(trunk);
    const o: number[] = axis.at(0).origin as number[];
    const t: number[] = (axis.at(1).origin as number[]).map((x: number, i: number): number => x - o[i]!);
    const stationOf = (p: readonly number[]): number => dot(p.map((x: number, i: number): number => x - o[i]!), t) / Math.hypot(t[0]!, t[1]!, t[2]!) ** 2;
    const length: number = Math.hypot(...[0, 1, 2].map((i: number): number => trunk.centres[1]![i]! - trunk.centres[0]![i]!));
    const skinAt = (s: number): { front: number[]; back: number[] } => {
      const chain: S.IChain = S.resolve(H.reader(trunk)(s), trunk.layout);
      const frame = axis.at(s);
      const world = (k: number): number[] => {
        const p: S.P = chain.input.points[chain.guides[k]!]!;
        return [0, 1, 2].map((i: number): number => frame.origin[i]! + p[0] * frame.u[i]! + p[1] * frame.v[i]!);
      };
      return { front: world(0), back: world(2) };
    };
    lines.push("(1) THE SKELETON TODAY (world mm, +x forward, +y up, +z left):");
    for (const name of ["pelvis", "thorax", "head"]) {
      const j = T.CHAIN.find((x): boolean => x.name === name)!;
      lines.push(`  ${name}: parent ${j.parent ?? "none (the root)"}, offset ${fixed(j.offset)} (${Math.hypot(...j.offset).toFixed(1)} mm), origin ${fixed(P.frame(name).origin)}, its rotation the identity (${JSON.stringify(j.rotation) === JSON.stringify([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) ? "yes" : "no"}); ${P.ARTICULATED.includes(name) ? "a joint of the pose" : "no joint of the pose (`AutoMovieHumanF1Placement.ARTICULATED`)"}`);
    }
    lines.push(`  joints hung on them: ${T.CHAIN.filter((j): boolean => ["pelvis", "thorax", "head"].includes(j.parent ?? "")).map((j): string => `${j.name} on ${j.parent} at ${fixed(j.offset)}`).join("; ")}`);
    lines.push(
      `  the trunk family's course: ${(T.COURSES["trunk"] ?? []).map((n: string): string => `${n} (${T.POINTS[n]!.frame} frame, local ${fixed(T.POINTS[n]!.local)}, world ${fixed(P.point(n))})`).join(" to ")}; ${trunk.centres.length} centres, halves ${JSON.stringify(trunk.halves)}: a jointed axis (\`AutoMovieViewAxis.jointed\`) of one straight segment, ${length.toFixed(1)} mm, its sections square to it; its up \`trunk.up\` (${T.DIRECTIONS["trunk.up"]?.frame ?? "?"} frame) ${fixed(trunk.up)}; knots ${trunk.knots[0]}..${trunk.knots.at(-1)} (${trunk.knots.length}); tips ${JSON.stringify(trunk.tips ?? null)}`,
    );
    const levels: [string, number[]][] = [["the pelvis's origin (the hip centres' midpoint)", P.frame("pelvis").origin], ["the thorax's origin", P.frame("thorax").origin], ["suprasternale", P.point("suprasternale")], ["the head's origin", P.frame("head").origin], ["armpit", P.point("armpit")], ["breastFan", P.point("breastFan")]];
    for (const [name, p] of levels) {
      const s: number = stationOf(p);
      const skin = skinAt(Math.min(Math.max(s, trunk.knots[0]!), trunk.knots.at(-1)!));
      lines.push(`  ${name}: world ${fixed(p)}, trunk station ${s.toFixed(1)} mm; the trunk's front and back skin there ${fixed(skin.front)} and ${fixed(skin.back)}`);
    }
    const navel = (trunk.reliefs ?? []).find((r): boolean => r.name === "trunk.navel");
    const lastKnot: number = trunk.knots[trunk.knots.length - 1]!;
    const crown: number[] = axis.at(trunk.tips?.[1]?.tip ?? lastKnot).origin as number[];
    const stature: number = crown[1]!;
    const segment = (s: number): string => (s < stationOf(P.frame("thorax").origin) ? "pelvis" : s < stationOf(P.frame("head").origin) ? "thorax" : "head");
    lines.push(
      `  the course's top (the crown's tip) at height ${stature.toFixed(1)} mm, taken as f1's stature here; the navel net's window ${navel === undefined ? "absent" : `stations ${navel.stations.join("..")} (height ${((axis.at((navel.stations[0] + navel.stations[1]) / 2).origin as number[])[1]!).toFixed(1)} mm at its middle)`}; the trunk's first knot (the crotch's split end) at height ${((axis.at(trunk.knots[0]!).origin as number[])[1]!).toFixed(1)} mm`,
      `  the segments along the course (\`FamilyConicInventory\`'s split at the thorax's and the head's origins): pelvis up to station ${stationOf(P.frame("thorax").origin).toFixed(1)} (height ${(P.frame("thorax").origin[1]).toFixed(1)}), thorax to ${stationOf(P.frame("head").origin).toFixed(1)} (height ${(P.frame("head").origin[1]).toFixed(1)}), head above. The thorax's origin stands ${(P.frame("thorax").origin[1] - P.point("suprasternale")[1]).toFixed(1)} mm above suprasternale, so the abdomen, the waist, the chest and the breasts all lie on the pelvis segment (the navel ${navel === undefined ? "-" : segment((navel.stations[0] + navel.stations[1]) / 2)}, breastFan ${segment(stationOf(P.point("breastFan")))}, armpit ${segment(stationOf(P.point("armpit")))}), and the thorax segment holds only the neck's base; the chain's thorax is a placing frame for the shoulders, not the thoracic cage`,
      `  f1's heights against the population (ANSUR II women, ansur-ii-trunk-ratios.md): suprasternale / stature ${(P.point("suprasternale")[1] / stature).toFixed(4)} (0.8164, SD 0.0071); navel / stature ${navel === undefined ? "-" : (((axis.at((navel.stations[0] + navel.stations[1]) / 2).origin as number[])[1]!) / stature).toFixed(4)} (omphalion 0.6017, SD 0.0135); the hip centres' midpoint to suprasternale ${Math.hypot(...[0, 1, 2].map((i: number): number => P.point("suprasternale")[i]! - P.frame("pelvis").origin[i]!)).toFixed(1)} mm (de Leva's trunk SUPR to MIDH, women 529.3)`,
      "",
    );

    // (2) The landmarks.
    lines.push("(2) THE LANDMARKS A SKELETON COURSE NEEDS:");
    for (const l of TRUNK_LANDMARKS) {
      lines.push(`  ${l.name}: ${l.definition}; in f1's table: ${l.table === null ? (Object.keys(T.POINTS).some((n: string): boolean => l.name.toLowerCase().includes(n.toLowerCase())) ? "a namesake exists" : "no") : l.table}; ${l.reading}`);
      for (const [note, pattern] of l.notes) lines.push(`    ${await cite(note, pattern)}`);
    }
    lines.push("  population statistics the notes hold:");
    for (const [note, pattern] of [["de-leva-1996.md", /\| Trunk \| SUPR to MIDH/], ["de-leva-1996.md", /\| Upper trunk/], ["de-leva-1996.md", /\| Middle trunk/], ["de-leva-1996.md", /\| Lower trunk/], ["de-leva-1996.md", /Alternative endpoints/], ["mac-thiong-2011.md", /Pelvic incidence/], ["mac-thiong-2011.md", /Pelvic tilt \(PT\)/], ["mac-thiong-2011.md", /Sacral slope/], ["mac-thiong-2011.md", /PI = PT \+ SS/], ["gray-1918-vertebral-curves.md", /^- Cervical/], ["gray-1918-vertebral-curves.md", /^- Thoracic/], ["gray-1918-vertebral-curves.md", /^- Lumbar/], ["gray-1918-vertebral-curves.md", /^- Pelvic/], ["gray-1918-vertebral-curves.md", /No magnitudes/], ["koele-2020.md", /younger adults/], ["ansur-ii-trunk-ratios.md", /Tenth rib height/], ["ansur-ii-trunk-ratios.md", /Chest height/], ["ludewig-2009-shoulder-complex.md", /At rest/]] as [string, RegExp][])
      lines.push(`    ${await cite(note, pattern)}`);
    lines.push("");

    // (3) What hangs on the trunk's frames and course.
    lines.push("(3) WHAT HANGS ON THE TRUNK'S FRAMES AND COURSE:", "  the trunk's nets (a window in the trunk's station and phase, heights along a world direction stored in a segment's frame):");
    for (const r of trunk.reliefs ?? []) {
      const direction = T.DIRECTIONS[`${r.name}.axis`];
      lines.push(`    ${r.name}: stations ${r.stations.map((x: number): string => x.toFixed(1)).join("..")} (${segment(r.stations[0])} to ${segment(r.stations[1])}), phases ${r.phases.map((x: number): string => x.toFixed(3)).join("..")}, ${r.rows} x ${r.columns} heights (${AutoMovieHumanConicRelief.stored(r)} stored), its direction ${direction === undefined ? "not in the placing table" : `in the ${direction.frame} frame`}`);
    }
    lines.push(`    in all ${(trunk.reliefs ?? []).length} nets, ${(trunk.reliefs ?? []).reduce((n: number, r): number => n + AutoMovieHumanConicRelief.stored(r), 0)} stored heights; the wall itself ${trunk.knots.length} knots by ${trunk.values.length} fields, ${trunk.knots.length * trunk.values.length} numbers`);
    const declared = AutoMovieHumanF1.construction();
    const found: string[] = [];
    const walk = (node: AutoMovieConstructionNode): void => {
      const n = node as { type: string; name: string; hostFace?: string; seed?: { hostFace?: string; partFace?: string }; host?: AutoMovieConstructionNode; part?: AutoMovieConstructionNode; children?: { part: AutoMovieConstructionNode }[]; loop?: { centre: [number, number]; semi: [number, number] }; seam?: [number, number] };
      if (n.hostFace === "trunk" || n.seed?.hostFace === "trunk")
        found.push(`    ${n.type} ${n.name}: ${n.loop !== undefined ? `loop centre station ${(n.loop.centre[0] * 1000).toFixed(1)} mm, phase ${n.loop.centre[1].toFixed(3)} rad, semi ${(n.loop.semi[0] * 1000).toFixed(1)} mm by ${n.loop.semi[1].toFixed(3)} rad, on the trunk's chart` : n.seam !== undefined ? `seam ${n.seam.map((x: number): string => x.toFixed(3)).join("..")} rad on the trunk's ${(node as { hostEnd?: string }).hostEnd ?? ""} end` : `seed on the trunk's face (${JSON.stringify(n.seed).slice(0, 160)})`}`);
      for (const child of [n.host, n.part, ...(n.children ?? []).map((k): AutoMovieConstructionNode => k.part)]) if (child !== undefined) walk(child);
    };
    walk(declared.root);
    lines.push("  the construction's nodes that take the trunk as host (each reads the trunk's chart: station along its course, phase about it):", ...found);
    lines.push("  the cutters and their courses' frames:", ...AutoMovieHumanF1.CUTTERS.map((c): string => `    ${c.family.name}: course ${(T.COURSES[c.family.name] ?? []).map((n: string): string => `${n} (${T.POINTS[n]?.frame ?? "?"})`).join(", ")}`));
    for (const frame of ["pelvis", "thorax", "head"]) {
      const points: string[] = Object.entries(T.POINTS).filter(([, v]): boolean => v.frame === frame).map(([k]): string => k);
      const directions: string[] = Object.entries(T.DIRECTIONS).filter(([, v]): boolean => v.frame === frame).map(([k]): string => k);
      lines.push(`  the placing table in the ${frame} frame: ${points.length} points (${points.join(", ")}); ${directions.length} directions (${directions.join(", ")})`);
    }
    lines.push(
      "  the pose: the pelvis is the root and the thorax and the head stand on it with no joint (`AutoMovieHumanF1Placement.ARTICULATED` holds neither; `NEUTRAL` keeps their reference rotations); the arm, the breast, the ear and the nose hang on the thorax's or the head's frame, so a posed spine would carry them only once those frames are joints",
      "  what would move if the trunk's course or segments changed:",
      "    the trunk's wall: its knots are stations along the one straight course; a course through the spine's curve changes every section's plane, so the stored fields stand on new planes (a refit, not a carry), unless the new course keeps each section's plane where the old one stood",
      "    the nets: each window is a station and phase range of the trunk's own chart, so it moves with the chart; its heights' world direction is stored in the pelvis, thorax or head frame, so re-cut segments re-frame those directions",
      "    the ports (armscye, mammary, nostril) and the crotch's split: their loops and seams are written on the trunk's chart (station, phase), so a changed course moves where every one of them lands; the armscye's rule loop (#3541) is computed from a plane in the thorax's frame, so a re-cut thorax re-places it",
      "    the ear's merges, the concha's and the nostrils' cuts: seeded on the trunk's face by search, they follow its surface, and their own families hang on the head's frame",
      "    the placing table's thorax- and pelvis-framed points and directions (the arm's course roots, the axilla's cutter, the breast fan, the nets' directions): each is a local offset in its frame, so a moved or re-cut frame carries them rigidly, and a frame that changes meaning (a thorax on the cage, not at the neck) changes every one",
      "",
    );

    // (4) The engine's means.
    lines.push(
      "(4) THE ENGINE'S MEANS (packages/engine/src/geometry/construction/AutoMovieViewAxis.ts):",
      "  straight: one plane moved along its normal, fixed chart axes; horizontal: the level plane at each height; level: level planes whose origin drifts on a natural cubic course (x(s), s, z(s)), the planes stay horizontal; jointed: straight segments between centres with a quintic-angle turn of half length h at each joint, C2 frames, the chart's u carried through each turn by its rotation (the families' axis, `AutoMovieHumanConicLoft.axis`, with a roll); minimal: a natural cubic curve through knots, each plane square to its tangent, the chart carried by Wang et al.'s double reflection (a numerical frame without an exact jet)",
      "  a curved spine for the trunk: either a jointed course through the spinal joints (the turns' halves set where the planes turn) or a minimal curve through course knots; every section stays square to the course, so a curved course tilts the sections against today's level ones",
      "  the nets keep their meaning only through the chart: a net is a window in the base chain's station and phase with heights along a world direction (IAutoMovieLoftRelief: stations, phases, axis), so a changed course keeps a net's place where its stations and phases still name the same skin, and moves it where they do not",
      "  admissions a changed trunk course touches: the jointed axis's own (every nonzero turn a positive half; `up` not along the first segment), the view part's (its outlines' knots on the requested stations, its poles), the ports' (a loop's centre and semi-axes on the host chart, the phase semi-axis under pi, a shape per column), the crotch split's (its seam's phases on the host's end, its profile knots within the chord), the joins' (their seeds' faces and searches), and each net's (at least 7 rows and columns, its window inside the chain)",
      "",
      "(5) THE PRACTICE the repo's notes record:",
      `  ${await cite("loper-2015-smpl.md", /23 joints/)}`,
      "  SMPL's trunk joints (pelvis, spine1 to spine3, neck, head) are not in the note: it records the model's 23 joints and its blend shapes, not their names or placement; a web source is needed",
      "  ISB: packages/human/docs/work/construction-research.md states the thorax frame of Wu et al. 2005 (Part II): origin at the jugular notch (IJ), Y up the line from the midpoint of the xiphoid (PX) and T8 to the midpoint of IJ and C7; it marks the pelvis frame of ISB Part I (Wu et al. 2002) as still to read; a web source is needed for Part I's pelvis (ASIS and PSIS) and for Part II's full thorax text",
    );
    await fs.writeFile(path.join(out, "trunk-survey.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  export async function main(): Promise<void> {
    if (process.argv.includes("--trunk")) return trunkSurvey();
    const root: string = path.resolve(process.cwd(), "..");
    const countDir: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--count="))?.slice("--count=".length);
    const rows: IRow[] = [];
    const members: { family: H.IFamily; role: "family" | "cutter"; mirrored: boolean }[] = [
      ...AutoMovieHumanF1.FAMILIES.map((m: AutoMovieHumanF1.IMember) => ({ family: m.family, role: "family" as const, mirrored: m.mirrored })),
      ...AutoMovieHumanF1.CUTTERS.map((c: { family: H.IFamily; mirrored: boolean }) => ({ family: c.family, role: "cutter" as const, mirrored: c.mirrored })),
    ];

    // Walls, by field and segment.
    for (const { family, role, mirrored } of members) {
      const segment: (s: number) => string = segmentOf(family);
      const fields = fieldsOf(family.layout);
      const median: boolean = !mirrored;
      const bySegment: Map<string, number[]> = new Map();
      family.knots.forEach((k: number, i: number): void => {
        const name: string = segment(k);
        bySegment.set(name, [...(bySegment.get(name) ?? []), i]);
      });
      fields.forEach((field, f: number): void => {
        for (const [name, at] of bySegment) {
          const stations: number[] = at.map((i: number): number => family.knots[i]!);
          const middle: number = stations[Math.floor(stations.length / 2)]!;
          rows.push({ group: role === "family" ? "wall" : "cutter", family: family.name, field: `${field.what} (anchor ${f < fields.length && field.role !== "shoulder" ? field.anchor : "-"})`, unit: field.unit, frame: family.name + " course chart", segment: name, stations: `${stations[0]} .. ${stations.at(-1)}`, count: at.length, role: field.role, anatomy: anatomy(family, field, middle, median) });
        }
      });
      // The course and its knots: stations, turn halves, closed ends, roll.
      const tips: H.ITip[] = [];
      for (const tip of family.tips ?? []) if (tip !== null) tips.push(tip);
      rows.push({ group: role === "family" ? "wall" : "cutter", family: family.name, field: "knot stations", unit: "mm", frame: "course arclength", segment: [...bySegment.keys()].join(", "), stations: `${family.knots[0]} .. ${family.knots.at(-1)}`, count: family.knots.length, role: "course", anatomy: (PART[family.name] ?? family.name) + ": where the section's fields are pinned along the course" });
      if (family.halves.length > 0) rows.push({ group: role === "family" ? "wall" : "cutter", family: family.name, field: "turn halves", unit: "mm", frame: "course arclength", segment: AutoMovieHumanF1Placement.runs(family.name).join(", "), stations: "-", count: family.halves.length, role: "course", anatomy: (PART[family.name] ?? family.name) + ": how long the course takes to turn at each joint" });
      if (tips.length > 0) rows.push({ group: role === "family" ? "wall" : "cutter", family: family.name, field: "closed ends (from, tip, centre)", unit: "mm", frame: "course arclength and chart", segment: [...bySegment.keys()].at(-1)!, stations: tips.map((t: H.ITip): string => `${t.from} .. ${t.tip}`).join("; "), count: tips.reduce((sum: number, t: H.ITip): number => sum + 2 + (t.centre === undefined ? 0 : 2), 0), role: "course", anatomy: (PART[family.name] ?? family.name) + ": where its end closes and the cap's centre" });
      if (family.roll !== undefined) rows.push({ group: "wall", family: family.name, field: "roll of the chart (knots and angles)", unit: "mm, rad", frame: "course arclength", segment: [...bySegment.keys()].join(", "), stations: `${family.roll.knots[0]} .. ${family.roll.knots.at(-1)}`, count: family.roll.knots.length + family.roll.values.length, role: "course", anatomy: (PART[family.name] ?? family.name) + ": how the sheet turns in its planes along its length" });

      // Nets.
      for (const relief of family.reliefs ?? []) {
        const known = NETS[relief.name];
        const placed: T.IPlaced | undefined = T.DIRECTIONS[relief.name + ".axis"] ?? T.DIRECTIONS[relief.name.replace(/\.twin$/, "") + ".axis"];
        rows.push({
          group: "net",
          family: family.name,
          field: relief.name + (known === undefined ? "" : " [" + known.kind + ": " + known.feature + "]"),
          unit: "mm",
          frame: `${relief.rows} x ${relief.columns} over stations, phases ${relief.phases.map((x: number): string => x.toFixed(2)).join(" .. ")} rad`,
          segment: placed?.frame ?? "?",
          stations: `${relief.stations[0]} .. ${relief.stations[1]}`,
          count: AutoMovieHumanConicRelief.stored(relief),
          role: known?.kind === "feature" ? "net feature" : "net volume",
          anatomy: known?.carries ?? "not classified",
        });
      }
    }

    // Placing, by segment.
    for (const joint of T.CHAIN) {
      const points: [string, T.IPlaced][] = Object.entries(T.POINTS).filter(([, p]): boolean => p.frame === joint.name);
      const directions: [string, T.IPlaced][] = Object.entries(T.DIRECTIONS).filter(([, p]): boolean => p.frame === joint.name);
      const centres: string[] = points.filter(([, p]): boolean => p.local.every((x: number): boolean => x === 0)).map(([n]): string => n);
      const courses: string[] = points.filter(([n]): boolean => /\.\d+$/.test(n) || n.startsWith("axis") || n.startsWith("arm")).map(([n]): string => n);
      const landmarks: string[] = points.map(([n]): string => n).filter((n: string): boolean => !centres.includes(n) && !courses.includes(n));
      rows.push({ group: "placing", family: "-", field: "chain: origin in parent and reference rotation", unit: "mm, rotation", frame: joint.parent ?? "figure", segment: joint.name, stations: "-", count: 12, role: "placing", anatomy: `skeleton: the ${joint.name}'s joint centre from its parent (segment length and offset) and its rest rotation` });
      if (centres.length > 0) rows.push({ group: "placing", family: "-", field: "joint centres: " + centres.join(", "), unit: "mm", frame: joint.name, segment: joint.name, stations: "-", count: 3 * centres.length, role: "placing", anatomy: "skeleton: joint centres at the segment's origin (zero by definition)" });
      if (landmarks.length > 0) rows.push({ group: "placing", family: "-", field: "landmarks: " + landmarks.join(", "), unit: "mm", frame: joint.name, segment: joint.name, stations: "-", count: 3 * landmarks.length, role: "placing", anatomy: "landmarks and part anchors in the segment's frame" });
      if (courses.length > 0) rows.push({ group: "placing", family: "-", field: "course centres: " + courses.join(", "), unit: "mm", frame: joint.name, segment: joint.name, stations: "-", count: 3 * courses.length, role: "placing", anatomy: "the courses the families are lofted along" });
      if (directions.length > 0) rows.push({ group: "placing", family: "-", field: "directions: " + directions.map(([n]): string => n).join(", "), unit: "unit vector", frame: joint.name, segment: joint.name, stations: "-", count: 3 * directions.length, role: "placing", anatomy: "chart ups of the families and casts of the nets" });
    }

    // Constants, by block, from the count tool's record.
    if (countDir !== undefined) {
      const count = JSON.parse(await fs.readFile(path.join(countDir, "count.json"), "utf8")) as { constants?: { name: string; class: string; note: string; numbers: number; file: string; line: number }[]; inline?: Record<string, number> };
      for (const c of count.constants ?? []) if (c.class === "shape") rows.push({ group: "constant", family: "-", field: c.name, unit: "-", frame: c.file.split("/").at(-1) + ":" + c.line, segment: "-", stations: "-", count: c.numbers, role: "constant", anatomy: c.note });
      // The blend widths `construction` writes inline (`value:`), the only inline literals the count classes as shape.
      if ((count.inline?.["value"] ?? 0) > 0) rows.push({ group: "constant", family: "-", field: "inline blend widths (value:)", unit: "mm", frame: "AutoMovieHumanF1.ts construction()", segment: "-", stations: "-", count: count.inline!["value"]!, role: "constant", anatomy: "fill and blend widths at joins" });
    }

    // Totals.
    const roles: Role[] = ["placing", "reach", "offset", "fullness", "shoulder", "groove", "course", "net volume", "net feature", "constant"];
    const total = (pick: (r: IRow) => boolean): number => rows.filter(pick).reduce((s: number, r: IRow): number => s + r.count, 0);
    const byRole: Record<string, number> = Object.fromEntries(roles.map((r: Role): [string, number] => [r, total((x: IRow): boolean => x.role === r)]));
    const byGroup: Record<string, number> = Object.fromEntries(["wall", "cutter", "net", "placing", "constant"].map((g: string): [string, number] => [g, total((x: IRow): boolean => x.group === g)]));
    const lines: string[] = [
      "f1 as stored: the inventory by control group (issue #3151, step 1)",
      "",
      "TOTALS BY GROUP: " + Object.entries(byGroup).map(([g, n]): string => g + " " + n).join(", ") + "; all " + total((): boolean => true),
      "TOTALS BY ROLE:  " + Object.entries(byRole).map(([r, n]): string => r + " " + n).join(", "),
      "",
      ["group", "family", "field", "unit", "frame", "segment", "stations", "count", "role", "anatomy"].join(" | "),
      ...rows.map((r: IRow): string => [r.group, r.family, r.field, r.unit, r.frame, r.segment, r.stations, r.count, r.role, r.anatomy].join(" | ")),
      "",
      "CURVATURE-MAP FACTS BY FAMILY (what a law must keep; digits and toes: their tips' domes and their joints' creases)",
      ...members.map(({ family }): string => `${family.name}: features: ${FACTS[family.name]?.features ?? "its joints' creases; its tip's dome"} | concave runs: ${FACTS[family.name]?.concave ?? "the flexion creases"}`),
    ];
    const out: string = path.join(root, "test/.shots/family-conic-inventory", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "inventory.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "inventory.json"), JSON.stringify({ byGroup, byRole, rows, facts: Object.fromEntries(members.map(({ family }) => [family.name, FACTS[family.name] ?? { features: "its joints' creases; its tip's dome", concave: "the flexion creases" }])) }, null, 2));
    process.stdout.write(lines.slice(0, 5).join("\n") + "\nrows " + rows.length + "\nout " + out + "\n");
  }

  /** Every net of the figure, for a check that `NETS` names each one. */
  export function unnamed(): string[] {
    return AutoMovieHumanF1.FAMILIES.flatMap((m: AutoMovieHumanF1.IMember): IAutoMovieLoftRelief[] => m.family.reliefs ?? []).map((r: IAutoMovieLoftRelief): string => r.name).filter((n: string): boolean => NETS[n] === undefined);
  }
}

void FamilyConicInventory.main()
  .then((): void => {
    const missing: string[] = FamilyConicInventory.unnamed();
    if (missing.length > 0) process.stdout.write("nets not classified: " + missing.join(", ") + "\n");
  })
  .catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyMeasures } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyLegFold } from "../../../internal/HumanAnatomyLegFold";
import { HumanAnatomyShared } from "../../../internal/HumanAnatomyShared";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanReference } from "../../../internal/reference/bodies/HumanReference";

type V3 = HumanAnatomy.V3;

/** One closed component of a horizontal section: its taut-tape girth and centroid. */
interface ILoop {
  /** Convex hull perimeter in the section's plane, mm. */
  girth: number;

  /** Mean of the loop's points, mm. */
  centre: V3;
}

/**
 * Every leg measure a reference's input file states is the reading of that
 * reference's own skin at the measure's published site, located by the skin's
 * own landmarks alone, and every such reading is printed for the file's author.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each private reference body present in the checkout (f1, f2, m1, m2 under the ignored `test/.shots`) as its welded mesh only, with no generated person, rig or chain label, on its right leg (the body's -Z side), as ISO 8559-1 and ANSUR take paired sites. Landmarks come from the skin: the vertex is its highest point; the crotch the lowest skin of the median plane between 0.3 and 0.6 of stature; the right leg's section at a height is the closed horizontal loop with negative centroid z nearest the median plane (a hanging hand lies further out); the gluteal fold the deepest notch of the rearmost profile in the sagittal plane through that loop's centroid 20 mm under the crotch, read over `HumanAnatomyLegFold.CHORD` against its `SMOOTH` bound within `HumanAnatomyLegFold.REACH` of the crotch. Readings: ANSUR 1988 gluteal furrow height (the fold, unread when no notch passes the bound); ISO 8559-1 5.3.20 thigh girth (the widest right-leg girth from 10 mm under the fold down 0.1 S, unread where the fold is, since its site hangs on the fold); ANSUR II ankle circumference (the least right-leg girth from 0.25 S down to 0.05 S, above the malleoli). It prints each reading beside the input the file states and the resolved value, and fails with every stated input that differs from its reading by more than its allowance or that states a reading the skin does not give. It catches an input file value taken by another definition than its field's, copied from another person, or read through a generated body.
 * @evidence contracts/testing.md#independent-expectations The expectation is the reference's own skin, located by its own landmarks, so no generated value, joint or construction constant enters and a change of the construction cannot move it. Allowances: ISO 20685-1's 9 mm for a large circumference (`HumanAnatomyShared.LARGE`), and 4 mm for the fold's height, twice the 2 mm scan. A field the file leaves to its default is printed and not judged. Oracle limits: the fold is the profile's notch, which a buttock that meets the thigh without one does not show; the least girth above the malleoli is sought over a fixed share of stature.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men at different statures and builds; the stated-against-default split is the negative case, a default never judged against a skin.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_inputs`, reading local files on the CPU with no generation, renderer, browser or GPU. Without private references it prints that it did not run and returns, since the data cannot ship.
 */
export function test_human_reference_inputs(): void {
  const ids: string[] = HumanReference.available();
  if (ids.length === 0) {
    console.log("test_human_reference_inputs: no private reference body in test/.shots; the input files were not read against their skins");
    return;
  }
  const failed: string[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const resolved: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    const reading: IReading = read(id);
    const rows: [string, number | null, number | null | undefined, number, number][] = [
      ["glutealFurrowHeight", reading.fold, params.body.anatomy.glutealFurrowHeight, resolved.glutealFurrowHeight, 4],
      ["thighCircumference", reading.thigh, params.body.anatomy.thighCircumference, resolved.thighCircumference, HumanAnatomyShared.LARGE],
      ["ankleCircumference", reading.ankle, params.body.anatomy.ankleCircumference, resolved.ankleCircumference, HumanAnatomyShared.LARGE],
    ];
    console.log(`${id} crotch ${reading.crotch.toFixed(1)} mm, vertex ${reading.vertex.toFixed(1)} mm`);
    for (const [field, skin, stated, value, allowance] of rows) {
      const shown = (v: number | null | undefined): string => (v === null || v === undefined ? "none" : v.toFixed(1));
      console.log(`${id} ${field}: skin ${shown(skin)}, stated ${shown(stated)}, resolved ${value.toFixed(1)} mm`);
      if (stated === null || stated === undefined) continue;
      if (skin === null) failed.push(`${id} ${field}: stated ${stated.toFixed(1)} where the skin gives no reading`);
      else if (!(Math.abs(stated - skin) <= allowance)) failed.push(`${id} ${field}: stated ${stated.toFixed(1)} against the skin's ${skin.toFixed(1)} mm, allowed ${allowance}`);
    }
  }
  if (failed.length !== 0) throw new Error(`${failed.length} stated reference inputs differ from their skins:\n${failed.join("\n")}`);
}

/** A reference's right-leg readings, mm; null where the skin shows no site. */
interface IReading {
  vertex: number;
  crotch: number;
  fold: number | null;
  thigh: number | null;
  ankle: number;
}

/**
 * Read a reference's right leg from its own mesh.
 *
 * @param id Reference alias.
 */
function read(id: string): IReading {
  const mesh: HumanReference.IMesh = HumanReference.mesh(id);
  const skin: HumanAnatomy.ISkin = { name: `${id} reference mesh`, P: mesh.P, I: mesh.I, tri: new Int32Array(mesh.I.length / 3), chains: [""], joints: new Map() };
  let vertex: number = -Infinity;
  for (let v: number = 1; v < skin.P.length; v += 3) vertex = Math.max(vertex, skin.P[v]!);

  // The crotch: the median plane's lowest skin between 0.3 and 0.6 of stature.
  let crotch: number = Infinity;
  for (const line of HumanAnatomy.polylines(skin, HumanAnatomy.MEDIAN, [0, 0, 1], HumanAnatomyShared.band(skin, 0.3 * vertex, 0.6 * vertex)))
    for (const p of line.points) if (p[1] > 0.3 * vertex && p[1] < 0.6 * vertex) crotch = Math.min(crotch, p[1]);
  if (!Number.isFinite(crotch)) throw new Error(`${id} has no median skin between 0.3 and 0.6 of stature`);

  // The fold: the rearmost profile's notch in the sagittal plane through the
  // right thigh's centroid under the crotch.
  const centre: V3 = right(skin, crotch - 20).centre;
  const lines: { points: V3[]; closed: boolean }[] = HumanAnatomy.polylines(
    skin,
    [0, 0, centre[2]],
    [0, 0, 1],
    HumanAnatomyShared.band(skin, crotch - HumanAnatomyLegFold.REACH - 2 * HumanAnatomyLegFold.CHORD, crotch + HumanAnatomyLegFold.REACH + 2 * HumanAnatomyLegFold.CHORD),
  );
  const rear = (y: number): number => {
    let x: number = Infinity;
    for (const l of lines)
      for (let i: number = 0; i + 1 < l.points.length; i++) {
        const a: V3 = l.points[i]!;
        const b: V3 = l.points[i + 1]!;
        if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
        const at: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
        if (at < centre[0]) x = Math.min(x, at);
      }
    return x;
  };
  let fold: number | null = null;
  let deepest: number = HumanAnatomyLegFold.SMOOTH;
  for (let y: number = crotch + HumanAnatomyLegFold.REACH; y >= crotch - HumanAnatomyLegFold.REACH; y -= 2) {
    const notch: number = 2 * rear(y) - rear(y + HumanAnatomyLegFold.CHORD) - rear(y - HumanAnatomyLegFold.CHORD);
    if (Number.isFinite(notch) && notch > deepest) {
      deepest = notch;
      fold = y;
    }
  }

  // ISO 8559-1 5.3.20 below the fold, unread without one, and the least
  // girth above the malleoli.
  let thigh: number | null = null;
  if (fold !== null) {
    let widest: number = 0;
    for (let y: number = Math.min(fold, crotch) - 10; y >= Math.min(fold, crotch) - 10 - 0.1 * vertex; y -= 2) widest = Math.max(widest, right(skin, y).girth);
    thigh = widest;
  }
  let ankle: number = Infinity;
  for (let y: number = 0.25 * vertex; y >= 0.05 * vertex; y -= 2) ankle = Math.min(ankle, right(skin, y).girth);
  return { vertex, crotch, fold, thigh, ankle };
}

/**
 * The right leg's horizontal loop at a height: the closed loop with negative
 * centroid z nearest the median plane.
 *
 * @throws {Error} When no closed loop lies on the right at that height.
 */
function right(skin: HumanAnatomy.ISkin, y: number): ILoop {
  let best: ILoop | null = null;
  for (const line of HumanAnatomy.polylines(skin, [0, y, 0], [0, 1, 0], HumanAnatomyShared.band(skin, y - 1, y + 1))) {
    if (!line.closed || line.points.length < 3) continue;
    const centre: V3 = HumanAnatomy.scale(line.points.reduce((s: V3, p: V3): V3 => HumanAnatomy.add(s, p), [0, 0, 0]), 1 / line.points.length);
    if (centre[2] >= 0) continue;
    if (best === null || Math.abs(centre[2]) < Math.abs(best.centre[2]))
      best = { girth: HumanAnatomy.hull(line.points.map((p: V3): [number, number] => [p[0], p[2]])), centre };
  }
  if (best === null) throw new Error(`${skin.name} has no closed loop on the right at ${y.toFixed(1)} mm`);
  return best;
}

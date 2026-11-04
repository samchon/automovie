import { HumanInputs } from "../../../../internal/HumanInputs";
import { HumanAnatomy } from "../../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../../internal/HumanAnatomyAudit";
import { HumanAnatomyCourseLandmarks } from "../../../../internal/HumanAnatomyCourseLandmarks";
import { HumanAnatomyShared } from "../../../../internal/HumanAnatomyShared";
import { HumanCurveSilhouette } from "../../../../internal/curves/HumanCurveSilhouette";
import { HumanPeople } from "../../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Pins that no person carries a plate over the shoulders or a lump behind
 * the buttocks as the outlines show them: from the front at the anatomical
 * neutral, no skin lateral of each shoulder point stands above it and the
 * half width never widens again above the deltoid; from the side, each
 * buttock's rearmost outline has one maximum and only comes forward from it.
 *
 * Scenarios:
 * 1. Red proof on f1: a plate made on the highest skin 10 to 20 mm lateral of the left shoulder point, lifted to stand 3 mm over the point and pushed outward past the unedited widening by 3 mm over a 20 mm patch, reads past both shoulder bounds; a 15 mm lump 0.06 S above the left hip joint, pushed back to stand 3 mm behind the outline one radius under it, reads past the buttock bound; the unedited rows read below the made ones.
 * 2. Every person of `HumanPeople`: both shoulders and both buttocks, every row past its bound listed by person, side and height.
 *
 * @evidence contracts/testing.md#behavioral-verification Bins every skin vertex of one half body in 2 mm heights (`HumanCurveSilhouette`): the frontal half width and the highest skin lateral of the shoulder point (the skin over the shoulder joint, `HumanAnatomyCourseLandmarks.shoulderPoint`) on the neutral skin, and the rearmost reach behind the hip joint from 0.04 S below it to 0.08 S above it on the bind skin, trunk and own leg only. It catches the wing plates projecting sideways above f2's shoulders and the lump behind f2's buttocks that the 02:50 frames show, whatever their width, which a chord-sharpness rule misses when the plate is broad.
 * @evidence contracts/testing.md#independent-expectations The shoulder point tops the shoulder's lateral run and the deltoid only falls lateral of it; the deltoid cap and the trapezius round in above the deltoid's widest level; gluteus maximus with its fat pad is one convex mass from the sacrum to the gluteal fold (Gray 1918). Each bound is the crease sagitta (`HumanAnatomyShared.CREASE`, 1 mm), the smallest relief that reads on skin. Proven red by the made plate and lump of scenario 1. Oracle limits: the outline reads vertices, so a feature smaller than the mesh spacing is not seen; the trapezius' own course belongs to `test_human_curves_region_shoulder`.
 * @evidence contracts/testing.md#distinguishing-cases Both sides of the core set's ten people, sloping and square shoulders, flat and full buttocks. Sharp turns on the shoulder cap belong to `test_human_curves_step_shoulder`, on the buttock to `test_human_curves_lump_buttock`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_plate_shoulder`, reading each person's bind and neutral skins in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_plate_shoulder(): void {
  const failures: string[] = [...proof()];
  for (const name of HumanPeople.names()) {
    try {
      const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
      const S: number = HumanInputs.stature(subject.params);
      const rows: IRow[] = (["left", "right"] as const).flatMap((side: "left" | "right"): IRow[] => [
        ...HumanCurveSilhouette.shoulder(name, subject.neutral(), S, side),
        HumanCurveSilhouette.buttock(name, subject.bind(), S, side),
      ]);
      for (const r of rows) if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} over ${r.high.toFixed(2)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} shoulder plate and buttock lump findings:\n${failures.join("\n")}`);
}

/** The made plate and lump on f1, each required to read past its bound and above the unedited reading. */
function proof(): string[] {
  const out: string[] = [];
  const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const S: number = HumanInputs.stature(subject.params);
  const neutral: HumanAnatomy.ISkin = subject.neutral();
  const point: V3 | null = HumanAnatomyCourseLandmarks.shoulderPoint(neutral, "left");
  if (point === null) return ["proof: f1's left shoulder point was not found"];

  // The plate stands on the skin 15 mm lateral of the shoulder point, raised
  // so it tops the point by a known 3 mm: the cap falls lateral of the point,
  // so a fixed lift from a centre under the skin read below it.
  const seat: V3 | null = highest(neutral, point, 10, 20);
  if (seat === null) return ["proof: f1 has no skin 10 to 20 mm lateral of its left shoulder point"];

  // It is pushed out past the row's own unedited widening by the same margin,
  // so the widening's maximum moves to the plate wherever the unedited
  // skin's own worst site stands (a fixed 8 mm push read 4.05 against 4.05).
  const before: IRow[] = HumanCurveSilhouette.shoulder("f1", neutral, S, "left");
  const widening: number = Math.max(0, before[1]?.value ?? 0);
  const plate: HumanAnatomy.ISkin = moved(neutral, seat, 20, [0, point[1] - seat[1] + PROUD, widening + PROUD]);
  const after: IRow[] = HumanCurveSilhouette.shoulder("f1 made plate", plate, S, "left");
  after.forEach((r: IRow, i: number): void => {
    if (HumanAnatomyAudit.passes(r) || !(r.value > before[i]!.value)) out.push(`proof: made plate reads ${r.value.toFixed(2)} (unedited ${before[i]!.value.toFixed(2)}) on ${r.site}, expected past ${r.high}`);
  });

  const bind: HumanAnatomy.ISkin = subject.bind();
  const hip: V3 = A.joint(bind, "leftUpperLeg");

  // The lump stands where the outline has come forward above its apex, 0.06
  // of the stature over the hip joint, pushed back so it stands a known 3 mm
  // behind the outline one lump radius under it: at the apex a lump only grew
  // the one mass and read nothing.
  const above: number = 0.06 * S;
  const back: number = rearmost(bind, hip, above);
  const under: number = rearmost(bind, hip, above - LUMP);
  if (!(back > 0) || !(under > 0)) {
    out.push(`proof: f1 has no skin behind the left hip joint ${above.toFixed(0)} or ${(above - LUMP).toFixed(0)} mm above it to stand the made lump on`);
    return out;
  }
  const lump: HumanAnatomy.ISkin = moved(bind, [hip[0] - back, hip[1] + above, hip[2]], LUMP, [-(under - back + PROUD), 0, 0]);
  const flat: IRow = HumanCurveSilhouette.buttock("f1", bind, S, "left");
  const made: IRow = HumanCurveSilhouette.buttock("f1 made lump", lump, S, "left");
  if (HumanAnatomyAudit.passes(made) || !(made.value > flat.value)) out.push(`proof: made lump reads ${made.value.toFixed(2)} (unedited ${flat.value.toFixed(2)}), expected past ${made.high}`);
  return out;
}

/** How far a made defect stands proud of the unedited outline, mm: three crease sagittas, well past the bound. */
const PROUD: number = 3 * HumanAnatomyShared.CREASE;

/** Radius of the made lump, mm. */
const LUMP: number = 15;

/**
 * The highest skin point of the left half body lying a lateral distance band
 * outside a point, within 20 mm of it fore and aft.
 *
 * @param skin The skin.
 * @param point The point, mm.
 * @param near The band's inner lateral distance, mm.
 * @param far The band's outer lateral distance, mm.
 * @returns The highest such point, or null.
 */
function highest(skin: HumanAnatomy.ISkin, point: V3, near: number, far: number): V3 | null {
  let best: V3 | null = null;
  for (let v: number = 0; v < skin.P.length / 3; v++) {
    const p: V3 = A.point(skin, v);
    const d: number = p[2] - point[2];
    if (d < near || d > far || Math.abs(p[0] - point[0]) > 20) continue;
    if (best === null || p[1] > best[1]) best = p;
  }
  return best;
}

/** A copy of a skin whose vertices within `radius` of `centre` move by `shift` times a smooth falloff (1 at the centre, 0 at the radius). */
function moved(skin: HumanAnatomy.ISkin, centre: V3, radius: number, shift: V3): HumanAnatomy.ISkin {
  const P: Float64Array = Float64Array.from(skin.P);
  for (let v: number = 0; v < P.length / 3; v++) {
    const d: number = A.dist(A.point(skin, v), centre);
    if (d >= radius) continue;
    const w: number = 0.5 * (1 + Math.cos((Math.PI * d) / radius));
    for (let k: number = 0; k < 3; k++) P[3 * v + k] += w * shift[k]!;
  }
  return { ...skin, P };
}

/** How far behind the hip joint the left half body's skin reaches at a height above it, within 2 mm, mm. */
function rearmost(skin: HumanAnatomy.ISkin, hip: V3, above: number): number {
  let back: number = 0;
  for (let v: number = 0; v < skin.P.length / 3; v++) {
    const p: V3 = A.point(skin, v);
    if (p[2] > 0 && Math.abs(p[1] - hip[1] - above) < 2 && Math.abs(p[2] - hip[2]) < 20) back = Math.max(back, hip[0] - p[0]);
  }
  return back;
}

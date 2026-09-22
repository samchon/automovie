/**
 * Read the shipped body's joints back against what they claim: rigid bone
 * segments, arcs not chords, and clinical ranges against the record.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/review-joints.ts -- [output-dir]
 *
 * Three measurements, each over every joint, so the list ends when the joint
 * list does:
 *
 * 1. Rigid segments. For each mobile axis, the joint is posed at half its
 *    range on that axis alone. The vertices bound to that bone by at least 0.999
 *    must move as one rigid body with the bone's transform: a Kabsch fit
 *    (`rigid.ts`, the face track's instrument) over those vertices between the
 *    rest and posed builds must have an RMS residual of zero to numerical
 *    precision and turn by the rig angle. The same fit over every vertex the
 *    bone dominates reports how much the blend zone bends, which is the
 *    candy-wrapper and volume-loss budget the pose correctives inherit.
 * 2. Arc versus chord. The weight-one vertices' distance from the joint pivot
 *    is compared before and after the pose; a rigid rotation keeps it exactly,
 *    a linear endpoint would shorten it by the chord's sagitta. The largest
 *    sagitta a linear endpoint would have produced at that half angle is
 *    reported beside the measured deviation, which is the number the issue
 *    asked for (half-open pose within 1 mm of the rigid rotation).
 * 3. Ranges. Each joint's constraint is printed beside the engine's fallback
 *    `DEFAULT_HUMANOID_ROM` and the pinned clinical record, naming every
 *    difference, so the receipt states which side has evidence.
 *
 * Output: `<dir>/joints-review.json` and a console table.
 */
import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { rigid } from "../face-review/rigid";
import { segmentHumanBody } from "./segmentHumanBody";

const ROOT = path.resolve(__dirname, "../../..");
const BASIS = path.join(
  ROOT,
  "test/studies/human-body/connected-basis/basis.json.gz",
);
const AXES = ["flexion", "abduction", "twist"] as const;

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const output = path.resolve(
    args[0] ?? path.join(ROOT, ".shots/body-review/joints"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(BASIS)).toString("utf8"),
  );
  const surface = basis.surfaces[0];
  const build = createHumanBodyBasisBuilder(basis);
  const rest = build({ id: "rest", name: "rest", basis: basis.id, shape: {} });
  const restSegments = segmentHumanBody(basis, rest);
  const restMesh = (bone: string): IAutoMovieMesh =>
    (
      restSegments.model.parts.find((part) => part.id === bone)!.geometry as {
        mesh: IAutoMovieMesh;
      }
    ).mesh;
  // Rows of a segment part whose source vertex is bound to that bone by at
  // least 0.999: the exclusive population that must move rigidly. Blender's
  // interpolation through the subdivision leaves few exact ones, so the
  // threshold admits the numerically pure interior of each segment; a
  // 0.001 share of another bone moves a vertex by under a thousandth of the
  // bone's own motion.
  const exclusive = new Map<string, number[]>();
  for (const [bone, sources] of restSegments.sources) {
    const index = surface.skin.joints.indexOf(bone as never);
    const rows: number[] = [];
    sources.forEach((source, row) => {
      for (let k = 0; k < 4; k++)
        if (
          surface.skin.boneIndices[source * 4 + k] === index &&
          surface.skin.weights[source * 4 + k] >= 0.999
        )
          rows.push(row);
    });
    exclusive.set(bone, rows);
  }
  const records: object[] = [];
  let worstExclusive = 0;
  let worstRadius = 0;
  for (const joint of basis.joints) {
    if (joint.constraint === null) continue;
    for (const axis of AXES) {
      const range = joint.constraint[axis];
      if (range === null) continue;
      // Halfway from the rest angle to the farther limit of the axis.
      const limit =
        range.max - joint.neutral[axis] >= joint.neutral[axis] - range.min
          ? range.max
          : range.min;
      const half = (joint.neutral[axis] + limit) / 2;
      const posed = build({
        id: "posed",
        name: "posed",
        basis: basis.id,
        shape: {},
        pose: [
          {
            bone: joint.bone,
            flexion: null,
            abduction: null,
            twist: null,
            [axis]: half,
          },
        ],
      });
      const posedSegments = segmentHumanBody(basis, posed);
      const posedPart = posedSegments.model.parts.find(
        (part) => part.id === joint.bone,
      );
      if (posedPart === undefined) {
        // A bone no vertex is dominated by (the head above the clip) has no
        // segment to fit; it is listed so the absence is recorded, not skipped.
        records.push({ bone: joint.bone, axis, clinical: half, segment: null });
        console.log(
          joint.bone.padEnd(22),
          axis.padEnd(9),
          "no dominated vertices",
        );
        continue;
      }
      const from = restMesh(joint.bone);
      const to = (posedPart.geometry as { mesh: IAutoMovieMesh }).mesh;
      const rows = exclusive.get(joint.bone) ?? [];
      const all = Array.from(
        { length: from.positions.length / 3 },
        (_, i) => i,
      );
      const fitExclusive =
        rows.length >= 3 ? rigid(from.positions, to.positions, rows) : null;
      const fitAll = rigid(from.positions, to.positions, all);
      const pivot = posed.bones.find((bone) => bone.bone === joint.bone)!;
      let radiusDeviation = 0;
      for (const row of rows) {
        const before = Math.hypot(
          from.positions[row * 3] - pivot.rest.position.x,
          from.positions[row * 3 + 1] - pivot.rest.position.y,
          from.positions[row * 3 + 2] - pivot.rest.position.z,
        );
        const after = Math.hypot(
          to.positions[row * 3] - pivot.posed.position.x,
          to.positions[row * 3 + 1] - pivot.posed.position.y,
          to.positions[row * 3 + 2] - pivot.posed.position.z,
        );
        radiusDeviation = Math.max(radiusDeviation, Math.abs(after - before));
      }
      const rigAngle = Math.abs(half - joint.neutral[axis]);
      const farthest = rows.reduce(
        (best, row) =>
          Math.max(
            best,
            Math.hypot(
              from.positions[row * 3] - pivot.rest.position.x,
              from.positions[row * 3 + 1] - pivot.rest.position.y,
              from.positions[row * 3 + 2] - pivot.rest.position.z,
            ),
          ),
        0,
      );
      // A linear endpoint from rest to the full angle, read at half, lands on
      // the chord: its sagitta at the farthest exclusive vertex is r (1 - cos(a/2)).
      const sagitta = farthest * (1 - Math.cos((rigAngle * Math.PI) / 180 / 2));
      worstExclusive = Math.max(worstExclusive, fitExclusive?.rms ?? 0);
      worstRadius = Math.max(worstRadius, radiusDeviation);
      records.push({
        bone: joint.bone,
        axis,
        clinical: half,
        rig: rigAngle,
        exclusiveVertices: rows.length,
        exclusiveRms: fitExclusive?.rms ?? null,
        exclusiveDegrees: fitExclusive?.degrees ?? null,
        dominantVertices: all.length,
        dominantRms: fitAll.rms,
        radiusDeviation,
        chordSagittaIfLinear: sagitta,
      });
      console.log(
        joint.bone.padEnd(22),
        axis.padEnd(9),
        "at",
        half.toFixed(1).padStart(6),
        "rigid rms",
        ((fitExclusive?.rms ?? 0) * 1000).toExponential(2),
        "mm over",
        String(rows.length).padStart(5),
        "blend rms",
        (fitAll.rms * 1000).toFixed(2),
        "mm over",
        String(all.length).padStart(5),
        "radius dev",
        (radiusDeviation * 1000).toExponential(2),
        "mm; chord would be",
        (sagitta * 1000).toFixed(1),
        "mm",
      );
    }
  }
  const ranges = basis.joints.map((joint) => ({
    bone: joint.bone,
    basis: joint.constraint,
    engine: DEFAULT_HUMANOID_ROM[joint.bone] ?? null,
    differs: AXES.filter((axis) => {
      const a = joint.constraint?.[axis] ?? null;
      const b = DEFAULT_HUMANOID_ROM[joint.bone]?.[axis] ?? null;
      return JSON.stringify(a) !== JSON.stringify(b);
    }),
  }));
  for (const row of ranges)
    if (row.differs.length > 0)
      console.log(
        "range differs from engine:",
        row.bone,
        row.differs.join(","),
        JSON.stringify(row.basis),
        "engine",
        JSON.stringify(row.engine),
      );
  fs.writeFileSync(
    path.join(output, "joints-review.json"),
    JSON.stringify(
      {
        basis: basis.id,
        worstExclusiveRmsMetres: worstExclusive,
        worstRadiusDeviationMetres: worstRadius,
        segments: records,
        ranges,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "worst rigid rms",
    worstExclusive,
    "m; worst radius deviation",
    worstRadius,
    "m",
  );
}

main();

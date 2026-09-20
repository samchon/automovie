/**
 * Build the shipped body basis into inspectable meshes, one JSON per state.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/build-body.ts -- <set> [output-dir]
 *
 * `set` is `neutral`, `poses`, `shapes` or `measure`; the output directory
 * defaults to `.shots/body-review/<set>`. Each state is evaluated through the
 * public `createHumanBodyBasisBuilder`, the same path the editor takes, so a
 * frame captured from these files shows what the package produces and not a
 * script's own arithmetic. The `measure` set writes the channel scales instead
 * of meshes. Nothing here mutates the study payload.
 *
 * Every JSON carries the evaluated positions, indices and normals of the skin
 * region, the posed joint positions and the shaped landmarks, so the render
 * harness can draw the joints beside the surface and a reviewer can read a
 * pivot against the skin it moved.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  measureHumanBodyBasisChannels,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(__dirname, "../../..");
const BASIS = path.join(
  ROOT,
  "test/studies/human-body/connected-basis/basis.json.gz",
);

const joint = (
  bone: IAutoMovieJointPose["bone"],
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });

/**
 * Representative joint poses in clinical degrees, each inside the basis's
 * ranges. Angles are clinical, read from the anatomical position: the source
 * rests with the arms abducted 42 degrees and the elbows bent 43, so a
 * T-pose is abduction 90 and a straight arm is elbow flexion 0.
 */
const POSES: Record<string, IAutoMovieJointPose[]> = {
  "a-pose": [],
  "t-pose": [
    joint("leftUpperArm", null, 90),
    joint("rightUpperArm", null, 90),
    joint("leftLowerArm", 0),
    joint("rightLowerArm", 0),
  ],
  "arms-down": [
    joint("leftUpperArm", null, 0),
    joint("rightUpperArm", null, 0),
    joint("leftLowerArm", 0),
    joint("rightLowerArm", 0),
  ],
  "elbow-90": [joint("leftLowerArm", 90), joint("rightLowerArm", 90)],
  "elbow-145": [joint("leftLowerArm", 145), joint("rightLowerArm", 145)],
  "knee-90": [joint("leftLowerLeg", 90), joint("rightLowerLeg", 90)],
  "arms-overhead": [
    joint("leftUpperArm", null, 170),
    joint("rightUpperArm", null, 170),
  ],
  "shoulder-flex-90": [joint("leftUpperArm", 90), joint("rightUpperArm", 90)],
  squat: [
    joint("leftUpperLeg", 90),
    joint("rightUpperLeg", 90),
    joint("leftLowerLeg", 120),
    joint("rightLowerLeg", 120),
    joint("leftFoot", 20),
    joint("rightFoot", 20),
  ],
  "trunk-twist": [
    joint("spine", null, null, 10),
    joint("chest", null, null, 10),
    joint("upperChest", null, null, 10),
  ],
  "wrist-flex": [joint("leftHand", 80), joint("rightHand", -70)],
};

/** Macro and a few regional extremes, one channel at a time. */
const SHAPES: Record<string, Record<string, number>> = {
  "macro-gender-female": { macroGender: -1 },
  "macro-gender-male": { macroGender: 1 },
  "macro-age-child": { macroAge: -1 },
  "macro-age-old": { macroAge: 1 },
  "macro-weight-min": { macroWeight: -1 },
  "macro-weight-max": { macroWeight: 1 },
  "macro-muscle-max": { macroMuscle: 1 },
  "macro-height-min": { macroHeight: -1 },
  "macro-height-max": { macroHeight: 1 },
  "male-old-heavy": { macroGender: 1, macroAge: 1, macroWeight: 1 },
  "female-young-thin": { macroGender: -1, macroAge: -0.5, macroWeight: -1 },
  "bust-plus": { measureBustCirc: 1 },
  "shoulders-narrow": { measureShoulderDist: -1, torsoScaleHoriz: -1 },
  "shoulders-wide": { measureShoulderDist: 1, torsoScaleHoriz: 1 },
  "hips-small": { hipScaleHoriz: -1, measureHipsCirc: -1 },
  "hips-large": { hipScaleHoriz: 1, measureHipsCirc: 1 },
  "waist-thin": { measureWaistCirc: -1 },
  "waist-thick": { measureWaistCirc: 1 },
};

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const set = args[0] ?? "neutral";
  const output = path.resolve(
    args[1] ?? path.join(ROOT, ".shots/body-review", set),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(BASIS)).toString("utf8"),
  );
  console.log(
    "basis",
    basis.id,
    "channels",
    basis.channels.length,
    "joints",
    basis.joints.length,
  );
  if (set === "measure") {
    const scales = measureHumanBodyBasisChannels(basis);
    fs.writeFileSync(
      path.join(output, "channel-measurements.json"),
      JSON.stringify({ basis: basis.id, channels: scales }, null, 2) + "\n",
    );
    for (const scale of scales)
      if (scale.measurement !== null)
        console.log(
          scale.id.padEnd(26),
          scale.measurement.kind.padEnd(9),
          "neutral",
          fmt(scale.measurement.neutral),
          "+1",
          fmt(scale.measurement.positive),
          "-1",
          fmt(scale.measurement.negative),
        );
    return;
  }
  const build = createHumanBodyBasisBuilder(basis);
  const states: [string, Partial<IAutoMovieHumanBodyBasisDocument>][] =
    set === "poses"
      ? Object.entries(POSES).map(([name, pose]) => [name, { pose }])
      : set === "shapes"
        ? Object.entries(SHAPES).map(([name, shape]) => [name, { shape }])
        : [["neutral", {}]];
  for (const [name, edit] of states) {
    const started = Date.now();
    const built = build({
      id: name,
      name,
      basis: basis.id,
      shape: {},
      ...edit,
    });
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("expected a resident mesh");
    const record = {
      basis: basis.id,
      state: name,
      document: edit,
      positions: geometry.mesh.positions,
      normals: geometry.mesh.normals,
      indices: geometry.mesh.indices,
      bones: built.bones.map((bone) => ({
        bone: bone.bone,
        rest: bone.rest.position,
        posed: bone.posed.position,
      })),
      landmarks: built.landmarks,
      groundY: Math.min(
        ...geometry.mesh.positions.filter((_, i) => i % 3 === 1),
      ),
    };
    fs.writeFileSync(path.join(output, name + ".json"), JSON.stringify(record));
    console.log(
      name,
      "vertices",
      geometry.mesh.positions.length / 3,
      "in",
      Date.now() - started,
      "ms",
    );
  }
}

function fmt(value: number | null): string {
  return value === null ? "null" : (value * 1000).toFixed(1) + " mm";
}

main();

/**
 * Build the shipped body basis into inspectable meshes, one JSON per state.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/build-body.ts -- <set> [output-dir] [--basis path]
 *
 * `set` is `neutral`, `poses`, `folds`, `shapes`, `individuality`, `archetypes` or `measure`; the output
 * directory defaults to `.shots/body-review/<set>`; `--basis` builds another
 * basis file (a candidate revision) instead of the shipped one. Each state is evaluated through the
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
  expandHumanBodySimpleShape,
  measureHumanBodyBasisChannels,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { REVIEW } from "./individualityStates";
import { SIMPLE_ARCHETYPES } from "./simpleArchetypes";

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

/** The folded census states one joint at a time, for close-up review of the pose correctives. */
const FOLDS: Record<string, IAutoMovieJointPose[]> = {
  "elbow-90": [joint("leftLowerArm", 90)],
  "elbow-110": [joint("leftLowerArm", 110)],
  "elbow-145": [joint("leftLowerArm", 145)],
  "knee-70": [joint("rightLowerLeg", 70)],
  "knee-105": [joint("rightLowerLeg", 105)],
  "knee-140": [joint("rightLowerLeg", 140)],
  "hip-flex-62": [joint("leftUpperLeg", 62.5)],
  "hip-flex-125": [joint("leftUpperLeg", 125)],
  "hip-adduct-30": [joint("leftUpperLeg", null, -30)],
  "arm-adduct-15": [joint("leftUpperArm", null, -15)],
  "arm-adduct-30": [joint("leftUpperArm", null, -30)],
  "arm-flex-180": [joint("leftUpperArm", 180)],
  "arm-abduct-180": [joint("leftUpperArm", null, 180)],
  "arm-twist-90": [joint("leftUpperArm", null, null, 90)],
  "arm-twist-m90": [joint("leftUpperArm", null, null, -90)],
  "wrist-flex-80": [joint("leftHand", 80)],
  "toes-80": [joint("leftToes", 80)],
  "fingers-100": [
    joint("leftIndexProximal", 100),
    joint("leftMiddleProximal", 100),
    joint("leftRingProximal", 100),
    joint("leftLittleProximal", 100),
  ],
  "thumb-100": [
    joint("leftThumbMetacarpal", 100),
    joint("leftThumbProximal", 100),
  ],
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
  const basisPath = args.includes("--basis")
    ? path.resolve(args[args.indexOf("--basis") + 1])
    : BASIS;
  const positional = args.filter(
    (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--basis",
  );
  const set = positional[0] ?? "neutral";
  const output = path.resolve(
    positional[1] ?? path.join(ROOT, ".shots/body-review", set),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
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
  if (set === "archetypes") {
    // the simple tier's review population: each archetype expanded through
    // the package, a refusal recorded as the reach it names
    const reach: Record<string, string> = {};
    for (const [name, archetype] of Object.entries(SIMPLE_ARCHETYPES)) {
      const started = Date.now();
      let shape: Record<string, number>;
      try {
        shape = {
          ...expandHumanBodySimpleShape(basis, archetype.simple),
          ...archetype.detail,
        };
      } catch (error) {
        reach[name] = error instanceof Error ? error.message : String(error);
        console.log(name.padEnd(24), "REFUSED", reach[name]);
        continue;
      }
      const built = build({ id: name, name, basis: basis.id, shape });
      const geometry = built.model.parts[0].geometry;
      if (geometry.type !== "mesh") throw new Error("expected a resident mesh");
      fs.writeFileSync(
        path.join(output, name + ".json"),
        JSON.stringify({
          basis: basis.id,
          state: name,
          document: { shape },
          simple: archetype.simple,
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
        }),
      );
      console.log(
        name.padEnd(24),
        Object.entries(shape)
          .filter(([id]) => /^macro/.test(id))
          .map(([id, w]) => `${id.slice(5).toLowerCase()} ${w.toFixed(2)}`)
          .join(" "),
        "in",
        Date.now() - started,
        "ms",
      );
    }
    fs.writeFileSync(
      path.join(output, "reach.json"),
      JSON.stringify({ basis: basis.id, refused: reach }, null, 2) + "\n",
    );
    return;
  }
  const states: [string, Partial<IAutoMovieHumanBodyBasisDocument>][] =
    set === "poses" || set === "folds"
      ? Object.entries(set === "poses" ? POSES : FOLDS).map(([name, pose]) => [
          name,
          { pose },
        ])
      : set === "shapes" || set === "individuality"
        ? Object.entries(set === "shapes" ? SHAPES : REVIEW).map(
            ([name, shape]) => [name, { shape }],
          )
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

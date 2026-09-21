/**
 * Measure how much girth each limb loses when a joint is posed: the
 * candy-wrapper and fold collapse of linear blend skinning, in millimetres.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/measure-girth.ts -- [output-dir] [--basis path]
 *
 * For every mobile joint axis at both extremes, and for each bone whose skin
 * the pose moves (the posed bone and its parent), the surface is cut by
 * planes perpendicular to the bone at nine stations from head to tail, in the
 * rest and in the pose, and the closed section loop nearest the station is
 * compared. The report lists, per state, the station with the largest
 * relative loss and gain, so the girth-preservation decision can be read off
 * measured numbers rather than assumed: a loss under the threshold needs no
 * corrective, a loss over it names where one is owed. Nothing here writes
 * into `test/studies`.
 */
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  evaluateHumanBodyShape,
  humanBodyBasisWeights,
  measureHumanBodySection,
  skinHumanBodySurface,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
/** Station fractions along a bone from head to tail. */
const STATIONS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
/** Bones whose sections are limb-like closed loops worth reading. */
const LIMBS =
  /UpperArm|LowerArm|UpperLeg|LowerLeg|^neck$|^spine$|^chest$|^upperChest$/;

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const basisPath = args.includes("--basis")
    ? path.resolve(args[args.indexOf("--basis") + 1])
    : path.join(STUDY, "basis.json.gz");
  const positional = args.filter(
    (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--basis",
  );
  const output = path.resolve(
    positional[0] ?? path.join(ROOT, ".shots/body-review/girth"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
  );
  const build = createHumanBodyBasisBuilder(basis);
  const document = (pose: IAutoMovieJointPose[]) => ({
    id: "girth",
    name: "girth",
    basis: basis.id,
    shape: {},
    pose,
  });
  // the section instrument chains crossings by shared edges, so it needs the
  // basis surface itself, whose UV seams are not split, skinned the same way
  // the builder skins it
  const surface = basis.surfaces[0];
  const mesh = (pose: IAutoMovieJointPose[]) => {
    const built = build(document(pose));
    const state = humanBodyBasisWeights(basis, document(pose));
    const rest = evaluateHumanBodyShape(basis, state, undefined).surfaces[0];
    const transforms = new Map(
      built.bones.map((bone) => [
        bone.bone,
        { rest: bone.rest, posed: bone.posed },
      ]),
    );
    return {
      built,
      positions: skinHumanBodySurface(rest, surface.skin, transforms),
      indices: surface.indices,
    };
  };
  const rest = mesh([]);
  const children = new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone[]>();
  for (const joint of basis.joints)
    if (joint.parent !== null)
      children.set(joint.parent, [
        ...(children.get(joint.parent) ?? []),
        joint.bone,
      ]);
  /** Girth at each station of `bone` on a built body, along its posed axis. */
  const girths = (
    body: ReturnType<typeof mesh>,
    bone: AutoMovieHumanoidBone,
  ): (number | null)[] => {
    const own = body.built.bones.find((one) => one.bone === bone)!;
    const child = children.get(bone)?.[0];
    const tail =
      child === undefined
        ? null
        : body.built.bones.find((one) => one.bone === child)!.posed.position;
    if (tail === null) return STATIONS.map(() => null);
    const head = own.posed.position;
    const axis = {
      x: tail.x - head.x,
      y: tail.y - head.y,
      z: tail.z - head.z,
    };
    const length = Math.hypot(axis.x, axis.y, axis.z);
    const normal = {
      x: axis.x / length,
      y: axis.y / length,
      z: axis.z / length,
    };
    return STATIONS.map((fraction) => {
      const point: IAutoMovieVector3 = {
        x: head.x + axis.x * fraction,
        y: head.y + axis.y * fraction,
        z: head.z + axis.z * fraction,
      };
      const section = measureHumanBodySection(
        body.positions,
        body.indices,
        { point, normal },
        point,
      );
      return section === null ? null : section.perimeter;
    });
  };
  const restGirths = new Map<AutoMovieHumanoidBone, (number | null)[]>();
  const records: object[] = [];
  const started = Date.now();
  for (const joint of basis.joints) {
    if (joint.constraint === null) continue;
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const range = joint.constraint[axis];
      if (range === null) continue;
      for (const angle of [range.min, range.max]) {
        if (angle === 0) continue;
        const state = `${joint.bone}.${axis}@${angle}`;
        let posed: ReturnType<typeof mesh>;
        try {
          posed = mesh([
            {
              bone: joint.bone,
              flexion: null,
              abduction: null,
              twist: null,
              [axis]: angle,
            },
          ]);
        } catch (error) {
          records.push({
            state,
            refused: error instanceof Error ? error.message : String(error),
          });
          continue;
        }
        const bones = [joint.bone, joint.parent].filter(
          (bone): bone is AutoMovieHumanoidBone =>
            bone !== null && LIMBS.test(bone),
        );
        const readings = bones.map((bone) => {
          if (!restGirths.has(bone)) restGirths.set(bone, girths(rest, bone));
          const before = restGirths.get(bone)!;
          const after = girths(posed, bone);
          const stations = STATIONS.map((fraction, at) => ({
            fraction,
            rest: before[at],
            posed: after[at],
            change:
              before[at] === null || after[at] === null
                ? null
                : (after[at]! - before[at]!) / before[at]!,
          }));
          const changes = stations.filter((s) => s.change !== null);
          const worst = changes.reduce(
            (a, b) => (b.change! < a.change! ? b : a),
            changes[0] ?? {
              fraction: 0,
              rest: null,
              posed: null,
              change: null,
            },
          );
          const best = changes.reduce(
            (a, b) => (b.change! > a.change! ? b : a),
            changes[0] ?? {
              fraction: 0,
              rest: null,
              posed: null,
              change: null,
            },
          );
          return { bone, stations, worstLoss: worst, largestGain: best };
        });
        records.push({ state, bones: readings });
        console.log(
          state.padEnd(36),
          readings
            .map(
              (r) =>
                `${r.bone} loss ${((r.worstLoss.change ?? 0) * 100).toFixed(1)}%@${r.worstLoss.fraction} (${((r.worstLoss.rest ?? 0) * 1000).toFixed(0)}->${((r.worstLoss.posed ?? 0) * 1000).toFixed(0)} mm) gain ${((r.largestGain.change ?? 0) * 100).toFixed(1)}%@${r.largestGain.fraction}`,
            )
            .join(" | "),
        );
      }
    }
  }
  fs.writeFileSync(
    path.join(output, "girth.json"),
    JSON.stringify({ basis: basis.id, stations: STATIONS, records }, null, 1),
  );
  console.log("done in", Date.now() - started, "ms");
}

main();

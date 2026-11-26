import {
  AutoMovieHumanBindingInputs,
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
  AutoMovieHumanJointCentres,
  AutoMovieHumanNeutral,
  AutoMovieHumanSkeleton,
} from "@automovie/human";
import { f1 } from "@automovie/motions/executable/internal";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

/**
 * Record the binding and pose readers of one ordinary published calibration.
 * Run from the test package with an output JSON path. Geometry and placement
 * digests exclude timings. The separately timed level-source reads retain no
 * results between probes.
 */
async function main(output: string): Promise<void> {
  const started: number = performance.now();
  const { body } = AutoMovieHumanBodyLaw.calibrate(f1);
  const calibrationMs: number = performance.now() - started;
  const scale: number =
    AutoMovieHumanBodyAnatomy.resolve(f1).stature / body.stature / 1000;

  const bindingStart: number = performance.now();
  const binding = AutoMovieHumanBindingInputs.derive(body, scale);
  const bindingMs: number = performance.now() - bindingStart;
  const motionStart: number = performance.now();
  const evaluate = AutoMovieHumanSkeleton.prepare(f1, { calibration: body });
  const prepareMs: number = performance.now() - motionStart;
  const pose = evaluate(f1.pose ?? {});

  const scopes = Array.from({ length: 7 }, () => {
    const sourceStart: number = performance.now();
    const joints = AutoMovieHumanJointCentres.derive(body);
    const rings = AutoMovieHumanBindingInputs.rings(
      body,
      AutoMovieHumanNeutral.LEVEL,
    );
    const sourceMs: number = performance.now() - sourceStart;
    const neutralStart: number = performance.now();
    const neutral = AutoMovieHumanNeutral.derive(rings, joints);
    const neutralMs: number = performance.now() - neutralStart;
    return {
      sourceMs,
      neutralMs,
      joints: joints.length,
      stations: rings.reduce((sum, ring) => sum + ring.stations.length, 0),
      points: rings.reduce((sum, ring) => sum + ring.points.length / 3, 0),
      digest: digest(neutral),
    };
  });

  const report = {
    chains: body.chains.map((chain) => chain.name),
    diagnostics: body.diagnostics,
    binding: digest(binding),
    pose: digest(pose),
    neutral: digest(binding.neutral),
    scopes,
    milliseconds: { calibrationMs, bindingMs, prepareMs },
  };
  await writeFile(output, JSON.stringify(report, null, 2));
}

/** Preserve Map entry order when recording the actual results. */
function digest(value: unknown): string {
  return createHash("sha256")
    .update(
      JSON.stringify(value, (_, member: unknown): unknown =>
        member instanceof Map ? Array.from(member) : member,
      ),
    )
    .digest("hex");
}

const output: string | undefined = process.argv[2];
if (output === undefined) throw new Error("Supply an output JSON path");
void main(output).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

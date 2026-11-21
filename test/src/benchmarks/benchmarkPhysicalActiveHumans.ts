import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  physicalShapeBounds,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieFootfallPattern,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";
import { createHash } from "node:crypto";
import { lstat, realpath, writeFile } from "node:fs/promises";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { isAbsolute, join } from "node:path";
import { performance } from "node:perf_hooks";

import { PhysicalFixtures } from "../features/internal/PhysicalFixtures";
import { PhysicalSupportFixtures } from "../features/internal/PhysicalSupportFixtures";
import { motionHumanBody } from "../features/internal/motionHumanBody";
import { measurePhysicalActiveHumanFrames } from "./measurePhysicalActiveHumanFrames";

/** Cache intervals per second and native integration updates per interval. */
const RATE: number = 120;
const SUBSTEPS: number = 32;

/** Four seconds of authored arm and neck motion, sampled once per Human. */
const CYCLE_STEPS: number = 4 * RATE;

/** Historical reference budget and archive decoder allocation cap. */
const COMPUTE_MS: number = 3_600_000;
const RSS_BYTES: number = 2 * 1024 ** 3;
const ARCHIVE_BYTES: number = 1024 ** 3;

/** Current canonical providers in stable scene insertion order. */
const SUBJECTS: readonly motionHumanBody.Name[] = [
  "m-average",
  "f-average",
  "m-tall",
];

/**
 * Bake three active canonical Humans through the public simulation and archive
 * APIs. Each process runs one trial. An optional reference directory retains
 * the exact archive for external playback and capture receipts.
 */
async function main(): Promise<void> {
  const [mode, revision, directory, ...extra]: string[] = process.argv.slice(2);
  if (
    (mode !== "pilot" && mode !== "reference") ||
    revision === undefined ||
    !/^[a-f0-9]{40}$/.test(revision) ||
    (directory !== undefined && mode !== "reference") ||
    extra.length > 0
  )
    throw new Error(
      "Usage: benchmarkPhysicalActiveHumans.ts <pilot|reference> <source revision> [existing absolute reference directory]",
    );
  const archivePath: string | null =
    directory === undefined ? null : await referenceArchivePath(directory);

  const duration: number = mode === "pilot" ? 1 : 180;
  const start: number = performance.now();
  const input: IAutoMoviePhysicalSimulationInput.IInput = activeInput(duration);
  const prepared: number = performance.now();
  let nativeStart: number = prepared;
  const run: IAutoMoviePhysicalSimulation = await bake(input, (): void => {
    nativeStart = performance.now();
  });
  const computed: number = performance.now();
  const peakAfterComputeBytes: number = process.resourceUsage().maxRSS * 1024;

  const quality: ReturnType<typeof measurePhysicalActiveHumanFrames> =
    measurePhysicalActiveHumanFrames(input, run.cache.frames);
  const audited: number = performance.now();

  const archive: Uint8Array = await Playback.encode(run.cache, ARCHIVE_BYTES);
  const encoded: number = performance.now();
  const reader: IAutoMoviePhysicalPlayback = await Playback.decode(
    archive,
    run.cache.identity,
    {
      maximumBytes: ARCHIVE_BYTES,
      maximumFrames: input.maximumSteps + 1,
      maximumSegments: input.maximumSegments,
    },
  );
  const decoded: number = performance.now();
  const replay: ReturnType<
    typeof measurePhysicalActiveHumanFrames.compareReplay
  > = measurePhysicalActiveHumanFrames.compareReplay(input, run, reader);
  const archiveSha256: string = createHash("sha256")
    .update(archive)
    .digest("hex");
  const verified: number = performance.now();
  const peakResidentBytes: number = process.resourceUsage().maxRSS * 1024;

  const computedInBudget: boolean = computed - prepared <= COMPUTE_MS;
  const residentInBudget: boolean = peakResidentBytes <= RSS_BYTES;
  const measuredInBudget: boolean = computedInBudget && residentInBudget;
  const checkpoints: number = run.cache.checkpoints.size;
  const complete: boolean =
    run.recomputedSteps === input.maximumSteps &&
    run.cache.frames.length === input.maximumSteps + 1 &&
    checkpoints === input.maximumSteps / RATE + 1 &&
    [...run.cache.checkpoints].every(
      ([step, snapshot]: [number, Uint8Array]): boolean =>
        step >= 0 &&
        step <= input.maximumSteps &&
        step % RATE === 0 &&
        snapshot.byteLength > 0,
    );
  const providersInContact: Set<string> = new Set();
  for (const receipt of run.cache.contacts)
    if (
      receipt.a.body === "floor" &&
      receipt.impulse !== null &&
      receipt.impulse > 0
    )
      providersInContact.add(receipt.b.body);
    else if (
      receipt.b.body === "floor" &&
      receipt.impulse !== null &&
      receipt.impulse > 0
    )
      providersInContact.add(receipt.a.body);
  const actualFloorContact: boolean = input.bodies.every(
    (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      providersInContact.has(body.id),
  );
  const withinQuality: boolean =
    quality.withinHistoricalLimits && quality.active && actualFloorContact;
  const retain: boolean =
    archivePath !== null && complete && measuredInBudget && withinQuality;
  if (archivePath !== null && retain)
    await writeFile(archivePath, archive, { flag: "wx" });
  const finished: number = performance.now();
  const lifetimePeakBytes: number = process.resourceUsage().maxRSS * 1024;
  const withinBudget: boolean =
    measuredInBudget && lifetimePeakBytes <= RSS_BYTES;

  process.stdout.write(
    `${JSON.stringify(
      {
        mode,
        revision,
        host: {
          platform: platform(),
          release: release(),
          arch: arch(),
          cpu: cpus()[0]?.model,
          logicalCpus: cpus().length,
          memoryBytes: totalmem(),
          node: process.version,
          rapier: RAPIER.version(),
        },
        workload: {
          duration,
          rate: input.rate,
          substeps: input.substeps,
          iterations: input.iterations,
          internalIterations: input.internalIterations,
          checkpointEvery: input.checkpointEvery,
          yieldEvery: input.yieldEvery,
          segmentCount: input.maximumSegments,
          cycleSteps: CYCLE_STEPS,
          representation:
            "current canonical polygon Human profiles and Foot/Toes contact carriers",
          bodies: input.bodies.map(
            (body: IAutoMoviePhysicalSimulationInput.IBody) => ({
              id: body.id,
              mass: body.profile.mass,
              segmentCount: body.profile.segments.length,
            }),
          ),
        },
        budget: { computeMilliseconds: COMPUTE_MS, residentBytes: RSS_BYTES },
        milliseconds: {
          prepare: prepared - start,
          compute: computed - prepared,
          admitAndBind: nativeStart - prepared,
          integrateAndFinalize: computed - nativeStart,
          audit: audited - computed,
          encode: encoded - audited,
          decode: decoded - encoded,
          verifyReplay: verified - decoded,
          retainArchive: finished - verified,
          wall: finished - start,
        },
        peakAfterComputeBytes,
        peakResidentBytes: lifetimePeakBytes,
        withinBudget,
        complete,
        quality: { ...quality, actualFloorContact, withinQuality },
        cache: {
          protocol: run.cache.protocol,
          identity: run.cache.identity,
          frames: run.cache.frames.length,
          contacts: run.cache.contacts.length,
          recomputedSteps: run.recomputedSteps,
          checkpoints,
          checkpointBytes: [...run.cache.checkpoints.values()].reduce(
            (sum: number, snapshot: Uint8Array): number =>
              sum + snapshot.byteLength,
            0,
          ),
        },
        archive: {
          bytes: archive.byteLength,
          sha256: archiveSha256,
          path: retain ? archivePath : null,
        },
        replay,
      },
      null,
      2,
    )}\n`,
  );
  if (!withinBudget || !complete || !withinQuality) process.exitCode = 1;
}

/** Use the normal public preparation path with the historical compute budget. */
async function bake(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  nativeStart: () => void,
): Promise<IAutoMoviePhysicalSimulation> {
  const controller: AbortController = new AbortController();
  const deadline: ReturnType<typeof setTimeout> = setTimeout(
    (): void =>
      controller.abort(
        new Error("Active Human compute exceeded 3,600 seconds"),
      ),
    COMPUTE_MS,
  );
  try {
    return await Simulation.compute(
      input,
      undefined,
      controller.signal,
      (completed: number, total: number): void => {
        if (completed === 0) nativeStart();
        if (completed % (RATE * 10) === 0 || completed === total)
          process.stderr.write(
            `Active physical intervals ${completed}/${total}\n`,
          );
        if (process.resourceUsage().maxRSS * 1024 > RSS_BYTES)
          controller.abort(
            new Error(
              `Active Human compute exceeded 2 GiB at interval ${completed}`,
            ),
          );
      },
    );
  } finally {
    clearTimeout(deadline);
  }
}

/** Resolve a caller-owned directory without creating or following a final link. */
async function referenceArchivePath(directory: string): Promise<string> {
  if (!isAbsolute(directory) || !(await lstat(directory)).isDirectory())
    throw new Error(
      "The reference archive directory must be an existing absolute directory",
    );
  return join(await realpath(directory), "active-humans.amphys");
}

/** Build the historical cadence and force policy while using current canonical profiles. */
function activeInput(
  duration: number,
): IAutoMoviePhysicalSimulationInput.IInput {
  const bodies: IAutoMoviePhysicalSimulationInput.IBody[] = SUBJECTS.map(
    (
      subject: motionHumanBody.Name,
      index: number,
    ): IAutoMoviePhysicalSimulationInput.IBody =>
      activeBody(motionHumanBody(subject), duration, index),
  );
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(bodies, duration);
  input.gravity.y = -9.81;
  input.floor = 0;
  input.substeps = SUBSTEPS;
  input.internalIterations = 1;
  input.checkpointEvery = RATE;
  input.yieldEvery = RATE;
  input.maximumSegments = bodies.reduce(
    (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
      sum + body.profile.segments.length,
    0,
  );
  return input;
}

/**
 * Sample one complete authored cycle on the current skeleton and reuse its
 * transforms through the timeline. Each Human starts one third of a cycle
 * later than the previous one. Foot support is force-only in world actuation.
 */
function activeBody(
  human: IAutoMovieMotionHumanBody,
  duration: number,
  index: number,
): IAutoMoviePhysicalSimulationInput.IBody {
  const { profile, skeleton }: IAutoMovieMotionHumanBody = human;
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.canonical(profile, 1 / RATE);
  const support: NonNullable<
    IAutoMoviePhysicalSimulationInput.IBody["balance"]
  > = body.balance!;
  const pattern: IAutoMovieFootfallPattern = support.pattern;
  const carriers: Set<string> = new Set(
    pattern.limbs.flatMap(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): string[] =>
        limb.contacts ?? [limb.bone],
    ),
  );
  const floor: number = Math.min(
    ...profile.segments
      .filter((segment: IAutoMoviePhysicalSegment): boolean =>
        carriers.has(segment.bone),
      )
      .flatMap((segment: IAutoMoviePhysicalSegment): number[] =>
        segment.shapes.map(
          (shape: IAutoMoviePhysicalSegment["shapes"][number]): number =>
            physicalShapeBounds.lowest(segment.neutral, shape),
        ),
      ),
  );
  const supportStrength: Record<string, number> = Object.fromEntries(
    pattern.limbs.map(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): [string, number] => [
        limb.bone,
        1,
      ],
    ),
  );
  const requested: Set<string> = new Set(
    profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): string => segment.bone,
    ),
  );
  const cycle: IAutoMoviePhysicalSimulationInput.ITarget[] = Array.from(
    { length: CYCLE_STEPS },
    (_: unknown, sample: number): IAutoMoviePhysicalSimulationInput.ITarget => {
      const wave: number = Math.sin((2 * Math.PI * sample) / CYCLE_STEPS);
      const pose: IAutoMoviePose = {
        skeleton: skeleton.id,
        root: {
          translation: { x: 2 * (index - 1), y: -floor, z: 0 },
          rotation: Quaternion.identity(),
          scale: { x: 1, y: 1, z: 1 },
        },
        joints: [
          articulation("leftUpperArm", 55 + 5 * wave),
          articulation("rightUpperArm", 55 - 5 * wave),
          articulation("leftLowerArm", 100 - 10 * wave),
          articulation("rightLowerArm", 100 + 10 * wave),
          articulation("neck", null, 2 * wave),
        ],
      };
      return {
        strength: 1,
        supportStrength,
        segments: Object.fromEntries(
          resolvePose(
            pose,
            skeleton,
            HUMANOID_JOINT_AXES,
            HUMANOID_REST_FRAME,
            undefined,
            undefined,
            requested,
          ).map(
            (
              bone: IAutoMovieResolvedBone,
            ): [string, IAutoMovieRigidTransform] => [
              bone.bone,
              { position: bone.worldPosition, rotation: bone.worldRotation },
            ],
          ),
        ),
      };
    },
  );
  body.targets = Array.from(
    { length: duration * RATE + 1 },
    (_: unknown, step: number): IAutoMoviePhysicalSimulationInput.ITarget =>
      cycle[(step + index * (CYCLE_STEPS / SUBJECTS.length)) % CYCLE_STEPS]!,
  );
  body.actuation = "world";
  body.compensateGravity = true;
  body.releasedQuality = { iterations: 64, internalIterations: 64 };
  body.supportTracking = {
    pattern,
    stiffness: 100 * profile.mass,
    damping: 10 * profile.mass,
    maximumForce: 12 * profile.mass,
    iterations: 0,
  };
  delete body.balance;
  return body;
}

/** A sparse clinical angle in authored degrees; the other axes stay neutral. */
function articulation(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  twist: number | null = null,
): IAutoMovieJointPose {
  return { bone, flexion, abduction: null, twist };
}

void main().catch((error: unknown): void => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});

import {
  AutoMoviePhysicalBalance as Balance,
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
  Vector3,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Inspect actual support forces and capture points without preparing another person or integrating another solver. */
async function main(): Promise<void> {
  const file: string = path.resolve(
    process.argv[2] ?? ".cache/physical/startup.amphys",
  );
  const manifest: {
    identity: string;
    startSeconds: number;
    duration: number;
    profiles: Record<string, P>;
  } = JSON.parse(await readFile(`${file}.json`, "utf8"));
  const playback: Playback = await Playback.decode(
    await readFile(file),
    manifest.identity,
    { maximumBytes: 536870912, maximumFrames: 21601, maximumSegments: 78 },
  );
  const rows: object[] = [];
  for (
    let index: number = 0;
    index <= Math.round(manifest.duration * 10);
    index++
  ) {
    const seconds: number = index / 10;
    const frame: ReturnType<Playback["at"]> = playback.at(seconds);
    for (const [id, profile] of Object.entries(manifest.profiles)) {
      let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      const supports: Balance.ISupport[] = [];
      let impulse: number = 0;
      for (const segment of profile.segments) {
        const pose: (typeof frame.bodies)[string][string] =
          frame.bodies[id]![segment.bone]!;
        const offset: IAutoMovieVector3 = Quaternion.rotateVector(
          pose.rotation,
          segment.centerOfMass,
        );
        center = Vector3.add(
          center,
          Vector3.scale(
            Vector3.add(pose.position, offset),
            segment.mass / profile.mass,
          ),
        );
        velocity = Vector3.add(
          velocity,
          Vector3.scale(
            Vector3.add(
              pose.velocity,
              Vector3.cross(pose.angularVelocity, offset),
            ),
            segment.mass / profile.mass,
          ),
        );
      }
      for (const side of ["left", "right"] as const) {
        const patches: string[] = [
          `${side}Foot`,
          `${side}Subtalar`,
          `${side}Midfoot`,
        ];
        const points: IAutoMovieVector3[] = [];
        for (const receipt of playback.contacts) {
          const own: Receipt["a"] | undefined =
            receipt.a.body === id && receipt.b.body === "floor"
              ? receipt.a
              : receipt.b.body === id && receipt.a.body === "floor"
                ? receipt.b
                : undefined;
          if (!own || !patches.includes(own.bone)) continue;
          for (const sample of receipt.samples ?? [])
            if (
              Math.abs(sample.seconds - seconds) <= 1 / 120 + 1e-9 &&
              sample.impulse > 0
            ) {
              points.push(sample.point);
              impulse += sample.impulse;
            }
        }
        if (points.length)
          supports.push({
            bone: `${side}Midfoot`,
            points,
            position: physicalSupportPoint(
              frame.bodies[id]![`${side}Midfoot`]!,
            ),
          });
      }
      const pattern: Parameters<typeof Balance.assess>[0]["pattern"] = {
        id: "inspected-feet",
        minimumSupports: 1,
        limbs: (["left", "right"] as const).map(
          (
            side: "left" | "right",
            index: number,
          ): Parameters<
            typeof Balance.assess
          >[0]["pattern"]["limbs"][number] => ({
            bone: `${side}Midfoot`,
            chain: [`${side}Midfoot`],
            phase: index / 2,
            duty: 0.5,
            offset: { forward: 0, left: 0 },
            stride: [{ speed: 0, length: 0.6 }],
          }),
        ),
      };
      const balance: Balance.IResult = Balance.assess({
        center,
        velocity,
        floor: 0,
        gravity: 9.81,
        pattern,
        supports,
        unavailable: [],
        maximumStep: 0.6,
        margin: 0.01,
      });
      rows.push({
        seconds: seconds + manifest.startSeconds,
        id,
        root: frame.bodies[id]!.hips!.position,
        center,
        velocity,
        weight: profile.mass * 9.81,
        sampleImpulse: impulse,
        supportBones: supports.map(
          (support: Balance.ISupport): string => support.bone,
        ),
        capture: balance.capturePoint,
        polygon: balance.polygon,
        outside: balance.outside,
        state: balance.state,
      });
    }
  }
  const crossContacts: object[] = playback.contacts
    .filter(
      (receipt: Receipt): boolean =>
        receipt.a.body !== receipt.b.body &&
        receipt.a.body !== "floor" &&
        receipt.b.body !== "floor",
    )
    .map((receipt: Receipt): object => ({
      seconds: receipt.seconds + manifest.startSeconds,
      end: receipt.endSeconds + manifest.startSeconds,
      a: `${receipt.a.body}/${receipt.a.bone}/${receipt.a.shape}`,
      b: `${receipt.b.body}/${receipt.b.bone}/${receipt.b.shape}`,
      impulse: receipt.impulse,
      gap: receipt.separation,
    }));
  const loads: object[] = Object.entries(manifest.profiles).map(
    ([id, profile]: [string, P]): object => ({
      id,
      weight: profile.mass * 9.81,
      meanFloorForce:
        playback.contacts
          .filter(
            (receipt: Receipt): boolean =>
              (receipt.a.body === id && receipt.b.body === "floor") ||
              (receipt.b.body === id && receipt.a.body === "floor"),
          )
          .reduce(
            (total: number, receipt: Receipt): number =>
              total +
              (receipt.samples ?? []).reduce(
                (
                  sum: number,
                  sample: NonNullable<Receipt["samples"]>[number],
                ): number => sum + Math.abs(sample.normal.y) * sample.impulse,
                0,
              ),
            0,
          ) / manifest.duration,
    }),
  );
  await writeFile(
    `${file}.support.json`,
    JSON.stringify({ rows, crossContacts, loads }, null, 2),
  );
  console.log(JSON.stringify({ loads, crossContacts }));
  console.log(JSON.stringify({ file, rows: rows.length }));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});

import { AutoMovieEngineDefaultHumanoidRom, AutoMovieEngineSwingTwistRange } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieSwingTwistRange,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * An explicitly prepared swing/twist frame owns only its unchanged basis.
 *
 * On F=X, A=Y, T=Z, Rx(f) Rz(t) sends the rest direction Z to
 * (0,-sin(f),cos(f)). For |f|<180 its swing is |f| and its twist is t. The
 * declared clinical twist map has sign -1 and neutral 10 degrees, so the
 * expected clinical twist is 10-t. These axis-angle facts give the physical
 * readings independently of preparation and its cold path. B's direction lies
 * along -Y in the XY plane, so its azimuth from X about Z is -90 degrees; rest
 * has no unique physical azimuth.
 *
 * Scenarios:
 *
 * 1. A prepared frame reads A=Rz(30), B=Rx(20)Rz(-15), restored A and -A. Physical
 *    direction/swing/twist follow those equations. Earlier reading records
 *    remain owned after caller mutation and later numerical reads.
 * 2. Preparation performs no numerical axis read. An owned input getter's
 *    transient refusal propagates, then a successful retry admits the same
 *    numeric basis. Later changing rotations share that admitted basis. Its
 *    observed read count measures basis-input work, not projection work.
 * 3. Ordinary frames still admit changed axes. Spreading or inheriting an already
 *    prepared frame does not transfer its admission to a new frame with
 *    malformed axes; only the original wrapper owns that preparation.
 *
 * Prepared axes and clinical mappings remain numerically unchanged. Only
 * ordinary raw frames, test-owned getters and returned readings are changed. No
 * range table, motion producer or Human imitation supplies an oracle. This
 * deferred CPU unit makes no full ROM, optimum or elapsed-time claim.
 */
export function test_engine_kinematics_swing_twist_range(): void {
  const findings: string[] = [];
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const joint: IAutoMovieJointRotationFrame = {
    axes,
    frame: { twist: { sign: -1, neutral: 10 } },
  };

  /** Collect whole scenarios without converting their thrown errors to passes. */
  function scenario(label: string, task: () => void): void {
    try {
      task();
    } catch (error) {
      findings.push(`${label}: ${String(error)}`);
    }
  }

  /** Compose these two cardinal factors directly, without a production helper. */
  function rotation(flexion: number, twist: number): IAutoMovieQuaternion {
    const f: number = (flexion * Math.PI) / 360;
    const t: number = (twist * Math.PI) / 360;
    return {
      x: Math.sin(f) * Math.cos(t),
      y: -Math.sin(f) * Math.sin(t),
      z: Math.cos(f) * Math.sin(t),
      w: Math.cos(f) * Math.cos(t),
    };
  }

  /** Admit observed finite coordinates before comparing their physical values. */
  function physical(
    label: string,
    reading: IAutoMovieSwingTwistRange.IReading,
    flexion: number,
    twist: number,
  ): void {
    const radians: number = (flexion * Math.PI) / 180;
    if (
      !(
        nclose(reading.direction.x, 0) &&
        nclose(reading.direction.y, -Math.sin(radians)) &&
        nclose(reading.direction.z, Math.cos(radians)) &&
        nclose(
          Math.hypot(
            reading.direction.x,
            reading.direction.y,
            reading.direction.z,
          ),
          1,
        ) &&
        nclose(reading.swing, Math.abs(flexion)) &&
        nclose(reading.twist, 10 - twist) &&
        (flexion === 0 || nclose(reading.azimuth, flexion > 0 ? -90 : 90))
      )
    )
      findings.push(
        `${label}: physical direction, swing or clinical twist differs`,
      );
  }

  scenario("immutable prepared numerical readings", (): void => {
    const prepared: IAutoMovieJointRotationFrame = AutoMovieEngineSwingTwistRange.prepare(
      "leftUpperArm",
      joint,
      AutoMovieEngineDefaultHumanoidRom.leftUpperArm!,
    );
    if (
      !(
        prepared !== joint &&
        prepared.axes === axes &&
        prepared.frame === joint.frame
      )
    )
      findings.push("prepared wrapper does not own exactly its borrowed frame");
    const a: IAutoMovieSwingTwistRange.IReading = AutoMovieEngineSwingTwistRange.read(
      rotation(0, 30),
      prepared,
    );
    const b: IAutoMovieSwingTwistRange.IReading = AutoMovieEngineSwingTwistRange.read(
      rotation(20, -15),
      prepared,
    );
    const restored: IAutoMovieSwingTwistRange.IReading = AutoMovieEngineSwingTwistRange.read(
      rotation(0, 30),
      prepared,
    );
    physical("A", a, 0, 30);
    physical("B", b, 20, -15);
    physical("restored A", restored, 0, 30);
    if (
      !(
        a !== b &&
        a !== restored &&
        a.direction !== b.direction &&
        a.direction !== restored.direction
      )
    )
      findings.push("prepared readings or directions share returned ownership");
    a.direction.y = 999;
    a.twist = 1234;
    const sign: IAutoMovieQuaternion = rotation(0, 30);
    physical(
      "opposite quaternion sign",
      AutoMovieEngineSwingTwistRange.read(
        {
          x: -sign.x,
          y: -sign.y,
          z: -sign.z,
          w: -sign.w,
        },
        prepared,
      ),
      0,
      30,
    );
    physical("earlier B remains owned", b, 20, -15);
    if (!(a.direction.y === 999 && a.twist === 1234))
      findings.push("a later read repaired caller-owned earlier output");
  });

  scenario("raw and copied frames retain live admission", (): void => {
    const invalid: IAutoMovieJointAxes = {
      ...axes,
      flexion: { x: 0, y: 0, z: 0 },
    };
    const raw: IAutoMovieJointRotationFrame = {
      axes: { ...axes, flexion: { ...axes.flexion } },
      frame: joint.frame,
    };
    physical(
      "raw before axes edit",
      AutoMovieEngineSwingTwistRange.read(rotation(0, 30), raw),
      0,
      30,
    );
    raw.axes.flexion.x = 0;
    if (
      !throwsError(
        (): IAutoMovieSwingTwistRange.IReading =>
          AutoMovieEngineSwingTwistRange.read(rotation(0, 30), raw),
        "flexion",
      )
    )
      findings.push("a warmed ordinary frame skipped current axis admission");
    raw.axes.flexion.x = 1;
    physical("raw recovery", AutoMovieEngineSwingTwistRange.read(rotation(0, 30), raw), 0, 30);

    const prepared: IAutoMovieJointRotationFrame = AutoMovieEngineSwingTwistRange.prepare(
      "leftUpperArm",
      joint,
      AutoMovieEngineDefaultHumanoidRom.leftUpperArm!,
    );
    physical(
      "source wrapper warmed",
      AutoMovieEngineSwingTwistRange.read(rotation(0, 30), prepared),
      0,
      30,
    );
    const copied: IAutoMovieJointRotationFrame = { ...prepared, axes: invalid };
    const inherited: IAutoMovieJointRotationFrame = Object.create(prepared, {
      axes: {
        value: invalid,
        enumerable: true,
        writable: true,
        configurable: true,
      },
    });
    for (const [label, frame] of [
      ["copied", copied],
      ["inherited", inherited],
    ] as const)
      if (
        !throwsError(
          (): IAutoMovieSwingTwistRange.IReading =>
            AutoMovieEngineSwingTwistRange.read(rotation(0, 30), frame),
          "flexion",
        )
      )
        findings.push(
          `${label} frame borrowed another wrapper's admitted basis`,
        );
    physical(
      "original wrapper remains valid",
      AutoMovieEngineSwingTwistRange.read(rotation(0, 30), prepared),
      0,
      30,
    );
  });

  TestValidator.equals(
    "swing/twist preparation remains operation-owned",
    findings,
    [],
  );
}

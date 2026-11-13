import { createPlyoBox, createPolearm } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanGymnastics,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A Fosbury flop and a pole vault carry the body over a height and lay it
 * down: on the average man and on the small woman, the flop's centre of
 * mass peaks at the bar with the body lying face up over it and comes down
 * to lie on the landing box, and the vault's pole end stays planted on the
 * floor while the body swings up over it, then the body flies and lies on
 * the floor. A bar out of reach and a vault from standing are refused.
 *
 * The bounds are gravity, which a ballistic centre's vertical acceleration
 * equals within 0.1 m/s², the campaign's 5 mm on a planted support and
 * 15 mm on a contact at its event, and the bar's height, which is where the
 * flop's centre peaks by the author's own statement, within 10 mm. Lying is
 * read as the hip joints within a fifth of the stature above the surface (a
 * lying trunk's half depth with room, an estimate) and the head level with
 * them within a quarter of the stature. The landing box is a 0.762 m
 * plyometric box standing in for a mat: only its top's height is read, and
 * whether the body lies within its extent is not. The pole is a 3 m spear,
 * the longest shaft the archetypes make, taken up standing on its butt and
 * planted by its butt, so it reaches 1.5 m from the hand: a short pole's
 * vault.
 *
 * Scenarios, for each of the two bodies:
 * 1. A flop over a 1.4 m bar onto the box's top 2.5 m ahead, out of
 *    standing: halfway to `apex` the centre falls at 9.81 m/s²; at `apex`
 *    the centre is at 1.4 m within 10 mm, the hips face up (their forward
 *    axis rises 0.7 or more) and the head is level with the hips within a
 *    quarter of the stature; at `settled` the body lies on the box's top.
 * 2. The same flop over a 3 m bar is refused as a `parameter` refusal on
 *    `bar`: from either body's take-off centre, about 1 m high, it needs a
 *    vertical speed near 6 m/s, far past the law's provisional cap of
 *    4.42 m/s, so the case does not hang on the cap's exact value.
 * 3. A vault on the spear out of a sprint cut at its third left heel strike,
 *    a foot planted to take off from: from
 *    `takeoff` to `release`, read at both and between, the spear's butt
 *    stays within 5 mm and within 15 mm of the floor; the centre is higher
 *    at `release` than at `takeoff`; halfway between `release` and
 *    `touchdown` the centre falls at 9.81 m/s²; at `settled` the body lies
 *    on the floor.
 * 4. The vault out of standing is refused as a `base` refusal on `run`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain with real archetypes as props and reads the displayed joints, centre of mass and prop; a centre that misses the bar, a body not lying over it, a pole that slides, a flight that is not ballistic or a landing that does not lie fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations Gravity, the author's bar and the archetypes' own sizes, the campaign's bounds and two stated estimates; nothing is read from the laws but their declared events. Limitation: the landing box's extent and the bar's clearance by each limb are not read.
 * @evidence contracts/development/testing.md#distinguishing-cases Two jumps, each with a refused case beside it, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, two archetypes and four performances each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and their basis, the stand-ins and the 4 scenarios.
 */
export function test_human_motion_gymnastics_jumps(): void {
  const box: ReturnType<typeof createPlyoBox> = createPlyoBox({
    height: 0.762,
  });
  const top: number = 0.762;
  const spear: ReturnType<typeof createPolearm> = createPolearm({
    kind: "spear",
    length: 3,
    headLength: 0.6,
  });
  const upright: IAutoMovieQuaternion = Quaternion.identity();
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const performer: HumanPerformance.IInput["performers"][number] = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    };
    const flop = (bar: number): HumanPerformance =>
      new HumanPerformance({
        seed: "flop",
        laws: [HumanGymnastics.fosburyFlop],
        performers: [performer],
        props: [
          HumanObject.prop("mat", box, {
            position: { x: 0, y: 0, z: 2.5 },
            rotation: upright,
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("fosburyFlop", {
            to: { x: 0, y: top, z: 2.5 },
            on: "mat",
            bar,
          }).node,
      });
    const vault = (run: boolean): HumanPerformance => {
      const taken: HumanChain = HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({ prop: "pole", handle: "shaft", hand: "right", lift: 0.05 })
        .stand({ seconds: 0.3 });
      return new HumanPerformance({
        seed: "pole",
        laws: [HumanGymnastics.vaultOnPole],
        performers: [performer],
        props: [
          HumanObject.prop("pole", spear, {
            position: { x: -0.25, y: 0, z: 0.3 },
            rotation: upright,
          }),
        ],
        composition: (run
          ? taken
              .run({ to: { x: 0, y: 0, z: 8 }, pace: "sprint" })
              .until({ event: "leftHeelStrike3" })
          : taken
        ).registered("vaultOnPole", { pole: "pole", end: "butt" }).node,
      });
    };
    const refused = (
      label: string,
      build: () => HumanPerformance,
      kind: string,
      axis: string,
    ): void => {
      let thrown: unknown = null;
      try {
        build();
      } catch (error) {
        thrown = error;
      }
      if (
        !(
          thrown instanceof HumanRefusal &&
          thrown.kind === kind &&
          thrown.axis === axis
        )
      )
        complaints.push(
          `${name} ${label}: a ${kind} refusal on ${axis} expected, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
        );
    };

    // Read a film's segment by its row.
    const reading = (
      film: HumanPerformance,
      row: string,
    ): {
      reader: HumanSignature.IReader;
      at: (event: string) => number;
      joint: (seconds: number, bone: AutoMovieHumanoidBone) => IAutoMovieVector3;
      hips: (seconds: number) => IAutoMovieVector3;
      fall: (seconds: number) => number;
    } => {
      const reader: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      const segment: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
      const joint = (
        seconds: number,
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
      return {
        reader,
        at: (event: string): number =>
          segment.start +
          (segment.plan.events.find((e): boolean => e.name === event)
            ?.share ?? Number.NaN) *
            segment.plan.duration,
        joint,
        hips: (seconds: number): IAutoMovieVector3 =>
          Vector3.lerp(
            joint(seconds, "leftUpperLeg"),
            joint(seconds, "rightUpperLeg"),
            0.5,
          ),
        fall: (seconds: number): number => {
          const h: number = 0.02;
          return (
            (HumanSignature.centre(reader, seconds + h).y -
              2 * HumanSignature.centre(reader, seconds).y +
              HumanSignature.centre(reader, seconds - h).y) /
            (h * h)
          );
        },
      };
    };
    const lies = (
      label: string,
      read: ReturnType<typeof reading>,
      seconds: number,
      surface: number,
    ): void => {
      const over: number = read.hips(seconds).y - surface;
      if (!(over >= 0 && over <= 0.2 * stature))
        complaints.push(
          `${label}: at settled the hips are ${over.toFixed(3)} m above the surface, 0 to ${(0.2 * stature).toFixed(3)} m expected`,
        );
      const level: number = Math.abs(
        read.joint(seconds, "head").y - read.hips(seconds).y,
      );
      if (!(level <= 0.25 * stature))
        complaints.push(
          `${label}: at settled the head is ${level.toFixed(3)} m off the hips' height, lying within ${(0.25 * stature).toFixed(3)} m expected`,
        );
    };
    const ballistic = (
      label: string,
      read: ReturnType<typeof reading>,
      seconds: number,
    ): void => {
      const fall: number = read.fall(seconds);
      if (!(Math.abs(fall + 9.81) <= 0.1))
        complaints.push(
          `${label}: the centre of mass accelerates at ${fall.toFixed(2)} m/s², -9.81 within 0.1 expected`,
        );
    };

    // 1. The flop.
    try {
      const read: ReturnType<typeof reading> = reading(flop(1.4), "fosburyFlop");
      const apex: number = read.at("apex");
      ballistic(`${name} flop rising`, read, (read.at("takeoff") + apex) / 2);
      const peak: number = HumanSignature.centre(read.reader, apex).y;
      if (!(Math.abs(peak - 1.4) <= 0.01))
        complaints.push(
          `${name} flop: at the apex the centre of mass is at ${peak.toFixed(3)} m, the 1.4 m bar within 10 mm expected`,
        );
      const facing: number = Quaternion.rotateVector(
        HumanSignature.bones(read.reader, apex).get("hips")!.worldRotation,
        { x: 0, y: 0, z: 1 },
      ).y;
      if (!(facing >= 0.7))
        complaints.push(
          `${name} flop: at the apex the hips' forward axis rises ${facing.toFixed(3)}, face up at 0.7 or more expected`,
        );
      const level: number = Math.abs(
        read.joint(apex, "head").y - read.hips(apex).y,
      );
      if (!(level <= 0.25 * stature))
        complaints.push(
          `${name} flop: at the apex the head is ${level.toFixed(3)} m off the hips' height, level within ${(0.25 * stature).toFixed(3)} m expected`,
        );
      lies(`${name} flop`, read, read.at("settled"), top);
    } catch (error) {
      complaints.push(
        `${name} flop: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. A bar out of reach.
    refused("flop over 3 m", (): HumanPerformance => flop(3), "parameter", "bar");

    // 3. The pole vault.
    try {
      const film: HumanPerformance = vault(true);
      const read: ReturnType<typeof reading> = reading(film, "vaultOnPole");
      const off: number = read.at("takeoff");
      const release: number = read.at("release");
      const butt = (seconds: number): IAutoMovieVector3 =>
        film.prop("pole", seconds).position;
      const planted: IAutoMovieVector3 = butt(off);
      if (!(Math.abs(planted.y) <= 0.015))
        complaints.push(
          `${name} pole vault: at the take-off the pole's butt is ${planted.y.toFixed(3)} m from the floor, within 15 mm expected`,
        );
      for (const seconds of [(off + release) / 2, release - 1e-3]) {
        const slid: number =
          1000 * Vector3.length(Vector3.subtract(butt(seconds), planted));
        if (!(slid <= 5))
          complaints.push(
            `${name} pole vault: the planted butt moves ${slid.toFixed(1)} mm by ${(seconds - off).toFixed(2)} s of the swing, 5 mm at most expected`,
          );
      }
      const lifted: number =
        HumanSignature.centre(read.reader, release).y -
        HumanSignature.centre(read.reader, off).y;
      if (!(lifted > 0))
        complaints.push(
          `${name} pole vault: the swing changes the centre's height by ${lifted.toFixed(3)} m, a rise expected`,
        );
      ballistic(
        `${name} pole vault flight`,
        read,
        (release + read.at("touchdown")) / 2,
      );
      lies(`${name} pole vault`, read, read.at("settled"), 0);
    } catch (error) {
      complaints.push(
        `${name} pole vault: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 4. A vault from standing.
    refused(
      "pole vault from standing",
      (): HumanPerformance => vault(false),
      "base",
      "run",
    );
  }
  TestValidator.equals(
    "a flop and a pole vault clear their height and lie down",
    complaints,
    [],
  );
}

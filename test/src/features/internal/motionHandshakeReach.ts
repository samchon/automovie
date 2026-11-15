import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the handshake reach specs on one pair. Two people stand
 * facing each other with their right shoulders on one line, the second one
 * placed so the two shoulders, as they stand, lie a chosen horizontal gap
 * apart, and shake hands (`HumanChain.pair(...).handshake`).
 *
 * Scenes:
 * - 0.729 m, the pair the website's handshake scene found refused: it plans,
 *   and the shoulders at the handshake's start stand that gap apart.
 * - 1.4 m, beyond any arm: it is refused on `partner`, the refusal's value
 *   the gap measured, its feasible range the band of gaps the pair shakes
 *   hands at, which holds 0.729 m and ends below 1.4 m.
 *
 * @param one The first partner's body.
 * @param other The second's.
 * @returns What went wrong; empty when both scenes read as stated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, both scenes and what each must show.
 * @evidence contracts/development/implementation.md#principled-implementation Places the pair by the shoulders the bodies stand with, read off a standing film, and reads the handshake's own plan and refusal through the public chain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging, two scenes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is read as a `HumanRefusal` with its axis, value and range; any other error is a complaint with its message.
 * @evidence contracts/development/implementation.md#efficient-algorithms A standing film and two handshakes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the handshake reach specs, one per pair.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionHandshakeReach(
  one: motionHumanBody.Name,
  other: motionHumanBody.Name,
): string[] {
  const a: IHumanBody = motionHumanBody(one);
  const b: IHumanBody = motionHumanBody(other);
  const label: string = `${one} shaking hands with ${other}`;

  // Each right shoulder as its body stands, from its own root.
  const standing: HumanPerformance = new HumanPerformance({
    seed: "shake",
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.1 })
      .with(HumanChain.subject("b").stand({ seconds: 0.1 })).node,
  });
  const shoulder = (subject: string): IAutoMovieVector3 =>
    standing.bones(subject, 0).get("rightUpperArm")!.worldPosition;
  const sa: IAutoMovieVector3 = shoulder("a");
  const sb: IAutoMovieVector3 = shoulder("b");
  const apart = (film: HumanPerformance): number => {
    const p: IAutoMovieVector3 = film
      .bones("a", 0)
      .get("rightUpperArm")!.worldPosition;
    const q: IAutoMovieVector3 = film
      .bones("b", 0)
      .get("rightUpperArm")!.worldPosition;
    return Math.hypot(q.x - p.x, q.z - p.z);
  };
  // The second partner faces back, so its right shoulder lies at the
  // opposite of its standing offset from its root.
  const shake = (gap: number): HumanPerformance =>
    new HumanPerformance({
      seed: "shake",
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: sa.x + sb.x, y: 0, z: sa.z + sb.z + gap },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.pair(
        HumanChain.subject("a"),
        HumanChain.subject("b"),
      ).handshake({ pumps: 2 }).node,
    });
  const out: string[] = [];

  // 1. The pair the website found refused plans.
  try {
    const film: HumanPerformance = shake(0.729);
    if (!(Math.abs(apart(film) - 0.729) <= 0.001))
      out.push(
        `${label}: the shoulders stand ${apart(film).toFixed(4)} m apart at the handshake's start, 0.729 m within 1 mm expected`,
      );
  } catch (error) {
    out.push(
      `${label} 0.729 m apart: threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a plan expected`,
    );
  }

  // 2. A pair beyond any arm is refused on the bound that failed.
  try {
    shake(1.4);
    out.push(`${label} 1.4 m apart: planned, a refusal on partner expected`);
  } catch (error) {
    if (!(error instanceof HumanRefusal))
      out.push(
        `${label} 1.4 m apart: threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a HumanRefusal expected`,
      );
    else {
      const band = error.feasible;
      if (error.kind !== "reach" || error.axis !== "partner")
        out.push(
          `${label} 1.4 m apart: refused on ${error.kind}/${error.axis}, reach/partner expected`,
        );
      if (
        typeof error.value !== "number" ||
        !(Math.abs(error.value - 1.4) <= 0.001)
      )
        out.push(
          `${label} 1.4 m apart: the refusal's value is ${String(error.value)}, the measured 1.4 m within 1 mm expected`,
        );
      if (
        band === null ||
        band.kind !== "range" ||
        band.minimum === null ||
        band.maximum === null ||
        !(band.minimum < 0.729 && 0.729 < band.maximum && band.maximum < 1.4)
      )
        out.push(
          `${label} 1.4 m apart: the refusal's band is ${JSON.stringify(band)}, a range holding 0.729 m and ending below 1.4 m expected`,
        );
    }
  }
  return out;
}

import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  HumanSword,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

import { motionBladeReach } from "./motionBladeReach";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The blade strokes on one body, which the blade stroke specs share: an arming
 * sword taken by its grip for use on the oblique line, then a thrust, the same
 * thrust at a pell 0.1 m aside, a descending diagonal cut, a lunge at a pell
 * that needs a full one and a lunge at a nearer pell in one film at five
 * pells, each read at its own decisive instant, and a bare-hand thrust beyond
 * the longest advance, which must be refused. The lunges' pells stand at the
 * sword's own reach (`motionBladeReach`), so the distance decides how far each
 * lunge goes. The bounds, their
 * sources and the scenarios are stated on the specs.
 *
 * @param name The body.
 * @returns The complaints; none when every stroke meets its target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is performed and read, on what, and where the bounds and scenarios are stated.
 * @evidence contracts/development/implementation.md#principled-implementation One film of the four strokes and one refused plan, read off the displayed sword and feet at each stroke's decisive instant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One block per scenario in the specs' order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the spec's own, unchanged by the split.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film a body: taking a tool for a use is the film's costly part.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the blade stroke specs, so the reading is written once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the film is dropped on return.
 */
export function motionBladeStrokes(name: "m-average" | "f-small"): string[] {
  const FRAME: number = 1 / 24;
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const complaints: string[] = [];
  const placed = (
    frame: IHumanProp.IFrame,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, local));
  const apart = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));

  const body: IHumanBody = motionHumanBody(name);
  const stature: number = body.measure.stature;

  // A pell on a bearing (degrees to the performer's left) at a distance,
  // its target facing the performer, with an offset to the side.
  const stands = (
    bearing: number,
    distance: number,
    aside: number = 0,
  ): { at: IAutoMovieVector3; yaw: number } => {
    const radians: number = (bearing * Math.PI) / 180;
    return {
      at: {
        x: distance * Math.sin(radians) + aside,
        y: 0,
        z: distance * Math.cos(radians),
      },
      yaw: bearing + 180,
    };
  };
  const near: number = 0.66 * stature;
  const pells: Readonly<
    Record<string, { at: IAutoMovieVector3; yaw: number }>
  > = {
    ahead: stands(0, near),
    aside: stands(0, near, 0.1),
    left: stands(25, 0.5 * stature),
    right: motionBladeReach.lunge(body, sword, pell, -25, 1),
    close: motionBladeReach.lunge(body, sword, pell, -10, 0.4),
  };
  const target = (id: string): IAutoMovieVector3 =>
    placed(
      HumanObject.frame(pells[id]!),
      pell.affordance("target").frame.translation,
    );
  const at = (id: string): object => ({
    blade: "sword",
    target: { kind: "prop", subject: id, point: "target" },
  });
  const film: HumanPerformance = new HumanPerformance({
    seed: "blade",
    laws: [...Object.values(HumanBlade), HumanSword.cut],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      // The sword lies level before the right hand, point ahead, edge
      // down, as on a table.
      HumanObject.prop("sword", sword, {
        position: { x: -0.1 * stature, y: 0.6 * stature, z: 0.18 * stature },
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      }),
      ...Object.entries(pells).map(
        ([id, where]: [string, { at: IAutoMovieVector3; yaw: number }]) =>
          HumanObject.prop(id, pell, where),
      ),
    ],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .pickUp({
        prop: "sword",
        handle: "grip",
        use: { tip: "point", line: "oblique" },
      })
      .registered("thrust", at("ahead"), "first")
      .registered("thrust", at("aside"), "second")
      .registered("swordCut", { ...at("left"), from: "aboveForehand" }, "cut")
      .registered("lunge", at("right"), "lunge")
      .registered("lunge", at("close"), "short").node,
  });
  const act = (anchor: string): HumanSegment.ISegment =>
    film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.id === anchor)!;
  const decisive = (segment: HumanSegment.ISegment): number =>
    segment.start + (segment.plan.contact ?? Number.NaN);
  const point = (seconds: number): IAutoMovieVector3 =>
    placed(
      film.prop("sword", seconds),
      sword.affordance("point").frame.translation,
    );
  const reader: HumanSignature.IReader = HumanSignature.of(film, "a", body, 0);
  const toes = (seconds: number, side: "left" | "right"): IAutoMovieVector3 =>
    HumanSignature.joint(reader, seconds, `${side}Toes`);

  // 1. A thrust from where they stand.
  const first: HumanSegment.ISegment = act("first");
  const missed: number = apart(point(decisive(first)), target("ahead"));
  if (!(missed <= 0.015))
    complaints.push(
      `${name}: the thrust's point is ${(missed * 1000).toFixed(1)} mm from the pell's target at its decisive instant, 15 mm at most expected`,
    );
  for (const side of ["left", "right"] as const) {
    const slid: number = apart(
      toes(first.entryTime, side),
      toes(decisive(first), side),
    );
    if (!(slid <= 0.005))
      complaints.push(
        `${name}: the ${side} foot moves ${(slid * 1000).toFixed(1)} mm during a thrust made standing, 5 mm at most expected`,
      );
  }

  // 2. The point follows a moved target.
  const followed: number = apart(
    point(decisive(act("second"))),
    Vector3.add(point(decisive(first)), { x: 0.1, y: 0, z: 0 }),
  );
  if (!(followed <= 0.015))
    complaints.push(
      `${name}: at a pell 0.1 m aside the thrust's point lands ${(followed * 1000).toFixed(1)} mm from 0.1 m aside of where it first landed, 15 mm at most expected`,
    );

  // 3. A descending diagonal cut.
  const cut: number = decisive(act("cut"));
  const blade = (seconds: number, share: number): IAutoMovieVector3 =>
    Vector3.lerp(film.prop("sword", seconds).position, point(seconds), share);
  let least: number = Infinity;
  let where: number = 0;
  for (let share: number = 0; share <= 1; share += 0.01) {
    const gap: number = apart(blade(cut, share), target("left"));
    if (gap < least) {
      least = gap;
      where = share;
    }
  }
  if (!(least <= 0.015))
    complaints.push(
      `${name}: at the cut's decisive instant the pell's target is ${(least * 1000).toFixed(1)} mm from the blade, 15 mm at most expected`,
    );
  const fell: number = blade(cut - FRAME, where).y - blade(cut, where).y;
  if (!(fell > 0.05))
    complaints.push(
      `${name}: over the frame before its decisive instant the descending cut's landing part comes down ${(fell * 1000).toFixed(0)} mm, more than 50 mm expected`,
    );

  // 4. A lunge.
  const lunge: HumanSegment.ISegment = act("lunge");
  const short: number = apart(point(decisive(lunge)), target("right"));
  if (!(short <= 0.015))
    complaints.push(
      `${name}: the lunge's point is ${(short * 1000).toFixed(1)} mm from the pell's target at its decisive instant, 15 mm at most expected`,
    );
  const travelled: number =
    apart(
      { ...toes(decisive(lunge), "right"), y: 0 },
      { ...toes(lunge.entryTime, "right"), y: 0 },
    ) / stature;
  if (!(travelled >= 0.35 && travelled <= 0.55))
    complaints.push(
      `${name}: the lunge's leading foot travels ${travelled.toFixed(3)} of the stature, 0.35 to 0.55 expected (provisional)`,
    );
  const back: number = apart(
    toes(lunge.end, "right"),
    toes(lunge.entryTime, "right"),
  );
  if (!(back <= 0.005))
    complaints.push(
      `${name}: after the lunge's recovery the leading foot is ${(back * 1000).toFixed(1)} mm from where it stood, 5 mm at most expected`,
    );

  // 5. A lunge at a nearer pell goes only as far as its target requires: it
  // is shorter than a full one and lands with the arm as far out as the full
  // lunge's, the reach both are measured to, so the target stands as far from
  // the shoulder.
  const shorter: HumanSegment.ISegment = act("short");
  const landed: number = decisive(shorter);
  const close: number = apart(point(landed), target("close"));
  if (!(close <= 0.015))
    complaints.push(
      `${name}: the shorter lunge's point is ${(close * 1000).toFixed(1)} mm from the pell's target at its decisive instant, 15 mm at most expected`,
    );
  const stepped: number =
    apart(
      { ...toes(landed, "right"), y: 0 },
      { ...toes(shorter.entryTime, "right"), y: 0 },
    ) / stature;
  if (!(stepped < 0.35))
    complaints.push(
      `${name}: the lunge at the nearer pell carries the leading foot ${stepped.toFixed(3)} of the stature, under a full lunge's 0.35 expected`,
    );
  const reached = (anchor: string, id: string): number =>
    apart(
      target(id),
      HumanSignature.joint(reader, decisive(act(anchor)), "rightUpperArm"),
    );
  const out: number = reached("short", "close") - reached("lunge", "right");
  if (!(Math.abs(out) <= 0.01))
    complaints.push(
      `${name}: the lunge at the nearer pell lands with its target ${reached("short", "close").toFixed(3)} m from the shoulder and the full lunge with its own ${reached("lunge", "right").toFixed(3)} m, the same within 10 mm expected`,
    );

  // 6. Out of reach of the longest advance.
  let refused: unknown = null;
  try {
    new HumanPerformance({
      seed: "blade",
      laws: Object.values(HumanBlade),
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("thrust", {
          target: {
            kind: "point",
            at: { x: 0, y: 0.7 * stature, z: 3 },
            frame: "world",
          },
        }).node,
    });
  } catch (error) {
    refused = error;
  }
  if (
    !(
      refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.feasible?.kind === "range" &&
      refused.feasible.maximum !== null &&
      refused.feasible.maximum < 1
    )
  )
    complaints.push(
      `${name}: a bare-hand thrust at a point 3 m away: a reach refusal with the arm's length expected, got ${refused instanceof Error ? refused.message : String(refused)}`,
    );
  return complaints;
}

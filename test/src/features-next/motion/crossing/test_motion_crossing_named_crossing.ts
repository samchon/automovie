import { createKerb, createPlyoBox } from "@automovie/archetypes";
import { Vector3, physicalShapePairDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCrossing,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanColliders,
  HumanFoot,
  HumanHand,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The skin give a displayed segment may press into a prop, metres: the motion audits' built contact skin of 10 mm. */
const SKIN: number = 0.01;

/**
 * Approach named geometry, cross it with the selected path and walk on from the exit.
 *
 * Scenarios:
 * 1. An average man and a small woman step over a kerb, jump it, vault a
 *    raised step on one palm and jump the gap between two plyo boxes.
 * 2. No displayed segment that does not bear on a crossed prop enters it
 *    beyond the audits' skin give, sampled at 60 frames a second.
 * 3. The jumps publish take-off and touchdown; the gap's supports are the
 *    two named decks; the vault's palm stays flat on the step's top.
 * 4. The exit walk joins without a step and ends on the far side.
 * 5. A jump apex too low to clear the kerb is refused naming the kerb.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the visible approach, four crossing paths, the displayed clearance and the following beat.
 * @evidence contracts/development/testing.md#behavioral-verification Reads contact ownership, native take-off and touchdown, actual landing sole height and displayed handoff.
 * @evidence contracts/development/testing.md#independent-expectations Reads deck heights and separation from independent fixed archetypes.
 * @evidence contracts/development/testing.md#distinguishing-cases Both bodies, grounded step, palm support, airborne barrier, distinct landing ownership and an impossible clearance.
 * @evidence contracts/development/testing.md#execution-ownership Runs through registered installed laws and physical scene props.
 */
export function test_motion_crossing_named_crossing(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const kerb = createKerb({ kind: "kerb", height: 0.12 });
  const step = createKerb({ kind: "step" });
  const box = createPlyoBox({ kind: "wood" });
  const upper = box.affordances.find(
    (affordance) => affordance.id === "surface",
  )!;
  const deckHeight: number = upper.frame.translation.y;
  const destination: number = upper.depth! + 0.24;
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("kerb", kerb, {
      fixed: true,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    HumanObject.prop("step", step, {
      fixed: true,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    HumanObject.prop("launch", box, {
      fixed: true,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    HumanObject.prop("landing", box, {
      fixed: true,
      at: { x: 0, y: 0, z: destination },
      yaw: 0,
    }),
  ];
  const stamp = (
    body: IAutoMovieMotionHumanBody,
    p: IAutoMovieMotionHumanCrossing.IParams,
  ) => {
    const gap: boolean = p.kind === "gap";
    const approach: number = gap
      ? 0
      : p.kind === "step"
        ? 0.42
        : p.kind === "jump"
          ? 0.9
          : 0.75;
    const runway = gap ? { on: { prop: "launch" } } : {};
    return new HumanPerformance({
      seed: "named-crossing:" + p.kind,
      props: gap ? props.slice(2) : [props[p.kind === "vault" ? 1 : 0]!],
      laws: [AutoMovieMotionHumanCrossing.HumanTraversal.crossObstacle],
      performers: [
        {
          subject: "a",
          body,
          at: {
            x: 0,
            y: gap ? deckHeight : 0,
            z: gap ? -0.15 : approach + 0.72,
          },
          yaw: gap ? 0 : 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.28, sway: 0, ...runway })
        .walk({
          to: { x: 0, y: gap ? deckHeight : 0, z: approach },
          face: gap ? 0 : 180,
          pace: "slow",
          ...runway,
        })
        .registered("crossObstacle", p)
        .walk({
          to: {
            x: 0,
            y: gap ? deckHeight : 0,
            z: gap ? destination + 0.12 : -1.7,
          },
          ...(gap ? { on: { prop: "landing" } } : {}),
          pace: "slow",
        }).node,
    });
  };
  for (const name of ["m-average", "f-small"] as const) {
    const body = motionHumanBody(name);
    for (const p of [
      { kind: "step", obstacle: "kerb" },
      { kind: "jump", obstacle: "kerb", apex: 0.42 },
      { kind: "vault", over: { prop: "step", point: "top" } },
      {
        kind: "gap",
        from: { prop: "launch", point: "surface" },
        to: { prop: "landing", point: "surface" },
        apex: 0.42,
      },
    ] as const) {
      const label: string = name + " " + p.kind;
      let film: HumanPerformance;
      try {
        film = stamp(body, p);
      } catch (error) {
        all.check(
          label +
            ": the named path admits its entire approach and exit: " +
            String(error),
          false,
        );
        continue;
      }
      const crossing: IAutoMovieMotionHumanSegment = film.segments("a")[2]!;
      const crossed: IAutoMovieMotionHumanProp[] = props.filter(
        (prop: IAutoMovieMotionHumanProp): boolean =>
          p.kind === "gap"
            ? prop.subject === "launch" || prop.subject === "landing"
            : prop.subject === (p.kind === "vault" ? "step" : "kerb"),
      );
      const deepest: IEntry = clearance(body, film, crossing, crossed);
      all.check(
        label +
          ": no free segment enters a crossed prop beyond the skin give, deepest " +
          deepest.depth.toFixed(4) +
          " m at " +
          deepest.at,
        deepest.depth <= SKIN,
      );
      if (p.kind === "jump" || p.kind === "gap")
        all.check(
          label + ": take-off precedes touchdown",
          crossing.plan.events.some((e) => e.name === "takeoff") &&
            crossing.plan.events.some((e) => e.name === "touchdown"),
        );
      if (p.kind === "vault") {
        const plant = crossing.plan.contacts.find(
          (c) =>
            c.part === "leftHand" &&
            c.kind === "plant" &&
            c.support.kind === "prop" &&
            c.support.subject === "step",
        );
        all.check(
          label + ": a palm supports weight on the shaped obstacle",
          plant !== undefined,
        );
        if (plant !== undefined) {
          const palms = [0.12, 0.5, 0.88].map((part) => {
            const share = plant.from + (plant.to - plant.from) * part;
            return HumanHand.frame(
              body,
              film.bones("a", crossing.start + share * crossing.plan.duration),
              "left",
              "palm",
            );
          });
          const physicalTop = step.affordances.find(
            (affordance) => affordance.id === "top",
          )!.frame.translation.y;
          all.check(
            label +
              ": the displayed palm stays on the top with its normal toward it",
            palms.every(
              (pose) =>
                Math.abs(pose.point.y - physicalTop) <= 0.022 &&
                Vector3.distance(pose.point, palms[0]!.point) <= 0.025 &&
                -pose.normal.y > 0.83,
            ),
          );
        }
      }
      if (p.kind === "gap")
        all.check(
          label + ": the landing and departure are the two exact platforms",
          ["launch", "landing"].every((subject) =>
            crossing.plan.contacts.some(
              (c) => c.support.kind === "prop" && c.support.subject === subject,
            ),
          ),
        );
      const before = film
        .bones("a", crossing.end - 0.001)
        .get("hips")!.worldPosition;
      const after = film
        .bones("a", crossing.end + 0.001)
        .get("hips")!.worldPosition;
      all.check(
        label + ": the exit beat is continuous",
        Vector3.distance(before, after) < 0.025,
      );
      const finish = film.bones("a", film.duration);
      const sole = HumanFoot.sockets(body, finish, "right")[1]!.point;
      all.check(
        label + ": the real sole ends clear beyond the crossing",
        p.kind === "gap"
          ? sole.z > destination - 0.06 && Math.abs(sole.y - deckHeight) < 0.018
          : sole.z < -1.2 && Math.abs(sole.y) < 0.018,
      );
    }

    let refused: unknown;
    try {
      stamp(body, { kind: "jump", obstacle: "kerb", apex: 0.006 });
    } catch (error) {
      refused = error;
    }
    all.check(
      name +
        ": impossible clearance names the physical obstacle: " +
        String(refused),
      refused instanceof HumanRefusal &&
        refused.axis === "obstacle" &&
        refused.value === "kerb",
    );
  }
  all.assert("named geometry bounds the complete staged crossing");
}

/** A displayed segment's entry into a prop. */
interface IEntry {
  /** Depth, metres. */
  depth: number;

  /** The bone and the crossing's second. */
  at: string;
}

/** The deepest entry of a displayed segment into a crossed prop over the crossing, skipping a hand or foot while it bears on that prop. */
function clearance(
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  crossing: IAutoMovieMotionHumanSegment,
  props: readonly IAutoMovieMotionHumanProp[],
): IEntry {
  let deepest: IEntry = { depth: 0, at: "" };
  const frames: number = Math.ceil(crossing.plan.duration * 60);
  for (let i: number = 0; i <= frames; i++) {
    const share: number = i / frames;
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "a",
      crossing.start + share * crossing.plan.duration,
    );
    for (const piece of HumanColliders.placed(body, bones)) {
      const foot: boolean =
        piece.bone.endsWith("Foot") || piece.bone.endsWith("Toes");
      const hand: boolean = /Hand$|Thumb|Index|Middle|Ring|Little/.test(
        piece.bone,
      );
      const part: string = `${piece.bone.startsWith("left") ? "left" : "right"}${foot ? "Foot" : "Hand"}`;
      for (const prop of props) {
        const bearing: boolean =
          (foot || hand) &&
          crossing.plan.contacts.some(
            (window: IAutoMovieMotionHumanContactWindow): boolean =>
              window.part === part &&
              window.support.kind === "prop" &&
              window.support.subject === prop.subject &&
              share >= window.from &&
              share <= window.to,
          );
        if (bearing) continue;
        for (const shape of piece.shapes)
          for (const solid of prop.shapes ?? []) {
            const depth: number = -physicalShapePairDistance(
              piece.pose,
              shape,
              prop.frame,
              solid,
            );
            if (depth > deepest.depth)
              deepest = {
                depth,
                at: `${piece.bone} ${(share * crossing.plan.duration).toFixed(3)} s`,
              };
          }
      }
    }
  }
  return deepest;
}

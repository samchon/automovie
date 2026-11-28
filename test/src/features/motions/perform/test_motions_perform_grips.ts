import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import {
  HumanPerformanceGrips
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceGrips";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { testAffordance } from "../../internal/fixtures/testAffordance";

/** No offset. */
const AT: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * `HumanPerformanceGrips` lists every span carrying a prop in film order: the
 * performance's prepared spans, or those assembled from the placed actions'
 * hand grips, holds, wears and mounts and the prop's own declaration, each worn
 * or mounted span ending where the next carrier starts and each hand's span
 * ending where a wear or mount within it takes the prop.
 *
 * A cup is gripped by the right hand over the middle half of a 2 s action from
 * 0 s, by the left over its last tenth, and by the right over a late-entered
 * action from 3.5 to 4 s; worn on the head from 5.5 s; held in the left hand
 * from 6.5 to 8 s; and set on the rack's peg at its offset at 7 s.
 *
 * Scenarios:
 *
 * 1. The cup's spans, in film order: right 0.5 to 1.5 s, left 1.8 to 2 s, right
 *    3.5 to 4 s (clipped to the entry), the head 5.5 to 6.5 s (ended by the
 *    hold), the left hand 6.5 to 7 s (ended by the mount) and the peg from 7 s,
 *    seated at its offset; a grip that carries nothing, a plant, a grip on
 *    another prop, and a wear before its action entered are not spans.
 * 2. A worn hat and a lid mounted on the rack declare spans of their own, the
 *    lid's ended by the first grip on it; a fixed prop has none.
 * 3. Prepared spans are returned as prepared.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Grip-span coverage includes hand windows, wear and mount handoffs, prop-declared carriers, excluded contact types, and prepared span identity.
 * @evidence contracts/development/testing.md#behavioral-verification The collector receives a staged person with typed contacts, later holds, wear and mount records. The test compares exact summarized carrier, times and flags, then verifies that a prepared array is returned by identity.
 * @evidence contracts/development/testing.md#independent-expectations A two-second action maps its middle half to [0.5, 1.5] s and its last tenth to [1.8, 2] s. The late grip starts at the placed entry 3.5 s. Wear ends at the hold's 6.5 s start, then the mount takes over at 7 s.
 */
export async function test_motions_perform_grips(): Promise<void> {
  const rack: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "rack",
    { affordances: [testAffordance("peg", "hook", { x: 0, y: 1, z: 0 })] },
    { at: { x: 3, y: 0, z: 0 }, yaw: 0 },
  );
  const plain = (subject: string): IAutoMovieMotionHumanProp =>
    AutoMovieMotionHumanObject.prop(subject, { affordances: [] }, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    });
  const { state } = await standingPerformanceState([
    rack,
    plain("cup"),
    { ...plain("hat"), worn: { subject: "actor", bone: "head", offset: AT } },
    {
      ...plain("lid"),
      mounted: { prop: "rack", point: "peg", offset: AT },
    },
    { ...plain("bench"), fixed: true },
  ]);
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const template: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const action = (
    start: number,
    entryTime: number,
    end: number,
    duration: number,
    plan: Partial<IAutoMovieMotionHumanActionPlan>,
  ): IAutoMovieMotionHumanSegment => ({
    ...template,
    start,
    entryTime,
    end,
    plan: { ...template.plan, duration, contacts: [], ...plan },
  });
  const cupGrip = (
    part: "leftHand" | "rightHand",
    from: number,
    to: number,
  ): IAutoMovieMotionHumanActionPlan["contacts"][number] => ({
    part,
    kind: "grip",
    from,
    to,
    support: { kind: "prop", subject: "cup" },
  });
  const segments: IAutoMovieMotionHumanSegment[] = [
    action(0, 0, 2, 2, {
      contacts: [
        cupGrip("rightHand", 0.25, 0.75),
        cupGrip("leftHand", 0.9, 1),
        {
          part: "rightHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "cup", carries: false },
        },
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "cup" },
        },
        {
          part: "rightHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "rack" },
        },
      ],
    }),
    action(3, 3.5, 4, 2, { contacts: [cupGrip("rightHand", 0, 1)] }),
    action(5, 5, 6, 1, { wears: [{ prop: "cup", bone: "head", from: 0.5 }] }),
    action(7, 7, 7.5, 1, {
      mounts: [
        { prop: "cup", onto: "rack", point: "peg", from: 0, offset: AT },
        { prop: "lid", onto: "rack", point: "peg", from: 0.25 },
      ],
    }),
    action(8, 8.5, 9, 1, { wears: [{ prop: "cup", bone: "head", from: 0 }] }),
  ];
  const self: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    people: new Map([
      [
        "actor",
        {
          ...person,
          segments,
          overlays: [],
          holds: [
            {
              side: "left",
              prop: "cup",
              fingers: {},
              source: template,
              from: 6.5,
              until: 8,
            },
          ],
        },
      ],
    ]),
    grips: new Map(),
  };
  const spans = (subject: string) =>
    HumanPerformanceGrips.assemble(self, subject).map((g) => [
      g.bone ?? g.mount?.point ?? g.side,
      g.from,
      g.to,
      g.mount?.seated === true,
      g.offset !== undefined,
    ]);

  // 1. The cup.
  TestValidator.equals("the cup's spans", spans("cup"), [
    ["right", 0.5, 1.5, false, false],
    ["left", 1.8, 2, false, false],
    ["right", 3.5, 4, false, false],
    ["head", 5.5, 6.5, false, false],
    ["left", 6.5, 7, false, false],
    ["peg", 7, Infinity, true, true],
  ]);

  // 2. Declared spans.
  TestValidator.equals("a worn hat", spans("hat"), [
    ["head", -Infinity, Infinity, false, true],
  ]);
  TestValidator.equals("a mounted lid", spans("lid"), [
    ["peg", -Infinity, 7.25, false, true],
    ["peg", 7.25, Infinity, false, false],
  ]);
  TestValidator.equals("a fixed bench", spans("bench"), []);

  // 3. Prepared spans.
  const prepared: IAutoMovieMotionHumanPerformanceState.IGrip[] = [
    { subject: "actor", side: "left", from: 0, to: 1 },
  ];
  TestValidator.predicate(
    "prepared spans",
    HumanPerformanceGrips({ ...self, grips: new Map([["cup", prepared]]) }, "cup") ===
      prepared && HumanPerformanceGrips(self, "cup").length === 6,
  );
}

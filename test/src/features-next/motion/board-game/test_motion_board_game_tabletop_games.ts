import {
  createBanknote,
  createChessBoard,
  createChessPiece,
  createDie,
  createGamingChip,
  createPlayingCard,
  createSeat,
  createTable,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBoardGame,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A placed prop lands within this of its target, metres. */
const LAND: number = 0.005;
/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** A dealt card lands within its seat's area: a card's half width, metres. */
const SEAT: number = 0.03;
/** A displayed prop moves at most this between frames 1/24 s apart, metres. */
const STEP: number = 0.08;
/** The seated actor's chair, ahead of the origin facing the table. */
const CHAIR: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
/** Face down: a card's back up. */
const DOWN: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
/** Face up: turned over about its long side. */
const UP: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };

/**
 * Seated tabletop play (#3982): chess, cards, chips, notes and dice, every
 * prop tracked from its start through each hand and support to its place.
 *
 * Scenarios, on m-average and f-small:
 * 1. Chess: a white pawn moves e2 to e3, then captures a black pawn on d3,
 *    which is lifted off the board first; each lands on its target
 *    square's centre or its aside point, held still in the hand between.
 *    An occupied target without its capture is refused before anything
 *    moves.
 * 2. Cards: three cards are dealt face down to three seats, each landing in
 *    its seat's area; one is revealed face up; a shuffle holds one packet
 *    in each hand, both grips holding until the packets join on one deck.
 *    A seat beyond the dealer's reach is refused with its distance.
 * 3. Chips, notes and a die: a chip stack is pushed to the pot whole, two
 *    notes are counted onto a pile, and a die comes to rest on the table's
 *    surface.
 * Every take passes the shipped verdicts, and no displayed prop jumps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the refusals and the identity checks.
 * @evidence contracts/development/testing.md#behavioral-verification Composes AutoMovieMotionHumanBoardGame.HumanTabletop over seated takes and reads displayed props, hands and board squares.
 * @evidence contracts/development/testing.md#independent-expectations Targets are the archetypes' own squares and authored seat points; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Move against capture, free against occupied square, reachable against distant seat, face down against face up.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_board_game_tabletop_games(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("tabletop games");
}

/** The seated scene: chair, table and the table's top. */
function stage(): IStage {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = { at: CHAIR, yaw: 0, fixed: true } as const;
  const table = createTable({ id: "table", kind: "dining" });
  const top: IAutoMovieAffordance = table.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "top",
  )!;
  const centre: number = CHAIR.z + 0.05 + top.depth! / 2;
  return {
    seat: HumanObject.seat(chair, placement),
    props: [
      HumanObject.prop("chair", chair, placement),
      everydayTake.prop(
        "table",
        table,
        { x: 0, y: 0, z: centre },
        undefined,
        true,
      ),
    ],
    height: top.frame.translation.y,
    near: CHAIR.z + 0.05,
  };
}

/** The actor seated, then the play. */
function seated(stage: IStage): IAutoMovieMotionHumanChain {
  return HumanChain.subject("actor").sit({ seat: stage.seat, hold: 1 });
}

/** The take, with the shipped verdicts and the identity continuity checked. */
function play(
  body: IAutoMovieMotionHumanBody,
  label: string,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
  tracked: readonly string[],
  checks: motionComplaints.IGatherer,
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `tabletop-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
  );
  everydayTake.clean(label, take);
  for (const subject of tracked) {
    let most: number = 0;
    for (let t: number = 1 / 24; t <= take.duration; t += 1 / 24)
      most = Math.max(
        most,
        Vector3.distance(
          take.prop(subject, t).position,
          take.prop(subject, t - 1 / 24).position,
        ),
      );
    checks.check(
      `${label}: ${subject} moves without a jump (${most.toFixed(3)} m)`,
      most <= STEP,
    );
  }
  return take;
}

/** A world point on the table top at a reach ahead and across. */
function onTable(stage: IStage, x: number, ahead: number): IAutoMovieVector3 {
  return { x, y: stage.height, z: stage.near + ahead };
}

/** Chess: a move, a capture and the occupied-square refusal. */
function chess(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  const board = createChessBoard({ id: "board" });
  const centre: IAutoMovieVector3 = onTable(s, 0, 0.24);
  const square: (id: string) => IAutoMovieVector3 = (
    id: string,
  ): IAutoMovieVector3 => {
    const a: IAutoMovieAffordance = board.affordances!.find(
      (x: IAutoMovieAffordance): boolean => x.id === id,
    )!;
    return Vector3.add(centre, a.frame.translation);
  };
  const white = createChessPiece({ id: "wp", kind: "pawn", side: "white" });
  const black = createChessPiece({ id: "bp", kind: "pawn", side: "black" });
  const aside: IAutoMovieVector3 = onTable(s, -0.2, 0.04);
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    everydayTake.prop("board", board, centre, undefined, true),
    everydayTake.prop("wp", white, square("e2")),
    everydayTake.prop("bp", black, square("d3")),
  ];
  const chain: IAutoMovieMotionHumanChain =
    AutoMovieMotionHumanBoardGame.HumanTabletop.chessMove(
      AutoMovieMotionHumanBoardGame.HumanTabletop.chessMove(seated(s), {
        board: "board",
        piece: "wp",
        to: "e3",
        occupancy: { e2: "wp", d3: "bp" },
      }),
      {
        board: "board",
        piece: "wp",
        to: "d3",
        occupancy: { e3: "wp", d3: "bp" },
        capture: "bp",
        aside,
      },
    );
  const take: HumanPerformance = play(
    body,
    label,
    props,
    chain,
    ["wp", "bp"],
    checks,
  );
  const moves: IAutoMovieMotionHumanSegment[] = take
    .segments("actor")
    .filter(
      (x: IAutoMovieMotionHumanSegment): boolean => x.law.name === "putDown",
    );
  const pickups: IAutoMovieMotionHumanSegment[] = take
    .segments("actor")
    .filter(
      (x: IAutoMovieMotionHumanSegment): boolean => x.law.name === "pickUp",
    );
  checks.check(
    `${label}: the pawn lands on e3's centre`,
    Vector3.distance(take.prop("wp", moves[0]!.end).position, square("e3")) <=
      LAND,
  );
  checks.check(
    `${label}: the captured pawn is set aside off the board`,
    Vector3.distance(take.prop("bp", take.duration).position, aside) <= LAND,
  );
  checks.check(
    `${label}: the capture lands on d3's centre`,
    Vector3.distance(take.prop("wp", take.duration).position, square("d3")) <=
      LAND,
  );
  checks.check(
    `${label}: the captured pawn leaves the board before the capturing one moves`,
    moves[1]!.end <= pickups[2]!.start + 1e-6,
  );
  for (let k: number = 0; k < pickups.length; ++k)
    checks.check(
      `${label}: pickup ${k + 1}'s piece stays in the hand to its placement`,
      everydayTake.drift(
        take,
        "right",
        k === 1 ? "bp" : "wp",
        pickups[k]!.end,
        moves[k]!.start,
      ) <= HOLD,
    );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const occupied: HumanRefusal | undefined = everydayTake.refusal(() =>
      AutoMovieMotionHumanBoardGame.HumanTabletop.chessMove(seated(s), {
        board: "board",
        piece: "wp",
        to: "d3",
        occupancy: { e3: "wp", d3: "bp" },
      }),
    );
    checks.check(
      `${label}: an occupied square without its capture is refused`,
      occupied !== undefined && occupied.axis === "to",
    );
  }
}

/** Cards: a deal, a reveal, a shuffle and the distant seat's refusal. */
function cards(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  const thickness: number = 0.0003;
  const deck: IAutoMovieVector3 = onTable(s, -0.05, 0.06);
  const card: (
    id: string,
    k: number,
    at?: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanProp = (
    id: string,
    k: number,
    at: IAutoMovieVector3 = deck,
  ): IAutoMovieMotionHumanProp =>
    everydayTake.prop(
      id,
      createPlayingCard({ id }),
      { ...at, y: at.y + k * thickness },
      DOWN,
    );
  const seats: IAutoMovieVector3[] = [
    onTable(s, -0.15, 0.1),
    onTable(s, 0, 0.16),
    onTable(s, 0.15, 0.1),
  ];
  // The deck's top card is the highest one: deal from the top down.
  const dealt: string[] = ["c3", "c2", "c1"];
  // Each packet lies on its own hand's side (world +X is the player's left).
  const left: IAutoMovieVector3 = onTable(s, 0.12, 0.05);
  const right: IAutoMovieVector3 = onTable(s, -0.12, 0.05);
  const packets: IAutoMovieMotionHumanProp[] = [
    card("l0", 0, left),
    mounted(card("l1", 1, left), "l0"),
    card("r0", 0, right),
    mounted(card("r1", 1, right), "r0"),
  ];
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    card("c1", 0),
    card("c2", 1),
    card("c3", 2),
    ...packets,
  ];
  const squared: IAutoMovieVector3 = onTable(s, 0, 0.05);
  let chain: IAutoMovieMotionHumanChain =
    AutoMovieMotionHumanBoardGame.HumanTabletop.deal(seated(s), {
      cards: dealt,
      seats,
    });
  chain = AutoMovieMotionHumanBoardGame.HumanTabletop.lay(chain, {
    cards: ["c2"],
    places: [{ at: { ...seats[1]!, z: seats[1]!.z - 0.1 }, rotation: UP }],
  });
  chain = AutoMovieMotionHumanBoardGame.HumanTabletop.shuffle(chain, {
    left: "l0",
    leftTop: "l1",
    right: "r0",
    at: squared,
  });
  const take: HumanPerformance = play(
    body,
    label,
    props,
    chain,
    ["c1", "c2", "c3", "l0", "l1", "r0", "r1"],
    checks,
  );
  const puts: IAutoMovieMotionHumanSegment[] = take
    .segments("actor")
    .filter(
      (x: IAutoMovieMotionHumanSegment): boolean => x.law.name === "putDown",
    );
  dealt.forEach((id: string, k: number): void => {
    const frame: IAutoMovieRigidTransform = take.prop(id, puts[k]!.end);
    checks.check(
      `${label}: ${id} lands in seat ${k + 1}'s area`,
      Vector3.distance(frame.position, seats[k]!) <= SEAT,
    );
    checks.check(
      `${label}: ${id} lands face down`,
      Quaternion.rotateVector(frame.rotation, { x: 0, y: 1, z: 0 }).y >= 0.99,
    );
  });
  checks.check(
    `${label}: the revealed card lies face up`,
    Quaternion.rotateVector(take.prop("c2", take.duration).rotation, {
      x: 0,
      y: 1,
      z: 0,
    }).y <= -0.99,
  );
  const grips: IAutoMovieMotionHumanSegment[] = take
    .segments("actor")
    .filter(
      (x: IAutoMovieMotionHumanSegment): boolean => x.law.name === "pickUp",
    )
    .slice(-2);
  const joined: number = puts[puts.length - 2]!.start;
  checks.check(
    `${label}: the left hand keeps its packet through the shuffle`,
    everydayTake.drift(take, "left", "l0", grips[1]!.end, joined) <= HOLD,
  );
  checks.check(
    `${label}: the right hand keeps its packet through the shuffle`,
    everydayTake.drift(
      take,
      "right",
      "r0",
      grips[1]!.end,
      puts[puts.length - 1]!.start,
    ) <= HOLD,
  );
  checks.check(
    `${label}: the packets join on one deck`,
    Vector3.distance(
      { ...take.prop("r0", take.duration).position, y: 0 },
      { ...squared, y: 0 },
    ) <= LAND,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const far: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `tabletop-${label}-far`,
        body,
        props,
        AutoMovieMotionHumanBoardGame.HumanTabletop.deal(seated(s), {
          cards: ["c3"],
          seats: [onTable(s, 0, 1.2)],
        }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: a seat beyond the arm is refused with its distance`,
      far !== undefined &&
        far.kind === "reach" &&
        typeof far.value === "number",
    );
  }
}

/** Chips pushed whole, notes counted onto a pile and a die rolled onto the table. */
function tokens(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  const chip: number = 0.0033;
  const note: number = 0.00011;
  const stack: IAutoMovieVector3 = onTable(s, -0.1, 0.05);
  const pot: IAutoMovieVector3 = onTable(s, 0, 0.17);
  const bills: IAutoMovieVector3 = onTable(s, -0.22, 0.05);
  const pile: IAutoMovieVector3 = onTable(s, -0.25, 0.12);
  const roll: IAutoMovieVector3 = onTable(s, -0.12, 0.17);
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    everydayTake.prop("k0", createGamingChip({ id: "k0" }), stack),
    mounted(
      everydayTake.prop("k1", createGamingChip({ id: "k1" }), {
        ...stack,
        y: stack.y + chip,
      }),
      "k0",
    ),
    mounted(
      everydayTake.prop("k2", createGamingChip({ id: "k2" }), {
        ...stack,
        y: stack.y + 2 * chip,
      }),
      "k1",
    ),
    everydayTake.prop("n0", createBanknote({ id: "n0" }), bills),
    everydayTake.prop("n1", createBanknote({ id: "n1" }), {
      ...bills,
      y: bills.y + note,
    }),
    everydayTake.prop("die", createDie({ id: "die" }), onTable(s, -0.18, 0.05)),
  ];
  let chain: IAutoMovieMotionHumanChain =
    AutoMovieMotionHumanBoardGame.HumanTabletop.push(seated(s), {
      stack: "k0",
      to: pot,
    });
  chain = AutoMovieMotionHumanBoardGame.HumanTabletop.lay(chain, {
    cards: ["n1", "n0"],
    places: [
      { at: pile, rotation: DOWN },
      { at: { ...pile, y: pile.y + note }, rotation: DOWN },
    ],
  });
  chain = AutoMovieMotionHumanBoardGame.HumanTabletop.roll(chain, {
    die: "die",
    to: roll,
  });
  const take: HumanPerformance = play(
    body,
    label,
    props,
    chain,
    ["k0", "k1", "k2", "n0", "n1", "die"],
    checks,
  );
  ["k0", "k1", "k2"].forEach((id: string, k: number): void =>
    checks.check(
      `${label}: chip ${k + 1} reaches the pot in its place in the stack`,
      Vector3.distance(take.prop(id, take.duration).position, {
        ...pot,
        y: pot.y + k * chip,
      }) <= LAND,
    ),
  );
  checks.check(
    `${label}: the notes are counted onto one pile`,
    Vector3.distance(take.prop("n0", take.duration).position, {
      ...pile,
      y: pile.y + note,
    }) <= LAND,
  );
  const die: IAutoMovieRigidTransform = take.prop("die", take.duration);
  checks.check(
    `${label}: the die rests on the table's surface`,
    Math.abs(die.position.y - s.height) <= LAND &&
      Vector3.distance({ ...die.position, y: 0 }, { ...roll, y: 0 }) <= LAND,
  );
}

/** A prop set on another's top socket at the start. */
function mounted(
  prop: IAutoMovieMotionHumanProp,
  onto: string,
): IAutoMovieMotionHumanProp {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  return {
    ...prop,
    mounted: {
      prop: onto,
      point: "top",
      offset: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
    },
  };
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "chess", run: chess },
  { label: "cards", run: cards },
  { label: "tokens", run: tokens },
];

/** The seated scene. */
interface IStage {
  /** The chair's seat. */
  seat: IAutoMovieMotionHumanSeated.ISeat;

  /** The chair and the table. */
  props: IAutoMovieMotionHumanProp[];

  /** The table top's height, metres. */
  height: number;

  /** The table's near edge, world `z`. */
  near: number;
}

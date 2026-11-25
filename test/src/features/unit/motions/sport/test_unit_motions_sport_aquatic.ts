import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AquaticCrew,
  AquaticEdge,
  AquaticPosture,
  AquaticTeamBase,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_aquatic_crew_bear`. */
namespace ScenarioAquaticCrewBear {
  /**
   * `AquaticCrew.bear` writes a contact window a body part holds on a craft: its
   * part, kind, shares and region, supported by the craft as a prop.
   *
   * Scenarios:
   *
   * 1. The seat borne on the hull over the whole action names the hull as its
   *    support, with its region.
   * 2. Without a region the window carries none.
   */
  export function test_unit_motions_sport_aquatic_crew_bear(): void {
    TestValidator.equals(
      "the borne windows",
      [
        AquaticCrew.bear("scull", "seat", "bear", 0, 1, "seat"),
        AquaticCrew.bear("scull", "leftFoot", "plant", 0.25, 0.75).region,
      ],
      [
        {
          part: "seat",
          kind: "bear",
          from: 0,
          to: 1,
          region: "seat",
          support: { kind: "prop", subject: "scull" },
        },
        undefined,
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_crew_grips`. */
namespace ScenarioAquaticCrewGrips {
  /**
   * `AquaticCrew.grips` holds each hand the parameters name on the hull's handles
   * for the whole action, on a support the hand does not carry.
   *
   * Scenarios:
   *
   * 1. Only a left grip named: the left hand grips, the right does not.
   * 2. Both named: both grip, left first.
   * 3. None named: no grip.
   */
  export function test_unit_motions_sport_aquatic_crew_grips(): void {
    const grip = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Hand`,
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: "scull", carries: false },
    });
    const hull: Pick<AquaticCrew.IHull, "id"> = { id: "scull" };
    TestValidator.equals(
      "the named hands",
      [
        AquaticCrew.grips(hull, { kind: "doubleScull", leftGrip: "oarL" }),
        AquaticCrew.grips(hull, {
          kind: "doubleScull",
          leftGrip: "oarL",
          rightGrip: "oarR",
        }),
        AquaticCrew.grips(hull, { kind: "doubleScull" }),
      ],
      [[grip("left")], [grip("left"), grip("right")], []],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_crew_span`. */
namespace ScenarioAquaticCrewSpan {
  /**
   * `AquaticCrew.span` is a crew motion's progress over a window: the
   * minimum-jerk share `10 u³ - 15 u⁴ + 6 u⁵` of the clamped linear progress
   * `u`.
   *
   * A window from 1 s to 3 s.
   *
   * Scenarios:
   *
   * 1. Before it, none; at its middle, a half; after it, all.
   * 2. A quarter in, `u = 1/4` gives `10/64 - 15/256 + 6/1024` = 0.103515625.
   */
  export function test_unit_motions_sport_aquatic_crew_span(): void {
    TestValidator.predicate(
      "the minimum-jerk progress",
      AquaticCrew.span(0, 1, 3) === 0 &&
        nclose(AquaticCrew.span(2, 1, 3), 0.5, 1e-12) &&
        AquaticCrew.span(4, 1, 3) === 1 &&
        nclose(AquaticCrew.span(1.5, 1, 3), 0.103515625, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_edge_at`. */
namespace ScenarioAquaticEdgeAt {
  /**
   * `AquaticEdge.at` places a point by a pool edge's frame: its lip, plus
   * distances out of the pool, along the edge and up.
   *
   * The lip is at (0, 0.3, 5), out of the pool along +Z, along the edge +X.
   *
   * Scenarios:
   *
   * 1. 0.4 m out, 1 m along and 0.2 m up is (1, 0.5, 5.4).
   * 2. Nothing off the lip is the lip.
   */
  export function test_unit_motions_sport_aquatic_edge_at(): void {
    const edge: AquaticEdge.IEdge = {
      id: "pool",
      lip: { x: 0, y: 0.3, z: 5 },
      out: { x: 0, y: 0, z: 1 },
      across: { x: 1, y: 0, z: 0 },
    };
    TestValidator.predicate(
      "placed off the lip",
      vclose(
        AquaticEdge.at(edge, 0.4, 1, 0.2),
        { x: 1, y: 0.5, z: 5.4 },
        1e-12,
      ) && vclose(AquaticEdge.at(edge, 0, 0, 0), edge.lip, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_posture_along`. */
namespace ScenarioAquaticPostureAlong {
  /**
   * `AquaticPosture.along` is a point a distance ahead of an entry along its
   * heading, at a given height: the heading turns +Z toward +X about +Y.
   *
   * Scenarios:
   *
   * 1. Heading 0 from (1, 5, 2), 3 m ahead at 0.5 m high is (1, 0.5, 5).
   * 2. Heading 90, it is (4, 0.5, 2).
   */
  export function test_unit_motions_sport_aquatic_posture_along(): void {
    const entry: IAutoMovieMotionHumanPosture = {
      root: { x: 1, y: 5, z: 2 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    TestValidator.predicate(
      "ahead along the heading",
      vclose(
        AquaticPosture.along(entry, 3, 0.5),
        { x: 1, y: 0.5, z: 5 },
        1e-12,
      ) &&
        vclose(
          AquaticPosture.along({ ...entry, yaw: 90 }, 3, 0.5),
          { x: 4, y: 0.5, z: 2 },
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_posture_blend`. */
namespace ScenarioAquaticPostureBlend {
  /**
   * `AquaticPosture.blend` eases one posture into another on a minimum-jerk share
   * of the clamped progress: root, heading, tip and roll interpolated, the joints
   * blended as shapes.
   *
   * From standing at the origin to a 90 degree tip 2 m along +Z with the knee
   * flexed 60 degrees.
   *
   * Scenarios:
   *
   * 1. At no progress it is the first posture's root and tip; past the end, the
   *    second's.
   * 2. At half progress (share one half) the root is 1 m along, tipped 45, the knee
   *    at 30 degrees, a single-axis flexion blending linearly.
   * 3. With no rigid turn on either side, none is blended.
   */
  export function test_unit_motions_sport_aquatic_posture_blend(): void {
    const from: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: { leftLowerLeg: [0, 0, 0] },
      limbs: {},
    };
    const to: IAutoMovieMotionHumanPosture = {
      ...from,
      root: { x: 0, y: 0, z: 2 },
      pitch: 90,
      joints: { leftLowerLeg: [60, 0, 0] },
    };
    const blend: (share: number) => IAutoMovieMotionHumanPosture =
      AquaticPosture.blend(from, to);
    const half: IAutoMovieMotionHumanPosture = blend(0.5);
    TestValidator.predicate(
      "the ends and the middle",
      vclose(blend(0).root, from.root, 1e-12) &&
        blend(0).pitch === 0 &&
        vclose(blend(2).root, to.root, 1e-12) &&
        blend(2).pitch === 90 &&
        vclose(half.root, { x: 0, y: 0, z: 1 }, 1e-12) &&
        nclose(half.pitch, 45, 1e-12) &&
        nclose(half.joints.leftLowerLeg![0], 30, 1e-9) &&
        half.rotation === undefined,
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_posture_key`. */
namespace ScenarioAquaticPostureKey {
  /**
   * `AquaticPosture.key` poses a key shape from an entry: the key's joints, tip
   * and roll, its yaw added to the entry's heading, at the entry's root or a
   * given one, with no limb goal or rigid turn.
   *
   * Scenarios:
   *
   * 1. An entry heading 30 degrees with a hand goal takes a key yawed 10 and tipped
   *    80: it heads 40, tips 80 and drops the goal.
   * 2. Given a root, the key stands there.
   */
  export function test_unit_motions_sport_aquatic_posture_key(): void {
    const entry: IAutoMovieMotionHumanPosture = {
      root: { x: 1, y: 0, z: 2 },
      yaw: 30,
      pitch: 0,
      roll: 0,
      joints: { neck: [5, 0, 0] },
      limbs: {
        rightArm: { point: { x: 0, y: 1, z: 0 }, bend: { x: 0, y: 1, z: -1 } },
      },
    };
    const target: IAutoMovieMotionHumanExerciseKey.IKey = {
      pitch: 80,
      roll: 5,
      yaw: 10,
      lift: 0,
      joints: { leftLowerLeg: [20, 0, 0] },
    };
    TestValidator.equals(
      "the keyed posture",
      [
        AquaticPosture.key(entry, target),
        AquaticPosture.key(entry, target, { x: 0, y: -1, z: 0 }).root,
      ],
      [
        {
          root: { x: 1, y: 0, z: 2 },
          yaw: 40,
          pitch: 80,
          roll: 5,
          joints: { leftLowerLeg: [20, 0, 0] },
          limbs: {},
          rotation: undefined,
        },
        { x: 0, y: -1, z: 0 },
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_posture_translate`. */
namespace ScenarioAquaticPostureTranslate {
  /**
   * `AquaticPosture.translate` moves a posture to a new root, its rigid turn's
   * pivot carried by the same displacement.
   *
   * Scenarios:
   *
   * 1. A posture turned about (0, 1, 0) moved from the origin to (2, 0, 1) turns
   *    about (2, 1, 1), by the same turn.
   * 2. A posture with no turn keeps none.
   */
  export function test_unit_motions_sport_aquatic_posture_translate(): void {
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
      rotation: {
        about: { x: 0, y: 1, z: 0 },
        turn: { x: 0, y: 0, z: 1, w: 0 },
      },
    };
    TestValidator.equals(
      "the carried pivot",
      [
        AquaticPosture.translate(posture, { x: 2, y: 0, z: 1 }),
        AquaticPosture.translate(
          { ...posture, rotation: undefined },
          {
            x: 2,
            y: 0,
            z: 1,
          },
        ).rotation,
      ],
      [
        {
          ...posture,
          root: { x: 2, y: 0, z: 1 },
          rotation: {
            about: { x: 2, y: 1, z: 1 },
            turn: { x: 0, y: 0, z: 1, w: 0 },
          },
        },
        undefined,
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_aquatic_team_base_transfer`. */
namespace ScenarioAquaticTeamBaseTransfer {
  /** A quarter turn about +Y: (x, y, z) goes to (z, y, -x). */
  const QUARTER: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };

  /**
   * `AquaticTeamBase.transfer` hands a contact point over from where an end bone
   * holds it to a target: its turn slerped toward a facing and its contact point
   * lerped toward the target by a weight, the limb goal placed so the contact
   * lands there.
   *
   * The hand stands at (1, 1, 0) unturned, its contact 0.1 m along its +X; the
   * target is (0, 2, 0), facing a quarter about +Y.
   *
   * Scenarios:
   *
   * 1. At no weight the goal is the hand where it is, unturned.
   * 2. At full weight the goal is turned the quarter and puts the contact on the
   *    target: the hand at (0, 2, 0.1).
   */
  export function test_unit_motions_sport_aquatic_team_base_transfer(): void {
    const hand: IAutoMovieResolvedBone = {
      bone: "rightHand",
      localRotation: { x: 0, y: 0, z: 0, w: 1 },
      worldPosition: { x: 1, y: 1, z: 0 },
      worldRotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const transfer = (weight: number): IAutoMovieHumanLimbGoal =>
      AquaticTeamBase.transfer(
        hand,
        { x: 1, y: 0.5, z: -1 },
        { x: 0.1, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
        QUARTER,
        weight,
      );
    TestValidator.predicate(
      "held, and handed over",
      vclose(transfer(0).point, { x: 1, y: 1, z: 0 }, 1e-12) &&
        qclose(transfer(0).rotation!, hand.worldRotation, 1e-12) &&
        vclose(transfer(1).point, { x: 0, y: 2, z: 0.1 }, 1e-12) &&
        qclose(transfer(1).rotation!, QUARTER, 1e-12),
    );
  }
}

/**
 * The `aquatic` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_aquatic(): void {
  ScenarioAquaticCrewBear.test_unit_motions_sport_aquatic_crew_bear();
  ScenarioAquaticCrewGrips.test_unit_motions_sport_aquatic_crew_grips();
  ScenarioAquaticCrewSpan.test_unit_motions_sport_aquatic_crew_span();
  ScenarioAquaticEdgeAt.test_unit_motions_sport_aquatic_edge_at();
  ScenarioAquaticPostureAlong.test_unit_motions_sport_aquatic_posture_along();
  ScenarioAquaticPostureBlend.test_unit_motions_sport_aquatic_posture_blend();
  ScenarioAquaticPostureKey.test_unit_motions_sport_aquatic_posture_key();
  ScenarioAquaticPostureTranslate.test_unit_motions_sport_aquatic_posture_translate();
  ScenarioAquaticTeamBaseTransfer.test_unit_motions_sport_aquatic_team_base_transfer();
}

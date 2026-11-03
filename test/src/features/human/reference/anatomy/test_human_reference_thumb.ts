import { HumanReference } from "../../../internal/reference/bodies/HumanReference";
import { HumanReferenceRigSingleton } from "../../../internal/reference/bodies/HumanReferenceRigSingleton";
import { HumanReferenceThumb } from "../../../internal/reference/anatomy/HumanReferenceThumb";

/** A point or direction in space. */
type V3 = [number, number, number];

/** The known turn the proofs make at one joint, degrees. */
const TURN: number = 5;

/** Double arithmetic's allowance on an exact rotation, degrees. */
const EXACT: number = 1e-6;

/**
 * Published active flexion ranges of the thumb's joints, degrees (AAOS, in
 * `packages/human/docs/anatomy/joint-range.md`): MCP 0 to 50, IP 0 to 80.
 */
const RANGE: { mcp: [number, number]; ip: [number, number] } = { mcp: [0, 50], ip: [0, 80] };

/**
 * Observes the resting thumb of the four reference bodies from their own
 * rigs: the MCP and IP angles between successive bones, and the metacarpal's
 * and the proximal phalanx's flexion and spread in the hand's frame.
 *
 * Scenarios:
 * 1. On the first present reference, the IP joint's distal bone turned 5 degrees either way about the rig's own hinge axis reads the IP angle 5 degrees either side and leaves the MCP angle unchanged; the proximal phalanx turned 5 degrees either way about the MCP hinge reads the MCP angle 5 degrees either side.
 * 2. Each hand of f1, f2, m1 and m2 is read and printed; a hand whose angle lies outside the joint's published range is listed.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each present reference's rig (`HumanReferenceRigSingleton`, the source's own bind frames) by `HumanReferenceThumb.read` and prints every reading by person and hand: the observation the construction's resting thumb rule is checked against. It fails with every hand outside the published ranges and with a proof that does not hold. It catches a reader that takes the wrong joints, the wrong frame column or the wrong side, and a rig no real resting thumb could take.
 * @evidence contracts/testing.md#independent-expectations The readings are observations of the references, never targets; the expectation is only that a resting thumb lies within its joints' published active ranges (AAOS: MCP 0 to 50, IP 0 to 80 degrees). The proofs are exact: a rotation by a known angle about a joint's hinge (the rig's z axis, normal to both bones it joins) changes the angle between the bones by that angle, to double arithmetic. Oracle limits: the rig is the source's template, whose bind angles are authored rather than measured on each person, so the four people can agree to the decimal; the skin of each reference follows that rig.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both hands each; the proofs turn each joint both ways and check the other joint stays. Without the private rig records the test prints that it did not run and returns, since the data cannot ship. The generated person's thumb belongs to the hand anatomy and pose tests; this test owns the reference observation.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_thumb`, reading the ignored `test/.shots/<alias>/body-observations.json` records with no generation, renderer, browser or GPU.
 */
export function test_human_reference_thumb(): void {
  const ids: string[] = HumanReference.IDS.filter((id: string): boolean => HumanReferenceRigSingleton.exists(id));

  if (ids.length === 0) {
    console.log("test_human_reference_thumb: no private rig record in test/.shots; the thumb was not observed");
    return;
  }

  const failures: string[] = prove(ids[0]!);

  for (const id of ids)
    for (const side of ["l", "r"] as const) {
      const r: HumanReferenceThumb.IReading = HumanReferenceThumb.read(HumanReferenceRigSingleton.get(id), side);

      console.log(
        `test_human_reference_thumb: ${id} ${side}: MCP ${r.mcp.toFixed(1)}, IP ${r.ip.toFixed(1)}; ` +
          `metacarpal flexion ${r.metacarpalFlexion.toFixed(1)}, spread ${r.metacarpalSpread.toFixed(1)}; ` +
          `proximal phalanx flexion ${r.proximalFlexion.toFixed(1)}, spread ${r.proximalSpread.toFixed(1)} (deg)`,
      );

      if (r.mcp < RANGE.mcp[0] || r.mcp > RANGE.mcp[1]) failures.push(`${id} ${side} MCP ${r.mcp.toFixed(1)} deg outside ${RANGE.mcp[0]} to ${RANGE.mcp[1]}`);
      if (r.ip < RANGE.ip[0] || r.ip > RANGE.ip[1]) failures.push(`${id} ${side} IP ${r.ip.toFixed(1)} deg outside ${RANGE.ip[0]} to ${RANGE.ip[1]}`);
    }

  if (failures.length !== 0) throw new Error(`${failures.length} thumb observation findings:\n${failures.join("\n")}`);
}

/**
 * Turn each joint of the first reference's left thumb both ways by a known
 * angle and check the reading moves by it at that joint only.
 *
 * @param id Reference alias.
 * @returns Every failed proof.
 */
function prove(id: string): string[] {
  const rig: HumanReferenceRigSingleton.IRig = HumanReferenceRigSingleton.get(id);
  const before: HumanReferenceThumb.IReading = HumanReferenceThumb.read(rig, "l");
  const failures: string[] = [];

  for (const [joint, read, other] of [["IP", "ip", "mcp"], ["MCP", "mcp", "ip"]] as ["IP" | "MCP", "ip" | "mcp", "ip" | "mcp"][]) {
    const readings: number[] = [];

    for (const sign of [1, -1]) {
      const made: HumanReferenceThumb.IReading = HumanReferenceThumb.read(turned(rig, joint, (sign * TURN * Math.PI) / 180), "l");

      readings.push(made[read]);
      if (Math.abs(made[other] - before[other]) > EXACT)
        failures.push(`${id} proof: turning the ${joint} moved the ${other.toUpperCase()} reading by ${(made[other] - before[other]).toFixed(6)} deg`);
    }

    // One way opens the joint by the turn, the other closes it by the turn.
    const sorted: number[] = readings.sort((a: number, b: number): number => a - b);

    if (Math.abs(sorted[0]! - Math.abs(before[read] - TURN)) > EXACT || Math.abs(sorted[1]! - (before[read] + TURN)) > EXACT)
      failures.push(`${id} proof: turning the ${joint} by ${TURN} deg either way reads ${sorted.map((v: number): string => v.toFixed(6)).join(" and ")} from ${before[read].toFixed(6)}`);
  }
  return failures;
}

/**
 * A copy of a rig with the left thumb turned at one joint about that joint's
 * hinge, the rig's z axis.
 *
 * - IP: `thumb_03`'s axes turn about its own z axis; no origin moves.
 * - MCP: `thumb_03`'s origin and axes turn about `thumb_02`'s z axis through
 *   `thumb_02`'s origin.
 *
 * @param rig The rig.
 * @param joint Which joint.
 * @param theta Turn, radians.
 */
function turned(rig: HumanReferenceRigSingleton.IRig, joint: "IP" | "MCP", theta: number): HumanReferenceRigSingleton.IRig {
  const copy: HumanReferenceRigSingleton.IRig = new Map(rig);
  const distal: HumanReferenceRigSingleton.IJoint = rig.get("thumb_03_l")!;
  const pivot: HumanReferenceRigSingleton.IJoint = joint === "IP" ? distal : rig.get("thumb_02_l")!;
  const k: V3 = pivot.axes[2]!;
  const centre: V3 = pivot.origin;
  const offset: V3 = [distal.origin[0] - centre[0], distal.origin[1] - centre[1], distal.origin[2] - centre[2]];
  const moved: V3 = rotate(offset, k, theta);

  copy.set("thumb_03_l", {
    ...distal,
    origin: joint === "IP" ? distal.origin : [centre[0] + moved[0], centre[1] + moved[1], centre[2] + moved[2]],
    axes: distal.axes.map((a: V3): V3 => rotate(a, k, theta)),
  });
  return copy;
}

/**
 * Rodrigues' rotation of a vector about a unit axis.
 *
 * @param p The vector.
 * @param k Unit axis.
 * @param theta Angle, radians, right-handed about `k`.
 */
function rotate(p: V3, k: V3, theta: number): V3 {
  const c: number = Math.cos(theta);
  const s: number = Math.sin(theta);
  const d: number = (k[0] * p[0] + k[1] * p[1] + k[2] * p[2]) * (1 - c);

  return [
    p[0] * c + (k[1] * p[2] - k[2] * p[1]) * s + k[0] * d,
    p[1] * c + (k[2] * p[0] - k[0] * p[2]) * s + k[1] * d,
    p[2] * c + (k[0] * p[1] - k[1] * p[0]) * s + k[2] * d,
  ];
}

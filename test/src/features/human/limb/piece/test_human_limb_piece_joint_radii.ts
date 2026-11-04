import { AutoMovieHumanJointCentres } from "../../../../../../packages/human/src/skeleton/AutoMovieHumanJointCentres";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Every joint of the stickman skeleton carries a positive, finite skin girth
 * radius read on the published body: the binding's influence of each bone
 * reaches as far as its radius, so a radius that is zero or not a number
 * leaves skin no bone pulls.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates each person of the run's set (`HumanPeople.person`), derives the joints (`AutoMovieHumanJointCentres.derive`) and lists every joint whose radius is not a positive finite number, by person and bone.
 * @evidence contracts/testing.md#independent-expectations A girth radius of a lofted section is a positive length; no law's value enters.
 * @evidence contracts/testing.md#distinguishing-cases A zero radius, a NaN radius and an infinite one each fail with their bone's name.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_joint_radii`, generating the run's people on the CPU; no browser or GPU.
 */
export function test_human_limb_piece_joint_radii(): void {
  const failures: string[] = [];
  for (const name of HumanPeople.names()) {
    const joints: AutoMovieHumanJointCentres.IJoint[] = AutoMovieHumanJointCentres.derive(HumanPeople.person(name).body);
    for (const j of joints) if (!(Number.isFinite(j.radius) && j.radius > 0)) failures.push(`${name} ${j.bone}: radius ${j.radius}`);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} joint radius findings:\n${failures.join("\n")}`);
}

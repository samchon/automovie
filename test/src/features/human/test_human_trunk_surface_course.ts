import { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanThoracicCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCourse";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanPeople } from "../internal/HumanPeople";
import { HumanThoracicSkinCourse as Skin } from "../internal/HumanThoracicSkinCourse";
import { HumanTrunkFixture as Fixture } from "../internal/HumanTrunkFixture";

/**
 * Actual supported column attempts answer their surface length on emitted skin.
 *
 * Scenarios:
 * 1. All nine canonical public inputs reach their actual neck/trunk producers.
 * 2. The declared geometric course is independently measured on emitted triangles.
 * 3. Every source point is finite and the source length answers the public input.
 *    Nonconvergence remains a failed supported-person attempt, never a pass.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each actual supported column through the maintained production producers and independently intersects emitted BodySurface triangles at the producer's published geometric address. All exceptions and all people remain in one collect-all report. The analytic companion test proves normal/defect/delta sensitivity of both readers.
 * @evidence contracts/testing.md#independent-expectations Expected shoulder-to-apex length is the public input, not either reader's output. Source closure uses 0.05 mm numerical allowance. The independently emitted skin must answer within 0.5 mm, using the producer's 0.5 mm chord tolerance as this numerical comparison's error budget, not as a proven arclength integration bound or a clinical tolerance. A mesh exceeding that budget fails. Material coordinates locate the declared course; its measured world points and length come from actual triangles. Clinical sites remain unavailable until registered independently.
 * @evidence contracts/testing.md#distinguishing-cases Includes all four references and five maintained domain extremes, varying body lengths, breadths and sex together. A failed producer, missing address, nonfinite point or unavailable skin crossing fails that person while later people continue. Full body composition, arms, hands and clinical acceptance belong to the complete body audits; this part test cannot replace them.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous portable CPU integration of production functions without native artifacts, processes, browser or GPU. It generates nine columns, no whole person; HumanPeople.parameters supplies inputs without generation.
 */
export function test_human_trunk_surface_course(): void {
  /** All supported attempts survive into the final failure report. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit("supported-column-surface-course", "actual-trunk-and-skin");
  for (const alias of HumanPeople.names())
    audit.run({ scenario: "1-3 actual supported column", person: alias, part: ["trunk", "upper", "head"], interval: "entire declared course", phase: "anterior registered lateral progression" }, (): void => {
      /** Inputs are canonical public values, independent of generated measurements. */
      const input: ReturnType<typeof Fixture.inputs> = Fixture.inputs(HumanPeople.parameters(alias));
      /** A production failure is caught by the enclosing collector as a failure. */
      const body: Body = Fixture.generate(HumanPeople.parameters(alias), input);
      /** The producer publishes only geometry and its explicit model premise. */
      const address: NonNullable<Body["thoracicCourse"]> | undefined = body.thoracicCourse;
      if (address === undefined) throw new Error("The actual trunk omitted its geometric thoracic course");
      /** Source reading owns numerical closure but supplies no expected value. */
      const source: Course.IReading = Course.read(body.chains.filter((chain: Chain): boolean => address.owners.includes(chain.name)), address.from, address.to);
      /** Actual emitted physical triangles are measured independently. */
      const skin: Skin.IReading = Skin.read(Surface.generate(body), new Set(address.owners), address.from, address.to, address.guides);
      audit.scope({ scenario: "1-3 actual supported column", person: alias, part: address.owners, interval: [address.from.station, address.to.station], station: address, phase: "anterior registered lateral progression", coordinates: skin.points, triangleOffsets: skin.triangles, skinPitch: skin.pitch, clinicalIdentity: "unavailable: this is a declared model course" });
      audit.measure("actual source physical length", source.length, input.shoulderToApex, 0.05, "mm");
      audit.measure("independent emitted skin physical length", skin.length, input.shoulderToApex, 0.5, "mm");
      for (let index: number = 0; index < source.points.length; index++) {
        audit.scope({ scenario: "3 finite actual source point", person: alias, part: address.owners, station: address.from.station + index * (address.to.station - address.from.station) / (source.points.length - 1), phase: "registered anterior crossing", coordinates: source.points[index] });
        audit.check("actual source point is finite", source.points[index]!.every(Number.isFinite));
      }
    });
  audit.finish();
}

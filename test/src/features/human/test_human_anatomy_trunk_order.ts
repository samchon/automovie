import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Every person's trunk keeps the order of its own tape inputs: wherever two of
 * the chest, underbust, waist, high hip, hip, neck base and neck inputs differ
 * clearly, the skin's tapes at their ISO 8559-1 sites differ the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin, reads the chest at the bust point, the underbust at the inframammary fold, the waist at the least girth between rib and crest, the high hip midway to the hip, the hip at the buttock prominence, the neck base over the base line and the neck at its least girth (the trunk audit's sites), and for every pair whose inputs differ by more than 18 mm checks that the skin's two tapes differ in the same direction. It catches a chest narrowed under the waist, two tapes swapped, a flattened trunk and a hip drawn under the waist against the inputs.
 * @evidence contracts/testing.md#independent-expectations The expectation is each person's own input order, nothing else. Two readings may each miss their input by ISO 20685-1:2018 Table 4's 9 mm for large circumferences (4 mm for the neck), so the order is asked only where the inputs differ by twice 9 mm; closer inputs may read either way within tolerance and belong to the identity rows. A site the skin does not show (a bust point on a masculine chest) asks nothing here, since its absence is the identity row's finding. No population value, reference body or construction constant enters, so the rows hold for any person.
 * @evidence contracts/testing.md#distinguishing-cases Every generated person; a pair of close inputs contributes no row and a pair of clear inputs contributes one. The trunk audit owns each tape at its site against its input, the silhouette test owns the breadth profile between the sites, and the curve test owns the sections.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_anatomy_trunk_order`, cutting the cached people's skins in process with no renderer, browser or GPU.
 */
export function test_human_anatomy_trunk_order(): void {
  assertHumanAnatomy("trunkOrder");
}

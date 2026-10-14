import {
  AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
  describeAutoMovieSubject,
  describeAutoMovieSubjects,
} from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  type IAutoMovieSubjectArtifact,
  type IAutoMovieSubjectDescription,
  type IAutoMovieSubjectMemberSummary,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { subjectInspectionArtifact } from "../internal/subjectInspectionArtifact";
import { subjectInspectionIdentityTransform } from "../internal/subjectInspectionIdentityTransform";
import { subjectInspectionInstanceSet } from "../internal/subjectInspectionInstanceSet";
import { throwsError } from "../internal/throwsError";

/**
 * Membership beyond the first page is still addressable.
 *
 * A bounded first-page summary must expose later members through an offset.
 * This fixture owns 150 children and 150 compact slots, enough to cross the
 * declared page limit twice without depending on an external production.
 *
 * The page is a rank into the sorted whole rather than a cursor token, because
 * the order is already deterministic and code-unit stable, so the same rank
 * names the same member on any host and at any time for one revision.
 *
 * Scenarios:
 *
 * 1. Paging an element's children by the limit reaches every child exactly
 *    once, in order, with no gap and no repeat, and `total` never moves.
 * 2. A page at the end is empty rather than an error, and reports where it
 *    stopped, so a caller looping until it runs out terminates.
 * 3. A rank that names no page — negative, or fractional — is refused rather
 *    than rounded, because a caller paging by a computed value would otherwise
 *    be told it had read everything.
 * 4. A compact instance set pages too, and that path regenerates its ids from
 *    slot indices rather than slicing a list, so it is the one that could page
 *    a different order than it reports.
 * 5. The whole-inventory census is untouched: every summary it builds starts at
 *    the first member, and it still names every subject.
 *
 * @evidence contracts/testing.md#behavioral-verification Walks multiple child and compact-instance pages, asserting total, stable sorted ids, uniqueness and termination; a skipped/overlapping page, incorrect omitted count or census cap fails.
 * @evidence contracts/testing.md#independent-expectations The fixture declares 150 zero-padded child ids and 150 slots, independently fixing complete membership and code-unit order. The imported limit states the paging contract; this case does not independently justify that limit's performance policy.
 * @evidence contracts/testing.md#distinguishing-cases Keeps first and later pages, past-end empty output, negative/fractional rank refusal, compact-slot regeneration and unchanged first-page whole census; model geometry and hierarchy reach are separate entries.
 * @evidence contracts/testing.md#execution-ownership This runner-discovered exported CPU test owns all paging loops and local hierarchy records, directly calling description/census source without real production content, filesystem paging or a rendering host.
 */
export function test_inspection_subject_member_paging(): void {
  const artifact: IAutoMovieSubjectArtifact = subjectInspectionArtifact({
    environment: crowdedEnvironment(),
    instanceSets: [
      subjectInspectionInstanceSet({
        id: "slate",
        model: "guard-rack-west-pole-0-model",
        count: SET_COUNT,
      }),
    ],
  });
  const root: string = `element:${ENVIRONMENT}/${ROOT}`;

  const pages: string[][] = [];
  for (
    let offset: number = 0;
    offset < CHILDREN;
    offset += AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT
  )
    pages.push(
      describeAutoMovieSubject(artifact, root, { memberOffset: offset }).members
        .items,
    );
  const walked: string[] = pages.flat();
  const first: IAutoMovieSubjectMemberSummary = describeAutoMovieSubject(
    artifact,
    root,
  ).members;

  TestValidator.equals(
    "paging a crowded parent reaches every child exactly once",
    namedFacts([
      [
        "the first page is bounded by the limit",
        (): boolean =>
          first.items.length === AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
      ],
      [
        "and says so rather than pretending it is everything",
        (): boolean =>
          first.total === CHILDREN &&
          first.offset === 0 &&
          first.omitted === CHILDREN - AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
      ],
      ["the walk names every child", (): boolean => walked.length === CHILDREN],
      ["each exactly once", (): boolean => new Set(walked).size === CHILDREN],
      [
        "in the order the census sorts them",
        (): boolean =>
          walked.every(
            (id: string, index: number): boolean => id === expectedChild(index),
          ),
      ],
      [
        "and the total never moved under it",
        (): boolean =>
          [0, 64, 128].every(
            (offset: number): boolean =>
              describeAutoMovieSubject(artifact, root, { memberOffset: offset })
                .members.total === CHILDREN,
          ),
      ],
    ]),
    {
      "the first page is bounded by the limit": true,
      "and says so rather than pretending it is everything": true,
      "the walk names every child": true,
      "each exactly once": true,
      "in the order the census sorts them": true,
      "and the total never moved under it": true,
    },
  );

  const past: IAutoMovieSubjectMemberSummary = describeAutoMovieSubject(
    artifact,
    root,
    {
      memberOffset: CHILDREN + AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT,
    },
  ).members;
  TestValidator.equals(
    "a page past the end stops rather than failing",
    namedFacts([
      ["it names nothing", (): boolean => past.items.length === 0],
      // Clamped to the total rather than echoed, so a caller looping while
      // `offset + items.length < total` terminates instead of spinning on a
      // rank that will never be reached.
      ["it reports where it stopped", (): boolean => past.offset === CHILDREN],
      ["and still states the whole", (): boolean => past.total === CHILDREN],
    ]),
    {
      "it names nothing": true,
      "it reports where it stopped": true,
      "and still states the whole": true,
    },
  );

  TestValidator.equals(
    "a rank that names no page is refused",
    namedFacts([
      [
        "a negative rank",
        (): boolean =>
          throwsError(
            (): IAutoMovieSubjectDescription =>
              describeAutoMovieSubject(artifact, root, { memberOffset: -1 }),
            "Subject member offset must be a whole number of members from the first",
          ),
      ],
      [
        "a fractional rank",
        (): boolean =>
          throwsError(
            (): IAutoMovieSubjectDescription =>
              describeAutoMovieSubject(artifact, root, { memberOffset: 1.5 }),
            "Subject member offset must be a whole number of members from the first",
          ),
      ],
    ]),
    { "a negative rank": true, "a fractional rank": true },
  );

  const setId: string = "instance-set:slate";
  const setPages: string[][] = [];
  for (
    let offset: number = 0;
    offset < SET_COUNT;
    offset += AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT
  )
    setPages.push(
      describeAutoMovieSubject(artifact, setId, { memberOffset: offset })
        .members.items,
    );
  const instances: string[] = setPages.flat();
  TestValidator.equals(
    "a compact set pages the slots it names",
    namedFacts([
      [
        "the walk names every instance",
        (): boolean => instances.length === SET_COUNT,
      ],
      [
        "each exactly once",
        (): boolean => new Set(instances).size === SET_COUNT,
      ],
      [
        "the pages do not overlap",
        (): boolean =>
          setPages.every((page: string[], index: number): boolean =>
            page.every(
              (id: string): boolean =>
                setPages.findIndex((other: string[]): boolean =>
                  other.includes(id),
                ) === index,
            ),
          ),
      ],
    ]),
    {
      "the walk names every instance": true,
      "each exactly once": true,
      "the pages do not overlap": true,
    },
  );

  const census: IAutoMovieSubjectDescription[] =
    describeAutoMovieSubjects(artifact);
  TestValidator.equals(
    "the whole-inventory census is unchanged by any of this",
    namedFacts([
      [
        "every summary starts at the first member",
        (): boolean =>
          census.every(
            (entry: IAutoMovieSubjectDescription): boolean =>
              entry.members.offset === 0,
          ),
      ],
      // The census being uncapped is why nothing was ever lost, only unreachable
      // by descent, and it is the property a paging change could quietly break.
      [
        "and it still names every child subject",
        (): boolean =>
          new Set(
            census.map(
              (entry: IAutoMovieSubjectDescription): string => entry.id,
            ),
          ).size >= CHILDREN &&
          Array.from(
            { length: CHILDREN },
            (_: unknown, index: number): string => expectedChild(index),
          ).every((id: string): boolean =>
            census.some(
              (entry: IAutoMovieSubjectDescription): boolean => entry.id === id,
            ),
          ),
      ],
    ]),
    {
      "every summary starts at the first member": true,
      "and it still names every child subject": true,
    },
  );
}

/** Enough children that the sample limit is passed more than once. */
const CHILDREN: number = 150;

/** Enough instances that the regenerated page path is passed more than once. */
const SET_COUNT: number = 150;

const ENVIRONMENT: string = "castle";
const ROOT: string = "keep";

/** The child id at one rank, zero-padded so code-unit order is index order. */
const expectedChild: (index: number) => string = (index: number): string =>
  `element:${ENVIRONMENT}/${ROOT}-child-${String(index).padStart(3, "0")}`;

/**
 * One root owning every element, which is the shape a building actually has.
 *
 * Model-less on both sides on purpose: a transform-only group stages no scene
 * node, so this exercises the element hierarchy rather than the scene walk, and
 * the scene walk is not what truncated.
 */
const crowdedEnvironment: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: ENVIRONMENT,
    units: "meter",
    buildings: [{ id: ENVIRONMENT, element: ROOT, space: "hall" }],
    models: [],
    modelReferences: [],
    elements: [
      {
        id: ROOT,
        kind: "building",
        parent: null,
        transform: subjectInspectionIdentityTransform(),
        model: null,
        space: "hall",
      },
      ...Array.from(
        { length: CHILDREN },
        (
          _: unknown,
          index: number,
        ): {
          id: string;
          kind: string;
          parent: string;
          transform: IAutoMovieTransform;
          model: null;
          space: null;
        } => ({
          id: `${ROOT}-child-${String(index).padStart(3, "0")}`,
          kind: "wall-infill",
          parent: ROOT,
          transform: subjectInspectionIdentityTransform(),
          model: null,
          space: null,
        }),
      ),
    ],
    spaces: [{ id: "hall", kind: "room", parent: null, cells: [] }],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  });

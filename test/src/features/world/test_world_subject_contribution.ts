import {
  AutoMovieSubject,
  AutoMovieSubjectGroup,
  type IAutoMovieSubjectContribution,
  mergeAutoMovieSubjectContributions,
} from "@automovie/engine";
import type { IAutoMovieShotBuildContext } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** A leaf subject that contributes exactly what it was built with. */
class Leaf extends AutoMovieSubject<{ id: string }> {
  public constructor(
    public readonly id: string,
    private readonly contribution: IAutoMovieSubjectContribution,
  ) {
    super();
  }

  public design(): { id: string } {
    return { id: this.id };
  }

  public render(
    _context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return this.contribution;
  }
}

/** A group that composes its members and adds nothing of its own. */
class Plain extends AutoMovieSubjectGroup<{ id: string }, Leaf> {
  public constructor(
    public readonly id: string,
    private readonly held: readonly Leaf[],
  ) {
    super();
  }

  public members(): readonly Leaf[] {
    return this.held;
  }

  public design(): { id: string } {
    return { id: this.id };
  }
}

/** A group that adds a cue no member owns, without discarding theirs. */
class Bannered extends Plain {
  public override render(
    context: IAutoMovieShotBuildContext,
  ): IAutoMovieSubjectContribution {
    return mergeAutoMovieSubjectContributions([
      super.render(context),
      { landmarks: [landmark("banner")] },
    ]);
  }
}

const actor: (
  node: string,
) => NonNullable<IAutoMovieSubjectContribution["actors"]>[number] = (
  node: string,
): NonNullable<IAutoMovieSubjectContribution["actors"]>[number] => ({
  node,
  model: node,
  speed: 1,
  eyeHeight: 1.6,
});

const landmark: (
  id: string,
) => NonNullable<IAutoMovieSubjectContribution["landmarks"]>[number] = (
  id: string,
): NonNullable<IAutoMovieSubjectContribution["landmarks"]>[number] => ({
  id,
  position: { x: 0, y: 0, z: 0 },
  radius: 1,
  meaning: `the ${id}`,
});

const context: IAutoMovieShotBuildContext = {} as IAutoMovieShotBuildContext;

/**
 * A subject contributes its own part of a shot, and a group is its members.
 *
 * No subject returns a shot program. A shot is assembled from many of them, so
 * each returns only what it owns and the shot merges the pieces. That is the
 * whole reason a regiment can be its squadrons and a world can be its terrain
 * without either knowing it was composed.
 *
 * Merging deliberately does not deduplicate. Two subjects claiming one id is a
 * defect the builder's own uniqueness checks report, and collapsing it here
 * would hide the collision from the gate that owns it, the same "one
 * obligation, one owner" rule the rest of the pipeline is built on.
 *
 * Scenarios:
 *
 * 1. Merging carries the exercised contribution keys, concatenating in the order given, so
 *    a group listing its members in a stable order retains that record order.
 * 2. An absent key stays absent and an empty array contributes nothing, so a
 *    subject that fills one field does not litter the merge with empties.
 * 3. Two subjects claiming one identity both survive the merge, because silently
 *    collapsing them would answer a question this layer does not own.
 * 4. A group renders exactly the merge of its members, and an empty group renders
 *    nothing.
 * 5. Nesting holds: a group of groups equals the merge of its leaves, which is
 *    what makes a regiment of squadrons the same shape as a squadron.
 * 6. A group that adds something of its own keeps what its members said, because
 *    overriding `render` to replace them would make composition a lie.
 * 7. A population reaches the record as one compact entry however large its count,
 *    since composing is not where ten thousand members become ten thousand
 *    nodes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls contribution merging and actual subject-group composition, observing selected field concatenation/order, omitted empty fields, duplicate preservation, nested groups, additive overrides and compact populations; dropped members, deduplication or population expansion fails.
 * @evidence contracts/testing.md#independent-expectations Authored leaf records and explicit expected field lists determine ordinary merge/group results, while the nested-versus-flat case is a consistency check backed by those literal cases. Partial id-only sentinels exercise reference concatenation without proving complete model/clip admission; numeric leaves retain exact expectations through zero-tolerance nclose in the existing structural predicate.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordered heterogeneous fields, absent/empty fields, duplicate ids, ordinary/empty/nested groups, additive group output, design ids and a 10000-member population kept as one entry; unexercised contribution fields, membership cycles and downstream uniqueness admission are outside this unit.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_world_subject_contribution entry owns direct merge/composite calls through small authored subclasses that return resident records; no shot compiler, production asset, renderer, browser or dynamic scenario registration runs.
 */
export function test_world_subject_contribution(): void {
  TestValidator.predicate(
    "merging concatenates the exercised keys in the order given",
    test12ValuesClose(
      mergeAutoMovieSubjectContributions([
        {
          models: [{ id: "model" }] as never,
          set: [{ node: "set" }] as never,
          actors: [actor("a")],
          landmarks: [landmark("one")],
        },
        {
          spaces: [{ id: "space" }] as never,
          actors: [actor("b")],
          surfaces: [],
        },
        {
          builtEnvironments: [{ id: "building" }] as never,
          landmarks: [landmark("two")],
        },
      ]),
      {
        models: [{ id: "model" }] as never,
        set: [{ node: "set" }] as never,
        spaces: [{ id: "space" }] as never,
        builtEnvironments: [{ id: "building" }] as never,
        actors: [actor("a"), actor("b")],
        landmarks: [landmark("one"), landmark("two")],
      },
    ),
  );

  TestValidator.equals(
    "an empty merge is an empty contribution",
    mergeAutoMovieSubjectContributions([]),
    {},
  );

  TestValidator.predicate(
    "two subjects claiming one identity both survive",
    test12ValuesClose(
      mergeAutoMovieSubjectContributions([
        { landmarks: [landmark("same")] },
        { landmarks: [landmark("same")] },
      ]),
      { landmarks: [landmark("same"), landmark("same")] },
    ),
  );

  const left: Leaf = new Leaf("left", { actors: [actor("left")] });
  const right: Leaf = new Leaf("right", {
    clips: [{ id: "right-clip" }] as never,
  });
  const squadron: Plain = new Plain("squadron", [left, right]);
  TestValidator.predicate(
    "a group renders the merge of its members",
    test12ValuesClose(squadron.render(context), {
      actors: [actor("left")],
      clips: [{ id: "right-clip" }] as never,
    }),
  );

  TestValidator.equals(
    "an empty group renders nothing",
    new Plain("empty", []).render(context),
    {},
  );

  const regiment: AutoMovieSubjectGroup<{ id: string }, Plain> =
    new (class extends AutoMovieSubjectGroup<{ id: string }, Plain> {
      public readonly id: string = "regiment";
      public members(): readonly Plain[] {
        return [squadron, new Plain("second", [new Leaf("far", {})])];
      }
      public design(): { id: string } {
        return { id: this.id };
      }
    })();
  TestValidator.predicate(
    "a group of groups equals the merge of its leaves",
    test12ValuesClose(regiment.render(context), squadron.render(context)),
  );

  const bannered: Bannered = new Bannered("bannered", [left]);
  TestValidator.predicate(
    "a group that adds its own keeps what its members said",
    test12ValuesClose(bannered.render(context), {
      actors: [actor("left")],
      landmarks: [landmark("banner")],
    }),
  );

  // A population is one compact record whatever its count, and composing it
  // must not be the step that expands it. The engine materializes members from
  // count, layout, anchor, facing and seed, so a merge that turned ten thousand
  // into ten thousand entries would put the nodes back that the whole compact
  // representation exists to avoid.
  const forest: Leaf = new Leaf("forest", {
    instanceSets: [
      {
        id: "forest",
        modelRecipe: "tree",
        count: 10_000,
        layout: { kind: "scatter", radius: 40, jitter: 1 },
        anchor: { x: 0, y: 0, z: 0 },
        facingDeg: 0,
        seed: 7,
      },
    ] as never,
  });
  TestValidator.equals(
    "a population reaches the record as one compact entry, not ten thousand",
    (new Plain("wood", [forest]).render(context).instanceSets ?? []).map(
      (
        set: NonNullable<IAutoMovieSubjectContribution["instanceSets"]>[number],
      ): { id: string; count: number } => ({ id: set.id, count: set.count }),
    ),
    [{ id: "forest", count: 10_000 }],
  );

  TestValidator.equals(
    "a subject and a group each answer with their own record",
    namedFacts([
      ["leaf", (): boolean => left.design().id === "left"],
      ["group", (): boolean => squadron.design().id === "squadron"],
      ["nested", (): boolean => regiment.design().id === "regiment"],
    ]),
    { leaf: true, group: true, nested: true },
  );
}

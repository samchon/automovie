# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Ensemble family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Ensemble laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States the member naming, the draws and their keys, the override order and where a place comes from. index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.

## @evidence contracts/development/design.md#principled-representation

A group as its count, a body pool, distributions and roles: the levels of Musse and Thalmann's hierarchical crowd (2001), the group as the controllable unit. index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanEnsemble.of` reads; the members are derived, never stored by the author. Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.of, input); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve, input).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A place is a formation or a list or a rule, never both a formation and places. Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanAttribute.Name, IAutoMovieProficiency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IMember

## @evidence contracts/development/common.md#meaningful-documentation

index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.

## @evidence contracts/development/design.md#principled-representation

index: Its index, from 0. subject: Its subject id, `${ensemble}.${index}`. role: Its role, or null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.leaders, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.frames, _); ensemble/HumanCrowd.ts (HumanCrowd.steer.byLeader, m); ensemble/HumanCrowd.ts (HumanCrowd.steer.agentOf, m).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanAttribute.Name, IAutoMovieProficiency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

at: The floor point, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.

## @evidence contracts/development/design.md#principled-representation

at: The floor point, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsembleMembers.ts (placeOf, return); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.Detail

## @evidence contracts/development/common.md#meaningful-documentation

How much of a member is performed.

## @evidence contracts/development/design.md#principled-representation

Closed choices "full", "instanced", "population" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IGroup

## @evidence contracts/development/common.md#meaningful-documentation

index: Its index, from 0.

## @evidence contracts/development/design.md#principled-representation

index: Its index, from 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.groups, return); ensemble/HumanCrowd.ts (HumanCrowd.steer); ensemble/HumanCrowd.ts (HumanCrowd.steer.agents); ensemble/HumanEnsemble.ts (HumanEnsemble.groups).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanEnsemble.groups.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IEnsemble

## @evidence contracts/development/common.md#meaningful-documentation

members: Its members, in index order.

## @evidence contracts/development/design.md#principled-representation

members: Its members, in index order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.desired, ensemble); ensemble/HumanCrowd.ts (HumanCrowd.steer, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.of, return); ensemble/HumanEnsemble.ts (HumanEnsemble.performers, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.members, ensemble); ensemble/HumanEnsemble.ts (HumanEnsemble.chains, ensemble).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanEnsemble, IAutoMovieMotionHumanEnsemble.IMember identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IRole

## @evidence contracts/development/common.md#meaningful-documentation

pick: Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent.

## @evidence contracts/development/design.md#principled-representation

pick: Which: the front rank's, the rear rank's, a flank's (file 0 then the last file), or the given indices; the lowest free indices when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IMemberRef

## @evidence contracts/development/common.md#meaningful-documentation

index: The member's index. role: Its role, or null. block: Its block in the formation, or null without one.

## @evidence contracts/development/design.md#principled-representation

index: The member's index. role: Its role, or null. block: Its block in the formation, or null without one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanEnsemble.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/next/IAutoMovieMotionHumanEnsemble.ts#IAutoMovieMotionHumanEnsemble.IGroupsSpec

## @evidence contracts/development/common.md#meaningful-documentation

share: Expected share of ensemble members assigned to groups, in [0, 1]; a random grouping need not realise the exact fraction. sizes: Allowed group member counts, each at least 2; the grouping procedure draws among these sizes.

## @evidence contracts/development/design.md#principled-representation

share: Expected share of ensemble members assigned to groups, in [0, 1]; a random grouping need not realise the exact fraction. sizes: Allowed group member counts, each at least 2; the grouping procedure draws among these sizes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.groups, spec).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanEnsemble.groups.

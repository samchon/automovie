# @automovie/motions

Compose human actions for AutoMovie and sample the resulting poses at any film time. Actions use the performer's body measurements and the scene's named contacts.

## Start

Use Node.js 22.23.2 or later.

```powershell
npm install @automovie/motions @automovie/human
```

Prepare a body with `AutoMovieHumanCanonicalBody.prepare` from `@automovie/human`, then pass its skeleton and profile to `AutoMovieMotionHumanBody.create`. Start a chain with `HumanChain.subject(id)`, add actions and pass the chain's `node` with your performers and seed to `new HumanPerformance`. Read a pose with `performance.pose(id, seconds)`.

## Entry points

| Entry | Use |
| --- | --- |
| `HumanChain` | Sequence actions and express cuts, overlays and timing cues |
| `HumanObject` | Place props and supports with named contacts |
| `HumanMutual` | Compose interactions with roles for multiple performers |
| `AutoMovieMotionHumanActionRow.of`, `HumanChain.extend` | Register new action rows and call them with typed parameters |

Read each action's type for its parameters and legal cuts. See [composing a performance](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/instructions/.agents/skills/motion/compose/composition.md) and the [motion catalogue](https://samchon.github.io/automovie/motions/).

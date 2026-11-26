# @automovie/evidence

Configure the checklist checks run by `@wrtnlabs/evidence` for an AutoMovie production. A production created by the CLI already has this package and its configuration.

## Start

Use Node.js 22.23.2 or later. If you are adding the checks to an existing project, install the packages and the matching scaffold contracts.

```powershell
npm install --save-dev @automovie/evidence @wrtnlabs/evidence
```

Use `createEvidenceConfig` in `evidence.config.ts`. Set `location` to the production directory and `skills` to the shared skills directory when the production is in a workspace. Enable the checks that match the work you are doing.

In a generated production, run `pnpm run evidence`. For configuration and target selection, see the [scaffold guide](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/instructions/.agents/skills/evidence/configuration.md) and [Evidence documentation](https://github.com/wrtnlabs/evidence#readme).

# @automovie/template

Generate AutoMovie project files in your own tool. To start a project from a terminal, use the [AutoMovie CLI](https://github.com/samchon/automovie#start-a-production).

## Start

```powershell
npm install @automovie/template
```

```ts
import { createAutoMovieScaffold } from "@automovie/template";

const files = createAutoMovieScaffold({ kind: "production", name: "my-film" });
console.log(Object.keys(files));
```

Write the returned path-to-content map to your target directory. Choose `workspace` for a shared root or `workspace-production` to add a production to one. Use `renderAutoMovieWorkspace` to fill missing dependency catalog entries in existing workspace YAML.

See the generated [production README](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/production/README.md) and [workspace README](https://github.com/samchon/automovie/blob/master/packages/template/scaffold/workspace/README.md).

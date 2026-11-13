import type { NextConfig } from "next";
import nextra from "nextra";
import path from "node:path";

const withNextra = nextra({});

/**
 * The workspace packages the site bundles. Each one's `exports` points at
 * its TypeScript source inside the workspace, so Next compiles them with the
 * site instead of reading a built `lib`.
 */
const WORKSPACE_PACKAGES: string[] = [
  "@automovie/archetypes",
  "@automovie/engine",
  "@automovie/human",
  "@automovie/interface",
  "@automovie/motions",
  "@automovie/render",
  "@automovie/viewer",
];

const config: NextConfig = {
  output: "export",
  trailingSlash: true,

  // GitHub Pages serves the site under the repository name.
  basePath: "/automovie",
  eslint: {
    ignoreDuringBuilds: true,
  },

  // `pnpm typecheck` checks the site's sources with ttsc, as the rest of the
  // workspace is checked, so Next does not check them a second time with
  // another compiler.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: WORKSPACE_PACKAGES,
  webpack: (webpack) => {
    // `render` and `viewer` write NodeNext specifiers (`./file.js`) for their
    // TypeScript sources.
    webpack.resolve.extensionAlias = {
      ...webpack.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };

    // The packages' sources go through the TypeScript compiler before Next's
    // own. Next's compiler leaves a name declared in one block of a
    // namespace unresolved in a later block of the same namespace
    // (`HumanArmClearance.overshoot` failed in the browser as
    // "overshoot is not defined"); TypeScript qualifies it.
    webpack.module.rules.unshift({
      test: /\.tsx?$/,
      include: [path.resolve(process.cwd(), "..", "packages")],
      exclude: /node_modules/,
      enforce: "pre",
      use: [
        {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            configFile: path.resolve(process.cwd(), "tsconfig.json"),
            compilerOptions: {
              noEmit: false,
              incremental: false,
              jsx: "react-jsx",
              module: "esnext",
              target: "es2022",
              sourceMap: true,
              plugins: [],
            },
          },
        },
      ],
    });
    return webpack;
  },
};

export default withNextra(config);

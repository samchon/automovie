"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"];
const TARGET_CONDITIONS = ["types", "import", "module", "default", "require", "node", "browser"];

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
}

function hasModifier(node, kind) {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((item) => item.kind === kind);
}

function bindingNames(binding, names) {
  if (ts.isIdentifier(binding)) names.add(binding.text);
  else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) {
    for (const element of binding.elements) {
      if (ts.isBindingElement(element)) bindingNames(element.name, names);
    }
  }
}

function declarationName(statement) {
  return statement.name && ts.isIdentifier(statement.name) ? statement.name.text : undefined;
}

function exportedDeclarations(statement) {
  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return [];
  const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
  if (ts.isVariableStatement(statement)) {
    const names = new Set();
    for (const declaration of statement.declarationList.declarations) bindingNames(declaration.name, names);
    return [...names].map((name) => ({ exportedName: name, declarationName: name }));
  }
  if (ts.isImportEqualsDeclaration(statement)) {
    return statement.name ? [{ exportedName: statement.name.text, declarationName: statement.name.text }] : [];
  }
  const name = declarationName(statement);
  if (!name && !isDefault) return [];
  return [{ exportedName: isDefault ? "default" : name, declarationName: name || "default" }];
}

function namespaceMembers(namespace, prefix = "") {
  const result = [];
  if (!ts.isModuleDeclaration(namespace) || !namespace.body) return result;
  const statements = ts.isModuleBlock(namespace.body)
    ? namespace.body.statements
    : ts.isModuleDeclaration(namespace.body)
      ? [namespace.body]
      : [];
  for (const statement of statements) {
    for (const item of exportedDeclarations(statement)) {
      const exportedName = prefix ? prefix + "." + item.exportedName : item.exportedName;
      result.push({ exportedName, declarationName: item.declarationName });
      if (ts.isModuleDeclaration(statement)) {
        result.push(...namespaceMembers(statement, exportedName));
      }
    }
  }
  return result;
}

function addDefinition(exports, exportedName, file, declarationName) {
  let definitions = exports.get(exportedName);
  if (!definitions) exports.set(exportedName, definitions = new Map());
  let names = definitions.get(file);
  if (!names) definitions.set(file, names = new Set());
  names.add(declarationName);
}

function mergeDefinitions(target, exportedName, definitions) {
  for (const [file, names] of definitions ?? []) {
    for (const name of names) addDefinition(target, exportedName, file, name);
  }
}

function orderedTargets(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(orderedTargets);
  if (!value || typeof value !== "object") return [];
  const result = [];
  const keys = [...TARGET_CONDITIONS.filter((key) => key in value), ...Object.keys(value).filter((key) => !TARGET_CONDITIONS.includes(key))];
  for (const key of keys) result.push(...orderedTargets(value[key]));
  return result;
}

function subpathRoutes(exports) {
  if (typeof exports === "string" || Array.isArray(exports)) return [[".", exports]];
  if (!exports || typeof exports !== "object") return [];
  const keys = Object.keys(exports);
  if (keys.some((key) => key.startsWith("."))) return Object.entries(exports);
  return [[".", exports]];
}

function isInternalRoute(route) {
  return route.split("/").some((part) => part === "internal");
}

function globMatcher(pattern) {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//u, "");
  let expression = "^";
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index];
    if (char === "*" && normalized[index + 1] === "*") {
      expression += ".*";
      index++;
    } else if (char === "*") expression += "[^/]*";
    else if (char === "?") expression += "[^/]";
    else expression += char.replace(/[|\\{}()[\]^$+?.]/gu, "\\$&");
  }
  return new RegExp(expression + "(?:/.*)?$", "u");
}

function isPublishableSource(packageInfo, sourceFile) {
  const patterns = packageInfo.manifest.publishConfig?.files ?? packageInfo.manifest.files;
  if (!Array.isArray(patterns) || patterns.length === 0) return true;
  const relative = path.relative(packageInfo.directory, sourceFile).replaceAll(path.sep, "/");
  let included = false;
  for (const raw of patterns) {
    if (typeof raw !== "string") continue;
    const excluded = raw.startsWith("!");
    const pattern = excluded ? raw.slice(1) : raw;
    if (globMatcher(pattern).test(relative)) included = !excluded;
  }
  return included;
}

function sourceCandidates(packageInfo, target) {
  if (typeof target !== "string" || !target.startsWith("./")) return [];
  const relative = target.replaceAll("\\", "/").slice(2);
  const candidates = [];
  const addTarget = (targetRelative) => {
    const declarationFile = /\.d\.[cm]?ts$/u.test(targetRelative);
    const ext = path.extname(targetRelative);
    const stem = declarationFile
      ? targetRelative.replace(/\.d\.[cm]?ts$/u, "")
      : [".js", ".jsx", ".mjs", ".cjs"].includes(ext)
        ? targetRelative.slice(0, -ext.length)
        : targetRelative;
    if (!declarationFile && SOURCE_EXTENSIONS.includes(ext)) candidates.push(path.join(packageInfo.directory, targetRelative));
    for (const ending of [".ts", ".tsx", ".mts", ".cts"]) candidates.push(path.join(packageInfo.directory, stem + ending));
    if (!ext) for (const ending of ["/index.ts", "/index.tsx", "/index.mts", "/index.cts"]) candidates.push(path.join(packageInfo.directory, targetRelative + ending));
  };
  addTarget(relative);
  if (relative.startsWith("lib/")) addTarget("src/" + relative.slice(4));
  if (relative.startsWith("dist/")) addTarget("src/" + relative.slice(5));
  return [...new Set(candidates)];
}

function packageTarget(packageInfo, target) {
  for (const candidate of sourceCandidates(packageInfo, target)) {
    if (!within(packageInfo.directory, candidate) || !fs.existsSync(candidate)) continue;
    let real;
    try { real = fs.realpathSync(candidate); } catch { continue; }
    if (!within(packageInfo.directory, real) || !fs.statSync(real).isFile()) continue;
    if (/\.d\.[cm]?ts$/u.test(real) || !SOURCE_EXTENSIONS.includes(path.extname(real))) continue;
    if (isPublishableSource(packageInfo, real)) return real;
  }
  return undefined;
}

function publicContractDeclarations(index, root, rootNames = [...index.publicFiles]) {
  const configPath = path.join(root, "config", "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error) throw new Error("Cannot read config/tsconfig.json.");
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
  const program = ts.createProgram({ rootNames, options: { ...parsed.options, noEmit: true, skipLibCheck: true } });
  const checker = program.getTypeChecker();
  const namesByFile = new Map();
  const seen = new Set();
  const queue = [];
  const rootFiles = new Set(rootNames.map((file) => path.resolve(file)));

  const addDeclaration = (declaration) => {
    const file = path.resolve(declaration.getSourceFile().fileName);
    if (!within(root, file) || declaration.getSourceFile().isDeclarationFile) return;
    const name = declarationName(declaration);
    if (!name) return;
    let names = namesByFile.get(file);
    if (!names) namesByFile.set(file, names = new Set());
    names.add(name);
    const key = file + "\0" + declaration.pos + "\0" + declaration.end;
    if (!seen.has(key)) { seen.add(key); queue.push(declaration); }
  };

  for (const [file, publicNames] of index.symbolsByFile) {
    if (!rootFiles.has(path.resolve(file))) continue;
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) continue;
    const names = new Set([...publicNames.values()].flatMap((items) => [...items]));
    function seed(node) {
      if (declarationName(node) && names.has(declarationName(node))) addDeclaration(node);
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && names.has(declaration.name.text)) addDeclaration(declaration);
        }
      }
      ts.forEachChild(node, seed);
    }
    seed(sourceFile);
  }

  while (queue.length) {
    const declaration = queue.pop();
    function visit(node) {
      if (node !== declaration && ts.isBlock(node)) return;
      if ((ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) && node.initializer) {
        if (node !== declaration) return;
      }
      const reference = ts.isTypeReferenceNode(node)
        ? node.typeName
        : ts.isExpressionWithTypeArguments(node)
          ? node.expression
          : undefined;
      if (reference) {
        let symbol = checker.getSymbolAtLocation(reference);
        if (symbol && (symbol.flags & ts.SymbolFlags.Alias)) {
          try { symbol = checker.getAliasedSymbol(symbol); } catch {}
        }
        for (const target of symbol?.declarations ?? []) addDeclaration(target);
      }
      ts.forEachChild(node, visit);
    }
    visit(declaration);
  }
  return namesByFile;
}
function createPublicSourceExportIndex(options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, ".."));
  const packagesDirectory = path.join(root, "packages");
  const packagesByName = new Map();
  const packageInfos = [];
  for (const entry of fs.readdirSync(packagesDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(packagesDirectory, entry.name);
    const manifestPath = path.join(directory, "package.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (typeof manifest.name !== "string") continue;
    const effectiveExports = manifest.publishConfig?.exports ?? manifest.exports;
    const routes = new Map();
    for (const [route, value] of subpathRoutes(effectiveExports)) {
      for (const target of orderedTargets(value)) {
        const source = packageTarget({ directory, manifest }, target);
        if (source) { routes.set(route, source); break; }
      }
    }
    if (!routes.has(".")) {
      const fallback = manifest.publishConfig?.types || manifest.types || manifest.typings || manifest.source || manifest.module || manifest.main || "./src/index.ts";
      for (const target of orderedTargets(fallback)) {
        const source = packageTarget({ directory, manifest }, target);
        if (source) { routes.set(".", source); break; }
      }
    }
    const info = { name: manifest.name, directory, manifest, routes, publicRoutes: new Map() };
    for (const [route, source] of routes) {
      if (route === "./package.json" || isInternalRoute(route)) continue;
      info.publicRoutes.set(route, source);
    }
    packagesByName.set(info.name, info);
    packageInfos.push(info);
  }

  const sourceCache = new Map();
  const moduleCache = new Map();
  function read(file) {
    const real = fs.realpathSync(file);
    if (!within(root, real) || !fs.statSync(real).isFile()) return undefined;
    if (sourceCache.has(real)) return sourceCache.get(real);
    const bytes = fs.readFileSync(real);
    const text = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(text, "utf8"))) throw new Error("Invalid UTF-8 source: " + real);
    const tree = ts.createSourceFile(real, text, ts.ScriptTarget.Latest, true);
    const result = { file: real, text, tree };
    sourceCache.set(real, result);
    return result;
  }

  function resolveRelative(fromFile, specifier) {
    if (!specifier?.startsWith(".")) return undefined;
    const base = path.resolve(path.dirname(fromFile), specifier);
    const extension = path.extname(base);
    const replacements = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".ts", ".mjs"],
      ".cjs": [".cts", ".ts", ".cjs"],
    };
    const candidates = replacements[extension]
      ? replacements[extension].map((ending) => base.slice(0, -extension.length) + ending)
      : [base, ...[".ts", ".tsx", ".mts", ".cts", "/index.ts", "/index.tsx", "/index.mts", "/index.cts"].map((ending) => base + ending)];
    for (const candidate of candidates) {
      if (!within(root, candidate) || !fs.existsSync(candidate)) continue;
      try { if (!fs.statSync(candidate).isFile()) continue; return fs.realpathSync(candidate); } catch {}
    }
    return undefined;
  }

  function workspacePackageSpecifier(specifier) {
    const candidates = [...packagesByName.keys()].sort((a, b) => b.length - a.length);
    for (const packageName of candidates) {
      if (specifier === packageName) return { packageName, route: "." };
      if (specifier.startsWith(packageName + "/")) return { packageName, route: "./" + specifier.slice(packageName.length + 1) };
    }
    return undefined;
  }

  function resolveModule(fromFile, specifier) {
    if (specifier?.startsWith(".")) return resolveRelative(fromFile, specifier);
    const workspace = workspacePackageSpecifier(specifier || "");
    if (!workspace) return undefined;
    const info = packagesByName.get(workspace.packageName);
    return info?.routes.get(workspace.route);
  }

  function readModule(file, visiting = new Set()) {
    let real;
    try { real = fs.realpathSync(file); } catch { return new Map(); }
    if (moduleCache.has(real)) return moduleCache.get(real);
    if (visiting.has(real)) return moduleCache.get(real) ?? new Map();
    const item = read(real);
    if (!item || item.tree.parseDiagnostics.length) return new Map();
    const result = new Map();
    moduleCache.set(real, result);
    const imports = new Map();
    const localNames = new Set();
    const next = new Set(visiting).add(real);

    for (const statement of item.tree.statements) {
      if (ts.isImportDeclaration(statement)) {
        const target = resolveModule(real, statement.moduleSpecifier.text);
        const clause = statement.importClause;
        if (!target || !clause) continue;
        if (clause.name) imports.set(clause.name.text, { target, name: "default" });
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) imports.set(element.name.text, {
            target,
            name: element.propertyName?.text || element.name.text,
          });
        } else if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          imports.set(clause.namedBindings.name.text, { target, namespace: true });
        }
      }
      for (const entry of exportedDeclarations(statement)) {
        localNames.add(entry.declarationName);
        addDefinition(result, entry.exportedName, real, entry.declarationName);
        if (ts.isModuleDeclaration(statement)) {
          for (const member of namespaceMembers(statement, entry.exportedName)) {
            addDefinition(result, member.exportedName, real, member.declarationName);
          }
        }
      }
    }

    for (const statement of item.tree.statements) {
      if (ts.isExportAssignment(statement)) {
        if (statement.isExportEquals) continue;
        if (ts.isIdentifier(statement.expression)) {
          const local = statement.expression.text;
          const imported = imports.get(local);
          if (imported?.target) {
            if (imported.namespace) {
              const targetExports = readModule(imported.target, next);
              addDefinition(result, "default", real, local);
              for (const name of targetExports.keys()) {
                if (name !== "default") mergeDefinitions(result, "default." + name, targetExports.get(name));
              }
            } else mergeDefinitions(result, "default", readModule(imported.target, next).get(imported.name));
          } else if (localNames.has(local)) addDefinition(result, "default", real, local);
        } else addDefinition(result, "default", real, "default");
        continue;
      }
      if (!ts.isExportDeclaration(statement)) continue;
      const clause = statement.exportClause;
      const target = statement.moduleSpecifier ? resolveModule(real, statement.moduleSpecifier.text) : undefined;
      const targetExports = target ? readModule(target, next) : undefined;
      if (clause && ts.isNamespaceExport(clause)) {
        const namespaceName = clause.name.text;
        addDefinition(result, namespaceName, real, namespaceName);
        for (const [name, definitions] of targetExports ?? []) {
          if (name !== "default") mergeDefinitions(result, namespaceName + "." + name, definitions);
        }
        continue;
      }
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          const publicName = element.name.text;
          const sourceName = element.propertyName?.text || element.name.text;
          if (targetExports) mergeDefinitions(result, publicName, targetExports.get(sourceName));
          else {
            const imported = imports.get(sourceName);
            if (imported?.target) {
              if (imported.namespace) {
                addDefinition(result, publicName, real, sourceName);
                for (const [name, definitions] of readModule(imported.target, next)) {
                  if (name !== "default") mergeDefinitions(result, publicName + "." + name, definitions);
                }
              } else mergeDefinitions(result, publicName, readModule(imported.target, next).get(imported.name));
            } else if (localNames.has(sourceName)) addDefinition(result, publicName, real, sourceName);
          }
        }
        continue;
      }
      if (!clause && targetExports) {
        for (const [name, definitions] of targetExports) {
          if (name !== "default") mergeDefinitions(result, name, definitions);
        }
      }
    }
    moduleCache.set(real, result);
    return result;
  }

  const packageForFile = (file) => packageInfos
    .filter((info) => within(info.directory, file))
    .sort((left, right) => right.directory.length - left.directory.length)[0];

  const exportsByFile = new Map();
  const symbolsByFile = new Map();
  const symbolsByPackage = new Map();
  const publicFiles = new Set();
  const exportsByPackage = new Map();
  const entrypoints = new Map();
  for (const info of packageInfos) {
    const packageExports = new Map();
    const packageSymbolsByFile = new Map();
    symbolsByPackage.set(info.name, packageSymbolsByFile);
    exportsByPackage.set(info.name, packageExports);
    entrypoints.set(info.name, new Map(info.publicRoutes));
    for (const [route, entry] of info.publicRoutes) {
      for (const [name, definitions] of readModule(entry)) {
        for (const [file, declarations] of definitions) {
          const ownerPackage = packageForFile(file);
          if (ownerPackage && !isPublishableSource(ownerPackage, file)) continue;
          publicFiles.add(file);
          let names = exportsByFile.get(file);
          if (!names) exportsByFile.set(file, names = new Set());
          names.add(name);
          let symbols = symbolsByFile.get(file);
          if (!symbols) symbolsByFile.set(file, symbols = new Map());
          let localNames = symbols.get(name);
          if (!localNames) symbols.set(name, localNames = new Set());
          for (const declarationName of declarations) localNames.add(declarationName);
          let packageSymbols = packageSymbolsByFile.get(file);
          if (!packageSymbols) packageSymbolsByFile.set(file, packageSymbols = new Map());
          let packageLocalNames = packageSymbols.get(name);
          if (!packageLocalNames) packageSymbols.set(name, packageLocalNames = new Set());
          for (const declarationName of declarations) packageLocalNames.add(declarationName);
          let module = packageExports.get(name);
          if (!module) packageExports.set(name, module = new Map());
          let entries = module.get(route);
          if (!entries) module.set(route, entries = new Map());
          let files = entries.get(file);
          if (!files) entries.set(file, files = new Set());
          for (const declarationName of declarations) files.add(declarationName);
        }
      }
    }
  }

  function resolveExport(packageName, exportName, subpath = ".") {
    const entries = exportsByPackage.get(packageName)?.get(exportName)?.get(subpath);
    if (!entries || entries.size !== 1) return null;
    return entries.keys().next().value;
  }

  return { exportsByFile, symbolsByFile, publicFiles, entrypoints, resolveExport, publicContractDeclarations: (rootNames, packageName) => { const scopedSymbols = packageName === undefined ? symbolsByFile : symbolsByPackage.get(packageName); if (!scopedSymbols) throw new Error("Unknown public export package: " + packageName); const roots = rootNames ?? [...scopedSymbols.keys()]; return publicContractDeclarations({ symbolsByFile: scopedSymbols, publicFiles: new Set(roots) }, root, roots); } };
}

module.exports = { createPublicSourceExportIndex };
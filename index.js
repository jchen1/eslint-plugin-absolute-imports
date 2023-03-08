"use strict";

const fs = require("fs");
const path = require("path");
const jsonParser = require("jsonc-parser");

function has(map, path) {
  let inner = map;
  for (let step of path.split(".")) {
    inner = inner[step];
    if (inner === undefined) {
      return false;
    }
  }
  return true;
}

function findDirWithFile(filename) {
  let dir = path.resolve(filename);

  do {
    dir = path.dirname(dir);
  } while (!fs.existsSync(path.join(dir, filename)) && dir !== "/");

  if (!fs.existsSync(path.join(dir, filename))) {
    return;
  }

  return dir;
}

function getImportPrefixToAlias(paths) {
  const reversed = {};
  for (let key of Object.keys(paths)) {
    for (let path of paths[key]) {
      reversed[path] = key;
    }
  }
  return reversed;
}

function getBaseUrlAndPaths(baseDir) {
  let url = "";
  let paths = {};

  if (fs.existsSync(path.join(baseDir, "tsconfig.json"))) {
    const tsconfig = jsonParser.parse(
      fs.readFileSync(path.join(baseDir, "tsconfig.json")).toString()
    );
    if (has(tsconfig, "compilerOptions.baseUrl")) {
      url = tsconfig.compilerOptions.baseUrl;
    }
    if (has(tsconfig, "compilerOptions.paths")) {
      paths = tsconfig.compilerOptions.paths;
    }
  } else if (fs.existsSync(path.join(baseDir, "jsconfig.json"))) {
    const jsconfig = jsonParser.parse(
      fs.readFileSync(path.join(baseDir, "jsconfig.json")).toString()
    );
    if (has(jsconfig, "compilerOptions.baseUrl")) {
      url = jsconfig.compilerOptions.baseUrl;
    }
    if (has(jsconfig, "compilerOptions.paths")) {
      paths = jsconfig.compilerOptions.paths;
    }
  }

  return [path.join(baseDir, url), paths];
}

function getExpectedPath(absolutePath, baseUrl, importPrefixToAlias, onlyPathAliases, onlyAbsoluteImports) {
  const relativeToBasePath = path.relative(baseUrl, absolutePath);
  if (!onlyAbsoluteImports) {
    for (let prefix of Object.keys(importPrefixToAlias)) {
      const aliasPath = importPrefixToAlias[prefix];
      // assuming they are either a full path or a path ends with /*, which are the two standard cases
      const importPrefix = prefix.endsWith("/*") ? prefix.replace("/*", "") : prefix;
      const aliasImport = aliasPath.endsWith("/*") ? aliasPath.replace("/*", "") : aliasPath;
      if (relativeToBasePath.startsWith(importPrefix)) {
        return `${aliasImport}${relativeToBasePath.slice(importPrefix.length)}`;
      }
    }
  }
  if (!onlyPathAliases) {
    return relativeToBasePath;
  }
}

const optionsSchema = {
  type: 'object',
  properties: {
    onlyPathAliases: {
      type: 'boolean',
    },
    onlyAbsoluteImports: {
      type: 'boolean',
    },
  }
}

function generateRule(context, errorMessagePrefix, importPathConditionCallback) {
  const options = context.options[0] || {};
  const onlyPathAliases = options.onlyPathAliases || false;
  const onlyAbsoluteImports = options.onlyAbsoluteImports || false;

  const baseDir = findDirWithFile("package.json");
  const [baseUrl, paths] = getBaseUrlAndPaths(baseDir);
  const importPrefixToAlias = getImportPrefixToAlias(paths);

  return {
    ImportDeclaration(node) {
      const source = node.source.value;
      if (importPathConditionCallback(source)) {
        const filename = context.getFilename();

        const absolutePath = path.normalize(
          path.join(path.dirname(filename), source)
        );
        const expectedPath = getExpectedPath(
          absolutePath, 
          baseUrl, 
          importPrefixToAlias, 
          onlyPathAliases,
          onlyAbsoluteImports,
        );

        if (expectedPath && source !== expectedPath) {
          context.report({
            node,
            message: `${errorMessagePrefix}. Use \`${expectedPath}\` instead of \`${source}\`.`,
            fix: function (fixer) {
              return fixer.replaceText(node.source, `'${expectedPath}'`);
            },
          });
        }
      }
    },
  };
}

module.exports.rules = {
  "no-relative-import": {
    meta: {
      fixable: true,
      schema: [optionsSchema]
    },
    create: function (context) {
      return generateRule(
        context, 
        "Relative imports are not allowed",
        (source) => source.startsWith("."),
      );
    },
  },
  "no-relative-parent-imports": {
    meta: {
      fixable: true,
      schema: [optionsSchema]
    },
    create: function (context) {
      return generateRule(
        context,
        "Relative imports from parent directories are not allowed",
        (source) => source.startsWith(".."),
      )
    },
  },
};

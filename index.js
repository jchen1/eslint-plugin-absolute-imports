"use strict";

const fs = require("fs");
const path = require("path");

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

function reversePaths(paths) {
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
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "tsconfig.json"))
    );
    if (has(tsconfig, "compilerOptions.baseUrl")) {
      url = tsconfig.compilerOptions.baseUrl;
    }
    if (has(tsconfig, "compilerOptions.paths")) {
      paths = tsconfig.compilerOptions.paths;
    }
  } else if (fs.existsSync(path.join(baseDir, "jsconfig.json"))) {
    const jsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "jsconfig.json"))
    );
    if (has(jsconfig, "compilerOptions.baseUrl")) {
      url = jsconfig.compilerOptions.baseUrl;
    }
    if (has(jsconfig, "compilerOptions.paths")) {
      paths = jsconfig.compilerOptions.paths;
    }
  }

  return [path.join(baseDir, url), reversePaths(paths)];
}

function getExpectedPath(absolutePath, baseUrl, reversedPaths) {
  const relativeToBasePath = path.relative(baseUrl, absolutePath);
  for (let prefix of Object.keys(reversedPaths)) {
    const aliasPath = reversedPaths[prefix];
    // assuming they are either a full path or a path ends with /*, which are the two standard cases
    const importPrefix = prefix.endsWith("/*") ? prefix.replace("/*", "") : prefix;
    const aliasImport = aliasPath.endsWith("/*") ? aliasPath.replace("/*", "") : aliasPath;
    if (relativeToBasePath.startsWith(importPrefix)) {
      return relativeToBasePath.replace(importPrefix, aliasImport);
    }
  }
  return relativeToBasePath;
}

module.exports.rules = {
  "only-absolute-imports": {
    meta: {
      fixable: true,
    },
    create: function (context) {
      const baseDir = findDirWithFile("package.json");
      const [baseUrl, paths] = getBaseUrlAndPaths(baseDir);
      const reversedPaths = reversePaths(paths);

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (source.startsWith(".")) {
            const filename = context.getFilename();

            const absolutePath = path.normalize(
              path.join(path.dirname(filename), source)
            );
            const expectedPath = getExpectedPath(absolutePath, baseUrl, reversedPaths);

            if (source !== expectedPath) {
              context.report({
                node,
                message: `Relative imports are not allowed. Use \`${expectedPath}\` instead of \`${source}\`.`,
                fix: function (fixer) {
                  return fixer.replaceText(node.source, `'${expectedPath}'`);
                },
              });
            }
          }
        },
      };
    },
  },
  "no-relative-parent-imports": {
    meta: {
      fixable: true,
    },
    create: function (context) {
      const baseDir = findDirWithFile("package.json");
      const [baseUrl, paths] = getBaseUrlAndPaths(baseDir);
      const reversedPaths = reversePaths(paths);

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (source.startsWith("../")) {
            const filename = context.getFilename();

            const absolutePath = path.normalize(
              path.join(path.dirname(filename), source)
            );
            const expectedPath = getExpectedPath(absolutePath, baseUrl, reversedPaths);

            if (source !== expectedPath) {
              context.report({
                node,
                message: `Relative imports are not allowed. Use \`${expectedPath}\` instead of \`${source}\`.`,
                fix: function (fixer) {
                  return fixer.replaceText(node.source, `'${expectedPath}'`);
                },
              });
            }
          }
        },
      };
    },
  },
};

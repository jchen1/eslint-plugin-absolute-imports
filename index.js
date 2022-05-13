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

function getBaseUrl(baseDir) {
  let url = "";

  if (fs.existsSync(path.join(baseDir, "tsconfig.json"))) {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "tsconfig.json"))
    );
    if (has(tsconfig, "compilerOptions.baseUrl")) {
      url = tsconfig.compilerOptions.baseUrl;
    }
  } else if (fs.existsSync(path.join(baseDir, "jsconfig.json"))) {
    const jsconfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "jsconfig.json"))
    );
    if (has(jsconfig, "compilerOptions.baseUrl")) {
      url = jsconfig.compilerOptions.baseUrl;
    }
  }

  return path.join(baseDir, url);
}

module.exports.rules = {
  "only-absolute-imports": {
    meta: {
      fixable: true,
    },
    create: function (context) {
      const baseDir = findDirWithFile("package.json");
      const baseUrl = getBaseUrl(baseDir);

      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (source.startsWith(".")) {
            const filename = context.getFilename();

            const absolutePath = path.normalize(
              path.join(path.dirname(filename), source)
            );
            const expectedPath = path.relative(baseUrl, absolutePath);

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

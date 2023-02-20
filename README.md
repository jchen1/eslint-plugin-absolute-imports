# eslint-plugin-import-typescript

An ESLint plugin that auto-fixes relative imports to absolute imports. Support [baseUrl](https://www.typescriptlang.org/tsconfig#baseUrl) and [paths](https://www.typescriptlang.org/tsconfig#paths) config in TSConfig.

A typical project starts out using relative imports, but once it has gotten bigger, the relative imports grows longer and messier. This plugin is useful when you want to migrate the relative imports to absolute imports, and keep it that way through auto-fixes.

Built on Jeff Chen's [Absolute Imports](https://github.com/jchen1/eslint-plugin-absolute-imports) plugin.

## Prerequisites

You must define `baseUrl` and `paths` (optional) in either `tsconfig.json` or `jsconfig.json`.

## Setup

- `npm i --save-dev eslint-plugin-import-typescript`
- Add `eslint-plugin-import-typescript` to your eslint `plugins` section
- Add one of the supported rules below to your eslint `rules` section.

Example:
```
  plugins: ['eslint-plugin-import-typescript'],
  rules: [
    'import-typescript/no-relative-parent-imports': ['error'],
  ]
```

## Rules

| Rule | Description |
|------|--------|
| no-relative-imports | Autofix relative imports to absolute import or paths import |
| no-relative-parent-imports | Autofix relative parent imports to absolute import or paths import |

The rule `no-relative-parent-imports` is useful when you still want to allow relative import within the same folder but disallow relative import in a parent folder. It's similar to [eslint-plugin-import/no-relative-parent-imports](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-relative-parent-imports.md) rule, except it supports auto-fix. It is the recommended rule.


The rules supports `baseUrl` and `paths`, and will prioritize `paths` import if it exists. It's possible to disable one of the rewritting rules by setting the corresponding options
| Options | Description |
|---------|--|
| onlyAbsoluteImport | Ignore `paths` config if it exists |
| onlyPathsImport    | Do not autofix absolute import. Only fix import if there is a path matching `paths` config |

Example:
```
    'import-typescript/no-relative-parent-imports': [
        'error', { onlyAbsoluteImport: true } 
    ],
```

## Related readings

While `baseUrl` and `paths` are understood and supported by Typescript, it [doesn't rewrite the import paths](https://github.com/microsoft/TypeScript/issues/5039#issuecomment-232470330) when it compiles the typescript code to javascript. Belows are some related readings and library to get typescript absolute imports works:
- **With transpiled code**: Use [tsc-alias](https://github.com/justkey007/tsc-alias) to rewrite the import path, or [tsconfig-paths](https://github.com/dividab/tsconfig-paths) to help Node understands absolute import
- **With Jest**: configure [roots](https://jestjs.io/docs/configuration#roots-arraystring), [modulePaths](https://jestjs.io/docs/configuration#modulepaths-arraystring) and [moduleNameMapper](https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring). If you run into issue with globalSetup/globalTeardown script, you need to use [tsconfig-paths](https://github.com/facebook/jest/issues/5164#issuecomment-376006851) here as well.
- **With ESlint**: if you use `paths`, you need to use [eslint-import-resolver-typescript](https://github.com/import-js/eslint-import-resolver-typescript) to help eslint understands paths import.

## Contributions

Contributions are welcome!

## License

MIT

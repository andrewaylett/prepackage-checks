#!/usr/bin/env node --experimental-vm-modules

/*
 * Copyright 2022 Andrew Aylett
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'node:path';
import fs from 'node:fs';

import glob from 'glob';
import { run } from 'jest-cli';

// The URL is prefixed with 'file:', which we need to remove before passing to
// Jest
const distDir = path.dirname(import.meta.url).substring(5);
const rootDir = path.resolve(distDir, '..');

let searchDir = rootDir;
let topDir = searchDir;
while (searchDir.length > 1) {
    if (fs.existsSync(path.join(searchDir, 'package.json'))) {
        topDir = searchDir;
    }
    searchDir = path.resolve(searchDir, '..');
}

const ourNodeModules = glob.sync(path.join(rootDir, '**', 'node_modules'));
const allNodeModules = glob.sync(path.join(topDir, '**', 'node_modules'));
const parentNodeModules = allNodeModules.filter((m) => !(m in ourNodeModules));

const config = {
    rootDir,
    testEnvironment: 'node',
    testMatch: ['**/package-files.js'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    injectGlobals: false,
    transformIgnorePatterns: [],
    moduleDirectories: [],
    // Put our modules first, in case we have deps that aren't deduped due to
    // version constraints -- we don't want to pick up the wrong version.
    modulePaths: [...ourNodeModules, ...parentNodeModules],
    haste: {
        retainAllFiles: true,
    },
};

await run([
    '-c',
    JSON.stringify(config),
    '--verbose',
    ...process.argv.slice(2),
]);

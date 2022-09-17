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

import { run } from 'jest-cli';

// The URL is prefixed with 'file:', which we need to remove before passing to
// Jest
const distDir = path.dirname(import.meta.url).substring(5);

await run([
    '-c',
    `{"rootDir": "${distDir}", "testEnvironment": "node", "testMatch": ["**/package-files.js"]}`,
    '--verbose',
]);

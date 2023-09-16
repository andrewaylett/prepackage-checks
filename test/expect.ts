/*
 * Copyright 2023 Andrew Aylett
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

import { extend } from 'extend-expect';

import { fileMatchers } from './file.js';
import { processMatchers } from './process.js';

import type { FileMatchers } from './file.js';
import type { ProcessMatchers } from './process.js';

const customMatchers = {
    ...fileMatchers,
    ...processMatchers,
};

interface CoreExtensions extends FileMatchers, ProcessMatchers {}

export const expect = extend<CoreExtensions>(customMatchers);

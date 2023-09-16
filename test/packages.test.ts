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

import { mkdtemp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import os from 'node:os';

import { expect } from './expect.js';

const SUCCESSFUL_BASE: string = path.resolve('./test', 'successful');
const SUCCESSFUL: Promise<string[]> = readdir(SUCCESSFUL_BASE);
const FAILING_BASE: string = path.resolve('./test', 'failing');
const FAILING: Promise<string[]> = readdir(FAILING_BASE);

function buildTests(base: string, cases: Promise<string[]>, pass: boolean) {
    test(`${
        pass ? 'Successful' : 'Failing'
    } Tests`, async (ctx): Promise<void> =>
        Promise.all(
            (await cases).map(async (testcase) => {
                const testDirectory = path.resolve(base, testcase);
                const buildDirectory = await mkdtemp(
                    path.join(os.tmpdir(), `successful-${testcase}-`),
                );
                await ctx.test(
                    `${testcase} should be a directory`,
                    async () => {
                        await expect(testDirectory).isADirectory();
                    },
                );
                await ctx.test(`${testcase} should copy cleanly`, () =>
                    expect(
                        spawn('cp', ['-r', testDirectory, buildDirectory]),
                    ).toSpawnSuccessfully(),
                );
                await ctx.test(`${testcase} should install cleanly`, () =>
                    expect(
                        spawn(
                            'npm',
                            [
                                'install',
                                path.resolve(testDirectory, '../../..'),
                            ],
                            {
                                cwd: path.resolve(buildDirectory, testcase),
                                stdio: 'pipe',
                            },
                        ),
                    ).toSpawnSuccessfully(),
                );
                await ctx.test(
                    `${testcase} should run prepackage-checks ${
                        pass
                            ? 'successfully'
                            : 'and exit with a non-zero status code'
                    }`,
                    async () => {
                        const childProcess = spawn(
                            'npx',
                            ['prepackage-checks'],
                            {
                                cwd: path.resolve(buildDirectory, testcase),
                                stdio: 'pipe',
                            },
                        );

                        const allData: string[] = [];
                        childProcess.stdout.on('data', (data) =>
                            allData.push(data),
                        );
                        childProcess.stdout.pipe(process.stdout);
                        childProcess.stderr.pipe(process.stderr);

                        await expect(childProcess).toSpawnSuccessfully(pass);

                        const blob = allData.join('');

                        const { assert } = await import(
                            path.resolve(testDirectory, 'expect.cjs')
                        );
                        assert(blob, expect);
                    },
                );
            }),
        ).then(() => {}));
}

buildTests(SUCCESSFUL_BASE, SUCCESSFUL, true);
buildTests(FAILING_BASE, FAILING, false);

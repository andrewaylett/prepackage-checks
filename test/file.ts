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

import { stat } from 'node:fs/promises';

import type {
    MatchersFor,
    MatcherState,
    ExpectationResult,
} from 'extend-expect';

async function isAFile(
    this: MatcherState,
    received: unknown,
    expected: unknown,
): Promise<ExpectationResult> {
    const options = {
        comment: 'Check that a file exists',
        isNot: this.isNot,
        promise: this.promise,
    };
    this.utils.ensureNoExpected(expected, 'isAFile', options);

    const matcherHint = this.utils.matcherHint(
        'toBeAFile',
        undefined,
        undefined,
        options,
    );

    if (typeof received !== 'string') {
        return {
            pass: false,
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must be a string filename`,
                    this.utils.printWithType(
                        'Received',
                        received,
                        this.utils.printReceived,
                    ),
                ),
        };
    }
    try {
        return {
            pass: (await stat(received)).isFile(),
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must be a file`,
                    this.utils.printReceived(received),
                ),
        };
    } catch (e) {
        return {
            pass: false,
            message: (): string =>
                this.utils.matcherErrorMessage(
                    matcherHint,

                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must exist and be a file`,
                    this.utils.printReceived(received),
                ),
        };
    }
}

async function isADirectory(
    this: MatcherState,
    received: unknown,
    expected: unknown,
): Promise<ExpectationResult> {
    const options = {
        comment: 'Check that a directory exists',
        isNot: this.isNot,
        promise: this.promise,
    };
    this.utils.ensureNoExpected(expected, 'isADirectory', options);

    const matcherHint = this.utils.matcherHint(
        'toBeADirectory',
        undefined,
        undefined,
        options,
    );

    if (typeof received !== 'string') {
        return {
            pass: false,
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must be a string directory name`,
                    this.utils.printWithType(
                        'Received',
                        received,
                        this.utils.printReceived,
                    ),
                ),
        };
    }
    try {
        return {
            pass: (await stat(received)).isDirectory(),
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must be a directory`,
                    this.utils.printReceived(received),
                ),
        };
    } catch (e) {
        return {
            pass: false,
            message: (): string =>
                this.utils.matcherErrorMessage(
                    matcherHint,

                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must exist and be a directory`,
                    this.utils.printReceived(received),
                ),
        };
    }
}

export interface FileMatchers {
    isAFile(): Promise<void>;
    isADirectory(): Promise<void>;
}

export const fileMatchers: MatchersFor<FileMatchers> = {
    isAFile,
    isADirectory,
};

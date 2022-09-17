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

import fs from 'node:fs';

import { MatchersFor, MatcherState, ExpectationResult } from 'extend-expect';

function isAFile(
    this: MatcherState,
    received: unknown,
    expected: unknown,
): ExpectationResult {
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

    if (received === undefined) {
        return {
            pass: true,
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value is undefined, assume missing`,
                    this.utils.printWithType(
                        'Received',
                        received,
                        this.utils.printReceived,
                    ),
                ),
        };
    }

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
    return {
        pass: fs.existsSync(received),
        message: () =>
            this.utils.matcherErrorMessage(
                matcherHint,
                `${this.utils.RECEIVED_COLOR(
                    'received',
                )} value must exist as a file`,
                this.utils.printReceived(received),
            ),
    };
}

export interface FileMatchers {
    isAFile(): void;
}

export const fileMatchers: MatchersFor<FileMatchers> = {
    isAFile,
};

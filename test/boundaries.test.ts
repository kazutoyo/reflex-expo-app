import fs from 'node:fs';
import path from 'node:path';

/**
 * src/core is the UI-free layer (Reflex's Core). It must not import React, React Native, Expo, or UI code.
 * As long as this holds, core runs as-is on Node and can be driven from the harness or CLI.
 */
const FORBIDDEN = /from '(react|react-native|expo[^']*|@expo\/[^']*|@\/(ui|platform|app|dev)\b[^']*)'/;

const files = fs
  .readdirSync(path.join(__dirname, '../src/core'), { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
  .map((e) => path.join(e.parentPath, e.name));

test.each(files.map((f) => [path.relative(path.join(__dirname, '..'), f), f]))(
  '%s は UI・Expo に依存しない',
  (_, file) => {
    const bad = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => FORBIDDEN.test(line));
    expect(bad).toEqual([]);
  }
);

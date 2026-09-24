/** Minimal Node 24 SQLite contract while the inherited project uses @types/node 20. */
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...args: (string | number)[]): unknown;
      get(...args: (string | number)[]): unknown;
      all(...args: (string | number)[]): unknown[];
    };
  }
}

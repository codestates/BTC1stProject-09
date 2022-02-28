import type { Principal } from '@dfinity/principal';
export interface _SERVICE {
  'get' : (arg_0: string) => Promise<[] | [string]>,
  'p2a' : (arg_0: Principal) => Promise<string>,
  'set' : (arg_0: string, arg_1: string) => Promise<[] | [string]>,
  'whoami' : () => Promise<Principal>,
}

declare module "@outofsync/express-ip-blacklist";

import ObjectKeyCache from '@outofsync/object-key-cache';
import MemoryCache from '@outofsync/memory-cache';
import Redis from 'redis';

type IPBlacklistLookupFn = (req: any) => string[];
type IPBlacklistWhiteListFn = (req: any) => string[] | boolean;
type IPBlacklistOnBlacklistFn = (req: any, res: any, next: function) => any;
type Cache = typeof ObjectKeyCache | typeof MemoryCache | typeof Redis;

interface IPBlacklistOptions {
  lookup: IPBlacklistLookupFn | string[];
  count: number;
  export: number;
  whitelist: IPBlacklistWhiteListFn;
  onBlacklist: IPBlacklistOnBlacklistFn | null;
  noip: boolean;
};

declare class IPBlacklist {
  constructor(namepace: string, config?: IPBlacklistOptions, cache?: Cache, log?: any);
  increment(req: any, res: any, next?: function);
  checkBlacklist(req: any, res: any, next: function);
}

declare const obj = IPBlacklist;
export default obj;
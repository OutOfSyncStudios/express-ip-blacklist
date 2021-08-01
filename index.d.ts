declare module "@outofsync/express-ip-blacklist";

import ObjectKeyCache from '@outofsync/object-key-cache';
import MemoryCache from '@outofsync/memory-cache';
import Redis from 'redis';

import {
  ClientRequest,
  ServerResponse,
} from 'http';

type ClosureFn = (...params: any) => void;
type IPBlacklistLookupFn = (req: ClientRequest) => string[];
type IPBlacklistWhiteListFn = (req: ClientRequest) => string[] | boolean;
type IPBlacklistOnBlacklistFn = (req: ClientRequest, res: ServerResponse, next: ClosureFn) => any;
type Cache = typeof ObjectKeyCache | typeof MemoryCache | typeof Redis;

interface IPBlacklistOptions {
  lookup: IPBlacklistLookupFn | string[];
  count: number;
  expire: number;
  whitelist: IPBlacklistWhiteListFn;
  onBlacklist: IPBlacklistOnBlacklistFn | null;
  noip: boolean;
}

declare class IPBlacklist {
  constructor(namepace: string, config?: IPBlacklistOptions, cache?: Cache, log?: any);
  increment(req: ClientRequest, res: ServerResponse, next?: ClosureFn);
  checkBlacklist(req: ClientRequest, res: ServerResponse, next: ClosureFn);
}

declare const obj: IPBlacklist;
export default obj;
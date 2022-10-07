/*!
 * Local Sync Hooks <https://github.com/smujmaiku/local-sync-hooks>
 * Copyright(c) 2022 Michael Szmadzinski
 * MIT Licensed
 */

import createSyncHooks from './create';

export type {
	SyncReducerT,
	UseSyncStateT,
	UseSyncReducerT,
	CreateSyncHooksI,
} from './create';

const PACKAGE_NAME = 'localSyncHooks';

const { useSyncState, useSyncReducer } = createSyncHooks(PACKAGE_NAME);

export { useSyncState, useSyncReducer, createSyncHooks };

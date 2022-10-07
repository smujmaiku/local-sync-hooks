/*!
 * Local Sync Hooks <https://github.com/smujmaiku/local-sync-hooks>
 * Copyright(c) 2022 Michael Szmadzinski
 * MIT Licensed
 */

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import * as localforage from 'localforage';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function noop(...args: any): void {
	// noop
}

export type SyncReducerT<T, A> = (state: T, action: A) => T;

export type UseSyncStateT = <T>(
	key: string,
	defaultState: T
) => [T, Dispatch<SetStateAction<T>>, boolean];
export type UseSyncReducerT = <T, A>(
	key: string,
	reducer: SyncReducerT<T, A>,
	defaultState: T
) => [T, (action: A) => void, boolean];
export type CreateSyncHooksI = {
	useSyncState: UseSyncStateT;
	useSyncReducer: UseSyncReducerT;
};

const stores: Record<string, LocalForage> = {};

const delay = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

/**
 * Create a set of sync hooks
 * @param name Channel and LocalForage name
 */
export function createSyncHooks(name: string): CreateSyncHooksI;

/**
 * Create a set of sync hooks
 * @param name Channel name
 * @param store LocalForage instance
 */
export function createSyncHooks(
	name: string,
	store: LocalForage
): CreateSyncHooksI;

export function createSyncHooks(
	name: string,
	store: LocalForage | undefined = undefined
): CreateSyncHooksI {
	if (!store) {
		const newStore = stores[name] || localforage.createInstance({ name });
		stores[name] = newStore;
		return createSyncHooks(name, newStore);
	}

	/**
	 * Use sync state
	 * @param key
	 * @param defaultState
	 */
	const useSyncState: UseSyncStateT = <T>(key: string, defaultState: T) => {
		const defaultStateRef = useRef<T>(defaultState);
		defaultStateRef.current = defaultState;

		const channelId = `${name}:${key}`;

		const [state, setState] = useState<T>(defaultState);
		const [postMessage, setPostMessage] = useState<boolean>(false);
		const [remoteTime, setRemoteTime] = useState<number>(0);
		const [stateTime, setStateTime] = useState<number>(0);

		const ready = stateTime > 0;
		const needGet = remoteTime >= stateTime;

		const sendState = useCallback((data) => {
			setState(data);
			setStateTime(Date.now());
			setPostMessage(true);
		}, []);

		// Reset state on key change
		useEffect(() => {
			// Trigger effect on key change
			noop(key);

			setState(defaultStateRef.current);
			setRemoteTime(0);
			setStateTime(0);
		}, [key]);

		const channel = useMemo(() => new BroadcastChannel(channelId), [channelId]);

		useEffect(() => {
			setState(defaultStateRef.current);
			setStateTime(0);

			const handleMessage = ({ data }: MessageEvent<number>) => {
				setRemoteTime((t) => Math.max(t, data));
			};

			channel.addEventListener('message', handleMessage);

			return () => {
				channel.removeEventListener('message', handleMessage);
				channel.close();
			};
		}, [channel]);

		// Post to channel
		useEffect(() => {
			if (!postMessage) return noop;

			let cancel;
			(async () => {
				await delay(10);
				if (cancel) return;

				await store.setItem(key, state);
				if (cancel) return;

				channel.postMessage(stateTime);
				setPostMessage(false);
			})();

			return () => {
				cancel = true;
			};
		}, [channel, key, state, stateTime, postMessage]);

		// Get state from storage
		useEffect(() => {
			// Trigger effect on stateTime change
			noop(stateTime);

			if (!needGet) return noop;

			let cancel;
			(async () => {
				const now = Date.now();

				await delay(10);
				if (cancel) return;

				const [data, exists] = await Promise.all([
					store.getItem(key),
					store.keys().then((keys) => keys.some((k) => k === key)),
				]);
				if (cancel) return;

				if (exists) {
					setState(data as T);
				}
				setStateTime(now);
			})();

			return () => {
				cancel = true;
			};
		}, [key, stateTime, needGet]);

		return [state, sendState, ready];
	};

	/**
	 * Use sync reducer
	 * @param key
	 * @param reducer
	 * @param defaultState
	 */
	const useSyncReducer: UseSyncReducerT = <T = unknown, A = unknown>(
		key: string,
		reducer: SyncReducerT<T, A>,
		defaultState: T
	) => {
		const [state, setState, ready] = useSyncState<T>(key, defaultState);

		const sendDispatch = useCallback(
			(action) => {
				setState((s: T) => reducer(s, action));
			},
			[reducer, setState]
		);

		return [state, sendDispatch, ready];
	};

	return {
		useSyncState,
		useSyncReducer,
	};
}

export default createSyncHooks;

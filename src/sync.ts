/*!
 * React Sync Hooks <https://github.com/smujmaiku/some-sync-hooks>
 * Copyright(c) 2020 Michael Szmadzinski
 * MIT Licensed
 */

import {
	useEffect, useState, useCallback, useMemo, Dispatch, SetStateAction
} from 'react';
import * as localforage from 'localforage';

const PACKAGE_NAME = 'someSyncHooks';

const store = localforage.createInstance({ name: PACKAGE_NAME });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Use sync state
 * @param key 
 * @param defaultState 
 */
export function useSyncState<T = unknown>(key: string, defaultState: T): [T, Dispatch<SetStateAction<T>>, boolean] {
	const channelId = `${PACKAGE_NAME}:${key}`;

	const [state, setState] = useState<T>(defaultState);
	const [postMessage, setPostMessage] = useState<boolean>(false);
	const [remoteTime, setRemoteTime] = useState<number>(0);
	const [stateTime, setStateTime] = useState<number>(0);

	// Reset state on key change
	useEffect(() => {
		setState(defaultState);
		setRemoteTime(0);
		setStateTime(0);
		// Ignore defaultState changes like useState unless the key changes too
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key])

	const ready = stateTime > 0;
	const needGet = remoteTime >= stateTime;

	const channel = useMemo(() => new BroadcastChannel(channelId), [channelId]);

	useEffect(() => {
		setState(defaultState);
		setStateTime(0);

		const handleMessage = ({ data }: MessageEvent<number>) => {
			setRemoteTime((t) => Math.max(t, data));
		};

		channel.addEventListener('message', handleMessage);

		return () => {
			channel.removeEventListener('message', handleMessage);
			channel.close();
		};
		// Ignore defaultState changes like useState unless the channel changes too
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channel]);

	const sendState = useCallback((data) => {
		setState(data);
		setStateTime(Date.now());
		setPostMessage(true);
	}, []);

	useEffect(() => {
		if (!postMessage) return () => { return; };

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

	useEffect(() => {
		if (!needGet) return () => { return; };

		// Keep this to trigger start over on stateTime change
		if (stateTime < 0) return () => { return; };

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
}

/**
 * Use sync reducer
 * @param key 
 * @param reducer 
 * @param defaultState 
 */
export function useSyncReducer<T = unknown, A = unknown>(key: string, reducer: (state: T, action: A) => T, defaultState: T): [T, (action: A) => void, boolean] {
	const [state, setState, ready] = useSyncState<T>(key, defaultState);

	const sendDispatch = useCallback((action) => {
		setState((s) => reducer(s, action));
	}, [reducer, setState]);

	return [state, sendDispatch, ready];
}

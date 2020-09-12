/*!
 * React Sync Hooks <https://github.com/smujmaiku/some-sync-hooks>
 * Copyright(c) 2020 Michael Szmadzinski
 * MIT Licensed
 */

import {
	useEffect, useState, useCallback, useMemo,
} from 'react';
import localforage from 'localforage';

const PACKAGE_NAME = 'someSyncHooks';

const store = localforage.createInstance({ name: PACKAGE_NAME });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSyncState(key, defaultState) {
	const channelId = `${PACKAGE_NAME}:${key}`;

	const [state, setState] = useState(defaultState);
	const [postMessage, setPostMessage] = useState(false);
	const [remoteTime, setRemoteTime] = useState(0);
	const [stateTime, setStateTime] = useState(0);

	const ready = stateTime > 0;
	const needGet = remoteTime >= stateTime;

	const channel = useMemo(() => new BroadcastChannel(channelId), [channelId]);

	useEffect(() => {
		channel.onmessage = ({ data }) => {
			setRemoteTime((t) => Math.max(t, data));
		};

		return () => {
			channel.onmessage = undefined;
			channel.close();
		};
	}, [channel]);

	const sendState = useCallback((data) => {
		setState(data);
		setStateTime(Date.now());
		setPostMessage(true);
	}, []);

	useEffect(() => {
		if (!postMessage) return () => {};

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
		if (!needGet) return () => {};

		// Keep this to trigger start over on stateTime change
		if (stateTime < 0) return () => {};

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
				setState(data);
			}
			setStateTime(now);
		})();

		return () => {
			cancel = true;
		};
	}, [key, stateTime, needGet]);

	return [state, sendState, ready];
}

export function useSyncReducer(key, reducer, defaultState) {
	const [state, setState, ready] = useSyncState(key, defaultState);

	const sendDispatch = useCallback((action) => {
		setState((s) => reducer(s, action));
	}, [reducer, setState]);

	return [state, sendDispatch, ready];
}

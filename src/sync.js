/*!
 * React Sync Hooks <https://github.com/smujmaiku/some-sync-hooks>
 * Copyright(c) 2020 Michael Szmadzinski
 * MIT Licensed
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import localforage from 'localforage';

const PACKAGE_NAME = 'someSyncHooks';

const store = localforage.createInstance({ name: PACKAGE_NAME });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useSyncState(key, defaultState) {
	const channelId = `${PACKAGE_NAME}:${key}`;

	const [state, setState] = useState(defaultState);
	const [post, setPost] = useState(false);
	const [time, setTime] = useState(0);
	const [ready, setReady] = useState(false);

	const channel = useMemo(() => {
		const ch = new BroadcastChannel(channelId);

		ch.onmessage = ({ data }) => {
			setTime(t => Math.max(t, data));
		};

		return ch;
	}, [channelId]);

	useEffect(() => () => {
		channel.onmessage = undefined;
		channel.close();
	}, [channel]);

	const sendState = useCallback((data) => {
		setState(data);
		setTime(Date.now());
		setPost(true);
	}, [channel]);

	useEffect(() => {
		if (!post) return;
		let cancel;

		(async () => {
			await delay(10);
			if (cancel) return;
			await store.setItem(key, state);
			channel.postMessage(time);
			setPost(false);
		})();

		return () => {
			cancel = true;
		};
	}, [state, time, post]);

	useEffect(() => {
		if (time < 0) return;
		let cancel;

		(async () => {
			await delay(10);
			if (cancel) return;
			const [data, exists] = await Promise.all([
				store.getItem(key),
				store.keys().then(keys => keys.some(k => k === key)),
			]);
			if (cancel) return;
			if (exists) {
				setState(data);
			}
			setReady(true);
		})();

		return () => {
			cancel = true;
		};
	}, [key, time]);

	return [state, sendState, ready];
}

export function useSyncReducer(key, reducer, defaultState) {
	const [state, setState, ready] = useSyncState(key, defaultState);

	const sendDispatch = useCallback((action) => {
		setState(s => reducer(s, action));
	}, [reducer, setState]);

	return [state, sendDispatch, ready];
}

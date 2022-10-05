# Local Sync Hooks

Do you need some simple storage for your React states and reducers?
Does your React app live in two or more tabs at once?
Do you like `BroadcastChannel` and `IndexedDB`?

Local sync hooks can replicate your state across your many browser tabs!

## Installation

`npm i local-sync-hooks`

## Methods

### useSyncState

Like `useState` but it will restore state on reload and share between tabs.

```js
const [state, setState, ready] = useSyncState('key', { some: 'state' });
```

### useSyncReducer

Like `useReducer` but it will restore state on reload and share between tabs.

```js
const [state, dispatch, ready] = useSyncReducer('key', reducer, { some: 'state' });
```

### createSyncHooks

Creates your own custom named sync hooks.

```js
import createSyncHooks from 'local-sync-hooks/create';

const { useSyncState, useSyncReducer} = createSyncHooks('someProject');
```

or with your own localforage store

```js
import createSyncHooks from 'local-sync-hooks/create';

const store = localforage.createInstance({ name });
const { useSyncState, useSyncReducer} = createSyncHooks('someProject', store);
```

## License

Copyright (c) 2022, Michael Szmadzinski. (MIT License)

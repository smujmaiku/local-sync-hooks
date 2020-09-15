# Some Sync Hooks

Do you need some simple storage for your React states and reducers?
Does your React app live in two or more tabs at once?
Do you like `BroadcastChannel` and `IndexedDB`?

Some sync hooks can replicate your state across your many browser tabs!

## Installation

`npm i some-sync-hooks`

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

## License

Copyright (c) 2020, Michael Szmadzinski. (MIT License)

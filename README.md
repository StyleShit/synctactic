# Synctactic

Lightweight one-way background syncing library.

## Installation

```bash
npm i synctactic
```

## Features

- Sync data from any store to any persistent storage (database, local storage, etc.)
- Sync only when data changes
- Force manual sync
- Disable previous syncs when a new one is triggered
- Notify when closing the tab and there is a pending sync in the background

## Usage

```typescript
import { sync } from 'synctactic';
import { store } from './store';
import { sendData } from './api';

const { forceSync, unSync } = sync({
  // Subscribe to store changes.
  subscribe: store.subscribe,

  // Sync on store change. Passing an `abortSignal` allows to cancel the sync.
  syncFn: async (abortSignal) => {
    await sendData(store.getState(), abortSignal);
  },

  options: {
    // Debounce time between syncs. Optional. Defaults to `0`.
    wait: 1000,

    // Notify for pending sync on tab close. Optional. Defaults to `false`.
    notifyOnLeave: true,
  },
});

// Triggers a sync.
store.dispatch({ type: 'change' });

// Force a sync manually.
forceSync();

// Stop syncing and cleanup.
unSync();
```

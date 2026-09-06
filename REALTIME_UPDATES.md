# Real-Time Updates Feature

## Overview
The client dashboard now includes automatic polling and manual refresh capabilities to keep data up-to-date without requiring page refreshes.

---

## Features Implemented

### 1. **Automatic Polling**

All data in the client dashboard now auto-refreshes at regular intervals:

| Component | Polling Interval | What Updates |
|-----------|-----------------|--------------|
| **Tasks** | 30 seconds | Task statuses, assignments, priorities, due dates |
| **Comments** | 15 seconds | New comments and attachments in task chat |
| **Projects** | 60 seconds | Project list, project statuses, pause reasons |

### 2. **Manual Refresh Button**

- **Location**: Top-left of the task board, next to "Last Updated" indicator
- **Visual Feedback**: Spinning icon while refreshing
- **Behavior**: Immediately fetches latest data from ClickUp

### 3. **Last Updated Indicator**

Shows when data was last refreshed:
- "just now" - Updated within the last minute
- "5m ago" - Updated 5 minutes ago
- "2h ago" - Updated 2 hours ago
- Falls back to timestamp for older updates

---

## Technical Implementation

### Polling Hook Updates

**File:** `src/hooks/useClickUp.js`

#### `useClickUpTasks` Hook
```javascript
useClickUpTasks(listId, options = {})

Options:
- pollingInterval: number (default: 30000ms)
- enablePolling: boolean (default: true)

Returns:
- tasks: array
- loading: boolean
- error: string | null
- lastUpdated: Date
- refresh: function
```

#### `useClickUpComments` Hook
```javascript
useClickUpComments(taskId, options = {})

Options:
- pollingInterval: number (default: 15000ms)
- enablePolling: boolean (default: true)

Returns:
- comments: array
- loading: boolean
- error: string | null
- lastUpdated: Date
- refresh: function
- postComment: function
- postAttachment: function
```

### Silent Refresh

Polling uses "silent refresh" mode:
- **Initial load**: Shows loading spinner
- **Background updates**: No loading spinner, seamless updates
- **Manual refresh**: Shows loading spinner for user feedback

---

## User Experience

### Before (Without Real-Time Updates)
❌ Customer makes changes in ClickUp  
❌ Client refreshes page manually  
❌ Still sees old data (cache)  
❌ Refresh again... finally sees new data  

### After (With Real-Time Updates)
✅ Customer makes changes in ClickUp  
✅ Client dashboard auto-updates within 30 seconds  
✅ Or clicks "Refresh" button for immediate update  
✅ Sees new data without page reload  

---

## Configuration

### Adjusting Polling Intervals

Edit `src/hooks/useClickUp.js` to change default intervals:

```javascript
// Make updates faster (more API calls)
export function useClickUpTasks(listId, options = {}) {
  const { pollingInterval = 10000, ... } // 10 seconds instead of 30
  ...
}

// Make updates slower (fewer API calls)
export function useClickUpTasks(listId, options = {}) {
  const { pollingInterval = 60000, ... } // 60 seconds instead of 30
  ...
}
```

### Disabling Polling

Pass `enablePolling: false` when using the hook:

```javascript
const { tasks } = useClickUpTasks(listId, { enablePolling: false })
```

---

## Performance Considerations

### API Rate Limits

**ClickUp API Limits:**
- Free plan: 100 requests/minute
- Unlimited plan: 10,000 requests/minute

**Current Usage (per client):**
- Tasks: 2 requests/minute (30s interval)
- Comments: 4 requests/minute when chat is open (15s interval)
- Projects: 1 request/minute (60s interval)

**Total**: ~7 requests/minute per active client

### Optimization Strategies

1. **Conditional Polling**
   - Tasks only poll on active project view
   - Comments only poll when task chat is open
   - Projects poll in background

2. **Silent Updates**
   - No loading spinners on background updates
   - Smooth UI transitions

3. **Smart Intervals**
   - Tasks: 30s (moderate frequency)
   - Comments: 15s (high frequency for chat-like experience)
   - Projects: 60s (low frequency, rarely changes)

---

## Testing

### Manual Testing Checklist

- [ ] Tasks auto-update after 30 seconds
- [ ] Manual refresh button works
- [ ] "Last updated" shows correct time
- [ ] Comments auto-update in task chat
- [ ] No loading spinners on background updates
- [ ] Refresh button shows spinning icon
- [ ] Project list updates after 60 seconds
- [ ] Polling stops when component unmounts
- [ ] Polling stops on archived projects

### Test Scenario

1. Open client dashboard
2. Make a change in ClickUp (update task status)
3. Wait 30 seconds
4. Verify change appears in dashboard
5. Click "Refresh" button
6. Verify immediate update

---

## Browser Compatibility

✅ Tested on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

Uses standard Web APIs:
- `setInterval` / `clearInterval`
- `fetch` API
- React hooks (`useEffect`, `useState`)

---

## Future Enhancements

### Potential Improvements

1. **WebSocket Support**
   - Real-time updates via WebSocket instead of polling
   - Zero latency for updates
   - Requires WebSocket server

2. **Optimistic Updates**
   - Show changes immediately before server confirmation
   - Better perceived performance

3. **Smart Polling**
   - Increase polling frequency when user is active
   - Decrease when idle (use Page Visibility API)

4. **Offline Support**
   - Cache data locally
   - Queue actions for when connection returns
   - Service Worker integration

5. **Push Notifications**
   - Browser notifications for important updates
   - Requires user permission

---

## Troubleshooting

### Issue: Tasks not updating

**Possible causes:**
1. Polling disabled
2. Network error
3. ClickUp API rate limit reached
4. JWT token expired

**Solution:**
- Check browser console for errors
- Verify network tab shows API calls
- Click manual refresh button
- Re-login if token expired

### Issue: High API usage

**Solution:**
- Increase polling intervals
- Disable polling for non-critical components
- Implement smart polling (only when active)

### Issue: Refresh button not working

**Solution:**
- Check `onRefresh` prop is passed correctly
- Verify `refresh` function exists in hook return
- Check browser console for errors

---

## Migration Notes

### Changes from Previous Version

**Breaking Changes:**
- `useClickUpTasks` now returns `lastUpdated` and `refresh`
- `useClickUpComments` now returns `lastUpdated`

**Required Updates:**
- Pass `onRefresh` prop to `TaskBoard` component
- Pass `lastUpdated` prop to `TaskBoard` component

**Backwards Compatible:**
- Existing code works without modifications
- New props are optional

---

## Summary

✅ **Implemented:**
- Automatic polling for tasks (30s)
- Automatic polling for comments (15s)
- Automatic polling for projects (60s)
- Manual refresh button with visual feedback
- Last updated time indicator
- Silent background updates

✅ **Benefits:**
- No more manual page refreshes
- Near real-time data updates
- Better user experience
- Smooth, non-disruptive updates

✅ **Performance:**
- ~7 API requests/minute per active client
- Well within ClickUp API limits
- Optimized polling intervals
- Cleanup on component unmount

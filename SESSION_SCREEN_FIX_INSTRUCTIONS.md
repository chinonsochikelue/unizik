# SessionScreen Fix Instructions

## Issue
The session screen always shows "Start Session" instead of detecting active sessions.

## Manual Fix Steps

### 1. Update the `loadData` function in SessionScreen.jsx

Replace the session detection logic (around line 33) with this improved version:

```javascript
// Check for active session - try multiple approaches
console.log("2. Checking for active session...")

let session = null

// Approach 1: Check specific class active session
try {
  console.log("2a. Trying /sessions/class/${classId}/active...")
  const sessionResponse = await apiService.get(`/sessions/class/${classId}/active`)
  console.log("✅ Class active session response:", sessionResponse.data)
  session = sessionResponse.data.session
} catch (error) {
  console.log("❌ Class active session failed:", error.response?.data)
  
  // Approach 2: Get all active sessions and find one for this class
  try {
    console.log("2b. Trying /sessions/active (all active sessions)...")
    const allActiveResponse = await apiService.get('/sessions/active')
    console.log("✅ All active sessions response:", allActiveResponse.data)
    
    const allActiveSessions = allActiveResponse.data
    if (Array.isArray(allActiveSessions)) {
      session = allActiveSessions.find(s => s.class?.id === classId)
      console.log(session ? "✅ Found matching session in active list" : "❌ No matching session in active list")
    }
  } catch (allActiveError) {
    console.log("❌ All active sessions failed:", allActiveError.response?.data)
  }
}

setActiveSession(session)
```

### 2. Improve the `startSession` function

Replace the existing startSession function with better error handling:

```javascript
const startSession = async () => {
  console.log("🚀 Starting session for class:", classId)
  
  try {
    const response = await apiService.post("/sessions/start", { classId })
    console.log("✅ Session started:", response.data)
    
    const newSession = response.data.session
    setActiveSession(newSession)
    
    Alert.alert(
      "Session Started",
      `Session Code: ${newSession.code}\nStudents can now mark their attendance.`,
      [
        {
          text: "OK",
          onPress: () => {
            // Refresh data to load attendance
            onRefresh()
          },
        },
      ]
    )
  } catch (error) {
    console.error("❌ Error starting session:", error)
    const errorMsg = error.response?.data?.error || error.message
    
    if (errorMsg.includes("already an active session")) {
      Alert.alert(
        "Session Already Active", 
        "There is already an active session for this class. Would you like to refresh to see it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Refresh", onPress: onRefresh }
        ]
      )
    } else {
      Alert.alert("Error", `Failed to start session: ${errorMsg}`)
    }
  }
}
```

### 3. Add Debug Information

Add this state and display for debugging:

```javascript
// Add to state declarations
const [debugInfo, setDebugInfo] = useState("")

// Add debug display in the header (in development mode)
{__DEV__ && (
  <Text style={{ fontSize: 12, color: "#666", marginTop: 5, fontStyle: "italic" }}>
    Debug: {debugInfo}
  </Text>
)}
```

### 4. Update error messages throughout loadData

Add setDebugInfo calls to track what's happening:

```javascript
setDebugInfo(session ? `Active session found: ${session.code}` : "No active session for this class")
```

## Testing Steps

1. **Check Console Logs**: Look for the console.log messages to see what's happening
2. **Check Debug Info**: The debug text will show the current status
3. **Test Both Scenarios**: 
   - Try starting a session when none exists
   - Try refreshing when a session already exists

## Common Issues & Solutions

### Issue: "Access denied" error
**Solution**: Ensure the teacher owns the class

### Issue: "Class not found" error  
**Solution**: Verify the classId parameter is correct

### Issue: Sessions exist but not showing
**Solution**: Check if there's a many-to-many relationship issue (run the database debug scripts)

### Issue: 400 error when starting session
**Solution**: Check if there's already an active session and handle it properly

## Expected Behavior After Fix

1. **Loading**: Shows "Loading session data..." with debug info
2. **No Active Session**: Shows "Start Session" button
3. **Active Session**: Shows session code, stats, and "Stop" button
4. **Error Handling**: Proper alerts and fallback logic
5. **Refresh**: Pull-to-refresh updates session status

## Verification

The fix is working when:
- ✅ Console shows detailed session detection logs
- ✅ Debug info shows current session status
- ✅ Active sessions are detected and displayed
- ✅ "Start Session" only shows when no active session exists
- ✅ Error messages are helpful and actionable
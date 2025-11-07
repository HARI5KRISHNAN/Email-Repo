# Testing Guide - Video Calling & Draft Features

This guide will help you pull the latest changes and test all new features locally.

## Step 1: Pull Latest Code

```bash
# Make sure you're on the feature branch
git checkout claude/debug-mail-inbox-sync-011CUpUjKnnke71Qo5WpVZVQ

# Pull latest changes
git pull origin claude/debug-mail-inbox-sync-011CUpUjKnnke71Qo5WpVZVQ
```

## Step 2: Install Dependencies (if needed)

```bash
# Install/update npm packages
npm install
```

## Step 3: Start Docker Containers

```bash
# Start all Docker containers (PostgreSQL, Keycloak, Backend, Mail servers)
docker-compose up -d

# Verify containers are running
docker-compose ps

# Check backend logs to ensure it's ready
docker-compose logs -f backend
```

Wait for the backend to show: `✅ All migrations completed` and `Server running on port 8081`

## Step 4: Start Frontend

```bash
# In a new terminal, start the React development server
npm run dev
```

The frontend should start on **http://localhost:3006**

## Step 5: Test the Features

### A. Test Draft Functionality

#### Test 1: Compose Draft
1. Click **"Compose"** button
2. Add some text (To, Subject, Body)
3. Click the **X** button to close
4. Dialog appears: **"Save draft?"**
5. Click **"Save Draft"**
6. Click **"Draft"** folder in sidebar
7. ✅ Your draft should appear in the list
8. Click the draft to open and edit it
9. ✅ Compose window opens with your saved content

#### Test 2: Reply Draft
1. Open any email
2. Click **"Reply"** button
3. Type some reply text
4. Click **"Discard"** button
5. Dialog appears: **"Save draft?"**
6. Click **"Save Draft"**
7. Go to **"Draft"** folder
8. ✅ Your reply draft should be saved

#### Test 3: Forward Draft
1. Open any email
2. Click **"Forward"** button
3. Add recipient and content
4. Click **"Discard"** button
5. Click **"Save Draft"**
6. ✅ Draft saved in Draft folder

#### Test 4: Edit & Send Draft
1. Click on any saved draft
2. Edit the content
3. Click **"Send"**
4. ✅ Email sends and draft is automatically deleted

---

### B. Test Video Calling

#### Test 1: Instant Video Call
1. Click **"Schedule Meeting"** in sidebar
2. Click **"Start & Join Now"** (green button on right)
3. ✅ Video call launches immediately
4. ✅ Browser asks for camera/microphone permissions - **Allow**
5. ✅ You should see yourself in the video
6. ✅ Full Jitsi interface with controls at bottom

**Video Call Features to Test:**
- 🎤 Toggle microphone on/off
- 📹 Toggle camera on/off
- 🖥️ Share screen button
- 💬 Chat button
- 👥 Participants list
- ⚙️ Settings (change camera/mic)
- 📍 Tile view toggle

#### Test 2: Schedule Meeting with Video Link
1. Go to **"Schedule Meeting"**
2. Fill in meeting details:
   - Title: "Team Standup"
   - Date/Time: Tomorrow
   - Add attendees
3. Click **"Generate Meeting Link"** button
4. ✅ Meeting link appears
5. Click **"Schedule Meeting"** button
6. ✅ Success message appears

#### Test 3: Join from Calendar
1. Click **"Calendar"** in sidebar
2. Find your scheduled meeting
3. Click on the meeting
4. ✅ Meeting details popup appears
5. ✅ "Join Meeting" button visible (blue button)
6. Click **"Join Meeting"**
7. ✅ Video call launches

#### Test 4: Multi-User Testing (Optional)
To test with multiple participants:

1. **Start a meeting** using "Start & Join Now"
2. **Copy the room name** from the top of video call
3. **Open incognito window** or another browser
4. **Repeat steps** to start same meeting using the same room name
5. ✅ Both participants should see each other

---

### C. Test Meeting Schedule UI

#### Test 1: Time Dropdowns
1. Go to **"Schedule Meeting"**
2. Click start time **Hour** dropdown
3. ✅ Shows 00-23 hours
4. Click start time **Minute** dropdown
5. ✅ Shows 00, 05, 10, 15... (5-minute intervals)

#### Test 2: Prepare Instant Meeting
1. Click **"Prepare Instant Meeting"** (blue button)
2. ✅ Form auto-fills with current time
3. ✅ Title set to "Instant Meeting"
4. ✅ Meeting link generated
5. ✅ End time set to 1 hour later

---

## Troubleshooting

### Issue: Backend not starting
```bash
# Rebuild backend container
docker-compose down backend
docker-compose build --no-cache backend
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

### Issue: Database migrations not running
```bash
# Run migrations manually
npm run migrate
```

### Issue: Draft GET endpoint 400 error
```bash
# Restart backend to load latest code
docker-compose restart backend
```

### Issue: Video call not loading
- **Check browser console** for errors (F12 → Console)
- **Allow camera/microphone permissions** when prompted
- **Check firewall** - Jitsi needs internet access to meet.jit.si
- **Try different browser** - Chrome/Edge work best

### Issue: Port 3006 already in use
```bash
# Kill process on port 3006
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3006).OwningProcess | Stop-Process

# Mac/Linux:
lsof -ti:3006 | xargs kill -9

# Or change port in vite.config.ts
```

### Issue: Port 8081 already in use
```bash
# Kill process on port 8081 or restart backend container
docker-compose restart backend
```

---

## Expected Results Summary

✅ **Draft Compose** - Save, view, edit, and send drafts from compose window
✅ **Draft Reply** - Save reply drafts with full content
✅ **Draft Forward** - Save forward drafts with full content
✅ **Edit Drafts** - Click draft to open in compose and continue editing

✅ **Instant Video Call** - Start & join video call immediately
✅ **Schedule with Video** - Create meetings with video links
✅ **Join from Calendar** - Click meeting → Join Meeting button works
✅ **Full Video Features** - Camera, mic, screen share, chat all working

✅ **Meeting UI** - Time dropdowns with 5-minute intervals
✅ **Meeting Details Popup** - Click meeting shows full details
✅ **Sent Items Customization** - No unread icon/count on sent folder

---

## Browser Requirements

- **Chrome/Edge**: ✅ Recommended (best Jitsi support)
- **Firefox**: ✅ Works well
- **Safari**: ⚠️ May have limited features

---

## Need Help?

If you encounter issues:
1. Check Docker containers are running: `docker-compose ps`
2. Check backend logs: `docker-compose logs -f backend`
3. Check frontend console: F12 → Console tab
4. Ensure all ports are free: 3006, 8081, 5432, 8080

Happy testing! 🚀

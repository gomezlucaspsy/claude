# PersonaForge — Unity Native App

Replika-level AI companion with a real-time 3D avatar, built in Unity for mobile and desktop.

---

## Project Structure

```
unity-app/
  Assets/
    Scripts/
      Core/
        AppManager.cs           — Main controller, wires everything together
      Network/
        AnthropicClient.cs      — Streaming API client for Claude
      Avatar/
        AvatarController.cs     — Idle animation, blinking, breathing, head look, blend shapes
        LipSyncController.cs    — Text-driven lip sync (token → mouth shape)
        ExpressionController.cs — Emotion detection & facial expression presets
      Scene/
        StudioSetup.cs          — Camera rig + studio lighting (auto-generated)
        AmbientParticles.cs     — Floating particle effect
      UI/
        ChatUI.cs               — Chat messages, streaming, suggested replies
        CharacterSelectUI.cs    — Character selection grid
```

---

## Setup Instructions

### 1. Create Unity Project

1. Open **Unity Hub** → **New Project**
2. Select **3D (URP)** template — Universal Render Pipeline gives you good mobile + desktop quality
3. Name it `PersonaForge` and create

### 2. Import Scripts

1. Copy the entire `Assets/Scripts/` folder from this directory into your Unity project's `Assets/` folder
2. Unity will auto-compile — fix any missing references (see dependencies below)

### 3. Install Dependencies

Open **Window → Package Manager** and install:

- **TextMeshPro** (usually pre-installed) — `com.unity.textmeshpro`
- **Input System** (optional) — `com.unity.inputsystem`

### 4. Get a 3D Avatar Model

You need a humanoid model with **facial blend shapes**. Options:

#### Option A: Ready Player Me (Recommended for quick start)
1. Go to [readyplayer.me](https://readyplayer.me)
2. Create an avatar
3. Download as `.glb` / use their Unity SDK: [RPM Unity SDK](https://github.com/readyplayerme/rpm-unity-sdk-core)
4. Their models come with ARKit-compatible blend shapes

#### Option B: Mixamo + Blender
1. Go to [mixamo.com](https://www.mixamo.com)
2. Pick a character, download as FBX
3. Open in Blender, add blend shapes for: blink_L, blink_R, mouthOpen, jawOpen, smile, browUp, browDown
4. Export as FBX → import into Unity

#### Option C: VRoid Studio (Anime style)
1. Download [VRoid Studio](https://vroid.com/en/studio)
2. Create character → export as VRM
3. Use UniVRM to import into Unity

### 5. Scene Setup

1. **Create a new scene** called `Main`

2. **Add an empty GameObject** called `AppManager`
   - Add the `AppManager` component
   - Add the `AnthropicClient` component

3. **Import your avatar model** into the scene
   - Add `AvatarController` component to the avatar root
   - Add `LipSyncController` component
   - Add `ExpressionController` component
   - Assign the `SkinnedMeshRenderer` (face) to each component
   - Assign head bone, eye bones in `AvatarController`

4. **Create an empty GameObject** called `SceneRig`
   - Add `StudioSetup` component (lights are auto-created)
   - Add `AmbientParticles` component
   - Assign your Main Camera
   - Set camera target to the avatar's head bone

5. **Create the Chat UI** (see UI Setup below)

6. **Wire up AppManager:**
   - Drag references for: apiClient, avatar, lipSync, expressions, chatUI, studioSetup, particles

### 6. UI Setup

Create a **Canvas** (Screen Space - Overlay) with this hierarchy:

```
Canvas
├── ChatPanel
│   ├── Header
│   │   ├── BackButton
│   │   ├── CharacterName (TextMeshPro)
│   │   ├── StatusDot (Image)
│   │   └── StatusText (TextMeshPro)
│   ├── ScrollView
│   │   └── Content (Vertical Layout Group)  ← messageContainer
│   ├── SuggestedReplies (Horizontal Layout Group)
│   └── InputArea
│       ├── InputField (TMP_InputField)
│       └── SendButton
├── ApiKeyPanel (starts active if no key saved)
│   ├── ApiKeyInput (TMP_InputField)
│   └── SaveButton
```

**Create Prefabs:**
- `AssistantMessagePrefab` — Panel with TextMeshPro, left-aligned, dark bg
- `UserMessagePrefab` — Panel with TextMeshPro, right-aligned, slightly lighter bg
- `TypingIndicatorPrefab` — 3 animated dots (use DOTween or simple animation)
- `SuggestedReplyPrefab` — Button with TextMeshPro label

### 7. Character Data

Create a `CharacterData` ScriptableObject or configure directly:

```
name: "Your Character"
greeting: "Hello! What brings you here today?"
systemPrompt: "You are [character description]..."
color: "#4a8fc0"
avatar: "🤖"
title: "AI Companion"
```

### 8. Animator Setup

1. Create an **Animator Controller** for your avatar
2. Add states: **Idle**, **Talking**, **Thinking**
3. Add parameters:
   - `State` (int): 0=Idle, 1=Thinking, 2=Speaking
   - `IsTalking` (bool)
   - `IsThinking` (bool)
4. Add transitions between states based on these parameters
5. Import idle/breathing animations from Mixamo if needed

---

## Build Targets

### Desktop (Windows/Mac/Linux)
- File → Build Settings → PC, Mac & Linux → Build
- No special configuration needed

### Android
1. File → Build Settings → Android
2. Switch Platform
3. Player Settings:
   - Min API Level: 24
   - Scripting Backend: IL2CPP
   - Target Architectures: ARM64
4. Build & Run

### iOS
1. File → Build Settings → iOS
2. Switch Platform
3. Player Settings:
   - Target minimum iOS version: 14.0
   - Scripting Backend: IL2CPP
4. Build → open Xcode project → deploy

---

## Architecture Overview

```
User types message
       │
       ▼
   ChatUI.OnSendMessage
       │
       ▼
   AppManager.HandleUserMessage()
       │
       ├── Avatar → Thinking state (head tilt, brow raise)
       ├── ChatUI → Show typing indicator
       │
       ▼
   AnthropicClient.SendMessage() [streaming]
       │
       ├── OnStreamStart → Avatar → Speaking state
       │                 → ChatUI → Begin streaming bubble
       │
       ├── OnTokenReceived → ChatUI.AppendStreamToken()
       │                   → LipSyncController.FeedToken()
       │                   → Avatar mouth animates
       │
       ├── OnStreamEnd → LipSync stops
       │               → Avatar → Idle
       │
       └── OnResponseComplete → ExpressionController.DetectEmotion()
                               → ChatUI.EndStreamingMessage()
                               → Parse suggested replies
```

---

## Production Enhancements

Once the core works, consider adding:

- **Audio TTS** — Use ElevenLabs/Azure TTS API, pipe audio to Unity's `AudioSource`, use Oculus LipSync for audio-driven visemes
- **Touch gestures** — Tap avatar to trigger reactions, pinch to zoom
- **Avatar customization** — ReadyPlayerMe's customization flow
- **Animations** — More idle variants, gesture animations from Mixamo
- **Post-processing** — URP bloom, depth of field, color grading for cinematic look
- **Haptic feedback** — Vibrate on mobile when avatar responds
- **Offline mode** — Cache conversation history with PlayerPrefs or SQLite
- **Push notifications** — "Your companion misses you" style re-engagement

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blend shapes not detected | Check names match ARKit or Mixamo conventions. Use the Inspector to manually set indices |
| Mouth not moving | Verify LipSyncController is on the same GameObject as AvatarController |
| API calls fail | Check API key in PlayerPrefs. Test with a REST client first |
| Lights too bright/dark | Adjust intensity values in StudioSetup inspector |
| Mobile performance | Lower particle count, reduce light count, use simpler shaders |

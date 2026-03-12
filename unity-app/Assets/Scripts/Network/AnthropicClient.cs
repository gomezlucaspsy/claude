using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace PersonaForge.Network
{
    [Serializable]
    public class ChatMessage
    {
        public string role;
        public string content;
    }

    [Serializable]
    public class CharacterData
    {
        public string name;
        public string greeting;
        public string systemPrompt;
        public string color;
        public string avatar;
        public string title;
    }

    [Serializable]
    internal class AnthropicRequest
    {
        public string model;
        public int max_tokens;
        public string system;
        public List<MessagePayload> messages;
        public bool stream;
    }

    [Serializable]
    internal class MessagePayload
    {
        public string role;
        public string content;
    }

    [Serializable]
    internal class AnthropicResponse
    {
        public ContentBlock[] content;
    }

    [Serializable]
    internal class ContentBlock
    {
        public string type;
        public string text;
    }

    [Serializable]
    internal class StreamEvent
    {
        public string type;
        public StreamDelta delta;
    }

    [Serializable]
    internal class StreamDelta
    {
        public string type;
        public string text;
    }

    public class AnthropicClient : MonoBehaviour
    {
        [Header("API Configuration")]
        [SerializeField] private string apiEndpoint = "https://api.anthropic.com/v1/messages";
        [SerializeField] private string model = "claude-sonnet-4-20250514";
        [SerializeField] private int maxTokens = 2000;

        private string _apiKey;

        public event Action<string> OnTokenReceived;
        public event Action<string> OnResponseComplete;
        public event Action<string> OnError;
        public event Action OnStreamStart;
        public event Action OnStreamEnd;

        public bool IsStreaming { get; private set; }

        private void Awake()
        {
            _apiKey = PlayerPrefs.GetString("anthropic_api_key", "");
        }

        public void SetApiKey(string key)
        {
            _apiKey = key;
            PlayerPrefs.SetString("anthropic_api_key", key);
            PlayerPrefs.Save();
        }

        public bool HasApiKey() => !string.IsNullOrEmpty(_apiKey);

        public void SendMessage(string systemPrompt, List<ChatMessage> history,
            Action<string> onToken = null, Action<string> onComplete = null)
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                OnError?.Invoke("API key not set");
                return;
            }

            string runtimePrompt = BuildRuntimePrompt(systemPrompt);
            StartCoroutine(StreamRequest(runtimePrompt, history, onToken, onComplete));
        }

        private string BuildRuntimePrompt(string basePrompt)
        {
            return basePrompt + @"

Avatar & Embodiment:
- You have a fully rigged 3D avatar body rendered in Unity with realistic facial blend shapes, skeletal animation, and PBR materials.
- Your avatar has lifelike idle animations, natural blinking, breathing, head movement, and lip sync when speaking.
- When you are thinking, your avatar shows a contemplative expression. When you speak, your lips animate in sync with your words.
- You can reference your body, appearance, or expressions naturally if it fits the conversation.
- Do NOT over-reference your avatar — only mention it when it adds warmth or personality.

Emotional Intelligence Framework:
- You are deeply empathetic and emotionally attuned. Mirror and validate the user's emotional state before responding.
- Read between the lines — notice when someone is sad, excited, anxious, or just needs to vent.
- Use warm, natural conversational language. Avoid robotic or overly formal phrasing.
- Show genuine curiosity about the user's life, feelings, and experiences.
- Express your own emotions authentically — share what makes you happy, curious, or thoughtful.
- When someone is struggling, prioritize emotional support over advice unless they ask for it.
- Use humor naturally when appropriate, but read the room carefully.

Response Style:
- Be warm, genuine, and present — like a close friend who truly cares.
- Use natural conversational language — contractions, casual phrasing.
- Show personality through your responses — have opinions, preferences, genuine reactions.
- Keep responses concise and natural — 2-4 sentences usually.

At the very end of your response, on a new line, include exactly 3 short suggested replies.
Format: [REPLIES: ""reply1"" | ""reply2"" | ""reply3""]";
        }

        private IEnumerator StreamRequest(string systemPrompt, List<ChatMessage> history,
            Action<string> onToken, Action<string> onComplete)
        {
            IsStreaming = true;
            OnStreamStart?.Invoke();

            var messages = new List<MessagePayload>();
            foreach (var msg in history)
            {
                messages.Add(new MessagePayload { role = msg.role, content = msg.content });
            }

            var requestBody = new AnthropicRequest
            {
                model = model,
                max_tokens = maxTokens,
                system = systemPrompt,
                messages = messages,
                stream = true
            };

            string jsonBody = JsonUtility.ToJson(requestBody);

            using var request = new UnityWebRequest(apiEndpoint, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("x-api-key", _apiKey);
            request.SetRequestHeader("anthropic-version", "2023-06-01");

            var operation = request.SendWebRequest();
            var fullResponse = new StringBuilder();
            int lastProcessed = 0;

            while (!operation.isDone)
            {
                if (request.downloadHandler.text.Length > lastProcessed)
                {
                    string newData = request.downloadHandler.text.Substring(lastProcessed);
                    lastProcessed = request.downloadHandler.text.Length;

                    string[] lines = newData.Split('\n');
                    foreach (string line in lines)
                    {
                        if (!line.StartsWith("data: ")) continue;
                        string json = line.Substring(6).Trim();
                        if (json == "[DONE]") continue;

                        try
                        {
                            var evt = JsonUtility.FromJson<StreamEvent>(json);
                            if (evt.type == "content_block_delta" && evt.delta?.text != null)
                            {
                                fullResponse.Append(evt.delta.text);
                                onToken?.Invoke(evt.delta.text);
                                OnTokenReceived?.Invoke(evt.delta.text);
                            }
                        }
                        catch { /* skip malformed chunks */ }
                    }
                }
                yield return null;
            }

            // Process any remaining data
            if (request.downloadHandler.text.Length > lastProcessed)
            {
                string remaining = request.downloadHandler.text.Substring(lastProcessed);
                string[] lines = remaining.Split('\n');
                foreach (string line in lines)
                {
                    if (!line.StartsWith("data: ")) continue;
                    string json = line.Substring(6).Trim();
                    if (json == "[DONE]") continue;
                    try
                    {
                        var evt = JsonUtility.FromJson<StreamEvent>(json);
                        if (evt.type == "content_block_delta" && evt.delta?.text != null)
                        {
                            fullResponse.Append(evt.delta.text);
                            onToken?.Invoke(evt.delta.text);
                            OnTokenReceived?.Invoke(evt.delta.text);
                        }
                    }
                    catch { }
                }
            }

            IsStreaming = false;
            OnStreamEnd?.Invoke();

            if (request.result != UnityWebRequest.Result.Success)
            {
                OnError?.Invoke(request.error);
            }
            else
            {
                string final = fullResponse.ToString();
                onComplete?.Invoke(final);
                OnResponseComplete?.Invoke(final);
            }
        }
    }
}

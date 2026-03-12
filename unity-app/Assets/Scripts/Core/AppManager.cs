using System.Collections.Generic;
using UnityEngine;
using PersonaForge.Avatar;
using PersonaForge.Network;
using PersonaForge.Scene;
using PersonaForge.UI;

namespace PersonaForge.Core
{
    /// <summary>
    /// Main application controller. Wires together all systems:
    /// API client, avatar, lip sync, expressions, UI, and scene.
    /// Attach to a root GameObject in your scene.
    /// </summary>
    public class AppManager : MonoBehaviour
    {
        [Header("Systems")]
        [SerializeField] private AnthropicClient apiClient;
        [SerializeField] private AvatarController avatar;
        [SerializeField] private LipSyncController lipSync;
        [SerializeField] private ExpressionController expressions;
        [SerializeField] private ChatUI chatUI;
        [SerializeField] private StudioSetup studioSetup;
        [SerializeField] private AmbientParticles particles;

        [Header("API Key UI (first run)")]
        [SerializeField] private GameObject apiKeyPanel;
        [SerializeField] private TMPro.TMP_InputField apiKeyInput;
        [SerializeField] private UnityEngine.UI.Button apiKeySaveButton;

        [Header("Character")]
        [SerializeField] private CharacterData defaultCharacter;

        private CharacterData _currentCharacter;
        private List<ChatMessage> _chatHistory = new();

        private void Start()
        {
            // Wire up events
            chatUI.OnSendMessage += HandleUserMessage;
            chatUI.OnBackPressed += HandleBack;
            apiClient.OnStreamStart += OnStreamStart;
            apiClient.OnStreamEnd += OnStreamEnd;
            apiClient.OnError += OnApiError;

            // API key setup
            if (!apiClient.HasApiKey())
            {
                ShowApiKeyPanel();
            }
            else
            {
                StartWithCharacter(defaultCharacter);
            }

            apiKeySaveButton?.onClick.AddListener(SaveApiKey);
        }

        private void ShowApiKeyPanel()
        {
            if (apiKeyPanel != null)
                apiKeyPanel.SetActive(true);
        }

        private void SaveApiKey()
        {
            string key = apiKeyInput?.text?.Trim();
            if (string.IsNullOrEmpty(key)) return;

            apiClient.SetApiKey(key);
            if (apiKeyPanel != null)
                apiKeyPanel.SetActive(false);

            StartWithCharacter(defaultCharacter);
        }

        public void StartWithCharacter(CharacterData character)
        {
            if (character == null) return;

            _currentCharacter = character;
            _chatHistory.Clear();

            // Parse color
            Color charColor;
            if (!ColorUtility.TryParseHtmlString(character.color, out charColor))
                charColor = new Color(0.29f, 0.56f, 0.75f);

            // Setup UI
            chatUI.ClearMessages();
            chatUI.SetCharacter(character.name, character.title, charColor);

            // Setup scene
            studioSetup?.SetAccentColor(charColor);
            particles?.SetColor(new Color(charColor.r, charColor.g, charColor.b, 0.4f));

            // Show greeting
            if (!string.IsNullOrEmpty(character.greeting))
            {
                chatUI.AddAssistantMessage(character.greeting);
                _chatHistory.Add(new ChatMessage
                {
                    role = "assistant",
                    content = character.greeting
                });
            }

            // Set avatar to idle
            avatar.SetState(AvatarController.AvatarState.Idle);
            expressions?.SetExpression("neutral");
        }

        private void HandleUserMessage(string text)
        {
            // Add to UI and history
            chatUI.AddUserMessage(text);
            _chatHistory.Add(new ChatMessage { role = "user", content = text });

            // Set avatar to thinking
            avatar.SetState(AvatarController.AvatarState.Thinking);
            expressions?.SetExpression("thinking");

            // Disable input while processing
            chatUI.SetInputInteractable(false);
            chatUI.ShowTypingIndicator();

            // Send to API with streaming
            apiClient.SendMessage(
                _currentCharacter.systemPrompt,
                _chatHistory,
                onToken: OnStreamToken,
                onComplete: OnResponseComplete
            );
        }

        private void OnStreamStart()
        {
            chatUI.HideTypingIndicator();
            chatUI.BeginStreamingMessage();
            avatar.SetState(AvatarController.AvatarState.Speaking);
        }

        private void OnStreamToken(string token)
        {
            chatUI.AppendStreamToken(token);
            lipSync?.FeedToken(token);
        }

        private void OnStreamEnd()
        {
            lipSync?.StopSpeaking();
            avatar.SetState(AvatarController.AvatarState.Idle);
            chatUI.SetInputInteractable(true);
        }

        private void OnResponseComplete(string fullResponse)
        {
            chatUI.EndStreamingMessage();

            _chatHistory.Add(new ChatMessage
            {
                role = "assistant",
                content = fullResponse
            });

            // Detect emotion from full response
            expressions?.DetectEmotionFromText(fullResponse);

            // After a delay, return to neutral
            Invoke(nameof(ResetToNeutral), 3f);
        }

        private void ResetToNeutral()
        {
            if (avatar.CurrentState == AvatarController.AvatarState.Idle)
                expressions?.SetExpression("neutral");
        }

        private void OnApiError(string error)
        {
            Debug.LogError($"API Error: {error}");
            chatUI.HideTypingIndicator();
            chatUI.AddAssistantMessage("Connection lost. Please try again.");
            chatUI.SetInputInteractable(true);
            avatar.SetState(AvatarController.AvatarState.Idle);
            lipSync?.StopSpeaking();
        }

        private void HandleBack()
        {
            _chatHistory.Clear();
            chatUI.ClearMessages();
            avatar.SetState(AvatarController.AvatarState.Idle);
            expressions?.SetExpression("neutral");
            lipSync?.StopSpeaking();
        }
    }
}

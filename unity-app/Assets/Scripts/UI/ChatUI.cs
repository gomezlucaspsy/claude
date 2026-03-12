using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace PersonaForge.UI
{
    /// <summary>
    /// Manages the chat UI — message list, input field, typing indicator, suggested replies.
    /// Create a Canvas with this script and assign the references in the Inspector.
    /// </summary>
    public class ChatUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private ScrollRect scrollRect;
        [SerializeField] private RectTransform messageContainer;
        [SerializeField] private TMP_InputField inputField;
        [SerializeField] private Button sendButton;
        [SerializeField] private TextMeshProUGUI characterNameText;
        [SerializeField] private TextMeshProUGUI statusText;
        [SerializeField] private Button backButton;
        [SerializeField] private Image statusDot;

        [Header("Prefabs")]
        [SerializeField] private GameObject assistantMessagePrefab;
        [SerializeField] private GameObject userMessagePrefab;
        [SerializeField] private GameObject typingIndicatorPrefab;
        [SerializeField] private GameObject suggestedReplyPrefab;

        [Header("Suggested Replies")]
        [SerializeField] private RectTransform suggestedRepliesContainer;

        [Header("Theming")]
        [SerializeField] private Color defaultAccentColor = new Color(0.29f, 0.56f, 0.75f);

        // Events
        public event System.Action<string> OnSendMessage;
        public event System.Action OnBackPressed;
        public event System.Action<string> OnSuggestedReplySelected;

        private Color _accentColor;
        private GameObject _currentTypingIndicator;
        private TextMeshProUGUI _streamingText;
        private StringBuilder _streamingBuilder = new();
        private List<GameObject> _suggestedReplyButtons = new();

        private void Start()
        {
            _accentColor = defaultAccentColor;

            sendButton.onClick.AddListener(HandleSend);
            backButton?.onClick.AddListener(() => OnBackPressed?.Invoke());

            inputField.onSubmit.AddListener(_ => HandleSend());
        }

        public void SetCharacter(string name, string title, Color color)
        {
            _accentColor = color;
            if (characterNameText != null)
                characterNameText.text = name;
            if (statusDot != null)
                statusDot.color = color;
            if (statusText != null)
                statusText.text = "CONNECTION ACTIVE";

            // Apply accent color to send button
            var sendColors = sendButton.colors;
            sendColors.normalColor = color;
            sendButton.colors = sendColors;
        }

        public void AddAssistantMessage(string text)
        {
            var go = Instantiate(assistantMessagePrefab, messageContainer);
            var tmp = go.GetComponentInChildren<TextMeshProUGUI>();
            if (tmp != null)
            {
                string cleaned = StripSuggestedReplies(text, out var replies);
                tmp.text = cleaned;
                ShowSuggestedReplies(replies);
            }
            ScrollToBottom();
        }

        public void AddUserMessage(string text)
        {
            ClearSuggestedReplies();
            var go = Instantiate(userMessagePrefab, messageContainer);
            var tmp = go.GetComponentInChildren<TextMeshProUGUI>();
            if (tmp != null)
                tmp.text = text;
            ScrollToBottom();
        }

        public void ShowTypingIndicator()
        {
            if (_currentTypingIndicator != null) return;
            _currentTypingIndicator = Instantiate(typingIndicatorPrefab, messageContainer);
            ScrollToBottom();
        }

        public void HideTypingIndicator()
        {
            if (_currentTypingIndicator != null)
            {
                Destroy(_currentTypingIndicator);
                _currentTypingIndicator = null;
            }
        }

        /// <summary>
        /// Start showing a streaming message. Returns a reference to append tokens to.
        /// </summary>
        public void BeginStreamingMessage()
        {
            HideTypingIndicator();
            ClearSuggestedReplies();
            var go = Instantiate(assistantMessagePrefab, messageContainer);
            _streamingText = go.GetComponentInChildren<TextMeshProUGUI>();
            _streamingBuilder.Clear();
            if (_streamingText != null)
                _streamingText.text = "";
            ScrollToBottom();
        }

        /// <summary>
        /// Append a token to the current streaming message.
        /// </summary>
        public void AppendStreamToken(string token)
        {
            if (_streamingText == null) return;
            _streamingBuilder.Append(token);
            _streamingText.text = _streamingBuilder.ToString();
            ScrollToBottom();
        }

        /// <summary>
        /// Finalize the streaming message and parse suggested replies.
        /// </summary>
        public void EndStreamingMessage()
        {
            if (_streamingText != null)
            {
                string full = _streamingBuilder.ToString();
                string cleaned = StripSuggestedReplies(full, out var replies);
                _streamingText.text = cleaned;
                ShowSuggestedReplies(replies);
            }
            _streamingText = null;
            _streamingBuilder.Clear();
        }

        public void SetInputInteractable(bool interactable)
        {
            inputField.interactable = interactable;
            sendButton.interactable = interactable;
        }

        public void ClearMessages()
        {
            foreach (Transform child in messageContainer)
                Destroy(child.gameObject);
            ClearSuggestedReplies();
        }

        public void SetStatus(string text)
        {
            if (statusText != null)
                statusText.text = text;
        }

        private void HandleSend()
        {
            string text = inputField.text?.Trim();
            if (string.IsNullOrEmpty(text)) return;

            inputField.text = "";
            inputField.ActivateInputField();
            OnSendMessage?.Invoke(text);
        }

        private void ScrollToBottom()
        {
            Canvas.ForceUpdateCanvases();
            scrollRect.verticalNormalizedPosition = 0f;
        }

        // === SUGGESTED REPLIES ===
        private void ShowSuggestedReplies(List<string> replies)
        {
            ClearSuggestedReplies();
            if (suggestedRepliesContainer == null || suggestedReplyPrefab == null) return;
            if (replies == null || replies.Count == 0) return;

            foreach (var reply in replies)
            {
                var go = Instantiate(suggestedReplyPrefab, suggestedRepliesContainer);
                var tmp = go.GetComponentInChildren<TextMeshProUGUI>();
                if (tmp != null) tmp.text = reply;

                var btn = go.GetComponent<Button>();
                if (btn != null)
                {
                    string r = reply; // capture
                    btn.onClick.AddListener(() =>
                    {
                        inputField.text = r;
                        HandleSend();
                        OnSuggestedReplySelected?.Invoke(r);
                    });
                }
                _suggestedReplyButtons.Add(go);
            }
        }

        private void ClearSuggestedReplies()
        {
            foreach (var go in _suggestedReplyButtons)
                if (go != null) Destroy(go);
            _suggestedReplyButtons.Clear();
        }

        /// <summary>
        /// Strip [REPLIES: "x" | "y" | "z"] from text and extract the replies.
        /// </summary>
        private static string StripSuggestedReplies(string text, out List<string> replies)
        {
            replies = new List<string>();
            if (string.IsNullOrEmpty(text)) return text;

            var match = Regex.Match(text, @"\[REPLIES:\s*""([^""]+)""\s*\|\s*""([^""]+)""\s*\|\s*""([^""]+)""\s*\]",
                RegexOptions.IgnoreCase);

            if (match.Success)
            {
                replies.Add(match.Groups[1].Value.Trim());
                replies.Add(match.Groups[2].Value.Trim());
                replies.Add(match.Groups[3].Value.Trim());
                return text.Substring(0, match.Index).TrimEnd();
            }

            return text;
        }
    }
}
